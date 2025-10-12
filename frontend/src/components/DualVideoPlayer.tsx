import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import videojs from "video.js";
import Player from "video.js/dist/types/player";
import "video.js/dist/video-js.css";

interface DualVideoPlayerProps {
  src: string;
  poster?: string;
  autoplay?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
  onDurationChange?: (duration: number) => void;
  onBufferStart?: () => void;
  onBufferEnd?: () => void;
  onError?: (error: string) => void;
}

export interface DualVideoPlayerRef {
  getCurrentTime: () => number;
  getPlayer: () => Player | null;
  play: () => Promise<void>;
  pause: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  preloadNext: (src: string, poster?: string) => void;
  swapToPreloaded: () => void;
}

const DualVideoPlayer = forwardRef<DualVideoPlayerRef, DualVideoPlayerProps>(
  (
    {
      src,
      poster,
      autoplay,
      onPlay,
      onPause,
      onEnded,
      onTimeUpdate,
      onDurationChange,
      onBufferStart,
      onBufferEnd,
      onError,
    },
    ref,
  ) => {
    const videoRef = useRef<HTMLDivElement>(null);
    const preloadRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<Player | null>(null);
    const preloadPlayerRef = useRef<Player | null>(null);
    const isWaitingRef = useRef(false);
    const isFirstRender = useRef(true);

    // Initialize main player (only once)
    useEffect(() => {
      if (!playerRef.current && videoRef.current) {
        const videoElement = document.createElement("video-js");
        videoElement.classList.add("vjs-big-play-centered");
        videoElement.setAttribute("playsinline", "true");
        videoElement.setAttribute("webkit-playsinline", "true");
        videoElement.setAttribute("x5-playsinline", "true");

        videoRef.current.appendChild(videoElement);

        const player = videojs(videoElement, {
          controls: true,
          responsive: true,
          fluid: true,
          preload: "auto",
          poster,
          playsinline: true,
          autoplay: autoplay || false,
          muted: autoplay ? true : false,
          sources: [
            {
              src,
              type: "application/x-mpegURL",
            },
          ],
          controlBar: {
            volumePanel: {
              inline: false,
            },
            fullscreenToggle: true,
          },
          userActions: {
            hotkeys: true,
          },
          playbackRates: [0.5, 1, 1.5, 2],
          html5: {
            vhs: {
              overrideNative: true,
              bandwidth: 4194304,
              backBufferLength: 30,
            },
            nativeVideoTracks: false,
            nativeAudioTracks: false,
            nativeTextTracks: false,
          },
        });

        // Handle autoplay - start muted then unmute after first play
        if (autoplay) {
          // Explicitly trigger play to ensure autoplay works
          player.ready(() => {
            player.play()?.catch((err) => {
              console.error("[DualPlayer] Autoplay failed:", err);
            });
          });

          // Unmute after first play event (ensures autoplay policy satisfied)
          player.one("playing", () => {
            setTimeout(() => {
              if (player.muted()) {
                player.muted(false);
                player.volume(1);
              }
            }, 100);
          });
        }

        playerRef.current = player;
      }

      return () => {
        if (playerRef.current && !playerRef.current.isDisposed()) {
          playerRef.current.dispose();
          playerRef.current = null;
        }
      };
    }, []); // Only create once

    // Update source when src changes (without recreating player)
    useEffect(() => {
      // Skip first render (initial source already set)
      if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
      }

      const player = playerRef.current;
      if (player && !player.isDisposed()) {
        console.log("[DualPlayer] Changing source to:", src);

        // Change source without exiting fullscreen
        player.src({
          src,
          type: "application/x-mpegURL",
        });

        // Update poster if provided
        if (poster) {
          player.poster(poster);
        }

        // Auto-play after source change (maintains fullscreen)
        player.ready(() => {
          player.play()?.catch((err) => {
            console.error("[DualPlayer] Failed to play after source change:", err);
          });
        });
      }
    }, [src, poster]);

    // Update event listeners when callbacks change (without recreating player)
    useEffect(() => {
      const player = playerRef.current;
      if (!player) return;

      // Clear all old listeners
      player.off("play");
      player.off("pause");
      player.off("ended");
      player.off("timeupdate");
      player.off("durationchange");
      player.off("waiting");
      player.off("canplay");
      player.off("error");

      // Attach new listeners with current callbacks
      if (onPlay) player.on("play", onPlay);
      if (onPause) player.on("pause", onPause);
      if (onEnded) player.on("ended", onEnded);
      if (onTimeUpdate) {
        player.on("timeupdate", () => {
          onTimeUpdate(player.currentTime() || 0);
        });
      }
      if (onDurationChange) {
        player.on("durationchange", () => {
          onDurationChange(player.duration() || 0);
        });
      }

      // Buffer events
      player.on("waiting", () => {
        if (!isWaitingRef.current) {
          isWaitingRef.current = true;
          onBufferStart?.();
        }
      });

      player.on("canplay", () => {
        if (isWaitingRef.current) {
          isWaitingRef.current = false;
          onBufferEnd?.();
        }
      });

      player.on("error", () => {
        const error = player.error();
        const message = error
          ? `${error.code}: ${error.message}`
          : "Unknown playback error";
        console.error("[DualPlayer] Error:", message);
        onError?.(message);
      });
    }, [
      onPlay,
      onPause,
      onEnded,
      onTimeUpdate,
      onDurationChange,
      onBufferStart,
      onBufferEnd,
      onError,
    ]);

    useImperativeHandle(ref, () => ({
      getCurrentTime: () => playerRef.current?.currentTime() || 0,
      getPlayer: () => playerRef.current,
      play: async () => {
        if (playerRef.current) {
          try {
            await playerRef.current.play();
          } catch (error) {
            console.error("[DualPlayer] Failed to play:", error);
          }
        }
      },
      pause: () => {
        if (playerRef.current) {
          playerRef.current.pause();
        }
      },
      seek: (time: number) => {
        if (playerRef.current) {
          playerRef.current.currentTime(time);
        }
      },
      setVolume: (volume: number) => {
        if (playerRef.current) {
          playerRef.current.volume(volume);
        }
        // Also sync to preload player if it exists
        if (preloadPlayerRef.current) {
          preloadPlayerRef.current.volume(volume);
        }
      },
      preloadNext: (nextSrc: string, nextPoster?: string) => {
        // Clean up existing preload player
        if (
          preloadPlayerRef.current &&
          !preloadPlayerRef.current.isDisposed()
        ) {
          preloadPlayerRef.current.dispose();
          preloadPlayerRef.current = null;
        }

        // Create new preload player
        if (preloadRef.current) {
          const videoElement = document.createElement("video-js");
          videoElement.classList.add("vjs-big-play-centered");
          videoElement.setAttribute("playsinline", "true");
          videoElement.setAttribute("webkit-playsinline", "true");
          videoElement.setAttribute("x5-playsinline", "true");

          preloadRef.current.appendChild(videoElement);

          const player = videojs(videoElement, {
            controls: false,
            preload: "auto",
            poster: nextPoster,
            playsinline: true,
            muted: true,
            sources: [
              {
                src: nextSrc,
                type: "application/x-mpegURL",
              },
            ],
            html5: {
              vhs: {
                overrideNative: true,
                bandwidth: 4194304,
                backBufferLength: 10, // Smaller buffer for preload
              },
              nativeVideoTracks: false,
              nativeAudioTracks: false,
              nativeTextTracks: false,
            },
          });

          // Sync volume with main player
          if (playerRef.current) {
            player.volume(playerRef.current.volume());
          }

          preloadPlayerRef.current = player;
        }
      },
      swapToPreloaded: () => {
        if (!preloadPlayerRef.current) {
          return;
        }

        console.log("[DualPlayer] 🔄 Swapping to preloaded player");

        // CRITICAL: Check if we're currently in fullscreen before swap
        // Check both browser fullscreen API AND Video.js fullscreen state
        const wasInBrowserFullscreen = !!document.fullscreenElement;
        const wasInVideoJsFullscreen = playerRef.current?.isFullscreen() || false;

        console.log("[DualPlayer] Browser fullscreen before swap:", wasInBrowserFullscreen);
        console.log("[DualPlayer] Video.js fullscreen before swap:", wasInVideoJsFullscreen);

        const wasInFullscreen = wasInBrowserFullscreen || wasInVideoJsFullscreen;

        // Pause and clean up main player
        if (playerRef.current && !playerRef.current.isDisposed()) {
          playerRef.current.pause();
          playerRef.current.dispose();
        }

        // Swap references
        playerRef.current = preloadPlayerRef.current;
        preloadPlayerRef.current = null;

        // Move DOM element to main container
        if (videoRef.current && preloadRef.current) {
          const preloadElement = preloadRef.current.querySelector("video-js");
          if (preloadElement) {
            videoRef.current!.innerHTML = "";
            videoRef.current!.appendChild(preloadElement);
          }
        }

        // Re-attach event listeners to new player
        const player = playerRef.current;
        if (player) {
          player.controls(true);
          player.muted(false);

          // Clear old listeners and add new ones
          player.off("play");
          player.off("pause");
          player.off("ended");
          player.off("timeupdate");
          player.off("durationchange");
          player.off("waiting");
          player.off("canplay");
          player.off("error");

          if (onPlay) player.on("play", onPlay);
          if (onPause) player.on("pause", onPause);
          if (onEnded) player.on("ended", onEnded);
          if (onTimeUpdate) {
            player.on("timeupdate", () => {
              onTimeUpdate(player.currentTime() || 0);
            });
          }
          if (onDurationChange) {
            player.on("durationchange", () => {
              onDurationChange(player.duration() || 0);
            });
          }

          player.on("waiting", () => {
            if (!isWaitingRef.current) {
              isWaitingRef.current = true;
              onBufferStart?.();
            }
          });

          player.on("canplay", () => {
            if (isWaitingRef.current) {
              isWaitingRef.current = false;
              onBufferEnd?.();
            }
          });

          player.on("error", () => {
            const error = player.error();
            const message = error
              ? `${error.code}: ${error.message}`
              : "Unknown playback error";
            onError?.(message);
          });

          // Auto-play the swapped player
          player.play()?.catch((err) => {
            console.error(
              "[DualPlayer] Failed to auto-play swapped player:",
              err,
            );
          });

          // CRITICAL FIX: Restore fullscreen if we were in fullscreen before swap
          if (wasInFullscreen) {
            console.log("[DualPlayer] 🎬 Restoring fullscreen on new player");

            // Wait for DOM to settle and player to be ready
            setTimeout(() => {
              player
                .requestFullscreen()
                .then(() => {
                  console.log(
                    "[DualPlayer] ✅ Fullscreen restored successfully",
                  );
                  console.log(
                    "[DualPlayer] New player fullscreen state:",
                    player.isFullscreen(),
                  );
                })
                .catch((err) => {
                  console.error(
                    "[DualPlayer] ❌ Failed to restore fullscreen:",
                    err,
                  );
                  console.log(
                    "[DualPlayer] Player state after failure:",
                    player.isFullscreen(),
                  );
                });
            }, 150);
          }
        }
      },
    }));

    return (
      <>
        {/* Main player */}
        <div className="w-full rounded-lg overflow-hidden shadow-2xl">
          <div ref={videoRef} />
        </div>

        {/* Hidden preload player */}
        <div className="hidden">
          <div ref={preloadRef} />
        </div>
      </>
    );
  },
);

DualVideoPlayer.displayName = "DualVideoPlayer";

export default DualVideoPlayer;
