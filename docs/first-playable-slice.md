# EMM — First Playable Slice

**Status:** reference audit complete; playable implementation not started.

## Scope

Build one polished, original first slice for EMM:

- One fully rigged playable character.
- One compact, rusted industrial-yard map.
- A complete obstacle layout with reliable player collision and bot navigation.
- Bot opponents that can patrol, detect relevant activity, choose a reachable route, move around obstacles, reposition when blocked, and resume their task.
- A stable Android build with a simple match loop and performance settings.

“Rusty” is treated as an industrial-yard visual theme for this first pass. The character, map layout, names, textures, animations, and UI must be original EMM work unless written permission explicitly covers use of Local Warfare material.

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

These assembly entries show what libraries are packaged, not whether or how every feature is used. The APK does **not** contain the original Unity Editor project, editable scenes, prefabs, source scripts, or the source asset hierarchy. It is therefore not enough to safely modify the original game as a normal Unity project.

## Implementation direction

### Character

- Use a production-ready humanoid mesh, clean topology, UVs, PBR materials, and a properly weighted rig.
- Include a coherent movement animation set and smooth transitions; avoid primitive/block placeholders.
- Validate proportions, silhouette, materials, clipping, and animation deformation in-engine before calling it complete.
- Keep mobile texture sizes, mesh complexity, and LODs appropriate to the target Android devices.

### Industrial-yard map

- Create an original, readable arena with distinct landmarks and multiple connected routes.
- Build obstacles as real meshes with matching collision, not decorative objects that players or bots can walk through.
- Include low and tall cover, walls, barriers, containers, ramps, and clear spawn/return paths.
- Bake and validate navigation data; use obstacle carving or runtime navigation updates only where needed.
- Check sightlines, collision gaps, spawn safety, stuck locations, and performance on-device.

### Bots

- Use navigation-based movement with patrol routes, task goals, obstacle-aware pathfinding, and route recovery.
- Bots must not walk through solid geometry, repeatedly push into blocked routes, or become permanently stuck.
- Test each obstacle and route from multiple start points.
- Keep bot logic modular so behaviour can be tuned without rebuilding the map.

### Networking and architecture

- Treat Mirror as a candidate reference because its assemblies are present in the APK; verify the actual original project configuration before adopting it.
- Do not assume the original transport, server model, or PlayFab integration from assembly names alone.
- Keep the first slice small and measurable; do not introduce online dependencies into a local test build unless the feature requires them.

## Quality gates

No feature is marked complete just because it compiles.

1. The character must use a finished rigged model and tested animations; no cubes or primitive stand-ins as final art.
2. The map must have finished materials, lighting, landmarks, collision, and tested navigation.
3. Bots must complete repeatable route tests around every obstacle without getting stuck.
4. A clean Android build must install and launch, complete a match loop, and survive repeated runs.
5. Profile frame time, memory, loading, and thermal behaviour on a real target phone. Tune quality settings and LODs from measured results.
6. Keep before/after screenshots, build logs, and a test checklist for each milestone.

## Current blockers

- The EMM repository currently contains only its initial README; no Unity project or game code is present.
- The supplied APK is a compiled reference build, not the editable source project.
- No written permission from the original developer has been reviewed here. Do not copy Local Warfare code, models, textures, maps, sounds, UI art, or other proprietary assets unless permission expressly covers that use.
- To modify the original project itself, obtain the Unity project and written permission covering the intended changes and separate EMM build. Otherwise, implement original EMM systems and assets using the APK only as a high-level behaviour reference.

## Next implementation gate

Before writing game scripts or importing assets, obtain one of:

- The original Unity project and written permission for the intended modifications; or
- An EMM Unity project to build on, with original/licensed character and environment assets.

Then inspect the actual project structure and build settings before changing anything.
