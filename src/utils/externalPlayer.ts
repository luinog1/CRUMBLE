type ExternalPlayer = 'infuse' | 'outplayer' | 'vidhub'

interface PlayerDefinition {
  name: string
  urlScheme: string
  description: string
  supportedFormats: Array<'hls' | 'mp4' | 'magnet' | 'dash'>
  filenameswitch?: boolean
}

interface ExternalPlayerOptions {
  onSuccess?: () => void
  onError?: (error: Error) => void
  fallbackPlayer?: ExternalPlayer
  fallbackDelay?: number
  subtitle?: string
  title?: string
  poster?: string
}

const playerDefinitions: Record<ExternalPlayer, PlayerDefinition> = {
  infuse: {
    name: 'Infuse',
    urlScheme: 'infuse://x-callback-url/play',
    description: 'High-quality video player with extensive format support',
    supportedFormats: ['hls', 'mp4', 'magnet', 'dash'],
    filenameswitch: false
  },
  outplayer: {
    name: 'Outplayer',
    urlScheme: 'outplayer://',
    description: 'Modern video player with streaming support',
    supportedFormats: ['hls', 'mp4', 'dash'],
    filenameswitch: false
  },
  vidhub: {
    name: 'VidHub',
    urlScheme: 'vidhub://',
    description: 'Powerful media player with advanced features',
    supportedFormats: ['hls', 'mp4', 'magnet', 'dash'],
    filenameswitch: false
  }
}

const getPlayerInfo = (player: ExternalPlayer): PlayerDefinition => {
  return playerDefinitions[player]
}

const isFormatSupported = (player: ExternalPlayer, url: string): boolean => {
  const playerDef = getPlayerInfo(player)
  if (url.startsWith('magnet:')) return playerDef.supportedFormats.includes('magnet')
  if (url.includes('.m3u8')) return playerDef.supportedFormats.includes('hls')
  if (url.includes('.mpd')) return playerDef.supportedFormats.includes('dash')
  return playerDef.supportedFormats.includes('mp4')
}

export const openInExternalPlayer = async (
  url: string,
  player: ExternalPlayer,
  options: ExternalPlayerOptions = {}
): Promise<void> => {
  const {
    onSuccess,
    onError,
    fallbackPlayer,
    fallbackDelay = 2000,
    subtitle,
    title,
    poster
  } = options

  // Validate player support
  if (!isFormatSupported(player, url)) {
    const error = new Error(`Format not supported by ${getPlayerInfo(player).name}`)
    onError?.(error)
    if (fallbackPlayer && isFormatSupported(fallbackPlayer, url)) {
      return openInExternalPlayer(url, fallbackPlayer, {
        ...options,
        fallbackPlayer: undefined // Prevent infinite fallback loop
      })
    }
    throw error
  }

  const encodedUrl = encodeURIComponent(url)

  const createPlayerUrl = (player: ExternalPlayer, url: string, options: ExternalPlayerOptions = {}): string => {
    const playerDef = getPlayerInfo(player)
    const { subtitle, title, poster } = options
    
    // Validate format support
    if (!isFormatSupported(player, url)) {
      throw new Error(`Format not supported by ${playerDef.name}`)
    }

    // Build the base URL with the player's scheme
    let playerUrl = ''

    switch (player) {
      case 'infuse':
        playerUrl = `${playerDef.urlScheme}?url=${url}`
        if (subtitle) playerUrl += `&subtitle=${encodeURIComponent(subtitle)}`
        if (title) playerUrl += `&title=${encodeURIComponent(title)}`
        if (!url.startsWith('magnet:')) playerUrl += '&x-success=crumble://'
        break

      case 'vidhub':
        playerUrl = `${playerDef.urlScheme}?url=${url}`
        if (subtitle) playerUrl += `&subtitle=${encodeURIComponent(subtitle)}`
        if (title) playerUrl += `&title=${encodeURIComponent(title)}`
        if (poster) playerUrl += `&poster=${encodeURIComponent(poster)}`
        break


      case 'outplayer':
        playerUrl = `${playerDef.urlScheme}${url}`
        if (subtitle) playerUrl += `#subtitle=${encodeURIComponent(subtitle)}`
        break

      default:
        playerUrl = `${playerDef.urlScheme}${url}`
    }

    return playerUrl
  }

  const launchPlayer = (playerUrl: string, player: ExternalPlayer): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        const playerDef = getPlayerInfo(player)
        
        // Create modal container
        const modal = document.createElement('div')
        modal.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
        `

        // Create modal content
        const content = document.createElement('div')
        content.style.cssText = `
          background: #2D3748;
          padding: 2rem;
          border-radius: 8px;
          max-width: 400px;
          width: 90%;
          text-align: center;
          color: white;
        `

        // Add player info
        const playerInfo = document.createElement('h2')
        playerInfo.style.cssText = 'margin-bottom: 1rem; font-size: 1.5rem;'
        playerInfo.textContent = playerDef.name

        const message = document.createElement('p')
        message.style.cssText = 'margin-bottom: 2rem;'
        message.textContent = playerDef.description

        // Create launch button
        const launchButton = document.createElement('button')
        launchButton.style.cssText = `
          background: #4299E1;
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 4px;
          border: none;
          cursor: pointer;
          font-size: 1rem;
          margin-right: 1rem;
        `
        launchButton.textContent = `Open in ${playerDef.name}`

        // Create cancel button
        const cancelButton = document.createElement('button')
        cancelButton.style.cssText = `
          background: #718096;
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 4px;
          border: none;
          cursor: pointer;
          font-size: 1rem;
        `
        cancelButton.textContent = 'Cancel'

        // Handle launch click
        launchButton.onclick = () => {
          const link = document.createElement('a')
          link.href = playerUrl
          link.click()
          document.body.removeChild(modal)
          resolve()
        }

        // Handle cancel click
        cancelButton.onclick = () => {
          document.body.removeChild(modal)
          reject(new Error('User cancelled'))
        }

        // Assemble modal
        content.appendChild(playerInfo)
        content.appendChild(message)
        content.appendChild(launchButton)
        content.appendChild(cancelButton)
        modal.appendChild(content)

        // Show modal
        document.body.appendChild(modal)
      } catch (error) {
        reject(error)
      }
    })
  }

  const handlePlayerError = (error: unknown, currentPlayer: ExternalPlayer): error is Error => {
    if (error instanceof Error && error.message !== 'User cancelled') {
      console.error(`Failed to open ${currentPlayer}. Please check if the app is installed.`, error)
      onError?.(error)
      return true
    }
    return false
  }

  const tryLaunchPlayer = async (currentPlayer: ExternalPlayer): Promise<void> => {
    const playerUrl = createPlayerUrl(currentPlayer, encodedUrl, { subtitle, title, poster })
    await launchPlayer(playerUrl, currentPlayer)
  }

  try {
    await tryLaunchPlayer(player)
    onSuccess?.()

    // Try fallback player after delay if specified
    if (fallbackPlayer) {
      const fallbackTimer = setTimeout(async () => {
        try {
          await tryLaunchPlayer(fallbackPlayer)
        } catch (error: unknown) {
          handlePlayerError(error, fallbackPlayer)
        }
      }, fallbackDelay)

      // Clear fallback timer if primary player succeeds
      void (() => clearTimeout(fallbackTimer))
    }
  } catch (error: unknown) {
    // Only handle error if it's not a user cancellation
    if (handlePlayerError(error, player) && fallbackPlayer) {
      // Try fallback immediately if primary player fails
      try {
        await tryLaunchPlayer(fallbackPlayer)
        onSuccess?.()
      } catch (fallbackError: unknown) {
        handlePlayerError(fallbackError, fallbackPlayer)
      }
    }
  }
}