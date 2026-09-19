import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { mediaApi, Media } from "../lib/api";
import VideoPlayer from "../components/VideoPlayer";
import { ArrowLeft } from "lucide-react";
import { formatFileSize, formatDuration } from "../lib/utils";
import DownloadButton from "../components/DownloadButton";

export default function Player() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [media, setMedia] = useState<Media | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionId] = useState(() => Math.random().toString(36).substring(7));

  useEffect(() => {
    if (id) {
      loadMedia();
    }
  }, [id]);

  // The download file is generated in the background after upload (and
  // backfilled for older items); poll until it exists so the button appears
  // without a manual reload
  const downloadPending =
    !!media &&
    media.status === "ready" &&
    !media.download &&
    media.download_status !== "failed";

  useEffect(() => {
    if (!id || !downloadPending) return;
    const timer = setInterval(async () => {
      try {
        const response = await mediaApi.getMediaById(id);
        setMedia(response.data);
      } catch {
        // keep polling; transient errors are not worth surfacing here
      }
    }, 10000);
    return () => clearInterval(timer);
  }, [id, downloadPending]);

  const loadMedia = async () => {
    try {
      const response = await mediaApi.getMediaById(id!);
      setMedia(response.data);
    } catch (error) {
      console.error("Failed to load media:", error);
    } finally {
      setLoading(false);
    }
  };

  const trackEvent = async (eventType: string, data?: any) => {
    try {
      await mediaApi.trackAnalytics(id!, eventType, sessionId, data);
    } catch (error) {
      console.error("Failed to track event:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100dvh-4rem)]">
        <div className="theme-text-primary text-xl">Loading player...</div>
      </div>
    );
  }

  if (!media) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100dvh-4rem)]">
        <div className="theme-text-primary text-xl">Media not found</div>
      </div>
    );
  }

  // Use master playlist for adaptive bitrate streaming
  // Master playlist allows Video.js to automatically switch quality variants
  const playerSrc = `/media/hls/${media.id}/master.m3u8`;

  return (
    <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 lg:py-8 max-w-4xl">
      {/* Back button */}
      <button
        onClick={() => navigate("/")}
        className="mb-4 sm:mb-6 flex items-center space-x-2 theme-text-secondary hover:theme-text-primary transition-colors min-h-[44px] -ml-2 px-2"
        aria-label="Go back"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back</span>
      </button>

      <div className="mb-4 sm:mb-6">
        <VideoPlayer
          src={playerSrc}
          poster={media.thumbnail_path ? media.thumbnail_path : undefined}
          onPlay={() => trackEvent("play")}
          onPause={() => trackEvent("pause")}
          onEnded={() => trackEvent("complete")}
          onTimeUpdate={(time) => {
            // Track progress milestones
            if (media.duration) {
              const progress = (time / media.duration) * 100;
              if (progress > 25 && progress < 26) trackEvent("progress_25");
              if (progress > 50 && progress < 51) trackEvent("progress_50");
              if (progress > 75 && progress < 76) trackEvent("progress_75");
            }
          }}
        />
      </div>

      {/* Media info */}
      <div className="theme-card rounded-lg sm:rounded-xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3 sm:mb-4">
          <h1 className="text-2xl font-bold theme-text-primary break-words min-w-0">
            {media.filename}
          </h1>
          {media.status === "ready" && (
            <DownloadButton
              media={media}
              variant="primary"
              className="theme-btn-primary px-4 py-2 rounded-lg text-base sm:text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors min-h-[44px] sm:min-h-[40px] w-full sm:w-auto sm:flex-shrink-0"
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 text-caption sm:text-sm">
          <div>
            <p className="theme-text-muted">Type</p>
            <p className="theme-text-primary font-medium capitalize">
              {media.media_type}
            </p>
          </div>
          {media.duration && (
            <div>
              <p className="theme-text-muted">Duration</p>
              <p className="theme-text-primary font-medium">
                {formatDuration(media.duration)}
              </p>
            </div>
          )}
          {media.file_size && (
            <div>
              <p className="theme-text-muted">Size</p>
              <p className="theme-text-primary font-medium">
                {formatFileSize(media.file_size)}
              </p>
            </div>
          )}
          {media.width && media.height && (
            <div>
              <p className="theme-text-muted">Resolution</p>
              <p className="theme-text-primary font-medium">
                {media.width}x{media.height}
              </p>
            </div>
          )}
        </div>

        {/* Available qualities */}
        {media.variants.length > 0 && (
          <div className="mt-4 sm:mt-6">
            <p className="theme-text-muted text-caption sm:text-sm mb-2">
              Available Qualities:
            </p>
            <div className="flex flex-wrap gap-2">
              {media.variants.map((variant) => (
                <span
                  key={variant.quality}
                  className="px-2 sm:px-3 py-1 rounded-full text-caption sm:text-sm"
                  style={{
                    background:
                      "color-mix(in srgb, var(--accent-primary) 15%, transparent)",
                    color: "var(--accent-primary)",
                    border:
                      "1px solid color-mix(in srgb, var(--accent-primary) 40%, transparent)",
                  }}
                >
                  {variant.quality}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {media.tags && media.tags.length > 0 && (
          <div className="mt-4 sm:mt-6">
            <p className="theme-text-muted text-caption sm:text-sm mb-2">
              Tags:
            </p>
            <div className="flex flex-wrap gap-2">
              {media.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="theme-button px-2 sm:px-3 py-1 rounded-full text-caption sm:text-sm min-h-[32px] inline-flex items-center"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
