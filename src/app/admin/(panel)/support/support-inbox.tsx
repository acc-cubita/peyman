"use client";

import { ArrowRight, Lock, LockOpen, Phone, ReceiptText, SendHorizontal } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChatBubble } from "@/components/chat/chat-bubble";
import { cx } from "@/lib/cx";
import { faNumber, formatDateTime, formatWhen } from "@/lib/format";
import { MESSAGE_MAX, type AdminInboxState, type ConversationStatus, type SupportMessage } from "@/lib/support-types";

const POLL_MS = 3_000;

const quickReplies = [
  "سلام، وقت بخیر. چطور می‌توانم کمکتان کنم؟",
  "لطفاً کد سفارش را بفرستید تا وضعیتش را بررسی کنم.",
  "برای انتخاب محافظ مناسب، نوع دستگاه و توان یا آمپر آن را بفرمایید.",
  "سفارش شما ارسال شده و کد رهگیری در صفحه سفارش آمده است.",
];

function merge(current: SupportMessage[], incoming: SupportMessage[]) {
  if (incoming.length === 0) return current;
  const known = new Set(current.map((m) => m.id));
  return [...current, ...incoming.filter((m) => !known.has(m.id))].sort((a, b) => a.id - b.id);
}

const inboxHref = (status: ConversationStatus, id?: string) =>
  `/admin/support${id ? `/${id}` : ""}${status === "closed" ? "?status=closed" : ""}`;

export function SupportInbox({ initial, status }: { initial: AdminInboxState; status: ConversationStatus }) {
  const [inbox, setInbox] = useState(initial);
  const [messages, setMessages] = useState(initial.messages);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const lastId = useRef(initial.messages.at(-1)?.id ?? 0);
  const list = useRef<HTMLOListElement>(null);
  const selected = inbox.selected;
  const selectedId = selected?.id ?? null;

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      if (document.hidden) return;
      try {
        const query = new URLSearchParams({ status, after: String(lastId.current) });
        if (selectedId) query.set("c", selectedId);
        const response = await fetch(`/admin/api/support?${query}`, { cache: "no-store" });
        if (!response.ok || cancelled) return;
        const next = (await response.json()) as AdminInboxState;
        if (cancelled) return;
        setInbox(next);
        if (next.messages.length > 0) {
          lastId.current = Math.max(lastId.current, ...next.messages.map((m) => m.id));
          setMessages((current) => merge(current, next.messages));
        }
      } catch {
        // Try again on the next tick.
      }
    }
    const timer = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [status, selectedId]);

  // The tab title counts unread messages, so a background tab still gets noticed.
  useEffect(() => {
    document.title = `${inbox.unreadTotal > 0 ? `(${faNumber(inbox.unreadTotal)}) ` : ""}پشتیبانی | پنل مدیریت`;
  }, [inbox.unreadTotal]);

  const lastMessageId = messages.at(-1)?.id;
  useEffect(() => {
    list.current?.parentElement?.scrollTo({ top: list.current.parentElement.scrollHeight });
  }, [lastMessageId]);

  async function post(payload: { action: "reply" | "close" | "reopen"; body?: string }) {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/admin/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, id: selected.id }),
      });
      const data = (await response.json()) as { message?: SupportMessage; error?: string };
      if (!response.ok) {
        setError(data.error ?? "انجام نشد.");
        return;
      }
      if (data.message) {
        lastId.current = Math.max(lastId.current, data.message.id);
        setMessages((current) => merge(current, [data.message!]));
        setDraft("");
      } else {
        setInbox((current) =>
          current.selected
            ? { ...current, selected: { ...current.selected, status: payload.action === "close" ? "closed" : "open" } }
            : current,
        );
      }
    } catch {
      setError("اتصال برقرار نشد.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid h-[calc(100dvh-14rem)] min-h-[30rem] grid-cols-1 overflow-hidden rounded-2xl bg-surface ring-1 ring-line lg:h-[calc(100dvh-12rem)] lg:grid-cols-[19rem_minmax(0,1fr)]">
      {/* Conversation list: on phones it gives way to the open conversation. */}
      <div className={cx("flex min-h-0 flex-col border-line lg:border-e", selected && "hidden lg:flex")}>
        <nav aria-label="وضعیت گفتگو" className="flex gap-1 border-b border-line p-2 text-sm">
          {(["open", "closed"] as const).map((key) => (
            <Link
              key={key}
              href={inboxHref(key)}
              aria-current={status === key ? "page" : undefined}
              className={cx(
                "flex-1 rounded-lg px-3 py-1.5 text-center transition-colors",
                status === key ? "bg-board text-silk" : "hover:bg-silk",
              )}
            >
              {key === "open" ? "باز" : "بسته‌شده"} <span className="text-xs opacity-75">{faNumber(inbox.counts[key])}</span>
            </Link>
          ))}
        </nav>
        {inbox.conversations.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted">
            {status === "open" ? "گفتگوی بازی نیست. پیام‌های تازه بازدیدکنندگان اینجا می‌آید." : "گفتگوی بسته‌شده‌ای نیست."}
          </p>
        ) : (
          <ul className="flex-1 divide-y divide-line overflow-y-auto">
            {inbox.conversations.map((conversation) => (
              <li key={conversation.id}>
                <Link
                  href={inboxHref(status, conversation.id)}
                  aria-current={conversation.id === selectedId ? "true" : undefined}
                  className={cx(
                    "block px-4 py-3 transition-colors",
                    conversation.id === selectedId ? "bg-board/5 shadow-[inset_-3px_0_0_var(--color-board)]" : "hover:bg-silk",
                  )}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className={cx("truncate text-sm", conversation.unread > 0 && "font-semibold")}>{conversation.name}</span>
                    <span className="shrink-0 text-[11px] text-muted">{formatWhen(conversation.lastMessageAt)}</span>
                  </span>
                  <span className="mt-0.5 flex items-center justify-between gap-2">
                    <span className="line-clamp-1 text-xs text-muted">
                      {conversation.lastMessage?.sender === "admin" && "شما: "}
                      {conversation.lastMessage?.body}
                    </span>
                    {conversation.unread > 0 && (
                      <span className="min-w-5 shrink-0 rounded-full bg-signal px-1.5 text-center text-[11px] leading-5 font-semibold text-white">
                        {faNumber(conversation.unread)}
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selected ? (
        <section aria-label={`گفتگو با ${selected.name}`} className="flex min-h-0 flex-col">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <Link href={inboxHref(status)} className="grid size-8 place-items-center rounded-full hover:bg-silk lg:hidden">
                <ArrowRight aria-hidden className="size-4" />
                <span className="sr-only">بازگشت به فهرست</span>
              </Link>
              <div className="min-w-0">
                <h2 className="truncate font-semibold">{selected.name}</h2>
                <p className="flex flex-wrap items-center gap-x-3 text-xs text-muted">
                  {selected.mobile && (
                    <a href={`tel:${selected.mobile}`} dir="ltr" className="flex items-center gap-1 font-mono hover:text-board">
                      <Phone aria-hidden className="size-3" />
                      {selected.mobile}
                    </a>
                  )}
                  <span>شروع: {formatDateTime(selected.createdAt)}</span>
                  {selected.page && (
                    <a href={selected.page} target="_blank" rel="noopener" dir="ltr" className="max-w-56 truncate font-mono hover:text-board">
                      {selected.page}
                    </a>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selected.orderCount > 0 && (
                <Link
                  href={`/admin/orders?q=${selected.mobile}`}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs ring-1 ring-line hover:ring-board/40"
                >
                  <ReceiptText aria-hidden className="size-3.5" />
                  {faNumber(selected.orderCount)} سفارش
                </Link>
              )}
              <button
                type="button"
                disabled={busy}
                onClick={() => post({ action: selected.status === "open" ? "close" : "reopen" })}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs ring-1 ring-line hover:ring-board/40 disabled:opacity-60"
              >
                {selected.status === "open" ? <Lock aria-hidden className="size-3.5" /> : <LockOpen aria-hidden className="size-3.5" />}
                {selected.status === "open" ? "بستن گفتگو" : "بازگشایی"}
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto bg-silk/40 p-4">
            <ol ref={list} aria-live="polite" className="space-y-3">
              {messages.map((message) => (
                <ChatBubble
                  key={message.id}
                  body={message.body}
                  createdAt={message.createdAt}
                  own={message.sender === "admin"}
                  author={selected.name}
                />
              ))}
            </ol>
          </div>

          <form
            className="space-y-2 border-t border-line p-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (draft.trim()) post({ action: "reply", body: draft.trim() });
            }}
          >
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {quickReplies.map((reply) => (
                <button
                  key={reply}
                  type="button"
                  onClick={() => setDraft(reply)}
                  className="shrink-0 rounded-full bg-silk px-3 py-1 text-xs text-muted ring-1 ring-line hover:text-ink"
                >
                  {reply.length > 32 ? `${reply.slice(0, 32)}…` : reply}
                </button>
              ))}
            </div>
            {error && (
              <p role="alert" className="text-xs text-signal">
                {error}
              </p>
            )}
            <div className="flex items-end gap-2">
              <label htmlFor="reply" className="sr-only">
                پاسخ
              </label>
              <textarea
                id="reply"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                    event.preventDefault();
                    if (draft.trim() && !busy) post({ action: "reply", body: draft.trim() });
                  }
                }}
                rows={1}
                maxLength={MESSAGE_MAX}
                placeholder="پاسخ را بنویسید؛ Enter برای ارسال، Shift+Enter برای خط جدید"
                className="max-h-40 min-h-11 w-full resize-none rounded-xl bg-silk px-3.5 py-2.5 text-sm leading-6 ring-1 ring-line field-sizing-content focus:bg-surface focus:ring-2 focus:ring-board focus:outline-none"
              />
              <button
                type="submit"
                disabled={busy || !draft.trim()}
                className="grid size-11 shrink-0 place-items-center rounded-full bg-board text-silk hover:bg-board-deep disabled:opacity-50"
              >
                <SendHorizontal aria-hidden className="size-5 -scale-x-100" />
                <span className="sr-only">ارسال پاسخ</span>
              </button>
            </div>
          </form>
        </section>
      ) : (
        <div className="hidden place-items-center p-10 text-center text-sm text-muted lg:grid">
          یک گفتگو را از فهرست انتخاب کنید.
        </div>
      )}
    </div>
  );
}
