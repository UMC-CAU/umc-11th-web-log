import type { Movie } from "../../types/movie";
import { MovieCard } from "./movie-card";
interface MovieGridProps { movies: Movie[] }
export function MovieGrid({ movies }: MovieGridProps) {
  return <section aria-label="영화 목록" className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
    {movies.map((movie) => <MovieCard key={movie.id} movie={movie} />)}
  </section>;
}
