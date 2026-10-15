import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { getBaseUrl } from "@/lib/base-url";
import { CATALOG_TAG } from "@/lib/catalog";
import { completePayment, getOrderByAuthority, markFailed } from "@/lib/orders";
import { findShortages } from "@/lib/products";
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
    } else if (findShortages(order.items).length > 0) {
      // Stock ran out while the customer was paying. Leaving the payment
      // unverified makes ZarinPal return the money automatically.
      markFailed(order.id, "out_of_stock");
    } else {
      const result = await verifyPayment({ amountRial: order.total * 10, authority });
      if (!result.ok) {
        markFailed(order.id, "verify_failed");
      } else if (completePayment(order, result.refId, result.cardPan)) {
        // Stock changed: refresh product pages on their next request.
        revalidateTag(CATALOG_TAG, { expire: 0 });
      }
    }
  }

  return NextResponse.redirect(`${base}/order/${order.id}`, 303);
}
