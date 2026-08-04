import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Headphones, Monitor, Smartphone, Tablet } from "lucide-react";
import SegmentedControl from "../../components/SegmentedControl";
import StatsOverview from "./StatsOverview";
import { analyticsApi, type ListenerSummary } from "../../lib/api";
import { formatDate, formatLocation } from "../../lib/utils";

type AnalyticsTab = "overview" | "listeners";

const PAGE_SIZE = 50;

function DeviceIcon({ device }: { device: string | null }) {
  if (device === "mobile") return <Smartphone className="w-4 h-4" />;
  if (device === "tablet") return <Tablet className="w-4 h-4" />;
  return <Monitor className="w-4 h-4" />;
}

export function formatRelative(iso: string | null): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const diffMs = Date.now() - then;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(iso);
}

function ListenersTab() {
  const [items, setItems] = useState<ListenerSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    analyticsApi
      .getListeners(0, PAGE_SIZE)
      .then((res) => {
        if (cancelled) return;
        setItems(res.data.items);
        setTotal(res.data.total);
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
  }, []);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const res = await analyticsApi.getListeners(items.length, PAGE_SIZE);
      setItems((prev) => [...prev, ...res.data.items]);
      setTotal(res.data.total);
    } catch {
      // keep whatever we have
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton-block h-14 rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="theme-card rounded-xl p-10 text-center">
        <p className="theme-text-secondary">Failed to load listeners.</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="theme-card rounded-xl p-10 text-center">
        <Headphones className="w-10 h-10 theme-text-muted mx-auto mb-3" />
        <p className="theme-text-secondary">No listeners tracked yet.</p>
        <p className="theme-text-muted text-sm mt-1">
          Unique listeners appear here once people start playing media.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm theme-text-muted">
        {total} unique listener{total === 1 ? "" : "s"}
      </p>

      <div className="theme-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr
                className="text-left theme-text-muted border-b"
                style={{ borderColor: "var(--card-border)" }}
              >
                <th className="px-4 py-3 font-medium">Listener</th>
                <th className="px-4 py-3 font-medium">Device</th>
                <th className="px-4 py-3 font-medium">Location / IP</th>
                <th className="px-4 py-3 font-medium">Plays</th>
                <th className="px-4 py-3 font-medium">Media</th>
                <th className="px-4 py-3 font-medium">First seen</th>
                <th className="px-4 py-3 font-medium">Last seen</th>
              </tr>
            </thead>
            <tbody>
              {items.map((l) => (
                <tr
                  key={l.listener_id}
                  className="border-b last:border-b-0 hover:bg-white/[0.03] transition-colors"
                  style={{ borderColor: "var(--card-border)" }}
                >
                  <td className="px-4 py-3">
                    <Link
                      to={`/admin/analytics/listeners/${l.listener_id}`}
                      className="font-mono text-xs theme-text-primary hover:underline"
                      title={l.listener_id}
                    >
                      {l.listener_id.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2 theme-text-secondary">
                      <DeviceIcon device={l.device} />
                      <span className="capitalize">
                        {[l.browser, l.os].filter(Boolean).join(" · ") ||
                          l.device ||
                          "unknown"}
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div
                      className="flex flex-col"
                      title={l.hostname ?? undefined}
                    >
                      <span className="theme-text-secondary">
                        {formatLocation(l.city, l.region, l.country) ?? "—"}
                      </span>
                      <span className="text-xs theme-text-muted font-mono">
                        {l.ip_address ?? ""}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 theme-text-secondary">
                    {l.total_plays}
                  </td>
                  <td className="px-4 py-3 theme-text-secondary">
                    {l.unique_media_count}
                  </td>
                  <td className="px-4 py-3 theme-text-secondary whitespace-nowrap">
                    {l.first_seen ? formatDate(l.first_seen) : "—"}
                  </td>
                  <td className="px-4 py-3 theme-text-secondary whitespace-nowrap">
                    {formatRelative(l.last_seen)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {items.length < total && (
        <div className="flex justify-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="theme-btn-secondary px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-60"
          >
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function Analytics() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get("tab") as AnalyticsTab) || "overview";

  const setTab = (value: AnalyticsTab) => {
    const params = new URLSearchParams(searchParams);
    if (value === "overview") {
      params.delete("tab");
    } else {
      params.set("tab", value);
    }
    setSearchParams(params, { replace: true });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold theme-text-primary">Analytics</h1>
        <SegmentedControl<AnalyticsTab>
          options={[
            { value: "overview", label: "Overview" },
            { value: "listeners", label: "Listeners" },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>

      {tab === "overview" ? <StatsOverview /> : <ListenersTab />}
    </div>
  );
}
