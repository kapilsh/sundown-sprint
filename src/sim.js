// =============== Simulation ===============
// Pure, deterministic gameplay. No DOM, no audio, no Math.random. Runs in the browser and in Node
// (tests, level solver). Everything that only affects visuals is pushed to W.ev as events.
import { SUB, P, JUMPS, SWIM, SPRING, ICE, CONVEYOR, SHELL_KICK, jumpParams } from './physics.js';
import { SOLID } from './tiles.js';

export const VIEW_W = 427, VH = 240, LH = 15;
export const HOX = 3, HW = 10, HOY = 2, HH = 14;
export const px = v => Math.floor(v / SUB);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const STOMPABLE = new Set(['bug', 'moth', 'hopper', 'snail', 'shell']);
const CHAIN = [100, 200, 400, 500, 800, 1000, 2000, 4000, 5000, 8000];

// ---------- world ----------
export function createWorld(level, o = {}) {
  const W = {
    lv: level, id: level.id, LW: level.rows[0].length, g: level.rows.map(r => [...r]),
    state: 'play', frame: 0, t: 0, time: level.time || 300, tick: 0,
    camX: 0, lookX: 0, lock: null, prog: 0,
    score: o.score || 0, gems: o.gems || 0, lives: o.lives ?? 3, assist: o.assist ?? true,
    freeze: 0, shake: 0, lit: false, poleScore: 0, keepGlow: false,
    ents: o.noEnemies ? [] : (level.ents || []).filter(e => SPAWNED.has(e.t)).sort((a, b) => a.c - b.c), spawnIdx: 0,
    enemies: [], items: [], shots: [], boss: null, bossDone: !level.boss,
    plats: (level.ents || []).filter(e => e.t === 'plat' || e.t === 'fall').map(makePlat),
    springs: (level.ents || []).filter(e => e.t === 'spring').map(e => ({ x: e.c * 16, y: e.r * 16, sq: 0 })),
    gemList: (level.gems || []).map(([c, r]) => ({ x: c * 16 + 3, y: r * 16 + 2, got: false })),
    multi: {}, pole: level.pole, hut: level.hut, ev: [], fx: o.fx ?? true, rng: (level.seed || 1) >>> 0,
    wind: level.wind || null, meteors: level.meteors || null, windOn: false,
    cps: level.checkpoints || [], cp: -1,
    fire: (level.ents || []).filter(e => e.t === 'firebar' || e.t === 'jet').map(e => ({ ...e })),
    // zones are separate areas joined by doors (x-2 surface / underground / surface); the camera stays in one
    zones: level.zones || null, doors: (level.ents || []).filter(e => e.t === 'door'), door: null,
  };
  W.PX = W.LW * 16;
  W.hero = newHero(W, !!o.glow);
  if (o.checkpoint >= 0 && W.cps[o.checkpoint] !== undefined) startAtCheckpoint(W, o.checkpoint);
  updateCamera(W, true);
  return W;
}
const SPAWNED = new Set(['bug', 'thorn', 'moth', 'hopper', 'snail', 'fish']);

function newHero(W, glow) {
  const [sx, sy] = W.lv.start || [40, 192];
  return { x: sx * SUB, y: sy * SUB, vx: 0, vy: 0, ground: true, face: 1, hold: JUMPS[0].hold, fall: JUMPS[0].fall, airMax: P.MAX_WALK, takeoff: 0,
    skid: false, glow, inv: 0, chain: 0, hidden: false, coyote: 0, buffer: 0, sx: 1, sy: 1, plat: null, wet: false, surface: '.', pit: false };
}
// Respawn at a mid-level lantern post: stand on the highest ground in that column, skip enemies behind it.
function startAtCheckpoint(W, i) {
  const c = W.cps[i], h = W.hero;
  let r = 0; while (r < LH && !(SOLID.has(W.g[r][c]) || W.g[r][c] === '-')) r++;
  h.x = (c * 16 + 4) * SUB; h.y = (r * 16 - 16) * SUB; h.ground = true;
  W.cp = i;
  while (W.spawnIdx < W.ents.length && W.ents[W.spawnIdx].c < c + 4) W.spawnIdx++;
}
function makePlat(e) {
  // plat: moves along (dx, dy) tiles and back over `period` frames. fall: drops after being stood on.
  const x = e.c * 16, y = e.r * 16;
  return { k: e.t === 'fall' ? 'fall' : 'move', w: (e.w || 3) * 16, x0: x, y0: y, x, y, px: x, py: y, dx: (e.dx || 0) * 16, dy: (e.dy || 0) * 16,
    period: e.period || 240, phase: e.phase || 0, t: 0, vy: 0, gone: false };
}

export function emit(W, k, a) { if (W.fx) W.ev.push(Object.assign({ k }, a)); }
const sfx = (W, n) => emit(W, 'sfx', { n });
function rand(W) { W.rng = (Math.imul(W.rng, 1664525) + 1013904223) >>> 0; return W.rng / 4294967296; }

// ---------- tile queries ----------
export const tileAt = (W, c, r) => (r < 0 || r >= LH || c < 0 || c >= W.LW) ? '.' : W.g[r][c];
export function solidPx(W, x, y) { const c = Math.floor(x / 16), r = Math.floor(y / 16); if (c < 0 || c >= W.LW) return true; if (r < 0 || r >= LH) return false; return SOLID.has(W.g[r][c]); }
// Solid for something moving down whose bottom was at prevB last frame (one-way ledges count).
function floorPx(W, x, y, prevB) {
  if (solidPx(W, x, y)) return true;
  const c = Math.floor(x / 16), r = Math.floor(y / 16);
  return r >= 0 && r < LH && c >= 0 && c < W.LW && W.g[r][c] === '-' && prevB < r * 16;
}
const standPx = (W, x, y) => { const t = tileAt(W, Math.floor(x / 16), Math.floor(y / 16)); return SOLID.has(t) || t === '-' || (x < 0 || x >= W.PX); };
const tileOfPx = (W, x, y) => tileAt(W, Math.floor(x / 16), Math.floor(y / 16));
function overlapsTile(W, x0, y0, w, h, ch) {
  for (let c = Math.floor(x0 / 16); c <= Math.floor((x0 + w - 1) / 16); c++)
    for (let r = Math.floor(y0 / 16); r <= Math.floor((y0 + h - 1) / 16); r++) if (tileAt(W, c, r) === ch) return true;
  return false;
}

// ---------- scoring ----------
function addScore(W, n, x, y) { W.score += n; if (x !== undefined) emit(W, 'pop', { x, y, s: '+' + n }); }
function addGem(W) { W.gems++; if (W.gems >= 100) { W.gems -= 100; W.lives++; sfx(W, 'oneup'); } addScore(W, 200); sfx(W, 'gem'); }

// ---------- hero ----------
function doJump(W, h) {
  const j = jumpParams(Math.abs(h.vx));
  h.vy = -j.v; h.hold = j.hold; h.fall = j.fall; h.ground = false; h.coyote = 0; h.buffer = 0; h.plat = null;
  h.takeoff = Math.abs(h.vx); h.airMax = h.takeoff >= P.MAX_WALK ? P.MAX_RUN : P.MAX_WALK;
  h.sx = 0.78; h.sy = 1.26; sfx(W, j.v > 0x04000 ? 'bigjump' : 'jump');
  emit(W, 'dust', { x: h.x / SUB + 8, y: h.y / SUB + 16, n: 5 });
}
function heroWet(W, h) { return tileOfPx(W, px(h.x) + 8, px(h.y) + 10) === '~'; }

function updateHero(W, inp) {
  const h = W.hero, dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0), spd = Math.abs(h.vx);
  h.skid = false;
  if (inp.jumpP) h.buffer = W.assist ? 6 : 1;
  // a jump press just after a small spring bounce upgrades it to the big one
  if (h.springT > 0) { h.springT--; if (inp.jumpP && h.vy < 0) { h.vy = -SPRING.HIGH; h.springT = 0; h.buffer = 0; h.sy = 1.35; sfx(W, 'spring'); } }
  const wasWet = h.wet; h.wet = heroWet(W, h);
  if (h.wet !== wasWet) { emit(W, 'splash', { x: h.x / SUB + 8, y: Math.floor((px(h.y) + 10) / 16) * 16 }); sfx(W, 'splash'); if (h.wet) h.vy = Math.min(h.vy, SWIM.MAX_FALL); }
  if (h.wet) swim(W, h, inp, dir, spd);
  else {
    if (h.ground) {
      h.chain = 0;
      const ice = h.surface === 'I';
      const skidDec = ice ? P.SKID_DEC >> ICE.SKID_SHIFT : P.SKID_DEC, relDec = ice ? P.REL_DEC >> ICE.REL_SHIFT : P.REL_DEC;
      if (dir !== 0) {
        if (h.vx !== 0 && Math.sign(h.vx) !== dir) {
          h.skid = true; h.face = dir; h.vx += dir * skidDec;
          if (Math.sign(h.vx) === dir || Math.abs(h.vx) < P.SKID_TURN / 4) h.vx = 0;
          if (W.frame % 3 === 0) emit(W, 'dust', { x: h.x / SUB + 8 - dir * 4, y: h.y / SUB + 16, n: 1, dir: -dir });
        } else {
          let acc = inp.run ? P.RUN_ACC : P.WALK_ACC; const max = inp.run ? P.MAX_RUN : P.MAX_WALK;
          if (ice) acc >>= ICE.ACC_SHIFT;
          h.face = dir; if (spd < P.MIN_WALK) h.vx = dir * P.MIN_WALK;
          if (Math.abs(h.vx) < max) { h.vx += dir * acc; if (Math.abs(h.vx) > max) h.vx = dir * max; }
          else { h.vx -= dir * relDec; if (Math.abs(h.vx) < max) h.vx = dir * max; }
        }
      } else if (h.vx !== 0) { const s = Math.sign(h.vx); h.vx -= s * relDec; if (Math.sign(h.vx) !== s) h.vx = 0; }
      if (Math.abs(h.vx) > P.MAX_WALK && W.frame % 7 === 0) emit(W, 'dust', { x: h.x / SUB + 8 - h.face * 4, y: h.y / SUB + 16, n: 1, dir: -h.face, spd: 0.3 });
    } else if (dir !== 0) {
      if (h.vx === 0 || Math.sign(h.vx) === dir) { h.vx += dir * (spd >= P.MAX_WALK ? P.RUN_ACC : P.WALK_ACC); if (Math.abs(h.vx) > h.airMax) h.vx = dir * h.airMax; }
      else h.vx += dir * (h.takeoff >= 0x01D00 ? P.RUN_ACC : (spd >= P.MAX_WALK ? P.REL_DEC : P.WALK_ACC));
    }
    if (h.buffer > 0 && (h.ground || (W.assist && h.coyote > 0))) doJump(W, h);
    if (h.buffer > 0) h.buffer--;
    if (!h.ground) { if (h.coyote > 0) h.coyote--; h.vy += (inp.jump && h.vy < 0) ? h.hold : h.fall; if (h.vy >= P.MAX_FALL) h.vy = P.FALL_CAP; }
  }
  // X (wind and conveyors push position directly, never velocity)
  let ex = 0;
  if (W.windOn) ex += W.wind.dir * W.wind.force;
  if (h.ground && (h.surface === '<' || h.surface === '>')) ex += (h.surface === '>' ? 1 : -1) * CONVEYOR;
  const mx = h.vx + ex;
  h.x += mx;
  let Lp = px(h.x) + HOX, R = Lp + HW - 1, Tp = px(h.y) + HOY, B = Tp + HH - 1;
  const ys = [Tp + 1, Tp + 7, B - 1];
  if (mx > 0 && ys.some(y => solidPx(W, R, y))) { h.x = ((Math.floor(R / 16) * 16 - HW) - HOX) * SUB; h.vx = 0; }
  else if (mx < 0 && ys.some(y => solidPx(W, Lp, y))) { h.x = ((Math.floor(Lp / 16) + 1) * 16 - HOX) * SUB; h.vx = 0; }
  // Y
  const fallV = h.vy, prevB = B;
  h.y += h.vy;
  Lp = px(h.x) + HOX; R = Lp + HW - 1; Tp = px(h.y) + HOY; B = Tp + HH - 1;
  const spring = h.vy > 0 && W.springs.find(s => Lp + HW > s.x + 2 && Lp < s.x + 14 && prevB < s.y + 8 && B >= s.y + 8);
  if (spring) springBounce(W, h, spring, inp);
  else if (h.vy > 0) {
    if (floorPx(W, Lp + 1, B, prevB) || floorPx(W, R - 1, B, prevB)) {
      h.y = ((Math.floor(B / 16) * 16 - HH) - HOY) * SUB; h.vy = 0; land(W, h, fallV);
    } else landOnThings(W, h, prevB, fallV);
  } else if (h.vy < 0) {
    const cx = Lp + HW / 2;
    if (solidPx(W, Lp + 2, Tp) || solidPx(W, R - 2, Tp)) {
      const r = Math.floor(Tp / 16);
      const c = solidPx(W, cx, Tp) ? Math.floor(cx / 16) : (solidPx(W, Lp + 2, Tp) ? Math.floor((Lp + 2) / 16) : Math.floor((R - 2) / 16));
      hitBlock(W, c, r); h.y = (((r + 1) * 16) - HOY) * SUB; h.vy = 0; h.sy = 0.85; h.sx = 1.12;
    }
  }
  // stepping onto a spring bounces too, not just landing on it
  if (h.ground && !h.plat) { const L2 = px(h.x) + HOX, s = W.springs.find(s => L2 + HW > s.x + 3 && L2 < s.x + 13 && px(h.y) + HOY + HH === s.y + 16); if (s) springBounce(W, h, s, inp); }
  if (h.ground) {
    B = px(h.y) + HOY + HH - 1; Lp = px(h.x) + HOX; R = Lp + HW - 1;
    const onPlat = h.plat && !h.plat.gone && Lp + HW > h.plat.x && Lp < h.plat.x + h.plat.w && B + 1 === h.plat.y;
    if (!onPlat) h.plat = null;
    if (!(standPx(W, Lp + 1, B + 1) || standPx(W, R - 1, B + 1) || onPlat)) {
      h.ground = false; const j = jumpParams(Math.abs(h.vx)); h.hold = j.fall; h.fall = j.fall; h.coyote = 6;
      h.takeoff = Math.abs(h.vx); h.airMax = h.takeoff >= P.MAX_WALK ? P.MAX_RUN : P.MAX_WALK;
    } else h.surface = onPlat ? '.' : tileOfPx(W, Lp + HW / 2, B + 1);
  }
  if (h.inv > 0) h.inv--;
  if (px(h.y) > VH + 16) { killHero(W, true); return; }
  const hx = px(h.x) + HOX, hy = px(h.y) + HOY;
  if (overlapsTile(W, hx + 1, hy + 6, HW - 2, HH - 6, 'V')) { killHero(W, true); emit(W, 'sparks', { x: hx + 5, y: hy + 12, n: 24, col: '#ff9040', spd: 2.4 }); return; }
  if (overlapsTile(W, hx + 1, hy + 6, HW - 2, HH - 6, '^')) {
    // spikes sit in the lower half of their tile
    for (let c = Math.floor((hx + 1) / 16); c <= Math.floor((hx + HW - 2) / 16); c++) { const r = Math.floor((hy + HH - 1) / 16); if (tileAt(W, c, r) === '^' && hy + HH - 1 >= r * 16 + 8) { hurtHero(W); break; } }
  }
  for (const g of W.gemList) if (!g.got && hx < g.x + 10 && hx + HW > g.x && hy < g.y + 12 && hy + HH > g.y) { g.got = true; addGem(W); emit(W, 'sparks', { x: g.x + 5, y: g.y + 6, n: 10, col: '#9ffff2' }); }
  if (h.ground) for (const d of W.doors) if (hx + HW / 2 >= d.c * 16 + 3 && hx + HW / 2 <= d.c * 16 + 13) { enterDoor(W, d); return; }
  for (let i = W.cp + 1; i < W.cps.length; i++) if (hx >= W.cps[i] * 16) {
    W.cp = i; sfx(W, 'checkpoint'); emit(W, 'sparks', { x: W.cps[i] * 16 + 8, y: 0, n: 20, col: '#ffd27a', spd: 1.8, post: true });
  }
  const poleX = W.pole * 16 + 7;
  if (hx + HW >= poleX && hx <= poleX + 2) grabPole(W);
  if (h.glow && W.frame % 4 === 0) emit(W, 'glowspark', { x: h.x / SUB + 8, y: h.y / SUB + 8 });
}
// Springs sit in the lower half of their tile. Holding jump on contact gives the big bounce.
function springBounce(W, h, s, inp) {
  const hi = inp.jump || h.buffer > 0;
  h.y = (s.y + 8 - HH - HOY) * SUB; h.vy = -(hi ? SPRING.HIGH : SPRING.LOW); h.hold = JUMPS[2].hold; h.fall = JUMPS[2].fall; h.springT = hi ? 0 : 8;
  h.ground = false; h.plat = null; h.takeoff = Math.abs(h.vx); h.airMax = h.takeoff >= P.MAX_WALK ? P.MAX_RUN : P.MAX_WALK; h.buffer = 0; h.coyote = 0; h.chain = 0;
  s.sq = 12; h.sx = 0.7; h.sy = 1.35; sfx(W, 'spring'); emit(W, 'sparks', { x: s.x + 8, y: s.y + 8, n: 8, col: '#fff0a8', spd: 1.2 });
}
function land(W, h, fallV) {
  if (!h.ground) { const k = clamp(fallV / P.FALL_CAP, 0.3, 1); h.sx = 1 + 0.3 * k; h.sy = 1 - 0.3 * k; emit(W, 'dust', { x: h.x / SUB + 8, y: h.y / SUB + 16, n: Math.round(3 + 5 * k) }); if (k > 0.5) sfx(W, 'land'); }
  h.ground = true;
}
function landOnThings(W, h, prevB, fallV) {
  const Lp = px(h.x) + HOX, B = px(h.y) + HOY + HH - 1;
  for (const p of W.plats) {
    if (p.gone || Lp + HW <= p.x || Lp >= p.x + p.w) continue;
    if (prevB < Math.max(p.py, p.y) && B >= p.y) { h.y = (p.y - HH - HOY) * SUB; h.vy = 0; h.plat = p; land(W, h, fallV); return; }
  }
}
function swim(W, h, inp, dir) {
  const max = inp.run ? SWIM.MAX_X_RUN : SWIM.MAX_X;
  if (dir !== 0) {
    h.face = dir;
    if (h.vx === 0 || Math.sign(h.vx) === dir) { h.vx += dir * P.WALK_ACC; if (Math.abs(h.vx) > max) h.vx = dir * max; }
    else h.vx += dir * P.REL_DEC;
  } else if (h.vx !== 0) { const s = Math.sign(h.vx); h.vx -= s * SWIM.DRAG; if (Math.sign(h.vx) !== s) h.vx = 0; }
  if (Math.abs(h.vx) > max) h.vx -= Math.sign(h.vx) * P.REL_DEC;
  if (h.buffer > 0) {
    h.buffer = 0; h.ground = false; h.plat = null;
    // Near the surface a stroke becomes a full jump so Dusky can climb out onto the bank.
    const headT = tileOfPx(W, px(h.x) + 8, px(h.y) + HOY - 6);
    if (headT !== '~' && !SOLID.has(headT)) { h.wet = false; doJump(W, h); return; }
    h.vy = -SWIM.STROKE; h.sy = 1.15; h.sx = 0.9; sfx(W, 'stroke');
    emit(W, 'bubbles', { x: h.x / SUB + 8, y: h.y / SUB + 6, n: 3 });
  }
  if (!h.ground) { h.vy += SWIM.GRAV; if (h.vy > SWIM.MAX_FALL) h.vy = SWIM.MAX_FALL; }
  h.hold = h.fall = JUMPS[0].fall; h.takeoff = Math.abs(h.vx); h.airMax = P.MAX_WALK;
}

function hitBlock(W, c, r) {
  const t = tileAt(W, c, r);
  if (t === 'C' || t === 'E' || t === 'M' || t === 'N') {
    bumpTile(W, c, r);
    if (t === 'E' || t === 'N') {
      W.g[r][c] = 'U'; W.items.push({ k: t === 'E' ? 'ember' : 'life', x: c * 16 * SUB, y: r * 16 * SUB, vx: 0, vy: 0, rise: 16 });
      sfx(W, t === 'E' ? 'ember' : 'crate'); emit(W, 'sparks', { x: c * 16 + 8, y: r * 16, n: 14, col: t === 'E' ? '#ffb65c' : '#ffe9a8' });
    } else {
      emit(W, 'gempop', { x: c * 16 + 3, y: r * 16 - 12 }); addGem(W); emit(W, 'sparks', { x: c * 16 + 8, y: r * 16, n: 8, col: '#9ffff2' });
      if (t === 'M') { const k = c + ',' + r; W.multi[k] = (W.multi[k] || 0) + 1; if (W.multi[k] >= 6) W.g[r][c] = 'U'; } else W.g[r][c] = 'U';
    }
  } else if (t === 'B') {
    if (W.hero.glow) {
      W.g[r][c] = '.'; sfx(W, 'brk'); addScore(W, 50); W.shake = 3.5;
      emit(W, 'debris', { c, r }); emit(W, 'dust', { x: c * 16 + 8, y: r * 16 + 8, n: 8 }); killOnTop(W, c, r);
    } else { bumpTile(W, c, r); sfx(W, 'bump'); }
  } else sfx(W, 'bump');
}
function bumpTile(W, c, r) { emit(W, 'bump', { c, r }); killOnTop(W, c, r); }
function killOnTop(W, c, r) {
  const x0 = c * 16, top = r * 16;
  for (const e of W.enemies) if (!e.dead) { const ex = px(e.x), ey = px(e.y) + 16; if (ex + 14 > x0 && ex + 2 < x0 + 16 && Math.abs(ey - top) <= 4) flipEnemy(W, e, 100); }
  for (const g of W.gemList) if (!g.got && g.x > x0 - 6 && g.x < x0 + 16 && g.y + 14 >= top - 16 && g.y < top) { g.got = true; addGem(W); emit(W, 'gempop', { x: g.x, y: g.y }); }
}
function flipEnemy(W, e, pts) { e.dead = 'flip'; e.vy = -0x03000; e.vx = (e.x > W.hero.x ? 1 : -1) * 0x00800; addScore(W, pts, px(e.x) + 8, px(e.y)); sfx(W, 'stomp'); }
function hurtHero(W) {
  const h = W.hero; if (h.inv > 0 || W.state !== 'play') return;
  if (h.glow) { h.glow = false; h.inv = 120; sfx(W, 'hurt'); W.shake = 3; emit(W, 'sparks', { x: h.x / SUB + 8, y: h.y / SUB + 8, n: 20, col: '#ffb65c', spd: 2.4 }); }
  else killHero(W, false);
}
export function killHero(W, pit) {
  if (W.state !== 'play') return;
  const h = W.hero;
  W.state = 'dying'; W.t = 0; h.glow = false; W.keepGlow = false; h.vx = 0; h.vy = pit ? 0 : -0x04000; h.pit = pit;
  W.shake = pit ? 0 : 4; sfx(W, 'die'); emit(W, 'music', { on: false });
}

// ---------- platforms ----------
function updatePlats(W) {
  const h = W.hero;
  for (const p of W.plats) {
    if (p.gone) continue;
    p.px = p.x; p.py = p.y;
    if (p.k === 'move') {
      const ph = ((W.frame + p.phase) % p.period) / p.period, k = (1 - Math.cos(ph * Math.PI * 2)) / 2;
      p.x = Math.round(p.x0 + p.dx * k); p.y = Math.round(p.y0 + p.dy * k);
    } else {
      if (p.t > 0 || (h.plat === p && h.ground)) p.t++;
      if (p.t === 23) sfx(W, 'creak');
      if (p.t > 22) { p.vy = Math.min(p.vy + 0.18, 4); p.fy = (p.fy ?? p.y) + p.vy; p.y = Math.round(p.fy); }
      if (p.y > VH + 40) p.gone = true;
    }
    if (h.plat === p && h.ground && W.state === 'play') {
      // carry the rider by whole pixels so it never drifts relative to the deck
      h.x += (p.x - p.px) * SUB;
      h.y = (p.y - HH - HOY) * SUB;
    }
  }
}

// ---------- enemies ----------
function spawnEntities(W) {
  while (W.spawnIdx < W.ents.length && W.ents[W.spawnIdx].c * 16 < W.camX + VIEW_W + 24) {
    const e = W.ents[W.spawnIdx++];
    const n = { t: e.t, x: e.c * 16 * SUB, y: e.r * 16 * SUB, vx: -0x00800, vy: 0, dead: false, dt: 0, ground: false, t0: 0, y0: e.r * 16 * SUB, rest: 0, grace: 0 };
    if (e.t === 'moth') { n.vx = -0x00600; n.t0 = e.c * 7; }
    if (e.t === 'fish') n.vx = -0x00700;
    if (e.t === 'hopper') n.t0 = (e.c * 13) % 60;
    W.enemies.push(n);
  }
}
function moveBody(W, b, w, ox, hgt = 16) {
  b.vy += 0x00600; if (b.vy > P.FALL_CAP) b.vy = P.FALL_CAP;
  b.x += b.vx;
  const l = px(b.x) + ox, r = l + w - 1, t = px(b.y) + 2 + (16 - hgt), bt = px(b.y) + 15;
  if (b.vx > 0 && (solidPx(W, r, t + 2) || solidPx(W, r, bt - 2))) { b.x = ((Math.floor(r / 16) * 16 - w) - ox) * SUB; b.vx = -b.vx; b.bonk = true; }
  else if (b.vx < 0 && (solidPx(W, l, t + 2) || solidPx(W, l, bt - 2))) { b.x = ((Math.floor(l / 16) + 1) * 16 - ox) * SUB; b.vx = -b.vx; b.bonk = true; }
  const prevB = px(b.y) + 15;
  b.y += b.vy;
  const l2 = px(b.x) + ox, b2 = px(b.y) + 15; b.ground = false;
  if (b.vy >= 0 && (floorPx(W, l2 + 1, b2, prevB) || floorPx(W, l2 + w - 2, b2, prevB))) { b.y = (Math.floor(b2 / 16) * 16 - 16) * SUB; b.vy = 0; b.ground = true; }
}
function stompBounce(W, h) { h.vy = -P.STOMP_BOUNCE; h.hold = JUMPS[0].hold; h.fall = JUMPS[0].fall; h.sx = 1.25; h.sy = 0.8; h.ground = false; h.plat = null; }
function updateEnemies(W) {
  const h = W.hero, hx = px(h.x) + HOX, hy = px(h.y) + HOY;
  for (const e of W.enemies) {
    if (e.dead === 'flat') { e.dt++; continue; }
    if (e.dead === 'flip') { e.vy += 0x00600; e.x += e.vx; e.y += e.vy; continue; }
    e.t0++;
    if (e.t === 'moth') {
      e.x += e.vx; e.y = e.y0 + Math.round(Math.sin(e.t0 * 0.05) * 20) * SUB;
    } else if (e.t === 'fish') {
      const ahead = tileOfPx(W, px(e.x) + 8 + Math.sign(e.vx) * 9, px(e.y) + 8);
      if (ahead !== '~') e.vx = -e.vx;
      e.x += e.vx; e.y = e.y0 + Math.round(Math.sin(e.t0 * 0.06) * 5) * SUB;
    } else {
      e.bonk = false;
      moveBody(W, e, 14, 1);
      if (e.t === 'hopper' && e.ground && e.t0 % 80 === 0) { e.vy = -0x04C00; e.vx = (h.x > e.x ? 1 : -1) * 0x00800; }
      if (e.t === 'shell') {
        if (e.vx === 0) { if (++e.rest > 420) { e.t = 'snail'; e.vx = (h.x > e.x ? 1 : -1) * 0x00800; e.rest = 0; } }
        else if (e.bonk) sfx(W, 'bump');
      }
      if (e.grace > 0) e.grace--;
      if (tileOfPx(W, px(e.x) + 8, px(e.y) + 12) === 'V') { e.gone = true; emit(W, 'sparks', { x: px(e.x) + 8, y: px(e.y) + 12, n: 10, col: '#ff9040' }); continue; }
      if (tileOfPx(W, px(e.x) + 8, px(e.y) + 10) === '~') { e.gone = true; emit(W, 'splash', { x: px(e.x) + 8, y: Math.floor((px(e.y) + 10) / 16) * 16 }); continue; }
    }
    if (px(e.y) > VH + 16) { e.gone = true; continue; }
    if (e.t === 'shell' && e.vx !== 0) {
      for (const o of W.enemies) if (o !== e && !o.dead && Math.abs(o.x - e.x) < 14 * SUB && Math.abs(o.y - e.y) < 12 * SUB) flipEnemy(W, o, CHAIN[Math.min(e.chain = (e.chain || 0) + 1, CHAIN.length - 1)]);
    } else if (e.t !== 'moth' && e.t !== 'fish') {
      for (const o of W.enemies) if (o !== e && !o.dead && o.t !== 'moth' && o.t !== 'fish' && !(o.t === 'shell' && o.vx !== 0) && Math.abs(o.x - e.x) < 14 * SUB && Math.abs(o.y - e.y) < 12 * SUB) { if ((e.x < o.x && e.vx > 0) || (e.x > o.x && e.vx < 0)) e.vx = -e.vx; }
    }
    if (W.state !== 'play') continue;
    const ex = px(e.x) + 1, ey = px(e.y) + 3;
    if (hx < ex + 14 && hx + HW > ex && hy < ey + 13 && hy + HH > ey) {
      const fromAbove = h.vy > 0 && hy + HH - 1 < ey + 8;
      if (e.t === 'shell') {
        if (e.vx === 0) {
          e.vx = (hx + HW / 2 < ex + 7 ? 1 : -1) * SHELL_KICK; e.grace = 12; e.chain = 0; addScore(W, 400, ex + 7, ey - 6); sfx(W, 'kick'); W.shake = 1.2;
          if (fromAbove) stompBounce(W, h);
        } else if (fromAbove) { e.vx = 0; e.rest = 0; stompBounce(W, h); sfx(W, 'stomp'); addScore(W, 100, ex + 7, ey - 6); }
        else if (e.grace === 0) hurtHero(W);
      } else if (STOMPABLE.has(e.t) && fromAbove) {
        addScore(W, CHAIN[Math.min(h.chain++, CHAIN.length - 1)], ex + 7, ey - 6); sfx(W, 'stomp');
        if (e.t === 'snail') { e.t = 'shell'; e.vx = 0; e.rest = 0; e.grace = 8; }
        else if (e.t === 'moth') { e.dead = 'flip'; e.vy = 0; e.vx = 0; }
        else { e.dead = 'flat'; e.dt = 0; }
        stompBounce(W, h);
        W.freeze = 4; W.shake = 1.6; emit(W, 'dust', { x: ex + 7, y: ey + 12, n: 6 }); emit(W, 'sparks', { x: ex + 7, y: ey + 4, n: 6, col: '#d8ffb0', spd: 1.2 });
      } else hurtHero(W);
    }
  }
  W.enemies = W.enemies.filter(e => !e.gone && !(e.dead === 'flat' && e.dt > 36) && px(e.y) < VH + 40 && px(e.x) > W.camX - 120 && px(e.x) < W.camX + VIEW_W + 200);
}
function updateItems(W) {
  const h = W.hero, hx = px(h.x) + HOX, hy = px(h.y) + HOY;
  for (const it of W.items) {
    if (it.rise > 0) { it.y -= SUB / 2; it.rise -= 0.5; if (it.rise <= 0) it.vx = 0x00C00; continue; }
    moveBody(W, it, 14, 1);
    const ix = px(it.x), iy = px(it.y);
    if (hx < ix + 14 && hx + HW > ix + 2 && hy < iy + 14 && hy + HH > iy + 2) {
      it.gone = true;
      if (it.k === 'life') { W.lives++; sfx(W, 'oneup'); emit(W, 'pop', { x: ix + 8, y: iy, s: '1UP' }); emit(W, 'sparks', { x: ix + 8, y: iy + 8, n: 20, col: '#ffe9a8', spd: 2 }); }
      else { h.glow = true; addScore(W, 1000, ix + 8, iy); sfx(W, 'ember'); emit(W, 'sparks', { x: ix + 8, y: iy + 8, n: 24, col: '#ffb65c', spd: 2.2 }); }
    }
    if (iy > VH + 16) it.gone = true;
  }
  W.items = W.items.filter(i => !i.gone);
}

// ---------- fire: rotating fire wheels and floor jets (x-4 fortresses) ----------
// Firebar: `len` fireballs 8px apart on an arm turning around the centre of tile (c, r).
export function fireballs(W, f) {
  const cx = f.c * 16 + 8, cy = f.r * 16 + 8, a = (f.phase || 0) + W.frame * (f.speed || 0.04), out = [];
  for (let i = 0; i < (f.len || 5); i++) out.push([cx + Math.cos(a) * i * 8, cy + Math.sin(a) * i * 8]);
  if (f.twin) for (let i = 1; i < (f.len || 5); i++) out.push([cx - Math.cos(a) * i * 8, cy - Math.sin(a) * i * 8]);
  return out;
}
// Jet: a flame column `h` tiles tall rising from the floor under tile (c, r). Burns for `on` frames
// out of every `period`, and sputters for 30 frames before it fires.
export function jetPhase(W, f) {
  const P = f.period || 160, t = (W.frame + (f.phase || 0)) % P;
  return t < (f.on || 60) ? 'on' : t >= P - 30 ? 'warn' : 'off';
}
function updateFire(W) {
  if (!W.fire.length || W.state !== 'play') return;
  const h = W.hero, hx = px(h.x) + HOX, hy = px(h.y) + HOY;
  for (const f of W.fire) {
    if (Math.abs(f.c * 16 - hx) > 120) continue;
    if (f.t === 'firebar') {
      for (const [x, y] of fireballs(W, f)) {
        const dx = x - clamp(x, hx, hx + HW), dy = y - clamp(y, hy, hy + HH);
        if (dx * dx + dy * dy < 9) { hurtHero(W); return; }
      }
    } else if (jetPhase(W, f) === 'on') {
      const x0 = f.c * 16 + 3, y1 = (f.r + 1) * 16, y0 = y1 - (f.h || 3) * 16;
      if (hx < x0 + 10 && hx + HW > x0 && hy < y1 && hy + HH > y0 + 4) { hurtHero(W); return; }
    }
  }
}

// ---------- hazards: meteors, boss seeds ----------
function updateShots(W) {
  const h = W.hero, hx = px(h.x) + HOX, hy = px(h.y) + HOY;
  if (W.meteors && W.state === 'play' && W.frame % W.meteors.every === 0 && W.frame > 90) {
    const x = W.camX + 120 + rand(W) * (VIEW_W - 60);
    W.shots.push({ k: 'meteor', x: x * SUB, y: -24 * SUB, vx: -0x00A00, vy: 0x01C00, warn: 50, gone: false });
  }
  for (const s of W.shots) {
    if (s.warn > 0) { s.warn--; if (s.warn === 0) sfx(W, 'whoosh'); continue; }
    if (s.k === 'seed') s.vy += 0x00300;
    s.x += s.vx; s.y += s.vy;
    const sx = px(s.x), sy = px(s.y);
    if (solidPx(W, sx, sy) && sy > 0) { s.gone = true; emit(W, 'sparks', { x: sx, y: sy, n: s.k === 'meteor' ? 16 : 6, col: s.k === 'meteor' ? '#ffd27a' : '#ff8fb2', spd: 2 }); if (s.k === 'meteor') { sfx(W, 'boom'); W.shake = Math.max(W.shake, 2); } continue; }
    if (sy > VH + 20 || sx < W.camX - 60 || sx > W.camX + VIEW_W + 60) { s.gone = true; continue; }
    if (W.state === 'play' && Math.abs(sx - (hx + HW / 2)) < 7 && Math.abs(sy - (hy + HH / 2)) < 9) hurtHero(W);
  }
  W.shots = W.shots.filter(s => !s.gone);
}

// ---------- boss ----------
function updateBoss(W) {
  const A = W.lv.boss; if (!A || W.bossDone) return;
  const h = W.hero;
  if (!W.boss && W.state === 'play' && px(h.x) > (A.c0 + 2) * 16) {
    W.lock = { min: A.c0 * 16, max: A.c0 * 16 };
    for (let r = 0; r <= 12; r++) W.g[r][A.c0] = 'X';
    // drop in from above, or from just under the roof in caves
    let roof = 0; while (roof < 8 && SOLID.has(W.g[roof][A.c0 + 20])) roof++;
    W.boss = { x: (A.c0 + 19) * 16 * SUB, y: (roof ? roof * 16 + 14 : -40) * SUB, vx: 0, vy: 0, hp: A.hp, max: A.hp, inv: 0, t: 0, ground: false, face: -1, dead: false, kind: A.kind };
    sfx(W, 'gate'); emit(W, 'music', { boss: true }); W.shake = 2;
  }
  const b = W.boss; if (!b) return;
  b.t++;
  if (b.dead) { b.vy += 0x00500; b.x += b.vx; b.y += b.vy; if (px(b.y) > VH + 60) { W.boss = null; W.bossDone = true; } return; }
  if (b.inv > 0) b.inv--;
  // Second phase at half health: faster, jumpier, one more seed per volley.
  const rage = b.hp <= Math.ceil(b.max / 2);
  if (rage && !b.raged) { b.raged = true; sfx(W, 'rage'); W.shake = 3; emit(W, 'sparks', { x: px(b.x) + 16, y: px(b.y), n: 24, col: '#f07a8c', spd: 2.2 }); }
  const spd = Math.floor((A.speed || 0x00A00) * (rage ? 1.35 : 1)), dir = h.x > b.x ? 1 : -1;
  const jumpEvery = Math.floor((A.jump || 110) * (rage ? 0.7 : 1)), shotEvery = A.shot ? Math.floor(A.shot * (rage ? 0.8 : 1)) : 0;
  if (b.ground) {
    const flee = b.inv > 0;
    b.vx = (flee ? -dir : dir) * (flee ? spd * 2 : spd); b.face = dir;
    if (b.t % jumpEvery === 0) { b.vy = rage ? -0x06000 : -0x05800; emit(W, 'dust', { x: px(b.x) + 16, y: px(b.y) + 16, n: 8 }); }
  }
  if (shotEvery && b.t % shotEvery === 0 && W.state === 'play') {
    for (let i = 0; i < (A.spread || 1) + (rage ? 1 : 0); i++) W.shots.push({ k: 'seed', x: b.x + 16 * SUB, y: b.y - 6 * SUB, vx: dir * (0x01400 + i * 0x00700), vy: -0x04000 - i * 0x00600, warn: 0 });
    sfx(W, 'spit');
  }
  const wasAir = !b.ground;
  moveBody(W, b, 30, 1, 30);
  if (b.ground && wasAir && b.t > 2) { W.shake = Math.max(W.shake, 2.5); sfx(W, 'thud'); emit(W, 'dust', { x: px(b.x) + 16, y: px(b.y) + 16, n: 12 }); }
  if (W.state !== 'play') return;
  const hx = px(h.x) + HOX, hy = px(h.y) + HOY, bx = px(b.x) + 2, by = px(b.y) - 12;
  if (hx < bx + 28 && hx + HW > bx && hy < by + 28 && hy + HH > by) {
    if (h.vy > 0 && hy + HH - 1 < by + 12) {
      if (b.inv === 0) {
        b.hp--; b.inv = 70; addScore(W, 1000, bx + 14, by - 6); sfx(W, 'bosshit'); W.freeze = 6; W.shake = 3;
        emit(W, 'sparks', { x: bx + 14, y: by + 4, n: 18, col: '#ffd27a', spd: 2 });
        if (b.hp <= 0) {
          b.dead = true; b.vy = -0x04000; b.vx = -dir * 0x00800; addScore(W, 5000, bx + 14, by - 16); sfx(W, 'bossdown');
          for (let c = 0; c < W.LW; c++) for (let r = 0; r < LH; r++) if (W.g[r][c] === 'X') { W.g[r][c] = '.'; emit(W, 'debris', { c, r, gate: true }); }
          W.lock = null; W.shots = []; emit(W, 'music', { boss: false }); W.shake = 5;
        }
      }
      h.vy = -0x05000; h.hold = JUMPS[2].hold; h.fall = JUMPS[2].fall; h.sx = 1.25; h.sy = 0.8; h.ground = false; h.plat = null;
    } else if (b.inv === 0) hurtHero(W);
  }
}

// ---------- doors ----------
// Walking into a door fades out, moves Dusky to the door's target in another zone, and fades back in.
const DOOR_T = 48;
function enterDoor(W, d) {
  W.state = 'door'; W.t = 0; W.door = d; const h = W.hero; h.vx = 0; h.vy = 0; h.plat = null;
  sfx(W, d.kind === 'up' ? 'doorup' : 'doordown'); emit(W, 'music', { on: false });
}
function updateDoor(W) {
  const h = W.hero, d = W.door; W.t++;
  if (W.t === DOOR_T / 2) {
    h.x = (d.to[0] * 16) * SUB; h.y = (d.to[1] * 16) * SUB; h.ground = true; h.face = 1; W.lookX = 0; h.inv = Math.max(h.inv, 60);
    updateCamera(W, true);
  }
  if (W.t >= DOOR_T) { W.state = 'play'; W.door = null; emit(W, 'music', { resume: true }); }
}
function zoneOf(W, col) { return W.zones && W.zones.find(z => col >= z[0] && col <= z[1]); }

// ---------- goal ----------
function grabPole(W) {
  if (W.state !== 'play') return;
  const h = W.hero;
  W.state = 'pole'; W.t = 0;
  const y = px(h.y); W.poleScore = y < 60 ? 5000 : y < 100 ? 2000 : y < 140 ? 800 : y < 170 ? 400 : 100;
  addScore(W, W.poleScore, W.pole * 16 + 16, y);
  h.x = (W.pole * 16 + 7 - 12) * SUB; h.vx = 0; h.vy = 0; h.face = 1; h.plat = null;
  sfx(W, 'lantern'); emit(W, 'music', { on: false }); W.lit = true; emit(W, 'sparks', { x: W.pole * 16 + 8, y: 30, n: 30, col: '#ffd27a', spd: 2.5 });
}
function updateGoal(W) {
  W.t++; const h = W.hero;
  if (W.state === 'pole') { if (px(h.y) < 176) h.y += 2 * SUB; else if (W.t > 50) { W.state = 'walkout'; W.t = 0; h.x = (W.pole + 1) * 16 * SUB; h.face = 1; h.ground = false; sfx(W, 'clear'); } }
  else if (W.state === 'walkout') {
    if (!h.ground) h.vy += 0x00600;
    h.vx = P.MAX_WALK; h.x += h.vx; h.y += h.vy; h.walk = (h.walk || 0) + 0.5;
    if (px(h.y) >= 192) { if (!h.ground) { emit(W, 'dust', { x: h.x / SUB + 8, y: 208, n: 5 }); h.sy = 0.8; h.sx = 1.2; } h.y = 192 * SUB; h.vy = 0; h.ground = true; }
    if (px(h.x) + 8 >= (W.hut + 2) * 16 + 8) { h.hidden = true; W.state = 'tally'; W.t = 0; }
  } else if (W.state === 'tally') {
    if (W.time > 0) { const n = Math.min(W.time, 2); W.time -= n; W.score += n * 50; if (W.t % 3 === 0) sfx(W, 'tick'); }
    else if (W.t > 30) { W.state = 'done'; W.t = 0; W.keepGlow = h.glow; }
  }
}

// ---------- camera ----------
export function updateCamera(W, snap) {
  const h = W.hero, look = h.face * 26 + (h.vx / SUB) * 8;
  W.lookX += (look - W.lookX) * 0.04;
  let target = clamp(h.x / SUB + 8 - VIEW_W * 0.42 + W.lookX, 0, W.PX - VIEW_W);
  const z = zoneOf(W, Math.floor((h.x / SUB + 8) / 16));
  if (z) target = clamp(target, z[0] * 16, Math.max(z[0] * 16, Math.min(W.PX, (z[1] + 1) * 16) - VIEW_W));
  if (W.lock) target = clamp(target, W.lock.min, W.lock.max);
  W.camX = snap ? target : W.camX + (target - W.camX) * 0.1;
}

// ---------- step ----------
// inp: { left, right, jump, run, jumpP }. Advances exactly one 60 Hz tick.
export function step(W, inp) {
  W.frame++;
  if (W.freeze > 0) { W.freeze--; if (inp.jumpP) W.hero.buffer = W.assist ? 6 : 1; return; }
  if (W.state === 'dying') {
    const h = W.hero; W.t++;
    if (W.t > 30 && !h.pit) { h.vy += 0x00400; h.y += h.vy; }
    if (W.t > 170) W.state = 'dead';
    return;
  }
  if (W.state === 'dead' || W.state === 'done') return;
  if (W.state === 'door') { updateDoor(W); return; }
  if (W.wind) { const on = (W.frame % W.wind.period) >= W.wind.period - W.wind.on; if (on !== W.windOn) { W.windOn = on; if (on) sfx(W, 'wind'); } }
  if (W.state === 'play') {
    updatePlats(W);
    updateHero(W, inp);
    if (W.state === 'play') {
      updateCamera(W, false);
      if (++W.tick >= 24) { W.tick = 0; W.time--; if (W.time === 100) sfx(W, 'hurry'); if (W.time <= 0) { W.time = 0; killHero(W, false); } }
    }
  } else { updatePlats(W); updateGoal(W); }
  for (const s of W.springs) if (s.sq > 0) s.sq--;
  spawnEntities(W); updateEnemies(W); updateItems(W); updateShots(W); updateBoss(W); updateFire(W);
  const sky = W.lv.sky || [0, 1];
  W.prog = sky[0] + (sky[1] - sky[0]) * clamp(W.camX / Math.max(1, W.PX - VIEW_W), 0, 1);
}

// Cheap deep copy for search tools (solver). Events and fx are dropped.
export function cloneWorld(W) {
  const C = { ...W, g: W.g.map(r => r.slice()), hero: { ...W.hero }, enemies: W.enemies.map(e => ({ ...e })), items: W.items.map(i => ({ ...i })),
    shots: W.shots.map(s => ({ ...s })), plats: W.plats.map(p => ({ ...p })), springs: W.springs.map(s => ({ ...s })),
    gemList: W.gemList.map(g => ({ ...g })), multi: { ...W.multi }, fire: W.fire, boss: W.boss && { ...W.boss }, lock: W.lock && { ...W.lock }, ev: [] };
  if (W.hero.plat) C.hero.plat = C.plats[W.plats.indexOf(W.hero.plat)];
  return C;
}
