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

function isOtpMismatch(error) {
  return error?.code === "otp_expired" ||
    /token has expired or is invalid|invalid.*otp|otp.*invalid/i.test(error?.message || "");
}

/**
 * Confirms an email/password signup. Signup confirmation OTPs use type "signup";
 * "email" is retained as a compatibility fallback for OTPs issued by the
 * passwordless sign-in flow.
 */
export async function verifySignupOtp({ supabase, email, token }) {
  const attempts = [];
  let lastResult = null;

  for (const type of ["signup", "email"]) {
    let result;
    try {
      result = await supabase.auth.verifyOtp({ email, token, type });
    } catch (error) {
      logAuthDiagnostic("signup OTP request threw", error, {
        attemptedTypes: [...attempts.map((attempt) => attempt.type), type],
      });
      throw error;
    }

    lastResult = result;
    if (!result.error) {
      if (type === "email") {
        console.info("[Pilgrix auth diagnostic]", {
          event: "signup OTP verified by compatibility fallback",
          attemptedTypes: attempts.map((attempt) => attempt.type).concat(type),
        });
      }
      return result;
    }

    attempts.push({ type, error: summarizeAuthError(result.error) });
    if (!isOtpMismatch(result.error)) {
      logAuthDiagnostic("signup OTP verification failed", result.error, {
        attemptedTypes: attempts.map((attempt) => attempt.type),
        attempts,
      });
      return result;
    }
  }

  logAuthDiagnostic("signup OTP rejected by all verification types", lastResult?.error, {
    attemptedTypes: attempts.map((attempt) => attempt.type),
    attempts,
  });
  return lastResult;
}
