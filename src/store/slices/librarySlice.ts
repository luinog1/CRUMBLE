import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../index'
import type { LibraryItem, WatchProgress } from '@/types'

type SyncService = 'trakt' | 'local' | null

type LibraryState = {
  items: LibraryItem[]
  progress: Record<string, WatchProgress>
  lastSync: number | null
  syncEnabled: boolean
  syncService: SyncService
  syncError: string | null
}

type ImportLibraryPayload = {
  items: LibraryItem[]
  progress: Record<string, WatchProgress>
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
      const exists = state.items.some((item) => item.id === action.payload.id)
      if (!exists) {
        state.items.push(action.payload)
      }
    },
    removeFromLibrary: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload)
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
    setSyncService: (state, action: PayloadAction<SyncService>) => {
      state.syncService = action.payload
    },
    setLastSync: (state, action: PayloadAction<number>) => {
      state.lastSync = action.payload
    },
    setSyncError: (state, action: PayloadAction<string | null>) => {
      state.syncError = action.payload
    },
    importLibrary: (state, action: PayloadAction<ImportLibraryPayload>) => {
      // Merge imported data with existing data
      const existingIds = new Set(state.items.map((item) => item.id))
      const newItems = action.payload.items.filter((item) => !existingIds.has(item.id))
      
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

// Selectors with explicit return types
export const selectLibraryItems = (state: RootState): LibraryItem[] => state.library.items
export const selectProgress = (state: RootState): Record<string, WatchProgress> => state.library.progress
export const selectItemProgress = (id: string) => (state: RootState): WatchProgress | undefined => state.library.progress[id]
export const selectSyncStatus = (state: RootState): {
  enabled: boolean
  service: SyncService
  lastSync: number | null
  error: string | null
} => ({
  enabled: state.library.syncEnabled,
  service: state.library.syncService,
  lastSync: state.library.lastSync,
  error: state.library.syncError,
})

// Helper selectors with explicit return types
export const selectContinueWatching = (state: RootState): LibraryItem[] => {
  return state.library.items.filter((item) => {
    const progress = state.library.progress[item.id]
    return progress && !progress.completed && progress.position > 0
  })
}

export const selectCompletedItems = (state: RootState): LibraryItem[] => {
  return state.library.items.filter((item) => {
    const progress = state.library.progress[item.id]
    return progress && progress.completed
  })
}

export default librarySlice.reducer