// Deterministic physics tests. The golden traces were recorded from the original single-file
// Duskrunner build (hero only, level 1-1). The refactored sim must reproduce them bit for bit.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createWorld, step } from '../src/sim.js';

// The original prototype's map, frozen here so level 1-1 can keep evolving.
const level = JSON.parse(fs.readFileSync(new URL('./golden/level-duskrunner.json', import.meta.url)));
const golden = JSON.parse(fs.readFileSync(new URL('./golden/hero-traces.json', import.meta.url)));
const expand = s => s.flatMap(([k, n]) => Array(n).fill(k));

for (const [name, g] of Object.entries(golden)) {
  test(`hero trace: ${name}`, () => {
    const W = createWorld(level, { noEnemies: true, assist: g.assist, fx: false });
    let prevJump = false;
    expand(g.script).forEach((k, f) => {
      const i = { left: k.includes('L'), right: k.includes('R'), jump: k.includes('J'), run: k.includes('B') };
      i.jumpP = i.jump && !prevJump; prevJump = i.jump;
      step(W, i);
      const h = W.hero, got = [h.x, h.y, h.vx, h.vy, h.ground ? 1 : 0, W.state];
      assert.deepEqual(got, g.frames[f], `frame ${f}`);
    });
  });
}

test('positions and velocities stay integers', () => {
  const W = createWorld(level, { fx: false });
  let prevJump = false;
  for (let f = 0; f < 1200; f++) {
    const k = f % 90 < 40 ? 'RB' : f % 90 < 70 ? 'RBJ' : 'R';
    const i = { left: false, right: k.includes('R'), jump: k.includes('J'), run: k.includes('B') };
    i.jumpP = i.jump && !prevJump; prevJump = i.jump;
    step(W, i);
    for (const v of [W.hero.x, W.hero.y, W.hero.vx, W.hero.vy]) assert.ok(Number.isInteger(v), `frame ${f}: ${v}`);
  }
});
