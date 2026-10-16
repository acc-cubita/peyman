import Link from "next/link";
import { EmptyState } from "./ui";

export default function AdminNotFound() {
  return (
    <EmptyState>
      موردی با این نشانی پیدا نشد؛ ممکن است حذف شده باشد.{" "}
      <Link href="/admin" className="font-medium text-board underline underline-offset-4">
        بازگشت به داشبورد
      </Link>
    </EmptyState>
  );
}
