import {
  Box,
  VStack,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Switch,
  Button,
  Select,
  Text,
  useToast,
  Card,
  CardHeader,
  CardBody,
  Divider,
  List,
  ListItem,
  IconButton,
  HStack,
} from '@chakra-ui/react'
import { FiTrash2, FiPlus } from 'react-icons/fi'
import { useState } from 'react'
import { useAddons } from '@hooks/useAddons'
import { usePlayer } from '@hooks/usePlayer'
import { useTMDB } from '@hooks/useTMDB'
import type { AddonManifest, PlayerType, QualityPreset } from '@/types'

const Settings = () => {
  const toast = useToast()
  const [newAddonUrl, setNewAddonUrl] = useState('')
  const [tmdbKey, setTmdbKey] = useState('')
  const { addons, addAddon, removeAddon } = useAddons()
  const { playerConfig, setPlayerConfig } = usePlayer()
  const { setApiKey, setLanguage, setIncludeAdult } = useTMDB()

  const handleAddAddon = async () => {
    try {
      await addAddon(newAddonUrl)
      setNewAddonUrl('')
      toast({
        title: 'Addon added successfully',
        status: 'success',
        duration: 3000,
        isClosable: true
      })
    } catch (error) {
      toast({
        title: 'Failed to add addon',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    }
  }

  const handleSetTMDB = () => {
    setApiKey(tmdbKey)
    toast({
      title: 'TMDB API key updated',
      status: 'success',
      duration: 3000,
      isClosable: true
    })
  }

  return (
    <Box p={8}>
      <VStack spacing={8} align="stretch" maxW="3xl" mx="auto">
        <Heading size="xl">Settings</Heading>

        <Card bg="background.secondary">
          <CardHeader>
            <Heading size="md">Addons</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <HStack>
                <Input
                  id="addon-url-input"
                  placeholder="Enter addon manifest URL"
                  value={newAddonUrl}
                  onChange={(e) => setNewAddonUrl(e.target.value)}
                />
                <Button
                  leftIcon={<FiPlus />}
                  onClick={handleAddAddon}
                  isDisabled={!newAddonUrl}
                >
                  Add
                </Button>
              </HStack>

              <List spacing={2}>
                {addons.map((addon: AddonManifest) => (
                  <ListItem
                    key={addon.id}
                    p={2}
                    bg="whiteAlpha.50"
                    borderRadius="md"
                  >
                    <HStack justify="space-between">
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="bold">{addon.name}</Text>
                        <Text fontSize="sm" color="whiteAlpha.700">
                          {addon.version}
                        </Text>
                      </VStack>
                      <IconButton
                        aria-label="Remove addon"
                        icon={<FiTrash2 />}
                        variant="ghost"
                        colorScheme="red"
                        onClick={() => removeAddon(addon.id)}
                      />
                    </HStack>
                  </ListItem>
                ))}
              </List>
            </VStack>
          </CardBody>
        </Card>

        <Card bg="background.secondary">
          <CardHeader>
            <Heading size="md">TMDB Integration</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>API Key</FormLabel>
                <HStack>
                  <Input
                    id="tmdb-api-key"
                    type="password"
                    placeholder="Enter TMDB API key"
                    value={tmdbKey}
                    onChange={(e) => setTmdbKey(e.target.value)}
                  />
                  <Button onClick={handleSetTMDB} isDisabled={!tmdbKey}>
                    Save
                  </Button>
                </HStack>
              </FormControl>

              <FormControl>
                <FormLabel>Language</FormLabel>
                <Select
                  id="language-select"
                  onChange={(e) => setLanguage(e.target.value)}
                  defaultValue="en-US"
                >
                  <option value="en-US">English</option>
                  <option value="es-ES">Spanish</option>
                  <option value="fr-FR">French</option>
                  <option value="de-DE">German</option>
                  <option value="it-IT">Italian</option>
                  <option value="pt-BR">Portuguese</option>
                </Select>
              </FormControl>

              <FormControl display="flex" alignItems="center">
                <FormLabel mb={0}>Include Adult Content</FormLabel>
                <Switch id="include-adult-switch" onChange={(e) => setIncludeAdult(e.target.checked)} />
              </FormControl>
            </VStack>
          </CardBody>
        </Card>

        <Card bg="background.secondary">
          <CardHeader>
            <Heading size="md">Player Settings</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Default Player</FormLabel>
                <Select
                  id="default-player-select"
                  value={playerConfig.type as string}
                  onChange={(e) => setPlayerConfig({
                    ...playerConfig,
                    type: e.target.value as PlayerType
                  })}
                >
                  <option value="hls.js">HLS.js</option>
                  <option value="shaka">Shaka Player</option>
                  <option value="videojs">Video.js</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Default Quality</FormLabel>
                <Select
                  id="default-quality-select"
                  value={playerConfig.options?.quality?.default ?? 'auto'}
                  onChange={(e) => setPlayerConfig({
                    ...playerConfig,
                    options: {
                      ...playerConfig.options,
                      quality: {
                        ...playerConfig.options?.quality,
                        default: e.target.value as QualityPreset
                      }
                    }
                  })}
                >
                  <option value="auto">Auto</option>
                  <option value="1080p">1080p</option>
                  <option value="720p">720p</option>
                  <option value="480p">480p</option>
                </Select>
              </FormControl>

              <FormControl display="flex" alignItems="center">
                <FormLabel mb={0}>Enable HDR</FormLabel>
                <Switch
                  id="enable-hdr-switch"
                  isChecked={false}
                  onChange={() => {}}
                />
              </FormControl>

              <Divider />

              <FormControl>
                <FormLabel>External Player</FormLabel>
                <Select
                  id="external-player-select"
                  defaultValue="vlc"
                  onChange={(e) => localStorage.setItem('externalPlayer', e.target.value)}
                >
                  <option value="vlc">VLC</option>
                  <option value="infuse">Infuse</option>
                  <option value="outplayer">Outplayer</option>
                </Select>
              </FormControl>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  )
}

export default Settings