import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '../services/ApiClient'
import { AddonManifest, LibraryItem, WatchProgress } from '../types'

interface ApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

interface UseApiReturn<T> extends ApiState<T> {
  refetch: () => Promise<void>
}

// Generic hook for API calls
export function useApi<T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = []
): UseApiReturn<T> {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: true,
    error: null,
  })

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const data = await apiCall()
      setState({ data, loading: false, error: null })
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error.message : 'An error occurred',
      })
    }
  }, dependencies)

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    ...state,
    refetch: fetchData,
  }
}

// Specific hooks for different API endpoints
export function useAddons() {
  return useApi(() => apiClient.getAddons())
}

export function useLibrary(userId: string) {
  return useApi(
    () => apiClient.getLibrary(userId),
    [userId]
  )
}

export function useProgress(userId: string) {
  return useApi(
    () => apiClient.getProgress(userId),
    [userId]
  )
}

export function useFavorites(userId: string) {
  return useApi(
    () => apiClient.getFavorites(userId),
    [userId]
  )
}

export function useWatching(userId: string) {
  return useApi(
    () => apiClient.getWatching(userId),
    [userId]
  )
}

export function useCompleted(userId: string) {
  return useApi(
    () => apiClient.getCompleted(userId),
    [userId]
  )
}

export function useRecentProgress(userId: string, limit?: number) {
  return useApi(
    () => apiClient.getRecentProgress(userId, limit),
    [userId, limit]
  )
}

// Mutation hooks for write operations
export function useAddAddon() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addAddon = useCallback(async (manifestUrl: string) => {
    setLoading(true)
    setError(null)
    try {
      const addon = await apiClient.addAddon(manifestUrl)
      setLoading(false)
      return addon
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add addon'
      setError(errorMessage)
      setLoading(false)
      throw err
    }
  }, [])

  return { addAddon, loading, error }
}

export function useRemoveAddon() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const removeAddon = useCallback(async (addonId: string) => {
    setLoading(true)
    setError(null)
    try {
      await apiClient.removeAddon(addonId)
      setLoading(false)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove addon'
      setError(errorMessage)
      setLoading(false)
      throw err
    }
  }, [])

  return { removeAddon, loading, error }
}

export function useAddToLibrary() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addToLibrary = useCallback(async (
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
  ) => {
    setLoading(true)
    setError(null)
    try {
      const libraryItem = await apiClient.addToLibrary(userId, item)
      setLoading(false)
      return libraryItem
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add to library'
      setError(errorMessage)
      setLoading(false)
      throw err
    }
  }, [])

  return { addToLibrary, loading, error }
}

export function useUpdateProgress() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateProgress = useCallback(async (
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
  ) => {
    setLoading(true)
    setError(null)
    try {
      const watchProgress = await apiClient.updateProgress(userId, progress)
      setLoading(false)
      return watchProgress
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update progress'
      setError(errorMessage)
      setLoading(false)
      throw err
    }
  }, [])

  return { updateProgress, loading, error }
}

export function useUpdateLibraryItem() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateLibraryItem = useCallback(async (
    userId: string,
    itemId: string,
    updates: {
      isFavorite?: boolean
      watchStatus?: string
    }
  ) => {
    setLoading(true)
    setError(null)
    try {
      const libraryItem = await apiClient.updateLibraryItem(userId, itemId, updates)
      setLoading(false)
      return libraryItem
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update library item'
      setError(errorMessage)
      setLoading(false)
      throw err
    }
  }, [])

  return { updateLibraryItem, loading, error }
}