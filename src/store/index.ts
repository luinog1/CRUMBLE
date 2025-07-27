import { configureStore } from '@reduxjs/toolkit'
import playerReducer from './slices/playerSlice'
import addonReducer from './slices/addonSlice'
import libraryReducer from './slices/librarySlice'
import tmdbReducer from './slices/tmdbSlice'

export const store = configureStore({
  reducer: {
    player: playerReducer,
    addons: addonReducer,
    library: libraryReducer,
    tmdb: tmdbReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for serialization checks
        ignoredActions: ['player/setVideoElement'],
        // Ignore these field paths in state for serialization checks
        ignoredPaths: ['player.videoElement'],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch