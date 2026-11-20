# three.js API map for games
Structure follows the 20 chapters of learnwithhasan.com/threejs-guide (fetched 2026-11-18) plus current-release notes (r183-r187).

| Area | Use in games | Notes |
|---|---|---|
| Geometry | `BoxGeometry`, `SphereGeometry`, `CapsuleGeometry` (characters), `CylinderGeometry`, `PlaneGeometry` (floors), `ExtrudeGeometry`/`LatheGeometry` (props), custom `BufferGeometry` | All geometry is `BufferGeometry` (typed arrays). Lower segment counts on mobile. Share instances. |
| Materials | `MeshStandardMaterial` (default PBR), `MeshToonMaterial` (cel), `MeshBasicMaterial` (unlit UI/FX, cheapest), `MeshLambertMaterial` (cheap diffuse), `MeshPhysicalMaterial` (glass/clearcoat: costly), `MeshMatcapMaterial` (no lights needed) | Emissive + bloom for neon. On WebGPU, TSL node materials (`MeshStandardNodeMaterial`). |
| Cameras | `PerspectiveCamera` (3D), `OrthographicCamera` (isometric/2.5D/UI) | Presets: free orbit, first person, third person, top-down, racing, side scroller, isometric, cinematic, bird's-eye, security cam. Update projection matrix after changing aspect/fov. |
| Lights | `HemisphereLight` (ambient fill), `DirectionalLight` (sun+shadows), `PointLight`/`SpotLight` (few), `AmbientLight`, `RectAreaLight` (costly) | r185 adds clustered lighting on WebGPURenderer for many lights. |
| Objects | `Mesh`, `InstancedMesh`, `BatchedMesh` (r183: per-instance wireframe control), `Points`, `Group`, `Sprite`, `LOD` | Instancing is the main perf lever for repeated entities. |
| Controls | `OrbitControls`, `MapControls`, `FlyControls`, `FirstPersonControls`, `PointerLockControls`, `TrackballControls` | Addons: `three/addons/controls/...`. Ship custom player controllers, not Orbit. |
| Post-FX | WebGPU: `RenderPipeline` (TSL: bloom, DOF, etc.). WebGL: `EffectComposer` + `RenderPass`, `UnrealBloomPass`, `FilmPass`, `GlitchPass`, `AfterimagePass`, `OutputPass` last | Do not mix: EffectComposer does not run on WebGPURenderer. |
| Styles | Realistic PBR, Clay, Low-poly, Toon, Wireframe, Neon, Glass, Pixel, Isometric voxel, Matcap, X-Ray, Blueprint, Hologram, Gold/Chrome | Choose one per game and keep it consistent. |
| Shaders | WebGL: `ShaderMaterial` GLSL (uniforms/varyings). WebGPU: TSL (`three/tsl`) compiles to WGSL/GLSL | Good game uses: wave/water, dissolve, outline, damage flash, scrolling speed lines. |
| Textures | `TextureLoader`, `KTX2Loader`; maps: map, normalMap, aoMap, emissiveMap, envMap, displacement; `repeat`/`wrapS/T` for tiling | `colorSpace = SRGBColorSpace` for color maps only. Atlas sprites where possible. |
| Animation | `Timer` (not Clock), easing functions, `AnimationMixer`/`AnimationClip`/`KeyframeTrack`, morph targets, clip crossfade (idle/walk/run) | Call `mixer.update(dt)` each step. r183 adds `BezierInterpolant`. |
| Raycasting | `Raycaster`: click-to-move, hover, shooting, ground checks, line-of-sight | `intersectObjects(list, recursive)`; hit gives object, point, distance, face normal, uv. |
| Loaders | `GLTFLoader` + `DRACOLoader`/`MeshoptDecoder`, `KTX2Loader`, `LoadingManager` (progress bar), `AudioLoader` | Cache and clone (`SkeletonUtils.clone` for skinned). |
| Particles | `Points` + `PointsMaterial`, instanced quads, sprites; GPU compute on WebGPU (TSL) | Pool; additive blending; short life. |
| Shadows | `renderer.shadowMap.enabled`; light `castShadow`, tune `shadow.camera` bounds, `mapSize`, `bias`/`normalBias` | One shadow light; blob-shadow decals for cheap characters. |
| Environment | `scene.background`, `scene.environment` (PMREM/HDR), fog, procedural sky | r187 rebuilt PMREM on cube render targets. Low-res HDR. |
| WebGPU & TSL | `three/webgpu`, `await renderer.init()`, compute shaders, `forceWebGL` fallback | Firefox WebGPU limited to Windows/Apple Silicon at time of research; fallback handles the rest. |
| DevTools | Three.js Inspector (r181+, WebGPURenderer), `renderer.info`, stats-gl, lil-gui | Remove from production. |
| Performance | Instancing, merging, LOD, culling, texture compression, dispose, pixel-ratio cap | Budget: < ~100 draw calls on mobile. |
| Responsive/mobile | Resize handler, `setPixelRatio(min(dpr,2))`, pointer events, virtual joystick, `touch-action: none`, safe-area insets | Test portrait + landscape. |

## Related libraries (learnwithhasan.com/js-libraries)
- **Physics:** Rapier (3D/2D, Rust/WASM, fastest), Cannon.js (simple 3D), Ammo.js (full Bullet: soft bodies, vehicles), Matter.js / Planck.js (2D).
- **Motion:** GSAP / Motion / Anime.js for UI and camera tweens.
- **2D alternative:** PixiJS for 2D-only games.
- **Alternative engine:** Babylon.js ships physics, GUI, audio, XR and inspector built in; choose it when you want batteries included.
- **Juice/UI:** canvas-confetti, tsParticles (DOM overlays), Lottie/Rive (animated UI).
Note: the Hasan hub's three.js "CDN" snippet uses `three.min.js` (a global build removed after r160). Use npm/Vite or an import map instead.
