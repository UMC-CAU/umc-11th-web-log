import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { checkEmail, checkNickname, getRatings, type Rating } from "../../api/members";

type Status = { kind: "idle" } | { kind: "loading" } | { kind: "result"; available: boolean } | { kind: "error"; message: string };
function AvailabilityForm({ type }: { type: "nickname" | "email" }) {
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const label = type === "nickname" ? "닉네임" : "이메일";
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = value.trim();
    if (!query) return;
    setStatus({ kind: "loading" });
    try {
      const data = await (type === "nickname" ? checkNickname(query) : checkEmail(query));
      setStatus({ kind: "result", available: data.available });
    } catch {
      setStatus({ kind: "error", message: "확인하지 못했어요. 서버가 실행 중인지 확인해 주세요." });
    }
  }
  return <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white p-5">
    <label className="block text-sm font-bold" htmlFor={type}>{label} 중복 확인</label>
    <div className="mt-3 flex gap-2"><input id={type} type={type === "email" ? "email" : "text"} required value={value} onChange={(e) => { setValue(e.target.value); setStatus({ kind: "idle" }); }} placeholder={type === "nickname" ? "닉네임 입력" : "이메일 입력"} className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2" />
    <button disabled={status.kind === "loading"} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">확인</button></div>
    <p role="status" className="mt-3 min-h-5 text-sm text-slate-600">{status.kind === "loading" ? "확인하는 중..." : status.kind === "error" ? status.message : status.kind === "result" ? status.available ? `사용할 수 있는 ${label}이에요.` : `이미 사용 중인 ${label}이에요.` : ""}</p>
  </form>;
}
export function AccountPage() {
  const [memberId, setMemberId] = useState("1");
  const [loading, setLoading] = useState(false);
  const [ratings, setRatings] = useState<Rating[] | null>(null);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError(""); setRatings(null);
    try { setRatings(await getRatings(memberId)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "평점을 불러오지 못했어요."); }
    finally { setLoading(false); }
  }
  return <main className="mx-auto w-full max-w-[1000px] flex-1 px-6 py-8">
    <h1 className="text-3xl font-bold">회원 정보 확인</h1>
    <p className="mt-3 text-sm leading-6 text-slate-600">닉네임과 이메일의 사용 가능 여부를 확인하고 회원 번호로 평점을 조회할 수 있어요.</p>
    <div className="mt-7 grid gap-4 md:grid-cols-2"><AvailabilityForm type="nickname" /><AvailabilityForm type="email" /></div>
    <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5"><h2 className="text-lg font-bold">회원별 영화 평점</h2>
      <form onSubmit={submit} className="mt-3 flex flex-wrap items-end gap-2"><label htmlFor="memberId" className="text-sm font-medium">회원 번호</label><input id="memberId" type="number" min="1" required value={memberId} onChange={(e) => setMemberId(e.target.value)} className="w-24 rounded-md border border-slate-300 px-3 py-2" /><button disabled={loading} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">조회</button></form>
      {loading && <p role="status" className="mt-4 text-sm">평점을 불러오는 중이에요...</p>}
      {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
      {ratings && (ratings.length === 0 ? <p className="mt-4 text-sm text-slate-500">등록된 평점이 없어요.</p> : <ul className="mt-4 divide-y divide-slate-100">{ratings.map((rating) => <li key={rating.ratingId} className="py-3"><Link className="font-semibold text-blue-700 hover:underline" to="/movies/$movieId" params={{movieId: String(rating.movieId)}}>영화 #{rating.movieId}</Link><span className="ml-3 text-sm">★ {rating.score}점</span><p className="mt-1 text-sm text-slate-600">{rating.comment || "코멘트가 없어요."}</p></li>)}</ul>)}
    </section>
  </main>;
}
