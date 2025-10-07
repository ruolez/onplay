import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { mediaApi, type Media } from "../lib/api";

interface PlayerContextType {
  currentMedia: Media | null;
  isModalOpen: boolean;
  sessionId: string;
  openPlayer: (mediaId: string, queueItems?: Media[]) => Promise<void>;
  closePlayer: () => void;
  playNext: () => Promise<void>;
  playPrevious: () => Promise<void>;
  hasNext: boolean;
  hasPrevious: boolean;
  queuePosition?: { current: number; total: number };
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentMedia, setCurrentMedia] = useState<Media | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [queue, setQueue] = useState<Media[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);

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
        setIsModalOpen(true);
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
      } catch (error) {
        console.error("Failed to load previous media:", error);
      }
    }
  }, [currentIndex, queue]);

  const closePlayer = useCallback(() => {
    setIsModalOpen(false);
    // Delay clearing media to allow smooth animation
    setTimeout(() => {
      setCurrentMedia(null);
      setQueue([]);
      setCurrentIndex(-1);
    }, 300);
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
        isModalOpen,
        sessionId,
        openPlayer,
        closePlayer,
        playNext,
        playPrevious,
        hasNext,
        hasPrevious,
        queuePosition,
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
