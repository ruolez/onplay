import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import videojs from 'video.js'
import Player from 'video.js/dist/types/player'
import 'video.js/dist/video-js.css'

interface VideoPlayerProps {
  src: string
  poster?: string
  onPlay?: () => void
  onPause?: () => void
  onEnded?: () => void
  onTimeUpdate?: (currentTime: number) => void
}

export interface VideoPlayerRef {
  getCurrentTime: () => number
  getPlayer: () => Player | null
}

const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(({
  src,
  poster,
  onPlay,
  onPause,
  onEnded,
  onTimeUpdate
}, ref) => {
  const videoRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<Player | null>(null)

  useImperativeHandle(ref, () => ({
    getCurrentTime: () => playerRef.current?.currentTime() || 0,
    getPlayer: () => playerRef.current
  }))

  useEffect(() => {
    if (!playerRef.current && videoRef.current) {
      const videoElement = document.createElement('video-js')
      videoElement.classList.add('vjs-big-play-centered')
      videoRef.current.appendChild(videoElement)

      const player = videojs(videoElement, {
        controls: true,
        responsive: true,
        fluid: true,
        preload: 'auto',
        poster,
        sources: [{
          src,
          type: 'application/x-mpegURL' // HLS
        }]
      })

      // Event listeners
      if (onPlay) player.on('play', onPlay)
      if (onPause) player.on('pause', onPause)
      if (onEnded) player.on('ended', onEnded)
      if (onTimeUpdate) {
        player.on('timeupdate', () => {
          onTimeUpdate(player.currentTime() || 0)
        })
      }

      playerRef.current = player
    }

    return () => {
      if (playerRef.current && !playerRef.current.isDisposed()) {
        playerRef.current.dispose()
        playerRef.current = null
      }
    }
  }, [src])

  return (
    <div className="w-full rounded-lg overflow-hidden shadow-2xl">
      <div ref={videoRef} />
    </div>
  )
})

VideoPlayer.displayName = 'VideoPlayer'

export default VideoPlayer
