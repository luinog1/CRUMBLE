import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  Image,
  Button,
  Badge,
  HStack,
  VStack,
  Spinner,
  useToast,
  Divider,
  SimpleGrid,
  Icon,
} from '@chakra-ui/react'
import { FiPlay, FiPlus, FiStar, FiCalendar, FiFilm, FiInfo } from 'react-icons/fi'
import { useAddonSystem } from '@hooks/useAddonSystem'
import { usePlayer } from '@hooks/usePlayer'
import { useLibrary } from '@hooks/useLibrary'
import { useTMDB } from '@hooks/useTMDB'
import { apiClient } from '@/services/ApiClient'

interface Stream {
  url: string
  title?: string
  quality?: string
  type?: 'hls' | 'dash' | 'mp4'
}

interface MediaDetails {
  id: string
  title: string
  overview?: string
  poster?: string
  backdrop?: string
  year?: number
  rating?: number
  genres?: string[]
  cast?: string[]
  streams?: Stream[]
  streamScraperAddons?: string[]
}

const DetailsPage = () => {
  const { type, id } = useParams<{ type: string; id: string }>()
  const [details, setDetails] = useState<MediaDetails | null>(null)
  const [streams, setStreams] = useState<Stream[]>([])
  const [loading, setLoading] = useState(true)
  const [streamLoading, setStreamLoading] = useState(false)
  const { addons, getCatalogItems } = useAddonSystem()
  const { playVideo } = usePlayer()
  const { addToLibrary } = useLibrary()
  const { getDetails, enrichMetadata } = useTMDB()
  const toast = useToast()

  useEffect(() => {
    const fetchDetails = async () => {
      if (!type || !id) return

      setLoading(true)
      try {
        // Check for TMDB API key
        const tmdbApiKey = useTMDB.getState().apiKey
        let mediaDetails: MediaDetails = {
          id,
          title: 'Unknown Title',
        }

        // Try to get details from TMDB
        if ((id.startsWith('tmdb-') || id.startsWith('tt')) && tmdbApiKey) {
          const tmdbId = id.startsWith('tmdb-') ? id.replace('tmdb-', '').split('-')[1] : id
          const tmdbType = type === 'movie' ? 'movie' : 'tv'
          const tmdbDetails = await getDetails(tmdbId, tmdbType)

          if (tmdbDetails) {
            mediaDetails = {
              id,
              title: tmdbDetails.title || tmdbDetails.name || 'Unknown Title',
              overview: tmdbDetails.overview,
              poster: tmdbDetails.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbDetails.poster_path}` : undefined,
              backdrop: tmdbDetails.backdrop_path ? `https://image.tmdb.org/t/p/original${tmdbDetails.backdrop_path}` : undefined,
              year: tmdbDetails.release_date ? new Date(tmdbDetails.release_date).getFullYear() :
                tmdbDetails.first_air_date ? new Date(tmdbDetails.first_air_date).getFullYear() : undefined,
              rating: tmdbDetails.vote_average,
              genres: tmdbDetails.genres?.map(g => g.name),
              cast: tmdbDetails.credits?.cast?.slice(0, 10).map(c => c.name),
            }
          }
        } else if (!tmdbApiKey && (id.startsWith('tmdb-') || id.startsWith('tt'))) {
          toast({
            title: 'TMDB API Key Missing',
            description: 'Please set your TMDB API key in settings to fetch media details.',
            status: 'warning',
            duration: 5000,
            isClosable: true,
          })
        } else {
          // Try to get details from addons
          const items = await getCatalogItems(type, 'catalog', { id })
          if (items && items.length > 0) {
            const item = items[0]
            mediaDetails = {
              id: item.id,
              title: item.title,
              poster: item.poster,
              year: item.year,
              rating: item.rating,
            }
          }
        }

        setDetails(mediaDetails)
      } catch (error) {
        console.error('Error fetching details:', error)
        toast({
          title: 'Error fetching details',
          status: 'error',
          duration: 3000,
          isClosable: true,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchDetails()
  }, [type, id, getDetails, getCatalogItems, toast])

  const fetchStreams = async () => {
    if (!type || !id || !details) return

    setStreamLoading(true)
    try {
      // Check each addon for streams
      const allStreams: Stream[] = []
      
      // Get all addons that provide streams
      let streamAddons = addons.filter(addon => {
        // Check if addon URL contains known stream scraper patterns
        const isStreamScraper = addon.baseUrl && (
          addon.baseUrl.includes('torrentio') ||
          addon.baseUrl.includes('stream') ||
          addon.baseUrl.includes('watch') ||
          addon.baseUrl.includes('movie') ||
          addon.baseUrl.includes('series') ||
          addon.baseUrl.includes('play')
        );

        // Check if addon name suggests it's a stream provider
        const isStreamProvider = addon.name && (
          addon.name.toLowerCase().includes('stream') ||
          addon.name.toLowerCase().includes('torrent') ||
          addon.name.toLowerCase().includes('watch') ||
          addon.name.toLowerCase().includes('play')
        );

        // Check resources array for stream support
        const hasStreamResource = Array.isArray(addon.resources) && 
          (addon.resources.includes('stream') || 
           addon.resources.some((r: any) => 
             (typeof r === 'object' && r.name === 'stream') || 
             r === 'stream'
           ));

        return hasStreamResource || isStreamScraper || isStreamProvider;
      })
      
      // Add Torrentio addon if not already present
      const torrentioUrl = 'https://torrentio.strem.fun/manifest.json';
      const hasTorrentio = streamAddons.some(addon => addon.baseUrl?.includes('torrentio'));
      if (!hasTorrentio) {
        try {
          await useAddonSystem.getState().addAddon(torrentioUrl);
          const torrentioAddon = useAddonSystem.getState().addons.find(addon => addon.baseUrl?.includes('torrentio'));
          if (torrentioAddon) {
            streamAddons.push(torrentioAddon);
          }
        } catch (error) {
          console.error('Failed to add Torrentio addon:', error);
        }
      }
      
      console.log('Available stream addons:', streamAddons.map(a => a.name));

      for (const addon of streamAddons) {
        // Log the addon being processed
        console.log(`Processing stream addon: ${addon.name}`)
        
        // Validate addon has required properties
        if (!addon.baseUrl) {
          console.log(`Addon ${addon.name} has no baseUrl, skipping`)
          continue
        }
        
        // Check if addon supports streaming
        const hasStreamSupport = Array.isArray(addon.resources) && 
          (addon.resources.includes('stream') || 
           addon.resources.some((r: string) => r === 'stream'));
           
        if (!hasStreamSupport) {
          console.log(`Addon ${addon.name} does not support streaming, skipping`)
          continue
        }

        try {
          const baseUrl = addon.baseUrl
          if (!baseUrl) {
            console.log(`Addon ${addon.name} has no baseUrl, skipping`)
            continue
          }

          // Build URL according to Stremio protocol
          // Make sure the ID is in the correct format for Stremio
          let streamId = id
          
          // If the ID has a prefix like 'tmdb-', extract just the IMDB ID part if possible
          if (id.includes('tmdb-')) {
            // Try to extract IMDB ID (tt followed by numbers)
            const imdbMatch = id.match(/tt\d+/)
            if (imdbMatch) {
              streamId = imdbMatch[0]
              console.log(`Extracted IMDB ID from ${id}: ${streamId}`)
            }
          }
          
          // Build URL according to addon type
          let url;
          if (baseUrl.includes('torrentio')) {
            // Special handling for Torrentio-like addons
            url = `${baseUrl}/stream/${type}/${streamId}.json`;
          } else {
            // Try both standard Stremio format and alternative formats
            const urls = [
              `${baseUrl}/stream/${type}/${streamId}.json`,
              `${baseUrl}/stream/${type}/${streamId}`,
              `${baseUrl}/streams/${type}/${streamId}`,
              `${baseUrl}/api/stream/${type}/${streamId}`
            ];
            
            // Try each URL format until we get a successful response
            for (const testUrl of urls) {
              try {
                const testResponse = await fetch(testUrl);
                if (testResponse.ok) {
                  url = testUrl;
                  break;
                }
              } catch (e) {
                console.log(`Failed to fetch from ${testUrl}:`, e);
              }
            }
            
            if (!url) {
              console.log(`No working URL format found for ${addon.name}`);
              continue;
            }
          }
          
          console.log(`Fetching streams from: ${url}`)

          const response = await fetch(url)
          console.log(`Response status for ${addon.name}:`, response.status)
          if (!response.ok) {
            console.log(`Response not OK for ${addon.name}:`, response.status, response.statusText)
            continue
          }

          let data
          try {
            data = await response.json()
            console.log(`Stream data from ${addon.name}:`, data)
          } catch (e) {
            console.error(`Error parsing JSON from ${addon.name}:`, e)
            continue
          }
          
          // Handle different response formats
          let addonStreams = [];
          
          // Function to validate if an object looks like a stream
          const isValidStream = (obj: any) => {
            if (!obj) return false;
            
            // Check for common stream properties
            const hasStreamProps = [
              'url',
              'externalUrl',
              'infoHash',
              'magnetUri',
              'torrent',
              'file',
              'link',
              'src',
              'stream_link'
            ].some(prop => obj[prop]);
            
            // Check if it's a magnet link or video URL
            if (typeof obj === 'string') {
              return obj.startsWith('magnet:') || 
                     obj.match(/\.(mp4|m3u8|mpd|mkv|avi|webm)($|\?)/i) ||
                     obj.includes('stream') ||
                     obj.includes('video');
            }
            
            return hasStreamProps;
          };
          
          // Function to extract streams from nested objects
          const extractStreams = (obj: any): any[] => {
            if (!obj) return [];
            
            if (Array.isArray(obj)) {
              return obj.filter(isValidStream);
            }
            
            if (typeof obj === 'object') {
              // Check common stream array properties
              const streamArrayProps = ['streams', 'stream', 'links', 'sources', 'videos', 'files'];
              for (const prop of streamArrayProps) {
                if (obj[prop]) {
                  const streams = Array.isArray(obj[prop]) ? obj[prop] : [obj[prop]];
                  if (streams.some(isValidStream)) {
                    return streams.filter(isValidStream);
                  }
                }
              }
              
              // Recursively search for streams in nested objects
              const nestedStreams = Object.values(obj)
                .flatMap(val => extractStreams(val))
                .filter(isValidStream);
              
              if (nestedStreams.length > 0) {
                return nestedStreams;
              }
            }
            
            return [];
          };
          
          // Extract streams from the response data
          addonStreams = extractStreams(data);
          
          // If no streams found but data itself looks like a stream, use it
          if (addonStreams.length === 0 && isValidStream(data)) {
            addonStreams = [data];
          }
          
          console.log(`Found ${addonStreams.length} streams from ${addon.name}`)

          // Process and normalize stream objects
          const processedStreams = addonStreams.map((stream: any) => {
            console.log('Processing stream:', stream)
            // Extract URL from stream using a helper function
            const extractStreamUrl = (stream: any): string => {
              // Direct URL properties
              const urlProps = ['url', 'externalUrl', 'file', 'link', 'src', 'stream_link'];
              for (const prop of urlProps) {
                if (typeof stream[prop] === 'string') return stream[prop];
                if (typeof stream[prop]?.url === 'string') return stream[prop].url;
              }
              
              // Handle sources array
              if (stream.sources?.length > 0) {
                const source = stream.sources[0];
                if (typeof source === 'string') return source;
                if (source?.url) return source.url;
                if (source?.file) return source.file;
              }
              
              // Handle torrent/magnet properties
              if (stream.magnetUri) return stream.magnetUri;
              if (stream.torrent) return stream.torrent;
              if (stream.infoHash) {
                let magnet = `magnet:?xt=urn:btih:${stream.infoHash}`;
                if (stream.title) magnet += `&dn=${encodeURIComponent(stream.title)}`;
                return magnet;
              }
              
              // Handle torrent streams with infoHash
              if (stream.infoHash) {
                let magnet = `magnet:?xt=urn:btih:${stream.infoHash}`;
                
                if (stream.fileIdx !== undefined) {
                  magnet += `&fileIdx=${stream.fileIdx}`;
                }
                
                if (stream.name && typeof stream.name === 'string') {
                  magnet += `&dn=${encodeURIComponent(stream.name)}`;
                } else {
                  magnet += `&dn=${encodeURIComponent('Stream')}`;
                }
                
                if (Array.isArray(stream.trackers) && stream.trackers.length > 0) {
                  stream.trackers.forEach((tracker: string) => {
                    if (typeof tracker === 'string') {
                      magnet += `&tr=${encodeURIComponent(tracker)}`;
                    }
                  });
                } else {
                  // Default trackers if none provided
                  const defaultTrackers = [
                    'udp://tracker.opentrackr.org:1337/announce',
                    'udp://exodus.desync.com:6969/announce',
                    'udp://tracker.torrent.eu.org:451/announce',
                    'udp://tracker.moeking.me:6969/announce',
                    'udp://open.stealth.si:80/announce',
                    'udp://explodie.org:6969/announce'
                  ];
                  defaultTrackers.forEach(tracker => {
                    magnet += `&tr=${encodeURIComponent(tracker)}`;
                  });
                }
                
                return magnet;
              }
              
              // If stream itself is a string, it might be a direct URL
              if (typeof stream === 'string') {
                return stream;
              }
              
              // If stream has a file property that's a string, it might be a URL
              if (typeof stream.file === 'string') {
                return stream.file;
              }
              
              // If stream has a link property that's a string, it might be a URL
              if (typeof stream.link === 'string') {
                return stream.link;
              }
              
              // If stream has a src property that's a string, it might be a URL
              if (typeof stream.src === 'string') {
                return stream.src;
              }
              
              // If stream has a stream_link property that's a string, it might be a URL
              if (typeof stream.stream_link === 'string') {
                return stream.stream_link;
              }
              
              // If stream has a magnetUri, use that directly
              if (typeof stream.magnetUri === 'string') {
                return stream.magnetUri;
              }
              
              // If stream has a torrent property that's a string, it might be a magnet link
              if (typeof stream.torrent === 'string') {
                return stream.torrent;
              }
              
              return '';
            };
            
            const normalizedStream: Stream = {
              url: extractStreamUrl(stream),
              title: stream.title || stream.name || 'Unknown Stream',
              quality: (() => {
                // Use stream.quality if available
                if (stream.quality) return stream.quality;
                
                // Helper function to detect quality from text
                const detectQualityFromText = (text: string) => {
                  if (!text) return null;
                  
                  const qualities = [];
                  
                  // Resolution
                  if (/\b(4k|2160p)\b/i.test(text)) qualities.push('4K');
                  else if (/\b(1080p)\b/i.test(text)) qualities.push('1080p');
                  else if (/\b(720p)\b/i.test(text)) qualities.push('720p');
                  else if (/\b(480p|sd)\b/i.test(text)) qualities.push('480p');
                  
                  // HDR/DV
                  if (/\b(dv|dolby\s*vision)\b/i.test(text)) qualities.push('DV');
                  if (/\bhdr\b/i.test(text)) qualities.push('HDR');
                  if (/\bhdr10\+?\b/i.test(text)) qualities.push('HDR10+');
                  
                  // Audio
                  if (/\b(dd\+?|dolby\s*digital)\b/i.test(text)) qualities.push('DD+');
                  if (/\b(dts|dts-hd)\b/i.test(text)) qualities.push('DTS-HD');
                  if (/\b(atmos)\b/i.test(text)) qualities.push('ATMOS');
                  
                  return qualities.length > 0 ? qualities.join(' | ') : null;
                };
                
                // Try to detect quality from title
                const titleQuality = detectQualityFromText(stream.title);
                if (titleQuality) return titleQuality;
                
                // Try to detect quality from name
                const nameQuality = detectQualityFromText(stream.name);
                if (nameQuality) return nameQuality;
                
                // Try to detect quality from URL
                const url = extractStreamUrl(stream);
                if (url) {
                  const urlQuality = detectQualityFromText(url);
                  if (urlQuality) return urlQuality;
                }
                
                // Default quality
                return 'Unknown';
              })(),
              type: (() => {
                // Use stream.type if available
                if (stream.type) return stream.type;
                
                // Get the URL from our helper function
                const url = extractStreamUrl(stream);
                
                // Detect type based on URL
                if (url.includes('.m3u8')) return 'hls';
                if (url.includes('.mpd')) return 'dash';
                if (url.includes('magnet:')) return 'torrent';
                
                // For torrent streams, set type to mp4
                if (stream.infoHash) return 'torrent';
                
                // Default to mp4 for other streams
                return 'mp4';
              })()
            }
            
            // Add addon name to title for identification
            normalizedStream.title = `${normalizedStream.title} (${addon.name})`
            
            console.log(`Processed stream from ${addon.name}:`, normalizedStream)
            return normalizedStream
          }).filter((stream: Stream) => stream.url && stream.url.length > 0) // Filter out streams without URLs

          allStreams.push(...processedStreams)
        } catch (error) {
          console.error(`Error fetching streams from ${addon.name}:`, error)
        }
      }

      // If no streams found, add a fallback stream for testing
      if (allStreams.length === 0) {
        allStreams.push({
          url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
          title: 'Test Stream (HLS)',
          quality: 'HD',
          type: 'hls',
        })
      }

      setStreams(allStreams)
    } catch (error) {
      console.error('Error fetching streams:', error)
      toast({
        title: 'Error fetching streams',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setStreamLoading(false)
    }
  }

  const handlePlayStream = (stream: Stream) => {
    if (!details) return

    playVideo({
      id: details.id,
      title: details.title,
      streamUrl: stream.url,
      type: stream.type || 'hls',
      poster: details.poster,
    })

    toast({
      title: `Playing: ${details.title}`,
      description: `Stream: ${stream.title || 'Unknown'}`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    })
  }

  const handleAddToLibrary = () => {
    if (!details || !type) return

    addToLibrary({
      id: details.id,
      type: type as 'movie' | 'series',
      addedAt: Date.now(),
      metadata: {
        title: details.title,
        poster: details.poster || '',
        year: details.year,
      },
    })

    toast({
      title: 'Added to library',
      description: `${details.title} has been added to your library`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    })
  }

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="80vh">
        <Spinner size="xl" color="brand.primary" />
      </Flex>
    )
  }

  if (!details) {
    return (
      <Container maxW="container.xl" py={8}>
        <Text>No details found for this content.</Text>
      </Container>
    )
  }

  return (
    <Box ml="80px">
      {/* Hero Section with Backdrop */}
      <Box
        position="relative"
        height="70vh"
        overflow="hidden"
      >
        {details.backdrop ? (
          <Image
            src={details.backdrop}
            alt={details.title}
            objectFit="cover"
            w="full"
            h="full"
          />
        ) : (
          <Box
            bg="background.secondary"
            w="full"
            h="full"
          />
        )}

        {/* Gradient Overlay */}
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="linear-gradient(0deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0.4) 100%)"
        />

        {/* Content */}
        <Container maxW="container.xl" position="relative" zIndex={1}>
          <Flex
            position="absolute"
            bottom={8}
            left={0}
            right={0}
            px={4}
            gap={8}
          >
            {/* Poster */}
            {details.poster && (
              <Image
                src={details.poster}
                alt={details.title}
                borderRadius="lg"
                boxShadow="dark-lg"
                maxH="400px"
                objectFit="cover"
              />
            )}

            {/* Details */}
            <VStack align="flex-start" spacing={4} maxW="2xl">
              <Heading as="h1" size="2xl" color="white">
                {details.title}
              </Heading>

              <HStack spacing={4}>
                {type && (
                  <Badge colorScheme={type === 'movie' ? 'blue' : 'purple'} fontSize="sm" px={2} py={1}>
                    {type.toUpperCase()}
                  </Badge>
                )}
                {details.year && (
                  <HStack spacing={1}>
                    <Icon as={FiCalendar} color="gray.300" />
                    <Text color="gray.300">{details.year}</Text>
                  </HStack>
                )}
                {details.rating && (
                  <HStack spacing={1}>
                    <Icon as={FiStar} color="yellow.400" />
                    <Text color="gray.300">{details.rating.toFixed(1)}</Text>
                  </HStack>
                )}
              </HStack>

              {details.overview && (
                <Text color="gray.300" fontSize="lg">
                  {details.overview}
                </Text>
              )}

              <HStack spacing={4} pt={4}>
                <Button
                  leftIcon={<FiPlay />}
                  colorScheme="blue"
                  size="lg"
                  onClick={fetchStreams}
                  isLoading={streamLoading}
                >
                  Find Streams
                </Button>
                <Button
                  leftIcon={<FiPlus />}
                  variant="outline"
                  size="lg"
                  onClick={handleAddToLibrary}
                >
                  Add to Library
                </Button>
              </HStack>
            </VStack>
          </Flex>
        </Container>
      </Box>

      {/* Streams Section */}
      <Container maxW="container.xl" py={8}>
        {streams.length > 0 && (
          <Box mt={8}>
            <Heading as="h2" size="lg" mb={4}>
              Available Streams
            </Heading>
            <VStack spacing={4} align="stretch" w="full">
              {streams.map((stream, index) => {
                // Extract file size from title or URL if available
                const sizeMatch = (stream.title || '').match(/\b(\d+(\.\d+)?\s*(GB|MB))\b/i) || 
                                 (stream.url || '').match(/\b(\d+(\.\d+)?\s*(GB|MB))\b/i);
                const fileSize = sizeMatch ? sizeMatch[1] : null;

                // Extract seeders/peers info if available
                const seedersMatch = (stream.title || '').match(/\b(\d+)x\b/i);
                const seeders = seedersMatch ? seedersMatch[1] : null;

                // Extract source info
                const sourceMatch = (stream.title || '').match(/\b(ThePirateBay|RARBG|1337x|YTS)\b/i);
                const source = sourceMatch ? sourceMatch[1] : null;

                return (
                  <Box
                    key={index}
                    p={4}
                    borderRadius="lg"
                    bg="background.secondary"
                    _hover={{ bg: 'background.tertiary' }}
                    transition="all 0.2s"
                    cursor="pointer"
                    onClick={() => handlePlayStream(stream)}
                    borderWidth="1px"
                    borderColor="whiteAlpha.200"
                  >
                    <HStack justify="space-between" align="center" spacing={4}>
                      <VStack align="flex-start" spacing={2} flex={1}>
                        <HStack spacing={3} align="center" width="full">
                          <Icon as={FiPlay} boxSize={5} color="blue.400" />
                          <Text fontWeight="bold" fontSize="lg" flex={1} color="white">
                            {stream.title?.split('(')[0] || 'Unknown Stream'}
                          </Text>
                          {fileSize && (
                            <Text color="gray.400" fontSize="sm">
                              {fileSize}
                            </Text>
                          )}
                        </HStack>
                        <HStack spacing={3} wrap="wrap">
                          {stream.quality && (
                            <Badge colorScheme="blue" variant="solid" fontSize="sm" px={2} py={1}>
                              {stream.quality}
                            </Badge>
                          )}
                          {stream.type && (
                            <Badge colorScheme="green" variant="solid" fontSize="sm" px={2} py={1}>
                              {stream.type.toUpperCase()}
                            </Badge>
                          )}
                          {stream.url && (
                            <Badge colorScheme="orange" variant="solid" fontSize="sm" px={2} py={1}>
                              {stream.url.startsWith('magnet:') ? 'TORRENT' : 'DIRECT'}
                            </Badge>
                          )}
                          {seeders && (
                            <Badge colorScheme="green" variant="solid" fontSize="sm" px={2} py={1}>
                              {seeders} SEEDS
                            </Badge>
                          )}
                          {source && (
                            <Badge colorScheme="purple" variant="solid" fontSize="sm" px={2} py={1}>
                              {source}
                            </Badge>
                          )}
                        </HStack>
                      </VStack>
                    </HStack>
                  </Box>
                );
              })}
            </VStack>
          </Box>
        )}

        {/* Additional Details */}
        {(details.genres || details.cast) && (
          <Box mt={12}>
            <Divider mb={8} />
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
              {details.genres && details.genres.length > 0 && (
                <Box>
                  <Heading as="h3" size="md" mb={4}>
                    <HStack>
                      <Icon as={FiFilm} />
                      <Text>Genres</Text>
                    </HStack>
                  </Heading>
                  <HStack spacing={2} flexWrap="wrap">
                    {details.genres.map((genre, index) => (
                      <Badge key={index} m={1}>
                        {genre}
                      </Badge>
                    ))}
                  </HStack>
                </Box>
              )}

              {details.cast && details.cast.length > 0 && (
                <Box>
                  <Heading as="h3" size="md" mb={4}>
                    <HStack>
                      <Icon as={FiInfo} />
                      <Text>Cast</Text>
                    </HStack>
                  </Heading>
                  <HStack spacing={2} flexWrap="wrap">
                    {details.cast.map((person, index) => (
                      <Badge key={index} variant="outline" m={1}>
                        {person}
                      </Badge>
                    ))}
                  </HStack>
                </Box>
              )}
            </SimpleGrid>
          </Box>
        )}
      </Container>
    </Box>
  )
}

export default DetailsPage