import { useQuery } from '@tanstack/react-query';
import { mediaService } from '../services/media';
import { MediaType, TimeWindow } from '../types';

export const useMedia = {
  useTrending: (mediaType?: MediaType, timeWindow?: TimeWindow) => 
    useQuery({
      queryKey: ['trending', mediaType, timeWindow],
      queryFn: () => mediaService.getTrending(mediaType, timeWindow),
      suspense: false,
      enabled: true,
    }),

  usePopular: (mediaType?: MediaType, page?: number) =>
    useQuery({
      queryKey: ['popular', mediaType, page],
      queryFn: () => mediaService.getPopular(mediaType, page),
      suspense: false,
      enabled: true,
    }),

  useDetails: (mediaType: MediaType, id: number) =>
    useQuery({
      queryKey: [mediaType, id],
      queryFn: () => mediaService.getDetails(mediaType, id),
      enabled: !!id,
      suspense: false,
    }),

  useSearch: (query: string, page?: number) =>
    useQuery({
      queryKey: ['search', query, page],
      queryFn: () => mediaService.search(query, page),
      enabled: !!query,
      suspense: false,
    }),

  useCombinedTrending: (timeWindow: TimeWindow = 'week', limit: number = 10) =>
    useQuery({
      queryKey: ['trending', 'combined', timeWindow],
      queryFn: async () => {
        const [movies = [], shows = []] = await Promise.all([
          mediaService.getTrending('movie', timeWindow).catch(() => []),
          mediaService.getTrending('tv', timeWindow).catch(() => [])
        ]);

        // Ensure we have a healthy mix by taking up to 10 of each initially
        const movieSlice = Array.isArray(movies) ? movies.slice(0, 10) : [];
        const showSlice = Array.isArray(shows) ? shows.slice(0, 10) : [];

        const mixed = [...movieSlice, ...showSlice]
          .sort(() => Math.random() - 0.5);

        return mixed.slice(0, limit);
      },
      suspense: false,
      enabled: true,
    }),

  useContentRating: (mediaType: MediaType, id: number) =>
    useQuery({
      queryKey: ['contentRating', mediaType, id],
      queryFn: () => mediaService.getContentRating(mediaType, id),
      enabled: !!id,
      suspense: false,
    }),
};
