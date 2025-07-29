import {
  Box,
  VStack,
  Heading,
  Grid,
  Text,
  Progress,
  HStack,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useBreakpointValue,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel
} from '@chakra-ui/react'
import { FiMoreVertical, FiTrash2, FiPlay } from 'react-icons/fi'
import { motion } from 'framer-motion'
import MediaCard from '@components/catalog/MediaCard'
import { useProgress } from '@hooks/useProgress'
import { usePlayer } from '@hooks/usePlayer'
import type { LibraryItem, WatchProgress } from '@/types'

const MotionGrid = motion(Grid) as typeof motion.div as typeof motion.div
const MotionBox = motion(Box) as typeof motion.div

const Library = () => {
  const { library, progress, removeFromLibrary, getContinueWatching } = useProgress()
  const { playVideo: _ } = usePlayer()
  const columns = useBreakpointValue({ base: 2, md: 3, lg: 4, xl: 5 }) ?? 4

  const continueWatching = getContinueWatching()
  const watchlist = library.filter((item: LibraryItem) => !progress[item.id])
  const completed = library.filter((item: LibraryItem) => progress[item.id]?.completed)

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m remaining`
    }
    return `${minutes}m remaining`
  }

  return (
    <Box p={8} ml="80px">
      <VStack spacing={8} align="stretch" maxW="6xl" mx="auto">
        {continueWatching.length > 0 && (
          <Box>
            <Heading size="lg" mb={4}>
              Continue Watching
            </Heading>
            <Grid style={{ gap: '1.5rem', gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {continueWatching.map((item: LibraryItem) => {
                const itemProgress = progress[item.id] as WatchProgress
                return (
                  <MotionBox
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Box position="relative">
                      <MediaCard
                        id={item.id}
                        title={item.metadata.title}
                        poster={item.metadata.poster}
                        type={item.type as 'movie' | 'series'}
                        year={item.metadata.year}

                      />
                      <Box position="absolute" bottom={0} left={0} right={0} px={2} pb={2}>
                        <HStack justify="space-between" mb={1}>
                          <Text fontSize="sm">
                            {formatTime(
                              itemProgress.duration - itemProgress.position
                            )}
                          </Text>
                          <HStack>
                            <IconButton
                              aria-label="Play"
                              icon={<FiPlay />}
                              size="sm"
        
                            />
                            <Menu>
                              <MenuButton
                                as={IconButton}
                                aria-label="Options"
                                icon={<FiMoreVertical />}
                                size="sm"
                                variant="ghost"
                              />
                              <MenuList bg="background.secondary">
                                <MenuItem
                                  icon={<FiTrash2 />}
                                  onClick={() => removeFromLibrary(item.id)}
                                >
                                  Remove from Library
                                </MenuItem>
                              </MenuList>
                            </Menu>
                          </HStack>
                        </HStack>
                        <Progress
                          value={
                            (itemProgress.position / itemProgress.duration) * 100
                          }
                          size="xs"
                          colorScheme="brand"
                          borderRadius="full"
                        />
                      </Box>
                    </Box>
                  </MotionBox>
                )
              })}
            </Grid>
          </Box>
        )}

        <Tabs variant="soft-rounded" colorScheme="brand">
          <TabList mb={4}>
            <Tab>Watchlist ({watchlist.length})</Tab>
            <Tab>Completed ({completed.length})</Tab>
          </TabList>

          <TabPanels>
            <TabPanel px={0}>
              {watchlist.length > 0 ? (
                <MotionGrid
                  style={{ gap: '1.5rem', gridTemplateColumns: `repeat(${columns}, 1fr)` }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {watchlist.map((item: LibraryItem) => (
                    <MediaCard
                      key={item.id}
                      id={item.id}
                      title={item.metadata.title}
                      poster={item.metadata.poster}
                      type={item.type as 'movie' | 'series'}
                      year={item.metadata.year}
                      
                    />
                  ))}
                </MotionGrid>
              ) : (
                <Text color="whiteAlpha.700" textAlign="center" py={8}>
                  Your watchlist is empty
                </Text>
              )}
            </TabPanel>

            <TabPanel px={0}>
              {completed.length > 0 ? (
                <MotionGrid
                  style={{ gap: '1.5rem', gridTemplateColumns: `repeat(${columns}, 1fr)` }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {completed.map((item: LibraryItem) => (
                    <MediaCard
                      key={item.id}
                      id={item.id}
                      title={item.metadata.title}
                      poster={item.metadata.poster}
                      type={item.type as 'movie' | 'series'}
                      year={item.metadata.year}

                    />
                  ))}
                </MotionGrid>
              ) : (
                <Text color="whiteAlpha.700" textAlign="center" py={8}>
                  You haven't completed any titles yet
                </Text>
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Box>
  )
}

export default Library