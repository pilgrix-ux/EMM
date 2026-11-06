"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase/client";
import { getSignupResendErrorMessage, getSignupVerificationErrorMessage, logAuthDiagnostic, verifySignupOtp } from "../../lib/supabase/verify-signup-otp";

export default function VerifyEmailPage() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const signupEmail = params.get("email") || "";
    setEmail(signupEmail);

    if (params.get("signup") === "sent") {
      setMessageType("success");
      setMessage("Your signup was received. Enter the newest 8-digit code sent to your email to finish setting up your Pilgrix account.");
    }
  }, []);

  async function verifyEmail(event) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    const code = token.trim();

    if (!normalizedEmail) {
      setMessageType("error");
      setMessage("Enter the email address you used to create your account.");
      return;
    }
    if (!/^\d{8}$/.test(code)) {
      setMessageType("error");
      setMessage("Enter the 8-digit code from your email.");
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      const supabase = createClient();
      const { data, error } = await verifySignupOtp({ supabase, email: normalizedEmail, token: code });
      if (error) throw error;

      if (!data?.session) {
        const sessionError = new Error("Email verification completed without a session.");
        logAuthDiagnostic("signup OTP returned no session", sessionError, { flow: "signup-confirmation" });
        throw sessionError;
      }

      setMessageType("success");
      setMessage("Email verified. Opening your Pilgrix workspace…");
      window.location.replace("/studio");
    } catch (error) {
      logAuthDiagnostic("verification page submission failed", error, { flow: "signup-confirmation" });
      setMessageType("error");
      setMessage(getSignupVerificationErrorMessage(error));
      setBusy(false);
    }
  }

  async function resendCode() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setMessageType("error");
      setMessage("Enter your email address before requesting a code.");
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: normalizedEmail,
      });
      if (error) throw error;
      setToken("");
      setMessageType("success");
      setMessage("A new 8-digit code has been sent. Use the newest email only; each resend invalidates the previous code. Check your inbox and spam folder.");
    } catch (error) {
      setMessageType("error");
      logAuthDiagnostic("verification page resend failed", error, { flow: "signup-resend" });
      setMessage(getSignupResendErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="verify-page">
      <section className="verify-card" aria-labelledby="verify-title">
        <a className="verify-brand" href="/" aria-label="Pilgrix Ads Studio home">
          <span className="verify-brand-mark">P</span>
          <span><strong>PILGRIX</strong><small>ADS STUDIO</small></span>
        </a>

        <div className="verify-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <rect x="3" y="5" width="18" height="14" rx="3" />
            <path d="m4 7 8 6 8-6" />
            <path d="m8 16 2 2 5-5" />
          </svg>
        </div>

        <span className="verify-eyebrow">SIGNUP RECEIVED</span>
        <h1 id="verify-title">Your account is almost ready.</h1>
        <p className="verify-intro">
          We received your signup details. Confirm your email address with the latest 8-digit code to finish creating your Pilgrix account.
        </p>

        <form className="verify-form" onSubmit={verifyEmail}>
          <label className="field-group">
            <span className="field-label">EMAIL ADDRESS</span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@company.com"
            />
          </label>

          <label className="field-group">
            <span className="field-label">8-DIGIT VERIFICATION CODE</span>
            <input
              className="verify-code-input"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{8}"
              maxLength={8}
              required
              autoFocus
              value={token}
              onChange={(event) => setToken(event.target.value.replace(/\D/g, "").slice(0, 8))}
              placeholder="00000000"
              aria-label="8-digit email verification code"
            />
          </label>

          {message && (
            <p className={"verify-message verify-message-" + messageType} role="status" aria-live="polite">
              {message}
            </p>
          )}

          <button className="button button-dark verify-submit" type="submit" disabled={busy || token.length !== 8 || !email.trim()}>
            {busy ? "Verifying…" : "Verify email"}
          </button>
        </form>

        <button className="verify-resend" type="button" onClick={resendCode} disabled={busy || !email.trim()}>
          {busy ? "Please wait…" : "Didn't receive a code? Resend it"}
        </button>

        <p className="verify-help">Check your spam or promotions folder if the message is missing.</p>
        <a className="verify-back" href="/">Back to Pilgrix Ads Studio</a>
      </section>
      <p className="verify-footer">YOUR CREATIVE WORKSPACE, READY WHEN YOU ARE.</p>
    </main>
  );
}
