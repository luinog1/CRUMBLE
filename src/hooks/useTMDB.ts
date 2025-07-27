import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createJSONStorage } from 'zustand/middleware'

type TMDBItem = {
  id: number
  title?: string
  name?: string
  media_type: 'movie' | 'tv'
  poster_path?: string
  backdrop_path?: string
  release_date?: string
  first_air_date?: string
  vote_average?: number
  overview?: string
}

type TMDBDetails = TMDBItem & {
  videos?: {
    results: Array<{
      type: string
      site: string
      key: string
    }>
  }
  credits?: {
    cast: Array<{
      name: string
    }>
  }
  genres?: Array<{
    name: string
  }>
}

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

type TMDBState = {
  apiKey: string | undefined
  language: string
  includeAdult: boolean
  trending: EnrichedItem[]
  setApiKey: (key: string) => void
  setLanguage: (lang: string) => void
  setIncludeAdult: (include: boolean) => void
  searchContent: (query: string) => Promise<EnrichedItem[]>
  getTrending: () => Promise<EnrichedItem[]>
  getDetails: (id: string, type: 'movie' | 'tv') => Promise<TMDBDetails | null>
  enrichMetadata: (item: EnrichedItem) => Promise<EnrichedItem>
}

import { StateCreator } from 'zustand'

const TMDB_BASE_URL = 'https://api.themoviedb.org/3'

export const useTMDB = create<TMDBState>()(
  persist(
    ((set: any, get: any) => ({
      apiKey: undefined,
      language: 'en-US',
      includeAdult: false,
      trending: [],

      setApiKey: (key: string) => set({ apiKey: key }),
      setLanguage: (lang: string) => set({ language: lang }),
      setIncludeAdult: (include: boolean) => set({ includeAdult: include }),

      searchContent: async (query: string) => {
        const { apiKey, language, includeAdult } = get()
        if (!apiKey || !query) return []

        try {
          const [movieResponse, tvResponse] = await Promise.all([
            fetch(`${TMDB_BASE_URL}/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=${language}&include_adult=${includeAdult}`).then(res => res.json()),
            fetch(`${TMDB_BASE_URL}/search/tv?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=${language}&include_adult=${includeAdult}`).then(res => res.json())
          ])

          const movies = (movieResponse.results || []).map((item: TMDBItem) => ({
            id: item.id.toString(),
            title: item.title || item.name || 'Unknown Title',
            type: 'movie' as const,
            poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
            backdrop: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : null,
            year: item.release_date ? new Date(item.release_date).getFullYear() : undefined,
            rating: item.vote_average
          }))

          const tvShows = (tvResponse.results || []).map((item: TMDBItem) => ({
            id: item.id.toString(),
            title: item.name || item.title || 'Unknown Title',
            type: 'series' as const,
            poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
            backdrop: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : null,
            year: item.first_air_date ? new Date(item.first_air_date).getFullYear() : undefined,
            rating: item.vote_average
          }))

          return [...movies, ...tvShows]
        } catch (error) {
          console.error('TMDB search failed:', error)
          return []
        }
      },

      getTrending: async () => {
        const { apiKey, language } = get()
        if (!apiKey) return []

        try {
          const response = await fetch(
            `${TMDB_BASE_URL}/trending/all/week?api_key=${apiKey}&language=${language}`
          ).then(res => res.json())

          const trending = (response.results || []).map((item: TMDBItem) => ({
            id: item.id.toString(),
            title: item.title || item.name || 'Unknown Title',
            type: item.media_type === 'movie' ? 'movie' : 'series',
            poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
            backdrop: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : null,
            year: item.release_date ? new Date(item.release_date).getFullYear() :
                  item.first_air_date ? new Date(item.first_air_date).getFullYear() : undefined,
            rating: item.vote_average
          }))

          set({ trending })
          return trending
        } catch (error) {
          console.error('Failed to fetch trending:', error)
          return []
        }
      },

      getDetails: async (id: string, type: 'movie' | 'tv') => {
        const { apiKey, language } = get()
        if (!apiKey || !id) return null

        try {
          const response = await fetch(
            `${TMDB_BASE_URL}/${type}/${id}?api_key=${apiKey}&language=${language}&append_to_response=videos,credits`
          ).then(res => res.json())

          return response as TMDBDetails
        } catch (error) {
          console.error('Failed to fetch details:', error)
          return null
        }
      },

      enrichMetadata: async (item: EnrichedItem) => {
        const details = await get().getDetails(item.id, item.type === 'movie' ? 'movie' : 'tv')
        if (!details) return item

        return {
          ...item,
          description: details.overview,
          cast: details.credits?.cast?.map((actor: { name: string }) => actor.name).slice(0, 10) || [],
          genres: details.genres?.map((genre: { name: string }) => genre.name) || [],
          trailer: details.videos?.results?.find((video: { type: string; site: string; key: string }) => 
            video.type === 'Trailer' && video.site === 'YouTube'
          )?.key || null
        }
      }
    })) as StateCreator<TMDBState>,
    {
      name: 'crumble-tmdb',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        apiKey: state.apiKey,
        language: state.language,
        includeAdult: state.includeAdult
      })
    }
  )
)