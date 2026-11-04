import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Pagination } from "../../components/movies/pagination";
import { MovieGrid } from "../../components/movies/movie-grid";
import { RequestState } from "../../components/movies/request-state";
import { movieQueries } from "../../queries/movie-queries";
import { toMovie } from "../../utils/movie-adapter";

export function MovieListPage() {
  const { page = 1 } = useSearch({ from: "/" });
  const navigate = useNavigate({ from: "/" });
  const { data, error, isPending, isFetching, refetch } = useQuery(movieQueries.popular(page));
  return <main className="mx-auto w-full max-w-[1328px] flex-1 px-6 py-8">
    <h1 className="mb-6 text-3xl font-bold tracking-tight">영화 목록</h1>
    {isPending ? <RequestState /> : !data ? <RequestState error={error?.message} retry={() => void refetch()} /> : <>
      {isFetching && <p role="status" className="mb-4 text-sm text-zinc-500">최신 영화 정보를 확인하는 중이에요...</p>}
      {error && <RequestState error={error.message} retry={() => void refetch()} />}
      {data.results.length === 0 ? <p className="py-12 text-center">영화가 없어요.</p> : <>
        <MovieGrid movies={data.results.map(toMovie)} />
        <Pagination page={page} totalPages={data.total_pages} onChange={(nextPage) => void navigate({ search: { page: nextPage } })} />
      </>}
    </>}
  </main>;
}
