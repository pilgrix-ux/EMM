import { createHmac, timingSafeEqual } from "node:crypto";
import {
  fulfillVerifiedPayment,
  getPayment,
  PaymentError,
  verifyPaystackTransaction,
} from "../../../../../lib/payments/server";

function json(data, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

function safeHexEqual(expected, supplied) {
  if (!/^[a-f0-9]{128}$/i.test(supplied || "")) return false;
  const left = Buffer.from(expected, "hex");
  const right = Buffer.from(supplied, "hex");
  return left.length === right.length && timingSafeEqual(left, right);
}

function validatePaystackSignature(request, rawBody) {
  const header = request.headers.get("paystack-signature") || "";
  const webhookSecret = process.env.PAYSTACK_WEBHOOK_SECRET;

  if (header && webhookSecret) {
    const fields = header.split(",");
    const timestamp = fields.find((value) => value.trim().startsWith("t="))?.trim().slice(2);
    const signatures = fields
      .filter((value) => value.trim().startsWith("v1="))
      .map((value) => value.trim().slice(3).split(":").at(-1));
    const seconds = Number(timestamp);
    if (!Number.isFinite(seconds) || Math.abs(Date.now() / 1000 - seconds) > 300) return false;
    const expected = createHmac("sha512", webhookSecret)
      .update(timestamp + "." + rawBody)
      .digest("hex");
    return signatures.some((signature) => safeHexEqual(expected, signature));
  }

  // Compatibility with Paystack's legacy x-paystack-signature format.
  const legacySignature = request.headers.get("x-paystack-signature") || "";
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!legacySignature || !secretKey) return false;
  const expected = createHmac("sha512", secretKey).update(rawBody).digest("hex");
  return safeHexEqual(expected, legacySignature);
}

export async function POST(request) {
  const rawBody = await request.text();
  if (!validatePaystackSignature(request, rawBody)) {
    return json({ error: "Invalid payment webhook signature." }, 401);
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return json({ error: "Invalid webhook payload." }, 400);
  }

  if (event?.event !== "charge.success") {
    return json({ received: true });
  }

  try {
    const reference = String(event?.data?.reference || "");
    if (!/^[a-z0-9.-]{8,120}$/i.test(reference)) {
      throw new PaymentError("The webhook did not contain a valid payment reference.", 400);
    }

    const payment = await getPayment(reference);
    if (!payment) throw new PaymentError("No matching credit purchase was found.", 404);

    // Verify with Paystack's API as well as the signed webhook before issuing credits.
    const transaction = await verifyPaystackTransaction(reference);
    const result = await fulfillVerifiedPayment(payment, transaction);
    return json({ received: true, fulfilled: result?.fulfilled === true });
  } catch (error) {
    return json({ error: error.message || "Could not process the payment webhook." }, error.status || 500);
  }
}
