import { Box, Flex, Heading, Text, Button, Image } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { FiPlay, FiPlus } from 'react-icons/fi'
import { usePlayer } from '@hooks/usePlayer'
import { useLibrary } from '@hooks/useLibrary'

const MotionBox = motion(Box)

interface FeaturedContentProps {
  title: string
  description: string
  backgroundImage: string
  videoId: string
  type: 'movie' | 'series'
}

const FeaturedContent = ({
  title,
  description,
  backgroundImage,
  videoId,
  type
}: FeaturedContentProps) => {
  const { playVideo } = usePlayer()
  const { addToLibrary } = useLibrary()

  return (
    <MotionBox
      position="relative"
      height="70vh"
      borderRadius="xl"
      overflow="hidden"
      role="group"
    >
      <Image
        src={backgroundImage}
        alt={title}
        objectFit="cover"
        w="full"
        h="full"
        transition="transform 0.3s ease-in-out"
        _groupHover={{ transform: 'scale(1.05)' }}
      />

      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg="linear-gradient(0deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.3) 100%)"
        opacity={0.8}
        transition="opacity 0.3s ease-in-out"
        _groupHover={{ opacity: 1 }}
      />

      <Box
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        p={8}
        color="white"
        transform="translateY(0)"
        transition="transform 0.3s ease-in-out"
        _groupHover={{ transform: 'translateY(-10px)' }}
      >
        <Flex direction="column" maxW="2xl">
          <Heading as="h1" size="2xl" mb={4}>
            {title}
          </Heading>
          <Text fontSize="xl" mb={6}>
            {description}
          </Text>
          <Flex gap={4}>
            <Button
              leftIcon={<FiPlay />}
              size="lg"
              colorScheme="blue"
              onClick={() => {
                // Navigate to details page instead of directly playing
                window.location.href = `/details/${type}/${videoId}`
              }}
              _hover={{ transform: 'scale(1.05)' }}
              transition="transform 0.2s"
            >
              Watch Now
            </Button>
            <Button
              leftIcon={<FiPlus />}
              size="lg"
              variant="outline"
              _hover={{
                bg: 'whiteAlpha.200',
                transform: 'scale(1.05)'
              }}
              transition="all 0.2s"
              onClick={() => addToLibrary({
                id: videoId,
                type,
                addedAt: Date.now(),
                metadata: {
                  title,
                  poster: backgroundImage
                }
              })}
            >
              Add to Library
            </Button>
          </Flex>
        </Flex>
      </Box>
    </MotionBox>
  )
}

export default FeaturedContent