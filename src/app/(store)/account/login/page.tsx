import { MapPinned, PackageSearch, Truck } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getCustomer } from "@/lib/customer-auth";
import { smsMode } from "@/lib/sms";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "ورود به حساب کاربری",
  robots: { index: false, follow: false },
};

const perks = [
  { icon: PackageSearch, text: "همه سفارش‌هایتان و وضعیت هرکدام، یک‌جا" },
  { icon: Truck, text: "کد رهگیری مرسوله به‌محض ارسال" },
  { icon: MapPinned, text: "پر شدن خودکار نشانی در خرید بعدی" },
];

export default function LoginPage(props: PageProps<"/account/login">) {
  return (
    <div className="mx-auto grid max-w-4xl gap-6 px-4 pt-10 md:grid-cols-[1fr_20rem]">
      <section className="rounded-3xl bg-surface p-6 ring-1 ring-line sm:p-8">
        <h1 className="font-display text-3xl text-board">ورود یا ثبت‌نام</h1>
        <p className="mt-2 mb-6 text-sm leading-7 text-muted">
          با شماره موبایل وارد شوید. اگر بار اول است، حسابتان خودکار ساخته می‌شود و سفارش‌هایی که قبلاً با همین
          شماره ثبت کرده‌اید هم در آن نمایش داده می‌شوند.
        </p>
        <Suspense fallback={<div aria-hidden className="h-40 rounded-2xl bg-line/50" />}>
          <Login searchParams={props.searchParams} />
        </Suspense>
      </section>

      <aside className="perfboard rounded-3xl bg-board-deep p-6 text-board-ink sm:p-8">
        <h2 className="font-semibold text-silk">در حساب کاربری</h2>
        <ul className="mt-4 space-y-4 text-sm leading-7">
          {perks.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-3">
              <Icon aria-hidden className="mt-1 size-5 shrink-0 text-copper-bright" strokeWidth={1.75} />
              {text}
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

async function Login({ searchParams }: Pick<PageProps<"/account/login">, "searchParams">) {
  const { next: raw } = await searchParams;
  const next = typeof raw === "string" && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/account";
  if (await getCustomer()) redirect(next);

  if (!smsMode()) {
    return (
      <p className="rounded-2xl bg-silk p-5 text-sm leading-7 text-muted ring-1 ring-line">
        ورود با شماره موبایل هنوز راه‌اندازی نشده است. برای پیگیری سفارش، از لینک صفحه سفارش یا پشتیبانی آنلاین
        استفاده کنید.
      </p>
    );
  }
  return <LoginForm next={next} />;
}
