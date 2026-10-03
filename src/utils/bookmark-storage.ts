// 브라우저 저장값은 타입 선언과 별개로 실행 중에 검사해야 해요.
export function sanitizeBookmarkIds(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter(
    (id): id is number => typeof id === "number" && Number.isInteger(id) && id > 0,
  ))];
}
