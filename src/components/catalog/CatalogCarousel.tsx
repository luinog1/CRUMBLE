import { Box, Heading, IconButton, Text, useBreakpointValue } from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons'
import { useState, useRef } from 'react'
import MediaCard from './MediaCard'
import type { CatalogItem } from './CatalogGrid'

const MotionBox = motion(Box)

interface CatalogCarouselProps {
  title: string
  items: CatalogItem[]
  loading?: boolean
  error?: string
}

const CatalogCarousel = ({ title, items, loading = false, error }: CatalogCarouselProps) => {
  const [scrollPosition, setScrollPosition] = useState(0)
  const carouselRef = useRef<HTMLDivElement>(null)
  
  const itemsPerView = useBreakpointValue({ base: 2, sm: 3, md: 4, lg: 5, xl: 6 }) || 2
  const itemWidth = useBreakpointValue({ base: '150px', sm: '170px', md: '180px' }) || '150px'
  
  const scroll = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -itemWidth.replace('px', '') : itemWidth.replace('px', '')
      carouselRef.current.scrollBy({ left: Number(scrollAmount), behavior: 'smooth' })
      setScrollPosition(carouselRef.current.scrollLeft + Number(scrollAmount))
    }
  }

  return (
    <Box position="relative" mb={8}>
      {!loading && !error && items.length > 0 && (
        <Heading size="lg" mb={4}>{title}</Heading>
      )}
      {loading ? (
        <Box height="300px" display="flex" alignItems="center" justifyContent="center">
          <Text>Loading...</Text>
        </Box>
      ) : error ? (
        <Box height="300px" display="flex" alignItems="center" justifyContent="center">
          <Text color="red.400">{error}</Text>
        </Box>
      ) : items.length > 0 ? (
        <Box position="relative" overflow="hidden">
        <IconButton
          aria-label="Scroll left"
          icon={<ChevronLeftIcon />}
          position="absolute"
          left={0}
          top="50%"
          transform="translateY(-50%)"
          zIndex={2}
          onClick={() => scroll('left')}
          display={scrollPosition <= 0 ? 'none' : 'flex'}
          variant="ghost"
          colorScheme="whiteAlpha"
          size="lg"
          _hover={{ bg: 'whiteAlpha.200' }}
        />
        
        <Box
          ref={carouselRef}
          overflowX="auto"
          css={{
            '&::-webkit-scrollbar': {
              display: 'none'
            },
            'scrollbarWidth': 'none',
            'msOverflowStyle': 'none'
          }}
          onScroll={(e) => setScrollPosition((e.target as HTMLDivElement).scrollLeft)}
        >
          <MotionBox
            display="flex"
            gap={6}
            py={2}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AnimatePresence>
              {items.map((item, index) => (
                <MotionBox
                  key={item.id}
                  flexShrink={0}
                  width={itemWidth}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{
                    opacity: 1,
                    x: 0,
                    transition: { delay: index * 0.1 }
                  }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <MediaCard
                    id={item.id}
                    title={item.title}
                    poster={item.poster}
                    type={item.type}
                    year={item.year}
                    rating={item.rating}
                  />
                </MotionBox>
              ))}
            </AnimatePresence>
          </MotionBox>
        </Box>
        
        <IconButton
            aria-label="Scroll right"
            icon={<ChevronRightIcon />}
            position="absolute"
            right={0}
            top="50%"
            transform="translateY(-50%)"
            zIndex={2}
            onClick={() => scroll('right')}
            display={scrollPosition >= (items.length - itemsPerView) * Number(itemWidth.replace('px', '')) ? 'none' : 'flex'}
            variant="ghost"
            colorScheme="whiteAlpha"
            size="lg"
            _hover={{ bg: 'whiteAlpha.200' }}
          />
        </Box>
      ) : (
        <Box height="300px" display="flex" alignItems="center" justifyContent="center">
          <Text color="gray.500">No items available</Text>
        </Box>
      )}
    </Box>
  )
}

export default CatalogCarousel