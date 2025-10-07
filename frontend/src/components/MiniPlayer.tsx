import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePlayer } from "../contexts/PlayerContext";
import VideoPlayer, { VideoPlayerRef } from "./VideoPlayer";
import { mediaApi } from "../lib/api";
import { X, ExternalLink, Clock, HardDrive } from "lucide-react";
import { formatDuration, formatFileSize } from "../lib/utils";

export default function MiniPlayer() {
  const { currentMedia, isModalOpen, sessionId, closePlayer } = usePlayer();
  const navigate = useNavigate();
  const playerRef = useRef<VideoPlayerRef>(null);
  const [thumbnailTimestamp] = useState(Date.now());

  useEffect(() => {
    if (isModalOpen) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isModalOpen]);

  const trackEvent = async (eventType: string, data?: any) => {
    if (!currentMedia) return;

    try {
      await mediaApi.trackAnalytics(
        currentMedia.id,
        eventType,
        sessionId,
        data,
      );
    } catch (error) {
      console.error("Failed to track event:", error);
    }
  };

  const handleViewDetails = () => {
    if (!currentMedia) return;
    closePlayer();
    navigate(`/player/${currentMedia.id}`);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closePlayer();
    }
  };

  if (!isModalOpen || !currentMedia) return null;

  const bestVariant = currentMedia.variants
    ? currentMedia.variants.sort((a, b) => b.bitrate - a.bitrate)[0]
    : null;
  const playerSrc = bestVariant ? bestVariant.path : "";

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
      onClick={handleBackdropClick}
    >
      <div className="theme-card rounded-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10">
          <h2 className="text-lg sm:text-xl font-bold theme-text-primary truncate flex-1 pr-4">
            {currentMedia.filename}
          </h2>
          <button
            onClick={closePlayer}
            className="theme-text-muted hover:theme-text-primary min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Player */}
        <div className="p-4 sm:p-6">
          <VideoPlayer
            ref={playerRef}
            src={playerSrc}
            poster={
              currentMedia.thumbnail_path
                ? `${currentMedia.thumbnail_path}?t=${thumbnailTimestamp}`
                : undefined
            }
            autoplay={true}
            onPlay={() => trackEvent("play")}
            onPause={() => trackEvent("pause")}
            onEnded={() => trackEvent("complete")}
            onTimeUpdate={(time) => {
              if (currentMedia.duration) {
                const progress = (time / currentMedia.duration) * 100;
                if (progress > 25 && progress < 26) trackEvent("progress_25");
                if (progress > 50 && progress < 51) trackEvent("progress_50");
                if (progress > 75 && progress < 76) trackEvent("progress_75");
              }
            }}
          />
        </div>

        {/* Info and Actions */}
        <div className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4">
          {/* Media Info */}
          <div className="flex flex-wrap gap-4 text-sm theme-text-muted">
            <div className="flex items-center space-x-2">
              <span className="theme-text-secondary">Type:</span>
              <span className="theme-text-primary capitalize font-medium">
                {currentMedia.media_type}
              </span>
            </div>
            {currentMedia.duration && (
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>{formatDuration(currentMedia.duration)}</span>
              </div>
            )}
            {currentMedia.file_size && (
              <div className="flex items-center space-x-2">
                <HardDrive className="w-4 h-4" />
                <span>{formatFileSize(currentMedia.file_size)}</span>
              </div>
            )}
            {currentMedia.width && currentMedia.height && (
              <div className="flex items-center space-x-2">
                <span className="theme-text-secondary">Resolution:</span>
                <span className="theme-text-primary font-medium">
                  {currentMedia.width}x{currentMedia.height}
                </span>
              </div>
            )}
          </div>

          {/* Tags */}
          {currentMedia.tags && currentMedia.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {currentMedia.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="px-2 py-1 bg-white/10 rounded text-xs theme-text-secondary"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          {/* View Details Button */}
          <button
            onClick={handleViewDetails}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 theme-btn-primary rounded-lg font-medium min-h-[48px]"
          >
            <ExternalLink className="w-5 h-5" />
            <span>View Full Details & Analytics</span>
          </button>
        </div>
      </div>
    </div>
  );
}
