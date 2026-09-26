// Level solver: beam search over real sim inputs to prove each level can be finished.
// Run: node tools/solve.mjs [1-2 2-4 ...] [--no-enemies] [--beam 400] [--trace] [--out levels/replays.json]
// --out merges winning paths into that file; the game's Watch mode plays levels/replays.json.
// It plays the actual sim (same physics as the game), so a pass means a human can do it too.
// A fail prints how far the bot got, which is the place to look at first.
import fs from 'node:fs';
import { px } from '../src/sim.js';
import { solve, replay } from './solver-lib.mjs';

const args = process.argv.slice(2);
const noEnemies = args.includes('--no-enemies');
const beamW = args.includes('--beam') ? +args[args.indexOf('--beam') + 1] : 300;
const verbose = args.includes('-v');
const outFile = args.includes('--out') ? args[args.indexOf('--out') + 1] : null;
const index = JSON.parse(fs.readFileSync(new URL('../levels/index.json', import.meta.url)));
const ids = args.filter(a => /^\d+-\d$/.test(a));
const todo = ids.length ? ids : index.map(l => l.id);
const paths = {};
let failures = 0;
for (const id of todo) {
  const level = JSON.parse(fs.readFileSync(new URL(`../levels/w${id}.json`, import.meta.url)));
  const t0 = Date.now();
  const r = solve(level, { noEnemies, beamW, verbose });
  if (r.ok) paths[id] = r.path;
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  if (r.ok && args.includes('--trace')) { let lastLock = null; replay(level, r.path, W => { const k = !!W.lock + ',' + !!W.boss + ',' + W.bossDone; if (k !== lastLock) { console.log(`  f${W.frame} x=${px(W.hero.x)} y=${px(W.hero.y)} lock,boss,done=${k}`); lastLock = k; } }, noEnemies); }
  if (r.ok) console.log(`PASS ${id.padEnd(5)} ${level.name.padEnd(24)} ${r.frames} frames (${(r.frames / 60).toFixed(1)}s of play)${r.boss === null ? '' : r.boss ? ', boss beaten' : ', BOSS SKIPPED'}, ${secs}s search`);
  else { failures++; console.log(`FAIL ${id.padEnd(5)} ${level.name.padEnd(24)} best x=${r.bestX}px (col ${Math.floor(r.bestX / 16)}) of ${level.rows[0].length * 16}, ${secs}s search`); console.log('     furthest state', JSON.stringify(r.best)); }
}
if (outFile) {
  let prev = {}; try { prev = JSON.parse(fs.readFileSync(outFile, 'utf8')); } catch (_) {}
  fs.writeFileSync(outFile, JSON.stringify({ ...prev, ...paths }) + '\n');
}
process.exit(failures ? 1 : 0);

