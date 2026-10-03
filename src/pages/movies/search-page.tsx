import "./movie-pages.css";
import { useState, type SubmitEvent } from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { movies } from "../../data/movies";
import { cn } from "../../utils/cn";
import { BookmarkButton } from "../../components/movies/bookmark-button";

function SearchForm({ query, centered }: { query: string; centered: boolean }) {
  const [text, setText] = useState(query);
  const navigate = useNavigate({ from: "/search" });
  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextQuery = text.trim();
    void navigate({ search: nextQuery ? { query: nextQuery } : {} });
  }
  return (
    <form onSubmit={handleSubmit} role="search" className={cn(
      "movie-search-form",
      centered ? "movie-search-form--centered" : "",
    )}>
      <img src="/icons/search.svg" alt="" className="movie-search-icon" />
      <input aria-label="검색어" placeholder="예: 스파이더맨" value={text} onChange={(event) => setText(event.target.value)} className="movie-search-input" />
      <button type="submit" className="movie-search-submit">검색</button>
    </form>
  );
}
export function SearchPage() {
  const { query } = useSearch({ from: "/search" });
  const normalized = query?.trim().toLowerCase() ?? "";
  const results = normalized ? movies.filter((movie) => movie.title.toLowerCase().includes(normalized) || movie.originalTitle.toLowerCase().includes(normalized)) : [];
  return (
    <main className={cn("movie-search-page", normalized ? "" : "movie-search-page--empty")}>
      <h1 className={cn("movie-search-title", normalized ? "" : "")}>{normalized ? "영화 검색" : "어떤 영화를 찾고 있나요?"}</h1>
      <SearchForm key={query ?? ""} query={query ?? ""} centered={!normalized} />
      {!normalized ? <p className="movie-search-hint">검색어를 입력해 주세요.</p> : <>
        <div className="movie-search-summary">
          <h2 className="text-sm font-semibold">‘{query}’ 검색 결과</h2>
          <p className="text-xs text-zinc-500">영화 {results.length}편</p>
        </div>
        {results.length === 0 ? <div className="movie-search-empty-result"><p className="font-semibold text-zinc-700">검색 결과가 없어요.</p><p className="mt-3 text-sm text-zinc-400">다른 영화 제목이나 원제로 검색해 보세요.</p></div> :
          <ul className="movie-search-results">{results.map((movie) => <li key={movie.id} className="movie-search-result">
            <div className="movie-search-poster-card">
              <Link to="/movies/$movieId" params={{ movieId: String(movie.id) }} aria-label={`${movie.title} 상세 보기`} className="movie-search-poster-link"><img className="movie-search-poster" src={movie.posterPath} alt={`${movie.title} 포스터`} /></Link>
              <BookmarkButton movieId={movie.id} movieTitle={movie.title} variant="card" />
            </div>
            <div className="movie-search-result-body">
              <h3 className="movie-search-result-title"><Link to="/movies/$movieId" params={{ movieId: String(movie.id) }} className="hover:text-blue-600">{movie.title}</Link></h3>
              <p className="movie-search-original-title">{movie.originalTitle}</p>
              <time className="movie-search-date" dateTime={movie.releaseDate.replaceAll(".", "-")}>{movie.releaseDate}</time>
              <p className="movie-search-overview">{movie.overview}</p>
              <Link to="/movies/$movieId" params={{ movieId: String(movie.id) }} className="movie-search-detail-link">상세 보기 <span aria-hidden="true">→</span></Link>
            </div>
          </li>)}</ul>}
      </>}
    </main>
  );
}
