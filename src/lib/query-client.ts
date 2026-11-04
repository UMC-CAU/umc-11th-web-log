import { QueryClient } from "@tanstack/react-query";

// 컴포넌트 렌더링과 무관하게 하나의 캐시를 유지합니다.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      retry: false,
    },
  },
});
