import { Box, Heading, VStack } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { useAddonSystem } from '@hooks/useAddonSystem'
import { useFeatured } from '@hooks/useFeatured'
import FeaturedContent from './FeaturedContent'
import CatalogGrid from '@components/catalog/CatalogGrid'

const MotionBox = motion(Box) as typeof motion.div

const Home = () => {
  const { featured, loading, fetchFeatured } = useFeatured()
  const { getCatalogItems: _ } = useAddonSystem()

  useEffect(() => {
    fetchFeatured()
  }, [fetchFeatured])

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
      </VStack>
    </MotionBox>
  )
}

export default Home