import { Link } from "@tanstack/react-router";

export function Header() {
  return (
    <header className="site-header">
      <div className="header-inner">

        <Link
          className="brand"
          to="/"
          aria-label="UMCine 영화 목록"
        >
          <img src="/icons/movie.svg" alt="" />
          <span>UMCine</span>
        </Link>

        <nav className="main-nav" aria-label="주 메뉴">
          <Link to="/">영화</Link>

          <span>TV</span>
          <span>인물</span>
        </nav>

        <div className="header-actions">
          <Link
            to="/search"
            className="search-button"
            aria-label="검색"
          >
            <img src="/icons/search.svg" alt="" />
          </Link>

          <button
            type="button"
            className="login-button"
            disabled
          >
            로그인
          </button>
        </div>

      </div>
    </header>
  );
}