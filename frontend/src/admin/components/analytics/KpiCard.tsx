import { ArrowDownRight, ArrowUpRight } from "lucide-react";

type KpiCardProps = {
  label: string;
  value: string;
  // Percent change vs previous period, or null when there is no baseline.
  delta: number | null;
  // Completion rate reports percentage-point difference instead of % change.
  deltaUnit?: "%" | "pp";
  periodDays: number;
  cardClass: string;
};

export default function KpiCard({
  label,
  value,
  delta,
  deltaUnit = "%",
  periodDays,
  cardClass,
}: KpiCardProps) {
  const up = delta !== null && delta > 0;
  const down = delta !== null && delta < 0;

  return (
    <div className={`${cardClass} rounded-xl p-4 sm:p-5`}>
      <p className="theme-text-secondary text-sm mb-2">{label}</p>
      <p className="text-2xl sm:text-3xl font-semibold theme-text-primary">
        {value}
      </p>
      <div className="flex items-center gap-1.5 mt-2 text-xs">
        {delta === null ? (
          <span className="theme-text-muted">— no baseline</span>
        ) : (
          <span
            className="flex items-center gap-0.5 font-medium"
            style={{
              color: up
                ? "var(--status-success)"
                : down
                  ? "var(--status-error)"
                  : "var(--text-muted)",
            }}
          >
            {up && <ArrowUpRight className="w-3.5 h-3.5" />}
            {down && <ArrowDownRight className="w-3.5 h-3.5" />}
            {deltaUnit === "pp"
              ? `${delta > 0 ? "+" : ""}${delta} pp`
              : `${delta > 0 ? "+" : ""}${delta}%`}
          </span>
        )}
        <span className="theme-text-muted">vs prev. {periodDays}d</span>
      </div>
    </div>
  );
}
