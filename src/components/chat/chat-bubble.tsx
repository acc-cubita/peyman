import { cx } from "@/lib/cx";
import { formatWhen } from "@/lib/format";

/**
 * One chat message. The reader's own messages sit at the inline end (left in
 * RTL) on board green; the other side's sit at the start on paper.
 */
export function ChatBubble({
  body,
  createdAt,
  own,
  author,
}: {
  body: string;
  createdAt: string;
  own: boolean;
  /** Shown above the other side's messages, e.g. «پشتیبانی». */
  author?: string;
}) {
  return (
    <li className={cx("flex flex-col gap-1", own ? "items-end" : "items-start")}>
      {!own && author && <span className="px-1 text-[11px] text-muted">{author}</span>}
      <p
        dir="auto"
        className={cx(
          "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-7 break-words whitespace-pre-wrap",
          own ? "rounded-ee-md bg-board text-silk" : "rounded-es-md bg-silk text-ink ring-1 ring-line",
        )}
      >
        {body}
      </p>
      <time dateTime={createdAt} className="px-1 text-[11px] text-muted tabular-nums">
        {formatWhen(createdAt)}
      </time>
    </li>
  );
}
