import "server-only";

/*
 * One-time login codes by SMS. Both supported providers send through a
 * template approved in their panel (the norm for OTP in Iran):
 *
 *   SMS_PROVIDER=kavenegar  KAVENEGAR_API_KEY, KAVENEGAR_OTP_TEMPLATE
 *                           (template with one %token% for the code)
 *   SMS_PROVIDER=smsir      SMSIR_API_KEY, SMSIR_OTP_TEMPLATE_ID,
 *                           SMSIR_OTP_PARAM (template variable, default CODE)
 *   SMS_PROVIDER=test       no SMS: the code is shown on the login page.
 *                           Refused unless the site runs on localhost, since
 *                           it would let anyone sign in as any number.
 */

export type SmsMode = "kavenegar" | "smsir" | "test";

const TIMEOUT_MS = 10_000;

function onLocalhost() {
  const url = process.env.NEXT_PUBLIC_SITE_URL;
  return !url || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/.test(url);
}

/** The configured way of delivering codes, or null when login is unavailable. */
export function smsMode(): SmsMode | null {
  const env = process.env;
  switch (env.SMS_PROVIDER) {
    case "kavenegar":
      return env.KAVENEGAR_API_KEY && env.KAVENEGAR_OTP_TEMPLATE ? "kavenegar" : null;
    case "smsir":
      return env.SMSIR_API_KEY && env.SMSIR_OTP_TEMPLATE_ID ? "smsir" : null;
    case "test":
      return onLocalhost() ? "test" : null;
    default:
      return null;
  }
}

/** Sends the code; false when the provider refused or could not be reached. */
export async function sendLoginCode(mobile: string, code: string): Promise<boolean> {
  const mode = smsMode();
  try {
    if (mode === "test") return true;
    if (mode === "kavenegar") {
      const query = new URLSearchParams({ receptor: mobile, token: code, template: process.env.KAVENEGAR_OTP_TEMPLATE! });
      const response = await fetch(
        `https://api.kavenegar.com/v1/${encodeURIComponent(process.env.KAVENEGAR_API_KEY!)}/verify/lookup.json?${query}`,
        { signal: AbortSignal.timeout(TIMEOUT_MS) },
      );
      const result = (await response.json()) as { return?: { status?: number } };
      return result.return?.status === 200;
    }
    if (mode === "smsir") {
      const response = await fetch("https://api.sms.ir/v1/send/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", "x-api-key": process.env.SMSIR_API_KEY! },
        body: JSON.stringify({
          mobile,
          templateId: Number(process.env.SMSIR_OTP_TEMPLATE_ID),
          parameters: [{ name: process.env.SMSIR_OTP_PARAM || "CODE", value: code }],
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      const result = (await response.json()) as { status?: number };
      return result.status === 1;
    }
  } catch (error) {
    console.error("SMS send failed:", error);
  }
  return false;
}
