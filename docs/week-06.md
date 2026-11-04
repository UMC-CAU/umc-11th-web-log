# 6주차 — TanStack Query

## 핵심 키워드

### 1. 목록, 검색과 상세에 같은 query key를 쓰면 어떤 문제가 생길까요? 페이지 번호, 검색어와 영화 ID를 포함하는 이유도 함께 생각해 보세요.

query key는 서버에서 받은 데이터를 구분해서 보관하는 캐시 주소다. 서로 다른 요청에 같은 키를 사용하면 같은 데이터로 취급하므로, 목록 대신 상세 응답을 읽거나 검색어를 바꿨는데 이전 검색 결과를 보여 주는 문제가 생길 수 있다.

이 프로젝트에서는 다음처럼 요청 종류와 결과를 바꾸는 입력을 함께 넣었다.

| 요청 | query key | 구분하는 이유 |
| --- | --- | --- |
| 인기 영화 목록 | `["movies", "popular", page]` | 1페이지와 2페이지는 결과가 다르다. |
| 영화 검색 | `["movies", "search", normalizedQuery, page]` | 검색어와 페이지가 다르면 결과도 달라진다. |
| 영화 상세 | `["movies", "detail", movieId]` | 영화별 상세 정보를 따로 저장해야 한다. |

예를 들어 목록 1페이지에서 2페이지로 이동하면 2페이지의 키로 조회한다. 다시 1페이지로 돌아올 때는 1페이지 캐시가 남아 있고 fresh하다면 추가 요청 없이 재사용한다. 검색어는 요청과 키에 동일하게 `trim().toLowerCase()`를 적용하므로 `" Batman "`과 `"batman"`이 같은 캐시를 공유한다.

참고: [공식 Query Keys 문서](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys)

### 2. enabled: false인데도 isPending이 참일 수 있는 이유는 무엇이며, 이때 isLoading은 어떤 값일까요?

`isPending`은 아직 성공한 데이터가 없는 상태를 뜻한다. 요청을 실행하고 있다는 뜻은 아니다. 따라서 캐시가 없는 쿼리를 `enabled: false`로 만들면 `status: "pending"`, `fetchStatus: "idle"`이 된다.

이때 `isPending`은 `true`, `isFetching`은 `false`다. `isLoading`은 `isPending && isFetching`으로 계산하므로 `false`다. 이미 해당 키의 캐시 데이터가 있으면 비활성 쿼리도 성공 상태로 시작할 수 있으므로, `enabled: false`라고 해서 항상 pending인 것은 아니다.

이 프로젝트의 검색 화면은 검색어가 비어 있으면 요청을 비활성화하고, 로딩 문구 대신 “검색어를 입력해 주세요.”를 표시한다. 검색어가 생기면 요청을 시작한다. 자동 검증에서도 빈 검색어일 때 요청 횟수가 늘어나지 않고, `isPending: true`, `isLoading: false`인 것을 확인했다.

참고: [공식 Disabling/Pausing Queries 문서](https://tanstack.com/query/latest/docs/framework/react/guides/disabling-queries)

### 3. staleTime과 gcTime은 각각 언제부터 계산하며, 시간이 지난 뒤 캐시에 어떤 차이가 생길까요?

`staleTime`은 데이터를 성공적으로 가져오거나 갱신한 시점을 기준으로, 얼마 동안 최신 데이터로 취급할지를 정한다. 시간이 지나 stale이 되어도 캐시가 삭제되지는 않는다. 일반적인 기본 설정에서는 stale 쿼리의 화면이 다시 마운트되거나, 창이 다시 활성화되거나, 네트워크가 재연결될 때 백그라운드 재조회가 가능해진다. staleTime 만료 자체가 주기적인 요청을 발생시키는 것은 아니다.

`gcTime`은 해당 쿼리를 구독하는 화면이 모두 사라져 inactive가 된 뒤, 캐시를 얼마 동안 더 보관할지를 정한다. 사용하지 않는 상태로 시간이 지나면 캐시가 정리된다. 화면에서 계속 구독 중인 캐시는 gcTime이 지났다고 삭제되지 않는다.

현재 설정은 `staleTime: 5분`, `gcTime: 30분`이다. 목록을 조회한 뒤 1분 후 돌아오면 fresh 캐시를 재사용한다. 6분 후 돌아오되 inactive 상태로 30분이 지나지 않았다면 캐시를 먼저 보여 주고 재조회할 수 있다. 구독을 모두 해제한 상태에서 30분이 지나 캐시가 삭제되면 다시 진입할 때 최초 요청이 필요하다. 이 캐시는 메모리에 있으므로 브라우저 새로고침 뒤까지 보존되지는 않는다.

참고: [공식 Important Defaults 문서](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults)

### 4. 전역 기본값과 개별 useQuery의 staleTime은 어떤 기준으로 정하면 좋을까요?

데이터가 얼마나 자주 바뀌는지, 얼마나 최신이어야 하는지, 요청 비용은 어느 정도인지에 따라 정한다. 전역에는 앱에서 공통으로 사용하기 적절한 값을 두고, 갱신 주기가 다른 요청만 개별 옵션으로 조정하면 된다. 개별 쿼리의 staleTime은 해당 쿼리에서 전역 기본값보다 우선한다.

이 프로젝트는 목록·검색·상세를 오갈 때 같은 영화 데이터를 자주 다시 보므로 전역 staleTime을 5분으로 정했다. 영화 상세처럼 상대적으로 변경이 적은 데이터는 더 길게, 자주 바뀌는 순위나 실시간 정보는 더 짧게 정할 수 있다. 상세만 10분으로 바꾸려면 `movieQueries.detail`의 `queryOptions`에 `staleTime: 1000 * 60 * 10`을 추가하면 된다. 현재 구현에는 세 요청 모두 전역 5분 설정을 적용했다.

staleTime을 길게 설정해도 데이터 변경을 즉시 반영해야 할 때는 관련 키를 `invalidateQueries`로 무효화하거나 `refetch`로 다시 요청할 수 있다. gcTime은 최신 여부가 아니라 사용하지 않는 캐시의 보관 기간을 결정하므로 따로 판단한다.

참고: [공식 Important Defaults 문서](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults), [공식 Query Options 문서](https://tanstack.com/query/latest/docs/framework/react/guides/query-options)

## 필수 미션 기록

### 기존 영화 화면에 TanStack Query 적용하기

기존 `useEffect` 기반 `useRequest`를 제거하고, 목록·검색·상세 화면에서 `useQuery`로 서버 데이터를 조회하도록 변경했다. HTTP 요청은 기존 `src/api/tmdb.ts`의 ky/fetch 함수를 재사용하며, query function에서 받은 `signal`을 API 함수에 전달한다.

`src/main.tsx`에서 앱 전체를 `QueryClientProvider`로 감쌌다. `src/lib/query-client.ts`의 QueryClient는 컴포넌트 바깥에서 한 번 만들어 화면 이동이나 재렌더링 중에도 같은 캐시를 사용한다.

```ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      retry: false,
    },
  },
});
```

목록, 검색과 상세는 서로 다른 query key를 사용하고, 페이지 번호·정규화한 검색어·영화 ID를 포함한다. 검색은 빈 검색어일 때 `enabled: false`로 요청을 실행하지 않는다.

화면에서는 최초 로딩, 오류와 “다시 시도” 버튼, 빈 목록·검색 결과, 성공 결과를 구분한다. 캐시를 보여 주면서 백그라운드 재조회하는 경우에는 기존 결과를 유지하고 갱신 중이라는 안내를 표시한다. 재조회 실패 시에도 기존 데이터를 유지하며 오류와 재시도 버튼을 표시한다.

### 검증 결과

- `corepack pnpm test`: 앱에서 사용하는 queryOptions와 API 함수에 가짜 HTTP 응답을 연결하여 검증.
- 같은 키로 동시에 요청하면 실제 요청은 한 번만 실행됨.
- fresh 목록을 다시 조회하거나 observer를 해제한 뒤 다시 구독해도 추가 요청 없이 성공 데이터 재사용.
- 목록의 페이지 번호와 상세 영화 ID가 다르면 캐시를 별도로 사용.
- 공백·대소문자를 정규화한 같은 검색어는 캐시 공유, 빈 검색어는 요청하지 않음.
- 빈 검색 결과를 성공 응답으로 보관.
- 캐시 무효화 후 재조회 실행.
- 503 오류 이후 수동 재시도로 성공 상태 복구.
- `corepack pnpm lint`, `corepack pnpm build`로 정적 검사와 프로덕션 빌드 검증.

위 결과는 자동 검사 범위다. 실제 TMDB 응답 및 브라우저 Query Devtools·Network 패널을 통한 수동 관찰은 완료하지 않았으므로 관찰 결과로 기록하지 않았다.

### Query Devtools·Network 확인 절차

1. `.env.local`에 TMDB 토큰을 설정한 상태에서 `corepack pnpm dev`로 실행한다.
2. 브라우저 개발자 도구의 Network 탭을 열고 `Preserve log`를 켠다. 목록에 진입해 `movie/popular` 요청을 확인한다.
3. 화면의 React Query Devtools 버튼을 눌러 `["movies", "popular", 1]` 쿼리와 fresh 상태를 확인한다. Devtools는 개발 모드에만 표시된다.
4. 목록에서 영화 상세로 이동하면 해당 영화 ID의 detail 쿼리가 생성되는지 확인한다.
5. 5분 이내 목록으로 돌아왔을 때 목록은 즉시 표시되고 `movie/popular` 요청이 추가되지 않는지 확인한다. 브라우저 새로고침 대신 앱 안의 링크로 이동한다.
6. 검색어를 입력하고 검색한 뒤 다른 화면으로 이동했다가 같은 검색어로 검색한다. 5분 이내에는 search 캐시를 재사용하는지 확인한다.
7. 빈 검색어 화면에서는 `/search/movie` 요청이 발생하지 않는지 확인한다.

## 선택 미션 기록

`src/queries/movie-queries.ts`에 `queryOptions`를 이용해 목록·검색·상세의 query key와 query function을 분리했다. 각 화면은 `useQuery(movieQueries.popular(page))`, `useQuery(movieQueries.search(query))`, `useQuery(movieQueries.detail(movieId))`로 호출한다. 쿼리 정의를 자동 검증에서도 그대로 사용하므로 화면과 검증 코드가 같은 키 및 요청 함수를 참조한다.
