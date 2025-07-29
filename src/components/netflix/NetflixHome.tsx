import React, { useEffect, useState } from 'react'
import {
  Box,
  VStack,
  Heading,
  HStack,
  Button,
  Text,
  Image,
  SimpleGrid,
  Spinner,
  Alert,
  AlertIcon,
  useToast,
  Switch,
  FormControl,
  FormLabel
} from '@chakra-ui/react'
import { useNetflixApi, useNetflixGenreCatalogs } from '../../hooks/useNetflixApi'
import { TMDBMovie } from '../../services/NetflixApiClient'
import { useNavigate } from 'react-router-dom'

// Netflix Clone Home Component
// Implements the same UI structure as the original Netflix clone

interface MovieCardProps {
  movie: TMDBMovie
  onClick: () => void
  showMetadata?: boolean
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, onClick, showMetadata = true }) => {
  const [imageError, setImageError] = useState(false)
  
  const posterUrl = movie.poster_path || movie.backdrop_path
  const imageUrl = posterUrl && showMetadata ? `https://image.tmdb.org/t/p/w500${posterUrl}` : null

  if (!imageUrl || imageError || !showMetadata) {
    return (
      <Box
        w="160px"
        h="240px"
        bg="gray.700"
        borderRadius="lg"
        display="flex"
        alignItems="center"
        justifyContent="center"
        cursor="pointer"
        onClick={onClick}
        _hover={{ transform: 'scale(1.05)', transition: 'transform 0.2s' }}
        flexShrink={0}
      >
        <Text color="white" textAlign="center" p={4} fontSize="sm">
          {movie.title}
        </Text>
      </Box>
    )
  }

  return (
    <Box
      w="160px"
      cursor="pointer"
      onClick={onClick}
      _hover={{ transform: 'scale(1.05)', transition: 'transform 0.2s' }}
      flexShrink={0}
    >
      <Image
        src={imageUrl}
        alt={movie.title}
        w="160px"
        h="240px"
        objectFit="cover"
        borderRadius="lg"
        onError={() => setImageError(true)}
      />
      {showMetadata && (
        <Text
          color="white"
          fontSize="xs"
          mt={2}
          textAlign="center"
          noOfLines={2}
        >
          {movie.title}
        </Text>
      )}
    </Box>
  )
}

interface MovieRowProps {
  title: string
  movies: TMDBMovie[]
  onMovieClick: (movie: TMDBMovie) => void
  showMetadata?: boolean
}

const MovieRow: React.FC<MovieRowProps> = ({ title, movies, onMovieClick, showMetadata = true }) => {
  if (!movies || movies.length === 0) {
    return null
  }

  return (
    <Box mb={6}>
      <Heading size="md" color="white" mb={3}>
        {title}
      </Heading>
      <HStack
        spacing={3}
        overflowX="auto"
        pb={4}
        css={{
          '&::-webkit-scrollbar': {
            height: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '3px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(255, 255, 255, 0.3)',
            borderRadius: '3px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: 'rgba(255, 255, 255, 0.5)',
          },
        }}
      >
        {movies.map((movie) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            onClick={() => onMovieClick(movie)}
            showMetadata={showMetadata}
          />
        ))}
      </HStack>
    </Box>
  )
}

interface FeaturedMovieProps {
  movie: TMDBMovie
  onWatchClick: () => void
  onFindStreamsClick: () => void
  showMetadata?: boolean
}

const FeaturedMovie: React.FC<FeaturedMovieProps> = ({ movie, onWatchClick, onFindStreamsClick, showMetadata = true }) => {
  const backdropUrl = movie.backdrop_path && showMetadata
    ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
    : null

  return (
    <Box
      position="relative"
      h="400px"
      w="100%"
      mb={6}
      borderRadius="xl"
      overflow="hidden"
      backgroundImage={backdropUrl ? `url(${backdropUrl})` : 'none'}
      backgroundSize="cover"
      backgroundPosition="center"
      bg={!backdropUrl ? 'gray.700' : 'transparent'}
    >
      {/* Overlay */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg="linear-gradient(to right, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.8) 100%)"
      />
      
      {/* Content */}
      <Box
        position="absolute"
        bottom={0}
        left={0}
        p={8}
        maxW="50%"
        zIndex={1}
      >
        <Heading size={showMetadata ? "2xl" : "xl"} color="white" mb={4}>
          {movie.title}
        </Heading>
        {showMetadata && (
          <Text color="white" fontSize="lg" mb={6} noOfLines={3}>
            {movie.overview}
          </Text>
        )}
        <HStack spacing={4}>
          <Button
            colorScheme="red"
            size="lg"
            onClick={onWatchClick}
          >
            ▶ Watch Now
          </Button>
          <Button
            variant="outline"
            colorScheme="whiteAlpha"
            size="lg"
            onClick={onFindStreamsClick}
          >
            Find Streams
          </Button>
        </HStack>
      </Box>
    </Box>
  )
}

const NetflixHome: React.FC = () => {
  const navigate = useNavigate()
  const toast = useToast()
  
  const {
    loading,
    error,
    genres,
    moviesByGenre,
    trendingMovies,
    popularMovies,
    topRatedTV,
    fetchTrendingMovies,
    fetchPopularMovies,
    fetchTopRatedTV,
    fetchMoviesByGenre,
    findStreams,
    clearError
  } = useNetflixApi()
  
  const { catalogs } = useNetflixGenreCatalogs()
  const [featuredMovie, setFeaturedMovie] = useState<TMDBMovie | null>(null)
  const [tmdbMetadataEnabled, setTmdbMetadataEnabled] = useState(true)

  // Fetch initial data (Netflix Clone behavior)
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await Promise.all([
          fetchTrendingMovies(),
          fetchPopularMovies(),
          fetchTopRatedTV()
        ])
        
        // Fetch movies for first few genres
        if (genres.length > 0) {
          const genrePromises = genres.slice(0, 8).map(genre => 
            fetchMoviesByGenre(genre.id)
          )
          await Promise.all(genrePromises)
        }
      } catch (err) {
        console.error('Failed to load initial data:', err)
      }
    }

    loadInitialData()
  }, [genres, fetchTrendingMovies, fetchPopularMovies, fetchTopRatedTV, fetchMoviesByGenre])

  // Set featured movie from trending movies
  useEffect(() => {
    if (trendingMovies.length > 0 && !featuredMovie) {
      setFeaturedMovie(trendingMovies[0])
    }
  }, [trendingMovies, featuredMovie])

  const handleMovieClick = (movie: TMDBMovie) => {
    // Navigate to Netflix movie details page
    const movieType = movie.title ? 'movie' : 'tv'
    navigate(`/netflix/${movieType}/${movie.id}`)
  }

  const handleFindStreams = async (movie: TMDBMovie) => {
    try {
      // Use the movie ID directly - backend will handle TMDB to IMDB conversion
      const streams = await findStreams('movie', movie.id.toString())
      
      if (streams.length > 0) {
        toast({
          title: 'Streams Found',
          description: `Found ${streams.length} stream(s) for ${movie.title}`,
          status: 'success',
          duration: 3000,
          isClosable: true
        })
        
        // Navigate to Netflix details page with streams
        const movieType = movie.title ? 'movie' : 'tv'
        navigate(`/netflix/${movieType}/${movie.id}`, { state: { streams } })
      } else {
        toast({
          title: 'No Streams Found',
          description: `No streams available for ${movie.title}`,
          status: 'warning',
          duration: 3000,
          isClosable: true
        })
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to find streams',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
    }
  }

  if (loading && genres.length === 0) {
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
          <Text color="white">Loading Netflix Clone...</Text>
        </VStack>
      </Box>
    )
  }

  return (
    <Box bg="black" minH="100vh" p={6}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <HStack justify="space-between" align="center">
          <Heading size="xl" color="green.400">
            CRUMBLE
          </Heading>
          <HStack spacing={6}>
            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="tmdb-toggle" mb="0" color="white" fontSize="sm">
                TMDB Metadata
              </FormLabel>
              <Switch
                id="tmdb-toggle"
                colorScheme="green"
                isChecked={tmdbMetadataEnabled}
                onChange={(e) => setTmdbMetadataEnabled(e.target.checked)}
              />
            </FormControl>
            <Text color="white" fontSize="sm">
              Netflix Clone Protocol Active
            </Text>
          </HStack>
        </HStack>

        {/* Error Display */}
        {error && (
          <Alert status="error" bg="red.900" color="white">
            <AlertIcon />
            {error}
            <Button ml={4} size="sm" onClick={clearError}>
              Dismiss
            </Button>
          </Alert>
        )}

        {/* Featured Movie */}
        {featuredMovie && (
          <FeaturedMovie
            movie={featuredMovie}
            onWatchClick={() => handleMovieClick(featuredMovie)}
            onFindStreamsClick={() => handleFindStreams(featuredMovie)}
            showMetadata={tmdbMetadataEnabled}
          />
        )}

        {/* Movie Rows - Netflix Clone Style */}
        
        {/* Trending Movies */}
        <MovieRow
          title="Trending Movies"
          movies={trendingMovies}
          onMovieClick={handleMovieClick}
          showMetadata={tmdbMetadataEnabled}
        />
        
        {/* Popular Movies */}
        <MovieRow
          title="Popular Movies"
          movies={popularMovies}
          onMovieClick={handleMovieClick}
          showMetadata={tmdbMetadataEnabled}
        />
        
        {/* Top Rated TV Shows */}
        <MovieRow
          title="Top Rated TV Shows"
          movies={topRatedTV}
          onMovieClick={handleMovieClick}
          showMetadata={tmdbMetadataEnabled}
        />

        {/* Genre-based Catalogs (Netflix Clone Protocol) */}
        {genres.map((genre) => {
          const genreMovies = moviesByGenre[genre.id]
          if (!genreMovies || genreMovies.length === 0) return null
          
          return (
            <MovieRow
              key={genre.id}
              title={`${genre.name} Movies`}
              movies={genreMovies}
              onMovieClick={handleMovieClick}
              showMetadata={tmdbMetadataEnabled}
            />
          )
        })}

        {/* Loading indicator for additional content */}
        {loading && (
          <Box display="flex" justifyContent="center" py={8}>
            <Spinner color="red.500" />
          </Box>
        )}
      </VStack>
    </Box>
  )
}

export default NetflixHome