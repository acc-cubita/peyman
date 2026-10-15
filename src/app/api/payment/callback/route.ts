import { NextResponse, type NextRequest } from "next/server";
import { getBaseUrl } from "@/lib/base-url";
import { getOrderByAuthority, markFailed, markPaid } from "@/lib/orders";
import { verifyPayment } from "@/lib/zarinpal";

/**
 * ZarinPal sends the customer back here with ?Authority=…&Status=OK|NOK.
 * Payment is only trusted after a server-side verify for the stored amount.
 */
export async function GET(request: NextRequest) {
  const authority = request.nextUrl.searchParams.get("Authority");
  const status = request.nextUrl.searchParams.get("Status");
  const base = await getBaseUrl();

  const order = authority ? getOrderByAuthority(authority) : null;
  if (!authority || !order) return NextResponse.redirect(`${base}/cart`, 303);

  if (order.status !== "paid") {
    if (status !== "OK") {
      markFailed(order.id, "cancelled");
    } else {
      const result = await verifyPayment({ amountRial: order.total * 10, authority });
      if (result.ok) markPaid(order.id, result.refId, result.cardPan);
      else markFailed(order.id, "verify_failed");
    }
  }

  return NextResponse.redirect(`${base}/order/${order.id}`, 303);
}
