import { Box, Image, Text, Badge, VStack, HStack } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { FiStar } from 'react-icons/fi'

const MotionBox = motion(Box)

interface MediaCardProps {
  id: string
  title: string
  poster: string
  type: 'movie' | 'series'
  year?: number
  rating?: number
  onClick?: () => void
}

const MediaCard = ({
  id,
  title,
  poster,
  type,
  year,
  rating,
  onClick
}: MediaCardProps) => {
  return (
    <MotionBox
      as="article"
      cursor="pointer"
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Box
        position="relative"
        borderRadius="lg"
        overflow="hidden"
        bg="background.secondary"
        boxShadow="xl"
      >
        <Image
          src={poster?.startsWith('http') ? poster : `https://image.tmdb.org/t/p/w500${poster}`}
          alt={title}
          w="full"
          h="400px"
          objectFit="cover"
          loading="lazy"
          fallbackSrc="/placeholder-poster.svg"
        />

        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bgGradient="linear(to-t, background.primary 0%, transparent 50%)"
          opacity={0}
          transition="opacity 0.2s"
          _groupHover={{ opacity: 1 }}
        />

        <VStack
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          p={4}
          align="flex-start"
          spacing={2}
        >
          <Text
            fontSize="lg"
            fontWeight="bold"
            color="white"
            noOfLines={2}
          >
            {title}
          </Text>

          <HStack spacing={2}>
            <Badge colorScheme={type === 'movie' ? 'blue' : 'purple'}>
              {type}
            </Badge>
            {year && (
              <Badge colorScheme="gray">
                {year}
              </Badge>
            )}
            {rating && (
              <HStack spacing={1}>
                <FiStar />
                <Text fontSize="sm">{rating}</Text>
              </HStack>
            )}
          </HStack>
        </VStack>
      </Box>
    </MotionBox>
  )
}

export default MediaCard