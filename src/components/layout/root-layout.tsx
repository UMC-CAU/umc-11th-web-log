import { Outlet } from "@tanstack/react-router";
import { Header } from "./header";

export function RootLayout() {
  return (
      <div className="flex min-h-screen flex-col bg-[#f5f6f8] font-sans text-slate-900 antialiased">
        <Header />
        <Outlet />
        <footer className="mt-16 border-t border-zinc-200 bg-white px-6 py-5"><div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-end gap-2 text-[10px] text-zinc-400"><img src="/images/logos/tmdb-logo.svg" alt="TMDB" className="h-3 w-auto" /><span>This product uses the TMDB API but is not endorsed or certified by TMDB.</span></div></footer>
      </div>
  );
}



