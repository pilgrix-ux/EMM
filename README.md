# EMM Ads Studio

**EMM Ads Studio** is a web-first, video-first advertising workspace for small businesses, independent sellers, and creators. It helps users turn footage they already have into a polished promotional video.

EMM is a guided creative workspace, not a general-purpose chatbot and not an ad-buying platform.

## Web app (Vercel)

The web application lives in [`web/`](web/) and uses Next.js, React, and Tailwind CSS. It is designed to work on mobile and desktop, with an installable-PWA path for mobile devices.

### Deploy on Vercel

1. Import this GitHub repository into Vercel.
2. Set **Root Directory** to `web`.
3. Keep **Framework Preset** set to Next.js (Vercel should detect it).
4. Use the default install, build, and output settings.
5. Deploy.

The Android project remains in [`app/`](app/) and is not used by the web deployment. Keeping the web app in `web/` avoids a path conflict with Android's existing `app/` module.

### Run the web app locally

```bash
cd web
npm install
npm run dev
```

Use Node.js 20.9 or newer. Open `http://localhost:3000`.

See [web/README.md](web/README.md) for more detail.

## Current web experience

- Responsive EMM Ads Studio workspace with the lime, charcoal, and soft-neumorphic design system.
- Select a video from the device/browser picker and preview it locally.
- Replace or remove the selected clip.
- Enter a product name, benefit, audience, and advertising goal.
- Review a local ad brief before any AI request.
- Single-item floating Home navigation dock.

The current web screen is a deployable frontend foundation. Video preview runs locally in the browser. AI planning, cloud uploads, saved projects, and server-side video rendering are **not connected yet**; the UI does not claim otherwise.

## Android prototype

The original Kotlin Android prototype remains under `app/`. It is preserved for reference and optional future native packaging, but the new web-first product is deployed separately from `web/`.

## Product scope and next milestones

1. **Deployable web workspace:** responsive UI, local clip selection, product brief, and review.
2. **Backend foundation:** authentication when needed, project records, private object storage, and upload validation.
3. **AI planning:** a secure server endpoint that returns structured hooks, scripts, scene guidance, on-screen text, and calls to action.
4. **Video rendering:** background rendering jobs, honest progress states, playable MP4 output, and downloads/sharing.
5. **PWA and production readiness:** installability, offline-safe shell, privacy/deletion controls, monitoring, and performance testing.

## Important architecture rules

- Keep AI-provider and rendering-service secrets on the server; never expose them in browser code.
- Treat uploaded footage as private user content.
- Validate MIME type, file size, and duration on the server before processing.
- Show success only after the relevant service confirms it.
- Do not invent product features, offers, prices, testimonials, guarantees, or performance claims.

The detailed product requirements are in [PRODUCT_SPEC.md](PRODUCT_SPEC.md).