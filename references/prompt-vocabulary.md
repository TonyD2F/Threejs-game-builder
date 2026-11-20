# Prompt vocabulary: turning vague words into three.js techniques
From the video "Build Unlimited AI Games for FREE" (transcript supplied by user): five "words" unlock game types. Map each user word to a concrete implementation.

## 1. Visual style words -> implementation
One word changes the whole look. If the user gives none, ask once (multiple choice) or pick one and state it.
| Word | three.js implementation |
|---|---|
| Low poly / flat shaded | Low-segment geometry, `MeshStandardMaterial({ flatShading: true })`, muted palette |
| Cell/toon shaded | `MeshToonMaterial` + gradient map, inverted-hull or post outline |
| Pixel art | Low-res render target upscaled with `NearestFilter`, or pixelation pass; `OrthographicCamera` |
| Voxel | Box geometry on a grid, `InstancedMesh`, greedy meshing for big worlds |
| Isometric | `OrthographicCamera`, ~35 deg pitch / 45 deg yaw |
| Neon / cyberpunk | Dark scene, emissive materials, bloom |
| Clay / matcap | `MeshMatcapMaterial` or rough standard material, soft light |
| Wireframe / blueprint / hologram | `wireframe: true` / edges / additive fresnel shader |
Without a style word, output looks generic: always set one.

## 2. "three.js" as the keyword
When writing or reading prompts, name concrete concepts (camera type, material, shader, particles, instancing, raycasting, post-FX). Use `references/api-map.md` to pick the exact term.

## 3. Screenshot-to-game (clone workflow)
If the user supplies a screenshot or "make something like game X": view the image, list mechanics, layout, HUD, palette and feedback effects, write a 5-line spec, then build an original game inspired by it (own art, names and assets; do not copy trademarked IP/assets). Offer tweaks as v2 features.

## 4. Genre names do the work
| Genre word | Recipe |
|---|---|
| Endless runner (Subway Surfers-like) | 3 lanes, chase camera, world scrolls toward player (recycle chunks from a pool), lane-switch tween, jump/slide with timers, obstacle/coin spawner with seeded RNG, speed ramps, optional phase change (e.g. sky/flying with cloud props) |
| Fruit-Ninja-style slicer | Spawn arcs with gravity, pointer trail + raycast/segment-vs-sphere test, split into halves, combo score |
| Educational/math game (e.g. numbered logs -> equations) | Pure `logic/` module for the puzzle rules (testable), 3D only for presentation, large readable DOM HUD |
| Domino/physics builder | Rapier or Cannon rigid bodies, place/edit mode vs run mode, step only in run mode |
| Arcade collector, platformer, racer, shooter | See SKILL.md section 4 |

## 5. Instancing for "a lot of something"
Grass, leaves, particles, soldiers, coins, bullets: **instance it**. Video example: 2M animated grass blades in one draw call.
- Same mesh with per-instance transform: `InstancedMesh` (set `instanceMatrix`, `needsUpdate`).
- Per-instance custom data (color, phase, height): `InstancedBufferGeometry` + `InstancedBufferAttribute`, animate in the vertex shader (WebGL GLSL) or TSL node (WebGPU), e.g. wind = sin(time + instancePhase), so the CPU does no per-blade work.
- Millions: also chunk + frustum-cull chunks, use LOD/fewer blade segments, keep one material.
- Never create one `Mesh` per item beyond a few hundred.

## 6. Physics via named libraries
Naming a library triggers the right integration: Rapier (default, fastest), Cannon.js/cannon-es (simple 3D), Ammo.js (soft bodies/vehicles), Matter.js/Planck.js (2D). See `references/physics-and-collision.md`.

## 7. Deliverable style
Video builds are quick HTML prototypes. For prototypes: one `index.html` + import map pinned to an exact three version. For anything meant to ship: the Vite starter.
