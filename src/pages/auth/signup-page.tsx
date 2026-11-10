import { useState, type SubmitEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { checkEmailDuplicate } from "../../api/members/check-email-duplicate";
import { checkNicknameDuplicate } from "../../api/members/check-nickname-duplicate";
import { signup } from "../../api/members/signup";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{8,}$/;
const DEFAULT_FORM = { email: "", nickname: "", password: "", passwordConfirm: "" };
type DefaultFormKey = keyof typeof DEFAULT_FORM;
type DefaultFormValue = (typeof DEFAULT_FORM)[DefaultFormKey];
const DEFAULT_DUPLICATE_CHECK = {
  isChecking: false,
  isAvailable: false,
};
type DuplicateCheckKey = "email" | "nickname";

export function SignupPage() {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const [duplicateCheck, setDuplicateCheck] = useState({
    email: DEFAULT_DUPLICATE_CHECK,
    nickname: DEFAULT_DUPLICATE_CHECK,
  });
  const isEmailValid = EMAIL_REGEX.test(form.email.trim());
  const isNicknameValid = form.nickname.trim().length >= 2 && form.nickname.trim().length <= 12;
  const isPasswordValid = PASSWORD_REGEX.test(form.password);
  const isPasswordConfirmValid = form.passwordConfirm.length > 0 && form.password === form.passwordConfirm;
  const showPasswordError = form.password.length > 0 && !isPasswordValid;
  const showPasswordConfirmError = form.passwordConfirm.length > 0 && !isPasswordConfirmValid;

  const isFormValid = isEmailValid && isNicknameValid && isPasswordValid && isPasswordConfirmValid;
  // 입력 조건과 두 중복 확인을 모두 통과해야 제출 가능
  const canSubmit =
    isFormValid &&
    duplicateCheck.email.isAvailable &&
    duplicateCheck.nickname.isAvailable;

  const handleChangeField = (key: DefaultFormKey, value: DefaultFormValue) => {
    if (key === "email" || key === "nickname") {
      if (duplicateCheck[key].isChecking) return;
      // 확인한 값을 바꾸면 다시 중복 확인해야 함
      setDuplicateCheck((prev) => ({ ...prev, [key]: DEFAULT_DUPLICATE_CHECK }));
    }
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleCheckDuplicate = async (key: DuplicateCheckKey) => {
    const isValid = key === "email" ? isEmailValid : isNicknameValid;
    if (!isValid || duplicateCheck[key].isChecking) return;

    const label = key === "email" ? "이메일" : "닉네임";
    setDuplicateCheck((prev) => ({
      ...prev,
      [key]: { isChecking: true, isAvailable: false },
    }));

    try {
      const response =
        key === "email"
          ? await checkEmailDuplicate(form.email.trim())
          : await checkNicknameDuplicate(form.nickname.trim());
      const isAvailable = response.available;
      setDuplicateCheck((prev) => ({
        ...prev,
        [key]: { ...prev[key], isAvailable },
      }));
      alert(
        isAvailable
          ? `사용할 수 있는 ${label}이에요.`
          : `이미 사용 중인 ${label}이에요.`,
      );
    } catch {
      setDuplicateCheck((prev) => ({
        ...prev,
        [key]: { ...prev[key], isAvailable: false },
      }));
      alert("중복 확인에 실패했어요. 다시 시도해 주세요.");
    } finally {
      setDuplicateCheck((prev) => ({
        ...prev,
        [key]: { ...prev[key], isChecking: false },
      }));
    }
  };

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await signup({
        email: form.email.trim(),
        nickname: form.nickname.trim(),
        password: form.password,
      });
      alert(response.message);
      if (response.isSuccess) void navigate({ to: "/login" });
    } catch {
      alert("회원가입에 실패했어요. 다시 시도해 주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "h-11 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 aria-invalid:border-red-500";
  const labelClass = "mb-1.5 block text-xs font-bold text-zinc-900";

  return (
    <main className="flex min-h-[calc(100svh-80px)] flex-1 items-center justify-center px-6 py-14 sm:py-20">
      <section aria-labelledby="signup-heading" className="w-full max-w-[360px]">
        <h1 id="signup-heading" className="mb-5 text-[30px] font-bold tracking-tight text-zinc-900">회원가입</h1>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {(["email", "nickname"] as const).map((key) => {
            const label = key === "email" ? "이메일" : "닉네임";
            const valid = key === "email" ? isEmailValid : isNicknameValid;
            const showError = form[key].length > 0 && !valid;
            const check = duplicateCheck[key];
            const message = showError
              ? key === "email" ? "올바른 이메일 주소를 입력해 주세요." : "닉네임은 2~12자로 입력해 주세요."
              : check.isChecking ? "중복 여부를 확인하고 있어요."
              : check.isAvailable ? `사용할 수 있는 ${label}이에요.` : "";
            return (
              <div key={key}>
                <label htmlFor={`signup-${key}`} className={labelClass}>{label}</label>
                <div className="relative">
                  <input
                    id={`signup-${key}`} name={key} type={key === "email" ? "email" : "text"}
                    autoComplete={key === "email" ? "email" : "nickname"} required
                    value={form[key]} onChange={(event) => handleChangeField(key, event.target.value)}
                    disabled={check.isChecking}
                    placeholder={key === "email" ? "name@example.com" : "2–12자"}
                    aria-invalid={showError}
                    aria-describedby={message ? `signup-${key}-message` : undefined}
                    className={`${inputClass} pr-24`}
                  />
                  <button type="button" onClick={() => void handleCheckDuplicate(key)}
                    disabled={!valid || check.isChecking} aria-label={`${label} 중복 확인`}
                    className="absolute inset-y-1 right-1 rounded-md px-3 text-xs font-bold text-blue-600 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50">
                    {check.isChecking ? "확인 중" : "중복 확인"}
                  </button>
                </div>
                <p id={`signup-${key}-message`} role="status" className={`mt-1 text-xs ${showError ? "text-red-600" : "text-blue-600"}`}>{message}</p>
              </div>
            );
          })}
          <div>
            <label htmlFor="signup-password" className={labelClass}>비밀번호</label>
            <input id="signup-password" name="password" type="password" autoComplete="new-password" required
              value={form.password} onChange={(event) => handleChangeField("password", event.target.value)}
              placeholder="8자 이상" aria-invalid={showPasswordError} aria-describedby="signup-password-help" className={inputClass} />
            <p id="signup-password-help" className={`mt-1.5 text-[10px] leading-4 ${showPasswordError ? "text-red-600" : "text-slate-400"}`}>
              영문 대소문자, 숫자, 특수문자(!@#$%^&amp;*)를 모두 포함해 8자 이상 입력해 주세요
            </p>
          </div>
          <div>
            <label htmlFor="signup-password-confirm" className={labelClass}>비밀번호 확인</label>
            <input id="signup-password-confirm" name="passwordConfirm" type="password" autoComplete="new-password" required
              value={form.passwordConfirm} onChange={(event) => handleChangeField("passwordConfirm", event.target.value)}
              placeholder="다시 입력" aria-invalid={showPasswordConfirmError}
              aria-describedby={showPasswordConfirmError ? "signup-password-confirm-error" : undefined} className={inputClass} />
            {showPasswordConfirmError && <p id="signup-password-confirm-error" role="status" className="mt-1 text-xs text-red-600">비밀번호가 일치하지 않아요.</p>}
          </div>
          <button type="submit" disabled={!canSubmit || isSubmitting} className="h-11 w-full rounded-lg bg-blue-600 text-xs font-bold text-white transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:bg-blue-600/60">
            {isSubmitting ? "가입 중" : "가입하기"}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-slate-500">
          이미 계정이 있나요?{" "}
          <Link to="/login" className="font-bold text-blue-600 hover:underline focus-visible:outline-2 focus-visible:outline-blue-600">로그인</Link>
        </p>
      </section>
    </main>
  );
}
