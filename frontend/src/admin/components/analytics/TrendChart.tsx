import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TimeseriesPoint } from "../../../lib/api";

// Series colors come from theme CSS vars (validated categorical pair) so the
// chart recolors on theme switch without re-render logic.
const PLAYS = "var(--chart-1)";
const LISTENERS = "var(--chart-2)";

function formatDay(date: string): string {
  const d = new Date(`${date}T00:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number; stroke?: string }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const rows = [
    { key: "plays", name: "Plays", color: PLAYS },
    { key: "unique_listeners", name: "Listeners", color: LISTENERS },
  ];
  return (
    <div
      className="rounded-lg px-3 py-2 shadow-xl text-xs"
      style={{
        background: "var(--dropdown-bg)",
        border: "1px solid var(--card-border)",
        backdropFilter: "blur(8px)",
      }}
    >
      <p className="theme-text-muted mb-1.5">{label ? formatDay(label) : ""}</p>
      {rows.map((row) => {
        const entry = payload.find((p) => p.dataKey === row.key);
        if (!entry) return null;
        return (
          <div key={row.key} className="flex items-center gap-2 py-0.5">
            <span
              className="inline-block w-3 rounded-full"
              style={{ height: 2, background: row.color }}
            />
            <span className="theme-text-primary font-semibold">
              {entry.value.toLocaleString()}
            </span>
            <span className="theme-text-secondary">{row.name}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function TrendChart({ data }: { data: TimeseriesPoint[] }) {
  return (
    <div>
      {/* Legend: two series, line keys, text in text tokens */}
      <div className="flex items-center gap-4 mb-3">
        {[
          { name: "Plays", color: PLAYS },
          { name: "Listeners", color: LISTENERS },
        ].map((s) => (
          <span
            key={s.name}
            className="flex items-center gap-1.5 text-xs theme-text-secondary"
          >
            <span
              className="inline-block w-4 rounded-full"
              style={{ height: 2, background: s.color }}
            />
            {s.name}
          </span>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart
          data={data}
          margin={{ top: 4, right: 8, bottom: 0, left: -18 }}
        >
          <CartesianGrid
            vertical={false}
            stroke="var(--card-border)"
            strokeWidth={1}
          />
          <XAxis
            dataKey="date"
            tickFormatter={formatDay}
            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            minTickGap={28}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ stroke: "var(--text-muted)", strokeWidth: 1 }}
          />
          <Area
            type="monotone"
            dataKey="plays"
            stroke={PLAYS}
            strokeWidth={2}
            fill={PLAYS}
            fillOpacity={0.1}
            dot={false}
            activeDot={{
              r: 4,
              fill: PLAYS,
              stroke: "var(--bg-primary)",
              strokeWidth: 2,
            }}
          />
          <Line
            type="monotone"
            dataKey="unique_listeners"
            stroke={LISTENERS}
            strokeWidth={2}
            dot={false}
            activeDot={{
              r: 4,
              fill: LISTENERS,
              stroke: "var(--bg-primary)",
              strokeWidth: 2,
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
