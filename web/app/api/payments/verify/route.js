import {
  authenticateRequest,
  fulfillVerifiedPayment,
  getPayment,
  PaymentError,
  verifyPaystackTransaction,
} from "../../../../../lib/payments/server";

function json(data, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "private, no-store" } });
}

export async function GET(request) {
  try {
    const auth = await authenticateRequest(request);
    const reference = new URL(request.url).searchParams.get("reference") || "";
    if (!/^[a-z0-9.-]{8,120}$/i.test(reference)) {
      throw new PaymentError("A valid payment reference is required.", 400);
    }

    const payment = await getPayment(reference, auth.userId);
    if (!payment) throw new PaymentError("This payment does not belong to the current workspace.", 404);

    const transaction = await verifyPaystackTransaction(reference);
    const fulfillment = await fulfillVerifiedPayment(payment, transaction);

    const balanceResponse = await fetch(
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
    const balanceRows = await balanceResponse.json().catch(() => []);
    return json({
      success: transaction.status === "success",
      status: transaction.status,
      creditsAdded: Number(fulfillment?.credits_added) || 0,
      balance: Number(balanceRows?.[0]?.balance) || Number(fulfillment?.balance) || 0,
    });
  } catch (error) {
    return json({ error: error.message || "Could not verify this payment." }, error.status || 500);
  }
}
