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
          
          const response = await fetch(url)
          if (!response.ok) throw new Error('Failed to fetch addon manifest')
          
          const manifest = await response.json() as AddonManifest
          if (!manifest.id || !manifest.version || !manifest.resources) {
            throw new Error('Invalid addon manifest')
          }

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

      getCatalogItems: async (catalogId: string, filter?: Record<string, string>) => {
        const catalog = get().catalogs.find(c => c.id === catalogId)
        if (!catalog) return []

        const addon = get().addons.find(a => a.catalogs?.find(c => c.id === catalogId))
        if (!addon) return []

        const baseUrl = addon.resources[0]
        if (!baseUrl) return []

        const queryParams = new URLSearchParams(filter)
        const url = `${baseUrl}/catalog/${catalog.type}/${catalog.id}?${queryParams}`

        try {
          const response = await fetch(url)
          if (!response.ok) throw new Error('Failed to fetch catalog items')
          
          const data = await response.json()
          return data.map((item: { id: string; name?: string; title?: string; poster: string; type: string; year: number; rating: number }) => ({
            id: item.id,
            title: item.name || item.title || 'Unknown Title',
            poster: item.poster,
            type: item.type === 'movie' ? 'movie' : 'series',
            year: item.year,
            rating: item.rating
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
      storage: createJSONStorage(() => localStorage)
    }
  )
)