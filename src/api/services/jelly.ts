import axios from 'axios';

export interface JellyAudioTrack {
  language: string;
  label: string;
}

export interface JellyProvider {
  id: string;
  name: string;
}

export interface JellySource {
  url: string;
  type: 'mp4' | 'hls';
  quality: string;
  audioTracks?: JellyAudioTrack[];
  provider: JellyProvider;
}

export interface JellySubtitle {
  url: string;
  format: 'vtt';
  label: string;
}

export interface JellyResponse {
  responseId: string;
  expiresAt: string;
  sources: JellySource[];
  subtitles: JellySubtitle[];
}

const JELLY_API_BASE = 'https://jelly.up.railway.app/v1';

export const jellyService = {
  getMovieSources: async (tmdbId: string): Promise<JellyResponse> => {
    const response = await axios.get<JellyResponse>(`${JELLY_API_BASE}/movies/${tmdbId}`);
    return response.data;
  },

  getTVShowSources: async (tmdbId: string, season: number, episode: number): Promise<JellyResponse> => {
    const response = await axios.get<JellyResponse>(`${JELLY_API_BASE}/tv/${tmdbId}/seasons/${season}/episodes/${episode}`);
    return response.data;
  }
};
