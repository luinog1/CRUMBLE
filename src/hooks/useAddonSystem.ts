import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createJSONStorage } from 'zustand/middleware'
import type { AddonManifest } from '@/types'
import type { CatalogItem } from '@/components/catalog/CatalogGrid'

type AddonSystemState = {
  addons: AddonManifest[]
  addAddon: (url: string) => Promise<void>
  removeAddon: (id: string) => void
  getCatalogItems: (type: string, id: string, extra?: Record<string, string>) => Promise<CatalogItem[]>
}

export const useAddonSystem = create<AddonSystemState>()(
  persist(
    (set, get) => ({
      addons: [],
      addAddon: async (url: string) => {
        try {
          const response = await fetch(url)
          if (!response.ok) throw new Error('Failed to fetch addon manifest')
          
          const manifest = await response.json() as AddonManifest
          set(state => ({
            addons: [...state.addons, manifest]
          }))
        } catch (error) {
          throw new Error(error instanceof Error ? error.message : 'Failed to add addon')
        }
      },
      removeAddon: (id: string) => {
        set(state => ({
          addons: state.addons.filter(addon => addon.id !== id)
        }))
      },
      getCatalogItems: async (type: string, id: string, extra?: Record<string, string>) => {
        const addon = get().addons.find(addon =>
          addon.catalogs?.some(catalog =>
            catalog.type === type && catalog.id === id
          )
        )

        if (!addon) {
          throw new Error('Catalog not found')
        }

        const catalog = addon.catalogs?.find(c => c.type === type && c.id === id)
        if (!catalog) {
          throw new Error('Catalog not found')
        }

        const queryParams = new URLSearchParams(extra)
        const url = `${addon.resources[0]}/catalog/${type}/${id}?${queryParams}`

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
          throw new Error(error instanceof Error ? error.message : 'Failed to fetch catalog items')
        }
      }
    }),
    {
      name: 'addon-system',
      storage: createJSONStorage(() => localStorage)
    }
  )
)