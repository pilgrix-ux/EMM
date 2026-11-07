const SUPABASE_URL = () => process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const PUBLIC_KEY = () => process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const ADMIN_KEY = () => process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const PAYSTACK_KEY = () => process.env.PAYSTACK_SECRET_KEY;

export class PaymentError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
  }
}

async function responseJson(response) {
  return response.json().catch(() => ({}));
}

export function getCreditPackages() {
  let configured;
  try {
    configured = JSON.parse(process.env.PILGRIX_CREDIT_PACKAGES || "[]");
  } catch {
    return [];
  }

  if (!Array.isArray(configured)) return [];
  return configured
    .filter((item) =>
      item
      && typeof item.id === "string"
      && /^[a-z0-9_-]{1,40}$/i.test(item.id)
      && typeof item.name === "string"
      && item.name.trim().length > 0
      && Number.isSafeInteger(Number(item.credits))
      && Number(item.credits) > 0
      && Number.isSafeInteger(Number(item.amountNaira))
      && Number(item.amountNaira) > 0
    )
    .slice(0, 8)
    .map((item) => ({
      id: item.id,
      name: item.name.trim().slice(0, 60),
      credits: Number(item.credits),
      amountNaira: Number(item.amountNaira),
      currency: "NGN",
    }));
}

export async function authenticateRequest(request) {
  const supabaseUrl = SUPABASE_URL();
  const publishableKey = PUBLIC_KEY();
  const authorization = request.headers.get("authorization") || "";

  if (!supabaseUrl || !publishableKey) {
    throw new PaymentError("Supabase is not configured for this deployment.", 503);
  }
  if (!authorization.startsWith("Bearer ")) {
    throw new PaymentError("Your guest workspace is not ready yet. Refresh and try again.", 401);
  }

  const response = await fetch(supabaseUrl + "/auth/v1/user", {
    headers: { apikey: publishableKey, Authorization: authorization },
    cache: "no-store",
  });
  const user = await responseJson(response);
  if (!response.ok || !user?.id) {
    throw new PaymentError("Your workspace session could not be verified. Refresh and try again.", 401);
  }

  return {
    user,
    userId: user.id,
    supabaseUrl,
    publishableKey,
    authorization,
  };
}

export async function adminFetch(path, options = {}) {
  const supabaseUrl = SUPABASE_URL();
  const adminKey = ADMIN_KEY();
  if (!supabaseUrl || !adminKey) {
    throw new PaymentError("Add SUPABASE_SERVICE_ROLE_KEY to the server environment to enable secure credit payments.", 503);
  }

  const response = await fetch(supabaseUrl + path, {
    ...options,
    headers: {
      apikey: adminKey,
      Authorization: "Bearer " + adminKey,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    cache: "no-store",
  });
  const data = await responseJson(response);
  if (!response.ok) {
    throw new PaymentError(
      typeof data?.message === "string" ? data.message.slice(0, 240) : "The secure payment store could not be updated.",
      502
    );
  }
  return data;
}

export async function getPayment(reference, userId = null) {
  const query = new URLSearchParams({
    select: "id,user_id,reference,customer_email,package_id,amount_subunit,currency,credits,status",
    reference: "eq." + reference,
  });
  if (userId) query.set("user_id", "eq." + userId);
  const rows = await adminFetch("/rest/v1/credit_payments?" + query.toString());
  return Array.isArray(rows) ? rows[0] || null : null;
}

export async function verifyPaystackTransaction(reference) {
  const secret = PAYSTACK_KEY();
  if (!secret) throw new PaymentError("Add PAYSTACK_SECRET_KEY to enable checkout.", 503);

  const response = await fetch(
    "https://api.paystack.co/transaction/verify/" + encodeURIComponent(reference),
    {
      headers: { Authorization: "Bearer " + secret, Accept: "application/json" },
      cache: "no-store",
    }
  );
  const result = await responseJson(response);
  if (!response.ok || result?.status !== true || !result?.data) {
    throw new PaymentError("Paystack could not verify this transaction. Please retry.", 502);
  }
  return result.data;
}

export async function fulfillVerifiedPayment(payment, transaction) {
  if (!payment || payment.status === "failed" || payment.status === "abandoned") {
    throw new PaymentError("This credit purchase is not eligible for fulfillment.", 409);
  }
  if (transaction?.status !== "success") {
    return { fulfilled: false, status: transaction?.status || "pending" };
  }

  const paidAmount = Number(transaction.amount);
  const expectedAmount = Number(payment.amount_subunit);
  const currency = String(transaction.currency || "").toUpperCase();
  if (!Number.isSafeInteger(paidAmount) || paidAmount !== expectedAmount || currency !== payment.currency) {
    throw new PaymentError("The verified payment amount or currency does not match this credit package.", 409);
  }

  const rpc = await adminFetch("/rest/v1/rpc/fulfill_credit_purchase", {
    method: "POST",
    body: JSON.stringify({
      p_reference: payment.reference,
      p_provider_transaction_id: String(transaction.id),
      p_amount_subunit: paidAmount,
      p_currency: currency,
    }),
  });
  return rpc;
}

export function paystackSecretIsConfigured() {
  return Boolean(PAYSTACK_KEY());
}

export function adminKeyIsConfigured() {
  return Boolean(ADMIN_KEY());
}
