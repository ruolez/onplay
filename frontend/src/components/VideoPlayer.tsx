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
}

export interface VideoPlayerRef {
  getCurrentTime: () => number;
  getPlayer: () => Player | null;
}

const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(
  ({ src, poster, autoplay, onPlay, onPause, onEnded, onTimeUpdate }, ref) => {
    const videoRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<Player | null>(null);

    useImperativeHandle(ref, () => ({
      getCurrentTime: () => playerRef.current?.currentTime() || 0,
      getPlayer: () => playerRef.current,
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
            },
            nativeVideoTracks: false,
            nativeAudioTracks: false,
            nativeTextTracks: false,
          },
        });

        // Handle autoplay - unmute after play starts if autoplay was enabled
        if (autoplay) {
          player.one("play", () => {
            // Unmute after first play to avoid autoplay restrictions
            player.muted(false);
          });
        }

        // Event listeners
        if (onPlay) player.on("play", onPlay);
        if (onPause) player.on("pause", onPause);
        if (onEnded) player.on("ended", onEnded);
        if (onTimeUpdate) {
          player.on("timeupdate", () => {
            onTimeUpdate(player.currentTime() || 0);
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
