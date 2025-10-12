import { mediaApi, type Media } from "../lib/api";
import type { DualVideoPlayerRef } from "../components/DualVideoPlayer";

export interface PreloadConfig {
  /**
   * Percentage of track completion before starting preload (0-100)
   * Default: 80
   */
  preloadThreshold: number;

  /**
   * Enable/disable preloading
   * Default: true
   */
  enabled: boolean;
}

export class PreloadService {
  private config: PreloadConfig;
  private preloadTriggered = false;
  private intervalId: number | null = null;
  private onPreloadComplete?: (media: Media) => void;

  constructor(config: Partial<PreloadConfig> = {}) {
    this.config = {
      preloadThreshold: config.preloadThreshold ?? 80,
      enabled: config.enabled ?? true,
    };
  }

  /**
   * Start monitoring playback for preload triggers
   */
  start(
    queue: Media[],
    currentIndex: number,
    playerRef: React.RefObject<DualVideoPlayerRef>,
    onPreloadComplete: (media: Media) => void,
  ): void {
    if (!this.config.enabled) {
      return;
    }

    this.stop(); // Clean up any existing interval
    this.onPreloadComplete = onPreloadComplete;
    this.preloadTriggered = false;

    // Determine next track
    const currentTrack = queue[currentIndex];
    const nextTrack = queue[currentIndex + 1];

    if (!currentTrack || !nextTrack) {
      return;
    }

    // Monitor playback progress
    this.intervalId = window.setInterval(() => {
      const player = playerRef.current;
      if (!player) return;

      const currentTime = player.getCurrentTime();
      const vjsPlayer = player.getPlayer();
      const duration = vjsPlayer?.duration() || 0;

      if (duration === 0) return;

      const progress = (currentTime / duration) * 100;

      // Check if we've reached the preload threshold
      if (progress >= this.config.preloadThreshold && !this.preloadTriggered) {
        this.preloadTriggered = true;
        this.triggerPreload(nextTrack, player);
      }
    }, 1000); // Check every second
  }

  /**
   * Stop monitoring playback
   */
  stop(): void {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.preloadTriggered = false;
  }

  /**
   * Trigger preload for next track
   */
  private async triggerPreload(
    nextTrack: Media,
    player: DualVideoPlayerRef,
  ): Promise<void> {
    try {
      // Fetch full media details including variants
      const response = await mediaApi.getMediaById(nextTrack.id);
      const fullMedia = response.data;

      // Use master playlist for adaptive bitrate streaming
      // The master playlist allows Video.js to automatically switch quality variants
      const masterPlaylistPath = `/media/hls/${fullMedia.id}/master.m3u8`;

      // Trigger player preload
      player.preloadNext(
        masterPlaylistPath,
        fullMedia.thumbnail_path
          ? `${fullMedia.thumbnail_path}?t=${Date.now()}`
          : undefined,
      );

      // Notify that preload is complete
      this.onPreloadComplete?.(fullMedia);
    } catch (error) {
      console.error("[PreloadService] Preload failed:", error);
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<PreloadConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): PreloadConfig {
    return { ...this.config };
  }

  /**
   * Check if preload has been triggered for current track
   */
  isPreloadTriggered(): boolean {
    return this.preloadTriggered;
  }
}

// Singleton instance
export const preloadService = new PreloadService();
