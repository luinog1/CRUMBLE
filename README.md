# 🎬 CRUMBLE

A modern, browser-based media center for discovering and watching content. Built with React, TypeScript, and a modular architecture supporting multiple content sources and players.

## 🌟 Features

- **Modular Addon System**: Support for catalog, stream, subtitles, and metadata addons
- **Multiple Players**: Built-in HLS/DASH playback with HDR support
- **External Playback**: Integration with Infuse, VLC, and Outplayer
- **Watch Progress**: Track and sync viewing history
- **TMDB Integration**: Optional API key for enhanced metadata
- **Dark Mode UI**: Clean, performance-focused interface

## 🏗️ Architecture

### Core Modules

```
src/
├── components/          # Reusable UI components
│   ├── layout/         # Layout components (Sidebar, Header)
│   ├── media/          # Media-related components (Player, Controls)
│   ├── catalog/        # Content display components
│   └── common/         # Shared components (Button, Card)
├── pages/              # Main application pages
│   ├── Home/          # Featured content and trending
│   ├── Search/        # Global search across addons
│   ├── Library/       # User's content and progress
│   └── Settings/      # Application configuration
├── hooks/              # Custom React hooks
│   ├── useAddons/     # Addon management
│   ├── usePlayer/     # Playback control
│   ├── useProgress/   # Watch progress tracking
│   └── useTMDB/       # TMDB API integration
├── store/              # State management
│   ├── addons/        # Addon state and actions
│   ├── player/        # Player state and controls
│   └── library/       # User library and progress
├── utils/              # Helper functions
│   ├── addon/         # Addon protocol handlers
│   ├── player/        # Player utilities
│   └── storage/       # Local storage management
└── types/             # TypeScript definitions
```

### Key Components

1. **Addon Loader**
   - Fetches and validates addon manifests
   - Manages addon lifecycle and updates
   - Handles catalog and stream requests

2. **Stream Resolver**
   - Processes streaming links from addons
   - Handles different stream types (HLS, DASH)
   - Manages external player integration

3. **Player Handler**
   - Unified interface for multiple players
   - HDR content detection and handling
   - Watch progress integration

4. **Metadata Manager**
   - Merges data from multiple sources
   - TMDB integration when available
   - Caching and optimization

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🔌 Addon Development

CRUMBLE follows the Stremio Addon Protocol. Create new addons by implementing:

```typescript
interface AddonManifest {
  id: string;
  version: string;
  catalogs?: CatalogRequest[];
  resources: string[];
  types: string[];
}

interface StreamProvider {
  // Stream resolution methods
  resolve: (type: string, id: string) => Promise<Stream[]>;
}

interface MetadataProvider {
  // Metadata enhancement methods
  enrich: (type: string, id: string) => Promise<Metadata>;
}
```

## 📱 UI Design

- True black background (#000000)
- Minimal, icon-based sidebar
- Fluid animations and transitions
- Responsive layout for all devices
- HDR-ready video playback

## 🔄 Data Storage

```typescript
// Watch Progress Structure
interface WatchProgress {
  id: string;
  type: string;
  position: number;
  duration: number;
  lastWatched: number;
  completed: boolean;
}

// Library Item Structure
interface LibraryItem {
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
```

## 📜 License

MIT License - See LICENSE file for details