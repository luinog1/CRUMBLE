import { useState, useCallback } from 'react';
import { StremioAddonClient, MetaItem, StreamSource, Subtitle } from '../utils/StremioAddonClient';

interface UseStremioAddonResult {
  loading: boolean;
  error: string | null;
  catalog: MetaItem[] | null;
  meta: MetaItem | null;
  streams: StreamSource[] | null;
  subtitles: Subtitle[] | null;
  loadCatalog: (type: string, id: string, extra?: Record<string, string | number | boolean>) => Promise<void>;
  loadMeta: (type: string, id: string) => Promise<void>;
  loadStreams: (type: string, id: string) => Promise<void>;
  loadSubtitles: (type: string, id: string) => Promise<void>;
}

export function useStremioAddon(addonUrl: string): UseStremioAddonResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<MetaItem[] | null>(null);
  const [meta, setMeta] = useState<MetaItem | null>(null);
  const [streams, setStreams] = useState<StreamSource[] | null>(null);
  const [subtitles, setSubtitles] = useState<Subtitle[] | null>(null);

  // Initialize the client
  const client = new StremioAddonClient(addonUrl);

  // Load catalog data
  const loadCatalog = useCallback(async (type: string, id: string, extra?: Record<string, string | number | boolean>) => {
    setLoading(true);
    setError(null);
    try {
      await client.loadManifest();
      const result = await client.fetchCatalog({ type, id, extra });
      setCatalog(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load catalog');
      setCatalog(null);
    } finally {
      setLoading(false);
    }
  }, [addonUrl]);

  // Load metadata
  const loadMeta = useCallback(async (type: string, id: string) => {
    setLoading(true);
    setError(null);
    try {
      await client.loadManifest();
      const result = await client.fetchMeta(type, id);
      setMeta(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metadata');
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [addonUrl]);

  // Load streams
  const loadStreams = useCallback(async (type: string, id: string) => {
    setLoading(true);
    setError(null);
    try {
      await client.loadManifest();
      const result = await client.fetchStreams(type, id);
      setStreams(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load streams');
      setStreams(null);
    } finally {
      setLoading(false);
    }
  }, [addonUrl]);

  // Load subtitles
  const loadSubtitles = useCallback(async (type: string, id: string) => {
    setLoading(true);
    setError(null);
    try {
      await client.loadManifest();
      const result = await client.fetchSubtitles(type, id);
      setSubtitles(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subtitles');
      setSubtitles(null);
    } finally {
      setLoading(false);
    }
  }, [addonUrl]);

  return {
    loading,
    error,
    catalog,
    meta,
    streams,
    subtitles,
    loadCatalog,
    loadMeta,
    loadStreams,
    loadSubtitles,
  };
}