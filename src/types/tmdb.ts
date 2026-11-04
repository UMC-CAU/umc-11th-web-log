export interface TmdbMovie {
  id: number; title: string; original_title: string; release_date: string;
  poster_path: string | null; backdrop_path: string | null; overview: string;
}
export interface TmdbMovieDetail extends TmdbMovie {
  genres: { id: number; name: string }[]; runtime: number | null; tagline: string;
}
export interface TmdbMovieResponse {
  page: number; results: TmdbMovie[]; total_pages: number; total_results: number;
}
