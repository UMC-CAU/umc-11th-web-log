import { queryOptions } from "@tanstack/react-query";
import { fetchPopularMovies, getMovieDetail, getPopularMovies, searchMovies } from "../api/tmdb";

export function normalizeMovieSearch(query: string) {
  return query.trim().toLowerCase();
}

export const movieQueries = {
  popular: (page: number) => queryOptions({
    queryKey: ["movies", "popular", page],
    queryFn: ({ signal }) => import.meta.env.VITE_TMDB_USE_FETCH === "true"
      ? fetchPopularMovies(page, signal)
      : getPopularMovies(page, signal),
  }),
  search: (query: string, page = 1) => {
    const normalized = normalizeMovieSearch(query);
    return queryOptions({
      queryKey: ["movies", "search", normalized, page],
      queryFn: ({ signal }) => searchMovies(normalized, page, signal),
      enabled: normalized.length > 0,
    });
  },
  detail: (movieId: string) => queryOptions({
    queryKey: ["movies", "detail", movieId],
    queryFn: ({ signal }) => getMovieDetail(movieId, signal),
  }),
};
