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

Add `GEMINI_API_KEY` to Vercel Project Settings → Environment Variables for **Production** and **Preview**, then redeploy. Do not prefix it with `NEXT_PUBLIC_`, commit its value, or place it in browser code. Never add a `service_role` or `sb_secret_...` key to a `NEXT_PUBLIC_` variable or browser code.

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

## Current feature boundary

The browser can select a video, create a local preview, remove the selected clip, collect the product brief, and review it. When signed in and configured, Save draft uploads the clip to the private bucket and inserts the brief into `ad_projects`.

The Generate Ads workflow opens an editable brief, collects creative settings, calls the authenticated `/api/ad-plan` endpoint, and uses Gemini to create an editable hook, script, scene plan, captions, and call to action. The source video's actual frames are not sent to Gemini yet, so the plan does not claim to have visually analysed the clip. Video rendering, finished MP4 export, and a saved-project reopen/edit screen still require separate integrations.