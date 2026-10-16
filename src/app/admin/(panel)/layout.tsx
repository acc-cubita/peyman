import type { Metadata } from "next";
import { Suspense } from "react";
import { site } from "@/lib/site";
import { AdminNav, AdminSidebar } from "./admin-nav";

export const metadata: Metadata = {
  title: { default: "پنل مدیریت", template: `%s | مدیریت ${site.name}` },
  robots: { index: false, follow: false },
};

/** Navigation only. Every page checks the admin session itself. */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      <Suspense fallback={<AdminSidebar />}>
        <AdminNav />
      </Suspense>
      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</div>
      </main>
    </div>
  );
}
