/**
 * useSwipeGesture - Custom hook for detecting swipe gestures
 *
 * Detects horizontal and vertical swipe gestures on touch devices.
 * Used for track changes (left/right) and player expand/collapse (up/down).
 *
 * Industry patterns from Spotify, Apple Music, YouTube Music.
 */

import { useRef, useCallback, RefObject } from 'react';

export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

export interface SwipeConfig {
  /** Minimum distance (px) to trigger swipe */
  threshold?: number;
  /** Maximum time (ms) for swipe gesture */
  maxTime?: number;
  /** Prevent default touch behavior */
  preventDefault?: boolean;
  /** Callback for swipe left */
  onSwipeLeft?: () => void;
  /** Callback for swipe right */
  onSwipeRight?: () => void;
  /** Callback for swipe up */
  onSwipeUp?: () => void;
  /** Callback for swipe down */
  onSwipeDown?: () => void;
  /** Generic swipe callback with direction */
  onSwipe?: (direction: SwipeDirection) => void;
}

interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
  isTracking: boolean;
}

export function useSwipeGesture(config: SwipeConfig = {}) {
  const {
    threshold = 50,
    maxTime = 300,
    preventDefault = false,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onSwipe,
  } = config;

  const touchState = useRef<TouchState>({
    startX: 0,
    startY: 0,
    startTime: 0,
    isTracking: false,
  });

  const handleTouchStart = useCallback(
    (e: TouchEvent | React.TouchEvent) => {
      const touch = e.touches[0];
      touchState.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        startTime: Date.now(),
        isTracking: true,
      };
    },
    []
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent | React.TouchEvent) => {
      if (preventDefault && touchState.current.isTracking) {
        // Only prevent default for significant vertical movement (to allow scroll)
        const touch = e.touches[0];
        const deltaY = Math.abs(touch.clientY - touchState.current.startY);
        const deltaX = Math.abs(touch.clientX - touchState.current.startX);

        // Prevent default only if vertical swipe is intended
        if (deltaY > deltaX && deltaY > 10) {
          e.preventDefault();
        }
      }
    },
    [preventDefault]
  );

  const handleTouchEnd = useCallback(
    (e: TouchEvent | React.TouchEvent) => {
      if (!touchState.current.isTracking) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchState.current.startX;
      const deltaY = touch.clientY - touchState.current.startY;
      const deltaTime = Date.now() - touchState.current.startTime;

      touchState.current.isTracking = false;

      // Check if swipe was fast enough
      if (deltaTime > maxTime) return;

      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // Determine if horizontal or vertical swipe
      if (absX > absY && absX >= threshold) {
        // Horizontal swipe
        const direction: SwipeDirection = deltaX > 0 ? 'right' : 'left';
        onSwipe?.(direction);

        if (direction === 'left') {
          onSwipeLeft?.();
        } else {
          onSwipeRight?.();
        }
      } else if (absY > absX && absY >= threshold) {
        // Vertical swipe
        const direction: SwipeDirection = deltaY > 0 ? 'down' : 'up';
        onSwipe?.(direction);

        if (direction === 'up') {
          onSwipeUp?.();
        } else {
          onSwipeDown?.();
        }
      }
    },
    [threshold, maxTime, onSwipe, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]
  );

  /**
   * Bind gesture handlers to an element ref
   */
  const bind = useCallback(
    <T extends HTMLElement>(ref: RefObject<T>) => {
      const element = ref.current;
      if (!element) return () => {};

      const startHandler = (e: TouchEvent) => handleTouchStart(e);
      const moveHandler = (e: TouchEvent) => handleTouchMove(e);
      const endHandler = (e: TouchEvent) => handleTouchEnd(e);

      element.addEventListener('touchstart', startHandler, { passive: true });
      element.addEventListener('touchmove', moveHandler, { passive: !preventDefault });
      element.addEventListener('touchend', endHandler, { passive: true });

      return () => {
        element.removeEventListener('touchstart', startHandler);
        element.removeEventListener('touchmove', moveHandler);
        element.removeEventListener('touchend', endHandler);
      };
    },
    [handleTouchStart, handleTouchMove, handleTouchEnd, preventDefault]
  );

  /**
   * Props to spread on a React element
   */
  const handlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };

  return {
    bind,
    handlers,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}
