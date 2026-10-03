import "./movie-pages.css";
import { MovieReview } from "../../components/movies/movie-review";
import { Link, useParams } from "@tanstack/react-router";
import { movies } from "../../data/movies";
import { BookmarkButton } from "../../components/movies/bookmark-button";

export function MovieDetailPage() {
  const { movieId } = useParams({ from: "/movies/$movieId" });
  const movie = movies.find((item) => item.id === Number(movieId));
  if (!movie) return <main className="mx-auto w-full max-w-[1328px] flex-1 px-6 py-20"><h1 className="text-2xl font-bold">영화를 찾을 수 없어요.</h1><Link to="/" className="mt-6 inline-block text-blue-600">영화 목록으로</Link></main>;
  return <main className="movie-detail-page">
    <section className="movie-detail-hero">
      <img src={movie.backdropPath} alt="" aria-hidden="true" className="movie-detail-backdrop" />
      <div className="movie-detail-shade" />
      <div className="movie-detail-hero-content">
        <Link to="/" className="movie-detail-back">〈 영화 목록</Link>
        <div className="movie-detail-heading">
          <h1 className="movie-detail-title">{movie.title}</h1>
          <p className="movie-detail-original-title">{movie.originalTitle}</p>
          <p className="movie-detail-meta"><time dateTime={movie.releaseDate.replaceAll(".", "-")}>{movie.releaseDate}</time> · {movie.genres.join(" · ")} · {movie.runtime}</p>
        </div>
      </div>
    </section>
    <section aria-label="영화 정보" className="movie-detail-info">
      <img src={movie.posterPath} alt={`${movie.title} 포스터`} className="movie-detail-poster" />
      <div className="movie-detail-description">
        <h2 className="movie-detail-tagline">{movie.tagline}</h2>
        <p className="movie-detail-overview">{movie.overview}</p>
        <BookmarkButton movieId={movie.id} variant="detail" />
      </div>
      <MovieReview key={movie.id} movieId={movie.id} />
    </section>
  </main>;
}


