import { useEffect, useState } from "react";
import { mediaApi } from "../lib/api";
import {
  BarChart3,
  Play,
  CheckCircle,
  TrendingUp,
  HardDrive,
  Clock,
  Activity,
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
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="theme-stat-card-1 rounded-lg sm:rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <p className="theme-text-secondary text-sm sm:text-base">
              Total Media
            </p>
            <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 theme-icon-accent" />
          </div>
          <p className="text-3xl sm:text-4xl font-bold theme-text-primary">
            {overview?.total_media || 0}
          </p>
          <div className="mt-2 text-xs sm:text-sm theme-text-muted">
            {overview?.total_videos || 0} videos, {overview?.total_audio || 0}{" "}
            audio
          </div>
        </div>

        <div className="theme-stat-card-2 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="theme-text-secondary">Ready</p>
            <CheckCircle
              className="w-8 h-8"
              style={{ color: "var(--status-success)" }}
            />
          </div>
          <p className="text-4xl font-bold theme-text-primary">
            {overview?.ready || 0}
          </p>
          <div className="mt-2 text-sm theme-text-muted">
            {overview?.processing || 0} processing, {overview?.failed || 0}{" "}
            failed
          </div>
        </div>

        <div className="theme-stat-card-3 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="theme-text-secondary">Total Storage</p>
            <HardDrive className="w-8 h-8 theme-icon-accent" />
          </div>
          <p className="text-4xl font-bold theme-text-primary">
            {formatFileSize(overview?.total_size_bytes || 0)}
          </p>
          <div className="mt-2 text-sm theme-text-muted">All media files</div>
        </div>

        <div className="theme-stat-card-4 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="theme-text-secondary">Total Duration</p>
            <Clock className="w-8 h-8 theme-icon-accent" />
          </div>
          <p className="text-4xl font-bold theme-text-primary">
            {Math.round((overview?.total_duration_seconds || 0) / 60)}m
          </p>
          <div className="mt-2 text-sm theme-text-muted">All content</div>
        </div>

        <div className="theme-stat-card-1 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="theme-text-secondary">Bandwidth ({days}d)</p>
            <Activity className="w-8 h-8 theme-icon-accent" />
          </div>
          <p className="text-4xl font-bold theme-text-primary">
            {formatFileSize(analytics?.total_bandwidth_bytes || 0)}
          </p>
          <div className="mt-2 text-sm theme-text-muted">Data transferred</div>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="theme-card rounded-xl p-6">
          <h2 className="text-2xl font-bold theme-text-primary mb-6 flex items-center space-x-2">
            <TrendingUp className="w-6 h-6" />
            <span>Last {days} Days</span>
          </h2>

          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="theme-text-secondary">Total Plays</span>
                <Play className="w-5 h-5 theme-icon-accent" />
              </div>
              <p className="text-3xl font-bold theme-text-primary">
                {analytics?.total_plays || 0}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="theme-text-secondary">Completions</span>
                <CheckCircle
                  className="w-5 h-5"
                  style={{ color: "var(--status-success)" }}
                />
              </div>
              <p className="text-3xl font-bold theme-text-primary">
                {analytics?.total_completes || 0}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="theme-text-secondary">Completion Rate</span>
              </div>
              <div className="flex items-center space-x-3">
                <div
                  className="flex-1 rounded-full h-3"
                  style={{ background: "var(--input-bg)" }}
                >
                  <div
                    className="h-3 rounded-full transition-all"
                    style={{
                      background: "var(--status-success)",
                      width: `${
                        analytics?.total_plays > 0
                          ? (analytics.total_completes /
                              analytics.total_plays) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>
                <span className="theme-text-primary font-medium">
                  {analytics?.total_plays > 0
                    ? Math.round(
                        (analytics.total_completes / analytics.total_plays) *
                          100,
                      )
                    : 0}
                  %
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Media */}
        <div className="theme-card rounded-xl p-6">
          <h2 className="text-2xl font-bold theme-text-primary mb-6">
            Top Media
          </h2>

          {analytics?.top_media && analytics.top_media.length > 0 ? (
            <div className="space-y-3">
              {analytics.top_media
                .slice(0, 5)
                .map((item: any, index: number) => (
                  <div
                    key={item.media_id}
                    className="flex items-center justify-between p-3 rounded-lg transition-colors"
                    style={{ background: "var(--input-bg)" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "var(--input-focus)20")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "var(--input-bg)")
                    }
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center font-bold"
                        style={{
                          background: "var(--accent-primary)30",
                          color: "var(--accent-primary)",
                        }}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <p className="theme-text-primary font-medium truncate max-w-xs">
                          {item.filename}
                        </p>
                        <p className="theme-text-muted text-sm">
                          {item.play_count} plays
                        </p>
                      </div>
                    </div>
                    <Play className="w-5 h-5 theme-text-muted" />
                  </div>
                ))}
            </div>
          ) : (
            <p className="theme-text-muted text-center py-8">
              No playback data yet
            </p>
          )}
        </div>

        {/* Bandwidth by Location */}
        <div className="theme-card rounded-xl p-6">
          <h2 className="text-2xl font-bold theme-text-primary mb-6 flex items-center space-x-2">
            <Activity className="w-6 h-6" />
            <span>Top Sources</span>
          </h2>

          {analytics?.bandwidth_by_ip &&
          analytics.bandwidth_by_ip.length > 0 ? (
            <div className="space-y-3">
              {analytics.bandwidth_by_ip
                .slice(0, 5)
                .map((item: any, index: number) => (
                  <div
                    key={item.ip}
                    className="flex items-center justify-between p-3 rounded-lg transition-colors"
                    style={{ background: "var(--input-bg)" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "var(--input-focus)20")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "var(--input-bg)")
                    }
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0"
                        style={{
                          background: "var(--accent-primary)30",
                          color: "var(--accent-primary)",
                        }}
                      >
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="theme-text-primary font-medium truncate">
                          {item.hostname || item.ip}
                        </p>
                        <p className="theme-text-muted text-sm">
                          {formatFileSize(item.bandwidth_bytes)} •{" "}
                          {item.requests || item.plays || 0} requests
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="theme-text-muted text-center py-8">
              No bandwidth data yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
