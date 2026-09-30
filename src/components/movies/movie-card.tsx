import type { Movie } from "../../types/movie";
import { Link } from "@tanstack/react-router";

interface MovieCardProps {
  movie: Movie;
  onToggleBookmark: (movieId: number) => void;
}

export function MovieCard({ movie, onToggleBookmark }: MovieCardProps) {
  return (
    <article className="movie-card">
      <div className="poster-wrapper">

        <Link
          to="/movies/$movieId"
          params={{ movieId: String(movie.id) }}
        >
          <img
            className="movie-poster"
            src={movie.posterPath}
            alt={movie.title + " 포스터"}
          />
        </Link>

        <button
          type="button"
          className="bookmark-button"
          aria-label={
            movie.title +
            (movie.isBookmarked ? " 북마크 해제" : " 북마크 추가")
          }
          aria-pressed={movie.isBookmarked}
          onClick={() => onToggleBookmark(movie.id)}
        >
          <img
            src={
              movie.isBookmarked
                ? "/icons/bookmark.svg"
                : "/icons/bookmark-outline.svg"
            }
            alt=""
          />
        </button>
      </div>

      <Link
        to="/movies/$movieId"
        params={{ movieId: String(movie.id) }}
      >
        <h2>{movie.title}</h2>
      </Link>

      <time dateTime={movie.releaseDate.replaceAll(".", "-")}>
        {movie.releaseDate}
      </time>
    </article>
  );
}