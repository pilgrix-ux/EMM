# EMM Ads Studio Web

This folder is the web-first EMM Ads Studio application.

## Stack

- Next.js App Router
- React
- Tailwind CSS v4
- Supabase Auth with cookie-backed SSR
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

Add `GEMINI_API_KEY` and the matching Shotstack key to Vercel Project Settings → Environment Variables for **Production** and **Preview**, then redeploy. EMM selects `SHOTSTACK_SANDBOX_API_KEY` with `SHOTSTACK_ENV=stage` and `SHOTSTACK_PRODUCTION_API_KEY` with `SHOTSTACK_ENV=v1`. The legacy `SHOTSTACK_API_KEY` is accepted as a fallback, but its value must match the selected environment. Keep all keys server-side: do not prefix them with `NEXT_PUBLIC_`, commit their values, or place them in browser code. Never add a `service_role` or `sb_secret_...` key to a `NEXT_PUBLIC_` variable or browser code.

Shotstack's `stage` environment is for watermarked sandbox testing. Ordinary sandbox renders are free, but the account must have at least one active credit and AI-generated assets such as narration or automatic captions can still consume credits. The `v1` environment produces watermark-free production renders and uses the credits on your Shotstack account. Review the Shotstack usage page before switching to production.
### Database and storage

- `public.ad_projects` stores a user's product brief, private source-video object path, creative settings, and editable AI ad plan.
- The `ad_plan`, `creative_settings`, and `ad_plan_approved_at` columns were added by migration `20261105020640_add_ad_plan_and_creative_settings.sql`.
- Row Level Security is enabled. Signed-in users can only access rows whose `user_id` matches `auth.uid()`.
- `emm-source-videos` is a private Storage bucket. Object paths must begin with the authenticated user's ID.
- The bucket currently allows supported MP4, MOV, WebM, M4V and 3GPP video MIME types up to 100 MB.

### Email confirmation

New accounts may require email confirmation. After deployment, set the Supabase Auth **Site URL** to the Vercel domain and add these Redirect URLs:

- `http://localhost:3000/auth/callback`
- `https://YOUR-VERCEL-DOMAIN/auth/callback`

## Vercel deployment

This repository also contains the original Android prototype under `app/`. When importing the repository into Vercel, configure:

- **Framework Preset:** Next.js
- **Root Directory:** `web`
- **Build Command:** `npm run build` (also enforced by `vercel.json`)
- **Output Directory:** default (`.next`)
- **Install Command:** default (`npm install`)

Add both Supabase variables to Vercel **Preview** and **Production** before testing sign-up and private saves. Also add the server-only `GEMINI_API_KEY` in both environments to enable the Generate ad plan step. The app does not need a Supabase service-role key for this flow.

## Video rendering

The Generate Ads workflow calls the authenticated `/api/ad-plan` endpoint and uses Gemini to create an editable hook, script, scene plan, captions, and call to action. The source video's actual frames are not sent to Gemini yet, so the plan does not claim to have visually analysed the clip.

After approving a plan, a signed-in user can save it without rendering, or choose **Render final video**. EMM then:

1. Creates a short-lived signed URL for the private source clip.
2. Uses Shotstack's media-probe endpoint to inspect the actual video stream and duration, then limits the output timeline to the shorter of the requested duration and the source clip duration. This avoids rendering a long blank tail when a short clip is selected.
3. Sends an edit timeline to Shotstack's cloud renderer. Video assets use Shotstack's `transcode: true` preprocessing option to normalize source formats/codecs before editing.
4. Adds the scene text, call to action and, when selected, word-synchronised captions. English and French voiceovers use Shotstack's current native text-to-speech asset. The provider currently documents support for English and French voice choices in this integration; turn voiceover off for Nigerian Pidgin, Yoruba, Hausa or Igbo.
5. Polls the asynchronous render job and lets the signed-in project owner download the finished MP4 through the authenticated EMM API. The download fallback accepts the temporary S3 output URL returned by the render-status endpoint while the permanent CDN asset is being published.

The local preview is intentionally lightweight and does not encode large source files inside the browser. Some phone/browser combinations cannot preview every MOV or HEVC codec; in that case EMM displays a compatibility message while the original upload can still be sent to cloud preprocessing.

The renderer requires `SHOTSTACK_API_KEY` in Vercel. Keep `SHOTSTACK_ENV=stage` for watermarked sandbox testing; set it to `v1` only when paid production renders are intended. Rendering, generated speech and automated captions consume provider resources/credits according to the provider account. The EMM application does not currently provide a licensed background-music library, automatic visual scene analysis, or a saved-project reopen/edit screen.