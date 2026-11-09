# Pilgrix Ads Studio Web

This folder is the web-first Pilgrix Ads Studio application.

## Stack

- Next.js App Router
- React
- Tailwind CSS v4
- Supabase Postgres and private Storage with browser workspace identity (no Supabase Auth)
- Supabase Postgres and private Storage
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

Add `GEMINI_API_KEY` and the matching Shotstack key to Vercel Project Settings → Environment Variables for **Production** and **Preview**, then redeploy. Pilgrix Ads Studio selects `SHOTSTACK_SANDBOX_API_KEY` with `SHOTSTACK_ENV=stage` and `SHOTSTACK_PRODUCTION_API_KEY` with `SHOTSTACK_ENV=v1`. The legacy `SHOTSTACK_API_KEY` is accepted as a fallback, but its value must match the selected environment. Keep all keys server-side: do not prefix them with `NEXT_PUBLIC_`, commit their values, or place them in browser code. Never add a `service_role` or `sb_secret_...` key to a `NEXT_PUBLIC_` variable or browser code.

Shotstack's `stage` environment is for watermarked sandbox testing. Ordinary sandbox renders are free, but the account must have at least one active credit and AI-generated assets such as narration or automatic captions can still consume credits. The `v1` environment produces watermark-free production renders and uses the credits on your Shotstack account. Review the Shotstack usage page before switching to production.
### Database and storage

- `public.ad_projects` stores a user's product brief, private source-video object path, creative settings, and editable AI ad plan.
- The `ad_plan`, `creative_settings`, and `ad_plan_approved_at` columns were added by migration `20261105020640_add_ad_plan_and_creative_settings.sql`.
- Row Level Security is enabled. New browser projects have `user_id = null` and a `visitor_id`; policies derive the visitor ID from a workspace token supplied to the Data API.
- `emm-source-videos` is a private Storage bucket. Browser files are uploaded only with one-file signed upload grants issued after the server verifies the workspace and project.
- The bucket currently allows supported MP4, MOV, WebM, M4V and 3GPP video MIME types up to 100 MB.

### Browser workspaces (no sign-in)

Pilgrix does not create Supabase Auth users and does not show a sign-in form. On first use, the web app creates a random 256-bit browser workspace key and stores it in a one-year, HttpOnly, SameSite=Lax cookie. The database stores only its SHA-256 hash in `private.workspace_visitors`; RLS maps the token to a `visitor_id` for project access.

The workspace cookie stays on that browser. Clearing site cookies/data or using another browser/device creates a different workspace; there is no cross-device recovery until an account-linking feature is intentionally added. This is a privacy-friendly pseudonymous visitor identity, not a verified person identity.

`private.workspace_events` records workspace starts, project creation, video uploads, plan generation, render starts/completions/failures, and downloads. Event properties are limited and do not include an email address. These records stay in the private schema and are not exposed to the browser. For an internal usage snapshot, query `private.workspace_events` by event name and date from the Supabase SQL Editor.

Private Storage is accessed through the `workspace-storage` Edge Function: it validates the workspace token and project ownership, then issues one-file signed upload grants or short-lived signed download links. The function source is in `web/supabase/functions/workspace-storage/index.ts`, and `web/supabase/config.toml` sets its `verify_jwt = false` setting because the function performs its own workspace-token validation. Deploy it to the same Supabase project with:

```bash
cd web
supabase functions deploy workspace-storage --project-ref kjncppfwujuedesyyswk
```

The service-role key remains inside the Supabase Edge Function runtime and is never sent to the browser or Vercel frontend.


## Vercel deployment

This repository also contains the original Android prototype under `app/`. When importing the repository into Vercel, configure:

- **Framework Preset:** Next.js
- **Root Directory:** `web`
- **Build Command:** `npm run build` (also enforced by `vercel.json`)
- **Output Directory:** default (`.next`)
- **Install Command:** default (`npm install`)

Add the Supabase URL and publishable key to Vercel **Preview** and **Production**. Also add the server-only `GEMINI_API_KEY` and matching Shotstack key to enable AI planning and rendering. No Supabase Auth settings or Vercel service-role key are needed for the browser workspace flow. Supabase injects the service-role key only into the `workspace-storage` Edge Function runtime.

## Video rendering

The Generate Ads workflow calls the workspace-verified `/api/ad-plan` endpoint and uses Gemini to create an editable hook, script, scene plan, captions, and call to action. The source video's actual frames are not sent to Gemini yet, so the plan does not claim to have visually analysed the clip.

After approving a plan, a browser workspace can save it without rendering, or choose **Render final video**. Pilgrix Ads Studio then:

1. Creates a short-lived signed URL for the private source clip.
2. Uses Shotstack's media-probe endpoint to inspect the actual video stream and duration, then limits the output timeline to the shorter of the requested duration and the source clip duration. This avoids rendering a long blank tail when a short clip is selected.
3. Sends an edit timeline to Shotstack's cloud renderer. Video assets use Shotstack's `transcode: true` preprocessing option to normalize source formats/codecs before editing.
4. Adds the scene text, call to action and, when selected, word-synchronised captions. English and French voiceovers use Shotstack's current native text-to-speech asset. The provider currently documents support for English and French voice choices in this integration; turn voiceover off for Nigerian Pidgin, Yoruba, Hausa or Igbo.
5. Polls the asynchronous render job and lets the browser workspace owner download the finished MP4 through the workspace-verified Pilgrix Ads Studio API. The download fallback accepts the temporary S3 output URL returned by the render-status endpoint while the permanent CDN asset is being published.

The local preview is intentionally lightweight and does not encode large source files inside the browser. Some phone/browser combinations cannot preview every MOV or HEVC codec; in that case Pilgrix Ads Studio displays a compatibility message while the original upload can still be sent to cloud preprocessing.

The renderer requires `SHOTSTACK_API_KEY` in Vercel. Keep `SHOTSTACK_ENV=stage` for watermarked sandbox testing; set it to `v1` only when paid production renders are intended. Rendering, generated speech and automated captions consume provider resources/credits according to the provider account. The Pilgrix Ads Studio application does not currently provide a licensed background-music library, automatic visual scene analysis, or a saved-project reopen/edit screen.