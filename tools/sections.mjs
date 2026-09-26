// Reusable level pieces for tools/level-defs.mjs and the world files in tools/worlds/.
// Cursor sections take a start column c, lay their own ground, and return the column after them.
// ---------- shared pieces ----------
export const ground = (b, c0, c1, top = 13) => b.fill(c0, c1, top, 14, 'G');
export const pit = (b, c0, c1) => b.fill(c0, c1, 0, 14, '.');
export const ledge = (b, c, r, w) => { for (let i = 0; i < w; i++) b.set(c + i, r, '-'); };
export const gemRow = (b, c, r, n) => { for (let i = 0; i < n; i++) b.gem(c + i, r); };
export const gemArc = (b, c, r, n) => { for (let i = 0; i < n; i++) b.gem(c + i, r - Math.round(Math.sin((i + 0.5) / n * Math.PI) * 2)); };
export const bugs = (b, cols, r = 12, t = 'bug') => cols.forEach(c => b.ent(t, c, r));
// Staircase up to 8, then the lantern pole and the hut on flat ground.
export function endZone(b, c) {
  ground(b, c, c + 40);
  for (let i = 0; i < 8; i++) b.stair(c + i, i + 1); b.stair(c + 8, 8);
  const pole = c + 17; b.set(pole, 12, 'S');
  return { pole, hut: pole + 4 };
}
// Mesas: runs of solid ground rising from the bottom. seq = [[gapBefore, width, topRow], ...]
export function mesas(b, c, seq, fn) {
  for (const [gap, w, top] of seq) { c += gap; ground(b, c, c + w - 1, top); if (fn) fn(c, w, top); c += w; }
  return c;
}
// Canopy ledges over a pit. seq = [[gapBefore, width, row], ...]
export function canopy(b, c, seq) {
  for (const [gap, w, r] of seq) { c += gap; ledge(b, c, r, w); b.gem(c + Math.floor(w / 2), r - 2); c += w; }
  return c;
}
// Pyramid of stone steps up to h, a pit of gapW, and back down.
export function stairGap(b, c, h, gapW) {
  for (let i = 0; i < h; i++) b.stair(c + i, i + 1); b.stair(c + h, h);
  pit(b, c + h + 1, c + h + gapW);
  const d = c + h + gapW + 1; b.stair(d, h); for (let i = 0; i < h; i++) b.stair(d + 1 + i, h - i);
  gemArc(b, c + h + 1, 13 - h - 3, gapW);
  return d + h + 1;
}
// A pit crossed on floating stone steps. steps = [[offset, width, row], ...]
export function stepStones(b, c, w, steps) {
  pit(b, c, c + w - 1);
  for (const [o, sw, r] of steps) { b.row(r, c + o, 'S'.repeat(sw)); b.gem(c + o, r - 2); }
  return c + w;
}
export function boss(b, c0, cfg) {
  // 27-column arena starting at c0. The camera locks here and the entrance closes behind Dusky.
  const c1 = c0 + 26;
  ground(b, c0 - 2, c1 + 30);
  for (let r = 0; r <= 12; r++) b.set(c1, r, 'X');
  return { c0, ...cfg };
}
export function meta(id, name, theme, extra) { return { id, name, theme, time: 400, start: [40, 192], ...extra }; }

// ---------- cursor sections (lay their own ground, return the next column) ----------
// foes: [[type, offset, row?], ...] placed relative to the section start; row defaults to standing on row 13.
const place = (b, c, foes = [], floor = 13) => foes.forEach(([t, o, r]) => b.ent(t, c + o, r ?? floor - 1));

// Flat ground. blocks: [[offset, row, 'BCB'], ...]
export function run(b, c, n, { foes, blocks = [], gems = [], top = 13 } = {}) {
  ground(b, c, c + n - 1, top);
  for (const [o, r, str] of blocks) b.row(r, c + o, str);
  for (const [o, r, k, arc] of gems) (arc ? gemArc : gemRow)(b, c + o, r, k);
  place(b, c, foes, top);
  return c + n;
}
// A gap. lava fills its floor with lava instead of leaving a pit.
export function gap(b, c, n, { lava = false, gems = true } = {}) {
  pit(b, c, c + n - 1);
  if (lava) b.fill(c, c + n - 1, 13, 14, 'V');
  if (gems) gemArc(b, c, 9, n);
  return c + n;
}
// Pillars of the given heights on ground, `sp` columns apart, with foes between them.
export function pillars(b, c, hs, { sp = 6, foe = 'bug' } = {}) {
  const n = hs.length * sp + 2; ground(b, c, c + n - 1);
  hs.forEach((h, i) => { b.pillar(c + 2 + i * sp, h); if (foe && i < hs.length - 1) b.ent(foe, c + 5 + i * sp, 12); });
  gemArc(b, c + 2, 13 - Math.max(...hs) - 3, n - 4);
  return c + n;
}
export function stairs(b, c, h, gapW) { ground(b, c, c + 2 * h + gapW + 2); return stairGap(b, c, h, gapW); }
export function stones(b, c, w, steps) { return stepStones(b, c, w, steps); }
export function ledges(b, c, seq) { const e = canopy(b, c, seq); return e; }
// Horizontal raft across a pit of width w.
export function raft(b, c, w = 10, { row = 11, period = 220, phase = 0 } = {}) {
  b.ent('plat', c + 1, row, { w: 3, dx: w - 5, period, phase }); gemArc(b, c + 1, row - 3, w - 2);
  return c + w;
}
// Lift from the low ground up to a high bank h tiles up; the bank is bankW wide and steps back down.
export function lift(b, c, h = 5, { bankW = 10, foes = [], period = 220 } = {}) {
  b.ent('plat', c + 1, 12, { w: 3, dy: -h, period });
  const top = 13 - h; ground(b, c + 5, c + 5 + bankW - 1, top); place(b, c + 5, foes, top);
  gemRow(b, c + 6, top - 2, 3);
  let e = c + 5 + bankW;
  for (let i = 0; i < h; i++) ground(b, e + i, e + i, Math.min(13, top + i + 1));
  return e + h;
}
// Falling logs across a pit.
export function logs(b, c, n = 3, { row = 11, step = 4 } = {}) {
  for (let i = 0; i < n; i++) b.ent('fall', c + 1 + i * step, row - (i % 2), { w: 2 });
  gemRow(b, c + 1, row - 3, n * step - 1);
  return c + 1 + n * step + 1;
}
// A wall too tall to jump, with a spring in front. Hold jump on the spring for the big bounce.
export function springWall(b, c, h = 7, { foes = [] } = {}) {
  ground(b, c, c + 14);
  b.ent('spring', c + 5, 12);
  b.fill(c + 6, c + 7, 13 - h, 12, 'S'); gemRow(b, c + 5, 13 - h - 3, 4);
  place(b, c + 9, foes);
  return c + 15;
}
// Raised banks around a water pool with fish. Water fills rows top..13 over a seabed.
export function pool(b, c, w = 12, { top = 10, fish = 2, gems = true } = {}) {
  const h = 13 - top;
  ground(b, c, c + h);
  for (let i = 0; i < h; i++) b.stair(c + 1 + i, i + 1);
  ground(b, c + h + 1, c + h + 3, top);
  const p0 = c + h + 4;
  b.fill(p0, p0 + w - 1, top, 13, '~'); b.fill(p0, p0 + w - 1, 14, 14, 'G');
  for (let i = 0; i < fish; i++) b.ent('fish', p0 + 2 + Math.floor((i + 0.5) * (w - 4) / fish), top + 1 + (i % 2) * 2);
  if (gems) gemRow(b, p0 + 2, 12, w - 4);
  const e = p0 + w; ground(b, e, e + 2, top);
  for (let i = 0; i < h; i++) { b.stair(e + 3 + i, h - i); ground(b, e + 3 + i, e + 3 + i); }
  ground(b, e + 3 + h, e + 4 + h);
  return e + 5 + h;
}
// Ice run: ground whose top is ice. gaps: [[offset, width], ...]
export function ice(b, c, n, { gaps = [], foes = [], blocks = [] } = {}) {
  ground(b, c, c + n - 1); b.fill(c, c + n - 1, 13, 13, 'I');
  for (const [o, w] of gaps) { pit(b, c + o, c + o + w - 1); gemArc(b, c + o, 9, w); }
  for (const [o, r, str] of blocks) b.row(r, c + o, str);
  place(b, c, foes);
  return c + n;
}
// Conveyor floor: the top row is a belt pushing dir (1 right, -1 left).
export function belt(b, c, n, dir, { foes = [], blocks = [] } = {}) {
  ground(b, c, c + n - 1); b.fill(c, c + n - 1, 13, 13, dir > 0 ? '>' : '<');
  for (const [o, r, str] of blocks) b.row(r, c + o, str);
  place(b, c, foes);
  return c + n;
}
// Belts floating over a pit. seq: [[gapBefore, width, row, dir], ...]
export function beltBridge(b, c, seq) {
  for (const [g, w, r, dir] of seq) { c += g; b.fill(c, c + w - 1, r, r, dir > 0 ? '>' : '<'); b.gem(c + Math.floor(w / 2), r - 2); c += w; }
  return c;
}
// Spike strips on the ground, each up to 3 wide, separated by safe footing.
export function spikes(b, c, strips = [3, 2, 3], { safe = 3, foes = [] } = {}) {
  let x = c + 2;
  for (const w of strips) { b.fill(x, x + w - 1, 12, 12, '^'); gemArc(b, x, 9, w); x += w + safe; }
  ground(b, c, x + 1); place(b, c, foes);
  return x + 2;
}
// Low ceiling from row 0 down to row depth-1 (caves).
export function ceiling(b, c0, c1, depth = 3) { for (let c = c0; c <= c1; c++) for (let r = 0; r < depth; r++) if (b.get(c, r) !== 'X') b.set(c, r, 'G'); }
// Floating islands two tiles thick (sky worlds). seq = [[gapBefore, width, topRow], ...]
export function islands(b, c, seq, fn) {
  for (const [g, w, top] of seq) { c += g; b.fill(c, c + w - 1, top, Math.min(14, top + 1), 'G'); if (fn) fn(c, w, top); c += w; }
  return c;
}
// Brick tunnel: floor, a brick ceiling at row 9, another brick layer at row 5, with crates.
export function tunnel(b, c, n, { foes = [], holes = [] } = {}) {
  ground(b, c, c + n - 1);
  b.fill(c + 2, c + n - 3, 9, 9, 'B'); b.fill(c + 2, c + n - 3, 5, 5, 'B');
  for (let i = c + 6; i < c + n - 4; i += 9) b.set(i, 9, i % 2 ? 'C' : 'M');
  for (const [o, w] of holes) pit(b, c + o, c + o + w - 1), b.fill(c + o, c + o + w - 1, 9, 9, 'B'), b.fill(c + o, c + o + w - 1, 5, 5, 'B');
  for (let i = c + 4; i < c + n - 4; i += 3) b.gem(i, 7);
  place(b, c, foes);
  return c + n;
}

// ---------- rooftop set pieces (world 4) ----------
// Washing lines strung between chimney posts over a street. The lines are one-way ledges.
export function clothesline(b, c, { moths = 2 } = {}) {
  ground(b, c, c + 4); b.fill(c + 3, c + 4, 10, 12, 'S');
  ledge(b, c + 5, 9, 4); ledge(b, c + 11, 7, 3); ledge(b, c + 16, 9, 3);
  gemRow(b, c + 5, 7, 4); gemRow(b, c + 11, 5, 3); gemRow(b, c + 16, 7, 3);
  for (let i = 0; i < moths; i++) b.ent('moth', c + 9 + i * 6, 5 + (i % 2) * 2);
  ground(b, c + 21, c + 26); b.fill(c + 21, c + 22, 10, 12, 'S');
  return c + 27;
}
// Inside an attic: the roof mass overhead, crates in the rafters, boxes on the floor.
export function attic(b, c, n = 36, { foes = [] } = {}) {
  ground(b, c, c + n - 1);
  b.fill(c + 3, c + n - 4, 4, 8, 'G');
  for (let i = c + 7; i < c + n - 6; i += 7) b.set(i, 8, ['C', 'B', 'E', 'C', 'M'][((i - c) / 7) % 5 | 0]);
  for (const [o, h] of [[10, 1], [17, 2], [24, 1], [29, 2]]) if (o < n - 5) b.fill(c + o, c + o, 13 - h, 12, 'S');
  for (let i = c + 5; i < c + n - 5; i += 2) b.gem(i, 11);
  place(b, c, foes);
  return c + n;
}
// Bell tower: a spring up the side, a bell (multi-gem brick) and a lantern crate on top,
// and a drop down the far side onto a ledge.
export function bellTower(b, c, { foes = [] } = {}) {
  ground(b, c, c + 30);
  b.ent('spring', c + 4, 12);
  b.fill(c + 5, c + 12, 6, 14, 'G');
  b.set(c + 8, 2, 'M'); b.set(c + 11, 2, 'N');
  gemRow(b, c + 6, 4, 2); gemRow(b, c + 13, 7, 3);
  ledge(b, c + 14, 9, 3);
  place(b, c, foes);
  b.ent('bug', c + 9, 5);
  return c + 31;
}
// Window-washer gondolas across a wide street: one slides, the next rises to the far roof.
export function washers(b, c, { period = 220 } = {}) {
  ground(b, c, c + 3, 10);
  b.ent('plat', c + 5, 10, { w: 3, dx: 5, period });
  b.ent('plat', c + 15, 11, { w: 3, dy: -4, period: period - 20, phase: 60 });
  gemArc(b, c + 5, 7, 8); gemRow(b, c + 15, 5, 3);
  ground(b, c + 19, c + 26, 8);
  for (let i = 0; i < 5; i++) ground(b, c + 27 + i, c + 27 + i, 9 + i);
  return c + 32;
}

// ---------- underground (every x-2) ----------
// Columns u0..u1 become a sealed underground area: brick ceiling, brick walls at both ends.
// Dusky gets there through a cellar door at the end of the surface part and comes back up
// through a lit doorway near the goal. Each door fades to the other area; the camera stays
// inside one zone, so the surface and the underground are never on screen together.
// The ground around each door is flattened and cleared so the doors always stand on solid floor.
export function underground(b, u0, u1) {
  const flat = (c0, c1) => {
    for (let c = c0; c <= c1; c++) { for (let r = 2; r <= 12; r++) b.set(c, r, '.'); b.set(c, 13, 'G'); b.set(c, 14, 'G'); }
    b.ents = b.ents.filter(e => e.c < c0 - 1 || e.c > c1);
  };
  flat(u0 - 8, u0 + 7); flat(u1 - 7, u1 + 8);
  for (let c = u0; c <= u1; c++) for (let r = 0; r <= 1; r++) if (b.get(c, r) !== 'X') b.set(c, r, 'B');
  for (let r = 0; r <= 12; r++) { b.set(u0, r, 'B'); b.set(u1, r, 'B'); }
  b.ent('door', u0 - 1, 12, { to: [u0 + 2, 12], kind: 'down' });
  b.ent('door', u1 - 1, 12, { to: [u1 + 2, 12], kind: 'up' });
  return { under: [u0, u1], zones: [[0, u0 - 1], [u0, u1], [u1 + 1, 9999]] };
}

// ---------- fire (x-4 fortresses) ----------
// Lava in every bottomless column between c0 and c1.
export function lavaPits(b, c0, c1) {
  for (let c = c0; c <= c1; c++) { let open = true; for (let r = 2; r < 15; r++) if (b.get(c, r) !== '.' && b.get(c, r) !== '-') open = false; if (open) b.fill(c, c, 13, 14, 'V'); }
}
// A hall of fire wheels turning around stone blocks overhead. Alternate wheels spin the other way.
export function fireHall(b, c, { bars = 2, len = 5, speed = 0.04, row = 9 } = {}) {
  const n = bars * 9 + 6; ground(b, c, c + n - 1);
  for (let i = 0; i < bars; i++) {
    const pc = c + 5 + i * 9; b.set(pc, row, 'S');
    b.ent('firebar', pc, row, { len, speed: i % 2 ? -speed : speed, phase: +(i * 1.7).toFixed(2) });
    gemRow(b, pc + 3, 11, 3);
  }
  return c + n;
}
// Floor jets in a row, firing one after another.
export function fireJets(b, c, { n = 3, period = 160, on = 55, h = 3, sp = 6 } = {}) {
  const w = n * sp + 4; ground(b, c, c + w - 1);
  for (let i = 0; i < n; i++) b.ent('jet', c + 4 + i * sp, 12, { period, on, h, phase: i * Math.round(period / n) });
  gemRow(b, c + 2, 8, w - 4);
  return c + w;
}
// A stone bridge over lava with fire wheels set into it.
export function fireBridge(b, c, { w = 18, bars = 2, len = 4, speed = 0.035 } = {}) {
  pit(b, c, c + w - 1); b.fill(c, c + w - 1, 13, 14, 'V');
  b.row(10, c, 'S'.repeat(w));
  for (let i = 0; i < bars; i++) { const pc = c + Math.round((i + 1) * w / (bars + 1)); b.ent('firebar', pc, 10, { len, speed: i % 2 ? -speed : speed, phase: +(i * 2.1).toFixed(2) }); }
  gemRow(b, c + 2, 7, w - 4);
  return c + w;
}
