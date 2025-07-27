import { Box, Image, Text, Badge, VStack, HStack, Icon, Tooltip, useColorModeValue } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { FiStar, FiCalendar, FiPlay } from 'react-icons/fi'
import { Link } from 'react-router-dom'

const MotionBox = motion(Box)

interface MediaCardProps {
  id: string
  title: string
  poster: string
  type: 'movie' | 'series'
  year?: number
  rating?: number
}

const MediaCard = ({ id, title, poster, type, year, rating }: MediaCardProps) => {
  const cardBg = useColorModeValue('gray.800', 'gray.900')
  const overlayBg = useColorModeValue(
    'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0) 100%)',
    'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0) 100%)'
  )
  return (
    <MotionBox
      as={Link}
      to={`/details/${type}/${id}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Box
        position="relative"
        borderRadius="xl"
        overflow="hidden"
        bg={cardBg}
        boxShadow="2xl"
        role="group"
      >
        <Image
          src={poster?.startsWith('http') || poster?.startsWith('/') ? poster : poster ? `https://image.tmdb.org/t/p/w500${poster}` : '/placeholder-poster.svg'}
          alt={title}
          w="full"
          h="auto"
          aspectRatio="2/3"
          objectFit="cover"
          loading="lazy"
          fallbackSrc="/placeholder-poster.svg"
          transition="transform 0.2s"
          _groupHover={{ transform: 'scale(1.1)' }}
        />

        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          background={overlayBg}
          opacity={0.8}
          transition="opacity 0.2s"
          _groupHover={{ opacity: 1 }}
        />

        <Box
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          opacity={0}
          transition="opacity 0.2s"
          _groupHover={{ opacity: 1 }}
        >
          <Icon as={FiPlay} w={12} h={12} color="white" />
        </Box>

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

          <HStack spacing={4} width="full" justify="space-between">
            <HStack spacing={2}>
              <Badge colorScheme={type === 'movie' ? 'blue' : 'purple'} variant="solid">
                {type}
              </Badge>
              {year && (
                <Tooltip label="Release Year" placement="top">
                  <HStack spacing={1}>
                    <Icon as={FiCalendar} color="gray.300" />
                    <Text color="gray.300" fontSize="xs">
                      {year}
                    </Text>
                  </HStack>
                </Tooltip>
              )}
            </HStack>
            {rating && (
              <Tooltip label="Rating" placement="top">
                <HStack spacing={1}>
                  <Icon as={FiStar} color="yellow.400" />
                  <Text color="gray.300" fontSize="xs">
                    {rating.toFixed(1)}
                  </Text>
                </HStack>
              </Tooltip>
            )}
          </HStack>
        </VStack>
      </Box>
    </MotionBox>
  )
}

export default MediaCard