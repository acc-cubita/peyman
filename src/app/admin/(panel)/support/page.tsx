import type { Metadata } from "next";
import { Suspense } from "react";
import { InboxPage } from "./inbox-page";

export const metadata: Metadata = { title: "پشتیبانی" };

export default function SupportPage(props: PageProps<"/admin/support">) {
  return (
    <Suspense fallback={<div aria-hidden className="h-[36rem] rounded-3xl bg-line/50" />}>
      <InboxPage searchParams={props.searchParams} />
    </Suspense>
  );
}
