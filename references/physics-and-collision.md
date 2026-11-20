# Physics and collision

## Choose
1. **No engine** (kinematic movement + AABB/sphere/ray tests): arcade, runners, puzzle, top-down. Smallest, most predictable.
2. **Rapier** (`@dimforge/rapier3d-compat`, inlined WASM, async `await RAPIER.init()`): rigid bodies, character controller, joints, sensors. Check `npm view @dimforge/rapier3d-compat version` and the rapier.rs JS docs for the current API before coding.
3. **Cannon-es**: small scenes, easy API. **Ammo.js**: soft bodies/vehicles only.

## Rapier pattern (verify API against current docs)
```js
import RAPIER from '@dimforge/rapier3d-compat';
await RAPIER.init();
const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
const eq = new RAPIER.EventQueue(true);

function addBox(mesh, { dynamic = true, hx = .5, hy = .5, hz = .5 } = {}) {
  const bd = (dynamic ? RAPIER.RigidBodyDesc.dynamic() : RAPIER.RigidBodyDesc.fixed())
    .setTranslation(mesh.position.x, mesh.position.y, mesh.position.z);
  const body = world.createRigidBody(bd);
  world.createCollider(RAPIER.ColliderDesc.cuboid(hx, hy, hz).setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS), body);
  return { mesh, body };
}
// fixed step: world.timestep = 1/60; world.step(eq);
// sync: const t = body.translation(); mesh.position.set(t.x, t.y, t.z); const r = body.rotation(); mesh.quaternion.set(r.x, r.y, r.z, r.w);
// events: eq.drainCollisionEvents((h1, h2, started) => { ... });
```
- Step physics inside the fixed update, then copy transforms to meshes (interpolate for smoothness).
- Player: kinematic character controller (`world.createCharacterController(0.01)`) for platformers; dynamic capsule for physics-y games.
- Sensors (`setSensor(true)`) for pickups/triggers.
- Free WASM objects on teardown (`world.free()`).

## Arcade recipes
- **Ground check:** downward `Raycaster` from the feet or `Box3` overlap; add coyote time (~100 ms) and jump buffer (~100 ms).
- **Platformer collision:** move X, resolve; move Y, resolve (axis-separated).
- **Many entities:** uniform spatial hash grid (cell ~ 2x entity size).
- **Bullets:** raycast per step from previous to new position to avoid tunnelling.
- **Determinism:** fixed step + seeded RNG; Rapier has a deterministic build (`@dimforge/rapier3d-deterministic-compat`) for lockstep multiplayer.
