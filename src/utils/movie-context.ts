import { createContext, useContext } from "react";
import type { Movie } from "../types/movie";

export const MovieContext = createContext<{
  movies: Movie[];
  onToggleBookmark: (movieId: number) => void;
} | null>(null);

export function useMovies() {
  const value = useContext(MovieContext);
  if (!value) throw new Error("MovieContext provider is missing");
  return value;
}
