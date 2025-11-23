import {
  createContext,
  useContext,
  ReactNode,
  useCallback,
  useRef,
  useEffect,
  useState,
} from "react";
import { useMachine } from "@xstate/react";
import { queueMachine } from "../machines/queueMachine";
import type { Media } from "../lib/api";
import type { DualVideoPlayerRef } from "../components/DualVideoPlayer";
import { useWakeLock } from "../hooks/useWakeLock";
import { preloadService } from "../services/PreloadService";
import {
  useMediaSession,
  updateMediaSessionPosition,
} from "../hooks/useMediaSession";
import { useGallery } from "./GalleryContext";

interface PlayerContextType {
  // State
  currentMedia: Media | null;
  sessionId: string;
  isPlaying: boolean;
  isBuffering: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  queue: Media[];
  currentIndex: number;
  hasNext: boolean;
  hasPrevious: boolean;
  queuePosition?: { current: number; total: number };
  machineState: string;
  errorMessage?: string;

  // Wake Lock
  isWakeLockEnabled: boolean;
  setWakeLockEnabled: (enabled: boolean) => void;

  // Actions
  openPlayer: (mediaId: string, queueItems?: Media[]) => void;
  closePlayer: () => void;
  togglePlayPause: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  playNext: () => void;
  playPrevious: () => void;
  jumpToTrack: (index: number) => void;
  requestFullscreen: () => void;

  // Refs
  playerRef: React.RefObject<DualVideoPlayerRef>;

  // Internal state setters (for VideoPlayer callbacks)
  handlePlaybackStarted: () => void;
  handlePlaybackPaused: () => void;
  handlePlaybackEnded: () => void;
  handleTimeUpdate: (time: number) => void;
  handleDurationChange: (duration: number) => void;
  handleBufferStart: () => void;
  handleBufferEnd: () => void;
  handleError: (message: string) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

// Persisted state type for localStorage
interface PlayerPersistedState {
  mediaId: string;
  currentTime: number;
  volume: number;
  wasPlaying: boolean;
  savedAt: number;
}

const PLAYER_STATE_KEY = "player-state";
const MAX_STATE_AGE_MS = 60 * 60 * 1000; // 1 hour

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [state, send] = useMachine(queueMachine);
  const playerRef = useRef<DualVideoPlayerRef>(null);
  const { requestWakeLock, releaseWakeLock } = useWakeLock();
  const { sortedMedia } = useGallery();

  // Wake Lock toggle state (persisted to localStorage)
  const [isWakeLockEnabled, setIsWakeLockEnabledState] = useState<boolean>(
    () => {
      const saved = localStorage.getItem("player-wake-lock");
      return saved !== null ? saved === "true" : true; // Default: enabled
    },
  );

  // Persist wake lock preference
  useEffect(() => {
    localStorage.setItem("player-wake-lock", String(isWakeLockEnabled));
  }, [isWakeLockEnabled]);

  // Track pending restore state (for seeking after track loads)
  const pendingRestoreRef = useRef<{
    currentTime: number;
    wasPlaying: boolean;
  } | null>(null);

  // Wrapper to conditionally request wake lock
  const conditionalRequestWakeLock = useCallback(() => {
    if (isWakeLockEnabled) {
      requestWakeLock();
    }
  }, [isWakeLockEnabled, requestWakeLock]);

  // Public setter that also releases wake lock when disabled
  const setWakeLockEnabled = useCallback(
    (enabled: boolean) => {
      setIsWakeLockEnabledState(enabled);

      if (!enabled) {
        // Immediately release wake lock when user disables
        releaseWakeLock();
      } else {
        // Request wake lock when user enables (if media is playing)
        const player = playerRef.current?.getPlayer();
        if (player && !player.paused()) {
          requestWakeLock();
        }
      }
    },
    [releaseWakeLock, requestWakeLock],
  );

  // Extract state
  const { currentMedia, sessionId, playbackState, queue, currentIndex } =
    state.context;
  const { isPlaying, currentTime, duration, volume } = playbackState;
  const isBuffering = state.matches("buffering");

  // Computed values
  const hasNext = currentIndex >= 0 && currentIndex < queue.length - 1;
  const hasPrevious = currentIndex > 0;
  const queuePosition =
    queue.length > 0
      ? { current: currentIndex + 1, total: queue.length }
      : undefined;

  // Machine state for debugging
  const machineState = state.value as string;
  const errorMessage = state.context.errorMessage;

  // Save player state to localStorage
  const savePlayerState = useCallback(() => {
    if (!currentMedia) return;

    const stateToSave: PlayerPersistedState = {
      mediaId: currentMedia.id,
      currentTime,
      volume,
      wasPlaying: isPlaying,
      savedAt: Date.now(),
    };

    localStorage.setItem(PLAYER_STATE_KEY, JSON.stringify(stateToSave));
    console.log(
      "[PlayerContext] 💾 Saved player state:",
      stateToSave.mediaId,
      "at",
      Math.round(stateToSave.currentTime) + "s",
    );
  }, [currentMedia, currentTime, volume, isPlaying]);

  // Restore player state on mount (only if idle)
  useEffect(() => {
    // Only restore if player is idle
    if (machineState !== "idle") return;

    const saved = localStorage.getItem(PLAYER_STATE_KEY);
    if (!saved) return;

    try {
      const savedState: PlayerPersistedState = JSON.parse(saved);

      // Validate staleness
      if (Date.now() - savedState.savedAt > MAX_STATE_AGE_MS) {
        console.log("[PlayerContext] ⏰ Saved state too old, discarding");
        localStorage.removeItem(PLAYER_STATE_KEY);
        return;
      }

      console.log(
        "[PlayerContext] 🔄 Restoring player state:",
        savedState.mediaId,
        "at",
        Math.round(savedState.currentTime) + "s",
      );

      // Store pending restore info for seeking after track loads
      pendingRestoreRef.current = {
        currentTime: savedState.currentTime,
        wasPlaying: savedState.wasPlaying,
      };

      // Send restore event to state machine
      send({
        type: "RESTORE_STATE",
        mediaId: savedState.mediaId,
        currentTime: savedState.currentTime,
        volume: savedState.volume,
        wasPlaying: savedState.wasPlaying,
      });
    } catch {
      console.error("[PlayerContext] Failed to parse saved state, clearing");
      localStorage.removeItem(PLAYER_STATE_KEY);
    }
  }, []); // Only on mount

  // Seek to saved position after track loads (for restore)
  useEffect(() => {
    if (machineState !== "ready" || !pendingRestoreRef.current) return;

    const { currentTime: savedTime, wasPlaying } = pendingRestoreRef.current;
    pendingRestoreRef.current = null;

    console.log(
      "[PlayerContext] 🎯 Seeking to restored position:",
      Math.round(savedTime) + "s",
    );

    // Small delay to ensure player is ready
    setTimeout(() => {
      playerRef.current?.seek(savedTime);
      send({ type: "SEEK", time: savedTime });

      // Don't auto-resume - let user manually play
      // This is safer UX (user might not want audio suddenly playing)
      console.log("[PlayerContext] ✅ State restored. wasPlaying:", wasPlaying);
    }, 100);
  }, [machineState, send]);

  // Save state on visibility change (tab hidden)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && currentMedia) {
        savePlayerState();
      }
    };

    // Also save on freeze event (Chrome)
    const handleFreeze = () => {
      if (currentMedia) {
        savePlayerState();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("freeze", handleFreeze);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("freeze", handleFreeze);
    };
  }, [currentMedia, savePlayerState]);

  // Debounced save during playback (every 10 seconds)
  useEffect(() => {
    if (!isPlaying || !currentMedia) return;

    const interval = setInterval(() => {
      savePlayerState();
    }, 10000);

    return () => clearInterval(interval);
  }, [isPlaying, currentMedia, savePlayerState]);

  // Auto-play when transitioning to ready state (for auto-advance)
  const prevStateRef = useRef<string>(machineState);
  useEffect(() => {
    const prevState = prevStateRef.current;
    const currentState = machineState;

    // If we just transitioned from loading to ready, ensure playback state is synced
    if (prevState === "loading" && currentState === "ready") {
      const player = playerRef.current?.getPlayer();
      if (player) {
        // Note: Unmuting is handled by DualVideoPlayer's "playing" event listener
        // to comply with Chrome's autoplay policy (must wait for playback to start)

        if (player.paused()) {
          // Player is paused, need to start playback
          console.log("[PlayerContext] 🎵 Auto-playing next track (paused)");
          player
            .play()
            ?.then(() => {
              console.log(
                "[PlayerContext] ✅ Auto-play successful, sending PLAY event",
              );
              send({ type: "PLAY" });
            })
            .catch((err) => {
              console.error("[PlayerContext] Failed to auto-play:", err);
            });
        } else {
          // Player is already playing (DualVideoPlayer auto-played it)
          // Just sync the state machine
          console.log(
            "[PlayerContext] ✅ Player already playing, syncing state machine",
          );
          send({ type: "PLAY" });
        }
      }
    }

    prevStateRef.current = currentState;
  }, [machineState, send]);

  // Handle preload completion
  const handlePreloadComplete = useCallback(
    (media: Media) => {
      send({ type: "NEXT_PRELOADED", media });
    },
    [send],
  );

  // Start preload service when playing
  useEffect(() => {
    if (String(state.value) === "playing" && queue.length > 0 && hasNext) {
      preloadService.start(
        queue,
        currentIndex,
        playerRef,
        handlePreloadComplete,
      );
    } else {
      preloadService.stop();
    }

    return () => {
      preloadService.stop();
    };
  }, [state.value, queue, currentIndex, hasNext, handlePreloadComplete]);

  // Media Session API integration
  useMediaSession(currentMedia, hasNext, hasPrevious, {
    onPlay: () => {
      const player = playerRef.current?.getPlayer();
      if (player) {
        player.muted(false);
        player.volume(1);
      }
      send({ type: "PLAY" });
      playerRef.current?.play();
    },
    onPause: () => {
      send({ type: "PAUSE" });
      playerRef.current?.pause();
    },
    onNext: () => {
      send({ type: "NEXT" });
    },
    onPrevious: () => {
      send({ type: "PREVIOUS" });
    },
    onSeekBackward: (offset) => {
      const newTime = Math.max(0, currentTime - offset);
      playerRef.current?.seek(newTime);
      send({ type: "SEEK", time: newTime });
    },
    onSeekForward: (offset) => {
      const newTime = Math.min(duration, currentTime + offset);
      playerRef.current?.seek(newTime);
      send({ type: "SEEK", time: newTime });
    },
    onSeekTo: (time) => {
      playerRef.current?.seek(time);
      send({ type: "SEEK", time });
    },
  });

  // Update Media Session position
  useEffect(() => {
    updateMediaSessionPosition(currentTime, duration);
  }, [currentTime, duration]);

  // Subscribe to Gallery state changes (live queue updates)
  useEffect(() => {
    // Only update queue if player is open
    if (!currentMedia) {
      console.log("[PlayerContext] Skipping queue update - no media playing");
      return;
    }

    // Only update if we have media in sortedMedia
    if (sortedMedia.length === 0) {
      console.log(
        "[PlayerContext] Skipping queue update - sortedMedia is empty",
      );
      return;
    }

    console.log("[PlayerContext] 🔄 Gallery state changed, updating queue");
    console.log("[PlayerContext] Current media:", currentMedia.filename);
    console.log("[PlayerContext] Current queue size:", queue.length);
    console.log("[PlayerContext] New sortedMedia size:", sortedMedia.length);
    console.log("[PlayerContext] Current index:", currentIndex);

    // Send UPDATE_QUEUE event to state machine
    send({ type: "UPDATE_QUEUE", queueItems: sortedMedia });

    console.log("[PlayerContext] ✅ UPDATE_QUEUE event sent");
  }, [sortedMedia, currentMedia, send]);

  // Actions
  const openPlayer = useCallback(
    (mediaId: string, queueItems?: Media[]) => {
      conditionalRequestWakeLock();
      send({ type: "LOAD_TRACK", mediaId, queueItems });
    },
    [send, conditionalRequestWakeLock],
  );

  const closePlayer = useCallback(() => {
    // Clear saved state when user manually closes
    localStorage.removeItem(PLAYER_STATE_KEY);
    releaseWakeLock();
    preloadService.stop();
    send({ type: "CLOSE" });
  }, [send, releaseWakeLock]);

  const togglePlayPause = useCallback(() => {
    const player = playerRef.current?.getPlayer();
    if (player) {
      if (player.paused()) {
        conditionalRequestWakeLock();
        // Ensure unmuted when user manually plays
        player.muted(false);
        player.volume(1);
        player.play();
        send({ type: "PLAY" });
      } else {
        player.pause();
        send({ type: "PAUSE" });
        // Save state when user pauses
        savePlayerState();
      }
    }
  }, [send, conditionalRequestWakeLock, savePlayerState]);

  const seek = useCallback(
    (time: number) => {
      playerRef.current?.seek(time);
      send({ type: "SEEK", time });
      // Save state after seek (position changed)
      setTimeout(() => savePlayerState(), 100);
    },
    [send, savePlayerState],
  );

  const setVolume = useCallback(
    (vol: number) => {
      playerRef.current?.setVolume(vol);
      send({ type: "SET_VOLUME", volume: vol });
    },
    [send],
  );

  const playNext = useCallback(() => {
    conditionalRequestWakeLock();

    // Check if we have a preloaded next track
    if (state.context.nextTrackPreloaded && playerRef.current) {
      playerRef.current.swapToPreloaded();
    }

    // Ensure next track is unmuted
    const player = playerRef.current?.getPlayer();
    if (player) {
      player.muted(false);
      player.volume(1);
    }

    send({ type: "NEXT" });
  }, [send, conditionalRequestWakeLock, state.context.nextTrackPreloaded]);

  const playPrevious = useCallback(() => {
    conditionalRequestWakeLock();

    // Ensure previous track is unmuted
    const player = playerRef.current?.getPlayer();
    if (player) {
      player.muted(false);
      player.volume(1);
    }

    send({ type: "PREVIOUS" });
  }, [send, conditionalRequestWakeLock]);

  const jumpToTrack = useCallback(
    (index: number) => {
      if (index < 0 || index >= queue.length) {
        return;
      }

      const track = queue[index];
      conditionalRequestWakeLock();

      // Ensure jumped track is unmuted
      const player = playerRef.current?.getPlayer();
      if (player) {
        player.muted(false);
        player.volume(1);
      }

      send({ type: "LOAD_TRACK", mediaId: track.id, queueItems: queue });
    },
    [queue, send, conditionalRequestWakeLock],
  );

  const requestFullscreen = useCallback(() => {
    const player = playerRef.current?.getPlayer();
    if (player) {
      player.requestFullscreen().catch(() => {});
    }
  }, []);

  // VideoPlayer event handlers
  const handlePlaybackStarted = useCallback(() => {
    send({ type: "PLAYBACK_STARTED" });
  }, [send]);

  const handlePlaybackPaused = useCallback(() => {
    send({ type: "PLAYBACK_PAUSED" });
  }, [send]);

  const handlePlaybackEnded = useCallback(() => {
    send({ type: "PLAYBACK_ENDED" });
  }, [send]);

  const handleTimeUpdate = useCallback(
    (time: number) => {
      send({ type: "UPDATE_TIME", time });
    },
    [send],
  );

  const handleDurationChange = useCallback(
    (dur: number) => {
      send({ type: "UPDATE_DURATION", duration: dur });
    },
    [send],
  );

  const handleBufferStart = useCallback(() => {
    send({ type: "BUFFER_START" });
  }, [send]);

  const handleBufferEnd = useCallback(() => {
    send({ type: "BUFFER_END" });
  }, [send]);

  const handleError = useCallback(
    (message: string) => {
      console.error("[PlayerContext] Error:", message);
      send({ type: "ERROR", message });
    },
    [send],
  );

  return (
    <PlayerContext.Provider
      value={{
        currentMedia,
        sessionId,
        isPlaying,
        isBuffering,
        currentTime,
        duration,
        volume,
        queue,
        currentIndex,
        hasNext,
        hasPrevious,
        queuePosition,
        machineState,
        errorMessage,
        isWakeLockEnabled,
        setWakeLockEnabled,
        openPlayer,
        closePlayer,
        togglePlayPause,
        seek,
        setVolume,
        playNext,
        playPrevious,
        jumpToTrack,
        requestFullscreen,
        playerRef,
        handlePlaybackStarted,
        handlePlaybackPaused,
        handlePlaybackEnded,
        handleTimeUpdate,
        handleDurationChange,
        handleBufferStart,
        handleBufferEnd,
        handleError,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return context;
}
