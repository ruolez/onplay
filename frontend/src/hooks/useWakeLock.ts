import { useEffect, useRef, useCallback } from "react";

export function useWakeLock() {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const isActiveRef = useRef(false);

  const requestWakeLock = useCallback(async () => {
    // Check if Wake Lock API is supported
    if (!("wakeLock" in navigator)) {
      console.log("Wake Lock API not supported");
      return;
    }

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

      console.log("Wake lock activated");

      // Listen for release
      wakeLock.addEventListener("release", () => {
        console.log("Wake lock released");
      });
    } catch (err) {
      console.error("Failed to request wake lock:", err);
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        isActiveRef.current = false;
        console.log("Wake lock manually released");
      } catch (err) {
        console.error("Failed to release wake lock:", err);
      }
    }
  }, []);

  // Re-acquire wake lock when page becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isActiveRef.current) {
        // Re-request wake lock when user returns to tab
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
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(console.error);
      }
    };
  }, []);

  return {
    requestWakeLock,
    releaseWakeLock,
    isSupported: "wakeLock" in navigator,
  };
}
