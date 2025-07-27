import { Box, Flex, Heading, Text, Button, Image } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { FiPlay, FiPlus } from 'react-icons/fi'
import { usePlayer } from '@hooks/usePlayer'
import { useLibrary } from '@hooks/useLibrary'

const MotionBox = motion(Box)

interface FeaturedContentProps {
  title?: string
  description?: string
  backgroundImage?: string
  videoId?: string
}

const FeaturedContent = ({
  title = 'The Last of Us',
  description = 'After a global pandemic destroys civilization, a hardened survivor takes charge of a 14-year-old girl who may be humanity\'s last hope.',
  backgroundImage = 'https://image.tmdb.org/t/p/original/uDgy6hyPd82kOHh6I95FLtLnj6p.jpg',
  videoId = 'last-of-us-s01e01'
}: FeaturedContentProps) => {
  const { playVideo } = usePlayer()
  const { addToLibrary } = useLibrary()

  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      position="relative"
      height="70vh"
      borderRadius="xl"
      overflow="hidden"
    >
      <Image
        src={backgroundImage}
        alt={title}
        objectFit="cover"
        w="full"
        h="full"
      />

      <Box
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        bgGradient="linear(to-t, background.primary, transparent)"
        p={8}
        color="white"
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
              onClick={() => playVideo(videoId)}
            >
              Play
            </Button>
            <Button
              leftIcon={<FiPlus />}
              size="lg"
              variant="outline"
              onClick={() => addToLibrary({
                id: videoId,
                type: 'series',
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