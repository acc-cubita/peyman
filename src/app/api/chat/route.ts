import { cookies, headers } from "next/headers";
import { toLatinDigits } from "@/lib/format";
import {
  addMessage,
  CHAT_COOKIE,
  countMessages,
  customerUnread,
  findConversationByToken,
  markRead,
  messagesAfter,
  recentCustomerMessages,
  startConversation,
  supportOnline,
} from "@/lib/support";
import { MESSAGE_MAX, type SupportMessage, type VisitorChatState } from "@/lib/support-types";

/*
 * The store's chat widget talks to this endpoint.
 *   GET  ?after=<id>&seen=1  new messages since <id>; `seen` marks replies read
 *   POST {body, name?, mobile?, page?}  sends a message, starting a conversation if needed
 * POST only accepts JSON, which a cross-site form cannot send, and the cookie
 * is SameSite=Lax, so other sites cannot write into a visitor's chat.
 */

const noStore = { "Cache-Control": "no-store" };
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: noStore });
const fail = (error: string, status = 400) => json({ error }, status);

const MAX_MESSAGES_PER_MINUTE = 8;
const MAX_MESSAGES_PER_CONVERSATION = 500;
const MAX_NEW_CONVERSATIONS_PER_HOUR = 5;

// Best-effort, per server process: limits how many chats one address can open.
const startsByIp = new Map<string, number[]>();

function allowStart(ip: string) {
  const hourAgo = Date.now() - 60 * 60 * 1000;
  const recent = (startsByIp.get(ip) ?? []).filter((time) => time > hourAgo);
  if (recent.length >= MAX_NEW_CONVERSATIONS_PER_HOUR) return false;
  startsByIp.set(ip, [...recent, Date.now()]);
  if (startsByIp.size > 10_000) startsByIp.clear();
  return true;
}

export async function GET(request: Request) {
  const token = (await cookies()).get(CHAT_COOKIE)?.value;
  const row = token ? findConversationByToken(token) : null;
  const online = supportOnline();
  if (!row) {
    return json({ conversation: null, messages: [], unread: 0, online } satisfies VisitorChatState);
  }

  const params = new URL(request.url).searchParams;
  const after = Number(params.get("after")) || 0;
  if (params.get("seen") === "1") markRead(row.id, "customer");
  const state: VisitorChatState = {
    conversation: { name: row.name, status: row.status },
    messages: messagesAfter(row.id, after),
    unread: params.get("seen") === "1" ? 0 : customerUnread(row),
    online,
  };
  return json(state);
}

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json")) return fail("Unsupported content type", 415);

  let input: Record<string, unknown>;
  try {
    input = (await request.json()) as Record<string, unknown>;
  } catch {
    return fail("درخواست نامعتبر است.");
  }
  const text = (key: string) => (typeof input[key] === "string" ? (input[key] as string).trim() : "");

  const body = text("body").replace(/\n{3,}/g, "\n\n");
  if (!body) return fail("پیام خالی است.");
  if (body.length > MESSAGE_MAX) return fail(`پیام حداکثر ${MESSAGE_MAX.toLocaleString("fa-IR")} نویسه باشد.`);

  const cookieStore = await cookies();
  const token = cookieStore.get(CHAT_COOKIE)?.value;
  let conversation = token ? findConversationByToken(token) : null;

  if (!conversation) {
    const name = text("name").replace(/\s+/g, " ");
    const mobile = toLatinDigits(text("mobile")).replace(/[\s-]/g, "");
    const page = text("page");
    if (name.length < 2 || name.length > 60) return fail("نام خود را وارد کنید.");
    if (mobile && !/^09\d{9}$/.test(mobile)) return fail("شماره موبایل باید ۱۱ رقم باشد و با ۰۹ شروع شود.");

    const forwarded = (await headers()).get("x-forwarded-for");
    if (!allowStart(forwarded?.split(",")[0]?.trim() || "local")) {
      return fail("تعداد گفتگوهای جدید از این اتصال زیاد است. کمی بعد دوباره تلاش کنید.", 429);
    }

    const started = startConversation({
      name,
      mobile: mobile || null,
      page: page.startsWith("/") && !page.startsWith("//") ? page.slice(0, 200) : null,
    });
    cookieStore.set(CHAT_COOKIE, started.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 180 * 24 * 60 * 60,
    });
    conversation = findConversationByToken(started.token)!;
  } else {
    if (recentCustomerMessages(conversation.id) >= MAX_MESSAGES_PER_MINUTE) {
      return fail("پیام‌ها خیلی پشت‌سرهم ارسال شد. چند ثانیه صبر کنید.", 429);
    }
    if (countMessages(conversation.id) >= MAX_MESSAGES_PER_CONVERSATION) {
      return fail("این گفتگو به حداکثر طول خود رسیده است. لطفاً تلفنی با ما تماس بگیرید.", 429);
    }
  }

  const message: SupportMessage = addMessage(conversation.id, "customer", body);
  return json({ message, conversation: { name: conversation.name, status: "open" } });
}
