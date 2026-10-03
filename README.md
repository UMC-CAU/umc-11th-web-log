# UMCine 영화 목록

전체 프로젝트입니다. 압축을 풀고 package.json이 있는 umcine 폴더를 VS Code에서 여세요.

터미널에서 다음 명령을 순서대로 실행하세요.

```sh
pnpm install
pnpm dev
```

검사 명령: pnpm build / pnpm lint

CSS 가져오기 타입 인식을 위해 src/vite-env.d.ts에 Vite 타입 참조를 포함했습니다. tsconfig 파일, package.json, 잠금 파일, 영화 이미지와 아이콘을 함께 제공합니다. node_modules는 포함하지 않으므로 pnpm install이 필요합니다. 오류 표시가 남으면 TypeScript: Restart TS Server를 실행하세요.

영화 10편, 5열 목록, 개별 북마크 상태와 아이콘 전환을 구현했습니다. 북마크는 새로고침 시 초기화됩니다.

검증 범위: 필수 파일, 상대 import 대상, 이미지 경로 및 ZIP 내용 확인. 현재 실행 환경 제한으로 pnpm build, lint, 브라우저 동작 검증은 미완료입니다. Figma 세부 스타일 일치 여부도 미확인입니다.
