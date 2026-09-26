// Structural checks for every level file. Beatability is checked separately by `npm run solve`.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { TILE_CHARS, SOLID } from '../src/tiles.js';
import { THEMES } from '../src/themes.js';

const index = JSON.parse(fs.readFileSync(new URL('../levels/index.json', import.meta.url)));
const ENTS = new Set(['bug', 'thorn', 'moth', 'hopper', 'snail', 'fish', 'plat', 'fall', 'spring', 'firebar', 'jet', 'door']);

for (const { id } of index) {
  test(`level ${id}`, () => {
    const lv = JSON.parse(fs.readFileSync(new URL(`../levels/w${id}.json`, import.meta.url)));
    assert.equal(lv.id, id);
    assert.ok(THEMES[lv.theme], `unknown theme ${lv.theme}`);
    assert.equal(lv.rows.length, 15);
    const W = lv.rows[0].length;
    for (const r of lv.rows) { assert.equal(r.length, W); for (const ch of r) assert.ok(TILE_CHARS.has(ch), `bad tile '${ch}'`); }
    assert.ok(lv.pole > 0 && lv.pole < W - 6, 'pole in range');
    assert.ok(lv.hut >= lv.pole + 2 && lv.hut + 6 <= W, 'hut fits');
    assert.ok(SOLID.has(lv.rows[13][lv.pole]) || lv.rows[12][lv.pole] === 'S', 'pole has a base');
    for (let c = lv.pole; c < W; c++) assert.ok(SOLID.has(lv.rows[13][c]), `ground under the goal at col ${c}`);
    const [sx, sy] = lv.start; assert.ok(SOLID.has(lv.rows[(sy + 16) / 16][Math.floor((sx + 8) / 16)]), 'start stands on ground');
    for (const e of lv.ents) { assert.ok(ENTS.has(e.t), `entity ${e.t}`); assert.ok(e.c >= 0 && e.c < W && e.r >= 0 && e.r < 15, `entity in bounds ${JSON.stringify(e)}`); }
    for (const [c, r] of lv.gems) assert.ok(c >= 0 && c < W && r >= 0 && r < 15);
    for (const c of lv.checkpoints || []) {
      assert.ok(c > 0 && c < lv.pole, `checkpoint ${c} before the pole`);
      assert.ok(lv.rows.some(r => SOLID.has(r[c]) && SOLID.has(r[c + 1])), `checkpoint ${c} has ground to stand on`);
    }
    if (lv.boss) {
      const c1 = lv.boss.c0 + 26;
      for (let r = 0; r <= 12; r++) assert.equal(lv.rows[r][c1], 'X', 'exit gate is full height');
      assert.ok(lv.pole > c1, 'goal is past the arena');
    }
  });
}

// Watch mode replays must still finish their level; a level edit without `npm run replays` fails here.
import { createWorld, step } from '../src/sim.js';
import { pathInputs } from '../src/replay.js';
const replays = JSON.parse(fs.readFileSync(new URL('../levels/replays.json', import.meta.url)));
for (const { id } of index) {
  test(`replay ${id} still finishes`, () => {
    assert.ok(replays[id], 'no replay recorded: run npm run replays');
    const lv = JSON.parse(fs.readFileSync(new URL(`../levels/w${id}.json`, import.meta.url)));
    const W = createWorld(lv, { fx: false, lives: 1 });
    for (const i of pathInputs(replays[id])) { step(W, i); if (W.state !== 'play' && W.state !== 'door') break; }
    assert.ok(['pole', 'walkout', 'tally', 'done'].includes(W.state), `replay ended in state ${W.state}`);
    if (lv.boss) assert.ok(W.bossDone, 'boss beaten');
  });
}
