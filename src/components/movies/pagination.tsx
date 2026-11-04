export function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (page: number) => void }) {
  return <nav className="mt-7 flex items-center justify-center gap-2" aria-label="영화 목록 페이지">
    <button type="button" aria-label="이전 페이지" disabled={page <= 1} onClick={() => onChange(page - 1)} className="grid size-8 place-items-center disabled:opacity-30"><img src="/icons/chevron-left.svg" alt="" className="size-5" /></button>
    <span className="grid min-w-8 place-items-center rounded bg-zinc-900 px-2 py-1 text-sm text-white" aria-current="page">{page}</span>
    <button type="button" aria-label="다음 페이지" disabled={page >= Math.min(totalPages, 500)} onClick={() => onChange(page + 1)} className="grid size-8 place-items-center disabled:opacity-30"><img src="/icons/chevron-right.svg" alt="" className="size-5" /></button>
  </nav>;
}
