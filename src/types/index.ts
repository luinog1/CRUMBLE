// Addon Types
export interface AddonManifest {
  id: string;
  version: string;
  name: string;
  description?: string;
  catalogs?: CatalogRequest[];
  resources: string[];
  types: string[];
  behaviorHints?: {
    adult?: boolean;
    p2p?: boolean;
  };
}

export interface CatalogRequest {
  type: string;
  id: string;
  name: string;
  extra?: CatalogExtra[];
}

export interface CatalogExtra {
  name: string;
  options: string[];
  isRequired?: boolean;
}

// Stream Types
export interface Stream {
  url: string;
  title?: string;
  quality?: string;
  type?: 'hls' | 'dash' | 'mp4';
  behaviorHints?: {
    notWebReady?: boolean;
    bingeGroup?: string;
    headers?: Record<string, string>;
  };
}

// Metadata Types
export interface Metadata {
  id: string;
  type: string;
  name: string;
  description?: string;
  releaseInfo?: string;
  poster?: string;
  background?: string;
  logo?: string;
  videos?: Video[];
  links?: Link[];
  runtime?: string;
  language?: string;
  country?: string;
  genres?: string[];
  cast?: string[];
  imdbRating?: string;
  released?: number;
  trailers?: Video[];
  behaviorHints?: {
    defaultVideoId?: string;
    hasScheduledVideos?: boolean;
  };
}

export interface Video {
  id: string;
  title: string;
  released?: string;
  season?: number;
  episode?: number;
  thumbnail?: string;
  streams?: Stream[];
}

export interface Link {
  name: string;
  category: string;
  url: string;
}

// Player Types
export type PlayerType = 'hls.js' | 'shaka' | 'videojs' | 'native';
export type QualityPreset = 'auto' | '1080p' | '720p' | '480p';

export interface PlayerConfig {
  type: PlayerType;
  options?: {
    autoplay?: boolean;
    muted?: boolean;
    controls?: boolean;
    loop?: boolean;
    poster?: string;
    preload?: 'auto' | 'metadata' | 'none';
    playbackRates?: number[];
    quality?: {
      default?: string;
      options?: string[];
    };
  };
}

// Progress Types
export interface WatchProgress {
  id: string;
  type: string;
  position: number;
  duration: number;
  lastWatched: number;
  completed: boolean;
}

// Library Types
export interface LibraryItem {
  id: string;
  type: string;
  addedAt: number;
  progress?: WatchProgress;
  metadata: {
    title: string;
    poster: string;
    year?: number;
  };
}

// TMDB Types
export interface TMDBConfig {
  apiKey?: string;
  includeAdult?: boolean;
  language?: string;
}

// Catalog Types
export interface CatalogItem {
  id: string;
  title: string;
  poster?: string;
  type: 'movie' | 'series';
  year?: number;
  rating?: number;
}

// UI Types
export interface Theme {
  colors: {
    background: string;
    surface: string;
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    textSecondary: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
  };
  transitions: {
    default: string;
    fast: string;
    slow: string;
  };
}