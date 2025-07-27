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
import { useEffect } from 'react'

const Settings = () => {
  const toast = useToast()
  const [newAddonUrl, setNewAddonUrl] = useState('')
  const [tmdbKey, setTmdbKey] = useState('')
  const { addons, addAddon, removeAddon } = useAddons()
  const { playerConfig, setPlayerConfig } = usePlayer()
  const { setApiKey, setLanguage, setIncludeAdult, apiKey } = useTMDB()

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

  useEffect(() => {
    if (apiKey && !tmdbKey) setTmdbKey(apiKey)
  }, [apiKey])

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
                <label htmlFor="addon-url-input" className="sr-only">Enter addon manifest URL</label>
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
                <FormLabel htmlFor="tmdb-api-key">API Key</FormLabel>
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
                <FormLabel htmlFor="language-select">Language</FormLabel>
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
                <FormLabel htmlFor="include-adult-switch" mb={0}>Include Adult Content</FormLabel>
                <Switch id="include-adult-switch" onChange={(e) => setIncludeAdult(e.target.checked)} />
              </FormControl>
            </VStack>
          </CardBody>
        </Card>

        <Card bg="background.secondary">
          <CardHeader>
            <Heading size="md">Hero Section</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="enable-hero-switch" mb={0}>Enable Hero Section</FormLabel>
                <Switch
                  id="enable-hero-switch"
                  defaultChecked={true}
                  onChange={(e) => localStorage.setItem('enableHero', e.target.checked.toString())}
                />
              </FormControl>
              <FormControl>
                <FormLabel htmlFor="hero-update-interval">Update Interval (hours)</FormLabel>
                <Select
                  id="hero-update-interval"
                  defaultValue="24"
                  onChange={(e) => localStorage.setItem('heroUpdateInterval', e.target.value)}
                >
                  <option value="12">12 Hours</option>
                  <option value="24">24 Hours</option>
                  <option value="48">48 Hours</option>
                </Select>
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
              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="external-player-switch" mb={0}>Enable External Players</FormLabel>
                <Switch
                  id="external-player-switch"
                  defaultChecked={false}
                  onChange={(e) => localStorage.setItem('enableExternalPlayers', e.target.checked.toString())}
                />
              </FormControl>

              <FormControl>
                <FormLabel htmlFor="internal-player-select">Internal Player</FormLabel>
                <Select
                  id="internal-player-select"
                  defaultValue="vlc"
                  onChange={(e) => setPlayerConfig({
                    ...playerConfig,
                    type: 'vlc' as PlayerType
                  })}
                >
                  <option value="vlc">VLC</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel htmlFor="external-player-select">External Player</FormLabel>
                <Select
                  id="external-player-select"
                  defaultValue="infuse"
                  isDisabled={!localStorage.getItem('enableExternalPlayers')}
                  onChange={(e) => localStorage.setItem('externalPlayer', e.target.value)}
                >
                  <option value="infuse">Infuse</option>
                  <option value="outplayer">Outplayer</option>
                  <option value="vidhub">Vidhub</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel htmlFor="default-quality-select">Default Quality</FormLabel>
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
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  )
}

export default Settings