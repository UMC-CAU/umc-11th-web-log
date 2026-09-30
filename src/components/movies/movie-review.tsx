import { useState, type SubmitEvent } from "react";
import { cn } from "../../utils/cn";

interface Review { rating: number; comment: string }
function readReview(movieId: number): Review {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(`umcine:review:${movieId}`) ?? "null");
    if (saved && typeof saved === "object" && "rating" in saved && "comment" in saved &&
      typeof saved.rating === "number" && Number.isInteger(saved.rating) && saved.rating >= 1 && saved.rating <= 5 && typeof saved.comment === "string") {
      return { rating: saved.rating, comment: saved.comment };
    }
  } catch { /* 저장된 값이 없거나 잘못되어도 작성할 수 있습니다. */ }
  return { rating: 0, comment: "" };
}
export function MovieReview({ movieId }: { movieId: number }) {
  const [review, setReview] = useState(() => readReview(movieId));
  const [message, setMessage] = useState("");
  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!review.rating) { setMessage("별점을 선택해 주세요."); return; }
    try {
      localStorage.setItem(`umcine:review:${movieId}`, JSON.stringify(review));
      setMessage("이 브라우저에 평점을 저장했어요.");
    } catch { setMessage("저장하지 못했어요. 브라우저 저장 공간을 확인해 주세요."); }
  }
  return (
    <aside className="movie-review">
      <h2 className="text-xl font-bold">내 평점</h2>
      <p className="mt-2 text-xs text-zinc-400">별점을 주고, 짧게 기록해요.</p>
      <form onSubmit={handleSubmit} className="mt-4">
        <fieldset><legend className="sr-only">별점</legend>
          <div className="flex gap-2">{[1, 2, 3, 4, 5].map((rating) => <label key={rating} className="relative cursor-pointer">
            <input type="radio" name="rating" value={rating} checked={review.rating === rating} onChange={() => { setReview({ ...review, rating }); setMessage(""); }} aria-label={`${rating}점`} className="peer sr-only" />
            <span aria-hidden="true" className={cn("flex size-9 items-center justify-center rounded-md border border-zinc-200 bg-white text-2xl peer-focus-visible:ring-2 peer-focus-visible:ring-blue-600", rating <= review.rating ? "text-blue-600" : "text-zinc-400")}>★</span>
          </label>)}</div>
        </fieldset>
        <textarea aria-label="짧은 감상" maxLength={500} value={review.comment} onChange={(event) => { setReview({ ...review, comment: event.target.value }); setMessage(""); }} placeholder="영화를 보고 느낀 점을 남겨보세요." className="mt-4 min-h-28 w-full resize-y rounded-md border border-zinc-200 bg-white p-3 text-sm outline-blue-500 placeholder:text-zinc-400" />
        <button type="submit" className="mt-2 w-full cursor-pointer rounded-md bg-zinc-900 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700">평점 저장</button>
        <p role="status" className="mt-3 min-h-5 text-xs text-zinc-500">{message || "평점과 감상은 이 브라우저에만 저장돼요."}</p>
      </form>
    </aside>
  );
}
