import { useState } from "react";
import {
  X,
  Play,
  Pause,
  Loader,
  AlertCircle,
  Music,
  Video,
} from "lucide-react";
import type { Media } from "../lib/api";
import { formatDuration } from "../lib/utils";

interface QueuePanelProps {
  isOpen: boolean;
  onClose: () => void;
  queue: Media[];
  currentIndex: number;
  isPlaying: boolean;
  onTrackClick: (index: number) => void;
}

export default function QueuePanel({
  isOpen,
  onClose,
  queue,
  currentIndex,
  isPlaying,
  onTrackClick,
}: QueuePanelProps) {
  const [loadingTrack, setLoadingTrack] = useState<number | null>(null);

  const handleTrackClick = (index: number) => {
    setLoadingTrack(index);
    onTrackClick(index);
    // Loading state will be cleared when track actually starts playing
    setTimeout(() => setLoadingTrack(null), 1000);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[95]"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed inset-x-0 bottom-0 z-[96] max-h-[70vh] rounded-t-2xl overflow-hidden"
        style={{
          background: "var(--card-bg)",
          borderTop: "1px solid var(--card-border)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b sticky top-0 z-10"
          style={{
            borderColor: "var(--card-border)",
            background: "var(--card-bg)",
          }}
        >
          <div>
            <h3 className="theme-text-primary font-semibold text-lg">
              Play Queue
            </h3>
            <p className="theme-text-muted text-sm">
              {queue.length} track{queue.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full transition-colors theme-text-muted hover:theme-text-primary"
            style={{
              background: "transparent",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background =
                "var(--player-bar-button-hover)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
            title="Close queue"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Queue List */}
        <div className="overflow-y-auto max-h-[calc(70vh-70px)]">
          {queue.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 theme-text-muted">
              <Music className="w-12 h-12 mb-2 opacity-30" />
              <p>No tracks in queue</p>
            </div>
          ) : (
            <div>
              {queue.map((track, index) => {
                const isCurrent = index === currentIndex;
                const isLoading = loadingTrack === index;
                const hasError = track.status === "failed";

                return (
                  <div
                    key={track.id}
                    onClick={() => !isCurrent && handleTrackClick(index)}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                      !isCurrent ? "cursor-pointer" : "cursor-default"
                    }`}
                    style={{
                      background: isCurrent
                        ? "var(--player-bar-button-hover)"
                        : "transparent",
                    }}
                    onMouseEnter={(e) => {
                      if (!isCurrent) {
                        e.currentTarget.style.background =
                          "var(--player-bar-button-hover)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isCurrent) {
                        e.currentTarget.style.background = "transparent";
                      }
                    }}
                  >
                    {/* Status Icon */}
                    <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                      {hasError ? (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      ) : isLoading ? (
                        <Loader className="w-5 h-5 theme-text-primary animate-spin" />
                      ) : isCurrent && isPlaying ? (
                        <Play
                          className="w-5 h-5"
                          style={{ color: "var(--btn-primary-bg)" }}
                          fill="currentColor"
                        />
                      ) : isCurrent && !isPlaying ? (
                        <Pause
                          className="w-5 h-5"
                          style={{ color: "var(--btn-primary-bg)" }}
                          fill="currentColor"
                        />
                      ) : (
                        <span className="theme-text-muted text-sm font-medium">
                          {index + 1}
                        </span>
                      )}
                    </div>

                    {/* Thumbnail */}
                    {track.thumbnail_path && (
                      <img
                        src={`${track.thumbnail_path}?t=${Date.now()}`}
                        alt={track.filename}
                        className="w-12 h-12 rounded object-cover flex-shrink-0"
                      />
                    )}

                    {/* Track Info */}
                    <div className="flex-1 min-w-0">
                      <h4
                        className={`font-medium text-sm truncate ${
                          isCurrent
                            ? "theme-text-primary"
                            : hasError
                              ? "text-red-500"
                              : "theme-text-secondary"
                        }`}
                      >
                        {track.filename}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        {track.media_type === "video" ? (
                          <Video className="w-3 h-3 theme-text-muted" />
                        ) : (
                          <Music className="w-3 h-3 theme-text-muted" />
                        )}
                        <span className="theme-text-muted text-xs">
                          {formatDuration(track.duration || 0)}
                        </span>
                        {hasError && (
                          <span className="text-red-500 text-xs">
                            • Failed to load
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Current Indicator */}
                    {isCurrent && (
                      <div
                        className="w-1 h-8 rounded-full flex-shrink-0"
                        style={{ background: "var(--btn-primary-bg)" }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
