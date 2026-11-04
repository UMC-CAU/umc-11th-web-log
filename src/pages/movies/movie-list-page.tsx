import { useCallback } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { fetchPopularMovies, getPopularMovies } from "../../api/tmdb";
import { Pagination } from "../../components/movies/pagination";
import { MovieGrid } from "../../components/movies/movie-grid";
import { RequestState } from "../../components/movies/request-state";
import { useRequest } from "../../hooks/use-request";
import { toMovie } from "../../utils/movie-adapter";

export function MovieListPage() {
  const { page = 1 } = useSearch({ from: "/" });
  const navigate = useNavigate({ from: "/" });
  const request = useCallback((signal: AbortSignal) => (import.meta.env.VITE_TMDB_USE_FETCH === "true" ? fetchPopularMovies(page, signal) : getPopularMovies(page, signal)), [page]);
  const { state, retry } = useRequest(`popular:${page}`, request);
  return <main className="mx-auto w-full max-w-[1328px] flex-1 px-6 py-8">
    <h1 className="mb-6 text-3xl font-bold tracking-tight">영화 목록</h1>
    {state.status !== "success" ? <RequestState error={state.status === "error" ? state.error : undefined} retry={retry} /> : state.data.results.length === 0 ? <p className="py-12 text-center">영화가 없어요.</p> : <>
      <MovieGrid movies={state.data.results.map(toMovie)} />
      <Pagination page={page} totalPages={state.data.total_pages} onChange={(nextPage) => void navigate({ search: { page: nextPage } })} />
    </>}
  </main>;
}
