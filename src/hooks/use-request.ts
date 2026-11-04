import { useEffect, useState } from "react";

type RequestState<T> = { key: string; status: "loading" } | { key: string; status: "success"; data: T } | { key: string; status: "error"; error: string };
export function useRequest<T>(key: string, request: (signal: AbortSignal) => Promise<T>) {
  const [attempt, setAttempt] = useState(0);
  const requestKey = `${key}:${attempt}`;
  const [state, setState] = useState<RequestState<T>>({ key: requestKey, status: "loading" });
  useEffect(() => {
    const controller = new AbortController();
    Promise.resolve().then(() => request(controller.signal)).then(
      (data) => { if (!controller.signal.aborted) setState({ key: requestKey, status: "success", data }); },
      (error: unknown) => { if (!controller.signal.aborted) setState({ key: requestKey, status: "error", error: error instanceof Error ? error.message : "요청에 실패했어요." }); },
    );
    return () => controller.abort();
  }, [requestKey, request]);
  return { state: state.key === requestKey ? state : { key: requestKey, status: "loading" as const }, retry: () => setAttempt((value) => value + 1) };
}
