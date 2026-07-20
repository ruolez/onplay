import { useState, useEffect, useRef } from "react";
import { X, Loader, AlertCircle, Music, Video, Square } from "lucide-react";
import type { Media } from "../lib/api";
import { formatDuration } from "../lib/utils";
import EqualizerBars from "./EqualizerBars";

interface QueuePanelProps {
  isOpen: boolean;
  onClose: () => void;
  queue: Media[];
  currentIndex: number;
  isPlaying: boolean;
  onTrackClick: (index: number) => void;
  onClosePlayer?: () => void;
}

export default function QueuePanel({
  isOpen,
  onClose,
  queue,
  currentIndex,
  isPlaying,
  onTrackClick,
  onClosePlayer,
}: QueuePanelProps) {
  const [loadingTrack, setLoadingTrack] = useState<number | null>(null);
  const [dragY, setDragY] = useState(0);
  const dragStartY = useRef<number | null>(null);
  const currentRowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Bring the current track into view when the sheet opens
  useEffect(() => {
    if (isOpen) {
      currentRowRef.current?.scrollIntoView({ block: "center" });
    }
  }, [isOpen]);

  const handleTrackClick = (index: number) => {
    setLoadingTrack(index);
    onTrackClick(index);
    // Loading state will be cleared when track actually starts playing
    setTimeout(() => setLoadingTrack(null), 1000);
  };

  const handleDragStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
  };

  const handleDragMove = (e: React.TouchEvent) => {
    if (dragStartY.current === null) return;
    setDragY(Math.max(0, e.touches[0].clientY - dragStartY.current));
  };

  const handleDragEnd = () => {
    if (dragY > 80) onClose();
    dragStartY.current = null;
    setDragY(0);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110]"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Play queue"
        className="fixed inset-x-0 bottom-0 z-[111] max-h-[70vh] rounded-t-2xl overflow-hidden flex flex-col"
        style={{
          background: "var(--card-bg)",
          borderTop: "1px solid var(--card-border)",
          transform: dragY ? `translateY(${dragY}px)` : undefined,
          transition: dragY ? "none" : "transform 0.2s ease-out",
        }}
      >
        {/* Header (drag zone: swipe down to dismiss) */}
        <div
          className="flex-shrink-0 border-b touch-none"
          style={{
            borderColor: "var(--card-border)",
            background: "var(--card-bg)",
          }}
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-2.5">
            <div className="w-10 h-1 rounded-full bg-white/25" />
          </div>

          <div className="flex items-center justify-between px-4 pt-1.5 pb-3">
            <div>
              <h3 className="theme-text-primary font-semibold text-lg">
                Play Queue
              </h3>
              <p className="theme-text-muted text-sm">
                {queue.length} track{queue.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {onClosePlayer && (
                <button
                  onClick={onClosePlayer}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-full transition-colors theme-text-muted hover:theme-text-primary hover:bg-white/10 text-xs font-medium"
                  title="Stop and close player"
                  aria-label="Stop and close player"
                >
                  <Square className="w-3.5 h-3.5" fill="currentColor" />
                  Stop player
                </button>
              )}
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
                aria-label="Close queue"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Queue List */}
        <div
          className="overflow-y-auto flex-1"
          style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}
        >
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
                    ref={isCurrent ? currentRowRef : undefined}
                    onClick={() => !isCurrent && handleTrackClick(index)}
                    onKeyDown={(e) => {
                      if ((e.key === "Enter" || e.key === " ") && !isCurrent) {
                        e.preventDefault();
                        handleTrackClick(index);
                      }
                    }}
                    role="button"
                    tabIndex={isCurrent ? -1 : 0}
                    aria-label={`Play ${track.filename}`}
                    aria-current={isCurrent ? "true" : undefined}
                    className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
                      !isCurrent ? "cursor-pointer" : "cursor-default"
                    }`}
                    style={{
                      background: isCurrent
                        ? "color-mix(in srgb, var(--btn-primary-bg) 10%, transparent)"
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
                    {/* Thumbnail with status overlay */}
                    <div className="relative flex-shrink-0 w-12 h-12 rounded-md overflow-hidden">
                      {track.thumbnail_path ? (
                        <img
                          src={track.thumbnail_path}
                          alt=""
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{ background: "var(--card-bg)" }}
                        >
                          {track.media_type === "video" ? (
                            <Video className="w-5 h-5 theme-text-muted" />
                          ) : (
                            <Music className="w-5 h-5 theme-text-muted" />
                          )}
                        </div>
                      )}

                      {hasError ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/55">
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        </div>
                      ) : isLoading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/55">
                          <Loader className="w-5 h-5 text-white animate-spin" />
                        </div>
                      ) : isCurrent ? (
                        <div
                          className="absolute inset-0 flex items-center justify-center bg-black/55"
                          style={{ color: "var(--btn-primary-bg)" }}
                        >
                          <EqualizerBars
                            playing={isPlaying}
                            className="!w-4 !h-4"
                          />
                        </div>
                      ) : null}
                    </div>

                    {/* Track Info */}
                    <div className="flex-1 min-w-0">
                      <h4
                        className={`font-medium text-sm truncate ${
                          isCurrent
                            ? ""
                            : hasError
                              ? "text-red-500"
                              : "theme-text-secondary"
                        }`}
                        style={
                          isCurrent
                            ? { color: "var(--btn-primary-bg)" }
                            : undefined
                        }
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
