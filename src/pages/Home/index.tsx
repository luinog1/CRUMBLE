import { Box, Grid, Heading, VStack, useBreakpointValue } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import FeaturedContent from './FeaturedContent'
import TrendingRow from './TrendingRow'
import CatalogGrid from '@components/catalog/CatalogGrid'
import { useAddons } from '@hooks/useAddons'

const MotionBox = motion(Box)

const Home = () => {
  const { catalogs } = useAddons()
  const columns = useBreakpointValue({ base: 2, md: 3, lg: 4, xl: 5 })

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  return (
    <MotionBox
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      p={6}
    >
      <VStack spacing={8} align="stretch">
        <FeaturedContent />

        <Box>
          <Heading size="lg" mb={4}>
            Trending Now
          </Heading>
          <TrendingRow />
        </Box>

        {catalogs.map((catalog) => (
          <Box key={catalog.id}>
            <Heading size="lg" mb={4}>
              {catalog.name}
            </Heading>
            <Grid
              templateColumns={`repeat(${columns}, 1fr)`}
              gap={6}
              w="full"
            >
              <CatalogGrid catalog={catalog} />
            </Grid>
          </Box>
        ))}
      </VStack>
    </MotionBox>
  )
}

export default Home