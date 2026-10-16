import { isAdmin } from "@/lib/admin-auth";
import { addMessage, adminInboxState, getConversation, setConversationStatus, touchAdminPresence } from "@/lib/support";
import { MESSAGE_MAX, type ConversationStatus } from "@/lib/support-types";

/*
 * The admin support inbox polls and posts here (under /admin so the admin
 * session cookie, scoped to that path, is sent).
 *   GET  ?status=open|closed&c=<conversation>&after=<message id>
 *   POST {action: "reply", id, body} | {action: "close" | "reopen", id}
 */

const noStore = { "Cache-Control": "no-store" };
const unauthorized = () => Response.json({ error: "unauthorized" }, { status: 401, headers: noStore });

export async function GET(request: Request) {
  if (!(await isAdmin())) return unauthorized();
  touchAdminPresence();
  const params = new URL(request.url).searchParams;
  const status: ConversationStatus = params.get("status") === "closed" ? "closed" : "open";
  const state = adminInboxState(status, params.get("c"), Number(params.get("after")) || 0);
  return Response.json(state, { headers: noStore });
}

export async function POST(request: Request) {
  if (!(await isAdmin())) return unauthorized();
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return Response.json({ error: "Unsupported content type" }, { status: 415 });
  }
  const input = (await request.json().catch(() => ({}))) as { action?: string; id?: string; body?: string };
  const conversation = typeof input.id === "string" ? getConversation(input.id) : null;
  if (!conversation) return Response.json({ error: "گفتگو پیدا نشد." }, { status: 404 });

  if (input.action === "reply") {
    const body = typeof input.body === "string" ? input.body.trim() : "";
    if (!body || body.length > MESSAGE_MAX) {
      return Response.json({ error: `پاسخ باید بین ۱ تا ${MESSAGE_MAX.toLocaleString("fa-IR")} نویسه باشد.` }, { status: 400 });
    }
    return Response.json({ message: addMessage(conversation.id, "admin", body) }, { headers: noStore });
  }
  if (input.action === "close" || input.action === "reopen") {
    setConversationStatus(conversation.id, input.action === "close" ? "closed" : "open");
    return Response.json({ ok: true }, { headers: noStore });
  }
  return Response.json({ error: "Unknown action" }, { status: 400 });
}
