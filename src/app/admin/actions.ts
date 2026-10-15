"use server";

import { setTimeout as sleep } from "node:timers/promises";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, adminEnabled, newSession, passwordMatches } from "@/lib/admin-auth";

export type LoginState = { error?: string };

export async function login(_previous: LoginState, formData: FormData): Promise<LoginState> {
  if (!adminEnabled()) {
    return { error: "ورود مدیر غیرفعال است. متغیر ADMIN_PASSWORD (حداقل ۸ نویسه) را روی سرور تنظیم کنید." };
  }
  if (!passwordMatches(String(formData.get("password") ?? ""))) {
    await sleep(800); // slows down password guessing
    return { error: "رمز عبور نادرست است." };
  }
  const session = newSession();
  (await cookies()).set(ADMIN_COOKIE, session.value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    expires: session.expires,
  });
  redirect("/admin");
}

export async function logout() {
  (await cookies()).set(ADMIN_COOKIE, "", { path: "/admin", maxAge: 0 });
  redirect("/admin/login");
}
