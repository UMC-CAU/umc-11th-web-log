import { create } from "zustand";

interface ProfilePreview {
  email: string;
  nickname: string;
}

interface ProfilePreviewStore {
  profile: ProfilePreview;
  updateProfile: (profile: Partial<ProfilePreview>) => void;
}

// 퍼블리싱 확인용 상태입니다. 인증 정보와 비밀번호는 저장하지 않습니다.
export const useProfilePreviewStore = create<ProfilePreviewStore>((set) => ({
  profile: { email: "movie@example.com", nickname: "영화산책" },
  updateProfile: (profile) => set((state) => ({ profile: { ...state.profile, ...profile } })),
}));
