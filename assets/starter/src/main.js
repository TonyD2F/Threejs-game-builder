import * as THREE from 'three/webgpu';
import { createGame, start, collect, tick, rng, State } from './logic.js';

const FIXED_DT = 1 / 60;       // fixed simulation step
const MAX_FRAME = 0.1;         // clamp to avoid spiral of death
const ORBS = 30, ARENA = 18, SPEED = 7;

// ---------- renderer (WebGPU with automatic WebGL2 fallback) ----------
const renderer = new THREE.WebGPURenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
document.body.prepend(renderer.domElement);
await renderer.init();

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0f1a);
scene.fog = new THREE.Fog(0x0b0f1a, 25, 60);
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 200);

// ---------- world ----------
scene.add(new THREE.HemisphereLight(0xaac8ff, 0x223344, 1.1));
const sun = new THREE.DirectionalLight(0xffffff, 2.2);
sun.position.set(8, 14, 6);
scene.add(sun);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(ARENA * 2, ARENA * 2),
  new THREE.MeshStandardMaterial({ color: 0x1b2a41, roughness: 0.9 }),
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

const player = new THREE.Mesh(
  new THREE.CapsuleGeometry(0.4, 0.8, 6, 12),
  new THREE.MeshStandardMaterial({ color: 0x4cc9f0, roughness: 0.4 }),
);
player.position.y = 0.8;
scene.add(player);

// Orbs: one InstancedMesh = one draw call. Collected orbs are scaled to 0.
const orbMesh = new THREE.InstancedMesh(
  new THREE.IcosahedronGeometry(0.35, 1),
  new THREE.MeshStandardMaterial({ color: 0xffd166, emissive: 0x553300, roughness: 0.3 }),
  ORBS,
);
scene.add(orbMesh);
const rand = rng(1337);
const orbs = Array.from({ length: ORBS }, () => ({
  x: (rand() * 2 - 1) * (ARENA - 2), z: (rand() * 2 - 1) * (ARENA - 2), alive: true,
}));
const dummy = new THREE.Object3D();
function writeOrbs(t) {
  orbs.forEach((o, i) => {
    dummy.position.set(o.x, 0.8 + Math.sin(t * 2 + i) * 0.15, o.z);
    dummy.scale.setScalar(o.alive ? 1 : 0);
    dummy.rotation.y = t + i;
    dummy.updateMatrix();
    orbMesh.setMatrixAt(i, dummy.matrix);
  });
  orbMesh.instanceMatrix.needsUpdate = true;
}

// ---------- input (keyboard + touch drag) ----------
const keys = new Set();
addEventListener('keydown', (e) => { keys.add(e.code); if (e.code === 'Space') begin(); });
addEventListener('keyup', (e) => keys.delete(e.code));
let touch = null;
addEventListener('pointerdown', (e) => { touch = { x: e.clientX, y: e.clientY, dx: 0, dy: 0 }; begin(); });
addEventListener('pointermove', (e) => { if (touch) { touch.dx = (e.clientX - touch.x) / 60; touch.dy = (e.clientY - touch.y) / 60; } });
addEventListener('pointerup', () => { touch = null; });
function axis() {
  let x = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0);
  let z = (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0) - (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0);
  if (touch) { x += Math.max(-1, Math.min(1, touch.dx)); z += Math.max(-1, Math.min(1, touch.dy)); }
  const len = Math.hypot(x, z) || 1;
  return { x: x / Math.max(1, len), z: z / Math.max(1, len) };
}

// ---------- game state + HUD ----------
const g = createGame(ORBS);
const $ = (id) => document.getElementById(id);
$('total').textContent = ORBS;
const msg = $('msg');
function showMsg(html) { msg.innerHTML = html; msg.hidden = !html; }
function begin() {
  if (g.state === State.PLAYING) return;
  orbs.forEach((o) => (o.alive = true));
  player.position.set(0, 0.8, 0);
  start(g); showMsg('');
}
showMsg('Orb Collector<small>WASD / arrows / drag to move &middot; Space or tap to start</small>');

// ---------- fixed-step simulation ----------
function update(dt) {
  tick(g, dt);
  if (g.state !== State.PLAYING) return;
  const a = axis();
  player.position.x = THREE.MathUtils.clamp(player.position.x + a.x * SPEED * dt, -ARENA, ARENA);
  player.position.z = THREE.MathUtils.clamp(player.position.z + a.z * SPEED * dt, -ARENA, ARENA);
  for (const o of orbs) {
    if (o.alive && Math.hypot(o.x - player.position.x, o.z - player.position.z) < 0.9) {
      o.alive = false; collect(g);
    }
  }
  if (g.state === State.WON) showMsg(`You win in ${g.time.toFixed(1)}s<small>Space or tap to play again</small>`);
}

// ---------- main loop ----------
const timer = new THREE.Timer();
timer.connect(document);       // pauses delta when the tab is hidden
let acc = 0;
renderer.setAnimationLoop((ts) => {
  timer.update(ts);
  const frame = Math.min(timer.getDelta(), MAX_FRAME);
  acc += frame;
  while (acc >= FIXED_DT) { update(FIXED_DT); acc -= FIXED_DT; }

  // camera follows with frame-rate-independent smoothing
  const target = new THREE.Vector3(player.position.x, 9, player.position.z + 9);
  camera.position.lerp(target, 1 - Math.exp(-6 * frame));
  camera.lookAt(player.position);

  writeOrbs(timer.getElapsed());
  $('score').textContent = g.score;
  $('time').textContent = g.time.toFixed(1);
  renderer.render(scene, camera);
});

// ---------- resize ----------
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// ---------- HMR cleanup ----------
if (import.meta.hot) import.meta.hot.dispose(() => { renderer.setAnimationLoop(null); renderer.dispose(); timer.dispose(); });
