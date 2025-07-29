import React, { useEffect, useState } from 'react'
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Image,
  Badge,
  Spinner,
  Alert,
  AlertIcon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  useToast,
  Divider,
  SimpleGrid,
  Link
} from '@chakra-ui/react'
import { useParams, useNavigate } from 'react-router-dom'
import { useNetflixApi } from '../../hooks/useNetflixApi'
import { TMDBMovieDetails } from '../../services/NetflixApiClient'

// Netflix Clone Details Component
// Implements movie/TV show details with Stremio stream integration

interface StreamItemProps {
  stream: any
  onPlay: () => void
}

const StreamItem: React.FC<StreamItemProps> = ({ stream, onPlay }) => {
  const getQualityColor = (quality?: string) => {
    if (!quality) return 'gray'
    if (quality.includes('4K') || quality.includes('2160p')) return 'purple'
    if (quality.includes('1080p')) return 'blue'
    if (quality.includes('720p')) return 'green'
    return 'gray'
  }

  const formatSize = (size?: string) => {
    if (!size) return null
    return size.replace(/[^0-9.]/g, '') + ' GB'
  }

  return (
    <Box
      p={4}
      bg="gray.800"
      borderRadius="md"
      border="1px"
      borderColor="gray.600"
      _hover={{ borderColor: 'red.500', transform: 'translateY(-2px)' }}
      transition="all 0.2s"
      cursor="pointer"
      onClick={onPlay}
    >
      <VStack align="start" spacing={2}>
        <HStack justify="space-between" w="100%">
          <Text color="white" fontWeight="bold" noOfLines={1}>
            {stream.title || 'Stream'}
          </Text>
          <Badge colorScheme={getQualityColor(stream.quality)}>
            {stream.quality || 'Unknown'}
          </Badge>
        </HStack>
        
        <HStack spacing={4}>
          {stream.addon && (
            <Badge colorScheme="blue" variant="outline">
              {stream.addon}
            </Badge>
          )}
          {formatSize(stream.size) && (
            <Text fontSize="sm" color="gray.400">
              {formatSize(stream.size)}
            </Text>
          )}
          {stream.seeds && (
            <Text fontSize="sm" color="green.400">
              🌱 {stream.seeds}
            </Text>
          )}
        </HStack>
        
        <Button
          size="sm"
          colorScheme="red"
          variant="outline"
          w="100%"
          onClick={(e) => {
            e.stopPropagation()
            onPlay()
          }}
        >
          ▶ Play Stream
        </Button>
      </VStack>
    </Box>
  )
}

interface StreamsModalProps {
  isOpen: boolean
  onClose: () => void
  streams: any[]
  title: string
}

const StreamsModal: React.FC<StreamsModalProps> = ({ isOpen, onClose, streams, title }) => {
  const toast = useToast()

  const handlePlayStream = (stream: any) => {
    if (stream.url) {
      // Open stream URL in new tab
      window.open(stream.url, '_blank')
      toast({
        title: 'Stream Opened',
        description: 'Stream opened in new tab',
        status: 'success',
        duration: 2000
      })
    } else {
      toast({
        title: 'Stream Error',
        description: 'No playable URL found',
        status: 'error',
        duration: 3000
      })
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl">
      <ModalOverlay bg="blackAlpha.800" />
      <ModalContent bg="gray.900" color="white">
        <ModalHeader>
          <HStack>
            <Text>🎬</Text>
            <Text>Streams for {title}</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          {streams.length === 0 ? (
            <VStack spacing={4} py={8}>
              <Text fontSize="lg" color="gray.400">
                No streams found for this content
              </Text>
              <Text fontSize="sm" color="gray.500">
                Try checking back later or search for alternative titles
              </Text>
            </VStack>
          ) : (
            <VStack spacing={4} align="stretch">
              <Text color="gray.300">
                Found {streams.length} stream(s) from Stremio addons
              </Text>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                {streams.map((stream, index) => (
                  <StreamItem
                    key={index}
                    stream={stream}
                    onPlay={() => handlePlayStream(stream)}
                  />
                ))}
              </SimpleGrid>
            </VStack>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

const NetflixDetails: React.FC = () => {
  const { type, id } = useParams<{ type: string; id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const { isOpen, onOpen, onClose } = useDisclosure()
  
  const { fetchMovieDetails, getTVDetails, findStreams, loading, error } = useNetflixApi()
  
  const [details, setDetails] = useState<TMDBMovieDetails | null>(null)
  const [streams, setStreams] = useState<any[]>([])
  const [loadingStreams, setLoadingStreams] = useState(false)

  useEffect(() => {
    const loadDetails = async () => {
      if (!id || !type) return
      
      try {
        let detailsData
        if (type === 'movie') {
          detailsData = await fetchMovieDetails(parseInt(id))
        } else if (type === 'tv') {
          detailsData = await getTVDetails(parseInt(id))
        }
        
        setDetails(detailsData)
      } catch (err) {
        console.error('Failed to load details:', err)
        toast({
          title: 'Error',
          description: 'Failed to load content details',
          status: 'error',
          duration: 5000
        })
      }
    }

    loadDetails()
  }, [id, type, fetchMovieDetails, getTVDetails, toast])

  const handleFindStreams = async () => {
    if (!details || !id || !type) return
    
    try {
      setLoadingStreams(true)
      
      // Use the backend API for stream fetching
      const stremioType = type === 'movie' ? 'movie' : 'series'
      const foundStreams = await findStreams(stremioType, id)
      setStreams(foundStreams)
      onOpen()
      
      toast({
        title: 'Streams Search Complete',
        description: `Found ${foundStreams.length} stream(s)`,
        status: foundStreams.length > 0 ? 'success' : 'warning',
        duration: 3000
      })
    } catch (err) {
      console.error('Failed to find streams:', err)
      toast({
        title: 'Stream Search Failed',
        description: 'Unable to find streams for this content',
        status: 'error',
        duration: 5000
      })
    } finally {
      setLoadingStreams(false)
    }
  }

  const handleWatchNow = () => {
    // For now, just trigger stream search
    handleFindStreams()
  }

  if (loading && !details) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        h="100vh"
        bg="black"
      >
        <VStack spacing={4}>
          <Spinner size="xl" color="red.500" />
          <Text color="white">Loading details...</Text>
        </VStack>
      </Box>
    )
  }

  if (error || !details) {
    return (
      <Box bg="black" minH="100vh" p={6}>
        <VStack spacing={4}>
          <Alert status="error" bg="red.900" color="white">
            <AlertIcon />
            {error || 'Content not found'}
          </Alert>
          <Button onClick={() => navigate('/')} colorScheme="red">
            Back to Home
          </Button>
        </VStack>
      </Box>
    )
  }

  const backdropUrl = details.backdrop_path
    ? `https://image.tmdb.org/t/p/original${details.backdrop_path}`
    : null
  
  const posterUrl = details.poster_path
    ? `https://image.tmdb.org/t/p/w500${details.poster_path}`
    : null

  return (
    <Box bg="black" minH="100vh">
      {/* Hero Section */}
      <Box
        position="relative"
        h="70vh"
        backgroundImage={backdropUrl ? `url(${backdropUrl})` : 'none'}
        backgroundSize="cover"
        backgroundPosition="center"
        bg={!backdropUrl ? 'gray.800' : 'transparent'}
      >
        {/* Overlay */}
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.3) 100%)"
        />
        
        {/* Content */}
        <Box
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          p={8}
          zIndex={1}
        >
          <HStack align="end" spacing={8}>
            {/* Poster */}
            {posterUrl && (
              <Image
                src={posterUrl}
                alt={details.title}
                w="300px"
                h="450px"
                objectFit="cover"
                borderRadius="lg"
                shadow="2xl"
              />
            )}
            
            {/* Details */}
            <VStack align="start" spacing={4} flex={1}>
              <Heading size="3xl" color="white">
                {details.title}
              </Heading>
              
              <HStack spacing={4}>
                {details.release_date && (
                  <Badge colorScheme="blue" fontSize="md" p={2}>
                    {new Date(details.release_date).getFullYear()}
                  </Badge>
                )}
                {details.vote_average && (
                  <Badge colorScheme="yellow" fontSize="md" p={2}>
                    ⭐ {details.vote_average.toFixed(1)}
                  </Badge>
                )}
                {details.runtime && (
                  <Badge colorScheme="gray" fontSize="md" p={2}>
                    {Math.floor(details.runtime / 60)}h {details.runtime % 60}m
                  </Badge>
                )}
              </HStack>
              
              <Text color="white" fontSize="lg" maxW="600px">
                {details.overview}
              </Text>
              
              <HStack spacing={4}>
                <Button
                  colorScheme="red"
                  size="lg"
                  onClick={handleWatchNow}
                  isLoading={loadingStreams}
                >
                  ▶ Watch Now
                </Button>
                <Button
                  variant="outline"
                  colorScheme="whiteAlpha"
                  size="lg"
                  onClick={handleFindStreams}
                  isLoading={loadingStreams}
                  loadingText="Finding Streams..."
                >
                  🔍 Find Streams
                </Button>
                <Button
                  variant="ghost"
                  colorScheme="whiteAlpha"
                  size="lg"
                  onClick={() => navigate('/')}
                >
                  ← Back
                </Button>
              </HStack>
            </VStack>
          </HStack>
        </Box>
      </Box>
      
      {/* Additional Details */}
      <Box p={8}>
        <VStack spacing={6} align="stretch">
          {/* Genres */}
          {details.genres && details.genres.length > 0 && (
            <Box>
              <Heading size="md" color="white" mb={4}>
                Genres
              </Heading>
              <HStack spacing={2} flexWrap="wrap">
                {details.genres.map((genre) => (
                  <Badge key={genre.id} colorScheme="red" p={2}>
                    {genre.name}
                  </Badge>
                ))}
              </HStack>
            </Box>
          )}
          
          {/* Cast */}
          {details.credits?.cast && details.credits.cast.length > 0 && (
            <Box>
              <Heading size="md" color="white" mb={4}>
                Cast
              </Heading>
              <HStack spacing={2} flexWrap="wrap">
                {details.credits.cast.slice(0, 10).map((actor: any) => (
                  <Badge key={actor.id} colorScheme="blue" p={2}>
                    {actor.name}
                  </Badge>
                ))}
              </HStack>
            </Box>
          )}
        </VStack>
      </Box>
      
      {/* Streams Modal */}
      <StreamsModal
        isOpen={isOpen}
        onClose={onClose}
        streams={streams}
        title={details.title}
      />
    </Box>
  )
}

export default NetflixDetails