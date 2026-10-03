import { useBookmarkStore } from "../../stores/bookmark-store";
import { cn } from "../../utils/cn";
import "./bookmark-button.css";

interface BookmarkButtonProps {
  movieId: number;
  variant?: "card" | "detail";
}

export function BookmarkButton({ movieId, variant = "card" }: BookmarkButtonProps) {
  const isBookmarked = useBookmarkStore((state) => state.bookmarkedMovieIds.includes(movieId));
  const toggleBookmark = useBookmarkStore((state) => state.toggleBookmark);
  const label = isBookmarked ? "북마크 해제" : "북마크 추가";

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={isBookmarked}
      onClick={() => toggleBookmark(movieId)}
      className={cn(
        "bookmark-button",
        `bookmark-button--${variant}`,
        isBookmarked && "bookmark-button--active",
      )}
    >
      <img src={isBookmarked ? "/icons/bookmark.svg" : "/icons/bookmark-outline.svg"} alt="" className="bookmark-button__icon" />
      {variant !== "card" && label}
    </button>
  );
}
