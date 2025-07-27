import create from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'

interface TMDBState {
  apiKey: string | null
  language: string
  includeAdult: boolean
  trending: any[]
  setApiKey: (key: string) => void
  setLanguage: (lang: string) => void
  setIncludeAdult: (include: boolean) => void
  searchContent: (query: string) => Promise<any[]>
  getTrending: () => Promise<void>
  getDetails: (id: string, type: 'movie' | 'tv') => Promise<any>
  enrichMetadata: (item: any) => Promise<any>
}

const TMDB_BASE_URL = 'https://api.themoviedb.org/3'

export const useTMDB = create<TMDBState>(
  persist(
    (set, get) => ({
      apiKey: null,
      language: 'en-US',
      includeAdult: false,
      trending: [],

      setApiKey: (key: string) => set({ apiKey: key }),
      setLanguage: (lang: string) => set({ language: lang }),
      setIncludeAdult: (include: boolean) => set({ includeAdult: include }),

      searchContent: async (query: string) => {
        const { apiKey, language, includeAdult } = get()
        if (!apiKey) return []

        try {
          const [movieResponse, tvResponse] = await Promise.all([
            axios.get(`${TMDB_BASE_URL}/search/movie`, {
              params: {
                api_key: apiKey,
                query,
                language,
                include_adult: includeAdult
              }
            }),
            axios.get(`${TMDB_BASE_URL}/search/tv`, {
              params: {
                api_key: apiKey,
                query,
                language,
                include_adult: includeAdult
              }
            })
          ])

          const movies = movieResponse.data.results.map((item: any) => ({
            ...item,
            type: 'movie',
            poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null
          }))

          const tvShows = tvResponse.data.results.map((item: any) => ({
            ...item,
            type: 'series',
            poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null
          }))

          return [...movies, ...tvShows]
        } catch (error) {
          console.error('TMDB search failed:', error)
          return []
        }
      },

      getTrending: async () => {
        const { apiKey, language } = get()
        if (!apiKey) return

        try {
          const response = await axios.get(`${TMDB_BASE_URL}/trending/all/week`, {
            params: {
              api_key: apiKey,
              language
            }
          })

          const trending = response.data.results.map((item: any) => ({
            id: item.id.toString(),
            title: item.title || item.name,
            type: item.media_type,
            poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
            backdrop: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : null,
            year: new Date(item.release_date || item.first_air_date).getFullYear(),
            rating: item.vote_average
          }))

          set({ trending })
        } catch (error) {
          console.error('Failed to fetch trending:', error)
        }
      },

      getDetails: async (id: string, type: 'movie' | 'tv') => {
        const { apiKey, language } = get()
        if (!apiKey) return null

        try {
          const response = await axios.get(`${TMDB_BASE_URL}/${type}/${id}`, {
            params: {
              api_key: apiKey,
              language,
              append_to_response: 'videos,credits'
            }
          })

          return {
            ...response.data,
            poster: response.data.poster_path ? `https://image.tmdb.org/t/p/w500${response.data.poster_path}` : null,
            backdrop: response.data.backdrop_path ? `https://image.tmdb.org/t/p/original${response.data.backdrop_path}` : null
          }
        } catch (error) {
          console.error('Failed to fetch details:', error)
          return null
        }
      },

      enrichMetadata: async (item: any) => {
        const details = await get().getDetails(item.id, item.type)
        if (!details) return item

        return {
          ...item,
          description: details.overview,
          cast: details.credits?.cast?.map((actor: any) => actor.name).slice(0, 10) || [],
          genres: details.genres?.map((genre: any) => genre.name) || [],
          trailer: details.videos?.results?.find((video: any) => 
            video.type === 'Trailer' && video.site === 'YouTube'
          )?.key || null
        }
      }
    }),
    {
      name: 'crumble-tmdb',
      version: 1,
      partialize: state => ({
        apiKey: state.apiKey,
        language: state.language,
        includeAdult: state.includeAdult
      })
    }
  )
)