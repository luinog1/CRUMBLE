import { Grid, GridItem, Spinner, Center, Text, useBreakpointValue } from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import MediaCard from './MediaCard'
import { useAddonSystem } from '@/hooks/useAddonSystem'
import type { CatalogRequest } from '@/types'

const MotionGrid = motion(Grid)
const MotionGridItem = motion(GridItem)

export interface CatalogItem {
  id: string
  title: string
  poster: string
  type: 'movie' | 'series'
  year?: number
  rating?: number
}

interface CatalogGridProps {
  catalog: CatalogRequest
  filter?: Record<string, string>
}

const CatalogGrid = ({ catalog, filter }: CatalogGridProps) => {
  const [items, setItems] = useState<CatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { getCatalogItems } = useAddonSystem()
  const columns = useBreakpointValue({ base: 2, sm: 3, md: 4, lg: 5, xl: 6 })

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const results = await getCatalogItems(catalog.type, catalog.id, filter)
        setItems(results || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch catalog items')
      } finally {
        setLoading(false)
      }
    }

    fetchItems()
  }, [catalog.id, catalog.type, filter, getCatalogItems])

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

  return (
    <MotionGrid
      templateColumns={`repeat(${columns}, 1fr)`}
      gap={6}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <AnimatePresence>
        {items.map((item, index) => (
          <MotionGridItem
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              transition: { delay: index * 0.1 }
            }}
            exit={{ opacity: 0, y: -20 }}
          >
            <MediaCard
              id={item.id}
              title={item.title}
              poster={item.poster}
              type={item.type}
              year={item.year}
              rating={item.rating}
            />
          </MotionGridItem>
        ))}
      </AnimatePresence>
    </MotionGrid>
  )
}

export default CatalogGrid