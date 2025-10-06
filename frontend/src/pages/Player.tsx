import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { mediaApi, Media } from "../lib/api";
import VideoPlayer, { VideoPlayerRef } from "../components/VideoPlayer";
import { ArrowLeft, Eye, TrendingUp, Image } from "lucide-react";
import { formatFileSize, formatDuration } from "../lib/utils";

export default function Player() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [media, setMedia] = useState<Media | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sessionId] = useState(() => Math.random().toString(36).substring(7));
  const [thumbnailSaving, setThumbnailSaving] = useState(false);
  const [thumbnailTimestamp, setThumbnailTimestamp] = useState(Date.now());
  const playerRef = useRef<VideoPlayerRef>(null);

  useEffect(() => {
    if (id) {
      loadMedia();
      loadAnalytics();
    }
  }, [id]);

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

  const loadAnalytics = async () => {
    try {
      const response = await mediaApi.getMediaAnalytics(id!);
      setAnalytics(response.data);
    } catch (error) {
      console.error("Failed to load analytics:", error);
    }
  };

  const trackEvent = async (eventType: string, data?: any) => {
    try {
      await mediaApi.trackAnalytics(id!, eventType, sessionId, data);
    } catch (error) {
      console.error("Failed to track event:", error);
    }
  };

  const handleSetThumbnail = async () => {
    if (!playerRef.current || !id) return;

    const currentTime = playerRef.current.getCurrentTime();

    try {
      setThumbnailSaving(true);
      await mediaApi.setThumbnail(id, currentTime);

      // Update timestamp to force thumbnail reload (cache bust)
      setThumbnailTimestamp(Date.now());

      alert("Thumbnail updated successfully!");
    } catch (error) {
      console.error("Failed to set thumbnail:", error);
      alert("Failed to set thumbnail. Please try again.");
    } finally {
      setThumbnailSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-white text-xl">Loading player...</div>
      </div>
    );
  }

  if (!media) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-white text-xl">Media not found</div>
      </div>
    );
  }

  const bestVariant = media.variants.sort((a, b) => b.bitrate - a.bitrate)[0];
  const playerSrc = bestVariant ? bestVariant.path : "";

  return (
    <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 lg:py-8 max-w-7xl">
      {/* Back button */}
      <button
        onClick={() => navigate("/")}
        className="mb-4 sm:mb-6 flex items-center space-x-2 text-white/70 hover:text-white transition-colors min-h-[44px] -ml-2 px-2"
        aria-label="Go back"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {/* Player section */}
        <div className="lg:col-span-2">
          <div className="mb-4 sm:mb-6">
            <VideoPlayer
              ref={playerRef}
              src={playerSrc}
              poster={
                media.thumbnail_path
                  ? `${media.thumbnail_path}?t=${thumbnailTimestamp}`
                  : undefined
              }
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

          {/* Thumbnail capture button */}
          {media.media_type === "video" && (
            <div className="mb-4 sm:mb-6">
              <button
                onClick={handleSetThumbnail}
                disabled={thumbnailSaving}
                className="flex items-center justify-center space-x-2 px-4 py-3 theme-btn-secondary rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] w-full sm:w-auto text-sm sm:text-base"
              >
                <Image className="w-4 h-4" />
                <span>
                  {thumbnailSaving
                    ? "Saving..."
                    : "Set Current Frame as Thumbnail"}
                </span>
              </button>
              <p className="text-xs sm:text-sm theme-text-muted mt-2">
                Pause the video at your desired moment and click this button to
                set it as the thumbnail
              </p>
            </div>
          )}

          {/* Media info */}
          <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-4 sm:p-6 border border-white/10">
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4 break-words">
              {media.filename}
            </h1>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
              <div>
                <p className="text-white/60">Type</p>
                <p className="text-white font-medium capitalize">
                  {media.media_type}
                </p>
              </div>
              {media.duration && (
                <div>
                  <p className="text-white/60">Duration</p>
                  <p className="text-white font-medium">
                    {formatDuration(media.duration)}
                  </p>
                </div>
              )}
              {media.file_size && (
                <div>
                  <p className="text-white/60">Size</p>
                  <p className="text-white font-medium">
                    {formatFileSize(media.file_size)}
                  </p>
                </div>
              )}
              {media.width && media.height && (
                <div>
                  <p className="text-white/60">Resolution</p>
                  <p className="text-white font-medium">
                    {media.width}x{media.height}
                  </p>
                </div>
              )}
            </div>

            {/* Available qualities */}
            {media.variants.length > 0 && (
              <div className="mt-4 sm:mt-6">
                <p className="text-white/60 text-xs sm:text-sm mb-2">
                  Available Qualities:
                </p>
                <div className="flex flex-wrap gap-2">
                  {media.variants.map((variant) => (
                    <span
                      key={variant.quality}
                      className="px-2 sm:px-3 py-1 bg-purple-600/30 text-purple-200 rounded-full text-xs sm:text-sm border border-purple-500/50"
                    >
                      {variant.quality}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Analytics sidebar */}
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-4 sm:p-6 border border-white/10">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4 flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>Analytics</span>
            </h2>

            {analytics ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center space-x-2 text-white/60 mb-1">
                    <Eye className="w-4 h-4" />
                    <span className="text-sm">Total Views</span>
                  </div>
                  <p className="text-3xl font-bold text-white">
                    {analytics.total_plays}
                  </p>
                </div>

                <div>
                  <p className="text-white/60 text-sm mb-1">Completions</p>
                  <p className="text-3xl font-bold text-white">
                    {analytics.total_completes}
                  </p>
                </div>

                <div>
                  <p className="text-white/60 text-sm mb-1">Completion Rate</p>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-white/10 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${analytics.completion_rate}%` }}
                      />
                    </div>
                    <span className="text-white font-medium">
                      {analytics.completion_rate}%
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-white/60">No analytics data yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
