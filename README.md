# EMM — Native Android 3D Game

EMM is being developed as a native Android application with a C++ game runtime. It does not use Unity.

## Current milestone

Native 3D foundation (diagnostic build):
- Android Activity and APK packaging.
- Android NDK + CMake C++ shared library.
- OpenGL ES 3.0 rendering from C++ through JNI.
- A smooth, lit diagnostic sphere and touch-drag rotation.
- Landscape orientation and Android pause/resume handling.

The sphere is renderer test geometry only. It is not the EMM character or a finished game asset. The next rendering milestone is Filament integration and loading a real, licensed GLB model.

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
4. Build the :app:assembleDebug task.
5. Install the debug APK on an ARM64 Android device.
6. Drag the diagnostic sphere to rotate it. Pause and reopen the app to test lifecycle handling.

If SDK Platform 35 or the required CMake/NDK toolchain is missing, install it through the environment's SDK/add-on manager before building.

## Project layout

- app/src/main/java/ — Android Activity and touch/lifecycle integration.
- app/src/main/cpp/ — C++ renderer and CMake build.
- docs/ — reference audit, research, and implementation notes.

## Important status

The repository contains the first native project scaffold, not a finished game. No device build or runtime test is claimed until an actual build log and device result are available. No Local Warfare proprietary source or assets are included.
