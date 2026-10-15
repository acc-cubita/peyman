import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export function SectionHeading({
  id,
  title,
  description,
  link,
}: {
  id?: string;
  title: string;
  description?: string;
  link?: { href: string; label: string };
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
      <div>
        <h2 id={id} className="font-display text-3xl leading-tight text-board sm:text-4xl">
          {title}
        </h2>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {link && (
        <Link href={link.href} className="flex items-center gap-1 text-sm font-medium text-board hover:text-copper-deep">
          {link.label}
          <ArrowLeft aria-hidden className="size-4" />
        </Link>
      )}
    </div>
  );
}
