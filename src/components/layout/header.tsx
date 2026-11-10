import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "../../utils/cn";
export function Header() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  return <header className="border-b border-zinc-200 bg-white">
    <div className="mx-auto flex min-h-20 max-w-[1328px] flex-wrap items-center gap-x-4 gap-y-3 px-6 py-3 sm:flex-nowrap sm:gap-10 sm:py-0">
      <Link to="/" className="flex shrink-0 items-center gap-2 text-xl font-black tracking-tight text-zinc-950"><img src="/icons/movie.svg" alt="" className="size-8 rounded-lg border-2 border-zinc-950 p-1" />UMCine</Link>
      <nav aria-label="메인 메뉴" className="order-last flex w-full gap-5 text-sm sm:order-none sm:w-auto">
        <Link to="/" aria-current={pathname === "/" ? "page" : undefined} className={cn("py-2 hover:text-blue-600", pathname === "/" || pathname.startsWith("/movies/") ? "font-bold text-zinc-900 underline underline-offset-4" : "text-zinc-500")}>영화</Link>
        <Link to="/search" search={{}} aria-current={pathname === "/search" ? "page" : undefined} className={cn("py-2 hover:text-blue-600", pathname === "/search" ? "font-bold text-zinc-900 underline underline-offset-4" : "text-zinc-500")}>검색</Link>
        <Link to="/account" aria-current={pathname === "/account" ? "page" : undefined} className={cn("py-2 hover:text-blue-600", pathname === "/account" ? "font-bold text-zinc-900 underline underline-offset-4" : "text-zinc-500")}>회원 정보</Link>
        <Link to="/profile" aria-current={pathname.startsWith("/profile") ? "page" : undefined} className={cn("py-2 hover:text-blue-600", pathname.startsWith("/profile") ? "font-bold text-zinc-900 underline underline-offset-4" : "text-zinc-500")}>내 정보</Link>
      </nav>
      <div className="relative ml-auto flex shrink-0 items-center gap-2">
        <Link to="/search" search={{}} aria-label="영화 검색 열기" className="rounded-md border border-zinc-200 p-2 hover:bg-zinc-100"><img src="/icons/search.svg" alt="" className="size-5" /></Link>
        <Link to="/login" className="flex h-[38px] items-center rounded-md bg-blue-600 px-4 text-xs font-bold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">로그인</Link>
      </div>
    </div>
  </header>;
}
