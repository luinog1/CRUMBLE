const express = require('express');
const cors = require('cors');
const axios = require('axios');
const NodeCache = require('node-cache');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// TMDB API Configuration (Netflix Clone Protocol)
const TMDB_API_KEY = '90acb3adf6e0af93b6c0055ed8a721aa';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';
const ORIGINAL_IMG_URL = 'https://image.tmdb.org/t/p/original';

// Cache configuration (1 hour)
const cache = new NodeCache({ stdTTL: 3600 });

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Stremio Addon URLs (from stremio-addons.com)
const STREMIO_ADDONS = {
  torrentio: 'https://torrentio.strem.fun',
  peerflix: 'https://peerflix.mov',
  jackett: 'https://jackett.elfhosted.com',
  cinemeta: 'https://v3-cinemeta.strem.io'
};

// Helper function to make TMDB API calls
const tmdbRequest = async (endpoint, params = {}) => {
  try {
    const url = `${TMDB_BASE_URL}${endpoint}`;
    const response = await axios.get(url, {
      params: {
        api_key: TMDB_API_KEY,
        ...params
      },
      timeout: 10000
    });
    return response.data;
  } catch (error) {
    console.error(`TMDB API Error for ${endpoint}:`, error.message);
    throw new Error(`Failed to fetch from TMDB: ${error.message}`);
  }
};

// Netflix Clone API Protocol Implementation

// 1. Get Movie Genres (Netflix Clone Protocol)
app.get('/api/genres', async (req, res) => {
  try {
    const cacheKey = 'movie_genres';
    let genres = cache.get(cacheKey);
    
    if (!genres) {
      genres = await tmdbRequest('/genre/movie/list');
      cache.set(cacheKey, genres);
    }
    
    res.json(genres);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Get Movies by Genre (Netflix Clone Protocol)
app.get('/api/movies/genre/:genreId', async (req, res) => {
  try {
    const { genreId } = req.params;
    const page = req.query.page || Math.floor(Math.random() * 3) + 1;
    const cacheKey = `movies_genre_${genreId}_page_${page}`;
    
    let movies = cache.get(cacheKey);
    
    if (!movies) {
      movies = await tmdbRequest('/discover/movie', {
        with_genres: genreId,
        page: page
      });
      cache.set(cacheKey, movies);
    }
    
    // Transform data to match Netflix clone format
    const transformedMovies = {
      ...movies,
      results: movies.results.map(movie => ({
        ...movie,
        backdrop_path: movie.backdrop_path ? `${IMG_URL}${movie.backdrop_path}` : null,
        poster_path: movie.poster_path ? `${IMG_URL}${movie.poster_path}` : null,
        original_backdrop: movie.backdrop_path ? `${ORIGINAL_IMG_URL}${movie.backdrop_path}` : null
      }))
    };
    
    res.json(transformedMovies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Get Movie Details (Netflix Clone Protocol)
app.get('/api/movie/:movieId', async (req, res) => {
  try {
    const { movieId } = req.params;
    const cacheKey = `movie_details_${movieId}`;
    
    let movieDetails = cache.get(cacheKey);
    
    if (!movieDetails) {
      movieDetails = await tmdbRequest(`/movie/${movieId}`, {
        append_to_response: 'videos,credits,similar,external_ids'
      });
      cache.set(cacheKey, movieDetails);
    }
    
    // Transform data to match Netflix clone format
    const transformedDetails = {
      ...movieDetails,
      backdrop_path: movieDetails.backdrop_path ? `${ORIGINAL_IMG_URL}${movieDetails.backdrop_path}` : null,
      poster_path: movieDetails.poster_path ? `${IMG_URL}${movieDetails.poster_path}` : null,
      imdb_id: movieDetails.external_ids?.imdb_id || null
    };
    
    res.json(transformedDetails);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Enhanced TMDB Endpoints (Additional Features)

// Trending Content
app.get('/api/trending/:mediaType/:timeWindow', async (req, res) => {
  try {
    const { mediaType, timeWindow } = req.params;
    const cacheKey = `trending_${mediaType}_${timeWindow}`;
    
    let trending = cache.get(cacheKey);
    
    if (!trending) {
      trending = await tmdbRequest(`/trending/${mediaType}/${timeWindow}`);
      cache.set(cacheKey, trending);
    }
    
    res.json(trending);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Popular Movies
app.get('/api/movies/popular', async (req, res) => {
  try {
    const page = req.query.page || 1;
    const cacheKey = `popular_movies_page_${page}`;
    
    let movies = cache.get(cacheKey);
    
    if (!movies) {
      movies = await tmdbRequest('/movie/popular', { page });
      cache.set(cacheKey, movies);
    }
    
    res.json(movies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Top Rated TV Shows
app.get('/api/tv/top-rated', async (req, res) => {
  try {
    const page = req.query.page || 1;
    const cacheKey = `top_rated_tv_page_${page}`;
    
    let tvShows = cache.get(cacheKey);
    
    if (!tvShows) {
      tvShows = await tmdbRequest('/tv/top_rated', { page });
      cache.set(cacheKey, tvShows);
    }
    
    res.json(tvShows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search Content
app.get('/api/search', async (req, res) => {
  try {
    const { query, type = 'multi' } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }
    
    const cacheKey = `search_${type}_${query}`;
    let results = cache.get(cacheKey);
    
    if (!results) {
      results = await tmdbRequest(`/search/${type}`, { query });
      cache.set(cacheKey, results);
    }
    
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Stremio Addon Integration for Stream Scraping

// Helper function to get IMDB ID from TMDB ID
const getImdbId = async (type, tmdbId) => {
  try {
    const endpoint = type === 'movie' ? `/movie/${tmdbId}` : `/tv/${tmdbId}`;
    const details = await tmdbRequest(endpoint, {
      append_to_response: 'external_ids'
    });
    return details.external_ids?.imdb_id || null;
  } catch (error) {
    console.log(`Failed to get IMDB ID for ${type} ${tmdbId}:`, error.message);
    return null;
  }
};

// Get available streams for content
app.get('/api/streams/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    const cacheKey = `streams_${type}_${id}`;
    
    let streams = cache.get(cacheKey);
    
    if (!streams) {
      streams = [];
      
      // Convert TMDB ID to IMDB ID if needed
      let streamId = id;
      
      // Check if ID is a TMDB ID (numeric) and convert to IMDB ID
      if (/^\d+$/.test(id)) {
        console.log(`Converting TMDB ID ${id} to IMDB ID...`);
        const imdbId = await getImdbId(type, id);
        if (imdbId) {
          streamId = imdbId;
          console.log(`Converted TMDB ID ${id} to IMDB ID ${streamId}`);
        } else {
          console.log(`Could not find IMDB ID for TMDB ID ${id}`);
          // Still try with original ID as fallback
        }
      }
      
      // Try multiple Stremio addons
      const addonPromises = Object.entries(STREMIO_ADDONS).map(async ([name, url]) => {
        try {
          const streamUrl = `${url}/stream/${type}/${streamId}.json`;
          console.log(`Fetching streams from ${name}: ${streamUrl}`);
          const response = await axios.get(streamUrl, { timeout: 10000 });
          
          if (response.data && response.data.streams) {
            console.log(`Found ${response.data.streams.length} streams from ${name}`);
            return {
              addon: name,
              streams: response.data.streams.map(stream => ({
                ...stream,
                addon: name,
                quality: stream.title?.match(/\b(4K|2160p|1080p|720p|480p)\b/i)?.[0] || 'Unknown',
                size: stream.title?.match(/\b(\d+(?:\.\d+)?\s*(?:GB|MB))\b/i)?.[0] || null,
                seeds: stream.title?.match(/👤\s*(\d+)/)?.[1] || null
              }))
            };
          } else {
            console.log(`No streams found from ${name}`);
          }
        } catch (error) {
          console.log(`Failed to fetch from ${name}:`, error.message);
          return null;
        }
      });
      
      const results = await Promise.allSettled(addonPromises);
      
      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          streams.push(...result.value.streams);
        }
      });
      
      console.log(`Total streams found: ${streams.length}`);
      
      // Cache for 30 minutes
      cache.set(cacheKey, streams, 1800);
    }
    
    res.json({ streams });
  } catch (error) {
    console.log('Stream fetch error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get addon manifests
app.get('/api/addons', async (req, res) => {
  try {
    const addons = [];
    
    for (const [name, url] of Object.entries(STREMIO_ADDONS)) {
      try {
        const manifestUrl = `${url}/manifest.json`;
        const response = await axios.get(manifestUrl, { timeout: 3000 });
        
        addons.push({
          name,
          url,
          manifest: response.data
        });
      } catch (error) {
        console.log(`Failed to fetch manifest from ${name}:`, error.message);
      }
    }
    
    res.json({ addons });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. TV Show Specific Endpoints

// Get TV Show Details
app.get('/api/tv/:tvId', async (req, res) => {
  try {
    const { tvId } = req.params;
    const cacheKey = `tv_details_${tvId}`;
    
    let tvDetails = cache.get(cacheKey);
    
    if (!tvDetails) {
      tvDetails = await tmdbRequest(`/tv/${tvId}`, {
        append_to_response: 'videos,credits,similar,external_ids'
      });
      cache.set(cacheKey, tvDetails);
    }
    
    // Transform data to match Netflix clone format
    const transformedDetails = {
      ...tvDetails,
      backdrop_path: tvDetails.backdrop_path ? `${ORIGINAL_IMG_URL}${tvDetails.backdrop_path}` : null,
      poster_path: tvDetails.poster_path ? `${IMG_URL}${tvDetails.poster_path}` : null,
      imdb_id: tvDetails.external_ids?.imdb_id || null
    };
    
    res.json(transformedDetails);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get TV Show Season
app.get('/api/tv/:tvId/season/:seasonNumber', async (req, res) => {
  try {
    const { tvId, seasonNumber } = req.params;
    const cacheKey = `tv_${tvId}_season_${seasonNumber}`;
    
    let season = cache.get(cacheKey);
    
    if (!season) {
      season = await tmdbRequest(`/tv/${tvId}/season/${seasonNumber}`);
      cache.set(cacheKey, season);
    }
    
    res.json(season);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    tmdb_api_key: TMDB_API_KEY ? 'configured' : 'missing',
    cache_stats: cache.getStats()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Crumble Backend Server running on port ${PORT}`);
  console.log(`📡 TMDB API Key: ${TMDB_API_KEY ? 'Configured' : 'Missing'}`);
  console.log(`🎬 Netflix Clone Protocol: Active`);
  console.log(`🔗 Stremio Addons: ${Object.keys(STREMIO_ADDONS).length} configured`);
  console.log(`\n📋 Available Endpoints:`);
  console.log(`   GET /api/genres - Get movie genres`);
  console.log(`   GET /api/movies/genre/:genreId - Get movies by genre`);
  console.log(`   GET /api/movie/:movieId - Get movie details`);
  console.log(`   GET /api/trending/:mediaType/:timeWindow - Get trending content`);
  console.log(`   GET /api/movies/popular - Get popular movies`);
  console.log(`   GET /api/tv/top-rated - Get top rated TV shows`);
  console.log(`   GET /api/search?query=... - Search content`);
  console.log(`   GET /api/streams/:type/:id - Get stream links`);
  console.log(`   GET /api/addons - Get available addons`);
  console.log(`   GET /api/health - Health check`);
});

module.exports = app;