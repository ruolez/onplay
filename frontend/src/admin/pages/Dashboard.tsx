import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  CheckCircle,
  HardDrive,
  Library,
  Music,
  Play,
  UploadCloud,
  Video,
} from "lucide-react";
import { mediaApi, type Media } from "../../lib/api";
import { formatDate, formatFileSize } from "../../lib/utils";

export default function Dashboard() {
  const [overview, setOverview] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [recent, setRecent] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      mediaApi.getStatsOverview(),
      mediaApi.getAnalyticsOverview(7),
      mediaApi.getMedia(0, 5),
    ])
      .then(([overviewRes, analyticsRes, mediaRes]) => {
        if (cancelled) return;
        setOverview(overviewRes.data);
        setAnalytics(analyticsRes.data);
        setRecent(mediaRes.data.items);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const completionRate =
    analytics?.total_plays > 0
      ? Math.round((analytics.total_completes / analytics.total_plays) * 100)
      : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton-block h-8 w-48 rounded-lg" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton-block h-28 rounded-xl" />
          ))}
        </div>
        <div className="skeleton-block h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold theme-text-primary">Dashboard</h1>
        <div className="flex gap-2">
          <Link
            to="/admin/upload"
            className="theme-btn-primary px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
          >
            <UploadCloud className="w-4 h-4" />
            Upload
          </Link>
          <Link
            to="/admin/analytics"
            className="theme-btn-secondary px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Analytics
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="theme-stat-card-1 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="theme-text-secondary text-sm">Total media</p>
            <Library className="w-5 h-5 theme-icon-accent" />
          </div>
          <p className="text-3xl font-bold theme-text-primary">
            {overview?.total_media ?? 0}
          </p>
          <p className="text-xs theme-text-muted mt-1.5">
            {overview?.total_videos ?? 0} videos · {overview?.total_audio ?? 0}{" "}
            audio
          </p>
        </div>

        <div className="theme-stat-card-2 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="theme-text-secondary text-sm">Plays (7d)</p>
            <Play className="w-5 h-5 theme-icon-accent" />
          </div>
          <p className="text-3xl font-bold theme-text-primary">
            {analytics?.total_plays ?? 0}
          </p>
          <p className="text-xs theme-text-muted mt-1.5">
            {analytics?.total_completes ?? 0} completions
          </p>
        </div>

        <div className="theme-stat-card-3 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="theme-text-secondary text-sm">Completion (7d)</p>
            <CheckCircle className="w-5 h-5 theme-icon-accent" />
          </div>
          <p className="text-3xl font-bold theme-text-primary">
            {completionRate}%
          </p>
          <p className="text-xs theme-text-muted mt-1.5">of started plays</p>
        </div>

        <div className="theme-stat-card-4 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="theme-text-secondary text-sm">Storage</p>
            <HardDrive className="w-5 h-5 theme-icon-accent" />
          </div>
          <p className="text-3xl font-bold theme-text-primary">
            {formatFileSize(overview?.total_size_bytes ?? 0)}
          </p>
          <p className="text-xs theme-text-muted mt-1.5">all media files</p>
        </div>
      </div>

      {/* Recent uploads */}
      <div className="theme-card rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold theme-text-primary">Recent uploads</h2>
          <Link
            to="/admin/media"
            className="text-sm theme-text-secondary hover:theme-text-primary transition-colors"
          >
            View all →
          </Link>
        </div>
        {recent.length > 0 ? (
          <div className="space-y-2">
            {recent.map((media) => (
              <Link
                key={media.id}
                to="/admin/media"
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.04] transition-colors"
              >
                {media.thumbnail_path ? (
                  <img
                    src={media.thumbnail_path}
                    alt=""
                    className="w-14 h-9 rounded object-cover flex-shrink-0"
                  />
                ) : (
                  <div
                    className="w-14 h-9 rounded flex items-center justify-center flex-shrink-0"
                    style={{ background: "var(--card-bg-hover)" }}
                  >
                    {media.media_type === "video" ? (
                      <Video
                        className="w-4 h-4"
                        style={{ color: "var(--icon-video)" }}
                      />
                    ) : (
                      <Music
                        className="w-4 h-4"
                        style={{ color: "var(--icon-audio)" }}
                      />
                    )}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="theme-text-primary text-sm font-medium truncate">
                    {media.filename}
                  </p>
                  <p className="theme-text-muted text-xs capitalize">
                    {media.status} · {formatDate(media.created_at)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="theme-text-muted text-sm">No media uploaded yet.</p>
        )}
      </div>
    </div>
  );
}
