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
      // Initialize with essential addons
      addons: [
        // Add Torrentio as a default stream provider
        {
          id: 'org.torrentio',
          version: '1.0.0',
          name: 'Torrentio',
          description: 'Torrent streams provider',
          resources: ['stream', 'meta'],
          types: ['movie', 'series'],
          baseUrl: 'https://torrentio.strem.fun',
          catalogs: []
        },
        // Add a local fallback addon that always works
        {
          id: 'org.crumble.fallback',
          version: '1.0.0',
          name: 'Crumble Fallback',
          description: 'Local fallback addon for testing',
          resources: ['catalog'],
          types: ['movie', 'series'],
          baseUrl: 'local',
          catalogs: [
            {
              type: 'movie',
              id: 'trending',
              name: 'Trending Movies'
            },
            {
              type: 'series',
              id: 'trending',
              name: 'Trending TV Shows'
            }
          ]
        }
      ],
      addAddon: async (url: string) => {
        try {
          // Normalize URL - remove trailing slash and add manifest.json if not present
          const normalizedUrl = url.replace(/\/$/, '')
          const manifestUrl = normalizedUrl.endsWith('/manifest.json') ? normalizedUrl : `${normalizedUrl}/manifest.json`
          
          console.log(`Fetching addon manifest from: ${manifestUrl}`)
          const response = await fetch(manifestUrl)
          if (!response.ok) throw new Error(`Failed to fetch addon manifest: ${response.status} ${response.statusText}`)
          
          const manifest = await response.json() as AddonManifest
          console.log('Received manifest:', manifest)
          if (!manifest.id || !manifest.version) {
            throw new Error('Invalid addon manifest: missing id or version')
          }

          // Store the base URL with the manifest for later use
          const baseUrl = normalizedUrl.replace('/manifest.json', '')
          console.log(`Setting baseUrl to: ${baseUrl}`)
          
          // Ensure resources is properly formatted as an array of strings
          let resources = manifest.resources || []
          console.log('Original resources:', resources)
          
          // Handle different resource formats
          if (resources) {
            // If resources is an array of objects with a 'name' property (Stremio format)
            if (Array.isArray(resources) && resources.length > 0 && typeof resources[0] === 'object') {
              resources = resources.map((r: any) => {
                if (typeof r === 'object' && r !== null) {
                  return r.name || r.type || JSON.stringify(r)
                }
                return String(r)
              })
              console.log('Converted resource objects to names:', resources)
            } 
            // If resources is an object but not an array
            else if (typeof resources === 'object' && !Array.isArray(resources)) {
              resources = Object.keys(resources)
              console.log('Converted resource object to keys:', resources)
            }
            // If resources is not an array at all
            else if (!Array.isArray(resources)) {
              resources = [String(resources)]
              console.log('Converted non-array resource to array:', resources)
            }
          } else {
            resources = []
            console.log('No resources found, using empty array')
          }
          
          // For stream provider addons, ensure 'stream' is in resources
          // Some addons might not explicitly list 'stream' in resources but still support it
          const isStreamProvider = (
            url.includes('torrentio') ||
            url.includes('scraper') ||
            url.includes('stream') ||
            url.includes('watch') ||
            url.includes('movie') ||
            url.includes('series') ||
            url.includes('play')
          );
          
          if (isStreamProvider && !resources.includes('stream')) {
            console.log('Adding stream resource to stream provider addon');
            resources.push('stream');
          }
          
          // For addons that support streams but don't declare it
          const endpoints = manifest.endpoints || [];
          const hasStreamEndpoint = endpoints.some((endpoint: string) =>
            endpoint.includes('/stream/') || endpoint.includes('stream.json')
          );
          
          if (hasStreamEndpoint && !resources.includes('stream')) {
            console.log('Adding stream resource based on endpoints');
            resources.push('stream');
          }
          
          const manifestWithBaseUrl = {
            ...manifest,
            baseUrl: baseUrl,
            resources: Array.isArray(resources) ? resources : []
          }

          // Check if addon already exists
          const existingAddon = get().addons.find(a => a.id === manifest.id)
          if (!existingAddon) {
            console.log(`Adding new addon: ${manifest.name} with resources:`, manifestWithBaseUrl.resources)
            set(state => ({
              addons: [...state.addons, manifestWithBaseUrl]
            }))
          } else {
            console.log(`Updating existing addon: ${manifest.name}`)
            set(state => ({
              addons: state.addons.map(a => 
                a.id === manifest.id ? { ...manifestWithBaseUrl } : a
              )
            }))
          }
        } catch (error) {
          console.error('Error adding addon:', error)
          throw new Error(error instanceof Error ? error.message : 'Failed to add addon')
        }
      },
      removeAddon: (id: string) => {
        set(state => ({
          addons: state.addons.filter(addon => addon.id !== id)
        }))
      },
      getCatalogItems: async (type: string, id: string, extra?: Record<string, string>) => {
        console.log(`Getting catalog items for type: ${type}, id: ${id}, extra:`, extra);
        
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
        
        // Log all available addons for debugging
        console.log('Available addons:', get().addons.map(a => ({ id: a.id, name: a.name, baseUrl: a.baseUrl })));
        
        // Find an addon that has the requested catalog or matches virtual catalog ID
        const addon = get().addons.find(addon => {
          // Check if this is a virtual catalog for a stream provider
          if (id.startsWith(addon.id + '-')) {
            return addon.resources?.includes('stream');
          }
          // Otherwise check regular catalogs
          return addon.catalogs?.some(catalog =>
            catalog.type === type && catalog.id === id
          );
        });

        if (!addon) {
          console.error(`No addon found for catalog type: ${type}, id: ${id}`);
          // Return fallback data instead of throwing an error
          return generateFallbackItems(type);
        }

        // For stream providers with virtual catalogs, skip catalog check
        const isVirtualStreamCatalog = id.startsWith(addon.id + '-');
        if (!isVirtualStreamCatalog) {
          const catalog = addon.catalogs?.find(c => c.type === type && c.id === id)
          if (!catalog) {
            console.error(`Catalog not found in addon ${addon.name} for type: ${type}, id: ${id}`);
            return generateFallbackItems(type);
          }

          // Check if addon supports catalog resource
          if (!addon.resources.includes('catalog')) {
            console.error(`Addon ${addon.name} does not support catalog resource`);
            return generateFallbackItems(type);
          }
        }

        // Special case for local fallback addon
        if (addon.id === 'org.crumble.fallback') {
          console.log(`Using local fallback addon for ${type}/${id}`);
          return generateFallbackItems(type);
        }
        
        // Get base URL from addon (stored when adding the addon)
        const baseUrl = addon.baseUrl;
        if (!baseUrl) {
          console.error(`Addon ${addon.name} has no baseUrl`);
          return generateFallbackItems(type);
        }

        // Build URL according to Stremio protocol
        let url = `${baseUrl}/catalog/${type}/${id}.json`
        
        // Add query parameters
        if (extra && Object.keys(extra).length > 0) {
          const queryParams = new URLSearchParams(extra)
          url += `?${queryParams.toString()}`
        } else {
          // Always include default parameters
          url += '?skip=0&limit=100'
        }

        try {
          console.log(`Fetching catalog from: ${url}`)
          const response = await fetch(url)
          if (!response.ok) {
            console.error(`Failed to fetch catalog items: ${response.status} ${response.statusText}`)
            return generateFallbackItems(type);
          }
          
          const data = await response.json()
          console.log(`Received data from ${url}:`, data)
          
          // Handle Stremio protocol response format
          const items = data.metas || data || []
          
          if (!items.length) {
            console.warn(`No items returned from ${url}`)
            return generateFallbackItems(type);
          }
          
          return items.map((item: { id: string; name?: string; title?: string; poster: string; type: string; year: number; imdbRating?: string }) => ({
            id: item.id,
            title: item.name || item.title || 'Unknown Title',
            poster: item.poster,
            type: (item.type === 'movie' ? 'movie' : 'series') as 'movie' | 'series',
            year: item.year,
            rating: item.imdbRating ? parseFloat(item.imdbRating) : undefined
          })) as CatalogItem[]
        } catch (error) {
          console.error('Error fetching catalog items:', error)
          return generateFallbackItems(type);
        }
        
        // Helper function to generate fallback items
        function generateFallbackItems(itemType: string): CatalogItem[] {
          const movieTitles = [
            'The Adventure Begins',
            'Lost in Time',
            'Shadows of the Past',
            'Beyond the Horizon',
            'Eternal Echoes',
            'Whispers in the Dark',
            'The Last Journey',
            'Forgotten Dreams',
            'Secrets of the Universe',
            'The Final Chapter'
          ];
          
          const seriesTitles = [
            'Dark Mysteries',
            'The Chronicles',
            'New Beginnings',
            'Endless Nights',
            'City Lights',
            'The Hidden Truth',
            'Beyond Reality',
            'Parallel Lives',
            'The Awakening',
            'Legends of Tomorrow'
          ];
          
          const items = [];
          const titles = itemType === 'movie' ? movieTitles : seriesTitles;
          
          for (let i = 0; i < titles.length; i++) {
            items.push({
              id: `fallback-${itemType}-${i + 1}`,
              title: titles[i],
              poster: '/placeholder-poster.svg',
              type: (itemType === 'movie' ? 'movie' : 'series') as 'movie' | 'series',
              year: 2023 - (i % 5),
              rating: 8.5 - ((i % 5) * 0.3)
            });
          }
          return items;
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