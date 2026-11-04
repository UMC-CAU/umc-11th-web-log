export function RequestState({ error, retry }: { error?: string; retry?: () => void }) {
  if (!error) return <p role="status" className="py-12 text-center text-zinc-500">영화 정보를 불러오는 중이에요...</p>;
  return <div role="alert" className="py-12 text-center"><p>영화 정보를 불러오지 못했어요.</p><p className="mt-2 text-sm text-zinc-500">{error}</p><button type="button" onClick={retry} className="mt-4 rounded bg-zinc-900 px-4 py-2 text-white">다시 시도</button></div>;
}
