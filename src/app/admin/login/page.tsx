import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "ورود مدیر",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="mx-auto max-w-sm px-4 pt-16">
      <div className="rounded-3xl bg-surface p-8 ring-1 ring-line">
        <h1 className="mb-6 font-display text-3xl text-board">ورود مدیر</h1>
        <LoginForm />
      </div>
    </div>
  );
}
