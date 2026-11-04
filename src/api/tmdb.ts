import ky from "ky";
import type { TmdbMovieDetail, TmdbMovieResponse } from "../types/tmdb";

const baseUrl = (import.meta.env.VITE_TMDB_API_BASE_URL || "https://api.themoviedb.org/3").replace(/\/$/, "");
function token() {
  const value = import.meta.env.VITE_TMDB_ACCESS_TOKEN;
  if (!value) throw new Error("TMDB 토큰이 없어요. .env.local 설정을 확인해 주세요.");
  return value;
}

// 순수 fetch 연습: Network 탭에서 movie/popular 요청과 응답을 확인합니다.
export async function fetchPopularMovies(page = 1, signal?: AbortSignal): Promise<TmdbMovieResponse> {
  const url = new URL(`${baseUrl}/movie/popular`);
  url.search = new URLSearchParams({ language: "ko-KR", page: String(page) }).toString();
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token()}`, Accept: "application/json" }, signal });
  if (!response.ok) throw new Error(`영화 요청에 실패했어요. (HTTP ${response.status})`);
  return response.json() as Promise<TmdbMovieResponse>;
}

const tmdb = ky.create({ retry: 0 });
function options(signal?: AbortSignal) { return { headers: { Authorization: `Bearer ${token()}` }, signal }; }
export function getPopularMovies(page: number, signal?: AbortSignal) {
  return tmdb.get(`${baseUrl}/movie/popular`, { ...options(signal), searchParams: { language: "ko-KR", page } }).json<TmdbMovieResponse>();
}
export function searchMovies(query: string, page: number, signal?: AbortSignal) {
  return tmdb.get(`${baseUrl}/search/movie`, { ...options(signal), searchParams: { language: "ko-KR", query, page, include_adult: false } }).json<TmdbMovieResponse>();
}
export function getMovieDetail(id: string, signal?: AbortSignal) {
  return tmdb.get(`${baseUrl}/movie/${encodeURIComponent(id)}`, { ...options(signal), searchParams: { language: "ko-KR" } }).json<TmdbMovieDetail>();
}
