import { Link } from "react-router-dom";
import { Film, Music, Users } from "lucide-react";
import type { TopMediaItem } from "../../../lib/api";
import { formatRelative } from "../../pages/Analytics";

export default function TopMediaList({ items }: { items: TopMediaItem[] }) {
  return (
    <div className="theme-card rounded-xl p-5">
      <h2 className="font-semibold theme-text-primary mb-4">Top media</h2>
      {items.length === 0 ? (
        <p className="theme-text-muted text-sm py-6 text-center">
          No plays in this period.
        </p>
      ) : (
        <div className="space-y-1">
          {items.map((item, index) => (
            <Link
              key={item.media_id}
              to={`/player/${item.media_id}`}
              className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-white/[0.04] transition-colors"
            >
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{
                  background:
                    "color-mix(in srgb, var(--accent-primary) 18%, transparent)",
                  color: "var(--accent-primary)",
                }}
              >
                {index + 1}
              </span>

              {item.thumbnail_path ? (
                <img
                  src={item.thumbnail_path}
                  alt=""
                  className="w-14 h-9 rounded object-cover flex-shrink-0"
                />
              ) : (
                <div
                  className="w-14 h-9 rounded flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--input-bg)" }}
                >
                  {item.media_type === "video" ? (
                    <Film
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
                  {item.filename}
                </p>
                <p className="theme-text-muted text-xs flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {item.unique_listeners} listener
                  {item.unique_listeners === 1 ? "" : "s"}
                  {item.last_played && (
                    <> · {formatRelative(item.last_played)}</>
                  )}
                </p>
              </div>

              <div className="flex-shrink-0 text-right">
                <p
                  className="theme-text-primary text-sm font-semibold"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {item.plays.toLocaleString()}
                  <span className="theme-text-muted font-normal text-xs">
                    {" "}
                    plays
                  </span>
                </p>
                <div className="flex items-center gap-1.5 mt-1 justify-end">
                  <div
                    className="w-16 h-1.5 rounded-full overflow-hidden"
                    style={{ background: "var(--input-bg)" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${item.completion_rate}%`,
                        background: "var(--status-success)",
                      }}
                    />
                  </div>
                  <span
                    className="theme-text-muted text-[11px] w-8 text-right"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {Math.round(item.completion_rate)}%
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
