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
  
  // Log the current state for debugging
  console.log('Addons:', addons.length, 'Movie catalogs:', movieCatalogs.length, 'Series catalogs:', seriesCatalogs.length);

  return (
    <MotionBox
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{ padding: '1.5rem' }}
    >
      <VStack spacing={4} align="stretch">
        {loading ? (
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
        ) : null}

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