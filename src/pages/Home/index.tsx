import { Box, Heading, VStack } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { useAddonSystem } from '@hooks/useAddonSystem'
import { useFeatured } from '@hooks/useFeatured'
import FeaturedContent from './FeaturedContent'
import CatalogGrid from '@components/catalog/CatalogGrid'
import type { CatalogRequest } from '@/types'

const MotionBox = motion(Box) as typeof motion.div

const Home = () => {
  const { featured, loading, fetchFeatured } = useFeatured()
  const { addons } = useAddonSystem()

  useEffect(() => {
    fetchFeatured()
  }, [fetchFeatured])

  // Group catalogs by type
  const movieCatalogs: CatalogRequest[] = [];
  const seriesCatalogs: CatalogRequest[] = [];
  
  // Process addons to extract catalogs
  try {
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
    
    // Create virtual catalogs for stream scraper addons that don't have catalogs
    const streamScraperAddons = addons.filter(addon => 
      addon.resources && 
      addon.resources.includes('stream') && 
      (!addon.catalogs || addon.catalogs.length === 0) &&
      addon.id !== 'cinemeta' // Skip Cinemeta as it's not a stream scraper
    );
    
    streamScraperAddons.forEach(addon => {
      // Create a virtual catalog for movies
      movieCatalogs.push({
        id: `${addon.id}-movies`,
        name: `${addon.name || addon.id} Movies`,
        type: 'movie',
        extra: {
          skip: '0',
          search: ''
        },
        isVirtual: true,
        addonId: addon.id
      });
      
      // Create a virtual catalog for series
      seriesCatalogs.push({
        id: `${addon.id}-series`,
        name: `${addon.name || addon.id} Series`,
        type: 'series',
        extra: {
          skip: '0',
          search: ''
        },
        isVirtual: true,
        addonId: addon.id
      });
    });
  } catch (error) {
    console.error('Error processing addons:', error);
    // If there's an error processing addons, we'll rely on the fallback catalogs
  }
  
  // Log the current state for debugging
  console.log('Addons:', addons.length, 'Movie catalogs:', movieCatalogs.length, 'Series catalogs:', seriesCatalogs.length);
  console.log('Addon details:', addons.map(addon => ({
    id: addon.id,
    name: addon.name,
    baseUrl: addon.baseUrl,
    catalogs: addon.catalogs,
    resources: addon.resources
  })));
  console.log('Movie catalogs details:', movieCatalogs);
  console.log('Series catalogs details:', seriesCatalogs);

  return (
    <MotionBox
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{ padding: '1.5rem' }}
    >
      <VStack spacing={4} align="stretch">
        {localStorage.getItem('enableHero') !== 'false' && (
          loading ? (
            <Box height="400px" borderRadius="xl" bg="gray.700" />
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

        {/* Fallback for when no movie catalogs are available */}
        {movieCatalogs.length === 0 && (
          <Box>
            <Heading size="lg" mb={4}>Movies</Heading>
            <CatalogGrid 
              catalog={{
                type: 'movie',
                id: 'trending',
                name: 'Trending Movies'
              }} 
            />
          </Box>
        )}

        {/* Dynamic movie catalogs from addons */}
        {movieCatalogs.map((catalog) => (
          <Box key={`${catalog.type}-${catalog.id}`}>
            <Heading size="lg" mb={4}>{catalog.name}</Heading>
            <CatalogGrid catalog={catalog} />
          </Box>
        ))}

        {/* Fallback for when no series catalogs are available */}
        {seriesCatalogs.length === 0 && (
          <Box>
            <Heading size="lg" mb={4}>TV Shows</Heading>
            <CatalogGrid 
              catalog={{
                type: 'series',
                id: 'trending',
                name: 'Trending TV Shows'
              }} 
            />
          </Box>
        )}

        {/* Dynamic series catalogs from addons */}
        {seriesCatalogs.map((catalog) => (
          <Box key={`${catalog.type}-${catalog.id}`}>
            <Heading size="lg" mb={4}>{catalog.name}</Heading>
            <CatalogGrid catalog={catalog} />
          </Box>
        ))}
      </VStack>
    </MotionBox>
  )
}

export default Home