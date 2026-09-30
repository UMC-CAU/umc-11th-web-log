import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "../../utils/cn";
export function Header() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  return <header className="border-b border-zinc-200 bg-white">
    <div className="mx-auto flex min-h-20 max-w-[1328px] items-center gap-7 px-6 sm:gap-10">
      <Link to="/" className="flex shrink-0 items-center gap-2 text-xl font-black tracking-tight text-zinc-950"><img src="/icons/movie.svg" alt="" className="size-8 rounded-lg border-2 border-zinc-950 p-1" />UMCine</Link>
      <nav aria-label="메인 메뉴" className="flex gap-5 text-sm">
        <Link to="/" aria-current={pathname === "/" ? "page" : undefined} className={cn("py-2 hover:text-blue-600", pathname === "/" || pathname.startsWith("/movies/") ? "font-bold text-zinc-900 underline underline-offset-4" : "text-zinc-500")}>영화</Link>
        <Link to="/search" search={{}} aria-current={pathname === "/search" ? "page" : undefined} className={cn("py-2 hover:text-blue-600", pathname === "/search" ? "font-bold text-zinc-900 underline underline-offset-4" : "text-zinc-500")}>검색</Link>
      </nav>
      <Link to="/search" search={{}} aria-label="영화 검색 열기" className="ml-auto rounded-md border border-zinc-200 p-2 hover:bg-zinc-100"><img src="/icons/search.svg" alt="" className="size-5" /></Link>
    </div>
  </header>;
}
