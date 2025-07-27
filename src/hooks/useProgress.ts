import create from 'zustand'
import { persist } from 'zustand/middleware'
import { WatchProgress, LibraryItem } from '@/types'

interface ProgressState {
  progress: Record<string, WatchProgress>
  library: LibraryItem[]
  updateProgress: (progress: WatchProgress) => void
  getProgress: (id: string) => WatchProgress | null
  addToLibrary: (item: LibraryItem) => void
  removeFromLibrary: (id: string) => void
  getContinueWatching: () => LibraryItem[]
  syncProgress: () => Promise<void>
}

export const useProgress = create<ProgressState>(
  persist(
    (set, get) => ({
      progress: {},
      library: [],

      updateProgress: (progress: WatchProgress) => {
        set(state => ({
          progress: {
            ...state.progress,
            [progress.id]: progress
          }
        }))

        // Update library item if it exists
        const library = get().library
        const itemIndex = library.findIndex(item => item.id === progress.id)
        if (itemIndex !== -1) {
          const updatedLibrary = [...library]
          updatedLibrary[itemIndex] = {
            ...updatedLibrary[itemIndex],
            progress
          }
          set({ library: updatedLibrary })
        }
      },

      getProgress: (id: string) => {
        return get().progress[id] || null
      },

      addToLibrary: (item: LibraryItem) => {
        set(state => {
          const exists = state.library.some(i => i.id === item.id)
          if (exists) {
            return state
          }
          return {
            library: [...state.library, item]
          }
        })
      },

      removeFromLibrary: (id: string) => {
        set(state => ({
          library: state.library.filter(item => item.id !== id)
        }))
      },

      getContinueWatching: () => {
        const { library, progress } = get()
        return library
          .filter(item => {
            const itemProgress = progress[item.id]
            return itemProgress && 
                   !itemProgress.completed && 
                   itemProgress.position > 0
          })
          .sort((a, b) => {
            const aProgress = progress[a.id]
            const bProgress = progress[b.id]
            return (bProgress?.lastWatched || 0) - (aProgress?.lastWatched || 0)
          })
          .slice(0, 10) // Limit to 10 items
      },

      syncProgress: async () => {
        // This would typically sync with a remote service like Trakt
        // For now, we'll just persist to localStorage via zustand/persist
        return Promise.resolve()
      }
    }),
    {
      name: 'crumble-progress',
      version: 1,
      partialize: state => ({
        progress: state.progress,
        library: state.library
      })
    }
  )
)