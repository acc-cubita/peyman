import "server-only";

/*
 * ZarinPal payment gateway, API v4.
 * Docs: https://www.zarinpal.com/docs/paymentGateway/connectToGateway.html
 *
 * Amounts are sent in Rial (the API default) so request and verify use the
 * same unit. The sandbox is used unless ZARINPAL_SANDBOX is "false".
 */

const sandbox = process.env.ZARINPAL_SANDBOX !== "false";
const host = sandbox ? "https://sandbox.zarinpal.com" : "https://payment.zarinpal.com";

// The sandbox accepts any version-4 UUID as a merchant id.
const SANDBOX_MERCHANT_ID = "1a2b3c4d-1111-4222-8333-444455556666";

function merchantId() {
  const id = process.env.ZARINPAL_MERCHANT_ID;
  if (id) return id;
  if (sandbox) return SANDBOX_MERCHANT_ID;
  throw new Error("ZARINPAL_MERCHANT_ID must be set when ZARINPAL_SANDBOX is false");
}

type ApiError = { code: number; message: string };
type ApiResponse<T> = { data: T | []; errors: ApiError | [] };

async function post<T extends { code: number }>(endpoint: string, body: object): Promise<T | ApiError> {
  try {
    const response = await fetch(`${host}/pg/v4/payment/${endpoint}.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ merchant_id: merchantId(), ...body }),
      signal: AbortSignal.timeout(15_000),
    });
    const json = (await response.json()) as ApiResponse<T>;
    if (!Array.isArray(json.data) && json.data?.code) return json.data;
    if (!Array.isArray(json.errors)) return json.errors;
    return { code: response.status, message: "Unexpected response" };
  } catch (error) {
    console.error(`[zarinpal] ${endpoint} failed`, error);
    return { code: 0, message: "Network error" };
  }
}

export async function requestPayment(input: {
  amountRial: number;
  callbackUrl: string;
  description: string;
  mobile: string;
  orderCode: string;
}): Promise<{ ok: true; authority: string; payUrl: string } | { ok: false; code: number }> {
  const result = await post<{ code: number; authority: string }>("request", {
    amount: input.amountRial,
    callback_url: input.callbackUrl,
    description: input.description,
    metadata: { mobile: input.mobile, order_id: input.orderCode },
  });
  if (result.code === 100 && "authority" in result) {
    return { ok: true, authority: result.authority, payUrl: `${host}/pg/StartPay/${result.authority}` };
  }
  console.error("[zarinpal] request rejected", result);
  return { ok: false, code: result.code };
}

export async function verifyPayment(input: { amountRial: number; authority: string }): Promise<
  { ok: true; refId: string; cardPan: string | null } | { ok: false; code: number }
> {
  const result = await post<{ code: number; ref_id: number; card_pan?: string }>("verify", {
    amount: input.amountRial,
    authority: input.authority,
  });
  // 100: verified now. 101: verified earlier — the order may already be marked paid.
  if ((result.code === 100 || result.code === 101) && "ref_id" in result) {
    return { ok: true, refId: String(result.ref_id), cardPan: result.card_pan ?? null };
  }
  console.error("[zarinpal] verify rejected", result);
  return { ok: false, code: result.code };
}
