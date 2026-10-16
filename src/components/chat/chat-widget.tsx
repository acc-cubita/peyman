"use client";

import { MessagesSquare, SendHorizontal, X } from "lucide-react";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { cx } from "@/lib/cx";
import { faNumber } from "@/lib/format";
import { site } from "@/lib/site";
import { MESSAGE_MAX, type SupportMessage, type VisitorChatState } from "@/lib/support-types";
import { ChatBubble } from "./chat-bubble";

/*
 * Floating support chat for the store. The conversation lives on the server
 * (identified by an httpOnly cookie); this only remembers *that* the visitor
 * has a chat, so pages of visitors who never opened it make no requests.
 */

const STARTED_KEY = "peyman-chat:started";
const OPEN_POLL_MS = 3_000;
const CLOSED_POLL_MS = 20_000;

const startedListeners = new Set<() => void>();

function readStarted() {
  try {
    return localStorage.getItem(STARTED_KEY) === "1";
  } catch {
    return false;
  }
}

function writeStarted(value: boolean) {
  try {
    if (value) localStorage.setItem(STARTED_KEY, "1");
    else localStorage.removeItem(STARTED_KEY);
  } catch {
    // Private mode: the chat still works for this page view.
  }
  startedListeners.forEach((listener) => listener());
}

function subscribeStarted(listener: () => void) {
  startedListeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    startedListeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function mergeMessages(current: SupportMessage[], incoming: SupportMessage[]) {
  if (incoming.length === 0) return current;
  const known = new Set(current.map((m) => m.id));
  return [...current, ...incoming.filter((m) => !known.has(m.id))].sort((a, b) => a.id - b.id);
}

export function ChatWidget() {
  const started = useSyncExternalStore(subscribeStarted, readStarted, () => false);
  const [open, setOpen] = useState(false);
  const [chat, setChat] = useState<Omit<VisitorChatState, "messages"> | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const lastId = useRef(0);
  const launcher = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const panelId = useId();

  // Poll: often while the panel is open, rarely (for the unread badge) while closed.
  useEffect(() => {
    if (!open && !started) return;
    let cancelled = false;
    async function poll() {
      if (document.hidden) return;
      try {
        const response = await fetch(`/api/chat?after=${lastId.current}${open ? "&seen=1" : ""}`, { cache: "no-store" });
        if (!response.ok || cancelled) return;
        const state = (await response.json()) as VisitorChatState;
        if (cancelled) return;
        if (!state.conversation && started) writeStarted(false);
        if (state.conversation && !started) writeStarted(true);
        setChat({ conversation: state.conversation, unread: state.unread, online: state.online });
        if (state.messages.length > 0) {
          lastId.current = Math.max(lastId.current, ...state.messages.map((m) => m.id));
          setMessages((current) => mergeMessages(current, state.messages));
        }
      } catch {
        // Offline for a moment; the next poll catches up.
      }
    }
    poll();
    const timer = setInterval(poll, open ? OPEN_POLL_MS : CLOSED_POLL_MS);
    const onVisible = () => document.visibilityState === "visible" && poll();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [open, started]);

  async function send(payload: { body: string; name?: string; mobile?: string; page?: string }) {
    setSending(true);
    setError(null);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as
        | { message: SupportMessage; conversation: NonNullable<VisitorChatState["conversation"]> }
        | { error: string };
      if ("error" in data) {
        setError(data.error);
        return false;
      }
      lastId.current = Math.max(lastId.current, data.message.id);
      setMessages((current) => mergeMessages(current, [data.message]));
      setChat((current) => ({ online: current?.online ?? false, unread: 0, conversation: data.conversation }));
      writeStarted(true);
      return true;
    } catch {
      setError("اتصال برقرار نشد. اینترنت خود را بررسی کنید و دوباره بفرستید.");
      return false;
    } finally {
      setSending(false);
    }
  }

  function close() {
    setOpen(false);
    launcher.current?.focus();
  }

  const unread = !open && chat?.unread ? chat.unread : 0;

  return (
    <>
      <button
        ref={launcher}
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-expanded={open}
        aria-controls={panelId}
        className="fixed end-4 bottom-4 z-40 flex h-13 items-center gap-2 rounded-full bg-board px-4 text-sm font-medium text-silk shadow-[0_10px_30px_-10px_rgb(10_51_40/0.7)] ring-1 ring-board-deep transition-colors hover:bg-board-deep sm:end-6 sm:bottom-6"
      >
        {open ? <X aria-hidden className="size-5" /> : <MessagesSquare aria-hidden className="size-5" />}
        <span className="hidden sm:inline">{open ? "بستن" : "پشتیبانی آنلاین"}</span>
        <span className="sr-only sm:hidden">{open ? "بستن پشتیبانی" : "پشتیبانی آنلاین"}</span>
        {unread > 0 && (
          <span className="absolute -top-1 -start-1 grid min-w-5 place-items-center rounded-full bg-copper px-1 text-[11px] leading-5 font-semibold text-white ring-2 ring-silk">
            {faNumber(unread)}
            <span className="sr-only"> پاسخ تازه</span>
          </span>
        )}
      </button>

      {open && (
        <section
          id={panelId}
          role="dialog"
          aria-labelledby={titleId}
          onKeyDown={(event) => event.key === "Escape" && close()}
          className="fixed inset-x-3 bottom-20 z-50 flex h-[min(36rem,calc(100dvh-6.5rem))] flex-col overflow-hidden rounded-3xl bg-surface shadow-[0_24px_60px_-20px_rgb(10_51_40/0.55)] ring-1 ring-line sm:inset-x-auto sm:end-6 sm:bottom-24 sm:w-[23rem]"
        >
          <header className="perfboard flex items-center justify-between gap-3 bg-board-deep px-5 py-4 text-silk">
            <div>
              <h2 id={titleId} className="font-semibold">
                پشتیبانی آنلاین {site.name}
              </h2>
              <p className="mt-0.5 flex items-center gap-2 text-xs text-board-ink">
                <span
                  aria-hidden
                  className={cx("size-2 rounded-full", chat?.online ? "bg-emerald-400" : "bg-board-ink/40")}
                />
                {chat === null ? "در حال اتصال…" : chat.online ? "آنلاین هستیم" : "الان آنلاین نیستیم؛ پیام بگذارید"}
              </p>
            </div>
            <button type="button" onClick={close} className="grid size-9 place-items-center rounded-full hover:bg-board">
              <X aria-hidden className="size-5" />
              <span className="sr-only">بستن</span>
            </button>
          </header>

          {chat?.conversation ? (
            <Conversation
              messages={messages}
              closed={chat.conversation.status === "closed"}
              online={chat.online}
              sending={sending}
              error={error}
              onSend={(body) => send({ body })}
            />
          ) : (
            <StartForm
              online={chat?.online ?? false}
              sending={sending}
              error={error}
              onStart={(fields) => send({ ...fields, page: window.location.pathname })}
            />
          )}
        </section>
      )}
    </>
  );
}

const fieldClass =
  "w-full rounded-xl bg-silk px-3.5 text-sm text-ink ring-1 ring-line focus:bg-surface focus:ring-2 focus:ring-board focus:outline-none";

function Greeting() {
  return (
    <p className="rounded-2xl rounded-es-md bg-silk px-3.5 py-2.5 text-sm leading-7 ring-1 ring-line">
      سلام! سؤالی درباره انتخاب محافظ، تجهیزات اعلام حریق یا سفارشتان دارید؟ همین‌جا بپرسید.
    </p>
  );
}

function StartForm({
  online,
  sending,
  error,
  onStart,
}: {
  online: boolean;
  sending: boolean;
  error: string | null;
  onStart: (fields: { name: string; mobile: string; body: string }) => Promise<boolean>;
}) {
  return (
    <form
      className="flex flex-1 flex-col gap-3 overflow-y-auto p-5"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        onStart({
          name: String(data.get("name") ?? ""),
          mobile: String(data.get("mobile") ?? ""),
          body: String(data.get("body") ?? ""),
        });
      }}
    >
      <Greeting />
      <label className="space-y-1 text-sm">
        <span className="font-medium">نام شما</span>
        <input name="name" required minLength={2} maxLength={60} autoComplete="name" autoFocus className={cx(fieldClass, "h-10")} />
      </label>
      <label className="space-y-1 text-sm">
        <span className="flex items-baseline justify-between gap-2 font-medium">
          شماره موبایل
          <span className="text-xs font-normal text-muted">اختیاری؛ برای وقتی که آنلاین نیستیم</span>
        </span>
        <input
          name="mobile"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          dir="ltr"
          placeholder="09xxxxxxxxx"
          className={cx(fieldClass, "h-10 text-start font-mono")}
        />
      </label>
      <label className="space-y-1 text-sm">
        <span className="font-medium">پیام</span>
        <textarea name="body" required maxLength={MESSAGE_MAX} rows={3} className={cx(fieldClass, "py-2.5 leading-7")} />
      </label>
      {!online && (
        <p className="text-xs leading-6 text-muted">
          پیامتان ثبت می‌شود و در اولین فرصت همین‌جا پاسخ می‌دهیم. اگر شماره گذاشته باشید، ممکن است تماس بگیریم.
        </p>
      )}
      {error && (
        <p role="alert" className="text-xs leading-6 text-signal">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={sending}
        className="mt-auto h-11 shrink-0 rounded-full bg-board font-medium text-silk hover:bg-board-deep disabled:opacity-70"
      >
        {sending ? "در حال ارسال…" : "شروع گفتگو"}
      </button>
    </form>
  );
}

function Conversation({
  messages,
  closed,
  online,
  sending,
  error,
  onSend,
}: {
  messages: SupportMessage[];
  closed: boolean;
  online: boolean;
  sending: boolean;
  error: string | null;
  onSend: (body: string) => Promise<boolean>;
}) {
  const [draft, setDraft] = useState("");
  const list = useRef<HTMLDivElement>(null);
  const lastMessageId = messages.at(-1)?.id;

  // Keep the newest message in view.
  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight });
  }, [lastMessageId]);

  async function submit() {
    const body = draft.trim();
    if (!body || sending) return;
    if (await onSend(body)) setDraft("");
  }

  const waiting = messages.length > 0 && messages.every((m) => m.sender === "customer");

  return (
    <>
      <div ref={list} className="flex-1 space-y-3 overflow-y-auto p-4">
        <Greeting />
        <ol aria-live="polite" className="space-y-3">
          {messages.map((message) => (
            <ChatBubble
              key={message.id}
              body={message.body}
              createdAt={message.createdAt}
              own={message.sender === "customer"}
              author="پشتیبانی"
            />
          ))}
        </ol>
        {waiting && (
          <p className="text-center text-xs leading-6 text-muted">
            {online ? "پیامتان رسید؛ همکارانمان به‌زودی پاسخ می‌دهند." : "پیامتان ثبت شد؛ در اولین فرصت پاسخ می‌دهیم."}
          </p>
        )}
        {closed && (
          <p className="text-center text-xs leading-6 text-muted">
            این گفتگو بسته شده است. اگر سؤال دیگری دارید، پیام بفرستید تا دوباره باز شود.
          </p>
        )}
      </div>
      <form
        className="border-t border-line p-3"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        {error && (
          <p role="alert" className="mb-2 text-xs leading-6 text-signal">
            {error}
          </p>
        )}
        <div className="flex items-end gap-2">
          <label className="sr-only" htmlFor="chat-draft">
            پیام شما
          </label>
          <textarea
            id="chat-draft"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault();
                submit();
              }
            }}
            rows={1}
            maxLength={MESSAGE_MAX}
            autoFocus
            placeholder="پیام خود را بنویسید…"
            className={cx(fieldClass, "max-h-32 min-h-11 resize-none py-2.5 leading-6 field-sizing-content")}
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            className="grid size-11 shrink-0 place-items-center rounded-full bg-board text-silk hover:bg-board-deep disabled:opacity-50"
          >
            {/* Mirrored so the arrow points the way RTL text flows. */}
            <SendHorizontal aria-hidden className="size-5 -scale-x-100" />
            <span className="sr-only">ارسال</span>
          </button>
        </div>
      </form>
    </>
  );
}
