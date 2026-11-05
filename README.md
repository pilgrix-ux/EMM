# EMM Ads Create

**EMM Ads Create** is an Android-first, video-first advertising studio for small businesses, independent sellers, and creators. It is designed to help users turn footage they already have into a polished promotional video.

EMM is a guided creative workspace, not a general-purpose chatbot and not an ad-buying platform.

## Current Android prototype

The current interface includes:
- A refined video-first workspace with local video selection and playback.
- A structured ad brief for product details, audience, and advertising goal.
- A clean output-settings grid for platform, duration, visual style, and captions.
- A fixed primary action for reviewing the ad brief.
- Clear prototype labeling so users know AI planning and video rendering are not connected yet.

The previous horizontal concept cards, creative-tools strip, demo chat, and bottom message composer have been removed from the main screen.

## Not connected yet

This repository is still a UI prototype. It does not yet include:
- A live AI planning service.
- Cloud video upload or saved project persistence.
- A real video-rendering pipeline.
- User authentication.
- Remote output storage or completed-video sharing.
- Billing or subscriptions.

The brief review is a local validation step. It does not generate an AI script or finished video. The app must not claim otherwise until those services are integrated and tested.

## Intended user journey

1. Choose and preview a source video.
2. Describe the product or service, its main benefit, the audience, and the ad goal.
3. Choose a platform, duration, visual style, and caption treatment.
4. Review the prepared ad brief.
5. In a future connected release, send the approved brief to an AI planner, review its script and scene plan, then render and export a real MP4.

The full product definition, screen responsibilities, AI and rendering contracts, data model, design system, and delivery milestones are in [PRODUCT_SPEC.md](PRODUCT_SPEC.md).

## Suggested system architecture

The Android app handles the mobile interface, local media selection, preview, and user input. Secure server-side services should handle AI planning, private media storage, project records, and video rendering. Model-provider and storage-admin secret keys must never be embedded in the Android application.

A service such as Supabase may provide authentication, database, and storage. It does not provide the AI model or video-rendering engine by itself; those require separate integrations.

## Build requirements

1. Open this repository as an Android project.
2. Use JDK 17 or newer.
3. Sync the Gradle project and install Android SDK Platform 36 if needed.
4. Run the app on an Android device or emulator (Android 8.0 / API 26 or newer).

## Product milestones

1. **Reliable prototype:** refine the ad brief, validate local video handling, and provide clear loading and error states.
2. **AI planning:** connect a secure endpoint that returns structured hooks, scripts, scenes, captions, and calls to action.
3. **Video rendering:** upload source footage, render approved plans, report real job status, and return playable MP4 files.
4. **Production readiness:** add authentication, privacy and deletion controls, usage limits, monitoring, support, and device/network testing.

## Definition of done

A user can select a video, describe the product and audience, choose a goal and format, receive and edit an AI ad plan, approve it, render a real MP4, preview it, and save or share it. Each step reports accurate status and understandable errors.
