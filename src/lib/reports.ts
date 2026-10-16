import "server-only";
import { formatDayMonth, tehranDay } from "./format";
import { paidOrdersSince } from "./orders";

const DAY_MS = 24 * 60 * 60 * 1000;

export type DailySales = { day: string; label: string; revenue: number; orders: number };

/**
 * Paid sales for the last `days` Tehran calendar days, today included, plus
 * the best sellers over the same window. Amounts are in Toman.
 */
export function salesReport(days = 30, now = new Date()) {
  // Iran has kept a fixed UTC+3:30 since 2022, so 24-hour steps land on consecutive days.
  const series: DailySales[] = Array.from({ length: days }, (_, index) => {
    const date = new Date(now.getTime() - (days - 1 - index) * DAY_MS);
    return { day: tehranDay(date), label: formatDayMonth(date), revenue: 0, orders: 0 };
  });
  const byDay = new Map(series.map((entry) => [entry.day, entry]));
  const best = new Map<string, { slug: string; name: string; qty: number; revenue: number }>();

  for (const order of paidOrdersSince(new Date(now.getTime() - (days + 1) * DAY_MS).toISOString())) {
    const entry = byDay.get(tehranDay(order.paidAt!));
    if (!entry) continue;
    entry.revenue += order.total;
    entry.orders += 1;
    for (const item of order.items) {
      const row = best.get(item.slug) ?? { slug: item.slug, name: item.name, qty: 0, revenue: 0 };
      row.qty += item.qty;
      row.revenue += item.qty * item.unitPrice;
      best.set(item.slug, row);
    }
  }

  const revenue = series.reduce((sum, entry) => sum + entry.revenue, 0);
  const orders = series.reduce((sum, entry) => sum + entry.orders, 0);
  return {
    series,
    today: series.at(-1)!,
    revenue,
    orders,
    averageOrder: orders > 0 ? Math.round(revenue / orders) : 0,
    bestSellers: [...best.values()].sort((a, b) => b.qty - a.qty || b.revenue - a.revenue).slice(0, 5),
  };
}
