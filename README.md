# EMM Ads Creator

**EMM Ads Creator** is an Android-first AI advertising studio prototype. The product is designed around a video workspace, not a general-purpose chatbot.

## Current prototype

- Video-first workspace with local video selection and in-app playback.
- Creative-direction composer below the video canvas.
- Local demo conversation flow that makes it clear no live AI service is connected.
- Half-screen selection panels for voiceover, music, captions, format, and visual style.
- A Generate Ad action that clearly identifies the missing rendering-service connection.
- No account creation or authentication flow in this first prototype.

## Not connected yet

This repository currently contains the app interface and local interactions only. It does not yet include an AI model, video-rendering pipeline, cloud upload, payment system, or user accounts. The Generate Ad action is intentionally a prototype placeholder.

## Open in Android Studio

1. Open this repository as an Android project.
2. Use JDK 17 or newer.
3. Let Android Studio sync the Gradle project and install Android SDK Platform 37 if it is not already installed.
4. Run the app configuration on an Android device or emulator (Android 8.0 / API 26 or newer).

The project uses Android Gradle Plugin 9.1.1, Gradle 9.3.1, Kotlin Compose compiler plugin 2.4.10, and Compose BOM 2026.09.00.

## Product direction

Upload a clip → describe the advertisement → choose optional creative settings → generate and refine the finished ad. Future work will connect the real AI planning and video-rendering services.
