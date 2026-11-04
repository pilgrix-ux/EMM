# EMM — Native Android 3D Game

EMM is being developed as a native Android application with a C++ game runtime. It does not use Unity.

## Current milestone: first 3D environment blockout

The diagnostic sphere has been replaced by an original, procedurally built industrial-yard environment rendered with native C++ and OpenGL ES 3.0.

The scene currently contains:
- A broad outdoor terrain surface with gently varied perimeter ground.
- Concrete access roads and painted lane markers.
- Two industrial warehouse structures.
- Shipping containers with ribbed side details.
- Perimeter fencing and four elevated watchtowers.
- A central objective platform and multiple low-cover lanes.
- Crates, drums, concrete barriers, light poles, trees, rocks, and distant yard details.
- Directional lighting, per-vertex material colors, depth testing, and distance fog.
- Touch-drag orbit camera so the environment can be viewed from different angles.

This is a first environment blockout made from procedural geometry. It is a real 3D scene, but it is not yet a finished art pass: it does not yet have production texture maps, imported authored assets, player movement, collision, navigation, or gameplay.

## Build requirements

- JDK 17
- Gradle 9.6.1
- Android Gradle Plugin 9.5.0
- Android SDK Platform 35
- Android NDK and CMake installed through the development environment
- ARM64 Android device for the first device test

The Android Gradle Plugin 9.5.0 release notes specify JDK 17 and Gradle 9.6.0 as the default toolchain pairing. Gradle 9.6.1 is set in the wrapper properties.

## Build in Code on the Go

1. Install the Code on the Go NDK/CMake add-on if it is not already installed.
2. Open/import this repository as a Gradle project.
3. Allow Gradle to sync and download the declared Android Gradle Plugin.
4. Build the `:app:assembleDebug` task.
5. Install the debug APK on an ARM64 Android device.
6. Drag across the screen to orbit the industrial-yard environment.

If SDK Platform 35 or the required CMake/NDK toolchain is missing, install it through the environment's SDK/add-on manager before building.

## Project layout

- `app/src/main/java/` — Android Activity and touch/lifecycle integration.
- `app/src/main/cpp/` — C++ OpenGL ES renderer and procedural environment geometry.
- `docs/` — reference audit, research, and implementation notes.

## Important status

The environment source has been committed, but a successful Android build and on-device visual test have not yet been confirmed. Do not treat this source update as a verified APK. No Local Warfare proprietary source or assets are included.

## Next environment/game milestones

1. Build and visually inspect this environment on the target phone.
2. Add authored PBR environment assets and improve terrain/building materials.
3. Add matching collision geometry and player-scale measurements.
4. Add navigation paths and a non-combat bot traversal test.
5. Add the playable character, movement, and camera controls.
6. Profile frame time, memory, loading, and thermal behaviour on the target device before expanding scene complexity.
