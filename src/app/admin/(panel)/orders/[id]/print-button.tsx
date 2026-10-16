"use client";

import { Printer } from "lucide-react";
import { secondaryButton } from "../../ui";

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className={secondaryButton}>
      <Printer aria-hidden className="size-4" />
      چاپ برای بسته‌بندی
    </button>
  );
}
