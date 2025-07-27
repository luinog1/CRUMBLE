import { create } from 'zustand'

import { useTMDB } from './useTMDB'

type EnrichedItem = {
  id: string
  title: string
  type: 'movie' | 'series'
  poster: string | null
  backdrop: string | null
  year?: number
  rating?: number
  description?: string
  cast?: string[]
  genres?: string[]
  trailer?: string | null
}

type FeaturedContent = {
  title: string
  description: string
  backgroundImage: string
  videoId: string
  type: 'movie' | 'series'
}

type FeaturedState = {
  featured: FeaturedContent | null
  loading: boolean
  error: string | null
  lastUpdate: number
  fetchFeatured: () => Promise<void>
}

export const useFeatured = create<FeaturedState>(
  ((set) => ({
    featured: null,
    loading: false,
    error: null,
    lastUpdate: 0,
    fetchFeatured: async () => {
      const { getTrending } = useTMDB.getState()
      const currentTime = Date.now()
      const lastUpdate = useFeatured.getState().lastUpdate
      const updateInterval = parseInt(localStorage.getItem('heroUpdateInterval') || '24') * 60 * 60 * 1000

      // Return if not enough time has passed since last update
      if (currentTime - lastUpdate < updateInterval) {
        return
      }
      
      try {
        set({ loading: true, error: null })
        
        const trending = await getTrending()
        if (!trending || !Array.isArray(trending) || trending.length === 0) {
          throw new Error('No trending content available')
        }

        const randomIndex = Math.floor(Math.random() * trending.length)
        const item = trending[randomIndex] as EnrichedItem

        if (!item.id || !item.description || !item.backdrop) {
          throw new Error('Invalid trending item data')
        }

        const featured: FeaturedContent = {
          title: item.title,
          description: item.description,
          backgroundImage: item.backdrop,
          videoId: `tmdb-${item.type}-${item.id}`,
          type: item.type
        }

        set({ featured, loading: false, lastUpdate: currentTime })
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to fetch featured content',
          loading: false,
          featured: null
        })
      }
    }
  }))
)