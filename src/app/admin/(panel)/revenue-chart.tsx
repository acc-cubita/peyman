"use client";

import { useEffect, useRef, useState } from "react";
import { faDecimal, faNumber, formatToman } from "@/lib/format";
import type { DailySales } from "@/lib/reports";

/*
 * Daily revenue as columns. Time runs right-to-left like the page (oldest at
 * the right, today at the left), with the value axis on the right. Each
 * column is its own hover/keyboard target; a table view carries every value.
 */

const H = 240;
const PAD = { top: 36, right: 44, bottom: 30, left: 8 };
const BAR_MAX = 18;
const RADIUS = 4;

function niceStep(raw: number) {
  const power = 10 ** Math.floor(Math.log10(raw));
  const unit = raw / power;
  return (unit <= 1 ? 1 : unit <= 2 ? 2 : unit <= 2.5 ? 2.5 : unit <= 5 ? 5 : 10) * power;
}

/** Rounded data-end at the top, square on the baseline. */
function columnPath(x: number, y: number, width: number, base: number) {
  const r = Math.min(RADIUS, width / 2, base - y);
  return `M${x},${base}V${y + r}Q${x},${y} ${x + r},${y}H${x + width - r}Q${x + width},${y} ${x + width},${y + r}V${base}Z`;
}

export function RevenueChart({ series }: { series: DailySales[] }) {
  const [active, setActive] = useState<number | null>(null);
  // Drawn at the box's real width, so labels keep their size on a phone.
  const [W, setW] = useState(720);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = box.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setW(Math.max(280, Math.round(entry.contentRect.width))));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const max = Math.max(...series.map((d) => d.revenue));
  const step = max > 0 ? niceStep(max / 3) : 1_000_000;
  const top = Math.max(step * Math.ceil(max / step), step);
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);

  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const base = PAD.top + plotH;
  const slot = plotW / series.length;
  const barW = Math.min(BAR_MAX, slot * 0.62);
  // Index 0 (oldest) sits at the right edge of the plot.
  const centerX = (index: number) => PAD.left + plotW - (index + 0.5) * slot;
  const y = (value: number) => base - (value / top) * plotH;
  const last = series.length - 1;
  const empty = max === 0;
  const point = active === null ? null : series[active];

  return (
    <div>
      <div
        ref={box}
        role="group"
        aria-label="فروش روزانه؛ با کلیدهای جهت روزها را مرور کنید"
        tabIndex={0}
        onFocus={() => setActive((current) => current ?? last)}
        onBlur={() => setActive(null)}
        onKeyDown={(event) => {
          // Left is newer, matching the mirrored time axis.
          if (event.key === "ArrowLeft") setActive((i) => Math.min(last, (i ?? last) + 1));
          else if (event.key === "ArrowRight") setActive((i) => Math.max(0, (i ?? last) - 1));
          else return;
          event.preventDefault();
        }}
        onPointerLeave={() => setActive(null)}
        className="relative rounded-xl focus-visible:outline-2"
      >
        <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" aria-hidden>
          {ticks.map((tick) => (
            <g key={tick}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(tick)} y2={y(tick)} stroke="var(--color-line)" strokeWidth={1} />
              <text x={W - PAD.right + 8} y={y(tick)} dy="0.35em" fontSize={11} fill="var(--color-muted)" textAnchor="start" direction="ltr">
                {faDecimal(tick / 1_000_000)}
              </text>
            </g>
          ))}

          {series.map((d, index) => {
            const x = centerX(index) - barW / 2;
            const showLabel = index === last || (last - index) % (W < 480 ? 10 : 7) === 0;
            return (
              <g key={d.day}>
                {d.revenue > 0 && (
                  <path
                    d={columnPath(x, y(d.revenue), barW, base)}
                    fill={active === index ? "var(--color-chart-hover)" : "var(--color-chart)"}
                  />
                )}
                {active === index && d.revenue === 0 && (
                  <line x1={x} x2={x + barW} y1={base - 1} y2={base - 1} stroke="var(--color-chart)" strokeWidth={2} />
                )}
                {showLabel && (
                  <text x={centerX(index)} y={H - 8} fontSize={11} fill="var(--color-muted)" textAnchor="middle">
                    {index === last ? "امروز" : d.label}
                  </text>
                )}
                {/* Hit target: the whole slot, taller and wider than the bar. */}
                <rect
                  x={centerX(index) - slot / 2}
                  y={PAD.top}
                  width={slot}
                  height={plotH}
                  fill="transparent"
                  onPointerEnter={() => setActive(index)}
                />
              </g>
            );
          })}
        </svg>

        <p className="pointer-events-none absolute top-0 right-0 text-[11px] text-muted">میلیون تومان</p>

        {empty && (
          <p className="absolute inset-0 grid place-items-center text-sm text-muted">هنوز فروشی در این بازه ثبت نشده است.</p>
        )}

        {point && (
          <div
            role="status"
            className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-xl bg-ink px-3 py-2 text-xs leading-6 whitespace-nowrap text-silk shadow-lg"
            style={{
              left: `${(centerX(active!) / W) * 100}%`,
              top: `${Math.max(0, (y(point.revenue) / H) * 100 - 30)}%`,
            }}
          >
            <span className="block font-medium">{active === last ? `امروز، ${point.label}` : point.label}</span>
            <span className="block tabular-nums">{formatToman(point.revenue)}</span>
            <span className="block text-silk/70">{faNumber(point.orders)} سفارش</span>
          </div>
        )}
      </div>

      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-xs text-muted hover:text-ink">نمایش جدول</summary>
        <div className="mt-2 max-h-64 overflow-y-auto rounded-xl ring-1 ring-line">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-silk text-muted">
              <tr>
                <th scope="col" className="px-3 py-2 text-start font-medium">روز</th>
                <th scope="col" className="px-3 py-2 text-start font-medium">سفارش</th>
                <th scope="col" className="px-3 py-2 text-start font-medium">فروش</th>
              </tr>
            </thead>
            <tbody>
              {series.toReversed().map((d) => (
                <tr key={d.day} className="border-t border-line">
                  <td className="px-3 py-1.5">{d.label}</td>
                  <td className="px-3 py-1.5 tabular-nums">{faNumber(d.orders)}</td>
                  <td className="px-3 py-1.5 tabular-nums">{formatToman(d.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
