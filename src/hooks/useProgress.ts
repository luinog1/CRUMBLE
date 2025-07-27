import { create } from 'zustand'
import { StateCreator } from 'zustand'
import { persist } from 'zustand/middleware'
import { createJSONStorage } from 'zustand/middleware'
import type { WatchProgress, LibraryItem } from '@/types'

type ProgressState = {
  progress: Record<string, WatchProgress>
  library: LibraryItem[]
  updateProgress: (progress: WatchProgress) => void
  getProgress: (id: string) => WatchProgress | null
  addToLibrary: (item: LibraryItem) => void
  removeFromLibrary: (id: string) => void
  getContinueWatching: () => LibraryItem[]
  syncProgress: () => Promise<void>
}



export const useProgress = create<ProgressState>()(
  persist(
    ((set, get) => ({
      progress: {},
      library: [],

      updateProgress: (progress: WatchProgress) => {
        if (!progress?.id) return

        set(state => ({
          progress: {
            ...state.progress,
            [progress.id]: progress
          }
        }))

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
        if (!id) return null
        return get().progress[id] || null
      },

      addToLibrary: (item: LibraryItem) => {
        if (!item?.id) return

        set(state => {
          const exists = state.library.some(i => i.id === item.id)
          if (exists) return state
          
          return {
            library: [...state.library, item]
          }
        })
      },

      removeFromLibrary: (id: string) => {
        if (!id) return

        set(state => ({
          library: state.library.filter(item => item.id !== id)
        }))
      },

      getContinueWatching: () => {
        const { library, progress } = get()
        return library
          .filter((item: LibraryItem) => {
            const itemProgress = progress[item.id]
            return itemProgress && 
                   !itemProgress.completed && 
                   itemProgress.position > 0
          })
          .sort((a: LibraryItem, b: LibraryItem) => {
            const aProgress = progress[a.id]
            const bProgress = progress[b.id]
            return (bProgress?.lastWatched || 0) - (aProgress?.lastWatched || 0)
          })
          .slice(0, 10)
      },

      syncProgress: async () => {
        try {
          // This would typically sync with a remote service like Trakt
          await Promise.resolve()
        } catch (error) {
          console.error('Failed to sync progress:', error)
        }
      }
    })) as StateCreator<ProgressState>,
    {
      name: 'crumble-progress',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        progress: state.progress,
        library: state.library
      }),
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Handle migration from version 0 to 1
          return {
            ...persistedState,
            // Add any necessary migrations here
          }
        }
        return persistedState
      }
    }
  )
)