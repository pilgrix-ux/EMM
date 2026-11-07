# Pilgrix Ads Studio

**Pilgrix Ads Studio** is a web-first, video-first advertising workspace for small businesses, independent sellers, and creators. It helps users turn footage they already have into a polished promotional video.

Pilgrix Ads Studio is a guided creative workspace, not a general-purpose chatbot and not an ad-buying platform.

## Web app (Vercel)

The web application lives in [`web/`](web/) and uses Next.js, React, Tailwind CSS, and Supabase. It is designed to work on mobile and desktop, with an installable-PWA path for mobile devices.

### Deploy on Vercel

1. Import this GitHub repository into Vercel.
2. Set **Root Directory** to `web`.
3. Keep **Framework Preset** set to Next.js.
4. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to Preview and Production environments.
5. Deploy.

The Android project remains in [`app/`](app/) and is not used by the web deployment.

See [web/README.md](web/README.md) for local setup, guest authentication, private storage, credit payments, and deployment details.

## Supabase foundation

The `EMM` Supabase project is connected at the code level. The database has an owner-scoped `public.ad_projects` table and a private `emm-source-videos` bucket. RLS restricts each guest or signed-in user to their own project rows and video folder. Only the Supabase URL and publishable key are intended for the browser; never expose service-role or secret keys.

## Current web experience

- Responsive Pilgrix Ads Studio workspace with the lime, charcoal, and soft-neumorphic design system.
- Automatic Supabase guest sessions without a login or registration page.
- Paystack credit purchase foundation with server-side verification (checkout remains inactive until credentials, packages, usage costs and account recovery are configured).
- A private per-device guest session with row-level project isolation.
- A credit wallet panel and configurable Paystack checkout.

The current web interface keeps the Studio dashboard as its only full page. AI planning, video preview, and rendering remain backend routes; the credit purchase UI becomes active when Paystack credentials, the Supabase server key, and package pricing are configured. The dashboard does not yet expose the complete video-creation workflow.

## Android prototype

The original Kotlin Android prototype remains under `app/` for reference and optional future native packaging. The Vercel deployment target is `web/`.

## Next milestones

1. Deploy and verify the web workspace.
2. Enable Supabase Anonymous Sign-Ins and confirm guest sessions, private storage, and RLS on the deployed domain.
3. Configure Paystack test keys and actual credit package pricing, then test webhook fulfillment.
4. Connect the dashboard to the full ad-creation workflow and verify AI planning and video rendering with guest sessions.

The detailed requirements are in [PRODUCT_SPEC.md](PRODUCT_SPEC.md).