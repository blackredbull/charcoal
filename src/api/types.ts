export interface Movie {
  id: number;
  title: string;
  poster_path: string;
  backdrop_path: string;
  vote_average: number;
  release_date: string;
  overview: string;
  genre_ids: number[];
  genres?: { id: number; name: string }[];
  runtime: number;
  videos?: { results: any[] };
  similar?: { results: Movie[] };
  recommendations?: { results: Movie[] };
}

export interface TVShow {
  id: number;
  name: string;
  poster_path: string;
  backdrop_path: string;
  vote_average: number;
  first_air_date: string;
  overview: string;
  genre_ids: number[];
  genres?: { id: number; name: string }[];
  number_of_seasons?: number;
  seasons?: any[];
  videos?: { results: any[] };
  similar?: { results: TVShow[] };
  recommendations?: { results: TVShow[] };
}

export type MediaType = 'movie' | 'tv';
export type TimeWindow = 'day' | 'week';

export interface PaginatedResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}
