import "server-only";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { getDb, transaction } from "./db";
import { countOrdersByMobile } from "./orders";
import type {
  AdminInboxState,
  Conversation,
  ConversationStatus,
  ConversationSummary,
  Sender,
  SupportMessage,
} from "./support-types";

/*
 * Online support chat. A visitor's conversation is identified by a random
 * token kept in an httpOnly cookie; only its hash is stored, so a copy of the
 * database cannot be used to read or write someone's chat.
 */

export const CHAT_COOKIE = "peyman_chat";
/** Support counts as online while an admin page has polled within this window. */
const ONLINE_MS = 3 * 60 * 1000;

type ConversationRow = {
  id: string;
  name: string;
  mobile: string | null;
  page: string | null;
  status: ConversationStatus;
  admin_read_id: number;
  customer_read_id: number;
  created_at: string;
  last_message_at: string;
};

type MessageRow = { id: number; conversation_id: string; sender: Sender; body: string; created_at: string };

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

const toConversation = (row: ConversationRow): Conversation => ({
  id: row.id,
  name: row.name,
  mobile: row.mobile,
  page: row.page,
  status: row.status,
  createdAt: row.created_at,
  lastMessageAt: row.last_message_at,
});

const toMessage = (row: MessageRow): SupportMessage => ({
  id: row.id,
  sender: row.sender,
  body: row.body,
  createdAt: row.created_at,
});

// ── Visitor side ─────────────────────────────────────────────

export function findConversationByToken(token: string) {
  const row = getDb()
    .prepare("SELECT * FROM support_conversations WHERE token_hash = ?")
    .get(hashToken(token)) as ConversationRow | undefined;
  return row ?? null;
}

export function startConversation(visitor: { name: string; mobile: string | null; page: string | null }) {
  const token = randomBytes(24).toString("base64url");
  const id = randomUUID();
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO support_conversations (id, token_hash, name, mobile, page, created_at, last_message_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(id, hashToken(token), visitor.name, visitor.mobile, visitor.page, now, now);
  return { id, token };
}

/** Admin replies the visitor has not seen yet. */
export function customerUnread(row: ConversationRow) {
  return (
    getDb()
      .prepare("SELECT COUNT(*) AS n FROM support_messages WHERE conversation_id = ? AND sender = 'admin' AND id > ?")
      .get(row.id, row.customer_read_id) as { n: number }
  ).n;
}

/** Customer messages in the last minute, for rate limiting. */
export function recentCustomerMessages(conversationId: string) {
  const since = new Date(Date.now() - 60_000).toISOString();
  return (
    getDb()
      .prepare(
        "SELECT COUNT(*) AS n FROM support_messages WHERE conversation_id = ? AND sender = 'customer' AND created_at >= ?",
      )
      .get(conversationId, since) as { n: number }
  ).n;
}

export function countMessages(conversationId: string) {
  return (
    getDb().prepare("SELECT COUNT(*) AS n FROM support_messages WHERE conversation_id = ?").get(conversationId) as {
      n: number;
    }
  ).n;
}

// ── Both sides ───────────────────────────────────────────────

/** Adds a message; a visitor writing into a closed conversation reopens it. */
export function addMessage(conversationId: string, sender: Sender, body: string): SupportMessage {
  const db = getDb();
  return transaction(db, () => {
    const now = new Date().toISOString();
    const { lastInsertRowid } = db
      .prepare("INSERT INTO support_messages (conversation_id, sender, body, created_at) VALUES (?, ?, ?, ?)")
      .run(conversationId, sender, body, now);
    const id = Number(lastInsertRowid);
    // The writer has obviously seen everything up to their own message.
    const readColumn = sender === "admin" ? "admin_read_id" : "customer_read_id";
    db.prepare(
      `UPDATE support_conversations
       SET last_message_at = ?, ${readColumn} = ?, status = CASE WHEN ? = 'customer' THEN 'open' ELSE status END
       WHERE id = ?`,
    ).run(now, id, sender, conversationId);
    return { id, sender, body, createdAt: now };
  });
}

export function messagesAfter(conversationId: string, afterId = 0, limit = 300): SupportMessage[] {
  const rows = getDb()
    .prepare("SELECT * FROM support_messages WHERE conversation_id = ? AND id > ? ORDER BY id LIMIT ?")
    .all(conversationId, afterId, limit) as MessageRow[];
  return rows.map(toMessage);
}

/** Marks everything up to the latest message as read by one side. */
export function markRead(conversationId: string, reader: Sender) {
  const column = reader === "admin" ? "admin_read_id" : "customer_read_id";
  getDb()
    .prepare(
      `UPDATE support_conversations
       SET ${column} = (SELECT COALESCE(MAX(id), 0) FROM support_messages WHERE conversation_id = ?)
       WHERE id = ?`,
    )
    .run(conversationId, conversationId);
}

// ── Admin side ───────────────────────────────────────────────

export function getConversation(id: string) {
  const row = getDb().prepare("SELECT * FROM support_conversations WHERE id = ?").get(id) as ConversationRow | undefined;
  return row ? toConversation(row) : null;
}

export function listConversations(status: ConversationStatus, limit = 100): ConversationSummary[] {
  const rows = getDb()
    .prepare(
      `SELECT c.*,
              (SELECT COUNT(*) FROM support_messages m
                WHERE m.conversation_id = c.id AND m.sender = 'customer' AND m.id > c.admin_read_id) AS unread,
              (SELECT sender FROM support_messages m WHERE m.conversation_id = c.id ORDER BY m.id DESC LIMIT 1) AS last_sender,
              (SELECT body FROM support_messages m WHERE m.conversation_id = c.id ORDER BY m.id DESC LIMIT 1) AS last_body
       FROM support_conversations c
       WHERE c.status = ?
       ORDER BY c.last_message_at DESC
       LIMIT ?`,
    )
    .all(status, limit) as Array<ConversationRow & { unread: number; last_sender: Sender | null; last_body: string | null }>;
  return rows.map((row) => ({
    ...toConversation(row),
    unread: row.unread,
    lastMessage: row.last_sender && row.last_body !== null ? { sender: row.last_sender, body: row.last_body } : null,
  }));
}

export function countConversations() {
  const rows = getDb()
    .prepare("SELECT status, COUNT(*) AS n FROM support_conversations GROUP BY status")
    .all() as Array<{ status: ConversationStatus; n: number }>;
  const counts: Record<ConversationStatus, number> = { open: 0, closed: 0 };
  for (const row of rows) counts[row.status] = row.n;
  return counts;
}

/** Unread customer messages across open conversations: the admin's badge. */
export function adminUnreadTotal() {
  return (
    getDb()
      .prepare(
        `SELECT COUNT(*) AS n FROM support_messages m JOIN support_conversations c ON c.id = m.conversation_id
         WHERE c.status = 'open' AND m.sender = 'customer' AND m.id > c.admin_read_id`,
      )
      .get() as { n: number }
  ).n;
}

export function setConversationStatus(id: string, status: ConversationStatus) {
  return getDb().prepare("UPDATE support_conversations SET status = ? WHERE id = ?").run(status, id).changes > 0;
}

/** Everything the inbox shows; opening a conversation marks it read. */
export function adminInboxState(status: ConversationStatus, selectedId: string | null, after = 0): AdminInboxState {
  const conversation = selectedId ? getConversation(selectedId) : null;
  if (conversation) markRead(conversation.id, "admin");
  return {
    conversations: listConversations(status),
    counts: countConversations(),
    unreadTotal: adminUnreadTotal(),
    selected: conversation
      ? { ...conversation, orderCount: conversation.mobile ? countOrdersByMobile(conversation.mobile) : 0 }
      : null,
    messages: conversation ? messagesAfter(conversation.id, after) : [],
  };
}

export function conversationsByMobile(mobile: string) {
  const rows = getDb()
    .prepare("SELECT * FROM support_conversations WHERE mobile = ? ORDER BY last_message_at DESC LIMIT 10")
    .all(mobile) as ConversationRow[];
  return rows.map(toConversation);
}

// ── Presence ─────────────────────────────────────────────────

/** Called whenever an admin page polls, so visitors see that support is online. */
export function touchAdminPresence() {
  getDb()
    .prepare(
      "INSERT INTO settings (key, value) VALUES ('support_seen_at', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    )
    .run(String(Date.now()));
}

export function supportOnline() {
  const row = getDb().prepare("SELECT value FROM settings WHERE key = 'support_seen_at'").get() as
    | { value: string }
    | undefined;
  return row ? Date.now() - Number(row.value) < ONLINE_MS : false;
}
