// Level solver library: beam search over real sim inputs (see tools/solve.mjs for the CLI).
import { createWorld, step, cloneWorld, px } from '../src/sim.js';

import { BLOCK, ACTIONS, pathInputs } from '../src/replay.js';
export { BLOCK, ACTIONS, pathInputs };

export function solve(level, { noEnemies = false, beamW = 300, verbose = false } = {}) {
  const W0 = createWorld(level, { fx: false, noEnemies, lives: 1 });
  let beam = [{ W: W0, jumpHeld: false, score: 0, path: [] }];
  let bestX = 0, best = null;
  const maxBlocks = Math.ceil((level.time || 300) * 24 / BLOCK);
  for (let d = 0; d < maxBlocks; d++) {
    const next = new Map();
    for (const s of beam) {
      for (let ai = 0; ai < ACTIONS.length; ai++) {
        const a = ACTIONS[ai];
        const W = cloneWorld(s.W);
        let held = s.jumpHeld, dead = false;
        for (let f = 0; f < BLOCK; f++) {
          const jump = a.jump;
          const inp = { left: a.dir < 0, right: a.dir > 0, run: a.run, jump, jumpP: jump && !held };
          held = jump;
          step(W, inp);
          if (W.state === 'dying' || W.state === 'dead') { dead = true; break; }
          if (W.state === 'pole' || W.state === 'walkout' || W.state === 'tally' || W.state === 'done') return { ok: true, frames: W.frame, boss: W.lv.boss ? W.bossDone : null, path: [...s.path, ai] };
        }
        if (dead) continue;
        const h = W.hero, x = px(h.x), y = px(h.y);
        // bosses: reward damage heavily so the bot learns to stomp
        const bossBonus = W.lv.boss ? (W.bossDone ? 4000 : W.boss ? (W.boss.max - W.boss.hp) * 600 : 0) : 0;
        // below the floor line means falling into a pit: rank those states under anyone still waiting on a ledge
        const score = x + bossBonus - y * 0.05 + (h.ground ? 2 : 0) - (y > 200 && !h.wet ? (y - 200) * 25 : 0);
        if (x > bestX) { bestX = x; best = { f: W.frame, x, y, vx: h.vx, vy: h.vy, ground: h.ground, plat: !!h.plat, wet: h.wet, boss: W.boss ? `${W.boss.hp}/${W.boss.max}` : null, path: [...s.path, ai] }; }
        const key = `${x >> 2},${y >> 2},${h.vx >> 10},${h.vy >> 11},${h.ground ? 1 : 0},${held ? 1 : 0},${W.boss ? W.boss.hp : ''}`;
        const prev = next.get(key);
        if (!prev || prev.score < score) next.set(key, { W, jumpHeld: held, score, path: [...s.path, ai] });
      }
    }
    if (!next.size) break;
    // keep the best, but hold back some slots for diversity in x (waiting states for moving platforms)
    const all = [...next.values()].sort((a, b) => b.score - a.score);
    const keep = all.slice(0, Math.floor(beamW * 0.7));
    const buckets = new Map();
    for (const s of all.slice(keep.length)) { const k = px(s.W.hero.x) >> 5; if (!buckets.has(k)) buckets.set(k, []); buckets.get(k).push(s); }
    const rest = [...buckets.values()];
    for (let i = 0; keep.length < beamW && rest.some(b => b.length > i); i++) for (const b of rest) if (b[i] && keep.length < beamW) keep.push(b[i]);
    beam = keep;
    if (verbose && d % 50 === 0) console.log(`  block ${d} best x ${bestX} beam ${beam.length}`);
  }
  return { ok: false, bestX, best };
}

export function replay(level, path, onFrame, noEnemies = false) {
  const W = createWorld(level, { fx: false, noEnemies, lives: 1 });
  let held = false;
  for (const ai of path) { const a = ACTIONS[ai]; for (let f = 0; f < BLOCK; f++) { const inp = { left: a.dir < 0, right: a.dir > 0, run: a.run, jump: a.jump, jumpP: a.jump && !held }; held = a.jump; step(W, inp); onFrame && onFrame(W); if (W.state !== 'play' && W.state !== 'door') return W; } }
  return W;
}
