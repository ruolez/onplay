// Animated equalizer bars indicating the currently playing track.
// Animates while playing, freezes at static heights while paused.
// Color follows `currentColor`; sized via the `className` box.
export default function EqualizerBars({
  playing,
  className = "",
}: {
  playing: boolean;
  className?: string;
}) {
  return (
    <span
      className={`eq-bars ${playing ? "eq-bars-playing" : ""} ${className}`}
      aria-hidden="true"
    >
      <span />
      <span />
      <span />
    </span>
  );
}
