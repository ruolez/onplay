import { useEffect, useState, useCallback, useRef } from "react";
import { usePlayer } from "../contexts/PlayerContext";
import DualVideoPlayer from "./DualVideoPlayer";
import QueuePanel from "./QueuePanel";
import { mediaApi } from "../lib/api";
import { formatDuration } from "../lib/utils";
import { useHaptics } from "../hooks/useHaptics";
import { useSwipeGesture } from "../hooks/useSwipeGesture";
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
  Loader2,
  ChevronDown,
  X,
  Music,
  Video,
  Info,
} from "lucide-react";
import { WakeLockInfoModal } from "./WakeLockInfoModal";

export default function PersistentPlayer() {
  const {
    currentMedia,
    sessionId,
    isPlaying,
    isBuffering,
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
    isWakeLockActive,
    wakeLockFailureReason,
    isBrokenIOSPWA,
    showWakeLockInfoModal,
    setWakeLockEnabled,
    setShowWakeLockInfoModal,
    closePlayer,
  } = usePlayer();

  const [isVisible, setIsVisible] = useState(false);
  const [thumbnailTimestamp] = useState(Date.now());
  const [isMuted, setIsMuted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const haptics = useHaptics();
  const miniPlayerRef = useRef<HTMLDivElement>(null);
  const expandedPlayerRef = useRef<HTMLDivElement>(null);

  // Swipe gesture for mini player (left/right for tracks, up to expand)
  const miniPlayerGestures = useSwipeGesture({
    threshold: 50,
    maxTime: 300,
    onSwipeLeft: () => {
      if (hasPrevious) {
        haptics.trackChange();
        playPrevious();
      }
    },
    onSwipeRight: () => {
      if (hasNext) {
        haptics.trackChange();
        playNext();
      }
    },
    onSwipeUp: () => {
      haptics.gestureComplete();
      setIsExpanded(true);
    },
  });

  // Swipe gesture for expanded player (down to collapse)
  const expandedPlayerGestures = useSwipeGesture({
    threshold: 80,
    maxTime: 400,
    onSwipeDown: () => {
      haptics.gestureComplete();
      setIsExpanded(false);
    },
    onSwipeLeft: () => {
      if (hasPrevious) {
        haptics.trackChange();
        playPrevious();
      }
    },
    onSwipeRight: () => {
      if (hasNext) {
        haptics.trackChange();
        playNext();
      }
    },
  });

  // Slide up animation when media loads
  useEffect(() => {
    if (currentMedia) {
      setTimeout(() => setIsVisible(true), 50);
    } else {
      setIsVisible(false);
      setIsQueueOpen(false);
      setIsExpanded(false);
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

  // Prevent body scroll when expanded
  useEffect(() => {
    if (isExpanded) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isExpanded]);

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
      haptics.buttonPress();
      seek(newTime);
    },
    [duration, seek, haptics],
  );

  const handleExpandedProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!duration) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      const newTime = percent * duration;
      haptics.buttonPress();
      seek(newTime);
    },
    [duration, seek, haptics],
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
    haptics.buttonPress();
    if (isMuted) {
      setVolume(1);
      setIsMuted(false);
    } else {
      setVolume(0);
      setIsMuted(true);
    }
  }, [isMuted, setVolume, haptics]);

  const toggleFullscreen = useCallback(() => {
    const player = playerRef.current?.getPlayer();
    if (!player) return;

    haptics.buttonPress();
    if (isFullscreen) {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    } else {
      player.requestFullscreen().catch(() => {});
    }
  }, [isFullscreen, playerRef, haptics]);

  const handleTogglePlayPause = useCallback(() => {
    haptics.playPause();
    togglePlayPause();
  }, [togglePlayPause, haptics]);

  const handlePlayNext = useCallback(() => {
    if (hasNext) {
      haptics.trackChange();
      playNext();
    }
  }, [hasNext, playNext, haptics]);

  const handlePlayPrevious = useCallback(() => {
    if (hasPrevious) {
      haptics.trackChange();
      playPrevious();
    }
  }, [hasPrevious, playPrevious, haptics]);

  const handleClose = useCallback(() => {
    haptics.buttonPress();
    setIsExpanded(false);
    closePlayer();
  }, [closePlayer, haptics]);

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

  // Use master playlist for adaptive bitrate streaming
  const playerSrc = `/media/hls/${currentMedia.id}/master.m3u8`;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const isAudio = currentMedia.media_type === "audio";

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

      {/* Expanded Full-Screen Player */}
      <div
        ref={expandedPlayerRef}
        className={`fixed inset-0 z-[100] flex flex-col transition-transform duration-300 ease-out ${
          isExpanded ? "translate-y-0" : "translate-y-full"
        }`}
        style={{
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          height: "100dvh",
          background:
            "linear-gradient(180deg, var(--bg-primary) 0%, rgba(0,0,0,0.98) 100%)",
        }}
        {...expandedPlayerGestures.handlers}
      >
        {/* Header - Fixed */}
        <div
          className="flex-shrink-0 flex items-center justify-between px-4 py-2"
          style={{ paddingTop: "max(8px, env(safe-area-inset-top))" }}
        >
          <button
            onClick={() => {
              haptics.buttonPress();
              setIsExpanded(false);
            }}
            className="p-2 -ml-2 rounded-full transition-colors"
            style={{ background: "var(--player-bar-button-hover)" }}
            aria-label="Collapse player"
          >
            <ChevronDown className="w-6 h-6 theme-text-primary" />
          </button>

          <span className="text-xs theme-text-muted uppercase tracking-wider font-medium">
            Now Playing
          </span>

          <button
            onClick={handleClose}
            className="p-2 -mr-2 rounded-full transition-colors hover:bg-white/10"
            aria-label="Close player"
          >
            <X className="w-6 h-6 theme-text-muted" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div
          className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col items-center px-6"
          style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}
        >
          {/* Album Art / Video Thumbnail */}
          <div
            className="relative w-full max-w-[240px] aspect-square rounded-2xl overflow-hidden shadow-2xl mt-2 flex-shrink-0"
            style={{
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            }}
          >
            {currentMedia.thumbnail_path ? (
              <img
                src={`${currentMedia.thumbnail_path}?t=${thumbnailTimestamp}`}
                alt={currentMedia.filename}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                }}
              >
                {isAudio ? (
                  <Music className="w-20 h-20 text-white/80" />
                ) : (
                  <Video className="w-20 h-20 text-white/80" />
                )}
              </div>
            )}
          </div>

          {/* Track Info */}
          <div className="w-full max-w-[300px] mt-4 text-center flex-shrink-0">
            <h2 className="text-lg font-bold theme-text-primary truncate">
              {currentMedia.filename.replace(/\.[^/.]+$/, "")}
            </h2>
            <p className="text-sm theme-text-muted mt-1 flex items-center justify-center gap-2">
              {isAudio ? (
                <Music className="w-4 h-4" />
              ) : (
                <Video className="w-4 h-4" />
              )}
              {isAudio ? "Audio" : "Video"}
              {queuePosition && (
                <span className="ml-2">
                  • {queuePosition.current} of {queuePosition.total}
                </span>
              )}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full max-w-[300px] mt-5 flex-shrink-0">
            <div
              className="w-full h-4 rounded-full cursor-pointer group"
              style={{ background: "var(--player-progress-bg)" }}
              onClick={handleExpandedProgressClick}
            >
              <div
                className="h-full rounded-full transition-all relative"
                style={{
                  width: `${progress}%`,
                  background: "var(--btn-primary-bg)",
                }}
              >
                <div
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full opacity-100 transition-opacity shadow-lg"
                  style={{
                    background: "var(--btn-primary-bg)",
                    transform: "translate(50%, -50%)",
                  }}
                />
              </div>
            </div>
            <div className="flex justify-between mt-1.5 text-xs theme-text-muted">
              <span>{formatDuration(currentTime)}</span>
              <span>{formatDuration(duration)}</span>
            </div>
          </div>

          {/* Main Controls */}
          <div className="flex items-center justify-center gap-6 mt-5 flex-shrink-0">
            <button
              onClick={handlePlayPrevious}
              disabled={!hasPrevious}
              className={`p-4 rounded-full transition-all theme-text-primary ${
                !hasPrevious && "opacity-30 cursor-not-allowed"
              }`}
              aria-label="Previous track"
            >
              <SkipBack className="w-8 h-8" fill="currentColor" />
            </button>

            <button
              onClick={handleTogglePlayPause}
              className="p-5 rounded-full transition-all hover:scale-105 active:scale-95"
              style={{
                background: "var(--btn-primary-bg)",
                color: "var(--btn-primary-text)",
              }}
              aria-label={
                isBuffering ? "Buffering" : isPlaying ? "Pause" : "Play"
              }
            >
              {isBuffering ? (
                <Loader2 className="w-10 h-10 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-10 h-10" fill="currentColor" />
              ) : (
                <Play
                  className="w-10 h-10 translate-x-[2px]"
                  fill="currentColor"
                />
              )}
            </button>

            <button
              onClick={handlePlayNext}
              disabled={!hasNext}
              className={`p-4 rounded-full transition-all theme-text-primary ${
                !hasNext && "opacity-30 cursor-not-allowed"
              }`}
              aria-label="Next track"
            >
              <SkipForward className="w-8 h-8" fill="currentColor" />
            </button>
          </div>

          {/* Secondary Controls */}
          <div className="flex items-center justify-center gap-4 mt-4 flex-shrink-0">
            {/* Wake Lock */}
            <button
              onClick={() => {
                haptics.buttonPress();
                setWakeLockEnabled(!isWakeLockEnabled);
              }}
              className={`p-3 rounded-full transition-colors ${
                isWakeLockEnabled && isWakeLockActive
                  ? "theme-text-primary bg-white/10"
                  : isWakeLockEnabled && !isWakeLockActive
                    ? "text-orange-400 bg-orange-400/10"
                    : "theme-text-muted"
              }`}
              aria-label={
                isWakeLockEnabled && isWakeLockActive
                  ? "Screen wake active"
                  : isWakeLockEnabled && !isWakeLockActive
                    ? "Screen wake failed"
                    : "Screen wake disabled"
              }
              title={
                isWakeLockEnabled && isWakeLockActive
                  ? "Screen staying awake"
                  : isWakeLockEnabled && !isWakeLockActive
                    ? "Wake lock failed - tap to retry"
                    : "Allow screen to sleep"
              }
            >
              {isWakeLockEnabled ? (
                <Monitor className="w-5 h-5" />
              ) : (
                <MonitorOff className="w-5 h-5" />
              )}
            </button>

            {/* Fullscreen (Video only) */}
            {!isAudio && (
              <button
                onClick={toggleFullscreen}
                className="p-3 rounded-full transition-colors theme-text-muted hover:theme-text-primary"
                aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? (
                  <Minimize className="w-5 h-5" />
                ) : (
                  <Maximize className="w-5 h-5" />
                )}
              </button>
            )}

            {/* Volume (Desktop) */}
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="p-3 rounded-full transition-colors theme-text-muted hover:theme-text-primary"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
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

          {/* Swipe Hint */}
          <div className="text-center mt-4 pb-4 flex-shrink-0">
            <p className="text-xs theme-text-muted">
              Swipe down to minimize • Swipe left/right to change tracks
            </p>
          </div>
        </div>
      </div>

      {/* Mini Player Bottom Bar */}
      <div
        ref={miniPlayerRef}
        className={`fixed left-0 right-0 z-[90] transition-transform duration-300 ease-out bottom-[68px] xs:bottom-[72px] md:bottom-0 ${
          isVisible && !isExpanded ? "translate-y-0" : "translate-y-full"
        }`}
        style={{
          background: "var(--player-bar-bg)",
          backdropFilter: "blur(20px)",
          borderTop: "1px solid var(--player-bar-border)",
        }}
        {...miniPlayerGestures.handlers}
      >
        {/* Drag Handle Indicator */}
        <div className="flex justify-center pt-2">
          <div
            className="w-10 h-1 rounded-full bg-white/20"
            onClick={() => {
              haptics.buttonPress();
              setIsExpanded(true);
            }}
          />
        </div>

        {/* Main Controls - Two rows on mobile, single row on desktop */}
        <div className="px-2 xs:px-3 sm:px-4 py-2 sm:py-3 flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
          {/* Row 1 (Mobile) / Left Section (Desktop): Thumbnail + Title + Wake Lock */}
          <div
            className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 cursor-pointer"
            onClick={() => {
              haptics.buttonPress();
              setIsExpanded(true);
            }}
          >
            {currentMedia.thumbnail_path ? (
              <img
                src={`${currentMedia.thumbnail_path}?t=${thumbnailTimestamp}`}
                alt={currentMedia.filename}
                className="w-10 h-10 xs:w-12 xs:h-12 sm:w-14 sm:h-14 rounded object-cover flex-shrink-0"
              />
            ) : (
              <div
                className="w-10 h-10 xs:w-12 xs:h-12 sm:w-14 sm:h-14 rounded flex-shrink-0 flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                }}
              >
                {isAudio ? (
                  <Music className="w-6 h-6 text-white/80" />
                ) : (
                  <Video className="w-6 h-6 text-white/80" />
                )}
              </div>
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
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  haptics.buttonPress();
                  // If broken iOS PWA, show info modal instead of toggling
                  if (isBrokenIOSPWA && !isWakeLockEnabled) {
                    setShowWakeLockInfoModal(true);
                  } else {
                    setWakeLockEnabled(!isWakeLockEnabled);
                  }
                }}
                className={`p-3 rounded-full transition-colors ${
                  isWakeLockEnabled && isWakeLockActive
                    ? "theme-text-primary"
                    : isWakeLockEnabled && !isWakeLockActive
                      ? "text-orange-400"
                      : wakeLockFailureReason
                        ? "text-orange-400"
                        : "theme-text-muted hover:theme-text-primary"
                }`}
                style={
                  isWakeLockEnabled && isWakeLockActive
                    ? { background: "var(--player-bar-button-hover)" }
                    : isWakeLockEnabled && !isWakeLockActive
                      ? { background: "rgba(251, 146, 60, 0.1)" }
                      : wakeLockFailureReason
                        ? { background: "rgba(251, 146, 60, 0.1)" }
                        : {}
                }
                onMouseEnter={(e) =>
                  !isWakeLockEnabled &&
                  !wakeLockFailureReason &&
                  (e.currentTarget.style.background =
                    "var(--player-bar-button-hover)")
                }
                onMouseLeave={(e) =>
                  !isWakeLockEnabled &&
                  !wakeLockFailureReason &&
                  (e.currentTarget.style.background = "")
                }
                title={
                  isWakeLockEnabled && isWakeLockActive
                    ? "Screen staying awake"
                    : wakeLockFailureReason
                      ? "Wake lock unavailable - tap for info"
                      : isWakeLockEnabled && !isWakeLockActive
                        ? "Wake lock failed - tap to retry"
                        : "Allow screen to sleep"
                }
                aria-label={
                  isWakeLockEnabled && isWakeLockActive
                    ? "Screen wake active"
                    : wakeLockFailureReason
                      ? "Screen wake unavailable"
                      : isWakeLockEnabled && !isWakeLockActive
                        ? "Screen wake failed"
                        : "Screen wake disabled"
                }
              >
                {isWakeLockEnabled ? (
                  <Monitor className="w-6 h-6" />
                ) : (
                  <MonitorOff className="w-6 h-6" />
                )}
              </button>
              {/* Info button when wake lock has failure reason */}
              {wakeLockFailureReason && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    haptics.buttonPress();
                    setShowWakeLockInfoModal(true);
                  }}
                  className="p-2 rounded-full text-orange-400 hover:bg-orange-400/10 transition-colors"
                  title="Learn why wake lock is unavailable"
                  aria-label="Wake lock info"
                >
                  <Info className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Row 2 (Mobile) / Center Section (Desktop): Playback Controls */}
          <div className="flex items-center md:justify-start w-full md:w-auto gap-2 sm:gap-3">
            {/* Mobile layout: 48px spacer + flex-1 buttons + 48px queue (mirrors Row 1 exactly) */}
            {/* Invisible spacer (Mobile only) - Mirrors Row 1's thumbnail */}
            <div className="md:hidden w-10 h-10 xs:w-12 xs:h-12 flex-shrink-0" />

            {/* Centered play buttons within flex-1 (Mobile only) - Mirrors Row 1's title section */}
            <div className="md:hidden flex-1 min-w-0 flex items-center justify-center">
              {/* Primary Controls - Centered within flex-1 section */}
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={handlePlayPrevious}
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
                  onClick={handleTogglePlayPause}
                  className="p-3 sm:p-4 rounded-full transition-all hover:scale-105"
                  style={{
                    background: "var(--btn-primary-bg)",
                    color: "var(--btn-primary-text)",
                  }}
                  title={
                    isBuffering ? "Buffering..." : isPlaying ? "Pause" : "Play"
                  }
                  aria-label={
                    isBuffering
                      ? "Buffering media"
                      : isPlaying
                        ? "Pause playback"
                        : "Play media"
                  }
                >
                  {isBuffering ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="w-6 h-6" fill="currentColor" />
                  ) : (
                    <Play
                      className="w-6 h-6 translate-x-[1px]"
                      fill="currentColor"
                    />
                  )}
                </button>

                <button
                  onClick={handlePlayNext}
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
            </div>

            {/* Queue Position (Mobile only) - 48px width, aligned with wake lock */}
            {queuePosition && (
              <div className="md:hidden flex items-center justify-center h-12 w-12 flex-shrink-0">
                <span className="text-xs sm:text-sm theme-text-muted whitespace-nowrap">
                  {queuePosition.current} / {queuePosition.total}
                </span>
              </div>
            )}

            {/* Desktop play buttons */}
            <div className="hidden md:flex items-center gap-2 sm:gap-3">
              <button
                onClick={handlePlayPrevious}
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
                onClick={handleTogglePlayPause}
                className="p-3 sm:p-4 rounded-full transition-all hover:scale-105"
                style={{
                  background: "var(--btn-primary-bg)",
                  color: "var(--btn-primary-text)",
                }}
                title={
                  isBuffering ? "Buffering..." : isPlaying ? "Pause" : "Play"
                }
                aria-label={
                  isBuffering
                    ? "Buffering media"
                    : isPlaying
                      ? "Pause playback"
                      : "Play media"
                }
              >
                {isBuffering ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-6 h-6" fill="currentColor" />
                ) : (
                  <Play
                    className="w-6 h-6 translate-x-[1px]"
                    fill="currentColor"
                  />
                )}
              </button>

              <button
                onClick={handlePlayNext}
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

            {/* Desktop-only controls */}
            <div className="hidden md:flex items-center gap-2 sm:gap-3">
              {queuePosition && (
                <span className="text-xs sm:text-sm theme-text-muted whitespace-nowrap">
                  {queuePosition.current} / {queuePosition.total}
                </span>
              )}

              {/* Queue Button - Desktop only */}
              {queue.length > 0 && (
                <button
                  onClick={() => setIsQueueOpen(!isQueueOpen)}
                  className={`p-3 rounded-full transition-colors ${
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

              {/* Fullscreen Button (Video only) */}
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

        {/* Progress Bar - Full width at very bottom of mini player */}
        <div
          className="w-full h-4 mt-3 cursor-pointer"
          onClick={handleProgressClick}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          role="slider"
          aria-label="Seek position"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={currentTime}
          style={{ background: "rgba(255,255,255,0.2)" }}
        >
          <div
            className="h-full transition-all duration-100"
            style={{
              width: `${progress}%`,
              background: "var(--btn-primary-bg)",
            }}
          />
        </div>
      </div>

      {/* Wake Lock Info Modal */}
      <WakeLockInfoModal
        isOpen={showWakeLockInfoModal}
        onClose={() => {
          setShowWakeLockInfoModal(false);
          // Mark as dismissed for this session
          sessionStorage.setItem("wake-lock-info-dismissed", "true");
        }}
        failureReason={wakeLockFailureReason}
      />
    </>
  );
}
