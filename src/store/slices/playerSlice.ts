import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../index'

type PlayerType = 'hls.js' | 'shaka' | 'videojs'
type ExternalPlayerType = 'vlc' | 'infuse' | 'outplayer'
type QualityPreset = 'auto' | '1080p' | '720p' | '480p'

type PlayerConfig = {
  defaultQuality: QualityPreset
  autoplay: boolean
  useHDR: boolean
  preferredPlayer: PlayerType
  defaultExternalPlayer: ExternalPlayerType
}

type PlayerState = {
  currentVideo: string | null
  isPlaying: boolean
  volume: number
  isMuted: boolean
  currentTime: number
  duration: number
  isFullscreen: boolean
  quality: QualityPreset
  availableQualities: QualityPreset[]
  videoElement: any | null,
  playerConfig: PlayerConfig
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
      state.volume = Math.max(0, Math.min(1, action.payload))
    },
    setIsMuted: (state, action: PayloadAction<boolean>) => {
      state.isMuted = action.payload
    },
    setCurrentTime: (state, action: PayloadAction<number>) => {
      state.currentTime = Math.max(0, action.payload)
    },
    setDuration: (state, action: PayloadAction<number>) => {
      state.duration = Math.max(0, action.payload)
    },
    setIsFullscreen: (state, action: PayloadAction<boolean>) => {
      state.isFullscreen = action.payload
    },
    setQuality: (state, action: PayloadAction<QualityPreset>) => {
      state.quality = action.payload
    },
    setAvailableQualities: (state, action: PayloadAction<QualityPreset[]>) => {
      state.availableQualities = action.payload
    },
    setVideoElement: (state, action: PayloadAction<any | null>) => {
      state.videoElement = action.payload
    },
    updatePlayerConfig: (state, action: PayloadAction<Partial<PlayerConfig>>) => {
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

// Selectors with explicit return types
export const selectPlayer = (state: RootState): PlayerState => state.player
export const selectPlayerConfig = (state: RootState): PlayerConfig => state.player.playerConfig

export type { PlayerType, ExternalPlayerType, QualityPreset, PlayerConfig, PlayerState }
export default playerSlice.reducer