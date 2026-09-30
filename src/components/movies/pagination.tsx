export function Pagination() {
  return (
    <nav className="pagination" aria-label="영화 목록 페이지">
      <button type="button" aria-label="이전 페이지" disabled>
        <img src="/icons/chevron-left.svg" alt="" />
      </button>
      <span className="current-page" aria-current="page" aria-label="현재 1페이지">1</span>
      <button type="button" aria-label="다음 페이지" disabled>
        <img src="/icons/chevron-right.svg" alt="" />
      </button>
    </nav>
  );
}
