# UMCine 영화 목록

전체 프로젝트입니다. 압축을 풀고 package.json이 있는 umcine 폴더를 VS Code에서 여세요.

터미널에서 다음 명령을 순서대로 실행하세요.

```sh
pnpm install
pnpm dev
```

검사 명령: pnpm build / pnpm lint

CSS 가져오기 타입 인식을 위해 src/vite-env.d.ts에 Vite 타입 참조를 포함했습니다. tsconfig 파일, package.json, 잠금 파일, 영화 이미지와 아이콘을 함께 제공합니다. node_modules는 포함하지 않으므로 pnpm install이 필요합니다. 오류 표시가 남으면 TypeScript: Restart TS Server를 실행하세요.

영화 10편, 5열 목록, 검색과 상세 화면을 제공합니다. 4주차 필수 미션으로 북마크 상태를 Zustand에서 공유하고 localStorage에 저장합니다.

## 북마크 구현 방법

- `src/stores/bookmark-store.ts`: `bookmarkedMovieIds`와 추가/해제를 담당하는 `toggleBookmark`를 관리합니다. 이미 있는 ID를 누르면 제거하고, 없는 ID는 추가합니다.
- `persist`와 `createJSONStorage(() => localStorage)`로 저장·복원합니다. 저장 key는 `umcine-bookmark-store`이며 `partialize`로 영화 ID 배열만 저장합니다.
- `src/components/movies/bookmark-button.tsx`: selector로 현재 영화의 북마크 여부와 action을 읽습니다. 목록, 검색, 상세 화면 모두 이 버튼을 사용해서 같은 상태를 표시합니다.
- 기존 RootLayout의 `useState`와 MovieContext 방식은 제거했습니다. 검색 입력값 등 화면 내부 상태는 그대로 로컬 상태로 관리합니다.
- `src/utils/bookmark-storage.ts`: 복원하는 값에서 양의 정수 ID만 남기고 중복을 제거합니다. 잘못된 JSON은 persist의 오류 처리로 초기 빈 상태를 유지합니다.

저장값 예시:

```json
{"state":{"bookmarkedMovieIds":[1,2]},"version":0}
```

## 확인 결과와 제출 전 확인

- `pnpm build`, `pnpm lint` 통과.
- 실제 브라우저에서 두 편 북마크 → 새로고침 후 두 편 유지 확인.
- 목록에서 추가 → 상세에서 해제 → 검색에서 해제 상태 확인 → 검색에서 다시 추가 → 목록 반영 확인.
- 별도의 메모리 Storage를 사용한 store 실행 검사에서 저장 형식, 새 store 생성 후 복원, 저장값 삭제 후 빈 배열, 잘못된 JSON/ID 복구를 확인했습니다.
- 실제 브라우저 전체 재실행과 개발자 도구 Application 패널 조작은 자동 검증하지 못했습니다. 제출 전 아래 순서로 확인해 주세요.

1. `pnpm dev`로 실행한 주소에서 영화 두 편을 북마크합니다.
2. 개발자 도구의 **Application → Local storage → 현재 origin**에서 `umcine-bookmark-store`와 ID 배열을 확인합니다.
3. 브라우저를 완전히 종료한 뒤 같은 주소로 다시 열고 두 편의 북마크가 유지되는지 확인합니다.
4. 해당 key만 삭제한 뒤 새로고침하면 모든 북마크가 해제되어야 합니다. key 삭제만으로 현재 메모리 상태가 즉시 바뀌지는 않습니다.
5. `pnpm build`를 실행합니다.

참고: [Zustand persist 공식 문서](https://zustand.docs.pmnd.rs/reference/middlewares/persist)
