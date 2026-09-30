// Level composer for worlds 3-11. A level is a sequence of pieces from tools/sections.mjs.
// spec.pieces names which pieces this world uses (with weights); spec.sig lists hand-picked
// signature pieces placed at fixed points. Parameters scale with difficulty d (0..1) and stay
// inside what the physics can clear: gaps <= 5, climbs <= 3 tiles between footholds.
// The solver (tools/solve.mjs) is the final judge of every level.
import { mulberry } from '../src/util.js';
import * as S from './sections.mjs';

const R = (rng, a, b) => a + Math.floor(rng() * (b - a + 1));
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];

// Each piece: (b, c, ctx) => next column. ctx = { rng, d, foes, lava, world }.
export const PIECES = {
  rest(b, c, x) {
    const n = R(x.rng, 7, 12), k = Math.round(1 + x.d * 2 * x.rng());
    const foes = []; for (let i = 0; i < k; i++) foes.push([pick(x.rng, x.foes), 2 + Math.floor((i + 0.5) * (n - 3) / k)]);
    const blocks = x.rng() < 0.5 ? [[Math.max(1, n - 7), 9, pick(x.rng, ['BCB', 'BMB', 'C.C', 'BBCBB'].filter(s => s.length < n - 1))]] : [];
    return S.run(b, c, n, { foes, blocks, gems: blocks.length ? [] : [[2, 10, n - 4, true]] });
  },
  gap(b, c, x) { return S.gap(b, c, R(x.rng, 2, 3 + Math.round(x.d * 2)), { lava: x.lava }); },
  pillars(b, c, x) { const n = R(x.rng, 3, 4); return S.pillars(b, c, Array.from({ length: n }, () => R(x.rng, 2, 4)), { sp: R(x.rng, 5, 7), foe: pick(x.rng, x.foes) }); },
  stairs(b, c, x) { const c2 = S.stairs(b, c, R(x.rng, 3, 5), R(x.rng, 3, 3 + Math.round(x.d * 2))); if (x.lava) lavaFloor(b, c, c2); return c2; },
  stones(b, c, x) {
    const k = R(x.rng, 3, 4), steps = []; let o = 2;
    for (let i = 0; i < k; i++) { steps.push([o, 2, i % 2 ? 9 : 11]); o += R(x.rng, 4, 4 + Math.round(x.d)); }
    const c2 = S.stones(b, c, o + 1, steps); if (x.lava) b.fill(c, c2 - 1, 13, 14, 'V'); return c2;
  },
  ledges(b, c, x) {
    const k = R(x.rng, 5, 7), seq = []; let r = 11;
    for (let i = 0; i < k; i++) { const nr = Math.max(5, Math.min(11, r + pick(x.rng, [-2, -2, 0, 2, 2]))); seq.push([i ? R(x.rng, 1, 2 + Math.round(x.d)) : 1, R(x.rng, 2, 4), nr]); r = nr; }
    seq[seq.length - 1][2] = Math.max(seq[seq.length - 1][2], 10);
    const c2 = S.ledges(b, c, seq);
    if (x.rng() < 0.6) b.ent('moth', c + Math.floor((c2 - c) / 2), 6);
    if (x.lava) b.fill(c, c2 - 1, 13, 14, 'V');
    return c2 + 1;
  },
  mesas(b, c, x) {
    const k = R(x.rng, 5, 8), seq = []; let t = 11;
    for (let i = 0; i < k; i++) { const nt = Math.max(6, Math.min(12, t + pick(x.rng, [-2, -1, 0, 1, 2, 2]))); seq.push([R(x.rng, 2, 3 + Math.round(x.d)), R(x.rng, 3, 6), nt]); t = nt; }
    seq[0][2] = Math.max(seq[0][2], 10);
    const c2 = S.mesas(b, c, seq, (c0, w, top) => { if (w >= 5) b.ent(pick(x.rng, x.foes), c0 + 2, top - 1); b.gem(c0 - 2, top - 3); });
    if (x.lava) lavaFloor(b, c, c2);
    return c2 + 2;
  },
  raft(b, c, x) { return S.raft(b, c, R(x.rng, 9, 12), { row: R(x.rng, 10, 11), period: R(x.rng, 200, 240) }); },
  lift(b, c, x) { return S.lift(b, c, R(x.rng, 4, 6), { bankW: R(x.rng, 8, 12), foes: [[pick(x.rng, x.foes), 5]] }); },
  logs(b, c, x) { const c2 = S.logs(b, c, R(x.rng, 3, 4)); if (x.lava) b.fill(c, c2 - 1, 13, 14, 'V'); return c2; },
  spring(b, c, x) { return S.springWall(b, c, R(x.rng, 6, 8), { foes: [[pick(x.rng, x.foes), 2]] }); },
  pool(b, c, x) { return S.pool(b, c, R(x.rng, 10, 16), { top: pick(x.rng, [9, 10]), fish: R(x.rng, 1, 3) }); },
  ice(b, c, x) {
    const n = R(x.rng, 22, 32), gaps = [[R(x.rng, 7, 10), R(x.rng, 2, 3)], [R(x.rng, 16, 20), R(x.rng, 2, 3 + Math.round(x.d))]];
    return S.ice(b, c, n, { gaps, foes: [[pick(x.rng, x.foes), 4], [pick(x.rng, x.foes), 14]], blocks: [[n - 8, 9, 'BCB']] });
  },
  belt(b, c, x) { const n = R(x.rng, 14, 20), dir = pick(x.rng, [1, -1]); return S.belt(b, c, n, dir, { foes: [[pick(x.rng, x.foes), Math.floor(n / 2)]], blocks: [[4, 9, 'BCB']] }); },
  beltBridge(b, c, x) {
    const k = R(x.rng, 3, 4), seq = []; for (let i = 0; i < k; i++) seq.push([i ? R(x.rng, 2, 3) : 1, R(x.rng, 3, 5), pick(x.rng, [10, 9, 11]), pick(x.rng, [1, -1])]);
    const c2 = S.beltBridge(b, c, seq); if (x.lava) b.fill(c, c2, 13, 14, 'V'); return c2 + 2;
  },
  spikes(b, c, x) { const k = R(x.rng, 2, 3); return S.spikes(b, c, Array.from({ length: k }, () => R(x.rng, 2, 3)), { safe: R(x.rng, 2, 4), foes: [[pick(x.rng, x.foes), 1]] }); },
  tunnel(b, c, x) {
    const n = R(x.rng, 26, 36), holes = x.d > 0.3 ? [[R(x.rng, 9, 12), 3], [R(x.rng, 20, n - 8), 2]] : [];
    const foes = []; for (let i = 6; i < n - 4; i += R(x.rng, 5, 8)) foes.push([pick(x.rng, x.foes), i]);
    const c2 = S.tunnel(b, c, n, { foes, holes }); if (x.lava) for (const [o, w] of holes) b.fill(c + o, c + o + w - 1, 13, 14, 'V'); return c2;
  },
  clothesline(b, c, x) { return S.clothesline(b, c, { moths: 1 + Math.round(x.d * 2) }); },
  attic(b, c, x) { const n = R(x.rng, 32, 40); return S.attic(b, c, n, { foes: [[pick(x.rng, x.foes), 13], [pick(x.rng, x.foes), 21], [pick(x.rng, x.foes), 27]] }); },
  bellTower(b, c, x) { return S.bellTower(b, c, { foes: [[pick(x.rng, x.foes), 20]] }); },
  washers(b, c, x) { return S.washers(b, c, { period: R(x.rng, 200, 240) }); },
  fireHall(b, c, x) { return S.fireHall(b, c, { bars: R(x.rng, 2, 3), len: R(x.rng, 4, 5 + Math.round(x.d)), speed: +(0.03 + x.d * 0.02).toFixed(3) }); },
  fireJets(b, c, x) { return S.fireJets(b, c, { n: R(x.rng, 3, 4), period: R(x.rng, 140, 180), on: R(x.rng, 45, 60) }); },
  fireBridge(b, c, x) { return S.fireBridge(b, c, { w: R(x.rng, 16, 20), bars: 2, len: R(x.rng, 3, 4), speed: +(0.03 + x.d * 0.015).toFixed(3) }); },
  islands(b, c, x) {
    const k = R(x.rng, 4, 7), seq = []; let t = 11;
    for (let i = 0; i < k; i++) { const nt = Math.max(6, Math.min(12, t + pick(x.rng, [-2, -1, 0, 1, 2]))); seq.push([R(x.rng, 2, 3 + Math.round(x.d)), R(x.rng, 3, 6), nt]); t = nt; }
    seq[0][2] = Math.max(seq[0][2], 10);
    return S.islands(b, c, seq, (c0, w, top) => { if (w >= 5) b.ent(pick(x.rng, x.foes), c0 + 2, top - 1); b.gem(c0 + 1, top - 2); }) + 2;
  },
};
function lavaFloor(b, c0, c1) { for (let c = c0; c < c1; c++) if (b.get(c, 14) === '.') { b.set(c, 14, 'V'); b.set(c, 13, 'V'); } }

// spec: { id, name, theme, seed, d, len, pieces: {name: weight}, foes, sig: [[atFraction, fn]], lava,
//         boss (x-4 config), post(b, W), extra meta (wind, meteors) }
export function compose(Builder, spec) {
  const b = new Builder(1200), rng = mulberry(spec.seed), x = { rng, d: spec.d, foes: spec.foes, lava: !!spec.lava };
  let c = S.run(b, 0, 14, { blocks: [[8, 9, 'BEB']] });
  const bag = Object.entries(spec.pieces).flatMap(([k, w]) => Array(w).fill(k));
  const cps = [], ncp = spec.boss ? 2 : 1, sig = [...(spec.sig || [])].sort((a, z) => a[0] - z[0]);
  let last = '', gaps = 0;
  while (c < spec.len) {
    const f = c / spec.len;
    if (cps.length < ncp && f > (cps.length + 1) / (ncp + 1)) { c = S.run(b, c, 10, { foes: [] }); cps.push(c - 7); continue; }
    if (sig.length && f >= sig[0][0]) { c = sig.shift()[1](b, c, x); c = PIECES.rest(b, c, x); last = 'sig'; continue; }
    let k; do { k = pick(rng, bag); } while (k === last && bag.some(z => z !== last));
    last = k;
    c = PIECES[k](b, c, x);
    // a short breather after every piece so pieces never butt into each other badly
    c = ++gaps % 3 === 0 ? PIECES.rest(b, c, x) : S.run(b, c, R(rng, 3, 5));
  }
  for (const [, fn] of sig) { c = fn(b, c, x); c = PIECES.rest(b, c, x); }
  let pole, hut, boss = null;
  if (spec.boss) {
    // fortress approach: lava in the pits
    if (spec.fortressLava !== false) S.lavaPits(b, 0, c);
    c = S.run(b, c, 8);
    boss = S.boss(b, c + 2, spec.boss);
    if (spec.arena) spec.arena(b, boss.c0);
    pole = boss.c0 + 38; b.set(pole, 12, 'S'); hut = pole + 4;
  } else ({ pole, hut } = S.endZone(b, c + 2));
  if (spec.post) spec.post(b, pole);
  // past each checkpoint, the first gem crate becomes an ember crate: a second one gives the fire blossom
  for (const cp of cps) {
    const hit = [];
    for (let cc = cp; cc < pole && !hit.length; cc++) for (let r = 0; r < 13; r++) if (b.get(cc, r) === 'C') { hit.push([cc, r]); break; }
    if (hit.length) b.set(hit[0][0], hit[0][1], 'E');
  }
  // x-2 levels: most of the level runs underground, surfacing before the goal
  const ug = spec.under ? S.underground(b, Math.round(spec.len * 0.1), (boss ? boss.c0 : pole) - 28) : null;
  return b.toJSON(S.meta(spec.id, spec.name, spec.theme, { sky: spec.sky, pole, hut, seed: spec.seed, checkpoints: cps, ...(boss ? { boss } : {}), ...(ug || {}), ...(spec.extra || {}) }));
}
