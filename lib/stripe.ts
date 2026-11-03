import { isDevMode } from "@/lib/env";

export function hasStripe(): boolean {
  return !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_PRO);
}

export async function createCheckoutSession(params: {
  plan: "pro" | "business";
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
  clientReferenceId?: string;
}): Promise<{ url: string } | { error: string; mock?: boolean }> {
  if (isDevMode() && !hasStripe()) {
    return { error: "Stripe non configurato – in DEV usa simulazione", mock: true };
  }
  if (!hasStripe()) return { error: "Stripe non configurato" };

  const priceId =
    params.plan === "pro"
      ? process.env.STRIPE_PRICE_PRO!
      : process.env.STRIPE_PRICE_BUSINESS || process.env.STRIPE_PRICE_PRO!;

  const body = new URLSearchParams();
  body.set("mode", "subscription");
  body.set("success_url", params.successUrl);
  body.set("cancel_url", params.cancelUrl);
  body.set("line_items[0][price]", priceId);
  body.set("line_items[0][quantity]", "1");
  if (params.customerEmail) body.set("customer_email", params.customerEmail);
  if (params.clientReferenceId) body.set("client_reference_id", params.clientReferenceId);
  body.set("metadata[plan]", params.plan);

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const data = await res.json();
  if (!res.ok) return { error: data.error?.message || "Errore Stripe Checkout" };
  return { url: data.url as string };
}
