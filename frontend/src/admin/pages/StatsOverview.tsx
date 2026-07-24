import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, Headphones } from "lucide-react";
import SegmentedControl from "../../components/SegmentedControl";
import KpiCard from "../components/analytics/KpiCard";
import TrendChart from "../components/analytics/TrendChart";
import BreakdownCard from "../components/analytics/BreakdownCard";
import TopMediaList from "../components/analytics/TopMediaList";
import { analyticsApi, type AnalyticsDashboard } from "../../lib/api";

type Period = "7" | "30" | "90";

export default function StatsOverview() {
  const [period, setPeriod] = useState<Period>("7");
  const [data, setData] = useState<AnalyticsDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const requestSeq = useRef(0);

  const loadData = useCallback(async (days: number, initial: boolean) => {
    const seq = ++requestSeq.current;
    if (initial) {
      setLoading(true);
    } else {
      // Period switch: hold the previous render at reduced opacity instead
      // of flashing a skeleton (no layout jump).
      setRefreshing(true);
    }
    setLoadError(false);
    try {
      const res = await analyticsApi.getDashboard(days);
      if (seq !== requestSeq.current) return;
      setData(res.data);
    } catch {
      if (seq !== requestSeq.current) return;
      setLoadError(true);
    } finally {
      if (seq === requestSeq.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    loadData(Number(period), data === null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, loadData]);

  if (loading) {
    return (
      <div>
        <p className="sr-only" role="status">
          Loading analytics…
        </p>
        <div className="flex justify-end mb-4" aria-hidden="true">
          <div className="skeleton-block h-10 w-48 rounded-lg" />
        </div>
        <div
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6"
          aria-hidden="true"
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton-block h-28 rounded-xl" />
          ))}
        </div>
        <div
          className="skeleton-block h-[340px] rounded-xl mb-4 sm:mb-6"
          aria-hidden="true"
        />
        <div
          className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6"
          aria-hidden="true"
        >
          <div className="skeleton-block h-64 rounded-xl" />
          <div className="skeleton-block h-64 rounded-xl lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (loadError && !data) {
    return (
      <div
        role="alert"
        className="flex items-center gap-3 theme-card rounded-xl p-4"
      >
        <AlertCircle
          className="w-5 h-5 flex-shrink-0"
          style={{ color: "var(--status-error)" }}
        />
        <p className="theme-text-secondary text-sm flex-1">
          Failed to load analytics. Check your connection and try again.
        </p>
        <button
          onClick={() => loadData(Number(period), true)}
          className="theme-btn-secondary px-3 py-2 rounded-lg text-sm font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { summary, timeseries, devices, top_media, period_days } = data;
  const kpis = summary.current;
  const hasData = kpis.plays > 0 || summary.previous.plays > 0;

  return (
    <div
      className="transition-opacity duration-150"
      style={{ opacity: refreshing ? 0.55 : 1 }}
    >
      {/* Period selector */}
      <div className="flex items-center justify-between gap-3 mb-4">
        {loadError ? (
          <p className="text-sm" style={{ color: "var(--status-error)" }}>
            Refresh failed — showing previous data.
          </p>
        ) : (
          <span />
        )}
        <SegmentedControl<Period>
          options={[
            { value: "7", label: "7d" },
            { value: "30", label: "30d" },
            { value: "90", label: "90d" },
          ]}
          value={period}
          onChange={setPeriod}
        />
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <KpiCard
          label="Plays"
          value={kpis.plays.toLocaleString()}
          delta={summary.deltas.plays}
          periodDays={period_days}
          cardClass="theme-stat-card-1"
        />
        <KpiCard
          label="Unique listeners"
          value={kpis.unique_listeners.toLocaleString()}
          delta={summary.deltas.unique_listeners}
          periodDays={period_days}
          cardClass="theme-stat-card-2"
        />
        <KpiCard
          label="Completions"
          value={kpis.completions.toLocaleString()}
          delta={summary.deltas.completions}
          periodDays={period_days}
          cardClass="theme-stat-card-3"
        />
        <KpiCard
          label="Completion rate"
          value={`${kpis.completion_rate}%`}
          delta={summary.deltas.completion_rate_pp}
          deltaUnit="pp"
          periodDays={period_days}
          cardClass="theme-stat-card-4"
        />
      </div>

      {hasData ? (
        <>
          {/* Trend chart */}
          <div className="theme-card rounded-xl p-5 mb-4 sm:mb-6">
            <h2 className="font-semibold theme-text-primary mb-3">
              Listening over time
            </h2>
            <TrendChart data={timeseries} />
          </div>

          {/* Breakdown + top media */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <BreakdownCard devices={devices} />
            <div className="lg:col-span-2">
              <TopMediaList items={top_media} />
            </div>
          </div>
        </>
      ) : (
        <div className="theme-card rounded-xl p-12 text-center">
          <Headphones className="w-10 h-10 theme-text-muted mx-auto mb-3 opacity-60" />
          <p className="theme-text-primary font-medium mb-1">
            No listening data yet
          </p>
          <p className="theme-text-muted text-sm">
            Trends, listener breakdowns, and top media appear here once people
            start playing your media.
          </p>
        </div>
      )}
    </div>
  );
}
