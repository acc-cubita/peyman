"use client";

import { LogOut, Package, UserRound, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/lib/cx";
import { logout } from "../actions";

const items: Array<{ href: string; label: string; icon: LucideIcon }> = [
  { href: "/account", label: "سفارش‌های من", icon: Package },
  { href: "/account/profile", label: "اطلاعات حساب", icon: UserRound },
];

export function AccountNav() {
  const pathname = usePathname();
  return <AccountNavList current={pathname} />;
}

export function AccountNavList({ current = "" }: { current?: string }) {
  return (
    <nav aria-label="حساب کاربری" className="rounded-2xl bg-surface p-2 ring-1 ring-line">
      <ul className="flex gap-1 lg:flex-col">
        {items.map(({ href, label, icon: Icon }) => {
          const active = current === href;
          return (
            <li key={href} className="flex-1 lg:flex-none">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm transition-colors lg:justify-start",
                  active ? "bg-board text-silk" : "hover:bg-silk",
                )}
              >
                <Icon aria-hidden className="size-4" />
                {label}
              </Link>
            </li>
          );
        })}
        <li className="flex-1 lg:flex-none lg:border-t lg:border-line lg:pt-1">
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-silk hover:text-signal lg:justify-start"
            >
              <LogOut aria-hidden className="size-4" />
              خروج
            </button>
          </form>
        </li>
      </ul>
    </nav>
  );
}
