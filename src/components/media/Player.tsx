import { useEffect, useRef, useState } from 'react'
import {
  Box,
  IconButton,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  HStack,
  Text,
  Flex,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react'
import {
  FiPlay,
  FiPause,
  FiVolume2,
  FiVolumeX,
  FiMaximize,
  FiSettings,
} from 'react-icons/fi'
import Hls from 'hls.js'
import { usePlayer } from '@hooks/usePlayer'
import { useProgress } from '@hooks/useProgress'


type VideoQuality = 'auto' | '1080p' | '720p'

const Player = () => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const { currentVideo, playerConfig, setPlayerConfig } = usePlayer()
  const { updateProgress } = useProgress()

  useEffect(() => {
    if (!currentVideo?.url || !videoRef.current) return

    const video = videoRef.current

    const setupHls = () => {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      })
      hls.loadSource(currentVideo.url)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        void video.play()
      })

      return () => {
        hls.destroy()
      }
    }

    const cleanup = () => {
      video.removeAttribute('src')
      video.load()
    }

    if (currentVideo.url.includes('.m3u8')) {
      if (Hls.isSupported()) {
        return setupHls()
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = currentVideo.url
        video.addEventListener('loadedmetadata', () => {
          void video.play()
        })
      }
    } else {
      video.src = currentVideo.url
      video.load()
      void video.play()
    }

    if (window.matchMedia('(dynamic-range: high)').matches) {
      video.setAttribute('type', 'video/mp4; codecs=hevc.1.6.L93.B0; eotf=smpte2084')
    }

    return cleanup
  }, [currentVideo])

  useEffect(() => {
    if (!videoRef.current) return

    const video = videoRef.current
    video.volume = volume
    video.muted = isMuted
  }, [volume, isMuted])

  const handleTimeUpdate = () => {
    if (!videoRef.current || !currentVideo) return

    const video = videoRef.current
    setCurrentTime(video.currentTime)
    // Note: We need videoId and type from somewhere else since Stream doesn't have these properties
    // This would typically come from the video metadata or be passed as props
    updateProgress({
      id: currentVideo.title || 'unknown',
      type: currentVideo.type || 'movie',
      position: video.currentTime,
      duration: video.duration,
      lastWatched: Date.now(),
      completed: video.currentTime >= video.duration - 5
    })
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleQualityChange = (quality: VideoQuality) => {
    setPlayerConfig({
      ...playerConfig,
      options: {
        ...playerConfig.options,
        quality: {
          ...playerConfig.options?.quality,
          default: quality
        }
      }
    })
  }

  if (!currentVideo) return null

  return (
    <Box position="fixed" bottom={0} left={0} right={0} bg="background.primary" zIndex="modal">
      <Box position="relative" w="full" h="full">
        <video
          ref={videoRef}
          style={{ width: '100%', height: '100%' }}
          onTimeUpdate={handleTimeUpdate}
          onDurationChange={(e) => setDuration(e.currentTarget.duration)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />

        <Flex
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          p={4}
          bgGradient="linear(to-t, background.primary, transparent)"
          alignItems="center"
          gap={4}
        >
          <IconButton
            aria-label={isPlaying ? 'Pause' : 'Play'}
            icon={isPlaying ? <FiPause /> : <FiPlay />}
            onClick={() => {
              const video = videoRef.current
              if (!video) return
              void (isPlaying ? video.pause() : video.play())
            }}
          />

          <HStack flex={1} spacing={4}>
            <Text fontSize="sm">{formatTime(currentTime)}</Text>
            <Slider
              value={currentTime}
              min={0}
              max={duration}
              onChange={(v) => {
                if (videoRef.current) {
                  videoRef.current.currentTime = v
                }
              }}
            >
              <SliderTrack>
                <SliderFilledTrack bg="brand.primary" />
              </SliderTrack>
              <SliderThumb />
            </Slider>
            <Text fontSize="sm">{formatTime(duration)}</Text>
          </HStack>

          <HStack spacing={4}>
            <IconButton
              aria-label={isMuted ? 'Unmute' : 'Mute'}
              icon={isMuted ? <FiVolumeX /> : <FiVolume2 />}
              onClick={() => setIsMuted(!isMuted)}
            />

            <Slider
              w="100px"
              value={volume}
              min={0}
              max={1}
              step={0.1}
              onChange={setVolume}
            >
              <SliderTrack>
                <SliderFilledTrack bg="brand.primary" />
              </SliderTrack>
              <SliderThumb />
            </Slider>

            <Menu>
              <MenuButton
                as={IconButton}
                aria-label="Settings"
                icon={<FiSettings />}
              />
              <MenuList bg="background.secondary">
                <MenuItem
                  onClick={() => handleQualityChange('auto')}
                  bg={playerConfig.options?.quality?.default === 'auto' ? 'whiteAlpha.200' : undefined}
                >
                  Auto
                </MenuItem>
                <MenuItem
                  onClick={() => handleQualityChange('1080p')}
                  bg={playerConfig.options?.quality?.default === '1080p' ? 'whiteAlpha.200' : undefined}
                >
                  1080p
                </MenuItem>
                <MenuItem
                  onClick={() => handleQualityChange('720p')}
                  bg={playerConfig.options?.quality?.default === '720p' ? 'whiteAlpha.200' : undefined}
                >
                  720p
                </MenuItem>
              </MenuList>
            </Menu>

            <IconButton
              aria-label="Fullscreen"
              icon={<FiMaximize />}
              onClick={() => void videoRef.current?.requestFullscreen()}
            />
          </HStack>
        </Flex>
      </Box>
    </Box>
  )
}

export default Player