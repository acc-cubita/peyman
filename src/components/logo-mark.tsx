import { cx } from "@/lib/cx";

/** A chip on a board: the store mark, also used as the favicon. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cx("shrink-0", className)}>
      <rect width="32" height="32" rx="8" fill="#0f4d3a" />
      <g fill="#c27c3e">
        <rect x="11" y="5" width="2" height="4" rx="0.5" />
        <rect x="15" y="5" width="2" height="4" rx="0.5" />
        <rect x="19" y="5" width="2" height="4" rx="0.5" />
        <rect x="11" y="23" width="2" height="4" rx="0.5" />
        <rect x="15" y="23" width="2" height="4" rx="0.5" />
        <rect x="19" y="23" width="2" height="4" rx="0.5" />
      </g>
      <rect x="8.5" y="9" width="15" height="14" rx="2" fill="#0a3328" stroke="#e0a067" strokeWidth="1.2" />
      <circle cx="11.5" cy="12" r="1.1" fill="#d9e6df" />
      <path d="M13.5 19.5v-6h3a2 2 0 0 1 0 4h-3" fill="none" stroke="#f2f4ef" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
