import { authenticateRequest, getCreditPackages, PaymentError } from "../../../lib/payments/server";

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function GET(request) {
  try {
    const auth = await authenticateRequest(request);
    const response = await fetch(
      auth.supabaseUrl + "/rest/v1/credit_wallets?select=balance&user_id=eq." + encodeURIComponent(auth.userId),
      {
        headers: {
          apikey: auth.publishableKey,
          Authorization: auth.authorization,
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );
    const rows = await response.json().catch(() => []);
    if (!response.ok) {
      throw new PaymentError("Could not load the credit balance.", 502);
    }

    return json({
      balance: Number(rows?.[0]?.balance) || 0,
      packages: getCreditPackages(),
      paymentConfigured: Boolean(
        process.env.PAYSTACK_SECRET_KEY
        && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY)
      ),
    });
  } catch (error) {
    return json({ error: error.message || "Could not load credits." }, error.status || 500);
  }
}
