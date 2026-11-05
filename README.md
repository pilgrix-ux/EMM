# EMM Ads Studio

**EMM Ads Studio** is a web-first, video-first advertising workspace for small businesses, independent sellers, and creators. It helps users turn footage they already have into a polished promotional video.

EMM is a guided creative workspace, not a general-purpose chatbot and not an ad-buying platform.

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

- Responsive EMM Ads Studio workspace with the lime, charcoal, and soft-neumorphic design system.
- Browser video selection and local preview.
- Product name, benefit, audience, and advertising goal fields.
- Supabase email/password sign-up and sign-in.
- Save a draft and upload its source clip to private storage.
- Single-item floating Home navigation dock.

AI planning, cloud rendering, completed-video export, and the saved-project dashboard are not connected yet. The app does not claim otherwise.

## Android prototype

The original Kotlin Android prototype remains under `app/` for reference and optional future native packaging. The Vercel deployment target is `web/`.

## Next milestones

1. Deploy and verify the web workspace.
2. Confirm Supabase email verification, sign-in, private upload, and RLS behavior on the deployed domain.
3. Add a saved-project dashboard and draft editing.
4. Connect secure AI planning.
5. Connect background video rendering and real MP4 export.

The detailed requirements are in [PRODUCT_SPEC.md](PRODUCT_SPEC.md).