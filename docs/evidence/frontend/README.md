# TanStack Query 필수 미션 첨부 자료

## 확인한 결과

실제 프로젝트의 `movieQueries`와 TMDB 요청 함수를 사용하되, HTTP 응답은 테스트용으로 대체하여 검증했다. 이 자료는 자동 검증 결과이며 실제 TMDB 호출이나 브라우저 Query Devtools·Network 화면의 캡처가 아니다.

| 단계 | 누적 HTTP 요청 수 | 확인 결과 |
| --- | ---: | --- |
| 같은 목록을 동시에 요청 | 1 | 중복 요청을 하나로 합침 |
| 같은 목록 재조회 및 구독 해제 후 재구독 | 1 | fresh 캐시 재사용, 추가 요청 없음 |
| 목록 2페이지·상세 1·상세 2·상세 1 재조회 | 4 | 페이지·영화 ID별 캐시 분리, 같은 상세는 재사용 |
| 같은 검색어 재검색 및 빈 검색어 | 5 | 검색어 정규화, 빈 결과 저장, 빈 검색어 요청 차단 |
| 목록 캐시 무효화 후 재조회 | 6 | 새로운 HTTP 요청 실행 |
| 상세 요청 실패 | 7 | 503 응답 후 error 상태 |
| 실패한 요청 재시도 | 8 | success 상태로 복구 |

설정은 `staleTime` 5분, `gcTime` 30분이다.

- [자동 검증 이미지 보고서](query-cache-proof.png)
- [단계별 요청 수와 실제 캐시 내용(JSON)](query-cache-results.json)
- [검증 실행 로그](test-output.txt)

## 핵심 코드

- [Provider와 개발자 도구](../../../src/main.tsx)
- [캐시 기본 설정](../../../src/lib/query-client.ts)
- [목록·검색·상세 queryOptions](../../../src/queries/movie-queries.ts)
- [목록 화면](../../../src/pages/movies/movie-list-page.tsx)
- [검색 화면](../../../src/pages/movies/search-page.tsx)
- [상세 화면](../../../src/pages/movies/movie-detail-page.tsx)
- [로딩·오류 안내](../../../src/components/movies/request-state.tsx)

실행: `node scripts/check-query-cache.mjs --evidence`

## 브라우저에서 별도로 캡처할 화면

1. React Query Devtools에서 `movies/popular`, `movies/search`, `movies/detail` 쿼리와 저장된 데이터가 보이는 화면.
2. Network의 Fetch/XHR에서 목록 최초 요청 후 **목록 → 상세 → 목록**으로 이동한 내역. 5분 이내 목록 재진입 시 popular 요청이 추가되지 않아야 한다. Preserve log를 켜고 앱 내부 링크로 이동한다.

새로고침하면 현재 메모리 캐시가 초기화되므로 재사용 확인 중에는 새로고침하지 않는다. Network 캡처에는 Authorization 헤더를 노출하지 않는다.
