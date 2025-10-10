import {
  createContext,
  useContext,
  ReactNode,
  useCallback,
  useRef,
  useEffect,
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

interface PlayerContextType {
  // State
  currentMedia: Media | null;
  sessionId: string;
  isPlaying: boolean;
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

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [state, send] = useMachine(queueMachine);
  const playerRef = useRef<DualVideoPlayerRef>(null);
  const { requestWakeLock, releaseWakeLock } = useWakeLock();

  // Extract state
  const { currentMedia, sessionId, playbackState, queue, currentIndex } =
    state.context;
  const { isPlaying, currentTime, duration, volume } = playbackState;

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

  // Actions
  const openPlayer = useCallback(
    (mediaId: string, queueItems?: Media[]) => {
      requestWakeLock();
      send({ type: "LOAD_TRACK", mediaId, queueItems });
    },
    [send, requestWakeLock],
  );

  const closePlayer = useCallback(() => {
    releaseWakeLock();
    preloadService.stop();
    send({ type: "CLOSE" });
  }, [send, releaseWakeLock]);

  const togglePlayPause = useCallback(() => {
    const player = playerRef.current?.getPlayer();
    if (player) {
      if (player.paused()) {
        requestWakeLock();
        player.play();
        send({ type: "PLAY" });
      } else {
        player.pause();
        send({ type: "PAUSE" });
      }
    }
  }, [send, requestWakeLock]);

  const seek = useCallback(
    (time: number) => {
      playerRef.current?.seek(time);
      send({ type: "SEEK", time });
    },
    [send],
  );

  const setVolume = useCallback(
    (vol: number) => {
      playerRef.current?.setVolume(vol);
      send({ type: "SET_VOLUME", volume: vol });
    },
    [send],
  );

  const playNext = useCallback(() => {
    requestWakeLock();

    // Check if we have a preloaded next track
    if (state.context.nextTrackPreloaded && playerRef.current) {
      playerRef.current.swapToPreloaded();
    }

    send({ type: "NEXT" });
  }, [send, requestWakeLock, state.context.nextTrackPreloaded]);

  const playPrevious = useCallback(() => {
    requestWakeLock();
    send({ type: "PREVIOUS" });
  }, [send, requestWakeLock]);

  const jumpToTrack = useCallback(
    (index: number) => {
      if (index < 0 || index >= queue.length) {
        return;
      }

      const track = queue[index];
      requestWakeLock();
      send({ type: "LOAD_TRACK", mediaId: track.id, queueItems: queue });
    },
    [queue, send, requestWakeLock],
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
