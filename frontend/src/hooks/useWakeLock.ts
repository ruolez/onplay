import { useEffect, useRef, useCallback } from "react";

// Detect iOS devices (iPhone, iPad, iPod)
const isIOS = () => {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
};

export function useWakeLock() {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const isActiveRef = useRef(false);
  const noSleepVideoRef = useRef<HTMLVideoElement | null>(null);
  const usingFallbackRef = useRef(false);
  const videoReadyRef = useRef(false);

  // Create fallback video element (silent video loop for iOS Safari)
  useEffect(() => {
    if (isIOS() && !noSleepVideoRef.current) {
      const video = document.createElement("video");

      // CRITICAL: Set muted as property FIRST (iOS requires this)
      video.muted = true;
      video.playsInline = true;
      video.loop = true;
      video.preload = "auto";

      // Also set as attributes for HTML5 compliance
      video.setAttribute("muted", "");
      video.setAttribute("playsinline", "");
      video.setAttribute("loop", "");
      video.setAttribute("preload", "auto");

      // Hide video off-screen
      video.style.position = "absolute";
      video.style.left = "-9999px";
      video.style.top = "-9999px";
      video.style.width = "1px";
      video.style.height = "1px";
      video.style.opacity = "0.01";

      // Listen for when video is ready
      video.addEventListener("canplaythrough", () => {
        console.log("[WakeLock] Video ready (canplaythrough)");
        videoReadyRef.current = true;
      });

      video.addEventListener("loadeddata", () => {
        console.log("[WakeLock] Video loadeddata, readyState:", video.readyState);
      });

      video.addEventListener("error", (e) => {
        console.error("[WakeLock] Video error:", e);
      });

      // Use actual MP4 file instead of base64 (Safari handles this better)
      video.src = "/silence.mp4";

      // Add to DOM
      document.body.appendChild(video);
      noSleepVideoRef.current = video;

      // Start loading
      video.load();

      console.log("[WakeLock] Created iOS fallback video element");
    }

    return () => {
      if (noSleepVideoRef.current) {
        noSleepVideoRef.current.pause();
        noSleepVideoRef.current.remove();
        noSleepVideoRef.current = null;
        videoReadyRef.current = false;
      }
    };
  }, []);

  const requestWakeLock = useCallback(async () => {
    console.log("[WakeLock] Requesting wake lock, isIOS:", isIOS());

    // Try Wake Lock API first (but NOT on iOS - use video fallback instead)
    if ("wakeLock" in navigator && !isIOS()) {
      try {
        // Release existing wake lock if any
        if (wakeLockRef.current) {
          await wakeLockRef.current.release();
          wakeLockRef.current = null;
        }

        // Request new wake lock
        const wakeLock = await navigator.wakeLock.request("screen");
        wakeLockRef.current = wakeLock;
        isActiveRef.current = true;
        usingFallbackRef.current = false;

        console.log("[WakeLock] ✅ Activated (native API)");

        // Listen for release
        wakeLock.addEventListener("release", () => {
          console.log("[WakeLock] Released by browser (native API)");
        });

        return true;
      } catch (err) {
        console.warn("[WakeLock] Native API failed:", err);
      }
    }

    // iOS video fallback
    if (isIOS()) {
      const video = noSleepVideoRef.current;

      if (!video) {
        console.error("[WakeLock] ❌ Video element not found");
        return false;
      }

      try {
        // Ensure muted is set (critical for iOS autoplay)
        video.muted = true;

        console.log("[WakeLock] Video state - readyState:", video.readyState, "paused:", video.paused, "videoReady:", videoReadyRef.current);

        // If video isn't ready, wait for it
        if (video.readyState < 3) {
          console.log("[WakeLock] Waiting for video to be ready...");
          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error("Video load timeout"));
            }, 5000);

            const onReady = () => {
              clearTimeout(timeout);
              video.removeEventListener("canplaythrough", onReady);
              videoReadyRef.current = true;
              resolve();
            };

            if (video.readyState >= 3) {
              clearTimeout(timeout);
              videoReadyRef.current = true;
              resolve();
            } else {
              video.addEventListener("canplaythrough", onReady);
              // Trigger load again just in case
              video.load();
            }
          });
        }

        console.log("[WakeLock] Attempting video.play()...");

        // Play the video
        await video.play();

        isActiveRef.current = true;
        usingFallbackRef.current = true;
        console.log("[WakeLock] ✅ Activated (iOS video fallback)");
        return true;
      } catch (err: any) {
        console.error("[WakeLock] ❌ Video fallback failed:", err.name, err.message);
        return false;
      }
    }

    console.warn("[WakeLock] No wake lock method available");
    return false;
  }, []);

  const releaseWakeLock = useCallback(async () => {
    isActiveRef.current = false;

    // Release native wake lock
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        console.log("[WakeLock] Released (native API)");
      } catch (err) {
        console.error("[WakeLock] Failed to release:", err);
      }
    }

    // Stop fallback video
    if (usingFallbackRef.current && noSleepVideoRef.current) {
      noSleepVideoRef.current.pause();
      usingFallbackRef.current = false;
      console.log("[WakeLock] Released (video fallback)");
    }
  }, []);

  // Re-acquire wake lock when page becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isActiveRef.current) {
        console.log("[WakeLock] Page visible, re-requesting");
        requestWakeLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [requestWakeLock]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(console.error);
      }
      if (noSleepVideoRef.current) {
        noSleepVideoRef.current.pause();
      }
    };
  }, []);

  return {
    requestWakeLock,
    releaseWakeLock,
    isSupported: "wakeLock" in navigator || isIOS(),
  };
}
