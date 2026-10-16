/* Support chat shapes shared by the server, the store widget and the admin inbox. */

export const MESSAGE_MAX = 1000;

export type Sender = "customer" | "admin";
export type ConversationStatus = "open" | "closed";

export type SupportMessage = { id: number; sender: Sender; body: string; createdAt: string };

export type Conversation = {
  id: string;
  name: string;
  mobile: string | null;
  /** Store path the visitor started the chat from. */
  page: string | null;
  status: ConversationStatus;
  createdAt: string;
  lastMessageAt: string;
};

export type ConversationSummary = Conversation & {
  lastMessage: Pick<SupportMessage, "sender" | "body"> | null;
  /** Customer messages the admin has not seen yet. */
  unread: number;
};

/** GET /api/chat */
export type VisitorChatState = {
  conversation: { name: string; status: ConversationStatus } | null;
  messages: SupportMessage[];
  /** Replies the visitor has not seen yet. */
  unread: number;
  online: boolean;
};

/** GET /admin/api/support */
export type AdminInboxState = {
  conversations: ConversationSummary[];
  counts: Record<ConversationStatus, number>;
  unreadTotal: number;
  selected: (Conversation & { orderCount: number }) | null;
  messages: SupportMessage[];
};

/** GET /admin/api/summary — the admin navigation badges. */
export type AdminSummary = { unreadSupport: number; toShip: number };
