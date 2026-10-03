import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { sanitizeBookmarkIds } from "../utils/bookmark-storage";

interface BookmarkStore {
  bookmarkedMovieIds: number[];
  toggleBookmark: (movieId: number) => void;
}

export const useBookmarkStore = create<BookmarkStore>()(
  persist(
    (set) => ({
      bookmarkedMovieIds: [],
      toggleBookmark: (movieId) => {
        if (!Number.isInteger(movieId) || movieId <= 0) return;
        set((state) => ({
          bookmarkedMovieIds: state.bookmarkedMovieIds.includes(movieId)
            ? state.bookmarkedMovieIds.filter((id) => id !== movieId)
            : [...state.bookmarkedMovieIds, movieId],
        }));
      },
    }),
    {
      name: "umcine-bookmark-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        bookmarkedMovieIds: state.bookmarkedMovieIds,
      }),
      // 저장된 함수나 잘못된 ID가 현재 store를 덮어쓰지 않게 해요.
      merge: (persistedState, currentState) => {
        const savedIds = persistedState && typeof persistedState === "object"
          && "bookmarkedMovieIds" in persistedState
          ? persistedState.bookmarkedMovieIds : [];
        return { ...currentState, bookmarkedMovieIds: sanitizeBookmarkIds(savedIds) };
      },
    },
  ),
);
