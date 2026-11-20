// Pure game logic: no three.js imports, so it can be unit-tested in Node.
export const State = Object.freeze({ MENU: 'menu', PLAYING: 'playing', WON: 'won' });

export function createGame(total) {
  return { state: State.MENU, score: 0, total, time: 0 };
}

export function start(g) { g.state = State.PLAYING; g.score = 0; g.time = 0; return g; }

export function collect(g) {
  if (g.state !== State.PLAYING) return g;
  g.score += 1;
  if (g.score >= g.total) g.state = State.WON;
  return g;
}

export function tick(g, dt) {
  if (g.state === State.PLAYING) g.time += dt;
  return g;
}

// Deterministic PRNG (mulberry32) so levels are reproducible from a seed.
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
