import { randomUUID } from "node:crypto";
import {
  adminFetch,
  authenticateRequest,
  getCreditPackages,
  PaymentError,
  paystackSecretIsConfigured,
  adminKeyIsConfigured,
} from "../../../../lib/payments/server";

export const runtime = "nodejs";

function json(data, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request) {
  try {
    const auth = await authenticateRequest(request);
    if (!paystackSecretIsConfigured() || !adminKeyIsConfigured()) {
      throw new PaymentError("Checkout is not configured yet. Add the Paystack and Supabase server secrets in Vercel.", 503);
    }

    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const packageId = typeof body.packageId === "string" ? body.packageId : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new PaymentError("Enter a valid email address for your payment receipt.", 400);
    }

    const creditPackage = getCreditPackages().find((item) => item.id === packageId);
    if (!creditPackage) {
      throw new PaymentError("That credit package is unavailable. Refresh the dashboard and try again.", 400);
    }

    const reference = "pilgrix-" + randomUUID().replace(/-/g, "");
    const amountSubunit = creditPackage.amountNaira * 100;
    if (!Number.isSafeInteger(amountSubunit)) throw new PaymentError("This credit package amount is too large.", 400);
    const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;

    await adminFetch("/rest/v1/credit_payments", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        user_id: auth.userId,
        reference,
        customer_email: email,
        package_id: creditPackage.id,
        amount_subunit: amountSubunit,
        currency: "NGN",
        credits: creditPackage.credits,
        status: "pending",
      }),
    });

    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + process.env.PAYSTACK_SECRET_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        email,
        amount: String(amountSubunit),
        currency: "NGN",
        reference,
        callback_url: origin + "/studio",
        metadata: {
          user_id: auth.userId,
          package_id: creditPackage.id,
          credits: creditPackage.credits,
          app: "Pilgrix Ads Studio",
        },
      }),
      cache: "no-store",
    });
    const result = await paystackResponse.json().catch(() => ({}));
    if (!paystackResponse.ok || result?.status !== true || !result?.data?.authorization_url) {
      await adminFetch("/rest/v1/credit_payments?reference=eq." + encodeURIComponent(reference), {
        method: "PATCH",
        body: JSON.stringify({ status: "failed" }),
      }).catch(() => {});
      throw new PaymentError("Paystack could not start checkout. Please try again.", 502);
    }

    return json({
      authorizationUrl: result.data.authorization_url,
      reference,
    }, 201);
  } catch (error) {
    return json({ error: error.message || "Could not initialize checkout." }, error.status || 500);
  }
}
