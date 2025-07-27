import {
  Box,
  Input,
  InputGroup,
  InputLeftElement,
  VStack,
  Grid,
  Text,
  Spinner,
  Center,
  Tabs,
  TabList,
  TabPanels,
  TabPanel,
  Tab,
  useBreakpointValue
} from '@chakra-ui/react'
import { FiSearch } from 'react-icons/fi'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useDebounce } from 'use-debounce'
import MediaCard from '@components/catalog/MediaCard'
import { useAddons } from '@hooks/useAddons'
import { useTMDB } from '@hooks/useTMDB'

const MotionGrid = motion(Grid)

const Search = () => {
  const [query, setQuery] = useState('')
  const [debouncedQuery] = useDebounce(query, 500)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const { searchContent } = useTMDB()
  const { addons } = useAddons()
  const columns = useBreakpointValue({ base: 2, md: 3, lg: 4, xl: 5 })

  useEffect(() => {
    const search = async () => {
      if (!debouncedQuery) {
        setResults([])
        return
      }

      setLoading(true)
      try {
        // Search across all active addons
        const addonResults = await Promise.all(
          addons.map(async (addon) => {
            if (!addon.resources.includes('search')) return []

            try {
              const response = await fetch(
                `${addon.resources.find(r => r.startsWith('search'))}/${debouncedQuery}`
              )
              return response.json()
            } catch {
              return []
            }
          })
        )

        // Search TMDB if available
        const tmdbResults = await searchContent(debouncedQuery)

        // Merge and deduplicate results
        const allResults = [
          ...tmdbResults,
          ...addonResults.flat()
        ].filter(Boolean)

        const uniqueResults = Array.from(
          new Map(allResults.map(item => [item.id, item])).values()
        )

        setResults(uniqueResults)
      } catch (error) {
        console.error('Search failed:', error)
      } finally {
        setLoading(false)
      }
    }

    search()
  }, [debouncedQuery, addons, searchContent])

  const movieResults = results.filter(item => item.type === 'movie')
  const seriesResults = results.filter(item => item.type === 'series')

  return (
    <Box p={8}>
      <VStack spacing={8} align="stretch" maxW="6xl" mx="auto">
        <InputGroup size="lg">
          <InputLeftElement pointerEvents="none">
            <FiSearch />
          </InputLeftElement>
          <Input
            placeholder="Search movies, TV shows, and more..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            bg="background.secondary"
            _focus={{
              bg: 'background.secondary',
              borderColor: 'brand.primary'
            }}
          />
        </InputGroup>

        {loading ? (
          <Center py={12}>
            <Spinner size="xl" color="brand.primary" />
          </Center>
        ) : results.length > 0 ? (
          <Tabs variant="soft-rounded" colorScheme="brand">
            <TabList mb={4}>
              <Tab>All ({results.length})</Tab>
              <Tab>Movies ({movieResults.length})</Tab>
              <Tab>TV Shows ({seriesResults.length})</Tab>
            </TabList>

            <TabPanels>
              <TabPanel px={0}>
                <MotionGrid
                  templateColumns={`repeat(${columns}, 1fr)`}
                  gap={6}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {results.map((item) => (
                    <MediaCard
                      key={item.id}
                      id={item.id}
                      title={item.title || item.name}
                      poster={item.poster}
                      type={item.type}
                      year={item.year}
                      rating={item.rating}
                    />
                  ))}
                </MotionGrid>
              </TabPanel>

              <TabPanel px={0}>
                <MotionGrid
                  templateColumns={`repeat(${columns}, 1fr)`}
                  gap={6}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {movieResults.map((item) => (
                    <MediaCard
                      key={item.id}
                      id={item.id}
                      title={item.title}
                      poster={item.poster}
                      type={item.type}
                      year={item.year}
                      rating={item.rating}
                    />
                  ))}
                </MotionGrid>
              </TabPanel>

              <TabPanel px={0}>
                <MotionGrid
                  templateColumns={`repeat(${columns}, 1fr)`}
                  gap={6}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {seriesResults.map((item) => (
                    <MediaCard
                      key={item.id}
                      id={item.id}
                      title={item.title}
                      poster={item.poster}
                      type={item.type}
                      year={item.year}
                      rating={item.rating}
                    />
                  ))}
                </MotionGrid>
              </TabPanel>
            </TabPanels>
          </Tabs>
        ) : query && !loading ? (
          <Center py={12}>
            <Text color="whiteAlpha.700">
              No results found for "{query}"
            </Text>
          </Center>
        ) : null}
      </VStack>
    </Box>
  )
}

export default Search