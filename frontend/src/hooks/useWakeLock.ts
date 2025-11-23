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

  // Create fallback video element (silent video loop for iOS Safari)
  useEffect(() => {
    if (isIOS() && !noSleepVideoRef.current) {
      const video = document.createElement("video");

      // CRITICAL: Set muted as property FIRST (iOS requires this)
      video.muted = true;
      video.playsInline = true;
      video.loop = true;

      // Also set as attributes for HTML5 compliance
      video.setAttribute("muted", "");
      video.setAttribute("playsinline", "");
      video.setAttribute("loop", "");

      // Hide video off-screen
      video.style.position = "absolute";
      video.style.left = "-9999px";
      video.style.top = "-9999px";
      video.style.width = "1px";
      video.style.height = "1px";
      video.style.opacity = "0.01";

      // Tiny base64 encoded MP4 (NoSleep.js pattern - known to work on iOS)
      video.src =
        "data:video/mp4;base64,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";

      // Add to DOM first
      document.body.appendChild(video);
      noSleepVideoRef.current = video;

      // Load the video
      video.load();

      console.log("[WakeLock] Created iOS fallback video element");
    }

    return () => {
      if (noSleepVideoRef.current) {
        noSleepVideoRef.current.pause();
        noSleepVideoRef.current.remove();
        noSleepVideoRef.current = null;
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

        console.log("[WakeLock] Attempting video.play(), readyState:", video.readyState);

        // Play the video
        const playPromise = video.play();

        if (playPromise !== undefined) {
          await playPromise;
        }

        isActiveRef.current = true;
        usingFallbackRef.current = true;
        console.log("[WakeLock] ✅ Activated (iOS video fallback)");
        return true;
      } catch (err: any) {
        console.error("[WakeLock] ❌ Video fallback failed:", err.name, err.message);

        // If NotSupportedError, try alternative approach - reload and retry
        if (err.name === "NotSupportedError") {
          console.log("[WakeLock] Trying reload + play...");
          try {
            video.load();
            // Wait a tick for load to process
            await new Promise(resolve => setTimeout(resolve, 100));
            video.muted = true;
            await video.play();
            isActiveRef.current = true;
            usingFallbackRef.current = true;
            console.log("[WakeLock] ✅ Activated on retry (iOS video fallback)");
            return true;
          } catch (retryErr) {
            console.error("[WakeLock] ❌ Retry also failed:", retryErr);
          }
        }

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
