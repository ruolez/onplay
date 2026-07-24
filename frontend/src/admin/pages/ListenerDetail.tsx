import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Headphones,
  Music,
  Play,
  Video,
} from "lucide-react";
import {
  analyticsApi,
  type ListenerDetail as ListenerDetailData,
} from "../../lib/api";
import { formatDate } from "../../lib/utils";
import { formatRelative } from "./Analytics";

const EVENT_COLORS: Record<string, string> = {
  play: "var(--status-info)",
  complete: "var(--status-success)",
  pause: "var(--status-warning)",
  error: "var(--status-error)",
};

export default function ListenerDetail() {
  const { listenerId } = useParams<{ listenerId: string }>();
  const [listener, setListener] = useState<ListenerDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!listenerId) return;
    let cancelled = false;
    setLoading(true);
    analyticsApi
      .getListenerDetail(listenerId)
      .then((res) => {
        if (!cancelled) setListener(res.data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [listenerId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton-block h-8 w-64 rounded-lg" />
        <div className="skeleton-block h-32 rounded-xl" />
        <div className="skeleton-block h-64 rounded-xl" />
      </div>
    );
  }

  if (error || !listener) {
    return (
      <div className="space-y-4">
        <Link
          to="/admin/analytics?tab=listeners"
          className="inline-flex items-center gap-2 theme-text-secondary hover:theme-text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to listeners
        </Link>
        <div className="theme-card rounded-xl p-10 text-center">
          <p className="theme-text-secondary">Listener not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/admin/analytics?tab=listeners"
          className="inline-flex items-center gap-2 theme-text-secondary hover:theme-text-primary transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to listeners
        </Link>
        <h1 className="text-2xl font-bold theme-text-primary flex items-center gap-3">
          <Headphones className="w-6 h-6 theme-icon-accent" />
          <span className="font-mono text-xl">
            {listener.listener_id.slice(0, 8)}
          </span>
        </h1>
        <p className="theme-text-muted text-sm mt-1">
          {[listener.browser, listener.os, listener.device]
            .filter(Boolean)
            .join(" · ") || "Unknown device"}
          {listener.ip_address && (
            <>
              {" · "}
              {listener.hostname && listener.hostname !== listener.ip_address
                ? `${listener.hostname} (${listener.ip_address})`
                : listener.ip_address}
            </>
          )}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="theme-stat-card-1 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="theme-text-secondary text-sm">Plays</p>
            <Play className="w-5 h-5 theme-icon-accent" />
          </div>
          <p className="text-2xl font-bold theme-text-primary">
            {listener.total_plays}
          </p>
        </div>
        <div className="theme-stat-card-2 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="theme-text-secondary text-sm">Unique media</p>
            <Music className="w-5 h-5 theme-icon-accent" />
          </div>
          <p className="text-2xl font-bold theme-text-primary">
            {listener.media.length}
          </p>
        </div>
        <div className="theme-stat-card-3 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="theme-text-secondary text-sm">First seen</p>
            <Clock className="w-5 h-5 theme-icon-accent" />
          </div>
          <p className="text-base font-bold theme-text-primary">
            {listener.first_seen ? formatDate(listener.first_seen) : "—"}
          </p>
        </div>
        <div className="theme-stat-card-4 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="theme-text-secondary text-sm">Last seen</p>
            <Clock className="w-5 h-5 theme-icon-accent" />
          </div>
          <p className="text-base font-bold theme-text-primary">
            {formatRelative(listener.last_seen)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* What they listened to */}
        <div className="theme-card rounded-xl p-5">
          <h2 className="font-semibold theme-text-primary mb-4">
            Listened media
          </h2>
          {listener.media.length > 0 ? (
            <div className="space-y-2">
              {listener.media.map((m) => (
                <div
                  key={m.media_id}
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ background: "var(--input-bg)" }}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {m.media_type === "video" ? (
                      <Video
                        className="w-4 h-4 flex-shrink-0"
                        style={{ color: "var(--icon-video)" }}
                      />
                    ) : (
                      <Music
                        className="w-4 h-4 flex-shrink-0"
                        style={{ color: "var(--icon-audio)" }}
                      />
                    )}
                    <div className="min-w-0">
                      <p className="theme-text-primary text-sm font-medium truncate">
                        {m.filename}
                      </p>
                      <p className="theme-text-muted text-xs">
                        Last played {formatRelative(m.last_played)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs theme-text-secondary flex-shrink-0 ml-3">
                    <span className="flex items-center gap-1">
                      <Play className="w-3 h-3" />
                      {m.plays}
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      {m.completes}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="theme-text-muted text-sm">No plays recorded.</p>
          )}
        </div>

        {/* Recent activity */}
        <div className="theme-card rounded-xl p-5">
          <h2 className="font-semibold theme-text-primary mb-4">
            Recent activity
          </h2>
          {listener.recent_events.length > 0 ? (
            <div className="space-y-1.5 max-h-[480px] overflow-y-auto pr-1">
              {listener.recent_events.map((e, i) => (
                <div key={i} className="flex items-center gap-3 py-1.5 text-sm">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{
                      background:
                        EVENT_COLORS[e.event_type] ?? "var(--text-muted)",
                    }}
                  />
                  <span className="theme-text-secondary capitalize w-24 flex-shrink-0">
                    {e.event_type.replace(/_/g, " ")}
                  </span>
                  <span className="theme-text-primary truncate flex-1">
                    {e.filename}
                  </span>
                  <span className="theme-text-muted text-xs flex-shrink-0 whitespace-nowrap">
                    {formatRelative(e.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="theme-text-muted text-sm">No activity yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
