# Pilgrix Ads Studio Web

This folder is the web-first Pilgrix Ads Studio application.

## Stack

- Next.js App Router
- React
- Tailwind CSS v4
- Supabase anonymous Auth with cookie-backed SSR (no registration screen)
- Supabase Postgres and private Storage with per-guest ownership and RLS
- Paystack credit top-ups with signed webhooks and server-side verification
- Responsive mobile and desktop UI

## Local development

Requirements: Node.js 22 or newer.

1. Copy `.env.example` to `.env.local`.
2. Set `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to the project's publishable key from Supabase **Settings → API Keys**.
3. Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Supabase connection

Project: `EMM` (`kjncppfwujuedesyyswk`) in the `EMM Ai` organization.

Environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `GEMINI_API_KEY` (server-only; required for AI ad-plan generation)
- `GEMINI_MODEL` (optional; defaults to `gemini-3.8-flash`)
- `SHOTSTACK_SANDBOX_API_KEY` (server-only; use for sandbox test renders)
- `SHOTSTACK_PRODUCTION_API_KEY` (server-only; use for watermark-free production renders)
- `SHOTSTACK_ENV` (optional; defaults to `stage`; set to `v1` for production renders)
- `SUPABASE_SECRET_KEY` (preferred server-only key; legacy `SUPABASE_SERVICE_ROLE_KEY` JWT is supported as a fallback)
- `PAYSTACK_SECRET_KEY` and `PAYSTACK_WEBHOOK_SECRET` (server-only)
- `PILGRIX_CREDIT_PACKAGES` (server-only JSON array defining package IDs, credits, and NGN prices)
- `NEXT_PUBLIC_APP_URL` (canonical deployed app URL used for Paystack callbacks)

Add `GEMINI_API_KEY` and the matching Shotstack key to Vercel Project Settings → Environment Variables for **Production** and **Preview**, then redeploy. Pilgrix Ads Studio selects `SHOTSTACK_SANDBOX_API_KEY` with `SHOTSTACK_ENV=stage` and `SHOTSTACK_PRODUCTION_API_KEY` with `SHOTSTACK_ENV=v1`. The legacy `SHOTSTACK_API_KEY` is accepted as a fallback, but its value must match the selected environment. Keep all keys server-side: do not prefix them with `NEXT_PUBLIC_`, commit their values, or place them in browser code. Never add a `service_role` or `sb_secret_...` key to a `NEXT_PUBLIC_` variable or browser code.

Shotstack's `stage` environment is for watermarked sandbox testing. Ordinary sandbox renders are free, but the account must have at least one active credit and AI-generated assets such as narration or automatic captions can still consume credits. The `v1` environment produces watermark-free production renders and uses the credits on your Shotstack account. Review the Shotstack usage page before switching to production.
### Database and storage

- `public.ad_projects` stores a user's product brief, private source-video object path, creative settings, and editable AI ad plan.
- The `ad_plan`, `creative_settings`, and `ad_plan_approved_at` columns were added by migration `20261105020640_add_ad_plan_and_creative_settings.sql`.
- Row Level Security is enabled. Guest and signed-in users can only access rows whose `user_id` matches `auth.uid()`.
- `emm-source-videos` is a private Storage bucket. Object paths must begin with the authenticated user's ID.
- The bucket currently allows supported MP4, MOV, WebM, M4V and 3GPP video MIME types up to 100 MB.

### Guest authentication

Enable **Anonymous Sign-Ins** in Supabase Dashboard → Authentication → Sign In / Providers. The dashboard creates a Supabase anonymous user automatically; users do not see a login or registration page. Anonymous users receive the `authenticated` Postgres role, so the existing `auth.uid() = user_id` project and storage policies continue to protect each guest's data. Keep the dashboard dynamically rendered and configure signup abuse controls and rate limits before broad public launch. If Supabase Auth CAPTCHA is enabled, also add a client CAPTCHA provider and pass its token to `signInAnonymously`; this branch does not yet integrate a CAPTCHA widget.

Guest sessions are device/browser-specific. Clearing site data or moving to another device can make an anonymous workspace unrecoverable. An optional account-linking/recovery flow should be added before treating guest balances as high-value stored funds.

## Vercel deployment

This repository also contains the original Android prototype under `app/`. When importing the repository into Vercel, configure:

- **Framework Preset:** Next.js
- **Root Directory:** `web`
- **Build Command:** `npm run build` (also enforced by `vercel.json`)
- **Output Directory:** default (`.next`)
- **Install Command:** default (`npm install`)

Add the Supabase URL and publishable key to Vercel **Preview** and **Production**, enable Anonymous Sign-Ins in Supabase Auth settings, and add the server-only `GEMINI_API_KEY` to enable AI planning. For credit purchases, also add the server-only Supabase secret key, Paystack secret key, webhook signing secret, canonical app URL, and a `PILGRIX_CREDIT_PACKAGES` JSON array. Never prefix server secrets with `NEXT_PUBLIC_`.

## Backend capabilities

The repository retains server-side AI planning, private video preview, and Shotstack render API routes. They accept a valid Supabase guest-session bearer token and keep provider secrets on the server. The current web interface intentionally exposes the Studio dashboard as its only full page; a complete ad-creation interface is not currently connected to that dashboard.

## Paystack credit checkout

Set `PILGRIX_CREDIT_PACKAGES` in Vercel to a JSON array. Each package requires a unique `id`, display `name`, integer `credits`, and integer `amountNaira`. For example, use your own reviewed prices and quantities:

```json
[
  { "id": "starter", "name": "Starter", "credits": 100, "amountNaira": 1500 }
]
```

The dashboard collects a receipt email only when a user chooses to purchase. The server reads prices and credit amounts from its allowlist; it never trusts a client-supplied amount. Configure the Paystack webhook URL as `https://YOUR-APP-DOMAIN/api/payments/webhook`. Credits are granted only after server-side transaction verification, with an atomic database function preventing duplicate fulfillment. The live app needs valid Paystack test/live keys and the server-only Supabase secret key before checkout will be available. Checkout is a payment-credit foundation only: do not sell packages until AI/render credit consumption and workspace recovery are wired into the product.
