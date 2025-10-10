import { useEffect } from "react";
import type { Media } from "../lib/api";

export interface MediaSessionHandlers {
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeekBackward: (offset: number) => void;
  onSeekForward: (offset: number) => void;
  onSeekTo: (time: number) => void;
}

export function useMediaSession(
  currentMedia: Media | null,
  hasNext: boolean,
  hasPrevious: boolean,
  handlers: MediaSessionHandlers,
) {
  useEffect(() => {
    if (!("mediaSession" in navigator)) {
      return;
    }

    if (!currentMedia) {
      // Clear metadata when no media
      navigator.mediaSession.metadata = null;
      return;
    }

    // Set metadata
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentMedia.filename,
      artist: "OnPlay",
      album: currentMedia.media_type === "video" ? "Videos" : "Audio",
      artwork: currentMedia.thumbnail_path
        ? [
            {
              src: `${window.location.origin}${currentMedia.thumbnail_path}?t=${Date.now()}`,
              sizes: "512x512",
              type: "image/jpeg",
            },
          ]
        : [
            {
              src: "/placeholder-thumbnail.jpg",
              sizes: "512x512",
              type: "image/jpeg",
            },
          ],
    });

    // Set action handlers
    navigator.mediaSession.setActionHandler("play", () => {
      handlers.onPlay();
    });

    navigator.mediaSession.setActionHandler("pause", () => {
      handlers.onPause();
    });

    navigator.mediaSession.setActionHandler(
      "nexttrack",
      hasNext
        ? () => {
            handlers.onNext();
          }
        : null,
    );

    navigator.mediaSession.setActionHandler(
      "previoustrack",
      hasPrevious
        ? () => {
            handlers.onPrevious();
          }
        : null,
    );

    navigator.mediaSession.setActionHandler("seekbackward", (details) => {
      const offset = details.seekOffset || 10;
      handlers.onSeekBackward(offset);
    });

    navigator.mediaSession.setActionHandler("seekforward", (details) => {
      const offset = details.seekOffset || 10;
      handlers.onSeekForward(offset);
    });

    navigator.mediaSession.setActionHandler("seekto", (details) => {
      if (details.seekTime !== null && details.seekTime !== undefined) {
        handlers.onSeekTo(details.seekTime);
      }
    });

    return () => {
      // Clean up action handlers
      if ("mediaSession" in navigator) {
        navigator.mediaSession.setActionHandler("play", null);
        navigator.mediaSession.setActionHandler("pause", null);
        navigator.mediaSession.setActionHandler("nexttrack", null);
        navigator.mediaSession.setActionHandler("previoustrack", null);
        navigator.mediaSession.setActionHandler("seekbackward", null);
        navigator.mediaSession.setActionHandler("seekforward", null);
        navigator.mediaSession.setActionHandler("seekto", null);
      }
    };
  }, [currentMedia, hasNext, hasPrevious, handlers]);

  // Update playback state
  useEffect(() => {
    if (!("mediaSession" in navigator) || !currentMedia) {
      return;
    }

    // This will be controlled by the player's play/pause events
    // The state is managed automatically by the browser based on the media element
  }, [currentMedia]);
}

/**
 * Update Media Session position state
 * Call this when playback time or duration changes
 */
export function updateMediaSessionPosition(
  currentTime: number,
  duration: number,
  playbackRate: number = 1,
) {
  if (!("mediaSession" in navigator)) {
    return;
  }

  // Validate values before setting position state
  if (
    !duration ||
    duration <= 0 ||
    !isFinite(duration) ||
    !isFinite(currentTime) ||
    currentTime < 0
  ) {
    return;
  }

  // Clamp currentTime to duration to prevent API errors
  const validPosition = Math.min(currentTime, duration);

  if ("setPositionState" in navigator.mediaSession) {
    try {
      navigator.mediaSession.setPositionState({
        duration,
        playbackRate,
        position: validPosition,
      });
    } catch (error) {
      // Ignore errors (can happen if values are invalid)
      console.warn("[MediaSession] Failed to set position state:", error);
    }
  }
}
