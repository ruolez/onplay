import { useEffect, useState, useCallback } from "react";
import { usePlayer } from "../contexts/PlayerContext";
import DualVideoPlayer from "./DualVideoPlayer";
import QueuePanel from "./QueuePanel";
import { mediaApi } from "../lib/api";
import { formatDuration } from "../lib/utils";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  List,
  Monitor,
  MonitorOff,
} from "lucide-react";

export default function PersistentPlayer() {
  const {
    currentMedia,
    sessionId,
    isPlaying,
    currentTime,
    duration,
    volume,
    togglePlayPause,
    seek,
    setVolume,
    playNext,
    playPrevious,
    hasNext,
    hasPrevious,
    queuePosition,
    playerRef,
    handlePlaybackStarted,
    handlePlaybackPaused,
    handlePlaybackEnded,
    handleTimeUpdate,
    handleDurationChange,
    handleBufferStart,
    handleBufferEnd,
    handleError,
    queue,
    currentIndex,
    jumpToTrack,
    isWakeLockEnabled,
    setWakeLockEnabled,
  } = usePlayer();

  const [isVisible, setIsVisible] = useState(false);
  const [thumbnailTimestamp] = useState(Date.now());
  const [isMuted, setIsMuted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);

  // Slide up animation when media loads
  useEffect(() => {
    if (currentMedia) {
      setTimeout(() => setIsVisible(true), 50);
    } else {
      setIsVisible(false);
      setIsQueueOpen(false);
    }
  }, [currentMedia]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const inFullscreen = !!document.fullscreenElement;
      setIsFullscreen(inFullscreen);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange,
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange,
      );
      document.removeEventListener(
        "MSFullscreenChange",
        handleFullscreenChange,
      );
    };
  }, []);

  // Memoize trackEvent to prevent recreating callbacks
  const trackEvent = useCallback(
    async (eventType: string, data?: any) => {
      if (!currentMedia) return;

      try {
        await mediaApi.trackAnalytics(
          currentMedia.id,
          eventType,
          sessionId,
          data,
        );
      } catch (error) {
        console.error("[PersistentPlayer] Failed to track event:", error);
      }
    },
    [currentMedia, sessionId],
  );

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!duration) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      const newTime = percent * duration;
      seek(newTime);
    },
    [duration, seek],
  );

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVolume = parseFloat(e.target.value);
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    },
    [setVolume],
  );

  const toggleMute = useCallback(() => {
    if (isMuted) {
      setVolume(1);
      setIsMuted(false);
    } else {
      setVolume(0);
      setIsMuted(true);
    }
  }, [isMuted, setVolume]);

  const toggleFullscreen = useCallback(() => {
    const player = playerRef.current?.getPlayer();
    if (!player) return;

    if (isFullscreen) {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    } else {
      player.requestFullscreen().catch(() => {});
    }
  }, [isFullscreen, playerRef]);

  // CRITICAL: Memoize these callbacks to prevent DualVideoPlayer from
  // constantly removing/reattaching event listeners, which causes events to be lost
  const handleTimeUpdateWithTracking = useCallback(
    (time: number) => {
      if (!isDragging) {
        handleTimeUpdate(time);
      }
      // Track progress milestones
      if (duration) {
        const progress = (time / duration) * 100;
        if (progress > 25 && progress < 26) trackEvent("progress_25");
        if (progress > 50 && progress < 51) trackEvent("progress_50");
        if (progress > 75 && progress < 76) trackEvent("progress_75");
      }
    },
    [isDragging, handleTimeUpdate, duration, trackEvent],
  );

  const handlePlayWithTracking = useCallback(() => {
    console.log("[PersistentPlayer] 🎵 onPlay event fired");
    handlePlaybackStarted();
    trackEvent("play");

    // Note: Fullscreen is now maintained automatically by keeping same Video.js player instance
    // First video fullscreen is handled by Gallery.tsx setTimeout
    // Subsequent videos maintain fullscreen naturally without needing requestFullscreen()
  }, [handlePlaybackStarted, trackEvent]);

  const handlePauseWithTracking = useCallback(() => {
    console.log("[PersistentPlayer] ⏸️  onPause event fired");
    handlePlaybackPaused();
    trackEvent("pause");
  }, [handlePlaybackPaused, trackEvent]);

  const handleEndedWithTracking = useCallback(async () => {
    console.log("[PersistentPlayer] ⏹️  onEnded event fired");
    await trackEvent("complete");
    handlePlaybackEnded();
  }, [trackEvent, handlePlaybackEnded]);

  if (!currentMedia) return null;

  const bestVariant = currentMedia.variants
    ? currentMedia.variants.sort((a, b) => b.bitrate - a.bitrate)[0]
    : null;
  const playerSrc = bestVariant ? bestVariant.path : "";

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      {/* Video Player - positioned off-screen but not hidden (required for fullscreen to work) */}
      <div
        className={`fixed -top-[9999px] -left-[9999px] ${!isFullscreen ? "pointer-events-none" : ""}`}
      >
        <DualVideoPlayer
          ref={playerRef}
          src={playerSrc}
          poster={
            currentMedia.thumbnail_path
              ? `${currentMedia.thumbnail_path}?t=${thumbnailTimestamp}`
              : undefined
          }
          autoplay={true}
          onPlay={handlePlayWithTracking}
          onPause={handlePauseWithTracking}
          onEnded={handleEndedWithTracking}
          onTimeUpdate={handleTimeUpdateWithTracking}
          onDurationChange={handleDurationChange}
          onBufferStart={handleBufferStart}
          onBufferEnd={handleBufferEnd}
          onError={handleError}
        />
      </div>

      {/* Queue Panel */}
      <QueuePanel
        isOpen={isQueueOpen}
        onClose={() => setIsQueueOpen(false)}
        queue={queue}
        currentIndex={currentIndex}
        isPlaying={isPlaying}
        onTrackClick={jumpToTrack}
      />

      {/* Bottom Bar */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-[90] transition-transform duration-300 ease-out ${
          isVisible ? "translate-y-0" : "translate-y-full"
        }`}
        style={{
          background: "var(--player-bar-bg)",
          backdropFilter: "blur(20px)",
          borderTop: "1px solid var(--player-bar-border)",
        }}
      >
        {/* Main Controls - Two rows on mobile, single row on desktop */}
        <div className="px-2 sm:px-4 py-2 sm:py-3 flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
          {/* Row 1 (Mobile) / Left Section (Desktop): Thumbnail + Title + Wake Lock */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            {currentMedia.thumbnail_path && (
              <img
                src={`${currentMedia.thumbnail_path}?t=${thumbnailTimestamp}`}
                alt={currentMedia.filename}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded object-cover flex-shrink-0"
              />
            )}
            <div className="min-w-0 flex-1">
              <h3 className="theme-text-primary font-medium text-sm truncate">
                {currentMedia.filename}
              </h3>
              <p className="theme-text-muted text-xs">
                {formatDuration(currentTime)} / {formatDuration(duration)}
              </p>
            </div>

            {/* Wake Lock Toggle - 48px touch target */}
            <button
              onClick={() => setWakeLockEnabled(!isWakeLockEnabled)}
              className={`p-3 rounded-full transition-colors flex-shrink-0 ${
                isWakeLockEnabled
                  ? "theme-text-primary"
                  : "theme-text-muted hover:theme-text-primary"
              }`}
              style={
                isWakeLockEnabled
                  ? { background: "var(--player-bar-button-hover)" }
                  : {}
              }
              onMouseEnter={(e) =>
                !isWakeLockEnabled &&
                (e.currentTarget.style.background =
                  "var(--player-bar-button-hover)")
              }
              onMouseLeave={(e) =>
                !isWakeLockEnabled && (e.currentTarget.style.background = "")
              }
              title={
                isWakeLockEnabled ? "Keep screen awake" : "Allow screen sleep"
              }
              aria-label={
                isWakeLockEnabled
                  ? "Keep screen awake (enabled)"
                  : "Allow screen sleep (disabled)"
              }
            >
              {isWakeLockEnabled ? (
                <Monitor className="w-6 h-6" />
              ) : (
                <MonitorOff className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Row 2 (Mobile) / Center Section (Desktop): Playback Controls */}
          <div className="flex items-center justify-between md:justify-start w-full md:w-auto gap-2 sm:gap-3">
            {/* Left spacer for mobile centering - matches title section width from Row 1 */}
            <div className="md:hidden flex-1 min-w-0" />

            {/* Primary Controls - Centered on mobile, 48px touch targets */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <button
                onClick={playPrevious}
                disabled={!hasPrevious}
                className={`p-3 rounded-full transition-colors theme-text-primary ${
                  !hasPrevious && "opacity-30 cursor-not-allowed"
                }`}
                onMouseEnter={(e) =>
                  hasPrevious &&
                  (e.currentTarget.style.background =
                    "var(--player-bar-button-hover)")
                }
                onMouseLeave={(e) =>
                  hasPrevious && (e.currentTarget.style.background = "")
                }
                title="Previous"
                aria-label="Previous track"
              >
                <SkipBack className="w-6 h-6" />
              </button>

              <button
                onClick={togglePlayPause}
                className="p-3 sm:p-4 rounded-full transition-all hover:scale-105"
                style={{
                  background: "var(--btn-primary-bg)",
                  color: "var(--btn-primary-text)",
                }}
                title={isPlaying ? "Pause" : "Play"}
                aria-label={isPlaying ? "Pause playback" : "Play media"}
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6" fill="currentColor" />
                ) : (
                  <Play
                    className="w-6 h-6 translate-x-[1px]"
                    fill="currentColor"
                  />
                )}
              </button>

              <button
                onClick={playNext}
                disabled={!hasNext}
                className={`p-3 rounded-full transition-colors theme-text-primary ${
                  !hasNext && "opacity-30 cursor-not-allowed"
                }`}
                onMouseEnter={(e) =>
                  hasNext &&
                  (e.currentTarget.style.background =
                    "var(--player-bar-button-hover)")
                }
                onMouseLeave={(e) =>
                  hasNext && (e.currentTarget.style.background = "")
                }
                title="Next"
                aria-label="Next track"
              >
                <SkipForward className="w-6 h-6" />
              </button>
            </div>

            {/* Secondary Controls - Horizontally aligned with Row 1 wake lock toggle */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {/* Queue Position - Aligned with wake lock toggle above */}
              {queuePosition && (
                <div className="flex items-center justify-center h-12 w-12">
                  <span className="text-xs sm:text-sm theme-text-muted whitespace-nowrap">
                    {queuePosition.current} / {queuePosition.total}
                  </span>
                </div>
              )}

              {/* Queue Button - Desktop only (mobile uses Gallery as queue) */}
              {queue.length > 0 && (
                <button
                  onClick={() => setIsQueueOpen(!isQueueOpen)}
                  className={`hidden md:flex p-3 rounded-full transition-colors ${
                    isQueueOpen
                      ? "theme-text-primary"
                      : "theme-text-muted hover:theme-text-primary"
                  }`}
                  style={
                    isQueueOpen
                      ? { background: "var(--player-bar-button-hover)" }
                      : {}
                  }
                  onMouseEnter={(e) =>
                    !isQueueOpen &&
                    (e.currentTarget.style.background =
                      "var(--player-bar-button-hover)")
                  }
                  onMouseLeave={(e) =>
                    !isQueueOpen && (e.currentTarget.style.background = "")
                  }
                  title="Queue"
                  aria-label="View play queue"
                >
                  <List className="w-6 h-6" />
                </button>
              )}

              {/* Fullscreen Button (Video only) - 48px touch target */}
              {currentMedia?.media_type === "video" && (
                <button
                  onClick={toggleFullscreen}
                  className="p-3 rounded-full transition-colors theme-text-primary"
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      "var(--player-bar-button-hover)")
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                  title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                  aria-label={
                    isFullscreen ? "Exit fullscreen" : "Enter fullscreen"
                  }
                >
                  {isFullscreen ? (
                    <Minimize className="w-6 h-6" />
                  ) : (
                    <Maximize className="w-6 h-6" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Right Section (Desktop only): Volume Control */}
          <div className="hidden md:flex items-center gap-2 flex-1 justify-end">
            <button
              onClick={toggleMute}
              className="p-3 rounded-full transition-colors theme-text-primary"
              onMouseEnter={(e) =>
                (e.currentTarget.style.background =
                  "var(--player-bar-button-hover)")
              }
              onMouseLeave={(e) => (e.currentTarget.style.background = "")}
              title={isMuted ? "Unmute" : "Mute"}
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-6 h-6" />
              ) : (
                <Volume2 className="w-6 h-6" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="w-20 h-1 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, var(--btn-primary-bg) 0%, var(--btn-primary-bg) ${volume * 100}%, var(--player-progress-bg) ${volume * 100}%, var(--player-progress-bg) 100%)`,
              }}
            />
          </div>
        </div>

        {/* Progress Bar - Enhanced touch target for mobile, positioned at bottom for thumb accessibility */}
        <div
          className="w-full py-3.5 cursor-pointer group"
          onClick={handleProgressClick}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          role="slider"
          aria-label="Seek position"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={currentTime}
        >
          <div
            className="w-full h-4 rounded-full relative"
            style={{ background: "var(--player-progress-bg)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-100"
              style={{
                width: `${progress}%`,
                background: "var(--btn-primary-bg)",
              }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shadow-lg"
              style={{
                left: `${progress}%`,
                transform: "translate(-50%, -50%)",
                background: "var(--btn-primary-bg)",
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
