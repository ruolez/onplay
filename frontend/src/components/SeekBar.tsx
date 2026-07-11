import { useRef, useState } from "react";
import { formatDuration } from "../lib/utils";

interface SeekBarProps {
  currentTime: number;
  duration: number;
  bufferedEnd?: number;
  onSeek: (time: number) => void;
  onScrubStart?: () => void;
  onScrubEnd?: () => void;
  showThumb?: boolean;
  className?: string;
  trackBackground?: string;
}

// Seekable progress bar: pointer-drag scrubbing with a time bubble,
// arrow-key operation (WCAG 2.5.7 / 2.1.1), and buffered-range display
export default function SeekBar({
  currentTime,
  duration,
  bufferedEnd = 0,
  onSeek,
  onScrubStart,
  onScrubEnd,
  showThumb = false,
  className = "",
  trackBackground,
}: SeekBarProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [scrubTime, setScrubTime] = useState<number | null>(null);

  const timeFromPointer = (clientX: number): number => {
    const rect = trackRef.current!.getBoundingClientRect();
    const percent = Math.min(
      1,
      Math.max(0, (clientX - rect.left) / rect.width),
    );
    return percent * duration;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!duration) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setScrubTime(timeFromPointer(e.clientX));
    onScrubStart?.();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (scrubTime === null || !duration) return;
    setScrubTime(timeFromPointer(e.clientX));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (scrubTime === null) return;
    onSeek(timeFromPointer(e.clientX));
    setScrubTime(null);
    onScrubEnd?.();
  };

  const handlePointerCancel = () => {
    if (scrubTime === null) return;
    setScrubTime(null);
    onScrubEnd?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!duration) return;
    let target: number;
    switch (e.key) {
      case "ArrowRight":
        target = Math.min(duration, currentTime + 5);
        break;
      case "ArrowLeft":
        target = Math.max(0, currentTime - 5);
        break;
      case "ArrowUp":
        target = Math.min(duration, currentTime + 10);
        break;
      case "ArrowDown":
        target = Math.max(0, currentTime - 10);
        break;
      case "Home":
        target = 0;
        break;
      case "End":
        target = duration;
        break;
      default:
        return;
    }
    e.preventDefault();
    onSeek(target);
  };

  const displayTime = scrubTime ?? currentTime;
  const progress = duration ? (displayTime / duration) * 100 : 0;
  const bufferedPercent =
    duration && bufferedEnd
      ? Math.min(100, (bufferedEnd / duration) * 100)
      : 0;

  return (
    <div
      ref={trackRef}
      role="slider"
      tabIndex={0}
      aria-label="Seek position"
      aria-valuemin={0}
      aria-valuemax={Math.round(duration) || 0}
      aria-valuenow={Math.round(displayTime) || 0}
      aria-valuetext={`${formatDuration(displayTime)} of ${formatDuration(duration)}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onKeyDown={handleKeyDown}
      onTouchStart={(e) => e.stopPropagation()}
      className={`relative cursor-pointer touch-none ${className}`}
      style={{
        background: trackBackground ?? "var(--player-progress-bg)",
      }}
    >
      {bufferedPercent > 0 && (
        <div
          className="absolute inset-y-0 left-0 rounded-[inherit] pointer-events-none"
          style={{
            width: `${bufferedPercent}%`,
            background: "rgba(255, 255, 255, 0.12)",
          }}
        />
      )}
      <div
        className="absolute inset-y-0 left-0 rounded-[inherit] pointer-events-none"
        style={{
          width: `${progress}%`,
          background: "var(--btn-primary-bg)",
        }}
      >
        {showThumb && (
          <div
            className="absolute right-0 top-1/2 w-6 h-6 rounded-full shadow-lg"
            style={{
              background: "var(--btn-primary-bg)",
              transform: "translate(50%, -50%)",
            }}
          />
        )}
      </div>
      {scrubTime !== null && (
        <div
          className="absolute -top-8 px-2 py-0.5 rounded text-xs pointer-events-none whitespace-nowrap theme-text-primary"
          style={{
            left: `clamp(24px, ${progress}%, calc(100% - 24px))`,
            transform: "translateX(-50%)",
            background: "var(--dropdown-bg, rgba(0, 0, 0, 0.85))",
            border: "1px solid var(--card-border)",
          }}
        >
          {formatDuration(scrubTime)}
        </div>
      )}
    </div>
  );
}
