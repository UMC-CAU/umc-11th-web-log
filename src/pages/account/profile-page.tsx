import { Link } from "@tanstack/react-router";
import { ProfilePreviewNote } from "../../components/account/profile-preview-note";
import { useProfilePreviewStore } from "../../stores/profile-preview-store";

export function ProfilePage() {
  const profile = useProfilePreviewStore((state) => state.profile);
  return (
    <main className="mx-auto w-full max-w-[640px] flex-1 px-6 py-12 sm:py-16">
      <p className="mb-2 text-xs font-bold tracking-widest text-blue-600">MY ACCOUNT</p>
      <h1 className="text-[30px] font-bold tracking-tight text-zinc-900">내 정보</h1>
      <p className="mt-2 text-sm text-zinc-500">내 프로필을 확인하고 원하는 정보로 수정하세요.</p>
      <section aria-label="회원 프로필" className="my-7 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
          <div aria-hidden="true" className="flex size-16 shrink-0 items-center justify-center rounded-full bg-blue-50 text-2xl font-bold text-blue-600">{Array.from(profile.nickname)[0]}</div>
          <div className="min-w-0"><p className="break-all text-xl font-bold">{profile.nickname}</p><p className="mt-1 text-xs text-zinc-500">나만의 영화 취향을 기록하는 중</p></div>
        </div>
        <dl className="space-y-6 py-6">
          <div><dt className="text-xs font-bold text-zinc-500">이메일</dt><dd className="mt-2 break-all text-sm text-zinc-900">{profile.email}</dd></div>
          <div><dt className="text-xs font-bold text-zinc-500">닉네임</dt><dd className="mt-2 break-all text-sm text-zinc-900">{profile.nickname}</dd></div>
        </dl>
        <Link to="/profile-edit" className="flex h-11 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">내 정보 수정</Link>
      </section>
      <ProfilePreviewNote />
      <Link to="/" className="mt-6 inline-block text-sm text-zinc-500 hover:text-blue-600">← 영화 둘러보기</Link>
    </main>
  );
}
