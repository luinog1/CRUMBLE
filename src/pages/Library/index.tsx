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

const MotionGrid = motion(Grid)
const MotionBox = motion(Box)

const Library = () => {
  const { library, progress, removeFromLibrary, getContinueWatching } = useProgress()
  const { playVideo } = usePlayer()
  const columns = useBreakpointValue({ base: 2, md: 3, lg: 4, xl: 5 })

  const continueWatching = getContinueWatching()
  const watchlist = library.filter(item => !progress[item.id])
  const completed = library.filter(item => progress[item.id]?.completed)

  const formatProgress = (current: number, total: number) => {
    const percent = (current / total) * 100
    return `${Math.round(percent)}%`
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m remaining`
    }
    return `${minutes}m remaining`
  }

  return (
    <Box p={8}>
      <VStack spacing={8} align="stretch" maxW="6xl" mx="auto">
        {continueWatching.length > 0 && (
          <Box>
            <Heading size="lg" mb={4}>
              Continue Watching
            </Heading>
            <Grid templateColumns={`repeat(${columns}, 1fr)`} gap={6}>
              {continueWatching.map((item) => (
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
                      type={item.type}
                      year={item.metadata.year}
                      onClick={() => playVideo(item.id)}
                    />
                    <Box position="absolute" bottom={0} left={0} right={0} px={2} pb={2}>
                      <HStack justify="space-between" mb={1}>
                        <Text fontSize="sm">
                          {formatTime(
                            progress[item.id].duration - progress[item.id].position
                          )}
                        </Text>
                        <HStack>
                          <IconButton
                            aria-label="Play"
                            icon={<FiPlay />}
                            size="sm"
                            onClick={() => playVideo(item.id)}
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
                          (progress[item.id].position / progress[item.id].duration) * 100
                        }
                        size="xs"
                        colorScheme="brand"
                        borderRadius="full"
                      />
                    </Box>
                  </Box>
                </MotionBox>
              ))}
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
                  templateColumns={`repeat(${columns}, 1fr)`}
                  gap={6}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {watchlist.map((item) => (
                    <MediaCard
                      key={item.id}
                      id={item.id}
                      title={item.metadata.title}
                      poster={item.metadata.poster}
                      type={item.type}
                      year={item.metadata.year}
                      onClick={() => playVideo(item.id)}
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
                  templateColumns={`repeat(${columns}, 1fr)`}
                  gap={6}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {completed.map((item) => (
                    <MediaCard
                      key={item.id}
                      id={item.id}
                      title={item.metadata.title}
                      poster={item.metadata.poster}
                      type={item.type}
                      year={item.metadata.year}
                      onClick={() => playVideo(item.id)}
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