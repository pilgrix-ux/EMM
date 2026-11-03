# EMM — Native Android First Playable Slice

**Status:** Local Warfare APK reference audit complete; EMM native implementation not started.

## Product decision

EMM is to be built as a **native Android application without Unity**.

Local Warfare is an installable Android APK, but inspection of its player files identifies a Unity 2022.3.62f2 runtime and IL2CPP. That describes the implementation of the reference game; it does not require EMM to use Unity. Unity's IL2CPP compiles managed code into platform-specific native machine code packaged in the Android application.

## First playable slice

- One polished, fully rigged playable character with tested movement animations.
- One original, compact rusted industrial-yard map.
- Obstacles with consistent collision and navigation.
- Non-combat bot navigation: patrol routes, waypoint/objective movement, obstacle avoidance, and stuck recovery.
- A local objective-based test loop for validating movement, map layout, collision, and navigation.
- A stable Android build with measured performance settings.

The character, map layout, names, textures, animations, and UI must be original or appropriately licensed unless written permission expressly covers Local Warfare material.

## Reference APK audit

The supplied archive contains:

- `base.apk` — 96,973,290 bytes
- `split_config.arm64_v8a.apk` — 22,360,626 bytes
- App label: Local Warfare Re: Portable
- Package: `com.DazadGame.LocalWarfareRePortable`
- Version: `1.8f17` (version code 61)
- Unity player data identifies Unity **2022.3.62f2**.
- The build is IL2CPP: it contains `global-metadata.dat` and native `libil2cpp.so`, rather than an editable `Assembly-CSharp.dll`.
- The assembly manifest lists Unity AI Navigation, Mirror and related transport assemblies, and PlayFab.

Assembly entries show which libraries are packaged; they do not prove how every feature is used. The APK does **not** contain the editable original project, scenes, prefabs, source scripts, or original asset hierarchy. It is not a native Android source project.

## Native Android architecture (no Unity)

### Android application layer

- Kotlin/Java for the Android Activity lifecycle, input, window/surface lifecycle, permissions, settings, and packaging.
- JNI boundary between Android-facing code and the native game runtime.
- Keep ordinary menus and Android-facing UI separate from the real-time 3D renderer.

### Native game runtime

- C++ through the Android NDK, built with CMake where the selected development environment supports it.
- A renderer abstraction: evaluate OpenGL ES as a broad compatibility baseline and Vulkan as an optional newer-device backend after capability checks and profiling. Android supports both APIs; Vulkan is lower-level and is not available on every device.
- Separate modules for scene loading, transforms/math, mesh/material resources, skeletal animation, lighting, collision, navigation, input, audio, and frame pacing.
- Prepare optimized runtime assets through a separate asset pipeline; do not rely on the phone to perform expensive authoring/import work.

### Character, map, and bots

- Character: production-quality humanoid model, clean topology, UVs, PBR materials, weighted rig, smooth movement animation transitions, and target-device validation. No primitive stand-ins as final art.
- Map: original industrial-yard layout with distinct landmarks, connected routes, finished materials, and obstacle meshes whose collision matches their visible geometry.
- Bots: implement non-combat navigation first—patrol, waypoint/objective movement, obstacle-aware path planning, collision response, and stuck recovery. Test routes from multiple start positions.

### Networking

- Do not infer the reference game's server model from the presence of Mirror assemblies alone.
- First stabilize and measure the local game loop. Evaluate networking architecture separately against the actual multiplayer requirements and target-device connectivity.

## Quality gates

1. Finished character model and tested movement animations; no cube placeholders as final art.
2. Finished map materials, lighting, landmarks, collision, and validated navigation.
3. Bots complete repeatable movement routes without clipping through obstacles or getting stuck.
4. Clean Android build installs, launches, and completes the local objective loop repeatedly.
5. Measure frame time, memory, loading, and thermal behaviour on real target phones; tune from evidence.
6. Keep screenshots, build logs, device details, and a test checklist for each milestone.

## Current blockers

- The EMM repository had only its initial README before this audit document; it has no native Android or C++ game project yet.
- The supplied Local Warfare APK is a compiled Unity/IL2CPP reference build, not editable source.
- The development setup must be checked for Android NDK, CMake, native compiler, and asset-pipeline support. Do not claim Code on the Go can build the complete native renderer until that has been tested.
- No written permission from the original developer has been reviewed here. Do not copy Local Warfare code, models, textures, maps, sounds, UI art, or other proprietary assets unless permission expressly covers that use.

## Next implementation gate

1. Verify Android NDK/CMake toolchain availability in the actual development setup.
2. Create the smallest native Android shell that opens a native rendering surface.
3. Verify a real 3D test scene on the target phone and measure frame time.
4. Build the character, industrial-yard scene, collision, and bot navigation as separate, testable milestones.

Do not create fake placeholder art and call it finished. Do not claim to modify Local Warfare's original source: the supplied APK does not contain that editable source.
