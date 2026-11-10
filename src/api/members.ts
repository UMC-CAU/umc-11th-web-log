import { HTTPError } from "ky";
import { apiClient } from "./api-client";

export { checkEmailDuplicate as checkEmail } from "./members/check-email-duplicate";
export { checkNicknameDuplicate as checkNickname } from "./members/check-nickname-duplicate";

export interface Rating { ratingId: number; movieId: number; score: number; comment: string | null; createdAt: string; updatedAt: string }

export async function getRatings(id: string): Promise<Rating[]> {
  try {
    return await apiClient.get(`members/${encodeURIComponent(id)}/ratings`).json<Rating[]>();
  } catch (error) {
    if (error instanceof HTTPError) {
      if (error.response.status === 404) throw new Error("회원을 찾을 수 없어요. 회원 번호를 확인해 주세요.", { cause: error });
      throw new Error(`요청에 실패했어요. (HTTP ${error.response.status})`, { cause: error });
    }
    throw error;
  }
}
