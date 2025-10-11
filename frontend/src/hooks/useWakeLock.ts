import { useEffect, useRef, useCallback } from "react";

const isIOS = () => {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
};

export function useWakeLock() {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const isActiveRef = useRef(false); // User wants wake lock active
  const noSleepVideoRef = useRef<HTMLVideoElement | null>(null);
  const usingFallbackRef = useRef(false);
  const retryTimeoutRef = useRef<number | null>(null);
  const retryCountRef = useRef(0);

  // Create fallback video element (silent video loop for iOS Safari)
  useEffect(() => {
    if (isIOS() && !noSleepVideoRef.current) {
      // Ensure document.body is ready
      if (!document.body) {
        console.warn(
          "[WakeLock] ⚠️ document.body not ready, deferring video creation",
        );
        return;
      }

      try {
        const video = document.createElement("video");
        video.setAttribute("playsinline", "");
        video.setAttribute("muted", "");
        video.setAttribute("loop", "");

        // Position at bottom right corner (visible but unobtrusive)
        // iOS Safari might not count off-screen videos
        video.style.position = "fixed";
        video.style.bottom = "0";
        video.style.right = "0";
        video.style.width = "10px";
        video.style.height = "10px";
        video.style.opacity = "0.01";
        video.style.zIndex = "-1";
        video.style.pointerEvents = "none";

        // Tiny base64 encoded MP4 (1 frame, silent)
        video.src =
          "data:video/mp4;base64,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";

        // Handle load errors
        video.addEventListener("error", (e) => {
          console.error("[WakeLock] ❌ Video fallback failed to load:", e);
        });

        // Load the video
        video.load();

        document.body.appendChild(video);
        noSleepVideoRef.current = video;

        console.log("[WakeLock] 📹 iOS video fallback element created");
      } catch (err) {
        console.error(
          "[WakeLock] ❌ Failed to create video fallback element:",
          err,
        );
      }
    }

    return () => {
      if (noSleepVideoRef.current) {
        noSleepVideoRef.current.pause();
        noSleepVideoRef.current.remove();
        noSleepVideoRef.current = null;
      }
    };
  }, []);

  // Request with retry logic
  const requestWakeLockWithRetry = useCallback(async (retryCount = 0) => {
    const iosDevice = isIOS();
    console.log("[WakeLock] 🔓 Requesting wake lock...");

    // Try Wake Lock API first (works on iOS 16.4+ Safari, Chrome, Edge)
    if ("wakeLock" in navigator) {
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
        retryCountRef.current = 0;

        console.log("[WakeLock] ✅ Native API activated");

        // Listen for release event (browser can release at any time)
        wakeLock.addEventListener("release", () => {
          console.log(
            "[WakeLock] 🔄 Browser released wake lock, re-acquiring...",
          );
          wakeLockRef.current = null;

          // Re-request if user still wants it active
          if (isActiveRef.current) {
            // Small delay before re-requesting
            setTimeout(() => {
              if (isActiveRef.current) {
                requestWakeLockWithRetry(0);
              }
            }, 500);
          }
        });

        return true;
      } catch (err: any) {
        console.warn(
          `[WakeLock] ⚠️ Native API failed: ${err.name} - ${err.message}`,
        );
        // Fall through to try fallback
      }
    }

    // Fallback for iOS or if Wake Lock API failed
    if (iosDevice) {
      if (!noSleepVideoRef.current) {
        console.error("[WakeLock] ❌ Video fallback element not available");
        return false;
      }

      try {
        console.log("[WakeLock] 🎬 Attempting video fallback for iOS...");
        const playPromise = noSleepVideoRef.current.play();

        if (playPromise !== undefined) {
          await playPromise;
        }

        isActiveRef.current = true;
        usingFallbackRef.current = true;
        retryCountRef.current = 0;

        console.log("[WakeLock] ✅ Video fallback activated (iOS)");
        return true;
      } catch (err: any) {
        console.error(
          `[WakeLock] ❌ Video fallback failed: ${err.name} - ${err.message}`,
        );

        // Retry with exponential backoff (max 3 attempts)
        if (retryCount < 2) {
          const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s
          console.log(
            `[WakeLock] 🔄 Retrying in ${delay}ms... (attempt ${retryCount + 2}/3)`,
          );

          retryTimeoutRef.current = window.setTimeout(() => {
            requestWakeLockWithRetry(retryCount + 1);
          }, delay);
        } else {
          console.error("[WakeLock] ❌ All retry attempts failed");
        }

        return false;
      }
    }

    console.warn("[WakeLock] ⚠️ Wake Lock not supported on this device");
    return false;
  }, []);

  const requestWakeLock = useCallback(async () => {
    // Clear any pending retries
    if (retryTimeoutRef.current !== null) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    retryCountRef.current = 0;
    await requestWakeLockWithRetry(0);
  }, [requestWakeLockWithRetry]);

  const releaseWakeLock = useCallback(async () => {
    console.log("[WakeLock] 📴 Releasing wake lock");
    isActiveRef.current = false;

    // Clear any pending retries
    if (retryTimeoutRef.current !== null) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    // Release native wake lock
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        console.log("[WakeLock] ✅ Native wake lock released");
      } catch (err) {
        console.error("[WakeLock] ❌ Failed to release native wake lock:", err);
      }
    }

    // Stop fallback video
    if (usingFallbackRef.current && noSleepVideoRef.current) {
      noSleepVideoRef.current.pause();
      usingFallbackRef.current = false;
      console.log("[WakeLock] ✅ Video fallback stopped");
    }
  }, []);

  // Re-acquire wake lock when page becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isActiveRef.current) {
        console.log(
          "[WakeLock] 👁️ Page visible again, re-requesting wake lock",
        );
        requestWakeLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [requestWakeLock]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current !== null) {
        clearTimeout(retryTimeoutRef.current);
      }
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
