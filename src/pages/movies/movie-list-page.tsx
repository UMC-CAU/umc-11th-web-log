import { Pagination } from "../../components/movies/pagination";
import { MovieGrid } from "../../components/movies/movie-grid";
import { movies } from "../../data/movies";

export function MovieListPage() {
  return (
    <main className="mx-auto w-full max-w-[1328px] flex-1 px-6 py-8">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">영화 목록</h1>
      <MovieGrid movies={movies} />
      <Pagination />
    </main>
  );
}


