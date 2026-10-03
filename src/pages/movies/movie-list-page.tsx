import { Pagination } from "../../components/movies/pagination";
import { MovieGrid } from "../../components/movies/movie-grid";
import { useMovies } from "../../utils/movie-context";

export function MovieListPage() {
  const { movies, onToggleBookmark } = useMovies();
  return (
    <main className="mx-auto w-full max-w-[1328px] flex-1 px-6 py-8">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">영화 목록</h1>
      <MovieGrid movies={movies} onToggleBookmark={onToggleBookmark} />
      <Pagination />
    </main>
  );
}


