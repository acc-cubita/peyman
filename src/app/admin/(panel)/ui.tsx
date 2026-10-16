import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cx } from "@/lib/cx";

/* Building blocks shared by the admin pages. */

export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: React.ReactNode;
  /** Actions, aligned to the end. */
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-4xl text-board">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2 print:hidden">{children}</div>}
    </div>
  );
}

export function Panel({
  title,
  link,
  className,
  children,
}: {
  title?: string;
  link?: { href: string; label: string };
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cx("rounded-2xl bg-surface p-5 ring-1 ring-line sm:p-6", className)}>
      {(title || link) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="font-semibold">{title}</h2>}
          {link && (
            <Link href={link.href} className="flex items-center gap-1 text-xs text-copper-deep hover:underline">
              {link.label}
              <ArrowLeft aria-hidden className="size-3.5" />
            </Link>
          )}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatTile({
  label,
  value,
  detail,
  href,
  tone = "plain",
}: {
  label: string;
  value: string;
  detail?: string;
  href?: string;
  /** "attention" marks a number that asks for action. */
  tone?: "plain" | "attention";
}) {
  const body = (
    <>
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-ink tabular-nums">{value}</p>
      {detail && <p className="mt-1 text-xs text-muted">{detail}</p>}
    </>
  );
  const className = cx(
    "block rounded-2xl bg-surface p-5 ring-1",
    tone === "attention" ? "ring-copper/50" : "ring-line",
    href && "transition-shadow hover:ring-board/40",
  );
  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

export const buttonClass =
  "inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm font-medium transition-colors disabled:opacity-60";
export const primaryButton = cx(buttonClass, "bg-board text-silk hover:bg-board-deep");
export const secondaryButton = cx(buttonClass, "bg-surface text-ink ring-1 ring-line hover:ring-board/40");

export const inputClass =
  "h-10 w-full rounded-xl bg-silk px-3.5 text-sm text-ink ring-1 ring-line focus:bg-surface focus:ring-2 focus:ring-board focus:outline-none";

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="rounded-2xl bg-surface p-10 text-center text-sm text-muted ring-1 ring-line">{children}</p>;
}
