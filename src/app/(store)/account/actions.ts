"use server";

import { refresh } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  allowCodeRequest,
  CUSTOMER_COOKIE,
  forgetFailedSend,
  issueLoginCode,
  newCustomerSession,
  requireCustomer,
  updateCustomerName,
  verifyLoginCode,
} from "@/lib/customer-auth";
import { toLatinDigits } from "@/lib/format";
import { sendLoginCode, smsMode } from "@/lib/sms";

export type LoginState = {
  step: "mobile" | "code";
  next: string;
  mobile?: string;
  error?: string;
  /** Seconds until another code may be requested. */
  resendIn?: number;
  /** Only in test mode, where no SMS is sent. */
  testCode?: string;
};

/** Only same-site paths, so the login page cannot bounce visitors elsewhere. */
function safeNext(value: unknown) {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\")
    ? value
    : "/account";
}

const mobileOf = (value: unknown) => toLatinDigits(String(value ?? "")).replace(/[\s-]/g, "");

export async function login(previous: LoginState, formData: FormData): Promise<LoginState> {
  const intent = formData.get("intent");
  const next = safeNext(formData.get("next"));

  if (intent === "change") return { step: "mobile", next, mobile: previous.mobile };
  if (!smsMode()) {
    return { ...previous, next, error: "ورود با شماره موبایل هنوز راه‌اندازی نشده است. لطفاً بعداً دوباره سر بزنید." };
  }

  if (intent === "send") {
    const mobile = mobileOf(formData.get("mobile"));
    if (!/^09\d{9}$/.test(mobile)) {
      return { step: "mobile", next, mobile, error: "شماره موبایل باید ۱۱ رقم باشد و با ۰۹ شروع شود." };
    }
    const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    if (!allowCodeRequest(ip)) {
      return { step: "mobile", next, mobile, error: "درخواست‌های زیادی از این اتصال ارسال شده است. کمی بعد تلاش کنید." };
    }
    const issued = issueLoginCode(mobile);
    if (!issued.ok) {
      // A code sent moments ago is still valid: go straight to entering it.
      const waiting = issued.resendAt !== undefined;
      return {
        step: waiting ? "code" : "mobile",
        next,
        mobile,
        error: waiting ? undefined : issued.error,
        resendIn: waiting ? Math.ceil((issued.resendAt! - Date.now()) / 1000) : undefined,
        testCode: waiting ? previous.testCode : undefined,
      };
    }
    if (!(await sendLoginCode(mobile, issued.code))) {
      forgetFailedSend(mobile);
      return { step: "mobile", next, mobile, error: "ارسال پیامک انجام نشد. چند لحظه بعد دوباره تلاش کنید." };
    }
    return {
      step: "code",
      next,
      mobile,
      resendIn: Math.ceil((issued.resendAt - Date.now()) / 1000),
      testCode: smsMode() === "test" ? issued.code : undefined,
    };
  }

  // intent === "verify"
  const mobile = mobileOf(formData.get("mobile"));
  const code = toLatinDigits(String(formData.get("code") ?? "")).replace(/\s/g, "");
  const keep = { step: "code" as const, next, mobile, testCode: previous.testCode };
  if (!/^09\d{9}$/.test(mobile)) return { step: "mobile", next, error: "شماره موبایل را دوباره وارد کنید." };
  if (!/^\d{5}$/.test(code)) return { ...keep, error: "کد ۵ رقمی پیامک‌شده را وارد کنید." };
  const result = verifyLoginCode(mobile, code);
  if (!result.ok) return { ...keep, error: result.error };

  const session = newCustomerSession(mobile);
  (await cookies()).set(CUSTOMER_COOKIE, session.value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: session.expires,
  });
  redirect(next);
}

export async function logout() {
  (await cookies()).set(CUSTOMER_COOKIE, "", { path: "/", maxAge: 0 });
  redirect("/");
}

export type ProfileState = { ok?: boolean; error?: string };

export async function saveProfile(_previous: ProfileState, formData: FormData): Promise<ProfileState> {
  const customer = await requireCustomer("/account/profile");
  const name = String(formData.get("name") ?? "").trim().replace(/\s+/g, " ");
  if (name && (name.length < 3 || name.length > 60)) return { error: "نام و نام خانوادگی بین ۳ تا ۶۰ نویسه باشد." };
  updateCustomerName(customer.mobile, name);
  refresh();
  return { ok: true };
}
