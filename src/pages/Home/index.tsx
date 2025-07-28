import { Box, Button, Heading, Text, VStack } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { useEffect, useState, useMemo } from 'react'
import { useAddonSystem } from '@hooks/useAddonSystem'
import { useFeatured } from '@hooks/useFeatured'
import FeaturedContent from './FeaturedContent'
import CatalogCarousel from '@components/catalog/CatalogCarousel'
import type { CatalogRequest } from '@/types'
import type { CatalogItem } from '@components/catalog/CatalogGrid'

const MotionBox = motion(Box) as typeof motion.div

const Home = () => {
  const { featured, loading: featuredLoading, error: featuredError, fetchFeatured } = useFeatured()
  const { addons, getCatalogItems } = useAddonSystem()
  const [catalogItems, setCatalogItems] = useState<Record<string, CatalogItem[]>>({})
  const [catalogLoading, setCatalogLoading] = useState<Record<string, boolean>>({})
  const [catalogError, setCatalogError] = useState<Record<string, string>>({})

  useEffect(() => {
    // Initialize hero section settings if not set
    if (localStorage.getItem('enableHero') === null) {
      localStorage.setItem('enableHero', 'true')
    }
    if (localStorage.getItem('heroUpdateInterval') === null) {
      localStorage.setItem('heroUpdateInterval', '24')
    }
    fetchFeatured()
  }, [fetchFeatured])


  // Process catalogs and ensure trending content
  const { movieCatalogs, seriesCatalogs } = useMemo(() => {
    const movieCatalogs: CatalogRequest[] = [];
    const seriesCatalogs: CatalogRequest[] = [];
    
    // Add trending catalogs only if TMDB API key is available
    const tmdbApiKey = localStorage.getItem('tmdbApiKey');
    if (tmdbApiKey) {
      movieCatalogs.push({
        id: 'trending',
        name: 'Trending Movies',
        type: 'movie',
        isVirtual: true
      });
      
      seriesCatalogs.push({
        id: 'trending',
        name: 'Trending TV Shows',
        type: 'series',
        isVirtual: true
      });
    }
    
    // Process regular catalogs
    addons.forEach(addon => {
      if (addon.catalogs) {
        addon.catalogs.forEach(catalog => {
          if (catalog.type === 'movie') {
            movieCatalogs.push(catalog);
          } else if (catalog.type === 'series') {
            seriesCatalogs.push(catalog);
          }
        });
      }
    });
    
    // Create virtual catalogs for stream scraper addons
    const streamScraperAddons = addons.filter(addon => 
      addon.resources && 
      addon.resources.includes('stream') && 
      (!addon.catalogs || addon.catalogs.length === 0)
    );
    
    streamScraperAddons.forEach(addon => {
      movieCatalogs.push({
        id: `${addon.id}-movies`,
        name: `${addon.name || addon.id} Movies`,
        type: 'movie',
        extra: { skip: '0', search: '' },
        isVirtual: true,
        addonId: addon.id
      });
      
      seriesCatalogs.push({
        id: `${addon.id}-series`,
        name: `${addon.name || addon.id} Series`,
        type: 'series',
        extra: { skip: '0', search: '' },
        isVirtual: true,
        addonId: addon.id
      });
    });

    return { movieCatalogs, seriesCatalogs };
  }, [addons]);

  // Fetch catalog items
  useEffect(() => {
    const fetchCatalogItems = async (catalog: CatalogRequest) => {
      const catalogKey = `${catalog.type}-${catalog.id}`
      setCatalogLoading(prev => ({ ...prev, [catalogKey]: true }))
      setCatalogError(prev => ({ ...prev, [catalogKey]: '' }))

      try {
        let items: CatalogItem[] = []

        if (catalog.isVirtual) {
            // Only require TMDB API key for trending catalogs
            if (catalog.id === 'trending') {
              const tmdbApiKey = localStorage.getItem('tmdbApiKey')
              if (!tmdbApiKey) {
                throw new Error('TMDB API key is required for trending catalogs')
              }
            // Use TMDB API for trending content
            const type = catalog.type === 'movie' ? 'movie' : 'tv'
            const response = await fetch(
              `https://api.themoviedb.org/3/trending/${type}/week?api_key=${tmdbApiKey}`,
              {
                headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json'
                }
              }
            )

            if (!response.ok) {
              throw new Error(`TMDB API error: ${response.status}`)
            }

            const data = await response.json()
            items = data.results.map((item: any) => ({
              id: `tmdb-${catalog.type}:${item.id}`,
              title: item.title || item.name,
              poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '',
              type: catalog.type,
              year: item.release_date?.substring(0, 4) || item.first_air_date?.substring(0, 4),
              rating: item.vote_average,
              description: item.overview,
              backdrop: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : null
            }))
          } else {
            // Handle other virtual catalogs (e.g., stream scrapers)
            const results = await getCatalogItems(catalog.type, catalog.id)
            items = results || []
          }
        } else {
          // Handle regular addon catalogs
          const results = await getCatalogItems(catalog.type, catalog.id)
          items = results || []
        }

        setCatalogItems(prev => ({ ...prev, [catalogKey]: items }))
      } catch (err) {
        console.error(`Error fetching ${catalog.name}:`, err)
        setCatalogError(prev => ({
          ...prev,
          [catalogKey]: err instanceof Error ? err.message : 'Failed to fetch catalog items'
        }))
      } finally {
        setCatalogLoading(prev => ({ ...prev, [catalogKey]: false }))
      }
    }

    // Fetch all catalogs in parallel
    const allCatalogs = [...movieCatalogs, ...seriesCatalogs]
    Promise.all(allCatalogs.map(fetchCatalogItems))
      .catch(error => console.error('Error fetching catalogs:', error))

  }, [movieCatalogs, seriesCatalogs, getCatalogItems])

  return (
    <MotionBox
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{ padding: '1.5rem' }}
    >
      <VStack spacing={4} align="stretch">
        {localStorage.getItem('enableHero') !== 'false' && (
          featuredLoading ? (
            <Box height="400px" borderRadius="xl" bg="gray.700" />
          ) : featuredError ? (
            <Box height="400px" borderRadius="xl" bg="gray.700" p={8}>
              <VStack spacing={4} align="center" justify="center" height="100%">
                <Heading size="md" color="red.400">{featuredError}</Heading>
                <Text>Please configure your TMDB API key in Settings</Text>
                <Button as="a" href="/settings" colorScheme="blue">Go to Settings</Button>
              </VStack>
            </Box>
          ) : featured ? (
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <FeaturedContent
                title={featured.title}
                description={featured.description}
                backgroundImage={featured.backgroundImage}
                videoId={featured.videoId}
                type={featured.type}
              />
            </MotionBox>
          ) : null
        )}

        {/* Movie Catalogs Section */}
        {movieCatalogs.length === 0 ? (
          <CatalogCarousel
            title="Movies"
            items={catalogItems[`movie-trending`] || []}
          />
        ) : (
          movieCatalogs.map((catalog) => (
            <CatalogCarousel
              key={`${catalog.type}-${catalog.id}`}
              title={catalog.name}
              items={catalogItems[`${catalog.type}-${catalog.id}`] || []}
            />
          ))
        )}

        {/* Series Catalogs Section */}
        {seriesCatalogs.length === 0 ? (
          <CatalogCarousel
            title="TV Shows"
            items={catalogItems[`series-trending`] || []}
          />
        ) : (
          seriesCatalogs.map((catalog) => (
            <CatalogCarousel
              key={`${catalog.type}-${catalog.id}`}
              title={catalog.name}
              items={catalogItems[`${catalog.type}-${catalog.id}`] || []}
            />
          ))
        )}
      </VStack>
    </MotionBox>
  )
}

export default Home