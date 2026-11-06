function summarizeAuthError(error) {
  if (!error) return null;
  return {
    name: typeof error.name === "string" ? error.name : "AuthError",
    code: typeof error.code === "string" ? error.code : null,
    status: Number.isFinite(error.status) ? error.status : null,
    message: typeof error.message === "string" ? error.message : "Unknown authentication error",
  };
}

export function logAuthDiagnostic(event, error, context = {}) {
  console.error("[Pilgrix auth diagnostic]", {
    event,
    ...context,
    error: summarizeAuthError(error),
    // Never log the user's OTP, access token, refresh token, or full email.
  });
}

export function getSignupVerificationErrorMessage(error) {
  const code = typeof error?.code === "string" ? error.code : "";
  const message = typeof error?.message === "string" ? error.message : "";

  if (code === "otp_expired" || /expired|already been used/i.test(message)) {
    return "That code has expired or has already been used. Request a new code, then enter the newest code from your email.";
  }

  if (
    ["bad_code", "invalid_token", "token_not_found"].includes(code) ||
    /invalid.*(otp|token|code)|(otp|token|code).*(invalid|incorrect)/i.test(message)
  ) {
    return "That code doesn't match. Check the six digits in your newest email and try again.";
  }

  return "We couldn't verify your email right now. Please try again.";
}

export function getSignupResendErrorMessage(error) {
  if (
    error?.code === "over_email_send_rate_limit" ||
    /only request this after|rate limit/i.test(error?.message || "")
  ) {
    return "Please wait a moment before requesting another code.";
  }

  return "We couldn't send a new verification code. Please try again shortly.";
}

/**
 * Supabase's JavaScript signup OTP flow uses type "email" when verifying
 * the eight-digit code sent by the Confirm signup email template.
 * Do not try "signup" first: that is not the JS OTP verification type for
 * this code flow and creates a second, misleading failed verification call.
 */
export async function verifySignupOtp({ supabase, email, token }) {
  const result = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });

  if (result.error) {
    logAuthDiagnostic("signup OTP verification failed", result.error, {
      flow: "signup-confirmation",
      verificationType: "email",
    });
  }

  return result;
}
