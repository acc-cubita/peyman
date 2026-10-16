import type { Metadata } from "next";
import { Suspense } from "react";
import { InboxPage } from "../inbox-page";

export const metadata: Metadata = { title: "گفتگو" };

export default function ConversationPage(props: PageProps<"/admin/support/[id]">) {
  return (
    <Suspense fallback={<div aria-hidden className="h-[36rem] rounded-3xl bg-line/50" />}>
      <Conversation params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}

async function Conversation({ params, searchParams }: PageProps<"/admin/support/[id]">) {
  const { id } = await params;
  return <InboxPage searchParams={searchParams} conversationId={id} />;
}
