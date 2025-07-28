import { create } from 'zustand'
import { Stream, PlayerConfig, Video, PlayerType } from '@/types'
import { useDebrid } from './useDebrid'
import { openInExternalPlayer } from '@/utils/externalPlayer'

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
        const fallbackPlayer = localStorage.getItem('fallbackPlayer') || 'outplayer';
        
        await openInExternalPlayer(finalStreamUrl, externalPlayer as 'infuse' | 'outplayer' | 'vidhub', {
          fallbackPlayer: fallbackPlayer as 'outplayer' | 'infuse' | 'vidhub',
          onError: (error) => {
            console.error('Failed to open external player:', error);
          },
          title: video.title,
          subtitle: video.subtitle,
          poster: video.poster
        });
        
        return;
      }

      const streamUrl = video.streamUrl.toLowerCase();
      const config: PlayerConfig = {
        type: 'web' as PlayerType,
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