export function Pagination() {
  return (
    <nav className="mt-7 flex items-center justify-center gap-2" aria-label="영화 목록 페이지">
      <button type="button" aria-label="이전 페이지" disabled className="grid size-8 place-items-center opacity-30"><img src="/icons/chevron-left.svg" alt="" className="size-5" /></button>
      <span className="grid size-8 place-items-center rounded bg-zinc-900 text-sm text-white" aria-current="page" aria-label="현재 1페이지">1</span>
      <button type="button" aria-label="다음 페이지" disabled className="grid size-8 place-items-center opacity-30"><img src="/icons/chevron-right.svg" alt="" className="size-5" /></button>
    </nav>
  );
}
