"use client";

import { useEffect } from "react";
import { clearCartForOrder } from "@/lib/cart-store";

export function ClearCart({ orderId }: { orderId: string }) {
  useEffect(() => clearCartForOrder(orderId), [orderId]);
  return null;
}
