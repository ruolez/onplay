import { useState, useEffect, useRef, useCallback } from "react";

// Detect iOS devices (iPhone, iPad, iPod)
const isIOS = () => {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
};

export function useWakeLock() {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track if user wants wake lock enabled (for re-acquisition after visibility change)
  const userWantsWakeLockRef = useRef(false);

  // iOS video fallback refs
  const noSleepVideoRef = useRef<HTMLVideoElement | null>(null);
  const usingFallbackRef = useRef(false);

  // Check support - true if native API available OR if iOS (video fallback)
  const isSupported = ("wakeLock" in navigator) || isIOS();

  // Log initial setup info
  useEffect(() => {
    console.log("[WakeLock] 🔧 Initializing wake lock hook");
    console.log("[WakeLock] Browser support:", {
      hasNativeAPI: "wakeLock" in navigator,
      isIOS: isIOS(),
      willUseFallback: isIOS(),
      userAgent: navigator.userAgent,
    });
  }, []);

  // Track if video is ready to play
  const videoReadyRef = useRef(false);

  // Create fallback video element for iOS (silent video loop keeps screen awake)
  useEffect(() => {
    if (isIOS() && !noSleepVideoRef.current) {
      // Ensure document.body is ready
      if (!document.body) {
        console.warn("[WakeLock] ⚠️ document.body not ready, deferring video creation");
        return;
      }

      try {
        const video = document.createElement("video");

        // Set attributes (for HTML)
        video.setAttribute("playsinline", "");
        video.setAttribute("muted", "");
        video.setAttribute("loop", "");
        video.setAttribute("preload", "auto");

        // Set properties (for JavaScript) - iOS needs both
        video.muted = true;
        video.playsInline = true;
        video.loop = true;
        video.autoplay = false; // We'll play manually on user gesture

        // Position off-screen but not display:none (iOS needs it "visible")
        video.style.position = "fixed";
        video.style.left = "-9999px";
        video.style.top = "-9999px";
        video.style.width = "1px";
        video.style.height = "1px";
        video.style.opacity = "0.01";
        video.style.pointerEvents = "none";
        video.style.zIndex = "-1";

        // Track when video is ready
        video.addEventListener("loadeddata", () => {
          console.log("[WakeLock] 📹 Video loaded and ready to play");
          videoReadyRef.current = true;
        });

        video.addEventListener("error", (e) => {
          console.error("[WakeLock] ❌ Video error:", e);
        });

        // Tiny base64 encoded MP4 (1 frame, silent) - NoSleep.js pattern
        video.src =
          "data:video/mp4;base64,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";

        // Append to DOM first, then load
        document.body.appendChild(video);
        noSleepVideoRef.current = video;

        // Explicitly load the video
        video.load();

        console.log("[WakeLock] 📹 iOS video fallback element created, loading...");
      } catch (err) {
        console.error("[WakeLock] ❌ Failed to create video fallback element:", err);
      }
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

  const requestWakeLock = useCallback(async (): Promise<boolean> => {
    console.log("[WakeLock] 🔓 Requesting wake lock...");
    setError(null);
    userWantsWakeLockRef.current = true;

    const iosDevice = isIOS();

    // For iOS: ALWAYS use video fallback (more reliable than native API on iOS Safari)
    if (iosDevice) {
      console.log("[WakeLock] 📱 iOS detected, using video fallback");
      console.log("[WakeLock] 📹 Video ready state:", videoReadyRef.current);

      if (!noSleepVideoRef.current) {
        const msg = "Video fallback element not available";
        console.error("[WakeLock] ❌", msg);
        setError(msg);
        setIsActive(false);
        return false;
      }

      try {
        // Wait for video to be ready if not already
        if (!videoReadyRef.current) {
          console.log("[WakeLock] ⏳ Waiting for video to load...");
          await new Promise<void>((resolve, reject) => {
            const video = noSleepVideoRef.current!;
            const timeout = setTimeout(() => {
              reject(new Error("Video load timeout"));
            }, 5000);

            const onLoaded = () => {
              clearTimeout(timeout);
              videoReadyRef.current = true;
              resolve();
            };

            if (video.readyState >= 2) {
              // HAVE_CURRENT_DATA or better
              clearTimeout(timeout);
              videoReadyRef.current = true;
              resolve();
            } else {
              video.addEventListener("loadeddata", onLoaded, { once: true });
            }
          });
        }

        // Ensure video is muted (required for autoplay)
        noSleepVideoRef.current.muted = true;

        console.log("[WakeLock] ▶️ Attempting to play video...");
        const playPromise = noSleepVideoRef.current.play();
        if (playPromise !== undefined) {
          await playPromise;
        }

        usingFallbackRef.current = true;
        setIsActive(true);
        setError(null);

        console.log("[WakeLock] ✅ Video fallback activated (iOS)");
        return true;
      } catch (err: any) {
        const msg = `Video fallback failed: ${err.name} - ${err.message}`;
        console.error("[WakeLock] ❌", msg);
        setError(msg);
        setIsActive(false);
        return false;
      }
    }

    // For non-iOS: Use native Wake Lock API
    if ("wakeLock" in navigator) {
      try {
        // Release existing wake lock if any
        if (wakeLockRef.current) {
          console.log("[WakeLock] 🔄 Releasing existing lock before new request");
          await wakeLockRef.current.release();
          wakeLockRef.current = null;
        }

        console.log("[WakeLock] 🔒 Attempting native Wake Lock API...");

        const wakeLock = await navigator.wakeLock.request("screen");
        wakeLockRef.current = wakeLock;
        usingFallbackRef.current = false;
        setIsActive(true);
        setError(null);

        console.log("[WakeLock] ✅ Native Wake Lock API activated");

        // Listen for release event (browser can release at any time)
        wakeLock.addEventListener("release", () => {
          console.log("[WakeLock] 🔄 Wake lock was released by browser");
          wakeLockRef.current = null;
          setIsActive(false);
          // userWantsWakeLockRef stays true for re-acquisition on visibility change
        });

        return true;
      } catch (err: any) {
        const msg = `Native API failed: ${err.name} - ${err.message}`;
        console.error("[WakeLock] ❌", msg);
        setError(msg);
        setIsActive(false);
        return false;
      }
    }

    // No support available
    const msg = "Wake Lock not supported on this device/browser";
    console.warn("[WakeLock] ⚠️", msg);
    setError(msg);
    setIsActive(false);
    return false;
  }, []);

  const releaseWakeLock = useCallback(async () => {
    console.log("[WakeLock] 📴 Releasing wake lock (user requested)");
    userWantsWakeLockRef.current = false;
    setError(null);

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

    setIsActive(false);
  }, []);

  // Re-acquire wake lock when page becomes visible again
  useEffect(() => {
    const handleVisibilityChange = async () => {
      console.log("[WakeLock] 👁️ Visibility changed:", document.visibilityState);

      if (document.visibilityState === "visible" && userWantsWakeLockRef.current) {
        // Check if we need to re-acquire
        const needsReacquire = isIOS()
          ? !usingFallbackRef.current || noSleepVideoRef.current?.paused
          : wakeLockRef.current === null;

        if (needsReacquire) {
          console.log("[WakeLock] 🔄 Page visible, re-acquiring wake lock...");
          // Small delay to let browser settle
          await new Promise((resolve) => setTimeout(resolve, 100));
          await requestWakeLock();
        }
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
    isSupported,
    isActive,
    error,
  };
}
