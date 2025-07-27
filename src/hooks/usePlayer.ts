import create from 'zustand'
import { Stream, PlayerConfig } from '@/types'

interface PlayerState {
  currentVideo: Stream | null
  playerConfig: PlayerConfig
  isPlaying: boolean
  volume: number
  isMuted: boolean
  playVideo: (videoId: string) => void
  pauseVideo: () => void
  setVolume: (volume: number) => void
  setMuted: (muted: boolean) => void
  setPlayerConfig: (config: PlayerConfig) => void
}

export const usePlayer = create<PlayerState>((set) => ({
  currentVideo: null,
  playerConfig: {
    type: 'hls.js',
    options: {
      autoplay: true,
      muted: false,
      controls: true,
      quality: {
        default: 'auto',
        options: ['auto', '1080p', '720p', '480p']
      }
    }
  },
  isPlaying: false,
  volume: 1,
  isMuted: false,

  playVideo: async (videoId: string) => {
    try {
      // Here you would typically fetch the stream URL from your addon system
      // For now, we'll use a placeholder
      const stream: Stream = {
        url: `https://example.com/stream/${videoId}`,
        title: 'Sample Stream',
        quality: '1080p',
        type: 'hls'
      }

      set({
        currentVideo: stream,
        isPlaying: true
      })
    } catch (error) {
      console.error('Failed to play video:', error)
    }
  },

  pauseVideo: () => {
    set({ isPlaying: false })
  },

  setVolume: (volume: number) => {
    set({ volume })
  },

  setMuted: (muted: boolean) => {
    set({ isMuted: muted })
  },

  setPlayerConfig: (config: PlayerConfig) => {
    set({ playerConfig: config })
  }
}))