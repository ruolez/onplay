import { useEffect, useRef, useCallback, useState } from "react";

// Detect iOS devices (iPhone, iPad, iPod)
const isIOS = () => {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
};

interface UseWakeLockOptions {
  userWantsWakeLock: boolean;
  onFailure?: (reason: string) => void;
}

const MAX_RETRIES = 5;

export function useWakeLock(options?: UseWakeLockOptions) {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const isActiveRef = useRef(false);
  const noSleepVideoRef = useRef<HTMLVideoElement | null>(null);
  const usingFallbackRef = useRef(false);
  const videoReadyRef = useRef(false);
  const keepAliveIntervalRef = useRef<number | null>(null);
  const retryCountRef = useRef(0);

  // Expose actual wake lock state for UI feedback
  const [isActive, setIsActive] = useState(false);

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

      // Hide video off-screen but keep it "visible" to iOS
      video.style.position = "fixed";
      video.style.left = "-100px";
      video.style.top = "-100px";
      video.style.width = "10px";
      video.style.height = "10px";
      video.style.opacity = "0.01";
      video.style.pointerEvents = "none";
      video.style.zIndex = "-1000";

      // Listen for when video is ready
      video.addEventListener("canplaythrough", () => {
        console.log("[WakeLock] Video ready (canplaythrough)");
        videoReadyRef.current = true;
      });

      video.addEventListener("loadeddata", () => {
        console.log(
          "[WakeLock] Video loadeddata, readyState:",
          video.readyState,
        );
      });

      video.addEventListener("error", (e) => {
        console.error("[WakeLock] Video error:", e);
      });

      video.addEventListener("pause", () => {
        console.log("[WakeLock] Video paused event - will restart if active");
        // If we're supposed to be active but video paused, restart it
        if (usingFallbackRef.current && isActiveRef.current) {
          console.log("[WakeLock] Restarting paused video...");
          video.play().catch(console.error);
        }
      });

      // Use actual MP4 file instead of base64
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
      if (keepAliveIntervalRef.current) {
        clearInterval(keepAliveIntervalRef.current);
        keepAliveIntervalRef.current = null;
      }
    };
  }, []);

  const requestWakeLock = useCallback(async () => {
    console.log(
      "[WakeLock] Requesting wake lock, isIOS:",
      isIOS(),
      "hasNativeAPI:",
      "wakeLock" in navigator,
    );

    // Try native Wake Lock API FIRST (works on iOS 16.4+ and all modern browsers)
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
        setIsActive(true);
        retryCountRef.current = 0; // Reset retry counter on success

        console.log("[WakeLock] ✅ Activated (native API)");

        // Listen for release
        wakeLock.addEventListener("release", () => {
          console.log("[WakeLock] Released by browser (native API)");
          wakeLockRef.current = null;
          // Don't set isActiveRef to false - we'll re-acquire on visibility change
        });

        return true;
      } catch (err: any) {
        console.warn("[WakeLock] Native API failed:", err.name, err.message);
        // Fall through to video fallback on iOS
      }
    }

    // iOS video fallback (if native API failed or unavailable)
    if (isIOS()) {
      const video = noSleepVideoRef.current;

      if (!video) {
        console.error("[WakeLock] ❌ Video element not found");
        return false;
      }

      try {
        // Ensure muted is set (critical for iOS autoplay)
        video.muted = true;

        console.log(
          "[WakeLock] Video state - readyState:",
          video.readyState,
          "paused:",
          video.paused,
          "videoReady:",
          videoReadyRef.current,
        );

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
              video.load();
            }
          });
        }

        console.log("[WakeLock] Attempting video.play()...");

        // Play the video
        await video.play();

        // Verify it's actually playing
        console.log(
          "[WakeLock] After play() - paused:",
          video.paused,
          "currentTime:",
          video.currentTime,
        );

        if (video.paused) {
          console.error("[WakeLock] ❌ Video still paused after play()!");
          return false;
        }

        isActiveRef.current = true;
        usingFallbackRef.current = true;
        setIsActive(true);
        retryCountRef.current = 0; // Reset retry counter on success

        // Set up keep-alive interval to ensure video keeps playing
        if (keepAliveIntervalRef.current) {
          clearInterval(keepAliveIntervalRef.current);
        }
        keepAliveIntervalRef.current = window.setInterval(() => {
          if (
            noSleepVideoRef.current &&
            isActiveRef.current &&
            usingFallbackRef.current
          ) {
            if (noSleepVideoRef.current.paused) {
              retryCountRef.current++;
              console.log(
                `[WakeLock] Keep-alive retry ${retryCountRef.current}/${MAX_RETRIES}`,
              );

              if (retryCountRef.current > MAX_RETRIES) {
                console.error("[WakeLock] Max retries exceeded, giving up");
                clearInterval(keepAliveIntervalRef.current!);
                keepAliveIntervalRef.current = null;
                isActiveRef.current = false;
                setIsActive(false);
                options?.onFailure?.(
                  "Screen wake lock failed after multiple retries",
                );
                return;
              }

              noSleepVideoRef.current.play().catch(console.error);
            } else {
              // Video is playing - reset retry counter
              retryCountRef.current = 0;
            }
          }
        }, 5000);

        console.log("[WakeLock] ✅ Activated (iOS video fallback)");
        return true;
      } catch (err: any) {
        console.error(
          "[WakeLock] ❌ Video fallback failed:",
          err.name,
          err.message,
        );
        setIsActive(false);
        return false;
      }
    }

    console.warn("[WakeLock] No wake lock method available");
    return false;
  }, []);

  const releaseWakeLock = useCallback(async () => {
    isActiveRef.current = false;
    setIsActive(false);
    retryCountRef.current = 0; // Reset retry counter

    // Clear keep-alive interval
    if (keepAliveIntervalRef.current) {
      clearInterval(keepAliveIntervalRef.current);
      keepAliveIntervalRef.current = null;
    }

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
      // Use user preference to determine if we should re-acquire
      // This fixes the issue where browser releases lock while tab is hidden
      if (
        document.visibilityState === "visible" &&
        options?.userWantsWakeLock
      ) {
        console.log("[WakeLock] Page visible, user wants lock, re-requesting");
        requestWakeLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [requestWakeLock, options?.userWantsWakeLock]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(console.error);
      }
      if (noSleepVideoRef.current) {
        noSleepVideoRef.current.pause();
      }
      if (keepAliveIntervalRef.current) {
        clearInterval(keepAliveIntervalRef.current);
      }
    };
  }, []);

  return {
    requestWakeLock,
    releaseWakeLock,
    isSupported: "wakeLock" in navigator || isIOS(),
    isActive,
  };
}
