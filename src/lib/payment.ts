import "server-only";
import { getBaseUrl } from "./base-url";
import { attachAuthority, markFailed, type Order } from "./orders";
import { site } from "./site";
import { requestPayment } from "./zarinpal";

/**
 * Opens a gateway session for an unpaid order. Returns the URL to send the
 * customer to, or null when the gateway could not be reached (the order is
 * then marked failed so its page offers a retry).
 */
export async function startPayment(order: Order) {
  const result = await requestPayment({
    amountRial: order.total * 10,
    callbackUrl: `${await getBaseUrl()}/api/payment/callback`,
    description: `سفارش ${order.code} از ${site.name}`,
    mobile: order.customer.mobile,
    orderCode: order.code,
  });
  if (!result.ok) {
    markFailed(order.id, "gateway_error");
    return null;
  }
  attachAuthority(order.id, result.authority);
  return result.payUrl;
}
