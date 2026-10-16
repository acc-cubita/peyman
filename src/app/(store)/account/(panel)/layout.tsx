import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountNav, AccountNavList } from "./account-nav";

export const metadata: Metadata = {
  title: "حساب کاربری",
  robots: { index: false, follow: false },
};

/** Navigation only. Every page checks the customer session itself. */
export default function AccountLayout({ children }: LayoutProps<"/account">) {
  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 pt-8 lg:grid-cols-[15rem_minmax(0,1fr)]">
      <div className="lg:sticky lg:top-6 lg:self-start">
        <Suspense fallback={<AccountNavList />}>
          <AccountNav />
        </Suspense>
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
