import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, start, collect, tick, rng, State } from './logic.js';

test('win after collecting all orbs', () => {
  const g = start(createGame(2));
  collect(g); assert.equal(g.state, State.PLAYING);
  collect(g); assert.equal(g.state, State.WON);
});
test('no scoring or time outside PLAYING', () => {
  const g = createGame(1);
  collect(g); tick(g, 1);
  assert.equal(g.score, 0); assert.equal(g.time, 0);
});
test('rng is deterministic and in [0,1)', () => {
  const a = rng(7), b = rng(7);
  for (let i = 0; i < 50; i++) { const x = a(); assert.equal(x, b()); assert.ok(x >= 0 && x < 1); }
});
