import { useState } from "react";
import SegmentedControl from "../../../components/SegmentedControl";
import type { BreakdownItem } from "../../../lib/api";

type BreakdownTab = "device" | "browser" | "os";

type BreakdownCardProps = {
  devices: {
    device: BreakdownItem[];
    browser: BreakdownItem[];
    os: BreakdownItem[];
  };
};

export default function BreakdownCard({ devices }: BreakdownCardProps) {
  const [tab, setTab] = useState<BreakdownTab>("device");
  const items = devices[tab];
  const max = Math.max(...items.map((i) => i.listeners), 1);

  return (
    <div className="theme-card rounded-xl p-5 flex flex-col">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="font-semibold theme-text-primary">Listeners by</h2>
      </div>
      <SegmentedControl<BreakdownTab>
        options={[
          { value: "device", label: "Device" },
          { value: "browser", label: "Browser" },
          { value: "os", label: "OS" },
        ]}
        value={tab}
        onChange={setTab}
        className="mb-4"
      />

      {items.length === 0 ? (
        <p className="theme-text-muted text-sm py-6 text-center">
          No listener data yet.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const unknown = item.name === "Unknown";
            return (
              <div key={item.name}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span
                    className={`capitalize ${
                      unknown ? "theme-text-muted" : "theme-text-secondary"
                    }`}
                  >
                    {item.name}
                  </span>
                  <span
                    className="theme-text-primary font-medium"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {item.listeners.toLocaleString()}
                  </span>
                </div>
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{ background: "var(--input-bg)" }}
                >
                  <div
                    className="h-full rounded-full transition-[width] duration-300"
                    style={{
                      width: `${(item.listeners / max) * 100}%`,
                      background: "var(--chart-1)",
                      opacity: unknown ? 0.45 : 1,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
