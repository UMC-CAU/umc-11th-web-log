const baseUrl = (import.meta.env.VITE_MEMBER_API_BASE_URL || "http://localhost:8080").replace(/\/$/, "");
export interface Rating { ratingId: number; movieId: number; score: number; comment: string | null; createdAt: string; updatedAt: string }
async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`);
  if (!response.ok) {
    if (response.status === 404) throw new Error("회원을 찾을 수 없어요. 회원 번호를 확인해 주세요.");
    throw new Error(`요청에 실패했어요. (HTTP ${response.status})`);
  }
  return response.json() as Promise<T>;
}
export const checkNickname = (value: string) => request<{ available: boolean }>(`/members/nickname/${encodeURIComponent(value)}`);
export const checkEmail = (value: string) => request<{ available: boolean }>(`/members/email/${encodeURIComponent(value)}`);
export const getRatings = (id: string) => request<Rating[]>(`/members/${encodeURIComponent(id)}/ratings`);
