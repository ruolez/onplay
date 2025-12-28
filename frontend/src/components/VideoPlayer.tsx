import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import videojs from "video.js";
import Player from "video.js/dist/types/player";
import "video.js/dist/video-js.css";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  autoplay?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
  onDurationChange?: (duration: number) => void;
}

export interface VideoPlayerRef {
  getCurrentTime: () => number;
  getPlayer: () => Player | null;
  play: () => Promise<void>;
  pause: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
}

const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(
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
    },
    ref,
  ) => {
    const videoRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<Player | null>(null);

    useImperativeHandle(ref, () => ({
      getCurrentTime: () => playerRef.current?.currentTime() || 0,
      getPlayer: () => playerRef.current,
      play: async () => {
        if (playerRef.current) {
          try {
            await playerRef.current.play();
          } catch (error) {
            console.error("Failed to play:", error);
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
      },
    }));

    useEffect(() => {
      if (!playerRef.current && videoRef.current) {
        const videoElement = document.createElement("video-js");
        videoElement.classList.add("vjs-big-play-centered");

        // Set HTML5 video attributes for mobile compatibility
        videoElement.setAttribute("playsinline", "true");
        videoElement.setAttribute("webkit-playsinline", "true");
        videoElement.setAttribute("x5-playsinline", "true"); // Tencent X5 browser

        videoRef.current.appendChild(videoElement);

        const player = videojs(videoElement, {
          controls: true,
          responsive: true,
          fluid: true,
          preload: "auto",
          poster,
          playsinline: true,
          autoplay: autoplay || false,
          muted: autoplay ? true : false, // Mute if autoplay (required for most browsers)
          sources: [
            {
              src,
              type: "application/x-mpegURL", // HLS
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
              bufferBasedABR: true,
              useBandwidthFromLocalStorage: true,
              enableLowInitialPlaylist: true,
              useNetworkInformationApi: true,
              limitRenditionByPlayerDimensions: true,
              useDevicePixelRatio: true,
            },
            nativeVideoTracks: false,
            nativeAudioTracks: false,
            nativeTextTracks: false,
          },
        });

        console.log("[VideoPlayer] ✅ Player initialized for source:", src);

        // Handle autoplay - unmute after play starts if autoplay was enabled
        if (autoplay) {
          player.one("play", () => {
            // Unmute after first play to avoid autoplay restrictions
            player.muted(false);
          });
        }

        // Event listeners
        if (onPlay) player.on("play", () => {
          console.log("[VideoPlayer] ▶️ Play event fired");
          onPlay();
        });
        if (onPause) player.on("pause", () => {
          console.log("[VideoPlayer] ⏸️ Pause event fired");
          onPause();
        });
        if (onEnded) player.on("ended", () => {
          console.log("[VideoPlayer] ⏹️ Ended event fired");
          onEnded();
        });
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

        // Quality level debugging - wait for player to be ready
        player.ready(() => {
          console.log("[VideoPlayer] 🎬 Player ready, setting up quality monitoring");

          try {
            const tech = player.tech({ IWillNotUseThisInPlugins: true });
            console.log("[VideoPlayer] 🔧 Tech object:", tech ? "available" : "not available");

            if (tech) {
              const vhs = (tech as any).vhs;
              console.log("[VideoPlayer] 📺 VHS object:", vhs ? "available" : "not available");

              if (vhs) {
                // Log initial playlists
                setTimeout(() => {
                  try {
                    if (vhs.playlists?.master?.playlists) {
                      console.log("[VideoPlayer] 📋 Available quality variants:",
                        vhs.playlists.master.playlists.map((p: any) => ({
                          bandwidth: p.attributes?.BANDWIDTH,
                          uri: p.uri
                        }))
                      );
                    }

                    if (vhs.playlists?.media_) {
                      console.log("[VideoPlayer] 🎵 Initial quality:", {
                        bandwidth: vhs.playlists.media_.attributes?.BANDWIDTH,
                        uri: vhs.playlists.media_.uri
                      });
                    }
                  } catch (err) {
                    console.error("[VideoPlayer] Error reading playlists:", err);
                  }
                }, 1000);

                // Track quality switches
                let lastQuality = "";
                const checkQuality = () => {
                  try {
                    if (vhs.playlists?.media_) {
                      const current = vhs.playlists.media_;
                      const uri = current.uri || "";
                      if (uri && uri !== lastQuality) {
                        lastQuality = uri;
                        console.log("[VideoPlayer] 🔄 Quality changed:", {
                          bandwidth: current.attributes?.BANDWIDTH,
                          uri: uri.split("/").pop(),
                          systemBandwidth: vhs.systemBandwidth
                        });
                      }
                    }
                  } catch (err) {
                    // Silently fail
                  }
                };

                setInterval(checkQuality, 2000); // Check every 2 seconds
              }
            }
          } catch (error) {
            console.error("[VideoPlayer] Error setting up quality monitoring:", error);
          }
        });

        playerRef.current = player;
      }

      return () => {
        if (playerRef.current && !playerRef.current.isDisposed()) {
          playerRef.current.dispose();
          playerRef.current = null;
        }
      };
    }, [src]);

    return (
      <div className="w-full rounded-lg overflow-hidden shadow-2xl">
        <div ref={videoRef} />
      </div>
    );
  },
);

VideoPlayer.displayName = "VideoPlayer";

export default VideoPlayer;
