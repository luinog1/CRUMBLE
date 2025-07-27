import { Grid, GridItem, Spinner, Center, Text, VStack, useBreakpointValue } from '@chakra-ui/react'
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
        // Handle virtual catalogs from stream scrapers
        if (catalog.isVirtual) {
          console.log('This is a virtual catalog for a stream scraper, using TMDB trending as fallback')
          
          // For virtual catalogs, we'll use TMDB trending as a fallback
          // This allows users to discover content that they can then stream using the scraper
          const tmdbApiKey = localStorage.getItem('tmdbApiKey') || ''
          if (!tmdbApiKey) {
            setError('TMDB API key is required for virtual catalogs')
            setLoading(false)
            return
          }
          
          const type = catalog.type === 'movie' ? 'movie' : 'tv'
          const url = `https://api.themoviedb.org/3/trending/${type}/week?api_key=${tmdbApiKey}`
          
          const response = await fetch(url)
          if (!response.ok) {
            throw new Error(`TMDB API error: ${response.status} ${response.statusText}`)
          }
          
          const data = await response.json()
          
          // Convert TMDB items to catalog items
          const catalogItems = data.results.map((item: any) => ({
            id: `tmdb-${catalog.type}:${item.id}`,
            title: item.title || item.name,
            poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '',
            type: catalog.type,
            year: item.release_date?.substring(0, 4) || item.first_air_date?.substring(0, 4),
            rating: item.vote_average ? item.vote_average / 2 : undefined,
            virtualCatalogId: catalog.id,
            addonId: catalog.addonId
          }))
          
          setItems(catalogItems)
        } else {
          // Regular catalog
          const results = await getCatalogItems(catalog.type, catalog.id, filter)
          setItems(results || [])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch catalog items')
      } finally {
        setLoading(false)
      }
    }

    fetchItems()
  }, [catalog.id, catalog.type, catalog.isVirtual, catalog.addonId, filter, getCatalogItems])

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
        <VStack spacing={4}>
          <Text>No items found</Text>
          <Text fontSize="sm" color="gray.500">
            Try adding an addon in Settings or check your network connection
          </Text>
        </VStack>
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