"use server";

import { redirect } from "next/navigation";
import { provinces } from "@/data/provinces";
import { getCustomer } from "@/lib/customer-auth";
import { faNumber, formatToman, toLatinDigits } from "@/lib/format";
import { createOrder, type Customer, type OrderItem } from "@/lib/orders";
import { startPayment } from "@/lib/payment";
import { orderTotals } from "@/lib/pricing";
import { listProducts } from "@/lib/products";

export type CheckoutState = {
  message?: string;
  errors?: Partial<Record<keyof Customer, string>>;
  values?: Customer;
  /** Set when prices moved since the page loaded; the form reloads its price list. */
  pricesChanged?: boolean;
};

const MAX_LINES = 50;

function validate(customer: Customer) {
  const errors: CheckoutState["errors"] = {};
  if (customer.name.length < 3 || customer.name.length > 60) errors.name = "نام و نام خانوادگی را کامل وارد کنید.";
  if (!/^09\d{9}$/.test(customer.mobile)) errors.mobile = "شماره موبایل باید ۱۱ رقم باشد و با ۰۹ شروع شود.";
  if (!(provinces as readonly string[]).includes(customer.province)) errors.province = "استان را انتخاب کنید.";
  if (customer.city.length < 2 || customer.city.length > 40) errors.city = "نام شهر را وارد کنید.";
  if (customer.address.length < 10 || customer.address.length > 300)
    errors.address = "نشانی را کامل‌تر بنویسید؛ خیابان، کوچه و پلاک.";
  if (!/^\d{10}$/.test(customer.postalCode)) errors.postalCode = "کد پستی ۱۰ رقمی را بدون خط تیره وارد کنید.";
  if (customer.note.length > 300) errors.note = "توضیحات حداکثر ۳۰۰ نویسه باشد.";
  return errors;
}

function parseCart(raw: string): Array<{ slug: string; qty: number }> | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value) || value.length > MAX_LINES) return null;
    const lines = value.filter(
      (line): line is { slug: string; qty: number } =>
        typeof line?.slug === "string" && Number.isInteger(line?.qty) && line.qty > 0,
    );
    return lines.length === value.length ? lines : null;
  } catch {
    return null;
  }
}

export async function placeOrder(_previous: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const field = (name: string) => String(formData.get(name) ?? "").trim();
  const customer: Customer = {
    name: field("name").replace(/\s+/g, " "),
    mobile: toLatinDigits(field("mobile")).replace(/[\s-]/g, ""),
    province: field("province"),
    city: field("city"),
    address: field("address").replace(/\s+/g, " "),
    postalCode: toLatinDigits(field("postalCode")).replace(/[\s-]/g, ""),
    note: field("note"),
  };

  const errors = validate(customer);
  if (Object.keys(errors).length > 0) {
    return { errors, values: customer, message: "لطفاً موارد مشخص‌شده را اصلاح کنید." };
  }

  const lines = parseCart(field("cart"));
  if (!lines || lines.length === 0) {
    return { values: customer, message: "سبد خرید شما خالی است یا قابل خواندن نیست." };
  }

  // Prices and stock come straight from the database, never from the browser.
  const catalog = new Map(listProducts().map((p) => [p.slug, p]));
  const items: OrderItem[] = [];
  const problems: string[] = [];
  for (const line of lines) {
    const product = catalog.get(line.slug);
    if (!product || product.stock === 0) {
      problems.push(`«${product?.name ?? line.slug}» دیگر موجود نیست.`);
    } else if (line.qty > product.stock) {
      problems.push(`از «${product.name}» فقط ${faNumber(product.stock)} عدد موجود است.`);
    } else {
      items.push({ slug: product.slug, name: product.name, sku: product.sku, unitPrice: product.price, qty: line.qty });
    }
  }
  if (problems.length > 0) {
    return { values: customer, message: `${problems.join(" ")} سبد خرید را به‌روز کنید.` };
  }

  const totals = orderTotals(items.map((item) => ({ price: item.unitPrice, qty: item.qty })));
  // Never charge an amount other than the one the customer was shown.
  if (Number(field("expectedTotal")) !== totals.total) {
    return {
      values: customer,
      pricesChanged: true,
      message: `قیمت برخی کالاها تغییر کرده است. مبلغ جدید ${formatToman(totals.total)} است؛ برای پرداخت دوباره روی دکمه بزنید.`,
    };
  }

  const account = await getCustomer();
  const order = createOrder(customer, items, totals, account?.mobile ?? null);
  const payUrl = await startPayment(order);
  redirect(payUrl ?? `/order/${order.id}`);
}
