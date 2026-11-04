import type { Movie } from "../types/movie";
import type { TmdbMovie, TmdbMovieDetail } from "../types/tmdb";

const imageUrl = (path: string | null, size: string) => path ? `https://image.tmdb.org/t/p/${size}${path}` : "/images/movie-placeholder.svg";
export function toMovie(movie: TmdbMovie | TmdbMovieDetail): Movie {
  const detail = "genres" in movie ? movie : null;
  return {
    id: movie.id, title: movie.title || "제목 없음", originalTitle: movie.original_title,
    releaseDate: movie.release_date || "개봉일 미정", posterPath: imageUrl(movie.poster_path, "w500"),
    backdropPath: imageUrl(movie.backdrop_path, "w1280"), genres: detail?.genres.map((genre) => genre.name) ?? [],
    runtime: detail?.runtime ? `${detail.runtime}분` : "상영 시간 미정", tagline: detail?.tagline || "",
    overview: movie.overview || "줄거리 정보가 없어요.", isBookmarked: false,
  };
}
