"use client";

import {
  ExternalLink,
  LayoutDashboard,
  LogOut,
  MessagesSquare,
  Package,
  ReceiptText,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LogoMark } from "@/components/logo-mark";
import { cx } from "@/lib/cx";
import { faNumber } from "@/lib/format";
import { site } from "@/lib/site";
import type { AdminSummary } from "@/lib/support-types";
import { logout } from "../actions";

type Item = { href: string; label: string; icon: LucideIcon; badge?: keyof AdminSummary };

const items: Item[] = [
  { href: "/admin", label: "داشبورد", icon: LayoutDashboard },
  { href: "/admin/orders", label: "سفارش‌ها", icon: ReceiptText, badge: "toShip" },
  { href: "/admin/products", label: "محصولات", icon: Package },
  { href: "/admin/support", label: "پشتیبانی", icon: MessagesSquare, badge: "unreadSupport" },
];

const SUMMARY_POLL_MS = 20_000;

/** Live navigation: highlights the current section and polls the badge counts. */
export function AdminNav() {
  const pathname = usePathname();
  const [summary, setSummary] = useState<AdminSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      if (document.hidden) return;
      try {
        const response = await fetch("/admin/api/summary", { cache: "no-store" });
        if (response.ok && !cancelled) setSummary((await response.json()) as AdminSummary);
      } catch {
        // Keep the last counts; the next poll retries.
      }
    }
    poll();
    const timer = setInterval(poll, SUMMARY_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [pathname]);

  return (
    <AdminSidebar
      summary={summary}
      isActive={(href) => (href === "/admin" ? pathname === href : pathname.startsWith(href))}
    />
  );
}

export function AdminSidebar({
  summary = null,
  isActive = () => false,
}: {
  summary?: AdminSummary | null;
  isActive?: (href: string) => boolean;
}) {
  return (
    <aside className="perfboard shrink-0 bg-board-deep text-board-ink print:hidden lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-64 lg:flex-col">
      <div className="flex items-center justify-between gap-3 px-4 py-3 lg:px-6 lg:py-6">
        <Link href="/admin" className="flex items-center gap-2.5">
          <LogoMark className="size-9" />
          <span className="leading-tight">
            <span className="block font-display text-xl text-silk">{site.name}</span>
            <span className="block text-xs text-board-ink/75">پنل مدیریت</span>
          </span>
        </Link>
        <form action={logout} className="lg:hidden">
          <button type="submit" className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs ring-1 ring-white/15 hover:bg-board">
            <LogOut aria-hidden className="size-3.5" />
            خروج
          </button>
        </form>
      </div>

      <nav aria-label="بخش‌های مدیریت" className="border-t border-white/10 lg:flex-1 lg:border-0">
        <ul className="flex gap-1 overflow-x-auto px-3 py-2 lg:flex-col lg:px-4 lg:py-0">
          {items.map(({ href, label, icon: Icon, badge }) => {
            const active = isActive(href);
            const count = badge && summary ? summary[badge] : 0;
            return (
              <li key={href} className="shrink-0">
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cx(
                    "flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm whitespace-nowrap transition-colors sm:gap-3 sm:px-3 lg:py-2.5",
                    active ? "bg-board text-silk ring-1 ring-copper/50" : "hover:bg-board/70 hover:text-silk",
                  )}
                >
                  <Icon aria-hidden className={cx("hidden size-[18px] sm:block", active && "text-copper-bright")} strokeWidth={1.75} />
                  <span className="flex-1">{label}</span>
                  {count > 0 && (
                    <span
                      className={cx(
                        "min-w-5 rounded-full px-1.5 text-center text-[11px] leading-5 font-semibold",
                        badge === "unreadSupport" ? "bg-signal text-white" : "bg-copper text-white",
                      )}
                    >
                      {faNumber(count)}
                      <span className="sr-only">{badge === "unreadSupport" ? " پیام خوانده‌نشده" : " سفارش در انتظار ارسال"}</span>
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="hidden space-y-1 border-t border-white/10 p-4 lg:block">
        <a
          href="/"
          target="_blank"
          rel="noopener"
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-board/70 hover:text-silk"
        >
          <ExternalLink aria-hidden className="size-[18px]" strokeWidth={1.75} />
          مشاهده فروشگاه
        </a>
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-board/70 hover:text-silk"
          >
            <LogOut aria-hidden className="size-[18px]" strokeWidth={1.75} />
            خروج
          </button>
        </form>
      </div>
    </aside>
  );
}
