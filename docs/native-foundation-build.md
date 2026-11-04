# EMM — Native Environment Build and Verification

## What this milestone provides

- Android Activity and landscape full-screen OpenGL ES 3.0 surface.
- JNI bridge into a C++17 native shared library.
- Procedural industrial-yard terrain and environment geometry.
- Roads, warehouse structures, ribbed shipping containers, perimeter fences, watchtowers, cover lanes, crates, drums, light poles, trees, and rocks.
- Per-vertex material colors, directional lighting, depth testing, and distance fog.
- Touch-drag orbit camera.

The scene is an original procedural blockout. It is not a finished asset-art pass and does not yet include a player, collision system, navigation, or gameplay.

## Toolchain

- Android Gradle Plugin 9.5.0
- Gradle wrapper distribution 9.6.1
- JDK 17
- Android SDK Platform 35
- Android NDK and CMake from the installed Android toolchain
- C++17 and OpenGL ES 3.0

## Build steps

1. Open the repository root as a Gradle project in Code on the Go.
2. Ensure JDK 17, Android SDK Platform 35, NDK, and CMake are available.
3. Sync Gradle.
4. Run the `:app:assembleDebug` task.
5. Install `app/build/outputs/apk/debug/app-debug.apk` on an ARM64 Android device.
6. Drag horizontally and vertically to orbit the environment.
7. Pause and resume the app, then close and reopen it.

## Acceptance checklist

- [ ] Gradle sync succeeds in Code on the Go.
- [ ] CMake configures and compiles `emm_native`.
- [ ] APK packages `lib/arm64-v8a/libemm_native.so`.
- [ ] APK installs and launches.
- [ ] An OpenGL ES 3.0 context is created.
- [ ] Terrain, roads, warehouses, containers, perimeter structures, and cover props render.
- [ ] Touch dragging orbits the environment without rendering errors.
- [ ] Pause/resume and repeated launches work.
- [ ] Build output, screenshots, device details, and frame-rate observations are recorded.

Do not mark the milestone complete until the checklist has been tested on a real device. The source update has not yet been verified by an Android build or device test.

## Next gate

1. Verify the procedural scene on the target phone and measure frame time.
2. Improve art quality with original or properly licensed PBR models and materials.
3. Add collision meshes matching visible geometry.
4. Add navigation paths and test non-combat bot traversal.
5. Add the player character and movement only after the environment scale and collision are validated.

Do not reuse Local Warfare code or assets without written permission that expressly covers that use.
