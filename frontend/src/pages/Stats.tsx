import { useEffect, useState } from "react";
import { mediaApi } from "../lib/api";
import {
  BarChart3,
  Play,
  CheckCircle,
  TrendingUp,
  HardDrive,
  Clock,
} from "lucide-react";
import { formatFileSize } from "../lib/utils";

export default function Stats() {
  const [overview, setOverview] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  useEffect(() => {
    loadData();
  }, [days]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [overviewRes, analyticsRes] = await Promise.all([
        mediaApi.getStatsOverview(),
        mediaApi.getAnalyticsOverview(days),
      ]);
      setOverview(overviewRes.data);
      setAnalytics(analyticsRes.data);
    } catch (error) {
      console.error("Failed to load stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="theme-text-primary text-xl">Loading statistics...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 xs:px-4 sm:px-6 py-6 sm:py-8 max-w-7xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold theme-text-primary flex items-center space-x-2 sm:space-x-3">
          <BarChart3 className="w-8 h-8 sm:w-10 sm:h-10" />
          <span>Statistics</span>
        </h1>

        <div className="flex space-x-2 w-full sm:w-auto">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg font-medium text-sm sm:text-base min-h-[44px] ${
                days === d ? "theme-btn-primary" : "theme-btn-secondary"
              }`}
            >
              {d} days
            </button>
          ))}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 xs:gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="theme-stat-card-1 rounded-lg sm:rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <p className="theme-text-secondary text-sm sm:text-base">
              Total Media
            </p>
            <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 theme-icon-accent" />
          </div>
          <p className="text-2xl sm:text-4xl font-bold theme-text-primary">
            {overview?.total_media || 0}
          </p>
          <div className="mt-2 text-xs sm:text-sm theme-text-muted">
            {overview?.total_videos || 0} videos, {overview?.total_audio || 0}{" "}
            audio
          </div>
        </div>

        <div className="theme-stat-card-2 rounded-lg sm:rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <p className="theme-text-secondary text-sm sm:text-base">Ready</p>
            <CheckCircle
              className="w-6 h-6 sm:w-8 sm:h-8"
              style={{ color: "var(--status-success)" }}
            />
          </div>
          <p className="text-2xl sm:text-4xl font-bold theme-text-primary">
            {overview?.ready || 0}
          </p>
          <div className="mt-2 text-xs sm:text-sm theme-text-muted">
            {overview?.processing || 0} processing, {overview?.failed || 0}{" "}
            failed
          </div>
        </div>

        <div className="theme-stat-card-3 rounded-lg sm:rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <p className="theme-text-secondary text-sm sm:text-base">Storage</p>
            <HardDrive className="w-6 h-6 sm:w-8 sm:h-8 theme-icon-accent" />
          </div>
          <p className="text-2xl sm:text-4xl font-bold theme-text-primary">
            {formatFileSize(overview?.total_size_bytes || 0)}
          </p>
          <div className="mt-2 text-xs sm:text-sm theme-text-muted">
            All media files
          </div>
        </div>

        <div className="theme-stat-card-4 rounded-lg sm:rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <p className="theme-text-secondary text-sm sm:text-base">
              Duration
            </p>
            <Clock className="w-6 h-6 sm:w-8 sm:h-8 theme-icon-accent" />
          </div>
          <p className="text-2xl sm:text-4xl font-bold theme-text-primary">
            {Math.round((overview?.total_duration_seconds || 0) / 60)}m
          </p>
          <div className="mt-2 text-xs sm:text-sm theme-text-muted">
            All content
          </div>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 xs:gap-4 sm:gap-6">
        {/* Playback Stats */}
        <div className="theme-card rounded-lg sm:rounded-xl p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold theme-text-primary mb-4 sm:mb-6 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
            <span>Playback Stats</span>
          </h2>

          <div className="grid grid-cols-2 gap-3 xs:gap-4 sm:gap-6 mb-4 sm:mb-6">
            <div
              className="p-3 sm:p-4 rounded-lg"
              style={{ background: "var(--input-bg)" }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="theme-text-secondary text-sm">
                  Total Plays
                </span>
                <Play className="w-4 h-4 sm:w-5 sm:h-5 theme-icon-accent" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold theme-text-primary">
                {analytics?.total_plays || 0}
              </p>
            </div>

            <div
              className="p-3 sm:p-4 rounded-lg"
              style={{ background: "var(--input-bg)" }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="theme-text-secondary text-sm">
                  Completions
                </span>
                <CheckCircle
                  className="w-4 h-4 sm:w-5 sm:h-5"
                  style={{ color: "var(--status-success)" }}
                />
              </div>
              <p className="text-2xl sm:text-3xl font-bold theme-text-primary">
                {analytics?.total_completes || 0}
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="theme-text-secondary text-sm">
                Completion Rate
              </span>
              <span className="theme-text-primary font-medium text-sm">
                {analytics?.total_plays > 0
                  ? Math.round(
                      (analytics.total_completes / analytics.total_plays) * 100,
                    )
                  : 0}
                %
              </span>
            </div>
            <div
              className="w-full rounded-full h-2 sm:h-3"
              style={{ background: "var(--input-bg)" }}
            >
              <div
                className="h-2 sm:h-3 rounded-full transition-all"
                style={{
                  background: "var(--status-success)",
                  width: `${
                    analytics?.total_plays > 0
                      ? (analytics.total_completes / analytics.total_plays) *
                        100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Top Media */}
        <div className="theme-card rounded-lg sm:rounded-xl p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold theme-text-primary mb-4 sm:mb-6 flex items-center space-x-2">
            <Play className="w-5 h-5 sm:w-6 sm:h-6" />
            <span>Most Played</span>
          </h2>

          {analytics?.top_media && analytics.top_media.length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              {analytics.top_media
                .slice(0, 5)
                .map((item: any, index: number) => (
                  <div
                    key={item.media_id}
                    className="flex items-center justify-between p-2 sm:p-3 rounded-lg transition-colors"
                    style={{ background: "var(--input-bg)" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "var(--input-focus)20")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "var(--input-bg)")
                    }
                  >
                    <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                      <div
                        className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0"
                        style={{
                          background: "var(--accent-primary)30",
                          color: "var(--accent-primary)",
                        }}
                      >
                        {index + 1}
                      </div>
                      <p className="theme-text-primary font-medium truncate text-sm sm:text-base">
                        {item.filename}
                      </p>
                    </div>
                    <span className="theme-text-muted text-xs sm:text-sm flex-shrink-0 ml-2">
                      {item.play_count} plays
                    </span>
                  </div>
                ))}
            </div>
          ) : (
            <p className="theme-text-muted text-center py-6 sm:py-8 text-sm">
              No playback data yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
