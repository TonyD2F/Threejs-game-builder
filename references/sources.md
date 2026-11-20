# Sources (retrieved 2026-11-18)
- https://learnwithhasan.com/threejs-guide/ : 20-chapter interactive guide (geometry, materials, cameras, lights, objects, controls, post-FX, styles, shaders, textures, animation, raycasting, loaders, particles, shadows, environment, WebGPU/TSL, devtools, performance, responsive). Page was fetched; interactive demos not rendered.
- https://learnwithhasan.com/js-libraries/ and /three-js/ : 26-library hub; physics/animation/2D alternatives. Its CDN snippet is outdated (global build).
- https://youtu.be/Aj2LoQ8hcSQ ("Build Unlimited AI Games for FREE"): transcript supplied by the user; basis for references/prompt-vocabulary.md.
- https://threejs.org/manual/en/webgpurenderer : `three/webgpu` import, WebGPURenderer with WebGL2 fallback, TSL, `forceWebGL`.
- https://threejs.org/docs/pages/Timer.html : Timer API (`connect`, `update`, `getDelta`, `getElapsed`).
- https://www.utsubo.com/blog/threejs-2026-what-changed : r187 latest (2026-10-30); r183 renamed PostProcessing to RenderPipeline and deprecated Clock; WebGPU default in major browsers.
- https://www.utsubo.com/blog/webgpu-threejs-migration-guide : EffectComposer/pmndrs postprocessing do not run on WebGPURenderer; Inspector since r181.
- https://github.com/sunquakes/react-three-lite/releases/tag/0.5.0 : three has shipped no UMD bundle since r160; `three` and `three/webgpu` have distinct class identities.
- npm: @dimforge/rapier3d-compat (sources disagree on latest, 0.19.3 most recent; run `npm view`).
Verified locally: three@0.187.0 exports `WebGPURenderer`, `RenderPipeline`, `Timer` (also `Clock`, deprecated); starter passes `npm test` and `vite build`. Not verified: rendering in a real browser.
