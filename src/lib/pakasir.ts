const PAKASIR_BASE = "https://app.pakasir.com";

/**
 * Builds the hosted Pakasir payment page URL. The customer is redirected here
 * to pay via QRIS/VA/etc; Pakasir then redirects back to `redirectUrl` and
 * separately notifies us via webhook once payment completes.
 */
export function buildPakasirPaymentUrl(params: {
  orderId: string;
  amount: number;
  redirectUrl: string;
  qrisOnly?: boolean;
}) {
  const slug = process.env.PAKASIR_SLUG;
  if (!slug) throw new Error("PAKASIR_SLUG is not configured");

  const url = new URL(`${PAKASIR_BASE}/pay/${slug}/${params.amount}`);
  url.searchParams.set("order_id", params.orderId);
  url.searchParams.set("redirect", params.redirectUrl);
  if (params.qrisOnly) url.searchParams.set("qris_only", "1");
  return url.toString();
}

interface PakasirTransactionDetail {
  project: string;
  order_id: string;
  amount: number;
  status: "pending" | "canceled" | "completed";
  payment_method: string;
  completed_at: string | null;
}

/**
 * Pakasir's own docs recommend not trusting the webhook payload alone —
 * always confirm against this endpoint before marking an order paid.
 */
export async function getPakasirTransactionDetail(orderId: string, amount: number) {
  const slug = process.env.PAKASIR_SLUG;
  const apiKey = process.env.PAKASIR_API_KEY;
  if (!slug || !apiKey) throw new Error("Pakasir is not configured");

  const url = new URL(`${PAKASIR_BASE}/api/transactiondetail`);
  url.searchParams.set("project", slug);
  url.searchParams.set("order_id", orderId);
  url.searchParams.set("amount", String(amount));
  url.searchParams.set("api_key", apiKey);

  const res = await fetch(url.toString(), { method: "GET", cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Pakasir transactiondetail failed (${res.status})`);
  }
  const data = await res.json();
  return data.transaction as PakasirTransactionDetail;
}
