import { useBookmarkStore } from "../../stores/bookmark-store";
import { cn } from "../../utils/cn";

interface BookmarkButtonProps {
  movieId: number;
  movieTitle: string;
  variant?: "card" | "detail";
}

export function BookmarkButton({ movieId, movieTitle, variant = "detail" }: BookmarkButtonProps) {
  const isBookmarked = useBookmarkStore((state) => state.bookmarkedMovieIds.includes(movieId));
  const toggleBookmark = useBookmarkStore((state) => state.toggleBookmark);
  const label = isBookmarked ? "북마크 해제" : "북마크 추가";

  return (
    <button
      type="button"
      aria-label={`${movieTitle} ${label}`}
      aria-pressed={isBookmarked}
      onClick={() => toggleBookmark(movieId)}
      className={cn(
        variant === "card"
          ? "absolute right-2 top-2 cursor-pointer rounded-md border border-white/60 p-1.5 text-xs text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          : "movie-detail-bookmark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500",
        variant === "card"
          ? isBookmarked ? "bg-blue-600" : "bg-black/60"
          : isBookmarked ? "movie-detail-bookmark--active" : "",
      )}
    >
      <img src={isBookmarked ? "/icons/bookmark.svg" : "/icons/bookmark-outline.svg"} alt="" className={cn("invert", variant === "card" ? "size-5" : "size-4")} />
      {variant !== "card" && label}
    </button>
  );
}
