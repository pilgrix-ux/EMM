# Native Foundation — Build and Verification

## What this commit provides

- Android application entry point in Java.
- Landscape, full-screen GLSurfaceView.
- JNI bridge into a C++17 shared library.
- OpenGL ES 3.0 context and a lit, smooth diagnostic sphere.
- Touch drag changes the sphere's orientation.
- CMake target packaged into the arm64-v8a APK.

The diagnostic sphere is deliberately not presented as the EMM player character or any final art asset.

## Toolchain used by the project

- Android Gradle Plugin 9.5.0
- Gradle wrapper distribution 9.6.1
- JDK 17
- Android SDK Platform 35
- Android NDK and CMake from the installed Android toolchain
- C++17 and OpenGL ES 3.0

AGP 9.5.0 release notes specify JDK 17 and Gradle 9.6.0 as the required/default versions. The wrapper uses 9.6.1.

## Build steps

1. Open the repository root as a Gradle project in Code on the Go.
2. Ensure JDK 17, Android SDK Platform 35, NDK, and CMake are available.
3. Sync Gradle.
4. Run the :app:assembleDebug task.
5. Install app/build/outputs/apk/debug/app-debug.apk on an ARM64 Android device.
6. Drag the screen to rotate the sphere.
7. Pause and resume the app, then close and reopen it.

## Acceptance checklist

- [ ] Gradle sync succeeds in Code on the Go.
- [ ] CMake configures and compiles emm_native.
- [ ] APK packages lib/arm64-v8a/libemm_native.so.
- [ ] APK installs and launches.
- [ ] An OpenGL ES 3.0 context is created.
- [ ] The lit sphere renders without shader errors.
- [ ] Touch dragging rotates the sphere.
- [ ] Pause/resume and repeated launches work.
- [ ] Build output and device details are recorded.

Do not mark the milestone complete until the checklist has been tested on a real device. The current commit is a source scaffold; it is not a verified APK.

## Next gate

After the native render test passes, add Filament using a pinned release and validate a real glTF/GLB asset. Keep asset processing separate from runtime loading. Use a finished, properly licensed character model for the character milestone; do not reuse Local Warfare assets without written permission.
