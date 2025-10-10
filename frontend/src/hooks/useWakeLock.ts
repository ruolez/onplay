import { useEffect, useRef, useCallback } from "react";

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
      video.setAttribute("playsinline", "");
      video.setAttribute("muted", "");
      video.setAttribute("loop", "");
      video.setAttribute("autoplay", ""); // Try autoplay to help with initialization

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

      // Load the video
      video.load();

      document.body.appendChild(video);
      noSleepVideoRef.current = video;
      console.log("[WakeLock] Created fallback video element for iOS");

      // Try to play it immediately (won't work until user gesture, but prepares it)
      video.play().catch((err) => {
        console.log(
          "[WakeLock] Initial video play blocked (expected):",
          err.message,
        );
      });
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
    const iosDevice = isIOS();
    console.log(
      `[WakeLock] requestWakeLock called - iOS: ${iosDevice}, API supported: ${"wakeLock" in navigator}`,
    );

    // Try Wake Lock API first (works on iOS 16.4+ Safari in some cases)
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

        console.log("[WakeLock] ✅ Wake lock activated (native API)");

        // Listen for release
        wakeLock.addEventListener("release", () => {
          console.log("[WakeLock] Wake lock released (native API)");
        });

        return;
      } catch (err: any) {
        console.warn(
          `[WakeLock] ⚠️ Native API failed: ${err.name} - ${err.message}`,
        );
      }
    }

    // Fallback for iOS or if Wake Lock API failed
    if (iosDevice) {
      if (!noSleepVideoRef.current) {
        console.error(
          "[WakeLock] ❌ Video fallback not ready (element not created)",
        );
        return;
      }

      try {
        console.log(
          `[WakeLock] Attempting video fallback - video ready state: ${noSleepVideoRef.current.readyState}`,
        );
        const playPromise = noSleepVideoRef.current.play();

        if (playPromise !== undefined) {
          await playPromise;
        }

        isActiveRef.current = true;
        usingFallbackRef.current = true;
        console.log(
          "[WakeLock] ✅ Wake lock activated (video fallback for iOS)",
        );
      } catch (err: any) {
        console.error(
          `[WakeLock] ❌ Fallback video failed: ${err.name} - ${err.message}`,
        );
      }
    } else {
      console.warn(
        "[WakeLock] ⚠️ Wake Lock API not supported and not on iOS - no fallback available",
      );
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    isActiveRef.current = false;

    // Release native wake lock
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        console.log("[WakeLock] Wake lock manually released (native API)");
      } catch (err) {
        console.error("[WakeLock] Failed to release wake lock:", err);
      }
    }

    // Stop fallback video
    if (usingFallbackRef.current && noSleepVideoRef.current) {
      noSleepVideoRef.current.pause();
      usingFallbackRef.current = false;
      console.log("[WakeLock] Wake lock manually released (video fallback)");
    }
  }, []);

  // Re-acquire wake lock when page becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isActiveRef.current) {
        console.log("[WakeLock] Page visible again, re-requesting wake lock");
        requestWakeLock();
      } else if (document.visibilityState === "hidden") {
        console.log("[WakeLock] Page hidden");
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
