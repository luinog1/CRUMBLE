import { useRef } from 'react'
import { Box, Flex, IconButton } from '@chakra-ui/react'
import { motion, useAnimation } from 'framer-motion'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import MediaCard from '@components/catalog/MediaCard'
import { useTMDB } from '@hooks/useTMDB'
type EnrichedItem = {
  id: string
  title: string
  type: 'movie' | 'series'
  poster: string | null
  backdrop: string | null
  year?: number
  rating?: number
  description?: string
  cast?: string[]
  genres?: string[]
  trailer?: string | null
}

const MotionFlex = motion(Flex) as typeof motion.div

const TrendingRow = () => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const controls = useAnimation()
  const { trending } = useTMDB()

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return

    const scrollAmount = direction === 'left' ? -400 : 400
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
  }

  if (!trending.length) return null

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
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        <MotionFlex
          drag="x"
          dragConstraints={scrollRef}
          style={{ gap: '1rem' }}
          animate={controls}
          dragElastic={0.1}
          dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
          onDragEnd={(_e, info) => {
            const velocity = info.velocity.x
            if (Math.abs(velocity) > 500) {
              void controls.start({
                x: velocity > 0 ? 100 : -100,
                transition: { duration: 0.5 }
              })
            }
          }}
        >
          {trending.map((item: EnrichedItem) => (
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
                poster={item.poster ?? '/placeholder-poster.svg'}
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