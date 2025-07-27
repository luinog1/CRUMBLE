import { create } from 'zustand'
import { Stream, PlayerConfig, Video, PlayerType } from '@/types'
import { useDebrid } from './useDebrid'

interface PlayerState {
  currentVideo: (Video & { debridService?: 'real-debrid' | 'all-debrid' | 'premiumize' }) | null
  playerConfig: PlayerConfig
  isPlaying: boolean
  volume: number
  isMuted: boolean
  playVideo: (video: Video | string) => void
  pauseVideo: () => void
  setVolume: (volume: number) => void
  setMuted: (muted: boolean) => void
  setPlayerConfig: (config: PlayerConfig) => void
}

export const usePlayer = create<PlayerState>((set) => ({
  currentVideo: null,
  playerConfig: {
    type: 'hls.js',
    options: {
      autoplay: true,
      muted: false,
      controls: true,
      quality: {
        default: 'auto',
        options: ['auto', '1080p', '720p', '480p']
      }
    }
  },
  isPlaying: false,
  volume: 1,
  isMuted: false,

  playVideo: async (video: Video | string) => {
    try {
      if (typeof video === 'string') {
        throw new Error('Direct video ID playback is no longer supported');
      }

      if (!video.streamUrl) {
        throw new Error('Video has no stream URL');
      }

      // Try to resolve through Debrid services first
      const debrid = useDebrid.getState();
      const resolveResult = await debrid.resolveLink(video.streamUrl);
      const finalStreamUrl = resolveResult.url || video.streamUrl;

      // Check if external players are enabled
      const useExternalPlayer = localStorage.getItem('enableExternalPlayers') === 'true';
      const externalPlayer = localStorage.getItem('externalPlayer') || 'infuse';

      if (useExternalPlayer) {
        const encodedUrl = encodeURIComponent(finalStreamUrl);
        let externalUrl = '';

        const handleExternalPlayer = async () => {
          const openExternalPlayer = async (url: string) => {
            const button = document.createElement('button');
            button.style.display = 'none';
            button.onclick = () => {
              const a = document.createElement('a');
              a.style.display = 'none';
              a.href = url;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            };
            document.body.appendChild(button);
            button.click();
            document.body.removeChild(button);
            return new Promise((resolve) => setTimeout(resolve, 1000));
          };

          const tryFallbackPlayer = async () => {
            const fallbackPlayer = localStorage.getItem('fallbackPlayer') || 'vlc';
            switch (fallbackPlayer) {
              case 'vlc':
                await openExternalPlayer(`vlc://${encodedUrl}`);
                break;
              case 'outplayer':
                await openExternalPlayer(`outplayer://${encodedUrl}`);
                break;
            }
          };

          try {
            switch (externalPlayer) {
              case 'infuse':
                const infuseUrl = finalStreamUrl.startsWith('magnet:') ?
                  `infuse://x-callback-url/play?url=${encodedUrl}` :
                  `infuse://x-callback-url/play?url=${encodedUrl}&x-success=crumble://`;
                await openExternalPlayer(infuseUrl);
                setTimeout(tryFallbackPlayer, 2000);
                break;
              case 'outplayer':
                externalUrl = `outplayer://${encodedUrl}`;
                await openExternalPlayer(externalUrl);
                break;
              case 'vidhub':
                externalUrl = `vidhub://play?url=${encodedUrl}`;
                await openExternalPlayer(externalUrl);
                break;
            }
          } catch (error) {
            console.error('Failed to open external player:', error);
            await tryFallbackPlayer();
          }
        };

        await handleExternalPlayer();
        return;
      }

      const streamUrl = video.streamUrl.toLowerCase();
      const config: PlayerConfig = {
        type: 'vlc' as PlayerType,
        options: {
          autoplay: true,
          muted: false,
          controls: true,
          sources: [{
            src: video.streamUrl,
            type: streamUrl.includes('.m3u8') ? 'application/x-mpegURL'
              : streamUrl.includes('.mpd') ? 'application/dash+xml'
              : streamUrl.includes('magnet:') || streamUrl.includes('.torrent')
                ? 'application/x-bittorrent'
                : 'video/mp4'
          }]
        }
      };

      // Add trackers for torrent streams if needed
      if (streamUrl.includes('magnet:') || streamUrl.includes('.torrent')) {
        if (!config.options) {
          config.options = {};
        }
        config.options.trackers = [
          'wss://tracker.openwebtorrent.com',
          'wss://tracker.btorrent.xyz',
          'wss://tracker.webtorrent.io'
        ];
      }

      set({
        playerConfig: config,
        currentVideo: { ...video, debridService: resolveResult.service },
        isPlaying: true
      });
    } catch (error) {
      console.error('Failed to play video:', error);
      throw error;
    }
  },

  pauseVideo: () => {
    set({ isPlaying: false })
  },

  setVolume: (volume: number) => {
    set({ volume })
  },

  setMuted: (muted: boolean) => {
    set({ isMuted: muted })
  },

  setPlayerConfig: (config: PlayerConfig) => {
    set({ playerConfig: config })
  }
}))