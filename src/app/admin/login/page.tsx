import type { Metadata } from "next";
import Link from "next/link";
import { LogoMark } from "@/components/logo-mark";
import { site } from "@/lib/site";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "ورود به پنل مدیریت",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <main className="perfboard grid flex-1 place-items-center bg-board-deep px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-3 text-silk">
          <LogoMark className="size-11" />
          <span className="leading-tight">
            <span className="block font-display text-2xl">{site.name}</span>
            <span className="block text-xs text-board-ink/75">پنل مدیریت</span>
          </span>
        </div>
        <div className="rounded-3xl bg-surface p-8 shadow-[0_30px_80px_-30px_rgb(0_0_0/0.6)]">
          <h1 className="mb-6 text-xl font-semibold">ورود مدیر</h1>
          <LoginForm />
        </div>
        <Link href="/" className="mt-6 block text-center text-sm text-board-ink/80 hover:text-silk">
          بازگشت به فروشگاه
        </Link>
      </div>
    </main>
  );
}
