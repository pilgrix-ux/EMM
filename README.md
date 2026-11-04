# EMM Ads Create

**EMM Ads Create** is an Android-first, video-first advertising studio for small businesses, independent sellers, and creators. It is designed to help a user turn footage they already have into a polished promotional video.

EMM is a guided creative workspace, not a general-purpose chatbot and not an ad-buying platform.

## The intended user journey

1. Upload and preview a product or service video.
2. Describe the business, product, main benefit, audience, and advertising goal.
3. Choose a platform, aspect ratio, duration, language, and optional creative settings.
4. Ask the AI planner for hooks, a script, scene guidance, captions, and a call to action.
5. Review and edit the proposed ad plan.
6. Approve the plan and send it to a video-rendering service.
7. Preview, save, or share the completed MP4.

The full product definition, screen responsibilities, control behavior, AI and rendering contracts, data model, design tokens, and delivery milestones are in [PRODUCT_SPEC.md](PRODUCT_SPEC.md).

## Current Android prototype

The current repository includes:
- Android video document picker.
- Local video playback and removal.
- Creative-direction cards.
- Selection panels for voiceover, music, captions, format, and visual style.
- Local demo conversation.
- A Generate Ad action that explains the rendering service is not connected.

## Not connected yet

This is still a UI prototype. It does not yet include:
- A live AI planning service.
- Cloud video upload or project persistence.
- A real video-rendering pipeline.
- User authentication.
- Remote output storage and a completed-video sharing workflow.
- Billing or subscriptions.

The demo conversation is local and is not a live AI conversation. The Generate Ad action is a placeholder and does not produce a finished video. The app must not claim otherwise until the services are connected and tested.

## Suggested system architecture

The Android app handles the mobile interface, local media selection, and playback. Secure server-side services should handle AI planning, private media storage, project records, and video rendering. Model-provider and storage-admin secret keys must never be embedded in the Android application.

A service such as Supabase may be used for authentication, database, and storage. It does not provide the AI model or video-rendering engine by itself; those require separate integrations.

## Build requirements

1. Open this repository as an Android project.
2. Use JDK 17 or newer.
3. Sync the Gradle project and install Android SDK Platform 36 if needed.
4. Run the app on an Android device or emulator (Android 8.0 / API 26 or newer).

## Product milestones

1. **Reliable prototype:** refine the creative brief, validate local video handling, and provide clear draft/error states.
2. **AI planning:** connect a secure endpoint that returns structured hooks, scripts, scenes, captions, and calls to action.
3. **Video rendering:** upload source footage, render approved plans, report real job status, and return playable MP4 files.
4. **Production readiness:** add authentication, privacy and deletion controls, usage limits, monitoring, support, and device/network testing.

## Definition of done

A user can select a video, describe the product and audience, choose a goal and format, receive and edit an AI ad plan, approve it, render a real MP4, preview it, and save or share it. Each step reports accurate status and understandable errors.
