import axios, { AxiosInstance } from 'axios'

// Vite environment variables type declaration
declare global {
  interface ImportMetaEnv {
    readonly VITE_BACKEND_URL?: string
  }
}

// Netflix Clone API Protocol Client
// Implements the same API structure as the original Netflix clone

interface TMDBGenre {
  id: number
  name: string
}

interface TMDBMovie {
  id: number
  title: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  original_backdrop?: string | null
  release_date: string
  vote_average: number
  genre_ids: number[]
  adult: boolean
  original_language: string
  original_title: string
  popularity: number
  video: boolean
  vote_count: number
}

interface TMDBResponse {
  page: number
  results: TMDBMovie[]
  total_pages: number
  total_results: number
}

interface TMDBGenresResponse {
  genres: TMDBGenre[]
}

interface TMDBMovieDetails extends TMDBMovie {
  belongs_to_collection: any
  budget: number
  genres: TMDBGenre[]
  homepage: string
  imdb_id: string
  production_companies: any[]
  production_countries: any[]
  revenue: number
  runtime: number
  spoken_languages: any[]
  status: string
  tagline: string
  videos?: {
    results: any[]
  }
  credits?: {
    cast: any[]
    crew: any[]
  }
  similar?: TMDBResponse
}

interface StreamResult {
  title: string
  url: string
  quality?: string
  size?: string
  addon: string
  seeds?: number
  peers?: number
}

interface StreamsResponse {
  streams: StreamResult[]
}

class NetflixApiClient {
  private client: AxiosInstance
  private baseURL: string

  constructor() {
    this.baseURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
    })

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('Netflix API Error:', error.response?.data || error.message)
        return Promise.reject(error)
      }
    )
  }

  // Netflix Clone Protocol Implementation

  /**
   * Get movie genres (Netflix Clone Protocol)
   * Endpoint: GET /api/genres
   */
  async getGenres(): Promise<TMDBGenresResponse> {
    try {
      const response = await this.client.get('/api/genres')
      return response.data
    } catch (error) {
      console.error('Failed to fetch genres:', error)
      throw error
    }
  }

  /**
   * Get movies by genre (Netflix Clone Protocol)
   * Endpoint: GET /api/movies/genre/:genreId
   */
  async getMoviesByGenre(genreId: number, page?: number): Promise<TMDBResponse> {
    try {
      const params = page ? { page } : {}
      const response = await this.client.get(`/api/movies/genre/${genreId}`, { params })
      return response.data
    } catch (error) {
      console.error(`Failed to fetch movies for genre ${genreId}:`, error)
      throw error
    }
  }

  /**
   * Get movie details (Netflix Clone Protocol)
   * Endpoint: GET /api/movie/:movieId
   */
  async getMovieDetails(movieId: number): Promise<TMDBMovieDetails> {
    try {
      const response = await this.client.get(`/api/movie/${movieId}`)
      return response.data
    } catch (error) {
      console.error(`Failed to fetch movie details for ${movieId}:`, error)
      throw error
    }
  }

  // Enhanced TMDB Endpoints

  /**
   * Get trending content
   * Endpoint: GET /api/trending/:mediaType/:timeWindow
   */
  async getTrending(mediaType: 'movie' | 'tv' | 'all' = 'all', timeWindow: 'day' | 'week' = 'week'): Promise<TMDBResponse> {
    try {
      const response = await this.client.get(`/api/trending/${mediaType}/${timeWindow}`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch trending content:', error)
      throw error
    }
  }

  /**
   * Get popular movies
   * Endpoint: GET /api/movies/popular
   */
  async getPopularMovies(page: number = 1): Promise<TMDBResponse> {
    try {
      const response = await this.client.get('/api/movies/popular', { params: { page } })
      return response.data
    } catch (error) {
      console.error('Failed to fetch popular movies:', error)
      throw error
    }
  }

  /**
   * Get top rated TV shows
   * Endpoint: GET /api/tv/top-rated
   */
  async getTopRatedTV(page: number = 1): Promise<TMDBResponse> {
    try {
      const response = await this.client.get('/api/tv/top-rated', { params: { page } })
      return response.data
    } catch (error) {
      console.error('Failed to fetch top rated TV shows:', error)
      throw error
    }
  }

  /**
   * Search content
   * Endpoint: GET /api/search
   */
  async searchContent(query: string, type: 'movie' | 'tv' | 'multi' = 'multi'): Promise<TMDBResponse> {
    try {
      const response = await this.client.get('/api/search', {
        params: { query, type }
      })
      return response.data
    } catch (error) {
      console.error('Failed to search content:', error)
      throw error
    }
  }

  // Stremio Integration

  /**
   * Get stream links for content (Stremio Protocol)
   * Endpoint: GET /api/streams/:type/:id
   */
  async getStreams(type: 'movie' | 'series', id: string): Promise<StreamsResponse> {
    try {
      const response = await this.client.get(`/api/streams/${type}/${id}`)
      return response.data
    } catch (error) {
      console.error(`Failed to fetch streams for ${type}:${id}:`, error)
      throw error
    }
  }

  /**
   * Get available Stremio addons
   * Endpoint: GET /api/addons
   */
  async getAvailableAddons(): Promise<any> {
    try {
      const response = await this.client.get('/api/addons')
      return response.data
    } catch (error) {
      console.error('Failed to fetch available addons:', error)
      throw error
    }
  }

  // TV Show Specific Endpoints

  /**
   * Get TV show details
   * Endpoint: GET /api/tv/:tvId
   */
  async getTVDetails(tvId: number): Promise<any> {
    try {
      const response = await this.client.get(`/api/tv/${tvId}`)
      return response.data
    } catch (error) {
      console.error(`Failed to fetch TV details for ${tvId}:`, error)
      throw error
    }
  }

  /**
   * Get TV show season
   * Endpoint: GET /api/tv/:tvId/season/:seasonNumber
   */
  async getTVSeason(tvId: number, seasonNumber: number): Promise<any> {
    try {
      const response = await this.client.get(`/api/tv/${tvId}/season/${seasonNumber}`)
      return response.data
    } catch (error) {
      console.error(`Failed to fetch season ${seasonNumber} for TV show ${tvId}:`, error)
      throw error
    }
  }

  // Utility Methods

  /**
   * Health check
   * Endpoint: GET /api/health
   */
  async healthCheck(): Promise<any> {
    try {
      const response = await this.client.get('/api/health')
      return response.data
    } catch (error) {
      console.error('Health check failed:', error)
      throw error
    }
  }

  /**
   * Transform TMDB ID to Stremio format
   */
  transformToStremioId(tmdbId: number, type: 'movie' | 'tv'): string {
    return `tmdb:${tmdbId}`
  }

  /**
   * Get image URL with different sizes
   */
  getImageUrl(path: string | null, size: 'w200' | 'w300' | 'w500' | 'w780' | 'original' = 'w500'): string | null {
    if (!path) return null
    return `https://image.tmdb.org/t/p/${size}${path}`
  }

  /**
   * Format movie data for Netflix-style display
   */
  formatMovieForDisplay(movie: TMDBMovie): any {
    return {
      id: movie.id,
      title: movie.title,
      description: movie.overview,
      poster: this.getImageUrl(movie.poster_path),
      backdrop: this.getImageUrl(movie.backdrop_path, 'original'),
      year: movie.release_date ? new Date(movie.release_date).getFullYear() : null,
      rating: movie.vote_average,
      type: 'movie'
    }
  }

  /**
   * Create Netflix-style catalog from genre data
   */
  async createGenreCatalogs(): Promise<any[]> {
    try {
      const genresResponse = await this.getGenres()
      const catalogs = []

      for (const genre of genresResponse.genres) {
        const movies = await this.getMoviesByGenre(genre.id)
        
        catalogs.push({
          id: `genre-${genre.id}`,
          name: `${genre.name} Movies`,
          type: 'movie',
          items: movies.results.map(movie => this.formatMovieForDisplay(movie))
        })
      }

      return catalogs
    } catch (error) {
      console.error('Failed to create genre catalogs:', error)
      throw error
    }
  }
}

// Export singleton instance
export const netflixApiClient = new NetflixApiClient()
export default NetflixApiClient

// Export types
export type {
  TMDBGenre,
  TMDBMovie,
  TMDBResponse,
  TMDBGenresResponse,
  TMDBMovieDetails,
  StreamResult,
  StreamsResponse
}