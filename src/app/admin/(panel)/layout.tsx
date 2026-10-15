import { Suspense } from "react";
import { AdminNav, AdminNavBar } from "./admin-nav";

/** Navigation only. Every page checks the admin session itself. */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-8">
      <Suspense fallback={<AdminNavBar />}>
        <AdminNav />
      </Suspense>
      {children}
    </div>
  );
}
