# EMM Ads Studio Web

This folder is the web-first EMM Ads Studio application.

## Stack

- Next.js App Router
- React
- Tailwind CSS v4
- Responsive mobile and desktop UI

## Local development

Requirements: Node.js 20.9 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Vercel deployment

This repository also contains the original Android prototype under `app/`. When importing the repository into Vercel, configure:

- **Framework Preset:** Next.js
- **Root Directory:** `web`
- **Build Command:** default (`next build`)
- **Output Directory:** default (`.next`)
- **Install Command:** default (`npm install`)

No environment variables are required for this first frontend deployment.

## Current feature boundary

The browser can select a video, create a local preview URL, remove the selected clip, collect the product brief, and display a local review dialog. The selected file is not uploaded or persisted. AI planning, account authentication, cloud storage, and rendering are not connected yet.