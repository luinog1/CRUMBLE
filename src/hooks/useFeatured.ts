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

type StremioMeta = {
  id: string
  name: string
  description: string
  poster: string
  background: string
  type: string
}

type FeaturedState = {
  featured: FeaturedContent | null
  loading: boolean
  error: string | null
  lastUpdate: number
  fetchFeatured: () => Promise<void>
}

const fetchStremioFeatured = async (): Promise<FeaturedContent> => {
  const response = await fetch('https://v3-cinemeta.strem.io/catalog/movie/top.json')
  if (!response.ok) {
    throw new Error('Failed to fetch from Stremio')
  }
  
  const data = await response.json()
  if (!data.metas || !Array.isArray(data.metas) || data.metas.length === 0) {
    throw new Error('No content available from Stremio')
  }

  const randomIndex = Math.floor(Math.random() * data.metas.length)
  const item = data.metas[randomIndex] as StremioMeta

  return {
    title: item.name,
    description: item.description,
    backgroundImage: item.background || item.poster,
    videoId: `stremio-movie-${item.id}`,
    type: 'movie'
  }
}

export const useFeatured = create<FeaturedState>(
  ((set) => ({
    featured: null,
    loading: false,
    error: null,
    lastUpdate: 0,
    fetchFeatured: async () => {
      const { getTrending, apiKey } = useTMDB.getState()
      const currentTime = Date.now()
      const lastUpdate = useFeatured.getState().lastUpdate
      const updateInterval = parseInt(localStorage.getItem('heroUpdateInterval') || '24') * 60 * 60 * 1000

      // Return if not enough time has passed since last update
      if (currentTime - lastUpdate < updateInterval) {
        return
      }

      set({ loading: true, error: null })
      
      try {
        let featured: FeaturedContent | null = null

        // Try TMDB first if API key is available
        if (apiKey) {
          const trending = await getTrending()
          if (trending && Array.isArray(trending) && trending.length > 0) {
            const randomIndex = Math.floor(Math.random() * trending.length)
            const item = trending[randomIndex] as EnrichedItem

            if (item.id && item.description && (item.backdrop || item.poster)) {
              featured = {
                title: item.title,
                description: item.description,
                backgroundImage: item.backdrop || item.poster || '',
                videoId: `tmdb-${item.type}-${item.id}`,
                type: item.type
              }
            }
          }
        }

        // Fallback to Stremio if TMDB failed or is not configured
        if (!featured) {
          featured = await fetchStremioFeatured()
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