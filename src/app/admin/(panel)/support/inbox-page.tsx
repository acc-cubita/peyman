import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { faNumber } from "@/lib/format";
import { adminInboxState, touchAdminPresence } from "@/lib/support";
import type { ConversationStatus } from "@/lib/support-types";
import { PageHeader } from "../ui";
import { SupportInbox } from "./support-inbox";

/** Shared by /admin/support and /admin/support/[id]. */
export async function InboxPage({
  searchParams,
  conversationId = null,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
  conversationId?: string | null;
}) {
  await requireAdmin();
  const status: ConversationStatus = (await searchParams).status === "closed" ? "closed" : "open";
  touchAdminPresence();
  const initial = adminInboxState(status, conversationId);
  if (conversationId && !initial.selected) notFound();

  return (
    <>
      <PageHeader
        title="پشتیبانی آنلاین"
        description={
          <>
            تا وقتی صفحه‌ای از پنل مدیریت باز است، بازدیدکنندگان پشتیبانی را «آنلاین» می‌بینند
            {initial.unreadTotal > 0 && ` · ${faNumber(initial.unreadTotal)} پیام خوانده‌نشده`}
          </>
        }
      />
      <SupportInbox key={`${status}:${conversationId ?? ""}`} initial={initial} status={status} />
    </>
  );
}
