import assert from "node:assert/strict";
import { QueryClient, QueryObserver } from "@tanstack/react-query";
import { createServer } from "vite";

// 실제 API나 토큰을 전송하지 않고 앱의 queryOptions와 API 함수를 함께 검증합니다.
const originalFetch = globalThis.fetch;
const requests = [];
let failNext = false;
globalThis.fetch = async (input) => {
  const url = new URL(typeof input === "string" ? input : input.url ?? input);
  requests.push(url);
  if (failNext) {
    failNext = false;
    return new Response("{}", { status: 503 });
  }
  return Response.json(url.pathname.includes("/search/")
    ? { page: 1, results: [], total_pages: 0, total_results: 0 }
    : url.pathname.endsWith("/popular")
      ? { page: Number(url.searchParams.get("page")), results: [{ id: 1 }], total_pages: 2, total_results: 2 }
      : { id: Number(url.pathname.split("/").at(-1)), title: "테스트 영화" });
};

const server = await createServer({
  configFile: false,
  server: { middlewareMode: true },
  define: {
    "import.meta.env.VITE_TMDB_ACCESS_TOKEN": JSON.stringify("test-token"),
    "import.meta.env.VITE_TMDB_API_BASE_URL": JSON.stringify("https://example.test/3"),
    "import.meta.env.VITE_TMDB_USE_FETCH": JSON.stringify("false"),
  },
});
let client;
try {
  const { movieQueries } = await server.ssrLoadModule("/src/queries/movie-queries.ts");
  const { queryClient } = await server.ssrLoadModule("/src/lib/query-client.ts");
  client = new QueryClient({ defaultOptions: queryClient.getDefaultOptions() });
  const popular = movieQueries.popular(1);
  await Promise.all([client.fetchQuery(popular), client.fetchQuery(popular)]);
  assert.equal(requests.length, 1, "동시 요청은 하나로 합쳐져야 합니다.");
  await client.fetchQuery(popular);
  assert.equal(requests.length, 1, "fresh 목록은 네트워크 요청 없이 재사용해야 합니다.");
  const listObserver = new QueryObserver(client, popular);
  const unmountList = listObserver.subscribe(() => {});
  assert.equal(listObserver.getCurrentResult().status, "success");
  assert.equal(listObserver.getCurrentResult().fetchStatus, "idle");
  unmountList();
  const reopenedList = new QueryObserver(client, popular);
  const unmountReopenedList = reopenedList.subscribe(() => {});
  assert.equal(reopenedList.getCurrentResult().status, "success");
  assert.equal(reopenedList.getCurrentResult().fetchStatus, "idle");
  assert.equal(requests.length, 1, "화면을 다시 구독해도 fresh 캐시를 재사용해야 합니다.");
  unmountReopenedList();
  await client.fetchQuery(movieQueries.popular(2));
  assert.equal(requests.at(-1).searchParams.get("page"), "2");
  await client.fetchQuery(movieQueries.detail("1"));
  await client.fetchQuery(movieQueries.detail("2"));
  await client.fetchQuery(movieQueries.detail("1"));
  assert.equal(requests.length, 4, "페이지와 영화별 캐시는 분리되어야 합니다.");
  await client.fetchQuery(movieQueries.search(" Batman "));
  await client.fetchQuery(movieQueries.search("batman"));
  assert.equal(requests.length, 5, "정규화된 같은 검색어는 캐시를 공유해야 합니다.");
  assert.equal(requests.at(-1).searchParams.get("query"), "batman");
  assert.deepEqual(client.getQueryData(movieQueries.search("batman").queryKey).results, []);
  const observer = new QueryObserver(client, movieQueries.search("   "));
  const unsubscribe = observer.subscribe(() => {});
  assert.equal(observer.getCurrentResult().fetchStatus, "idle");
  assert.equal(observer.getCurrentResult().isPending, true);
  assert.equal(observer.getCurrentResult().isLoading, false);
  assert.equal(requests.length, 5, "빈 검색어로는 요청하지 않아야 합니다.");
  unsubscribe();
  await client.invalidateQueries({ queryKey: popular.queryKey });
  await client.fetchQuery(popular);
  assert.equal(requests.length, 6, "무효화된 캐시는 재조회해야 합니다.");
  failNext = true;
  await assert.rejects(client.fetchQuery(movieQueries.detail("503")));
  assert.equal(client.getQueryState(movieQueries.detail("503").queryKey).status, "error");
  await client.fetchQuery(movieQueries.detail("503"));
  assert.equal(client.getQueryState(movieQueries.detail("503").queryKey).status, "success");
  assert.equal(requests.length, 8, "실패 후 수동 재시도로 복구해야 합니다.");
  console.log("통과: 요청 중복 제거, fresh 캐시·화면 재구독, 페이지·상세 분리, 검색 정규화·빈 결과·enabled 상태, 무효화, 오류 후 재시도");
} finally {
  client?.clear();
  await server.close();
  globalThis.fetch = originalFetch;
}
