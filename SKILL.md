---
name: threejs-game-builder
description: Build complete, production-ready browser games with three.js (3D or 2.5D). Use whenever the user wants a three.js / WebGL / WebGPU game, 3D browser game prototype, arcade/platformer/racer/shooter/puzzle/runner in the browser, or asks to add gameplay (physics, controls, raycasting, collisions, HUD, audio, particles, post-FX) to a three.js scene. Covers current r18x APIs (WebGPURenderer, Timer, RenderPipeline, no UMD build), fixed-timestep loops, Rapier physics, assets, performance, mobile, testing and deployment. Do not use for non-game 3D visualization, 2D-only games (use PixiJS/Phaser), or PlayCanvas/Babylon projects.
---

# three.js Game Builder

Goal: ship a playable, fast, maintainable browser game. Brevity in chat, depth in files.

## 0. Rules that prevent most failures
1. **Verify the version before coding.** three.js releases monthly and breaks APIs. Run `npm view three version` (r187 / 0.187.0 as of Nov 2026) and pin it. Never copy old CDN snippets: `three.min.js` / a global `THREE` has not existed since r160. Use npm + Vite, or an import map with `type="module"`.
2. **Check docs for any API you are unsure of** (threejs.org/docs, threejs.org/manual, the release's Migration Guide). Do not answer from memory for post-r150 APIs.
3. **Decouple simulation from rendering** (fixed timestep, section 3). Never tie game speed to FPS.
4. **Pure logic goes in files with zero three.js imports** so it can be unit-tested in Node.
5. **Dispose what you create** (geometries, materials, textures, render targets) on level change/teardown.
6. **Run it before delivering**: `npm test`, `npm run build`, and, if a browser is available, a headless screenshot/console-error check. If you could not run it in a browser, say so.

## 1. Workflow
1. **Clarify (max 3 multiple-choice questions, only if unspecified):** genre/core loop, platform (desktop / mobile touch / both), **visual style word** (low poly, pixel art, voxel, cel-shaded, isometric, neon...). Otherwise state assumptions in one line. Users often give only a genre word, a style word, a physics library name, or a screenshot: translate each via `references/prompt-vocabulary.md`.
2. **Spec in 5 lines:** core loop, win/lose, controls, camera, scope for v1.
3. **Checklist** the tasks, tick each as done.
4. **Scaffold** from `assets/starter/` (Vite + three, WebGPURenderer with WebGL2 fallback, fixed-step loop, input, HUD, InstancedMesh, tested logic module): copy, `npm install`, then replace the orb-collector gameplay.
5. **Build in this order:** loop + camera + controls -> world/collision -> core mechanic -> win/lose + restart -> HUD/menu -> audio -> juice (particles, shake, post-FX) -> performance pass -> mobile pass.
6. **Verify** (section 8), then **package** (section 9).

## 2. Renderer and API choices (2026)
| Decision | Default | Why / exception |
|---|---|---|
| Renderer | `WebGPURenderer` from `three/webgpu`, `await renderer.init()` | WebGPU in all major browsers; auto-falls back to WebGL2 (`forceWebGL: true` to test fallback). Use classic `WebGLRenderer` + `EffectComposer` only if you depend on addons/libs not yet ported (EffectComposer, pmndrs/postprocessing, drei shader patches do **not** run on WebGPURenderer). |
| Import | `import * as THREE from 'three/webgpu'` | `three` and `three/webgpu` are different builds with distinct classes: never mix objects between them. Addons: `three/addons/...`. TSL: `three/tsl`. |
| Loop | `renderer.setAnimationLoop(ts => ...)` | Handles XR and WebGPU correctly. |
| Time | `THREE.Timer` (`timer.connect(document)`, `timer.update(ts)` once per frame, then `getDelta()`) | `Clock` deprecated in r183. Timer needs `update()` or time stays 0. |
| Post-FX | WebGPU: `RenderPipeline` (renamed from `PostProcessing` in r183) with TSL nodes. WebGL: `EffectComposer` (RenderPass first, OutputPass last). | Order matters. |
| Shaders | TSL (JS that compiles to WGSL/GLSL) | Raw GLSL `ShaderMaterial` only on the WebGL path. |
| Physics | Rapier (`@dimforge/rapier3d-compat`, WASM, async init; check `npm view` for current version) | Cannon-es for tiny/simple; Ammo only for soft bodies; or **no engine** (kinematic + AABB/sphere tests) for arcade games. Details in `references/physics-and-collision.md`. |
| Models | GLB + `GLTFLoader`, Draco/Meshopt, KTX2 textures | Primitives + `MeshStandardMaterial`/`MeshToonMaterial` are fine and load instantly. |
| Debug | Three.js Inspector (WebGPURenderer, r181+), `stats-gl`, lil-gui | Strip from production builds. |

## 2b. Prompt vocabulary (read `references/prompt-vocabulary.md`)
Five levers decide the result: **visual style word**, naming three.js concepts, **screenshot to clone**, **genre name** (e.g. endless runner), **instancing** for large counts (millions of grass blades in one draw call), and a **named physics library**. Apply them when interpreting vague requests; never ship without a deliberate style.

## 3. Core architecture
```
src/
  main.js          bootstrap: renderer, scene, loop, resize
  logic/*.js       pure state/rules (unit-tested, no three imports)
  game/*.js        entities, systems (movement, collision, spawn, AI)
  render/*.js      meshes, materials, camera rig, FX
  ui/*.js          HTML HUD/menus (DOM overlay, not 3D text)
  assets/          GLB, textures, audio
```
- **Fixed timestep:** accumulate `frameDt` (clamped to ~0.1 s), run `update(1/60)` while `acc >= step`, render once. Interpolate with `alpha = acc/step` if motion looks steppy.
- **State machine:** `MENU -> PLAYING -> PAUSED -> WON/LOST`; one source of truth, UI and systems read it.
- **Frame-rate independent smoothing:** `lerp(a, b, 1 - Math.exp(-k * dt))`, never a fixed `0.1`.
- **Entities:** plain objects/classes with `update(dt)` and `dispose()`; a registry per type. Reach for a full ECS only past ~hundreds of heterogeneous entities.
- **Pause on hidden tab** (Timer + Page Visibility) and on `blur`.
- **Seeded RNG** (mulberry32 in starter) for reproducible levels and tests.
- **HUD in DOM** with `pointer-events: none`; 3D labels via CSS2DRenderer only when anchored to world objects.
- **Resize:** update camera aspect + `setSize`; cap `setPixelRatio(min(dpr, 2))`.

## 4. Camera and controls by genre
Pick from these presets (from the Three.js guide's camera chapter) before writing code:
| Genre | Camera | Input |
|---|---|---|
| Arcade / top-down | Perspective high angle or Orthographic | WASD/arrow/drag; smoothed follow |
| Platformer | Third-person follow, slight look-ahead; or side-scroller ortho | Move + jump with coyote time + jump buffer |
| Racer | Chase camera behind, FOV widens with speed | Steer/throttle; raycast-vehicle or arcade kinematics |
| Shooter/FPS | First-person, `PointerLockControls` (addon) | Mouse look + WASD; raycast hitscan |
| Isometric/strategy | OrthographicCamera, fixed angle (~35 deg, 45 deg yaw) | Raycast click-to-move/select |
| Runner | Chase, lane-based | Swipe/tap/keys |
Orbit/Map/Fly controls are for dev tools and viewers, not shipped gameplay. Always support touch (pointer events) if mobile is in scope. Use `references/api-map.md` for the full API-to-game-need mapping.

## 5. Gameplay building blocks
- **Picking/interaction:** `Raycaster.setFromCamera(ndc, camera)`; NDC `x = e.clientX/w*2-1`, `y = -(e.clientY/h*2-1)`; intersect only a filtered list; keep results sorted by distance.
- **Collision (arcade):** `Box3`/`Sphere` tests, spatial hash for many entities; resolve on fixed step, axis-separated for platforming.
- **Spawning many things:** `InstancedMesh` (one draw call; set `instanceMatrix.needsUpdate`), `BatchedMesh` for mixed geometry, object pools instead of `new` in the loop.
- **Animation:** `AnimationMixer.update(dt)` every step; crossfade clips (`fadeIn/fadeOut`); procedural motion from `timer.getElapsed()`.
- **Particles:** `Points` or instanced quads, pooled; short lifetimes; additive blending for sparks.
- **Audio:** `THREE.AudioListener`/`PositionalAudio`; unlock on first user gesture (autoplay policy); pool one-shots.
- **Juice:** screen shake (decaying noise on camera offset), hit-stop (a few frames of dt=0), squash/stretch, bloom on emissives.
- **Save data:** `localStorage` in try/catch (it can throw/be empty).
- **Multiplayer:** server-authoritative over WebSocket; client prediction + interpolation; out of v1 scope unless asked.

## 6. Performance budget
Target 60 fps on a mid phone: **< ~100 draw calls**, < ~500k triangles on screen, `dpr <= 2`.
- Instance/batch repeated meshes; share geometries & materials; merge static geometry.
- Fewer lights; **one** shadow-casting directional light, tight shadow camera frustum, 1024-2048 map; bake or fake others.
- `frustumCulled` on (default); `LOD` for big scenes; `fog` to cut far plane.
- Avoid per-frame allocations (`new Vector3`) in hot loops; reuse temp objects.
- Compress: Draco/Meshopt geometry, KTX2 textures, `webp`/`avif` for UI; lazy-load levels.
- Measure with `renderer.info` (calls, triangles, geometries, textures), stats-gl, Inspector, Chrome Performance panel.
- Dispose on teardown: `geometry.dispose()`, `material.dispose()`, `texture.dispose()`, `renderTarget.dispose()`; `renderer.dispose()` on unmount.

## 7. Style (cheap but good-looking)
Consistent palette, one hero light + hemisphere fill, fog matched to background, emissive accents + bloom, `MeshToonMaterial`/`MeshStandardMaterial` with roughness 0.4-0.9, simple geometric silhouettes. Style gallery options: Low-poly, Toon, Neon, Clay, Pixel, Isometric voxel, Hologram.

## 8. Verification (before delivering)
1. `npm test` (logic tests) and `npm run build` must pass with no errors.
2. If Playwright/Chromium is available: load the built page headless (use `--use-angle=swiftshader` or `forceWebGL`), assert no console errors, take a screenshot, simulate key input, check the score/state changed.
3. Compare to the original request: core loop, win/lose, restart, controls, mobile touch, HUD. Fix gaps once; do not re-read endlessly.
4. Report plainly what was and was not run in a real browser.

## 9. Package
Deliver a project folder (or zip) with `README.md` (run/build/controls), pinned `package.json`, and a static `dist/` build. Deploy: any static host (GitHub Pages, Netlify, Cloudflare Pages, itch.io HTML5 zip). Set Vite `base: './'` for subpath/itch.io hosting. Single-file prototypes: one `index.html` with an import map pinned to an exact version on a CDN (`https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.module.js`, with `three/addons/` mapped to `.../examples/jsm/`).

## 10. Common pitfalls
Black scene (no light with `MeshStandardMaterial`); time stuck at 0 (`Timer.update()` missing); lights ignored (mixed `three` and `three/webgpu` imports); washed colors (set textures' `colorSpace = SRGBColorSpace` for color maps only); movement faster on 144 Hz (no fixed step); memory growth (no dispose, no pooling); audio silent (no user gesture); physics tunnelling (large dt or small colliders: use fixed step + CCD); `await renderer.init()` forgotten on WebGPURenderer; EffectComposer used with WebGPURenderer.

## References (read when needed)
- `references/prompt-vocabulary.md`: style words, genre recipes, screenshot-clone workflow, instancing patterns.
- `references/api-map.md`: three.js API areas mapped to game needs (geometry, materials, cameras, lights, instancing, controls, post-FX, shaders/TSL, textures, animation, raycasting, loaders, particles, shadows, environment, WebGPU, devtools, performance, responsive).
- `references/physics-and-collision.md`: Rapier setup snippet, kinematic character, arcade collision recipes.
- `references/sources.md`: URLs and what was verified.
