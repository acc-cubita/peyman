"use client";

import { FlaskConical, PencilLine } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { cx } from "@/lib/cx";
import { faNumber } from "@/lib/format";
import { login, type LoginState } from "../actions";

const inputClass =
  "h-12 w-full rounded-xl bg-silk px-4 text-center font-mono text-lg tracking-wider text-ink ring-1 ring-line focus:bg-surface focus:ring-2 focus:ring-board focus:outline-none aria-invalid:ring-2 aria-invalid:ring-signal";

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(login, { step: "mobile", next } satisfies LoginState);

  if (state.step === "mobile") {
    return (
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="next" value={state.next} />
        <label className="block space-y-2">
          <span className="text-sm font-medium">شماره موبایل</span>
          <input
            name="mobile"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            dir="ltr"
            required
            autoFocus
            defaultValue={state.mobile}
            placeholder="09xxxxxxxxx"
            aria-invalid={state.error ? true : undefined}
            aria-describedby={state.error ? "login-error" : undefined}
            className={inputClass}
          />
        </label>
        <Error message={state.error} />
        <button type="submit" name="intent" value="send" disabled={pending} className={buttonClass}>
          {pending ? "در حال ارسال کد…" : "دریافت کد تأیید"}
        </button>
      </form>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={state.next} />
      <input type="hidden" name="mobile" value={state.mobile} />
      <p className="flex flex-wrap items-center justify-between gap-2 text-sm leading-7">
        <span>
          کد ۵ رقمی به <span dir="ltr" className="font-mono font-medium">{state.mobile}</span> پیامک شد.
        </span>
        <button
          type="submit"
          name="intent"
          value="change"
          formNoValidate
          className="flex items-center gap-1 text-xs text-copper-deep hover:underline"
        >
          <PencilLine aria-hidden className="size-3.5" />
          ویرایش شماره
        </button>
      </p>

      {state.testCode && (
        <p className="flex items-start gap-2 rounded-xl bg-copper/10 px-3 py-2.5 text-xs leading-6 text-copper-deep">
          <FlaskConical aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span>
            حالت آزمایشی: سرویس پیامک هنوز تنظیم نشده و کد به‌جای پیامک اینجا نمایش داده می‌شود:{" "}
            <span dir="ltr" className="font-mono text-sm font-semibold">{state.testCode}</span>
          </span>
        </p>
      )}

      <label className="block space-y-2">
        <span className="text-sm font-medium">کد تأیید</span>
        <input
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          dir="ltr"
          maxLength={5}
          required
          autoFocus
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? "login-error" : undefined}
          className={cx(inputClass, "tracking-[0.5em]")}
        />
      </label>
      <Error message={state.error} />
      <button type="submit" name="intent" value="verify" disabled={pending} className={buttonClass}>
        {pending ? "در حال بررسی…" : "ورود"}
      </button>
      <ResendButton key={`${state.mobile}:${state.resendIn}:${state.testCode}`} seconds={state.resendIn ?? 0} pending={pending} />
    </form>
  );
}

const buttonClass = "h-12 w-full rounded-full bg-board font-medium text-silk hover:bg-board-deep disabled:opacity-70";

function Error({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p id="login-error" role="alert" className="text-sm leading-7 text-signal">
      {message}
    </p>
  );
}

/** Counts down before another code may be requested. */
function ResendButton({ seconds, pending }: { seconds: number; pending: boolean }) {
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setInterval(() => setLeft((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [seconds]);

  return (
    <button
      type="submit"
      name="intent"
      value="send"
      formNoValidate
      disabled={left > 0 || pending}
      className="w-full text-center text-sm text-copper-deep enabled:hover:underline disabled:text-muted"
    >
      {left > 0 ? `ارسال دوباره کد تا ${faNumber(left)} ثانیه دیگر` : "ارسال دوباره کد"}
    </button>
  );
}
