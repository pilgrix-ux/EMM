# EMM Native Android Game Stack Research

**Research date:** 4 November 2026  
**Decision:** build EMM as a native Android application with a C++ game runtime; do not use Unity.

## Executive recommendation

Do not write a complete 3D engine from zero. Use Android's native game integration and a small set of mature C++ libraries:

| Layer | Recommended direction | Responsibility |
|---|---|---|
| Android app | Kotlin/Java + Android Gradle project | APK identity, lifecycle, permissions, settings, platform UI |
| Native game entry/input | Android AGDK GameActivity | Android lifecycle and input events exposed to C/C++ |
| Native code/build | Android NDK + CMake | C++ game runtime and native libraries |
| Rendering | Google Filament | PBR materials, lighting, meshes, glTF loading, rendering |
| Character assets | glTF 2.0 / GLB pipeline | Rigged model, skeleton, animation clips, materials |
| Navigation | Recast + Detour; DetourCrowd if needed | Navmesh generation, runtime paths, agent avoidance |
| Physics | Start with static collision; evaluate Jolt later | Character/world collision and more advanced rigid-body simulation |

This is a native Android app with native C++ libraries in its APK. It does not use Unity. The chosen components do not automatically make a complete game: EMM still needs its own game loop, character controller, scene structure, bot state/navigation integration, menus, audio integration, and art/content pipeline.

## What the original reference tells us

The inspected Local Warfare APK is a compiled Unity 2022.3.62f2 / IL2CPP Android build. It contains native libraries and compiled metadata, not the editable original project, source scripts, scenes, or prefabs. It is therefore not a native Android source project that can be opened and continued in Code on the Go.

The public APK and its assembly manifest are useful for high-level reference only. A package listing can show libraries present in a build; it cannot establish the exact internal gameplay, bot logic, map structure, or networking configuration. Do not claim that we have recovered or reproduced the original code.

## Code on the Go feasibility

The Code on the Go publisher's current site lists release 26.43 as updated on 20 October 2026. Its add-on catalogue lists **NDK Installer v1.1.1** (193.4 MB), which installs the Android NDK and CMake and adds a native project template. The publisher's R1 release notes say that this template includes C++ support, JNI bindings, and CMake build configuration.

This makes a native C++ proof-of-concept plausible in Code on the Go. It does **not** prove that a full 3D game, every Gradle dependency, all asset-processing tools, signing, or long builds will work reliably on the phone. Verify those parts with small builds before committing the game architecture.

### Required proof-of-toolchain sequence

1. Install the publisher-listed NDK Installer add-on and create its native Android project template.
2. Build the unmodified template and install its APK on the target phone.
3. Add one C++ JNI function, rebuild, and verify that the APK loads the native library.
4. Add GameActivity and a native rendering surface; confirm lifecycle and touch-input handling after pause/resume.
5. Add Filament and render its Android hello-triangle sample.
6. Load one properly rigged GLB character and confirm its animation plays on the phone.
7. Only after those gates pass, build the industrial-yard map, collision and bot navigation.

If a build stage fails, fix that stage before adding another library. Keep build logs and device results for every gate.

## Android native integration

Android's AGDK includes GameActivity, Frame Pacing, GameController, GameTextInput, Oboe and performance-related tools. Google recommends GameActivity for new C/C++ games; it integrates with Android's activity lifecycle and passes input and lifecycle events to native code. Use it rather than starting with a hand-written Activity/JNI bridge unless the selected Code on the Go template requires a different integration.

CMake is a supported NDK build system. Android Gradle Plugin can call CMake or ndk-build and package native shared libraries into the APK.

## Renderer selection

### Filament — preferred first renderer to test

Filament is designed to be compact and efficient on Android. Its documented capabilities include a native C++ API and Java/JNI API, physically based rendering, OpenGL ES 3.0 and Vulkan backends on Android, and a glTF 2.0 loader. Its Android samples include a hello-triangle, a glTF viewer and C++ samples called through JNI.

That gives EMM a head start on realistic material response, lighting, texture loading and character asset display without creating a renderer from scratch. Filament is a rendering engine, **not** a complete game engine: it does not supply EMM's map authoring workflow, game rules, player controller, collision design or bot logic.

Keep the Filament runtime and its host-side asset/material tools on matching release versions. Prepare and validate assets before packaging them.

### Other options considered

- **Raw Vulkan:** highest control and a direct native path, but requires building much more renderer infrastructure. Not the first choice for this project.
- **bgfx:** a cross-platform rendering abstraction, not a complete game engine. It still leaves the game systems and asset pipeline to EMM.
- **Godot:** a non-Unity engine with an Android editor and Android export. Its Android editor is documented as early access; the editor UX is not optimized for phones, C# is unavailable there, and the Forward+ renderer is not recommended on Android due to performance issues. It is an option only if using a game engine is acceptable.
- **O3DE:** has Android export support, but its documented Android workflow requires the O3DE Editor/Asset Processor to prepare Android assets and generates a Gradle/CMake project. That is a poor fit for an all-on-phone Code on the Go workflow.

## Character and map asset pipeline

Use properly authored glTF 2.0 / GLB assets. Filament's glTF loader can load model assets, and its Android model viewer sample provides a starting point for validating models. For the intended quality, the character needs a finished mesh, UVs, materials, skeleton, skin weights and authored animation clips. The industrial-yard map needs real geometry, materials, lighting and matching collision. A code editor is not a replacement for a 3D modelling, rigging and animation tool.

Do not present primitive geometry as finished character art or the final map. A temporary collision test scene may use simple shapes internally, but the visible milestone must use the actual approved/licensed art assets.

## Collision, physics and bot navigation

For the first map, keep static obstacle collision simple, deterministic and measurable. Add a full rigid-body physics library only when the slice needs it.

- **Recast** builds navigation meshes from level geometry.
- **Detour** loads navigation data and calculates runtime paths.
- **DetourCrowd** supports agent movement and collision avoidance.
- **Jolt Physics** is a C++ physics and collision library whose upstream documentation lists Android ARM64 support and C++17. Treat it as an optional later dependency; it increases integration and CPU complexity.

The first bot milestone is navigation quality, not advanced decision-making: bots should follow reachable routes, respect obstacle collision, avoid repeatedly pushing into blocked paths, and recover from a path that becomes unavailable. Validate every important route from several start points.

## Target-device findings

The device identifier TECNO KL5 is commonly catalogued as a TECNO Spark 30C using a MediaTek Helio G81 and Mali-G52 MC2. Third-party device records report Android 14 / API 34, OpenGL ES 3.2 and Vulkan 1.1. RAM reports are inconsistent between 4 GB and 6 GB variants, so do not assume the installed memory amount from the model code alone.

Use arm64-v8a as the first device target if confirmed by the installed device. Query graphics features at runtime rather than hard-coding them. Android's current guidance recommends Vulkan for new projects; Vulkan 1.1 is supported on 64-bit Android 10+ devices, while OpenGL ES remains supported as a fallback. Filament documents both Vulkan and OpenGL ES backends on Android.

Start with conservative quality settings and frame-pacing measurements. Do not assume a high frame rate from a successful build. Test a long session on the actual phone and measure frame time, memory use, loading and thermal behaviour. For an initial quality gate, establish a stable 30 FPS profile first; then test whether higher settings or 60 FPS are sustainable. The target can be raised only after measurements support it.

## First playable slice definition

- One finished, rigged EMM character with a small, coherent animation set.
- One original rusted industrial-yard map with readable landmarks and multiple connected routes.
- Real obstacle meshes with matching collision; no invisible collision gaps or decorative obstacles that block the player unexpectedly.
- A local test loop with a player controller and bots that can navigate the map without getting stuck.
- Android pause/resume, touch controls, stable loading, and repeated clean launches.
- Build logs, screenshots, route-test results and device performance measurements.

## Not promised by this research

This research does not establish that Code on the Go can already build the complete EMM game. It does not prove CODM-level visual quality, recover Local Warfare's editable source, or grant permission to copy its proprietary assets or code. Visual quality depends on actual models, textures, rigging, animation, lighting, level design and iterative device testing.

## Sources

- Code on the Go current release page: https://appdevforall.org/code-on-the-go/
- Code on the Go add-on catalogue (NDK Installer v1.1.1): https://addons.appdevforall.org/
- Code on the Go R1 release notes (NDK/CMake template): https://appdevforall.org/code-on-the-go-r1-release-notes/
- Android GameActivity setup: https://developer.android.com/games/agdk/game-activity/get-started
- Android Game Development Kit overview: https://developer.android.com/games/agdk/overview
- Android NDK / CMake: https://developer.android.com/ndk/guides/cmake
- Android Vulkan guidance: https://developer.android.com/games/develop/vulkan/overview
- Filament project and Android samples: https://github.com/google/filament
- Filament glTF loader: https://google.github.io/filament/dup/gltfio.html
- Recast Navigation: https://github.com/recastnavigation/recastnavigation
- Jolt Physics: https://github.com/jrouwe/JoltPhysics
- Godot Android editor limitations: https://docs.godotengine.org/en/latest/tutorials/editor/using_the_android_editor.html
- O3DE Android workflow: https://docs.o3de.org/docs/user-guide/platforms/android/
- TECNO KL5 / Spark 30C third-party device records: https://www.deviceinfo.app/devices/tecno/spark-30c/
