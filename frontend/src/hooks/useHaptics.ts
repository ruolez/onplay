/**
 * useHaptics - Custom hook for haptic feedback
 *
 * Provides tactile feedback for user interactions using the Web Vibration API.
 * Industry standard patterns from Spotify, Apple Music, YouTube Music.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API
 */

import { useCallback } from 'react';

// Check if Vibration API is supported
const isVibrationSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator;

export type HapticType =
  | 'light'      // Light tap - track change, minor actions
  | 'medium'     // Medium tap - play/pause, important actions
  | 'heavy'      // Heavy tap - errors, warnings
  | 'success'    // Success pattern - gesture completion
  | 'selection'  // Selection feedback - quick tap
  | 'impact';    // Impact feedback - button press

// Vibration patterns (in milliseconds)
// Pattern format: [vibrate, pause, vibrate, pause, ...]
const HAPTIC_PATTERNS: Record<HapticType, number | number[]> = {
  light: 10,           // Quick 10ms tap
  medium: 25,          // Standard 25ms tap
  heavy: 50,           // Strong 50ms tap
  success: [10, 50, 10], // Double tap pattern
  selection: 5,        // Ultra-light 5ms tap
  impact: [15, 30, 15, 30, 15], // Triple impact
};

export function useHaptics() {
  /**
   * Trigger haptic feedback
   * @param type - Type of haptic feedback
   * @returns boolean - Whether vibration was triggered
   */
  const trigger = useCallback((type: HapticType = 'light'): boolean => {
    if (!isVibrationSupported) {
      return false;
    }

    try {
      const pattern = HAPTIC_PATTERNS[type];
      navigator.vibrate(pattern);
      return true;
    } catch {
      return false;
    }
  }, []);

  /**
   * Trigger haptic feedback for track changes
   */
  const trackChange = useCallback(() => trigger('light'), [trigger]);

  /**
   * Trigger haptic feedback for play/pause
   */
  const playPause = useCallback(() => trigger('medium'), [trigger]);

  /**
   * Trigger haptic feedback for gesture completion
   */
  const gestureComplete = useCallback(() => trigger('success'), [trigger]);

  /**
   * Trigger haptic feedback for button press
   */
  const buttonPress = useCallback(() => trigger('selection'), [trigger]);

  /**
   * Trigger haptic feedback for errors
   */
  const error = useCallback(() => trigger('heavy'), [trigger]);

  /**
   * Trigger custom vibration pattern
   * @param pattern - Vibration pattern array [vibrate, pause, ...]
   */
  const custom = useCallback((pattern: number | number[]): boolean => {
    if (!isVibrationSupported) {
      return false;
    }

    try {
      navigator.vibrate(pattern);
      return true;
    } catch {
      return false;
    }
  }, []);

  /**
   * Cancel any ongoing vibration
   */
  const cancel = useCallback((): void => {
    if (isVibrationSupported) {
      navigator.vibrate(0);
    }
  }, []);

  return {
    isSupported: isVibrationSupported,
    trigger,
    trackChange,
    playPause,
    gestureComplete,
    buttonPress,
    error,
    custom,
    cancel,
  };
}
