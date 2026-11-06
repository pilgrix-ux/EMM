"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase/client";
import { logAuthDiagnostic, verifySignupOtp } from "../../lib/supabase/verify-signup-otp";

export default function VerifyEmailPage() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setEmail(params.get("email") || "");
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
    if (!/^\d{6}$/.test(code)) {
      setMessageType("error");
      setMessage("Enter the 6-digit code from your email.");
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      const supabase = createClient();
      const { error } = await verifySignupOtp({ supabase, email: normalizedEmail, token: code });
      if (error) throw error;

      setMessageType("success");
      setMessage("Email verified. Opening your Pilgrix workspace…");
      window.location.replace("/studio");
    } catch (error) {
      logAuthDiagnostic("verification page submission failed", error, { flow: "signup-confirmation" });
      setMessageType("error");
      setMessage("We couldn't verify that code. Please request a new code and try again.");
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
      setMessage("A new 6-digit code has been sent. Use the newest email only; each resend invalidates the previous code. Check your inbox and spam folder.");
    } catch (error) {
      setMessageType("error");
      logAuthDiagnostic("verification page resend failed", error, { flow: "signup-resend" });
      setMessage("We couldn't send a new verification code. Please try again shortly.");
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

        <span className="verify-eyebrow">ONE QUICK SECURITY CHECK</span>
        <h1 id="verify-title">Verify your email address.</h1>
        <p className="verify-intro">
          We sent a 6-digit verification code to your email. Enter it below to activate your Pilgrix account.
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
            <span className="field-label">6-DIGIT VERIFICATION CODE</span>
            <input
              className="verify-code-input"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              autoFocus
              value={token}
              onChange={(event) => setToken(event.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              aria-label="6-digit email verification code"
            />
          </label>

          {message && (
            <p className={"verify-message verify-message-" + messageType} role="status" aria-live="polite">
              {message}
            </p>
          )}

          <button className="button button-dark verify-submit" type="submit" disabled={busy || token.length !== 6 || !email.trim()}>
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
