import { createRootRoute, Link } from "@tanstack/react-router";
import { RootLayout } from "../components/layout/root-layout";
export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: () => <main className="mx-auto max-w-6xl px-6 py-20"><h1 className="text-2xl font-bold">페이지를 찾을 수 없어요.</h1><Link className="mt-6 inline-block text-blue-600" to="/">영화 목록으로</Link></main>,
});

