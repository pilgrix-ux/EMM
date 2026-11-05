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

Required browser-safe environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Never add a `service_role` or `sb_secret_...` key to a `NEXT_PUBLIC_` variable or browser code.

### Database and storage

- `public.ad_projects` stores a user's product brief and private source-video object path.
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
- **Build Command:** default (`next build`)
- **Output Directory:** default (`.next`)
- **Install Command:** default (`npm install`)

Add the two Supabase variables above to Vercel **Preview** and **Production** environments before testing sign-up and saving projects. No server-side service key is required for the current browser/RLS flow.

## Current feature boundary

The browser can select a video, create a local preview, remove the selected clip, collect the product brief, and review it. When signed in and configured, Save draft uploads the clip to the private bucket and inserts the brief into `ad_projects`.

AI ad planning, cloud rendering, completed-video export, and a saved-project dashboard are not connected yet. The local review dialog is not an AI result.