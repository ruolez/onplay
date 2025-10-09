import { useEffect, useState } from "react";
import { usePlayer } from "../contexts/PlayerContext";
import VideoPlayer from "./VideoPlayer";
import { mediaApi } from "../lib/api";
import { formatDuration } from "../lib/utils";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
  Maximize,
  Minimize,
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
    closePlayer,
    playerRef,
    setIsPlaying,
    setCurrentTime,
    setDuration,
  } = usePlayer();

  const [isVisible, setIsVisible] = useState(false);
  const [thumbnailTimestamp] = useState(Date.now());
  const [isMuted, setIsMuted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hasTriggeredFullscreen, setHasTriggeredFullscreen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Slide up animation when media loads
  useEffect(() => {
    if (currentMedia) {
      setTimeout(() => setIsVisible(true), 50);
    } else {
      setIsVisible(false);
    }
  }, [currentMedia]);

  // Reset fullscreen trigger when media changes
  useEffect(() => {
    setHasTriggeredFullscreen(false);
  }, [currentMedia?.id]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
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

  const trackEvent = async (eventType: string, data?: any) => {
    if (!currentMedia) return;

    try {
      await mediaApi.trackAnalytics(
        currentMedia.id,
        eventType,
        sessionId,
        data,
      );
    } catch (error) {
      console.error("Failed to track event:", error);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    seek(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (isMuted) {
      setVolume(1);
      setIsMuted(false);
    } else {
      setVolume(0);
      setIsMuted(true);
    }
  };

  const toggleFullscreen = () => {
    const player = playerRef.current?.getPlayer();
    if (!player) return;

    if (isFullscreen) {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    } else {
      // Enter fullscreen
      player
        .requestFullscreen()
        .catch((err) => console.log("Fullscreen request:", err));
    }
  };

  const handleTimeUpdate = (time: number) => {
    if (!isDragging) {
      setCurrentTime(time);
    }
    // Track progress milestones
    if (duration) {
      const progress = (time / duration) * 100;
      if (progress > 25 && progress < 26) trackEvent("progress_25");
      if (progress > 50 && progress < 51) trackEvent("progress_50");
      if (progress > 75 && progress < 76) trackEvent("progress_75");
    }
  };

  const handleEnded = async () => {
    await trackEvent("complete");
    if (hasNext) {
      playNext();
    }
  };

  if (!currentMedia) return null;

  const bestVariant = currentMedia.variants
    ? currentMedia.variants.sort((a, b) => b.bitrate - a.bitrate)[0]
    : null;
  const playerSrc = bestVariant ? bestVariant.path : "";

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      {/* Video Player - positioned off-screen but not hidden (required for fullscreen to work) */}
      <div className="fixed -top-[9999px] -left-[9999px] pointer-events-none">
        <VideoPlayer
          ref={playerRef}
          src={playerSrc}
          poster={
            currentMedia.thumbnail_path
              ? `${currentMedia.thumbnail_path}?t=${thumbnailTimestamp}`
              : undefined
          }
          autoplay={true}
          onPlay={() => {
            setIsPlaying(true);
            trackEvent("play");

            // Auto-fullscreen for video on first play
            if (
              currentMedia?.media_type === "video" &&
              !hasTriggeredFullscreen &&
              playerRef.current
            ) {
              const player = playerRef.current.getPlayer();
              if (player) {
                setHasTriggeredFullscreen(true);
                player
                  .requestFullscreen()
                  .catch((err) => console.log("Fullscreen request:", err));
              }
            }
          }}
          onPause={() => {
            setIsPlaying(false);
            trackEvent("pause");
          }}
          onEnded={handleEnded}
          onTimeUpdate={handleTimeUpdate}
          onDurationChange={setDuration}
        />
      </div>

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
        {/* Progress Bar */}
        <div
          className="w-full h-1 cursor-pointer group relative"
          style={{ background: "var(--player-progress-bg)" }}
          onClick={handleProgressClick}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
        >
          <div
            className="h-full transition-all duration-100"
            style={{
              width: `${progress}%`,
              background: "var(--btn-primary-bg)",
            }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              left: `${progress}%`,
              transform: "translate(-50%, -50%)",
              background: "var(--btn-primary-bg)",
            }}
          />
        </div>

        {/* Main Controls */}
        <div className="px-3 sm:px-4 py-3 flex items-center gap-2 sm:gap-4">
          {/* Left: Thumbnail + Info */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            {currentMedia.thumbnail_path && (
              <img
                src={`${currentMedia.thumbnail_path}?t=${thumbnailTimestamp}`}
                alt={currentMedia.filename}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded object-cover flex-shrink-0"
              />
            )}
            <div className="min-w-0 flex-1">
              <h3 className="theme-text-primary font-medium text-sm line-clamp-2 sm:truncate">
                {currentMedia.filename}
              </h3>
              <p className="theme-text-muted text-xs">
                {formatDuration(currentTime)} / {formatDuration(duration)}
              </p>
            </div>
          </div>

          {/* Center: Playback Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={playPrevious}
              disabled={!hasPrevious}
              className={`p-2 rounded-full transition-colors theme-text-primary ${
                !hasPrevious && "opacity-30 cursor-not-allowed"
              }`}
              style={
                hasPrevious
                  ? {
                      ["--tw-hover-bg" as any]: "var(--player-bar-button-hover)",
                    }
                  : {}
              }
              onMouseEnter={(e) =>
                hasPrevious &&
                (e.currentTarget.style.background =
                  "var(--player-bar-button-hover)")
              }
              onMouseLeave={(e) =>
                hasPrevious && (e.currentTarget.style.background = "")
              }
              title="Previous"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            <button
              onClick={togglePlayPause}
              className="p-2.5 rounded-full transition-all hover:scale-105"
              style={{
                background: "var(--btn-primary-bg)",
                color: "var(--btn-primary-text)",
              }}
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="w-6 h-6" fill="currentColor" />
              ) : (
                <Play className="w-6 h-6" fill="currentColor" />
              )}
            </button>

            <button
              onClick={playNext}
              disabled={!hasNext}
              className={`p-2 rounded-full transition-colors theme-text-primary ${
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
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          {/* Right: Volume + Queue Position + Close */}
          <div className="flex items-center gap-2 sm:gap-4 sm:flex-1 justify-end">
            {/* Queue Position */}
            {queuePosition && (
              <span className="text-sm theme-text-muted whitespace-nowrap hidden sm:block">
                {queuePosition.current} / {queuePosition.total}
              </span>
            )}

            {/* Volume Control (Desktop only) */}
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="p-2 rounded-full transition-colors theme-text-primary"
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background =
                    "var(--player-bar-button-hover)")
                }
                onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                title={isMuted ? "Unmute" : "Mute"}
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

            {/* Fullscreen Button (Video only) */}
            {currentMedia?.media_type === "video" && (
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-full transition-colors theme-text-primary"
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background =
                    "var(--player-bar-button-hover)")
                }
                onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? (
                  <Minimize className="w-5 h-5" />
                ) : (
                  <Maximize className="w-5 h-5" />
                )}
              </button>
            )}

            {/* Close Button */}
            <button
              onClick={closePlayer}
              className="p-2 rounded-full transition-colors theme-text-muted hover:theme-text-primary"
              onMouseEnter={(e) =>
                (e.currentTarget.style.background =
                  "var(--player-bar-button-hover)")
              }
              onMouseLeave={(e) => (e.currentTarget.style.background = "")}
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
