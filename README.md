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

See [web/README.md](web/README.md) for local setup, Supabase configuration, Auth redirects, storage, and deployment details.

## Supabase foundation

The `EMM` Supabase project is connected at the code level. The database has an owner-scoped `public.ad_projects` table and a private `emm-source-videos` bucket. RLS restricts each signed-in user to their own project rows and video folder. Only the Supabase URL and publishable key are intended for the browser; never expose service-role or secret keys.

## Current web experience

- Mobile-first creation workspace at `/` and `/studio/create`, with separate video-upload and idea-description starting modes.
- Local video preview and private upload to the `emm-source-videos` Supabase bucket (up to 100 MB).
- A guided brief for product, benefit, audience, goal, platform, duration, and creative style.
- Supabase anonymous guest sessions, so a first-time user can start without an email/password form.
- Gemini-backed ad-plan generation through the secure `/api/ad-plan` route.
- Hook selection, script and call-to-action editing, and a scene-by-scene review before rendering.
- Shotstack rendering through the secure `/api/render` route, with real job-status checks and an authenticated MP4 download.
- Saved-project dashboard at `/studio`.

The AI planning and rendering routes are implemented, but they still require valid server-side Gemini and Shotstack keys. Anonymous Sign-Ins must also be enabled in the Supabase Auth settings. The text-only mode currently produces an ad plan; it cannot render a finished video until source footage or a separate text-to-video provider is available. The deployed end-to-end flow still needs verification.

## Android prototype

The original Kotlin Android prototype remains under `app/` for reference and optional future native packaging. The Vercel deployment target is `web/`.

## Next milestones

1. Enable Supabase Anonymous Sign-Ins and add appropriate CAPTCHA protection before opening guest creation publicly.
2. Verify guest sessions, RLS, private video uploads, Gemini planning, Shotstack rendering, preview, and download on the deployed domain.
3. Add project reopening/editing and a way for guest users to preserve access across devices.
4. Add usage limits, cleanup for abandoned guest accounts, privacy controls, and operational monitoring.

The detailed requirements are in [PRODUCT_SPEC.md](PRODUCT_SPEC.md).