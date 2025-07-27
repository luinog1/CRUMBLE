import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../index'
import type { LibraryItem, WatchProgress } from '@types'

interface LibraryState {
  items: LibraryItem[]
  progress: Record<string, WatchProgress>
  lastSync: number | null
  syncEnabled: boolean
  syncService: 'trakt' | 'local' | null
  syncError: string | null
}

const initialState: LibraryState = {
  items: [],
  progress: {},
  lastSync: null,
  syncEnabled: false,
  syncService: 'local',
  syncError: null,
}

export const librarySlice = createSlice({
  name: 'library',
  initialState,
  reducers: {
    addToLibrary: (state, action: PayloadAction<LibraryItem>) => {
      const exists = state.items.some((item: LibraryItem) => item.id === action.payload.id)
      if (!exists) {
        state.items.push(action.payload)
      }
    },
    removeFromLibrary: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item: LibraryItem) => item.id !== action.payload)
      delete state.progress[action.payload]
    },
    updateProgress: (state, action: PayloadAction<{ id: string; progress: WatchProgress }>) => {
      const { id, progress } = action.payload
      state.progress[id] = {
        ...state.progress[id],
        ...progress,
        lastWatched: Date.now(),
      }
    },
    clearProgress: (state, action: PayloadAction<string>) => {
      delete state.progress[action.payload]
    },
    setSyncEnabled: (state, action: PayloadAction<boolean>) => {
      state.syncEnabled = action.payload
    },
    setSyncService: (state, action: PayloadAction<'trakt' | 'local' | null>) => {
      state.syncService = action.payload
    },
    setLastSync: (state, action: PayloadAction<number>) => {
      state.lastSync = action.payload
    },
    setSyncError: (state, action: PayloadAction<string | null>) => {
      state.syncError = action.payload
    },
    importLibrary: (state, action: PayloadAction<{ items: LibraryItem[]; progress: Record<string, WatchProgress> }>) => {
      // Merge imported data with existing data
      const existingIds = new Set(state.items.map((item: LibraryItem) => item.id))
      const newItems = action.payload.items.filter((item: LibraryItem) => !existingIds.has(item.id))
      
      state.items = [...state.items, ...newItems]
      state.progress = {
        ...state.progress,
        ...action.payload.progress,
      }
    },
    clearLibrary: (state) => {
      state.items = []
      state.progress = {}
      state.lastSync = null
    },
  },
})

export const {
  addToLibrary,
  removeFromLibrary,
  updateProgress,
  clearProgress,
  setSyncEnabled,
  setSyncService,
  setLastSync,
  setSyncError,
  importLibrary,
  clearLibrary,
} = librarySlice.actions

// Selectors
export const selectLibraryItems = (state: RootState) => state.library.items
export const selectProgress = (state: RootState) => state.library.progress
export const selectItemProgress = (id: string) => (state: RootState) => state.library.progress[id]
export const selectSyncStatus = (state: RootState) => ({
  enabled: state.library.syncEnabled,
  service: state.library.syncService,
  lastSync: state.library.lastSync,
  error: state.library.syncError,
})

// Helper selector to get items with progress
export const selectContinueWatching = (state: RootState) => {
  return state.library.items.filter((item: LibraryItem) => {
    const progress = state.library.progress[item.id]
    return progress && !progress.completed && progress.position > 0
  })
}

// Helper selector to get completed items
export const selectCompletedItems = (state: RootState) => {
  return state.library.items.filter((item: LibraryItem) => {
    const progress = state.library.progress[item.id]
    return progress && progress.completed
  })
}

export default librarySlice.reducer