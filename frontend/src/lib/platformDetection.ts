/**
 * Platform detection utilities for Wake Lock compatibility
 *
 * iOS 18.0-18.3.x has a known bug where Wake Lock API is silently ignored
 * in standalone PWA mode. This was fixed in iOS 18.4+.
 */

export type IOSVersion = {
  major: number;
  minor: number;
  patch: number;
};

export type WakeLockFailureReason =
  | "ios_pwa_bug" // iOS 18.0-18.3 PWA mode (known Apple bug)
  | "not_supported" // Browser doesn't support Wake Lock
  | "permission_denied" // User or system denied
  | "video_blocked" // Video autoplay blocked
  | "unknown";

export type PlatformInfo = {
  isIOS: boolean;
  iosVersion: IOSVersion | null;
  isPWA: boolean;
  isSafari: boolean;
  wakeLockBroken: boolean;
  wakeLockSupported: boolean;
};

/**
 * Detect if running on iOS device
 */
export function isIOS(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

/**
 * Parse iOS version from user agent
 * Returns null if not iOS or version can't be determined
 */
export function getIOSVersion(): IOSVersion | null {
  if (!isIOS()) return null;

  // Match patterns like "OS 18_3_2" or "OS 18_3"
  const match = navigator.userAgent.match(/OS (\d+)_(\d+)(?:_(\d+))?/);
  if (!match) return null;

  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3] || "0", 10),
  };
}

/**
 * Check if running as installed PWA (standalone mode)
 */
export function isPWAMode(): boolean {
  // Check display-mode media query (standard)
  const standaloneQuery = window.matchMedia("(display-mode: standalone)");
  if (standaloneQuery.matches) return true;

  // Check iOS-specific navigator.standalone
  if ("standalone" in navigator && (navigator as any).standalone === true) {
    return true;
  }

  // Check fullscreen mode (some PWAs use this)
  const fullscreenQuery = window.matchMedia("(display-mode: fullscreen)");
  if (fullscreenQuery.matches) return true;

  return false;
}

/**
 * Check if running in Safari browser (not Chrome/Firefox on iOS)
 */
export function isSafari(): boolean {
  const ua = navigator.userAgent;
  // Safari on iOS: includes "Safari" but not "CriOS" (Chrome) or "FxiOS" (Firefox)
  return /Safari/.test(ua) && !/CriOS/.test(ua) && !/FxiOS/.test(ua) && isIOS();
}

/**
 * Compare iOS versions
 * Returns: -1 if a < b, 0 if equal, 1 if a > b
 */
function compareIOSVersions(a: IOSVersion, b: IOSVersion): number {
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  return a.patch - b.patch;
}

/**
 * Check if iOS version is in the broken wake lock range
 * iOS 16.4 introduced Wake Lock API
 * iOS 18.0-18.3 have the PWA bug
 * iOS 18.4+ fixed the bug
 */
export function isWakeLockBroken(): boolean {
  const version = getIOSVersion();
  if (!version) return false;

  // Only broken in PWA mode
  if (!isPWAMode()) return false;

  // Minimum version that has Wake Lock API but is broken in PWA
  const minBroken: IOSVersion = { major: 16, minor: 4, patch: 0 };
  // First version where it's fixed
  const fixedVersion: IOSVersion = { major: 18, minor: 4, patch: 0 };

  const isAtLeastMinBroken = compareIOSVersions(version, minBroken) >= 0;
  const isBeforeFix = compareIOSVersions(version, fixedVersion) < 0;

  return isAtLeastMinBroken && isBeforeFix;
}

/**
 * Check if Wake Lock API is supported by browser
 */
export function isWakeLockSupported(): boolean {
  return "wakeLock" in navigator;
}

/**
 * Get comprehensive platform information
 */
export function getPlatformInfo(): PlatformInfo {
  return {
    isIOS: isIOS(),
    iosVersion: getIOSVersion(),
    isPWA: isPWAMode(),
    isSafari: isSafari(),
    wakeLockBroken: isWakeLockBroken(),
    wakeLockSupported: isWakeLockSupported(),
  };
}

/**
 * Format iOS version for display
 */
export function formatIOSVersion(version: IOSVersion | null): string {
  if (!version) return "Unknown";
  return `${version.major}.${version.minor}${version.patch > 0 ? `.${version.patch}` : ""}`;
}
