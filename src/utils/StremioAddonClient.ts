export interface MetaItem {
  id: string;
  type: string;
  name: string;
  poster?: string;
  background?: string;
  logo?: string;
  description?: string;
  releaseInfo?: string;
  imdbRating?: string;
  released?: string;
  runtime?: string;
  language?: string;
  country?: string;
  genres?: string[];
  cast?: string[];
  videos?: {
    id: string;
    title: string;
    released?: string;
    season?: number;
    episode?: number;
    thumbnail?: string;
  }[];
}

export interface StreamSource {
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

export interface Subtitle {
  id: string;
  url: string;
  lang: string;
}

export interface AddonManifest {
  id: string;
  version: string;
  name: string;
  description?: string;
  logo?: string;
  background?: string;
  catalogs?: {
    type: string;
    id: string;
    name: string;
    extra?: {
      name: string;
      options: string[];
      isRequired?: boolean;
    }[];
  }[];
  resources: string[];
  types: string[];
  idPrefixes?: string[];
  behaviorHints?: {
    adult?: boolean;
    p2p?: boolean;
  };
}

export interface CatalogRequest {
  type: string;
  id: string;
  extra?: Record<string, string | number | boolean>;
}

export class StremioAddonClient {
  private baseUrl: string;
  private manifest: AddonManifest | null = null;

  constructor(addonUrl: string) {
    // Remove trailing slash and /manifest.json if present
    this.baseUrl = addonUrl.replace(/\/(manifest\.json)?\/?$/, '');
  }

  async loadManifest(): Promise<AddonManifest> {
    if (this.manifest) {
      return this.manifest;
    }

    try {
      const response = await fetch(`${this.baseUrl}/manifest.json`);
      if (!response.ok) {
        throw new Error(`Failed to fetch manifest: ${response.status} ${response.statusText}`);
      }

      this.manifest = await response.json();
      if (!this.manifest) {
        throw new Error('Invalid manifest format');
      }

      return this.manifest;
    } catch (error) {
      throw new Error(`Failed to load addon manifest: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async fetchCatalog(request: CatalogRequest): Promise<MetaItem[]> {
    await this.loadManifest();
    
    if (!this.manifest?.resources.includes('catalog')) {
      throw new Error('Addon does not support catalog resource');
    }

    const { type, id, extra } = request;
    let url = `${this.baseUrl}/catalog/${type}/${id}.json`;
    
    if (extra && Object.keys(extra).length > 0) {
      const params = new URLSearchParams();
      Object.entries(extra).forEach(([key, value]) => {
        params.append(key, String(value));
      });
      url += `?${params.toString()}`;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch catalog: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.metas || data || [];
    } catch (error) {
      throw new Error(`Failed to fetch catalog: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async fetchMeta(type: string, id: string): Promise<MetaItem> {
    await this.loadManifest();
    
    if (!this.manifest?.resources.includes('meta')) {
      throw new Error('Addon does not support meta resource');
    }

    try {
      const response = await fetch(`${this.baseUrl}/meta/${type}/${id}.json`);
      if (!response.ok) {
        throw new Error(`Failed to fetch meta: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.meta || data;
    } catch (error) {
      throw new Error(`Failed to fetch meta: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async fetchStreams(type: string, id: string): Promise<StreamSource[]> {
    await this.loadManifest();
    
    if (!this.manifest?.resources.includes('stream')) {
      throw new Error('Addon does not support stream resource');
    }

    try {
      const response = await fetch(`${this.baseUrl}/stream/${type}/${id}.json`);
      if (!response.ok) {
        throw new Error(`Failed to fetch streams: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.streams || data || [];
    } catch (error) {
      throw new Error(`Failed to fetch streams: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async fetchSubtitles(type: string, id: string): Promise<Subtitle[]> {
    await this.loadManifest();
    
    if (!this.manifest?.resources.includes('subtitles')) {
      throw new Error('Addon does not support subtitles resource');
    }

    try {
      const response = await fetch(`${this.baseUrl}/subtitles/${type}/${id}.json`);
      if (!response.ok) {
        throw new Error(`Failed to fetch subtitles: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.subtitles || data || [];
    } catch (error) {
      throw new Error(`Failed to fetch subtitles: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  getManifest(): AddonManifest | null {
    return this.manifest;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }
}