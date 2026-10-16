"use server";

import { refresh } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { fulfillments, updateFulfillment, type Fulfillment } from "@/lib/orders";

export type FulfillmentState = { ok?: boolean; error?: string };

export async function saveFulfillment(
  orderId: string,
  _previous: FulfillmentState,
  formData: FormData,
): Promise<FulfillmentState> {
  await requireAdmin();
  const fulfillment = String(formData.get("fulfillment") ?? "") as Fulfillment;
  const trackingCode = String(formData.get("trackingCode") ?? "").trim();
  const adminNote = String(formData.get("adminNote") ?? "").trim();

  if (!fulfillments.includes(fulfillment)) return { error: "وضعیت ارسال را انتخاب کنید." };
  if (trackingCode.length > 60) return { error: "کد رهگیری حداکثر ۶۰ نویسه باشد." };
  if (adminNote.length > 1000) return { error: "یادداشت حداکثر ۱۰۰۰ نویسه باشد." };

  if (!updateFulfillment(orderId, { fulfillment, trackingCode, adminNote })) {
    return { error: "فقط سفارش‌های پرداخت‌شده وضعیت ارسال دارند." };
  }
  refresh();
  return { ok: true };
}
