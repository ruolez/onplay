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
  const retryTimeoutRef = useRef<number | null>(null);

  // Log initial setup info
  useEffect(() => {
    console.log("[WakeLock] 🔧 Initializing wake lock hook");
    console.log("[WakeLock] Browser support:", {
      hasWakeLock: "wakeLock" in navigator,
      isIOS: isIOS(),
      userAgent: navigator.userAgent,
    });
  }, []);

  // Request with retry logic
  const requestWakeLockWithRetry = useCallback(async () => {
    const iosDevice = isIOS();
    const hasNativeAPI = "wakeLock" in navigator;

    console.log("[WakeLock] 🔓 Requesting wake lock...");
    console.log("[WakeLock] 📱 Device info:", {
      isIOS: iosDevice,
      hasNativeAPI: hasNativeAPI,
      userAgent: navigator.userAgent,
    });

    // Try Wake Lock API first (works on iOS 16.4+ Safari, Chrome, Edge)
    if (hasNativeAPI) {
      try {
        // Release existing wake lock if any
        if (wakeLockRef.current) {
          await wakeLockRef.current.release();
          wakeLockRef.current = null;
        }

        console.log("[WakeLock] 🔒 Attempting native Wake Lock API...");

        // Request new wake lock
        const wakeLock = await navigator.wakeLock.request("screen");
        wakeLockRef.current = wakeLock;
        isActiveRef.current = true;

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
                requestWakeLockWithRetry();
              }
            }, 500);
          }
        });

        return true;
      } catch (err: any) {
        console.error(
          `[WakeLock] ❌ Native API failed: ${err.name} - ${err.message}`,
        );
        console.error("[WakeLock] Error details:", err);
        // Fall through to try fallback
      }
    } else {
      console.warn(
        "[WakeLock] ⚠️ Native Wake Lock API not available on this browser",
      );
    }

    // iOS without native Wake Lock API
    if (iosDevice) {
      console.error(
        "[WakeLock] ❌ Wake Lock not supported on this iOS version",
      );
      console.error(
        "[WakeLock] ℹ️ Please update to iOS 16.4+ for screen wake lock support",
      );
      return false;
    }

    // Desktop browser without Wake Lock API
    console.warn("[WakeLock] ⚠️ Wake Lock API not supported on this browser");
    console.warn(
      "[WakeLock] ℹ️ Try using Chrome, Edge, or Safari 16.4+ for wake lock support",
    );
    return false;
  }, []);

  const requestWakeLock = useCallback(async () => {
    // Clear any pending retries
    if (retryTimeoutRef.current !== null) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    await requestWakeLockWithRetry();
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
    };
  }, []);

  return {
    requestWakeLock,
    releaseWakeLock,
    isSupported: "wakeLock" in navigator || isIOS(),
  };
}
