import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createJSONStorage } from 'zustand/middleware'

import type { AddonManifest, CatalogRequest } from '@/types'
import type { CatalogItem } from '@/components/catalog/CatalogGrid'

type AddonState = {
  addons: AddonManifest[]
  catalogs: CatalogRequest[]
  loading: boolean
  error: string | null
  addAddon: (url: string) => Promise<void>
  removeAddon: (id: string) => void
  getCatalogItems: (catalogId: string, filter?: Record<string, string>) => Promise<CatalogItem[]>
  refreshCatalogs: () => Promise<void>
}

export const useAddons = create<AddonState>()(
  persist(
    (set, get) => ({
      addons: [],
      catalogs: [],
      loading: false,
      error: null,

      addAddon: async (url: string) => {
        try {
          set({ loading: true, error: null })
          
          // Normalize URL - remove trailing slash and add manifest.json if not present
          const normalizedUrl = url.replace(/\/$/, '')
          const manifestUrl = normalizedUrl.endsWith('/manifest.json') ? normalizedUrl : `${normalizedUrl}/manifest.json`
          
          const response = await fetch(manifestUrl)
          if (!response.ok) throw new Error(`Failed to fetch addon manifest: ${response.status} ${response.statusText}`)
          
          const manifest = await response.json() as AddonManifest
          if (!manifest.id || !manifest.version || !manifest.resources) {
            throw new Error('Invalid addon manifest')
          }

          // Store the base URL with the manifest for later use
          const manifestWithBaseUrl = {
            ...manifest,
            baseUrl: normalizedUrl.replace('/manifest.json', '')
          }

          const existingAddon = get().addons.find(a => a.id === manifest.id)
          if (!existingAddon) {
            set(state => ({
              addons: [...state.addons, manifestWithBaseUrl],
              catalogs: [...state.catalogs, ...(manifest.catalogs || [])]
            }))
          }

          set({ loading: false })
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to add addon'
          })
        }
      },

      removeAddon: (id: string) => {
        set(state => ({
          addons: state.addons.filter(addon => addon.id !== id),
          catalogs: state.catalogs.filter(catalog => {
            const addon = state.addons.find(a => a.id === id)
            return !addon?.catalogs?.find(c => c.id === catalog.id)
          })
        }))
      },

      getCatalogItems: async (catalogId: string, filter?: Record<string, string>) => {
        const catalog = get().catalogs.find(c => c.id === catalogId)
        if (!catalog) return []

        const addon = get().addons.find(a => a.catalogs?.find(c => c.id === catalogId))
        if (!addon) return []

        // Check if addon supports catalog resource
        if (!addon.resources.includes('catalog')) {
          console.error('Addon does not support catalog resource')
          return []
        }

        // Get base URL from addon (stored when adding the addon)
        const baseUrl = (addon as any).baseUrl
        if (!baseUrl) {
          console.error('Addon base URL not found')
          return []
        }

        // Build URL according to Stremio protocol
        let url = `${baseUrl}/catalog/${catalog.type}/${catalog.id}.json`
        
        if (filter && Object.keys(filter).length > 0) {
          const queryParams = new URLSearchParams(filter)
          url += `?${queryParams.toString()}`
        }

        try {
          const response = await fetch(url)
          if (!response.ok) throw new Error(`Failed to fetch catalog items: ${response.status} ${response.statusText}`)
          
          const data = await response.json()
          // Handle Stremio protocol response format
          const items = data.metas || data || []
          
          return items.map((item: { id: string; name?: string; title?: string; poster: string; type: string; year: number; imdbRating?: string }) => ({
            id: item.id,
            title: item.name || item.title || 'Unknown Title',
            poster: item.poster,
            type: item.type === 'movie' ? 'movie' : 'series',
            year: item.year,
            rating: item.imdbRating ? parseFloat(item.imdbRating) : undefined
          })) as CatalogItem[]
        } catch (error) {
          console.error('Failed to fetch catalog items:', error)
          return []
        }
      },

      refreshCatalogs: async () => {
        try {
          set({ loading: true, error: null })

          const { addons } = get()
          const allCatalogs = addons.flatMap(addon => addon.catalogs || [])

          set({
            catalogs: allCatalogs,
            loading: false
          })
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to refresh catalogs'
          })
        }
      }
    }),
    {
      name: 'crumble-addons',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Handle migration from version 0 to 1
          // Ensure all addons have baseUrl property
          return {
            ...persistedState,
            addons: (persistedState.addons || []).map((addon: any) => {
              if (!addon.baseUrl && addon.id) {
                console.log('Migrating addon without baseUrl:', addon.id)
                return {
                  ...addon,
                  baseUrl: ''
                }
              }
              return addon
            })
          }
        }
        return persistedState
      }
    }
  )
)