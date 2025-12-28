import { useEffect, useMemo } from "react";
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
  // Generate stable thumbnail URL - only changes when media ID or thumbnail path changes
  // This prevents lock screen flickering from Date.now() generating new URLs on every render
  const thumbnailUrl = useMemo(() => {
    if (!currentMedia?.thumbnail_path) return null;
    return `${window.location.origin}${currentMedia.thumbnail_path}?t=${Date.now()}`;
  }, [currentMedia?.id, currentMedia?.thumbnail_path]);

  // Effect for metadata - only runs when media or thumbnail URL changes
  useEffect(() => {
    if (!("mediaSession" in navigator)) {
      return;
    }

    if (!currentMedia) {
      navigator.mediaSession.metadata = null;
      return;
    }

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentMedia.filename,
      artist: "OnPlay",
      album: currentMedia.media_type === "video" ? "Videos" : "Audio",
      artwork: thumbnailUrl
        ? [
            {
              src: thumbnailUrl,
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
  }, [currentMedia, thumbnailUrl]);

  // Effect for action handlers - separate from metadata to avoid thumbnail refresh
  useEffect(() => {
    if (!("mediaSession" in navigator) || !currentMedia) {
      return;
    }

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
