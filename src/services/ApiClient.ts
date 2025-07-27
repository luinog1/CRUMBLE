import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { AddonManifest, LibraryItem, WatchProgress } from '../types'

// Vite environment variables type declaration
declare global {
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
}

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
}

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor for auth tokens (if needed in the future)
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem('auth_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error.response?.data || error.message)
        return Promise.reject(error)
      }
    )
  }

  // Addon methods
  async getAddons(): Promise<AddonManifest[]> {
    const response = await this.client.get('/addons')
    return response.data
  }

  async addAddon(manifestUrl: string): Promise<AddonManifest> {
    const response = await this.client.post('/addons/fetch-manifest', {
      manifestUrl,
    })
    return response.data
  }

  async removeAddon(addonId: string): Promise<void> {
    await this.client.delete(`/addons/${addonId}`)
  }

  async getCatalog(
    addonId: string,
    type: string,
    id: string,
    params?: Record<string, any>
  ): Promise<any> {
    const response = await this.client.get(
      `/addons/${addonId}/catalog/${type}/${id}`,
      { params }
    )
    return response.data
  }

  async getStreams(
    addonId: string,
    type: string,
    id: string
  ): Promise<any> {
    try {
      // First try the backend API
      const response = await this.client.get(
        `/addons/${addonId}/stream/${type}/${id}`
      )
      return response.data
    } catch (error) {
      // If backend fails, try direct addon request
      const addons = await this.getAddons()
      const addon = addons.find(a => a.id === addonId)
      
      if (!addon?.baseUrl) {
        throw new Error(`Addon ${addonId} not found or has no baseUrl`)
      }

      // Try direct request to addon
      const streamId = type === 'movie' ? id : `meta/${id}`
      const response = await fetch(`${addon.baseUrl}/stream/${type}/${streamId}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return response.json()
    }
  }

  // User methods
  async createUser(userData: {
    username: string
    email: string
    password: string
  }): Promise<any> {
    const response = await this.client.post('/users', userData)
    return response.data
  }

  async getUser(userId: string): Promise<any> {
    const response = await this.client.get(`/users/${userId}`)
    return response.data
  }

  async updateUserPreferences(
    userId: string,
    preferences: Record<string, any>
  ): Promise<any> {
    const response = await this.client.put(
      `/users/${userId}/preferences`,
      preferences
    )
    return response.data
  }

  // Library methods
  async getLibrary(userId: string): Promise<LibraryItem[]> {
    const response = await this.client.get(`/library/${userId}`)
    return response.data
  }

  async addToLibrary(
    userId: string,
    item: {
      contentId: string
      contentType: string
      title: string
      poster?: string
      year?: number
      imdbRating?: number
      genres?: string[]
      description?: string
      isFavorite?: boolean
      watchStatus?: string
    }
  ): Promise<LibraryItem> {
    const response = await this.client.post(`/library/${userId}`, item)
    return response.data
  }

  async updateLibraryItem(
    userId: string,
    itemId: string,
    updates: {
      isFavorite?: boolean
      watchStatus?: string
    }
  ): Promise<LibraryItem> {
    const response = await this.client.put(
      `/library/${userId}/${itemId}`,
      updates
    )
    return response.data
  }

  async removeFromLibrary(userId: string, itemId: string): Promise<void> {
    await this.client.delete(`/library/${userId}/${itemId}`)
  }

  async getFavorites(userId: string): Promise<LibraryItem[]> {
    const response = await this.client.get(`/library/${userId}/favorites`)
    return response.data
  }

  async getWatching(userId: string): Promise<LibraryItem[]> {
    const response = await this.client.get(`/library/${userId}/watching`)
    return response.data
  }

  async getCompleted(userId: string): Promise<LibraryItem[]> {
    const response = await this.client.get(`/library/${userId}/completed`)
    return response.data
  }

  // Progress methods
  async getProgress(userId: string): Promise<WatchProgress[]> {
    const response = await this.client.get(`/progress/${userId}`)
    return response.data
  }

  async updateProgress(
    userId: string,
    progress: {
      contentId: string
      contentType: string
      season?: number
      episode?: number
      currentTime: number
      duration: number
      isCompleted?: boolean
    }
  ): Promise<WatchProgress> {
    const response = await this.client.post(`/progress/${userId}`, progress)
    return response.data
  }

  async getContentProgress(
    userId: string,
    contentId: string
  ): Promise<WatchProgress[]> {
    const response = await this.client.get(
      `/progress/${userId}/${contentId}`
    )
    return response.data
  }

  async getRecentProgress(
    userId: string,
    limit?: number
  ): Promise<WatchProgress[]> {
    const response = await this.client.get(`/progress/${userId}/recent`, {
      params: { limit },
    })
    return response.data
  }

  async deleteProgress(userId: string, progressId: string): Promise<void> {
    await this.client.delete(`/progress/${userId}/${progressId}`)
  }
}

export const apiClient = new ApiClient()
export default ApiClient