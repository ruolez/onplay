import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useRef,
} from "react";
import { mediaApi, type Media } from "../lib/api";
import type { VideoPlayerRef } from "../components/VideoPlayer";

interface PlayerContextType {
  currentMedia: Media | null;
  sessionId: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  openPlayer: (mediaId: string, queueItems?: Media[]) => Promise<void>;
  closePlayer: () => void;
  togglePlayPause: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  playNext: () => Promise<void>;
  playPrevious: () => Promise<void>;
  hasNext: boolean;
  hasPrevious: boolean;
  queuePosition?: { current: number; total: number };
  playerRef: React.RefObject<VideoPlayerRef>;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  requestFullscreen: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentMedia, setCurrentMedia] = useState<Media | null>(null);
  const [sessionId, setSessionId] = useState("");
  const [queue, setQueue] = useState<Media[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const playerRef = useRef<VideoPlayerRef>(null);

  const openPlayer = useCallback(
    async (mediaId: string, queueItems?: Media[]) => {
      try {
        // Store queue and find current position
        if (queueItems && queueItems.length > 0) {
          const index = queueItems.findIndex((item) => item.id === mediaId);
          setQueue(queueItems);
          setCurrentIndex(index >= 0 ? index : 0);
        } else {
          setQueue([]);
          setCurrentIndex(-1);
        }

        // Fetch full media details including variants
        const response = await mediaApi.getMediaById(mediaId);
        setCurrentMedia(response.data);
        setSessionId(Math.random().toString(36).substring(7));
        setCurrentTime(0);
        setDuration(0);
      } catch (error) {
        console.error("Failed to load media:", error);
      }
    },
    [],
  );

  const playNext = useCallback(async () => {
    if (currentIndex < queue.length - 1) {
      const nextItem = queue[currentIndex + 1];
      try {
        const response = await mediaApi.getMediaById(nextItem.id);
        setCurrentMedia(response.data);
        setSessionId(Math.random().toString(36).substring(7));
        setCurrentIndex((prev) => prev + 1);
        setCurrentTime(0);
        setDuration(0);
      } catch (error) {
        console.error("Failed to load next media:", error);
      }
    }
  }, [currentIndex, queue]);

  const playPrevious = useCallback(async () => {
    if (currentIndex > 0) {
      const prevItem = queue[currentIndex - 1];
      try {
        const response = await mediaApi.getMediaById(prevItem.id);
        setCurrentMedia(response.data);
        setSessionId(Math.random().toString(36).substring(7));
        setCurrentIndex((prev) => prev - 1);
        setCurrentTime(0);
        setDuration(0);
      } catch (error) {
        console.error("Failed to load previous media:", error);
      }
    }
  }, [currentIndex, queue]);

  const closePlayer = useCallback(() => {
    setCurrentMedia(null);
    setQueue([]);
    setCurrentIndex(-1);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  const togglePlayPause = useCallback(() => {
    const player = playerRef.current?.getPlayer();
    if (player) {
      if (player.paused()) {
        player.play();
      } else {
        player.pause();
      }
    }
  }, []);

  const seek = useCallback((time: number) => {
    const player = playerRef.current?.getPlayer();
    if (player) {
      player.currentTime(time);
      setCurrentTime(time);
    }
  }, []);

  const setVolume = useCallback((vol: number) => {
    const player = playerRef.current?.getPlayer();
    if (player) {
      player.volume(vol);
      setVolumeState(vol);
    }
  }, []);

  const requestFullscreen = useCallback(() => {
    const player = playerRef.current?.getPlayer();
    if (player) {
      player.requestFullscreen().catch((err) => {
        console.log("Fullscreen request:", err);
      });
    }
  }, []);

  const hasNext = currentIndex >= 0 && currentIndex < queue.length - 1;
  const hasPrevious = currentIndex > 0;
  const queuePosition =
    queue.length > 0
      ? { current: currentIndex + 1, total: queue.length }
      : undefined;

  return (
    <PlayerContext.Provider
      value={{
        currentMedia,
        sessionId,
        isPlaying,
        currentTime,
        duration,
        volume,
        openPlayer,
        closePlayer,
        togglePlayPause,
        seek,
        setVolume,
        playNext,
        playPrevious,
        hasNext,
        hasPrevious,
        queuePosition,
        playerRef,
        setIsPlaying,
        setCurrentTime,
        setDuration,
        requestFullscreen,
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
