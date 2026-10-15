"use server";

import { redirect } from "next/navigation";
import { getOrder } from "@/lib/orders";
import { startPayment } from "@/lib/payment";

/** Sends the customer back to the gateway for an order that is not paid yet. */
export async function retryPayment(orderId: string) {
  const order = getOrder(orderId);
  if (!order || order.status === "paid") redirect(`/order/${orderId}`);
  const payUrl = await startPayment(order);
  redirect(payUrl ?? `/order/${orderId}`);
}
