"use client";

import { useActionState } from "react";
import { login, type LoginState } from "../actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          رمز عبور
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          dir="ltr"
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? "password-error" : undefined}
          className="h-11 w-full rounded-xl bg-silk px-3.5 font-mono text-sm ring-1 ring-line focus:bg-surface focus:ring-2 focus:ring-board focus:outline-none"
        />
        {state.error && (
          <p id="password-error" role="alert" className="text-xs leading-6 text-signal">
            {state.error}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="h-11 w-full rounded-full bg-board font-medium text-silk hover:bg-board-deep disabled:opacity-70"
      >
        {pending ? "در حال ورود…" : "ورود"}
      </button>
    </form>
  );
}
