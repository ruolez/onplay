import { useState, useEffect, useRef, useCallback } from "react";

export function useWakeLock() {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Track if user wants wake lock enabled (for re-acquisition after tab switch)
  const userWantsWakeLockRef = useRef(false);

  // Check if Wake Lock API is supported
  const isSupported = typeof navigator !== "undefined" && "wakeLock" in navigator;

  // Log initial setup info
  useEffect(() => {
    console.log("[WakeLock] 🔧 Initializing wake lock hook");
    console.log("[WakeLock] Browser support:", {
      hasWakeLock: isSupported,
      userAgent: navigator.userAgent,
      standalone: (navigator as any).standalone || window.matchMedia("(display-mode: standalone)").matches,
    });
  }, [isSupported]);

  const requestWakeLock = useCallback(async (): Promise<boolean> => {
    console.log("[WakeLock] 🔓 Requesting wake lock...");
    setError(null);
    userWantsWakeLockRef.current = true;

    if (!isSupported) {
      const msg = "Wake Lock API not supported. Requires iOS 16.4+ or Chrome/Edge.";
      console.warn("[WakeLock] ⚠️", msg);
      setError(msg);
      setIsActive(false);
      return false;
    }

    try {
      // Release existing wake lock if any
      if (wakeLockRef.current) {
        console.log("[WakeLock] 🔄 Releasing existing lock before new request");
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      }

      console.log("[WakeLock] 🔒 Attempting to acquire wake lock...");

      // Request new wake lock
      const wakeLock = await navigator.wakeLock.request("screen");
      wakeLockRef.current = wakeLock;
      setIsActive(true);
      setError(null);

      console.log("[WakeLock] ✅ Wake lock acquired successfully!");

      // Listen for release event (browser can release at any time)
      wakeLock.addEventListener("release", () => {
        console.log("[WakeLock] 🔄 Wake lock was released by browser");
        wakeLockRef.current = null;
        setIsActive(false);
        // Note: userWantsWakeLockRef stays true so we can re-acquire on visibility change
      });

      return true;
    } catch (err: any) {
      const msg = `Failed to acquire wake lock: ${err.name} - ${err.message}`;
      console.error("[WakeLock] ❌", msg);
      setError(msg);
      setIsActive(false);
      return false;
    }
  }, [isSupported]);

  const releaseWakeLock = useCallback(async () => {
    console.log("[WakeLock] 📴 Releasing wake lock (user requested)");
    userWantsWakeLockRef.current = false;

    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        setIsActive(false);
        console.log("[WakeLock] ✅ Wake lock released");
      } catch (err) {
        console.error("[WakeLock] ❌ Failed to release wake lock:", err);
      }
    } else {
      setIsActive(false);
    }
  }, []);

  // Re-acquire wake lock when page becomes visible again (if user wanted it)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      console.log("[WakeLock] 👁️ Visibility changed:", document.visibilityState);
      console.log("[WakeLock] User wants wake lock:", userWantsWakeLockRef.current);
      console.log("[WakeLock] Current lock:", wakeLockRef.current ? "active" : "null");

      if (
        document.visibilityState === "visible" &&
        userWantsWakeLockRef.current &&
        wakeLockRef.current === null
      ) {
        console.log("[WakeLock] 👁️ Page visible + user wants lock + no active lock -> re-acquiring");
        // Small delay to let browser settle
        await new Promise((resolve) => setTimeout(resolve, 100));
        await requestWakeLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [requestWakeLock]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wakeLockRef.current) {
        console.log("[WakeLock] 🧹 Cleaning up wake lock on unmount");
        wakeLockRef.current.release().catch(console.error);
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
