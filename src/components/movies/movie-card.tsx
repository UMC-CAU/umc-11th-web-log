import { Link } from "@tanstack/react-router";
import type { Movie } from "../../types/movie";
import { cn } from "../../utils/cn";

interface MovieCardProps {
  movie: Movie;
  onToggleBookmark: (movieId: number) => void;
}
export function MovieCard({ movie, onToggleBookmark }: MovieCardProps) {
  return (
    <article className="min-w-0">
      <div className="relative overflow-hidden rounded-[10px] bg-slate-100">
        <Link to="/movies/$movieId" params={{ movieId: String(movie.id) }} aria-label={`${movie.title} 상세 보기`} className="block">
          <img className="block aspect-[2/3] w-full object-cover transition-transform duration-200 hover:scale-105" src={movie.posterPath} alt={`${movie.title} 포스터`} />
        </Link>
        <button type="button" className={cn(
          "absolute right-2 top-2 cursor-pointer rounded-md border border-white/60 p-1.5 text-xs text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500",
          movie.isBookmarked ? "bg-blue-600" : "bg-black/60",
        )} aria-label={`${movie.title} ${movie.isBookmarked ? "북마크 해제" : "북마크 추가"}`} aria-pressed={movie.isBookmarked} onClick={() => onToggleBookmark(movie.id)}>
          <img src={movie.isBookmarked ? "/icons/bookmark.svg" : "/icons/bookmark-outline.svg"} alt="" className="size-5 invert" />
        </button>
      </div>
      <h2 className="mt-2 text-sm leading-snug font-bold break-words"><Link to="/movies/$movieId" params={{ movieId: String(movie.id) }} className="hover:text-blue-600">{movie.title}</Link></h2>
      <time className="mt-1 block text-xs text-slate-500" dateTime={movie.releaseDate.replaceAll(".", "-")}>{movie.releaseDate}</time>
    </article>
  );
}


