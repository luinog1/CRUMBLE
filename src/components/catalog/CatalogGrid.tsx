import { Grid, GridItem, Spinner, Center, Text } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import MediaCard from './MediaCard'
import { useAddons } from '@hooks/useAddons'
import { CatalogRequest } from '@/types'

const MotionGrid = motion(Grid)

interface CatalogGridProps {
  catalog: CatalogRequest
  filter?: Record<string, string>
}

const CatalogGrid = ({ catalog, filter }: CatalogGridProps) => {
  const { getCatalogItems, loading, error } = useAddons()
  const items = getCatalogItems(catalog.id, filter)

  if (loading) {
    return (
      <Center h="200px">
        <Spinner size="xl" color="brand.primary" />
      </Center>
    )
  }

  if (error) {
    return (
      <Center h="200px">
        <Text color="red.400">{error}</Text>
      </Center>
    )
  }

  if (!items?.length) {
    return (
      <Center h="200px">
        <Text>No items found</Text>
      </Center>
    )
  }

  const gridVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  }

  return (
    <MotionGrid
      templateColumns={{
        base: 'repeat(2, 1fr)',
        md: 'repeat(3, 1fr)',
        lg: 'repeat(4, 1fr)',
        xl: 'repeat(5, 1fr)'
      }}
      gap={6}
      variants={gridVariants}
      initial="hidden"
      animate="visible"
    >
      {items.map((item) => (
        <GridItem
          key={item.id}
          as={motion.div}
          variants={itemVariants}
        >
          <MediaCard
            id={item.id}
            title={item.name}
            poster={item.poster}
            type={item.type}
            year={item.year}
            rating={item.rating}
          />
        </GridItem>
      ))}
    </MotionGrid>
  )
}

export default CatalogGrid