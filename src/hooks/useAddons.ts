import create from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'
import { AddonManifest, CatalogRequest } from '@/types'

interface AddonState {
  addons: AddonManifest[]
  catalogs: CatalogRequest[]
  loading: boolean
  error: string | null
  addAddon: (url: string) => Promise<void>
  removeAddon: (id: string) => void
  getCatalogItems: (catalogId: string, filter?: Record<string, string>) => any[]
  refreshCatalogs: () => Promise<void>
}

export const useAddons = create<AddonState>(
  persist(
    (set, get) => ({
      addons: [],
      catalogs: [],
      loading: false,
      error: null,

      addAddon: async (url: string) => {
        try {
          set({ loading: true, error: null })
          
          // Fetch addon manifest
          const response = await axios.get(url)
          const manifest: AddonManifest = response.data

          // Validate manifest
          if (!manifest.id || !manifest.version || !manifest.resources) {
            throw new Error('Invalid addon manifest')
          }

          // Add addon if it doesn't exist
          const existingAddon = get().addons.find(a => a.id === manifest.id)
          if (!existingAddon) {
            set(state => ({
              addons: [...state.addons, manifest],
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

      getCatalogItems: (catalogId: string, filter?: Record<string, string>) => {
        const catalog = get().catalogs.find(c => c.id === catalogId)
        if (!catalog) return []

        // Find the addon that owns this catalog
        const addon = get().addons.find(a => a.catalogs?.find(c => c.id === catalogId))
        if (!addon) return []

        // Construct the catalog request URL
        const baseUrl = addon.resources.find(r => r.startsWith('catalog'))
        if (!baseUrl) return []

        // Add filters to the request
        const queryParams = new URLSearchParams(filter)
        const url = `${baseUrl}/${catalog.type}/${catalog.id}?${queryParams}`

        // This would typically be an async operation
        // For now, return mock data
        return [
          {
            id: 'mock-1',
            name: 'Sample Movie',
            type: 'movie',
            poster: 'https://example.com/poster.jpg'
          }
        ]
      },

      refreshCatalogs: async () => {
        try {
          set({ loading: true, error: null })

          const { addons } = get()
          const allCatalogs: CatalogRequest[] = []

          // Collect catalogs from all addons
          addons.forEach(addon => {
            if (addon.catalogs) {
              allCatalogs.push(...addon.catalogs)
            }
          })

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
      version: 1,
    }
  )
)