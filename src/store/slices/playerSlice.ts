import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../index'

interface PlayerState {
  currentVideo: string | null
  isPlaying: boolean
  volume: number
  isMuted: boolean
  currentTime: number
  duration: number
  isFullscreen: boolean
  quality: string
  availableQualities: string[]
  videoElement: HTMLVideoElement | null
  playerConfig: {
    defaultQuality: string
    autoplay: boolean
    useHDR: boolean
    preferredPlayer: 'hls.js' | 'shaka' | 'videojs'
    defaultExternalPlayer: 'vlc' | 'infuse' | 'outplayer'
  }
}

const initialState: PlayerState = {
  currentVideo: null,
  isPlaying: false,
  volume: 1,
  isMuted: false,
  currentTime: 0,
  duration: 0,
  isFullscreen: false,
  quality: 'auto',
  availableQualities: ['auto'],
  videoElement: null,
  playerConfig: {
    defaultQuality: 'auto',
    autoplay: true,
    useHDR: false,
    preferredPlayer: 'hls.js',
    defaultExternalPlayer: 'vlc',
  },
}

export const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    setCurrentVideo: (state, action: PayloadAction<string | null>) => {
      state.currentVideo = action.payload
      if (action.payload === null) {
        state.isPlaying = false
        state.currentTime = 0
        state.duration = 0
      }
    },
    setIsPlaying: (state, action: PayloadAction<boolean>) => {
      state.isPlaying = action.payload
    },
    setVolume: (state, action: PayloadAction<number>) => {
      state.volume = action.payload
    },
    setIsMuted: (state, action: PayloadAction<boolean>) => {
      state.isMuted = action.payload
    },
    setCurrentTime: (state, action: PayloadAction<number>) => {
      state.currentTime = action.payload
    },
    setDuration: (state, action: PayloadAction<number>) => {
      state.duration = action.payload
    },
    setIsFullscreen: (state, action: PayloadAction<boolean>) => {
      state.isFullscreen = action.payload
    },
    setQuality: (state, action: PayloadAction<string>) => {
      state.quality = action.payload
    },
    setAvailableQualities: (state, action: PayloadAction<string[]>) => {
      state.availableQualities = action.payload
    },
    setVideoElement: (state, action: PayloadAction<HTMLVideoElement | null>) => {
      state.videoElement = action.payload
    },
    updatePlayerConfig: (state, action: PayloadAction<Partial<PlayerState['playerConfig']>>) => {
      state.playerConfig = { ...state.playerConfig, ...action.payload }
    },
  },
})

export const {
  setCurrentVideo,
  setIsPlaying,
  setVolume,
  setIsMuted,
  setCurrentTime,
  setDuration,
  setIsFullscreen,
  setQuality,
  setAvailableQualities,
  setVideoElement,
  updatePlayerConfig,
} = playerSlice.actions

export const selectPlayer = (state: RootState) => state.player
export const selectPlayerConfig = (state: RootState) => state.player.playerConfig

export default playerSlice.reducer