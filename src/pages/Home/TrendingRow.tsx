import { useRef } from 'react'
import { Box, Flex, IconButton } from '@chakra-ui/react'
import { motion, useAnimation } from 'framer-motion'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import MediaCard from '@components/catalog/MediaCard'
import { useTMDB } from '@hooks/useTMDB'

const MotionFlex = motion(Flex)

const TrendingRow = () => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const controls = useAnimation()
  const { trending } = useTMDB()

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return

    const scrollAmount = direction === 'left' ? -400 : 400
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
  }

  return (
    <Box position="relative">
      <IconButton
        aria-label="Scroll left"
        icon={<FiChevronLeft />}
        position="absolute"
        left={-4}
        top="50%"
        transform="translateY(-50%)"
        zIndex={2}
        onClick={() => scroll('left')}
        variant="ghost"
        size="lg"
        _hover={{ bg: 'whiteAlpha.200' }}
      />

      <Flex
        ref={scrollRef}
        overflowX="auto"
        gap={4}
        py={4}
        sx={{
          '::-webkit-scrollbar': {
            display: 'none'
          },
          scrollbarWidth: 'none'
        }}
      >
        <MotionFlex
          drag="x"
          dragConstraints={scrollRef}
          gap={4}
        >
          {trending.map((item) => (
            <Box
              key={item.id}
              flex="none"
              w="300px"
              transition="transform 0.2s"
              _hover={{ transform: 'scale(1.05)' }}
            >
              <MediaCard
                id={item.id}
                title={item.title}
                poster={item.poster}
                type={item.type}
                year={item.year}
                rating={item.rating}
              />
            </Box>
          ))}
        </MotionFlex>
      </Flex>

      <IconButton
        aria-label="Scroll right"
        icon={<FiChevronRight />}
        position="absolute"
        right={-4}
        top="50%"
        transform="translateY(-50%)"
        zIndex={2}
        onClick={() => scroll('right')}
        variant="ghost"
        size="lg"
        _hover={{ bg: 'whiteAlpha.200' }}
      />
    </Box>
  )
}

export default TrendingRow