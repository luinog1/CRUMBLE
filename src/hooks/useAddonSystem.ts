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
      // Initialize with a sample addon for testing
      addons: [
        {
          id: 'org.stremio.example',
          version: '1.0.0',
          name: 'Example Addon',
          description: 'Sample addon for testing',
          resources: ['catalog'],
          types: ['movie', 'series'],
          baseUrl: 'https://v3-cinemeta.strem.io',
          catalogs: [
            {
              type: 'movie',
              id: 'top',
              name: 'Top Movies'
            },
            {
              type: 'series',
              id: 'top',
              name: 'Top Series'
            }
          ]
        }
      ],
      addAddon: async (url: string) => {
        try {
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

          // Check if addon already exists
          const existingAddon = get().addons.find(a => a.id === manifest.id)
          if (!existingAddon) {
            set(state => ({
              addons: [...state.addons, manifestWithBaseUrl]
            }))
          }
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
        // If no addons are configured, use TMDB fallback for trending
        if (get().addons.length === 0 && id === 'trending') {
          console.log('No addons configured, using TMDB fallback for trending')
          // Return mock data for demonstration
          const mockItems = [];
          
          // Generate 10 sample items
          for (let i = 1; i <= 10; i++) {
            mockItems.push({
              id: `tt${1000000 + i}`,
              title: type === 'movie' ? `Sample Movie ${i}` : `Sample Series ${i}`,
              poster: '/placeholder-poster.svg',
              type: type === 'movie' ? 'movie' : 'series',
              year: 2023 - (i % 5),
              rating: 8.5 - (i % 5) * 0.3
            });
          }
          
          return mockItems as CatalogItem[]
        }
        
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

        // Check if addon supports catalog resource
        if (!addon.resources.includes('catalog')) {
          throw new Error('Addon does not support catalog resource')
        }

        // Get base URL from addon (stored when adding the addon)
        const baseUrl = (addon as any).baseUrl
        if (!baseUrl) {
          throw new Error('Addon base URL not found')
        }

        // Build URL according to Stremio protocol
        let url = `${baseUrl}/catalog/${type}/${id}.json`
        
        if (extra && Object.keys(extra).length > 0) {
          const queryParams = new URLSearchParams(extra)
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
          throw new Error(error instanceof Error ? error.message : 'Failed to fetch catalog items')
        }
      }
    }),
    {
      name: 'addon-system',
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: any, version) => {
        // Handle migration from previous state versions
        // If the state structure has changed, transform it here
        return {
          ...persistedState,
          addons: Array.isArray(persistedState.addons) ? persistedState.addons.map((addon: any) => {
            // Ensure baseUrl exists for all addons
            if (!addon.baseUrl && addon.resources && addon.resources[0]) {
              // Try to extract baseUrl from resources
              const resourceUrl = typeof addon.resources[0] === 'string' 
                ? addon.resources[0] 
                : '';
              
              return {
                ...addon,
                baseUrl: resourceUrl.replace('/manifest.json', '')
              };
            }
            return addon;
          }) : []
        };
      },
      version: 1 // Increment this when the state structure changes
    }
  )
)