import { useState, type SubmitEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ProfilePreviewNote } from "../../components/account/profile-preview-note";
import { useProfilePreviewStore } from "../../stores/profile-preview-store";

export function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const updateProfile = useProfilePreviewStore((state) => state.updateProfile);
  const navigate = useNavigate();
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
  const isPasswordValid = form.password.length > 0;
  const emailError = (submitted || form.email.length > 0) && !isEmailValid;
  const passwordError = submitted && !isPasswordValid;

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    if (!isEmailValid || !isPasswordValid) return;
    updateProfile({ email: form.email.trim() });
    void navigate({ to: "/profile" });
  };

  const inputClass = "h-11 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 aria-invalid:border-red-500";
  return (
    <main className="flex min-h-[calc(100svh-80px)] flex-1 items-center justify-center px-6 py-14 sm:py-20">
      <section aria-labelledby="login-heading" className="w-full max-w-[360px]">
        <p className="mb-2 text-xs font-bold tracking-widest text-blue-600">UMCine</p>
        <h1 id="login-heading" className="text-[30px] font-bold tracking-tight text-zinc-900">로그인</h1>
        <p className="mb-7 mt-2 text-sm text-zinc-500">다시 만나 반가워요. 나만의 영화 기록을 이어가세요.</p>
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div>
            <label htmlFor="login-email" className="mb-1.5 block text-xs font-bold">이메일</label>
            <input id="login-email" name="email" type="email" autoComplete="email" required placeholder="name@example.com"
              value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              aria-invalid={emailError} aria-describedby={emailError ? "login-email-error" : undefined} className={inputClass} />
            {emailError && <p id="login-email-error" className="mt-1.5 text-xs text-red-600">올바른 이메일 주소를 입력해 주세요.</p>}
          </div>
          <div>
            <label htmlFor="login-password" className="mb-1.5 block text-xs font-bold">비밀번호</label>
            <div className="relative">
              <input id="login-password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required placeholder="비밀번호를 입력해 주세요"
                value={form.password} onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                aria-invalid={passwordError} aria-describedby={passwordError ? "login-password-error" : undefined} className={`${inputClass} pr-16`} />
              <button type="button" aria-controls="login-password" aria-pressed={showPassword} onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-1 right-1 rounded-md px-3 text-xs font-semibold text-zinc-500 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-blue-600">{showPassword ? "숨기기" : "보기"}</button>
            </div>
            {passwordError && <p id="login-password-error" className="mt-1.5 text-xs text-red-600">비밀번호를 입력해 주세요.</p>}
          </div>
          <button type="submit" disabled={!isEmailValid || !isPasswordValid}
            className="h-11 w-full rounded-lg bg-blue-600 text-sm font-bold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50">로그인</button>
        </form>
        <p className="my-5 text-center text-xs text-zinc-500">아직 계정이 없나요? <Link to="/signup" className="ml-1 font-bold text-blue-600 hover:underline">회원가입</Link></p>
        <ProfilePreviewNote />
        <Link to="/profile" className="mt-4 block text-center text-xs text-zinc-500 underline underline-offset-4">내 정보 화면 미리보기</Link>
      </section>
    </main>
  );
}
