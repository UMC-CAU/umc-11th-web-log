import { useState, type SubmitEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ProfilePreviewNote } from "../../components/account/profile-preview-note";
import { useProfilePreviewStore } from "../../stores/profile-preview-store";

export function ProfileEditPage() {
  const profile = useProfilePreviewStore((state) => state.profile);
  const updateProfile = useProfilePreviewStore((state) => state.updateProfile);
  const [form, setForm] = useState({ ...profile });
  const navigate = useNavigate();
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
  const isNicknameValid = form.nickname.trim().length >= 2 && form.nickname.trim().length <= 12;
  const isChanged = form.email.trim() !== profile.email || form.nickname.trim() !== profile.nickname;
  const canSave = isEmailValid && isNicknameValid && isChanged;

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSave) return;
    updateProfile({ email: form.email.trim(), nickname: form.nickname.trim() });
    void navigate({ to: "/profile" });
  };
  const inputClass = "h-11 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 aria-invalid:border-red-500";
  return (
    <main className="mx-auto w-full max-w-[640px] flex-1 px-6 py-12 sm:py-16">
      <Link to="/profile" className="mb-6 inline-block text-xs text-zinc-500 hover:text-blue-600">← 내 정보로 돌아가기</Link>
      <h1 className="text-[30px] font-bold tracking-tight text-zinc-900">내 정보 수정</h1>
      <p className="mt-2 text-sm text-zinc-500">변경할 정보를 입력한 뒤 저장해 주세요.</p>
      <form onSubmit={handleSubmit} noValidate className="my-7 space-y-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <div>
          <label htmlFor="profile-email" className="mb-2 block text-xs font-bold">이메일</label>
          <input id="profile-email" name="email" type="email" autoComplete="email" required value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            aria-invalid={!isEmailValid} aria-describedby={!isEmailValid ? "profile-email-error" : undefined} className={inputClass} />
          {!isEmailValid && <p id="profile-email-error" className="mt-1.5 text-xs text-red-600">올바른 이메일 주소를 입력해 주세요.</p>}
        </div>
        <div>
          <label htmlFor="profile-nickname" className="mb-2 block text-xs font-bold">닉네임</label>
          <input id="profile-nickname" name="nickname" autoComplete="nickname" required value={form.nickname}
            onChange={(event) => setForm((prev) => ({ ...prev, nickname: event.target.value }))}
            aria-invalid={!isNicknameValid} aria-describedby="profile-nickname-help" className={inputClass} />
          <p id="profile-nickname-help" className={`mt-1.5 text-xs ${isNicknameValid ? "text-zinc-500" : "text-red-600"}`}>닉네임은 2~12자로 입력해 주세요.</p>
        </div>
        <div className="flex gap-3 pt-2">
          <Link to="/profile" className="flex h-11 flex-1 items-center justify-center rounded-lg border border-slate-200 text-sm font-bold text-zinc-600 hover:bg-zinc-50">취소</Link>
          <button type="submit" disabled={!canSave} className="h-11 flex-1 rounded-lg bg-blue-600 text-sm font-bold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50">저장하기</button>
        </div>
      </form>
      <ProfilePreviewNote />
    </main>
  );
}
