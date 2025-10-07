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
  openPlayer: (mediaId: string) => Promise<void>;
  closePlayer: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentMedia, setCurrentMedia] = useState<Media | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sessionId, setSessionId] = useState("");

  const openPlayer = useCallback(async (mediaId: string) => {
    try {
      // Fetch full media details including variants
      const response = await mediaApi.getMediaById(mediaId);
      setCurrentMedia(response.data);
      setSessionId(Math.random().toString(36).substring(7));
      setIsModalOpen(true);
    } catch (error) {
      console.error("Failed to load media:", error);
    }
  }, []);

  const closePlayer = useCallback(() => {
    setIsModalOpen(false);
    // Delay clearing media to allow smooth animation
    setTimeout(() => {
      setCurrentMedia(null);
    }, 300);
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        currentMedia,
        isModalOpen,
        sessionId,
        openPlayer,
        closePlayer,
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
