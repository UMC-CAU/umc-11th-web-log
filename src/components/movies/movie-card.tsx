import { Link } from "@tanstack/react-router";
import type { Movie } from "../../types/movie";
import { BookmarkButton } from "./bookmark-button";

interface MovieCardProps {
  movie: Movie;
}
export function MovieCard({ movie }: MovieCardProps) {
  return (
    <article className="min-w-0">
      <div className="relative overflow-hidden rounded-[10px] bg-slate-100">
        <Link to="/movies/$movieId" params={{ movieId: String(movie.id) }} aria-label={`${movie.title} 상세 보기`} className="block">
          <img className="block aspect-[2/3] w-full object-cover transition-transform duration-200 hover:scale-105" src={movie.posterPath} alt={`${movie.title} 포스터`} />
        </Link>
        <BookmarkButton movieId={movie.id} />
      </div>
      <h2 className="mt-2 text-sm leading-snug font-bold break-words"><Link to="/movies/$movieId" params={{ movieId: String(movie.id) }} className="hover:text-blue-600">{movie.title}</Link></h2>
      <time className="mt-1 block text-xs text-slate-500" dateTime={movie.releaseDate.replaceAll(".", "-")}>{movie.releaseDate}</time>
    </article>
  );
}


