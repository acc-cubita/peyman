"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/lib/cx";
import { logout } from "../actions";

const tabs = [
  { href: "/admin", label: "سفارش‌ها" },
  { href: "/admin/products", label: "محصولات" },
];

export function AdminNav() {
  const pathname = usePathname();
  return <AdminNavBar isActive={(href) => (href === "/admin" ? pathname === href : pathname.startsWith(href))} />;
}

export function AdminNavBar({ isActive = () => false }: { isActive?: (href: string) => boolean }) {
  return (
    <nav aria-label="بخش‌های مدیریت" className="mb-8 flex items-center justify-between gap-4 border-b border-line pb-3">
      <ul className="flex gap-1 text-sm">
        {tabs.map((tab) => (
          <li key={tab.href}>
            <Link
              href={tab.href}
              aria-current={isActive(tab.href) ? "page" : undefined}
              className={cx(
                "block rounded-full px-4 py-2 transition-colors",
                isActive(tab.href) ? "bg-board text-silk" : "text-ink hover:bg-surface",
              )}
            >
              {tab.label}
            </Link>
          </li>
        ))}
      </ul>
      <form action={logout}>
        <button type="submit" className="flex items-center gap-2 rounded-full px-4 py-2 text-sm text-muted ring-1 ring-line hover:text-ink hover:ring-board/40">
          <LogOut aria-hidden className="size-4" />
          خروج
        </button>
      </form>
    </nav>
  );
}
