import { useState, useEffect, useCallback } from 'react'
import { netflixApiClient, TMDBGenre, TMDBMovie, TMDBResponse, StreamsResponse } from '../services/NetflixApiClient'

// Netflix Clone API Hook
// Provides the same functionality as the original Netflix clone with enhanced features

interface UseNetflixApiState {
  loading: boolean
  error: string | null
  genres: TMDBGenre[]
  moviesByGenre: Record<number, TMDBMovie[]>
  trendingMovies: TMDBMovie[]
  trendingTV: TMDBMovie[]
  popularMovies: TMDBMovie[]
  topRatedTV: TMDBMovie[]
  searchResults: TMDBMovie[]
  streams: Record<string, any[]>
}

interface UseNetflixApiActions {
  fetchGenres: () => Promise<void>
  fetchMoviesByGenre: (genreId: number, page?: number) => Promise<void>
  fetchMovieDetails: (movieId: number) => Promise<any>
  fetchTrendingMovies: () => Promise<void>
  fetchTrendingTV: () => Promise<void>
  fetchPopularMovies: (page?: number) => Promise<void>
  fetchTopRatedTV: (page?: number) => Promise<void>
  searchContent: (query: string, type?: 'movie' | 'tv' | 'multi') => Promise<void>
  findStreams: (type: 'movie' | 'series', id: string) => Promise<any[]>
  getTVDetails: (tvId: number) => Promise<any>
  getTVSeason: (tvId: number, seasonNumber: number) => Promise<any>
  clearError: () => void
  clearSearchResults: () => void
}

export const useNetflixApi = (): UseNetflixApiState & UseNetflixApiActions => {
  const [state, setState] = useState<UseNetflixApiState>({
    loading: false,
    error: null,
    genres: [],
    moviesByGenre: {},
    trendingMovies: [],
    trendingTV: [],
    popularMovies: [],
    topRatedTV: [],
    searchResults: [],
    streams: {}
  })

  const setLoading = (loading: boolean) => {
    setState(prev => ({ ...prev, loading }))
  }

  const setError = (error: string | null) => {
    setState(prev => ({ ...prev, error }))
  }

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const clearSearchResults = useCallback(() => {
    setState(prev => ({ ...prev, searchResults: [] }))
  }, [])

  // Netflix Clone Protocol Implementation

  const fetchGenres = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await netflixApiClient.getGenres()
      setState(prev => ({ ...prev, genres: response.genres }))
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch genres')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchMoviesByGenre = useCallback(async (genreId: number, page?: number) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await netflixApiClient.getMoviesByGenre(genreId, page)
      setState(prev => ({
        ...prev,
        moviesByGenre: {
          ...prev.moviesByGenre,
          [genreId]: response.results
        }
      }))
    } catch (error) {
      setError(error instanceof Error ? error.message : `Failed to fetch movies for genre ${genreId}`)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchMovieDetails = useCallback(async (movieId: number) => {
    try {
      setLoading(true)
      setError(null)
      
      const details = await netflixApiClient.getMovieDetails(movieId)
      return details
    } catch (error) {
      setError(error instanceof Error ? error.message : `Failed to fetch movie details for ${movieId}`)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  // Enhanced TMDB Features

  const fetchTrendingMovies = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await netflixApiClient.getTrending('movie', 'week')
      setState(prev => ({ ...prev, trendingMovies: response.results }))
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch trending movies')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchTrendingTV = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await netflixApiClient.getTrending('tv', 'week')
      setState(prev => ({ ...prev, trendingTV: response.results }))
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch trending TV shows')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchPopularMovies = useCallback(async (page: number = 1) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await netflixApiClient.getPopularMovies(page)
      setState(prev => ({ ...prev, popularMovies: response.results }))
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch popular movies')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchTopRatedTV = useCallback(async (page: number = 1) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await netflixApiClient.getTopRatedTV(page)
      setState(prev => ({ ...prev, topRatedTV: response.results }))
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch top rated TV shows')
    } finally {
      setLoading(false)
    }
  }, [])

  const searchContent = useCallback(async (query: string, type: 'movie' | 'tv' | 'multi' = 'multi') => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await netflixApiClient.searchContent(query, type)
      setState(prev => ({ ...prev, searchResults: response.results }))
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to search content')
    } finally {
      setLoading(false)
    }
  }, [])

  // Stremio Integration

  const findStreams = useCallback(async (type: 'movie' | 'series', id: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await netflixApiClient.getStreams(type, id)
      const streamKey = `${type}:${id}`
      
      setState(prev => ({
        ...prev,
        streams: {
          ...prev.streams,
          [streamKey]: response.streams
        }
      }))
      
      return response.streams
    } catch (error) {
      setError(error instanceof Error ? error.message : `Failed to find streams for ${type}:${id}`)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  // TV Show Specific

  const getTVDetails = useCallback(async (tvId: number) => {
    try {
      setLoading(true)
      setError(null)
      
      const details = await netflixApiClient.getTVDetails(tvId)
      return details
    } catch (error) {
      setError(error instanceof Error ? error.message : `Failed to fetch TV details for ${tvId}`)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const getTVSeason = useCallback(async (tvId: number, seasonNumber: number) => {
    try {
      setLoading(true)
      setError(null)
      
      const season = await netflixApiClient.getTVSeason(tvId, seasonNumber)
      return season
    } catch (error) {
      setError(error instanceof Error ? error.message : `Failed to fetch season ${seasonNumber} for TV show ${tvId}`)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  // Auto-fetch genres on mount (Netflix Clone behavior)
  useEffect(() => {
    fetchGenres()
  }, [])

  return {
    // State
    loading: state.loading,
    error: state.error,
    genres: state.genres,
    moviesByGenre: state.moviesByGenre,
    trendingMovies: state.trendingMovies,
    trendingTV: state.trendingTV,
    popularMovies: state.popularMovies,
    topRatedTV: state.topRatedTV,
    searchResults: state.searchResults,
    streams: state.streams,
    
    // Actions
    fetchGenres,
    fetchMoviesByGenre,
    fetchMovieDetails,
    fetchTrendingMovies,
    fetchTrendingTV,
    fetchPopularMovies,
    fetchTopRatedTV,
    searchContent,
    findStreams,
    getTVDetails,
    getTVSeason,
    clearError,
    clearSearchResults
  }
}

// Utility hook for Netflix-style genre-based catalogs
export const useNetflixGenreCatalogs = () => {
  const [catalogs, setCatalogs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { genres, fetchMoviesByGenre, moviesByGenre } = useNetflixApi()

  const createCatalogs = useCallback(async () => {
    if (genres.length === 0) return
    
    try {
      setLoading(true)
      setError(null)
      
      const catalogPromises = genres.slice(0, 10).map(async (genre) => {
        await fetchMoviesByGenre(genre.id)
        return {
          id: `genre-${genre.id}`,
          name: `${genre.name} Movies`,
          type: 'movie',
          genreId: genre.id
        }
      })
      
      const newCatalogs = await Promise.all(catalogPromises)
      setCatalogs(newCatalogs)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create catalogs')
    } finally {
      setLoading(false)
    }
  }, [genres, fetchMoviesByGenre])

  useEffect(() => {
    createCatalogs()
  }, [createCatalogs])

  return {
    catalogs,
    moviesByGenre,
    loading,
    error,
    refreshCatalogs: createCatalogs
  }
}

export default useNetflixApi