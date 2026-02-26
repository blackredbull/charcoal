import { useQuery } from '@tanstack/react-query';
import { jellyService } from '../services/jelly';

interface UseJellySourcesProps {
  tmdbId: string;
  type: 'movie' | 'tv';
  season?: number;
  episode?: number;
  enabled?: boolean;
}

export const useJellySources = ({
  tmdbId,
  type,
  season,
  episode,
  enabled = true
}: UseJellySourcesProps) => {
  return useQuery({
    queryKey: ['jelly-sources', type, tmdbId, season, episode],
    queryFn: () => {
      if (type === 'movie') {
        return jellyService.getMovieSources(tmdbId);
      } else {
        if (season === undefined || episode === undefined) {
          throw new Error('Season and episode are required for TV shows');
        }
        return jellyService.getTVShowSources(tmdbId, season, episode);
      }
    },
    enabled: !!tmdbId && enabled && (type === 'movie' || (season !== undefined && episode !== undefined)),
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
