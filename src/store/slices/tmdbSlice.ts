import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../index'

interface TMDBConfig {
  apiKey?: string
  includeAdult?: boolean
  language?: string
}

interface TMDBState extends TMDBConfig {
  trending: {
    movies: any[]
    tvShows: any[]
    lastFetched: number | null
  }
  searchResults: {
    query: string
    results: any[]
    page: number
    totalPages: number
    lastFetched: number | null
  }
  cache: {
    [key: string]: {
      data: any
      timestamp: number
    }
  }
  error: string | null
}

const initialState: TMDBState = {
  apiKey: undefined,
  language: 'en-US',
  includeAdult: false,
  trending: {
    movies: [],
    tvShows: [],
    lastFetched: null,
  },
  searchResults: {
    query: '',
    results: [],
    page: 1,
    totalPages: 1,
    lastFetched: null,
  },
  cache: {},
  error: null,
}

const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes

export const fetchTrending = createAsyncThunk(
  'tmdb/fetchTrending',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as RootState
    const { apiKey } = state.tmdb

    if (!apiKey) {
      return rejectWithValue('TMDB API key not configured')
    }

    const [moviesResponse, tvResponse] = await Promise.all([
      fetch(
        `https://api.themoviedb.org/3/trending/movie/week?api_key=${apiKey}&language=${state.tmdb.language || 'en-US'}`
      ),
      fetch(
        `https://api.themoviedb.org/3/trending/tv/week?api_key=${apiKey}&language=${state.tmdb.language || 'en-US'}`
      ),
    ])

    if (!moviesResponse.ok || !tvResponse.ok) {
      return rejectWithValue('Failed to fetch trending content')
    }

    const [movies, tvShows] = await Promise.all([
      moviesResponse.json(),
      tvResponse.json(),
    ])

    return {
      movies: movies.results,
      tvShows: tvShows.results,
    }
  }
)

export const searchContent = createAsyncThunk(
  'tmdb/searchContent',
  async (
    { query, page = 1 }: { query: string; page?: number },
    { getState, rejectWithValue }
  ) => {
    const state = getState() as RootState
    const { apiKey, language, includeAdult } = state.tmdb

    if (!apiKey) {
      return rejectWithValue('TMDB API key not configured')
    }

    const response = await fetch(
      `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&language=${language || 'en-US'}&query=${encodeURIComponent(
        query
      )}&page=${page}&include_adult=${includeAdult || false}`
    )

    if (!response.ok) {
      return rejectWithValue('Failed to search content')
    }

    const data = await response.json()
    return {
      results: data.results,
      page: data.page,
      totalPages: data.total_pages,
      query,
    }
  }
)

export const getDetails = createAsyncThunk(
  'tmdb/getDetails',
  async (
    { id, type }: { id: string; type: 'movie' | 'tv' },
    { getState, rejectWithValue }
  ) => {
    const state = getState() as RootState
    const { apiKey, language } = state.tmdb

    if (!apiKey) {
      return rejectWithValue('TMDB API key not configured')
    }

    const response = await fetch(
      `https://api.themoviedb.org/3/${type}/${id}?api_key=${apiKey}&language=${language || 'en-US'}&append_to_response=videos,credits`
    )

    if (!response.ok) {
      return rejectWithValue('Failed to fetch details')
    }

    const data = await response.json()
    return { id, data }
  }
)

export const tmdbSlice = createSlice({
  name: 'tmdb',
  initialState,
  reducers: {
    setApiKey: (state, action: PayloadAction<string | undefined>) => {
      state.apiKey = action.payload
    },
    setLanguage: (state, action: PayloadAction<string>) => {
      state.language = action.payload
    },
    setIncludeAdult: (state, action: PayloadAction<boolean>) => {
      state.includeAdult = action.payload
    },
    clearCache: (state) => {
      state.cache = {}
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Trending
      .addCase(fetchTrending.fulfilled, (state, action) => {
        state.trending.movies = action.payload.movies
        state.trending.tvShows = action.payload.tvShows
        state.trending.lastFetched = Date.now()
        state.error = null
      })
      .addCase(fetchTrending.rejected, (state, action) => {
        state.error = action.payload as string
      })
      // Search
      .addCase(searchContent.fulfilled, (state, action) => {
        state.searchResults = {
          query: action.payload.query,
          results: action.payload.results,
          page: action.payload.page,
          totalPages: action.payload.totalPages,
          lastFetched: Date.now(),
        }
        state.error = null
      })
      .addCase(searchContent.rejected, (state, action) => {
        state.error = action.payload as string
      })
      // Details
      .addCase(getDetails.fulfilled, (state, action) => {
        state.cache[`${action.meta.arg.type}_${action.meta.arg.id}`] = {
          data: action.payload.data,
          timestamp: Date.now(),
        }
        state.error = null
      })
      .addCase(getDetails.rejected, (state, action) => {
        state.error = action.payload as string
      })
  },
})

export const {
  setApiKey,
  setLanguage,
  setIncludeAdult,
  clearCache,
  clearError,
} = tmdbSlice.actions

// Selectors
export const selectTMDBConfig = (state: RootState) => ({
  apiKey: state.tmdb.apiKey,
  language: state.tmdb.language,
  includeAdult: state.tmdb.includeAdult,
})

export const selectTrending = (state: RootState) => state.tmdb.trending

export const selectSearchResults = (state: RootState) => state.tmdb.searchResults

export const selectCachedDetails = (id: string, type: 'movie' | 'tv') =>
  (state: RootState) => {
    const cache = state.tmdb.cache[`${type}_${id}`]
    if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
      return cache.data
    }
    return null
  }

export const selectTMDBError = (state: RootState) => state.tmdb.error

export default tmdbSlice.reducer