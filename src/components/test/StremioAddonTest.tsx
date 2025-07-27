import React, { useState } from 'react';
import { Box, Button, VStack, Text, Spinner, Alert, AlertIcon } from '@chakra-ui/react';
import { useStremioAddon } from '@/hooks/useStremioAddon';

// Example component to test Stremio addon functionality
const StremioAddonTest: React.FC = () => {
  const [addonUrl] = useState('https://v3-cinemeta.strem.io');
  const { loading, error, catalog, meta, streams, loadCatalog, loadMeta, loadStreams } = useStremioAddon(addonUrl);

  const handleLoadCatalog = () => {
    // Load popular movies catalog
    loadCatalog('movie', 'top');
  };

  const handleLoadMeta = () => {
    // Load metadata for a specific movie (example: The Matrix)
    loadMeta('movie', 'tt0133093');
  };

  const handleLoadStreams = () => {
    // Load streams for a specific movie
    loadStreams('movie', 'tt0133093');
  };

  return (
    <Box p={6} maxW="800px" mx="auto">
      <VStack spacing={4} align="stretch">
        <Text fontSize="xl" fontWeight="bold">
          Stremio Addon Test
        </Text>
        
        <Text fontSize="sm" color="gray.500">
          Testing addon: {addonUrl}
        </Text>

        {loading && (
          <Box display="flex" alignItems="center" gap={2}>
            <Spinner size="sm" />
            <Text>Loading...</Text>
          </Box>
        )}

        {error && (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        )}

        <VStack spacing={2}>
          <Button onClick={handleLoadCatalog} isDisabled={loading}>
            Load Catalog (Popular Movies)
          </Button>
          
          <Button onClick={handleLoadMeta} isDisabled={loading}>
            Load Meta (The Matrix)
          </Button>
          
          <Button onClick={handleLoadStreams} isDisabled={loading}>
            Load Streams (The Matrix)
          </Button>
        </VStack>

        {catalog && (
          <Box>
            <Text fontWeight="bold" mb={2}>Catalog Results ({catalog.length} items):</Text>
            <Box maxH="200px" overflowY="auto">
              {catalog.slice(0, 5).map((item) => (
                <Box key={item.id} p={2} borderWidth={1} borderRadius="md" mb={2}>
                  <Text fontWeight="semibold">{item.name}</Text>
                  <Text fontSize="sm" color="gray.600">ID: {item.id}</Text>
                  <Text fontSize="sm" color="gray.600">Type: {item.type}</Text>
                </Box>
              ))}
              {catalog.length > 5 && (
                <Text fontSize="sm" color="gray.500">... and {catalog.length - 5} more items</Text>
              )}
            </Box>
          </Box>
        )}

        {meta && (
          <Box>
            <Text fontWeight="bold" mb={2}>Metadata:</Text>
            <Box p={3} borderWidth={1} borderRadius="md">
              <Text fontWeight="semibold">{meta.name}</Text>
              <Text fontSize="sm">{meta.description}</Text>
              <Text fontSize="sm" color="gray.600">Released: {meta.released}</Text>
              <Text fontSize="sm" color="gray.600">IMDB: {meta.imdbRating}</Text>
            </Box>
          </Box>
        )}

        {streams && (
          <Box>
            <Text fontWeight="bold" mb={2}>Streams ({streams.length} found):</Text>
            <Box maxH="200px" overflowY="auto">
              {streams.slice(0, 3).map((stream, index) => (
                <Box key={index} p={2} borderWidth={1} borderRadius="md" mb={2}>
                  <Text fontWeight="semibold">{stream.title || 'Untitled Stream'}</Text>
                  <Text fontSize="sm" color="gray.600">Quality: {stream.quality || 'Unknown'}</Text>
                  <Text fontSize="sm" color="gray.600">Type: {stream.type || 'Unknown'}</Text>
                  <Text fontSize="xs" color="gray.500" isTruncated>{stream.url}</Text>
                </Box>
              ))}
              {streams.length > 3 && (
                <Text fontSize="sm" color="gray.500">... and {streams.length - 3} more streams</Text>
              )}
            </Box>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default StremioAddonTest;