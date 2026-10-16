import { isAdmin } from "@/lib/admin-auth";
import { countOrders } from "@/lib/orders";
import { adminUnreadTotal, touchAdminPresence } from "@/lib/support";
import type { AdminSummary } from "@/lib/support-types";

/** Badges for the admin navigation. Any open admin page polls this, which also marks support as online. */
export async function GET() {
  if (!(await isAdmin())) return Response.json({ error: "unauthorized" }, { status: 401 });
  touchAdminPresence();
  const summary: AdminSummary = { unreadSupport: adminUnreadTotal(), toShip: countOrders().processing };
  return Response.json(summary, { headers: { "Cache-Control": "no-store" } });
}
