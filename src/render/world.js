// =============== Render: world (tiles, actors, goal, lighting) ===============
import { R, VH } from './ctx.js';
import { SUB } from '../physics.js';
import { fireballs, jetPhase } from '../sim.js';
import { drawHut } from './huts.js';
import { SOLID } from '../tiles.js';
import { hsh, clamp, rr } from '../util.js';
import { FX } from './fx.js';

const tileAt = (W, c, r) => (r < 0 || r >= 15 || c < 0 || c >= W.LW) ? '.' : W.g[r][c];
export const isUnder = (W, c) => !!W.lv.under && c >= W.lv.under[0] && c <= W.lv.under[1];

export function drawTiles(W) {
  const { ctx } = R, f = R.frame;
  const c0 = Math.floor(W.camX / 16) - 1, c1 = c0 + Math.ceil(R.VW / 16) + 2;
  for (let r = 0; r < 15; r++) for (let c = c0; c <= c1; c++) {
    const t = tileAt(W, c, r); if (t === '.' || t === '~') continue;
    const under = isUnder(W, c), T = under ? R.TU : R.T;
    let img, v = Math.floor(hsh(c * 3.7 + r) * 3);
    switch (t) {
      case 'G': img = tileAt(W, c, r - 1) === 'G' ? T.soil[v] : T.top[v]; break;
      case 'B': case 'M': img = T.brick[(c * 7 + r * 3) % 4]; break;
      case 'C': case 'E': img = T.crate; R.lights.push([c * 16 + 8, r * 16 + 8, 26, 0.55]); break;
      case 'N': img = T.life; R.lights.push([c * 16 + 8, r * 16 + 8, 26, 0.55]); break;
      case 'U': img = T.used; break;
      case 'S': img = T.stone[tileAt(W, c, r - 1) === '.' && hsh(c) > 0.5 ? 1 : 0]; break;
      case 'L': img = T.pilL; break; case 'R': img = T.pilR; break; case 'l': img = T.capL; break; case 'r': img = T.capR; break;
      case '-': { const l = tileAt(W, c - 1, r) === '-', rt = tileAt(W, c + 1, r) === '-'; img = T.ledge[l && rt ? 1 : l ? 2 : rt ? 0 : 3]; break; }
      case 'I': img = T.ice[(c + r) % 2]; break;
      case 'X': img = T.gate; break;
      case '<': case '>': drawConveyor(c, r, t === '>' ? 1 : -1, f); continue;
      case '^': drawSpikes(c, r); continue;
      case 'V': drawLava(W, c, r, f); continue;
    }
    let oy = 0; const b = FX.bumps.find(b => b.c === c && b.r === r); if (b) oy = -Math.sin((b.t / 10) * Math.PI) * 5;
    if (img) ctx.drawImage(img, c * 16, r * 16 + oy, 16, 16);
    if (t === 'G' && R.theme.facade && !under && img !== T.top[v]) drawWindow(W, c, r);
  }
  // contact shadow beneath floating blocks
  ctx.fillStyle = 'rgba(10,6,24,.18)';
  for (let c = c0; c <= c1; c++) for (let r = 1; r < 13; r++) if (SOLID.has(tileAt(W, c, r)) && tileAt(W, c, r + 1) === '.') ctx.fillRect(c * 16 + 1, r * 16 + 16, 14, 1.5);
}
// Rooftops: building fronts get windows, lit more often as night falls.
function drawWindow(W, c, r) {
  const k = hsh(c * 7.31 + r * 3.17); if (k < 0.45) return;
  const { ctx } = R, x = c * 16 + 4, y = r * 16 + 3, lit = hsh(c * 1.7 + r * 9.1) < 0.25 + W.prog * 0.6;
  ctx.fillStyle = '#2a1818'; ctx.fillRect(x - 1, y - 1, 10, 11);
  if (lit) {
    const g = ctx.createLinearGradient(0, y, 0, y + 9); g.addColorStop(0, '#fff0b8'); g.addColorStop(1, '#ff9a48');
    ctx.fillStyle = g; ctx.fillRect(x, y, 8, 9); R.lights.push([x + 4, y + 4, 22, 0.5]);
  } else { ctx.fillStyle = '#3a3050'; ctx.fillRect(x, y, 8, 9); }
  ctx.fillStyle = '#2a1818'; ctx.fillRect(x + 3.6, y, 0.8, 9); ctx.fillRect(x, y + 4, 8, 0.8);
  ctx.fillStyle = '#5a3a3a'; ctx.fillRect(x - 1.5, y + 9.5, 11, 1.2);
}
function drawConveyor(c, r, dir, f) {
  const { ctx } = R, x = c * 16, y = r * 16;
  ctx.fillStyle = '#2a2230'; rr(ctx, x, y, 16, 16, 2); ctx.fill();
  ctx.fillStyle = '#4a3a3a'; ctx.fillRect(x, y + 1, 16, 5);
  ctx.save(); ctx.beginPath(); ctx.rect(x, y + 1, 16, 5); ctx.clip();
  ctx.fillStyle = '#e8b050'; const o = ((f * 0.6 * dir) % 6 + 6) % 6;
  for (let i = -1; i < 4; i++) { const cx = x + i * 6 + o; ctx.beginPath(); ctx.moveTo(cx, y + 1.5); ctx.lineTo(cx + 2 * dir, y + 3.5); ctx.lineTo(cx, y + 5.5); ctx.lineTo(cx + 1.2, y + 5.5); ctx.lineTo(cx + 1.2 + 2 * dir, y + 3.5); ctx.lineTo(cx + 1.2, y + 1.5); ctx.fill(); }
  ctx.restore();
  ctx.fillStyle = '#8a7a6a'; [4, 12].forEach(dx => { ctx.beginPath(); ctx.arc(x + dx, y + 11, 2.4, 0, 7); ctx.fill(); });
  ctx.fillStyle = '#2a2230'; [4, 12].forEach(dx => { ctx.beginPath(); ctx.arc(x + dx, y + 11, 0.8, 0, 7); ctx.fill(); });
}
function drawSpikes(c, r) {
  const { ctx } = R, x = c * 16, y = r * 16;
  for (let i = 0; i < 4; i++) {
    const g = ctx.createLinearGradient(0, y + 7, 0, y + 16); g.addColorStop(0, '#f0ecff'); g.addColorStop(1, '#6a6690');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x + i * 4, y + 16); ctx.lineTo(x + i * 4 + 2, y + 7); ctx.lineTo(x + i * 4 + 4, y + 16); ctx.fill();
  }
}
function drawLava(W, c, r, f) {
  const { ctx } = R, x = c * 16, y = r * 16, top = tileAt(W, c, r - 1) !== 'V';
  const g = ctx.createLinearGradient(0, y, 0, y + 16); g.addColorStop(0, '#ffd070'); g.addColorStop(0.3, '#ff7a2a'); g.addColorStop(1, '#a02a10');
  ctx.fillStyle = g;
  if (top) { ctx.beginPath(); ctx.moveTo(x, y + 16); for (let i = 0; i <= 16; i += 2) ctx.lineTo(x + i, y + 3 + Math.sin(f * 0.08 + (x + i) * 0.3) * 1.4); ctx.lineTo(x + 16, y + 16); ctx.fill(); }
  else ctx.fillRect(x, y, 16, 16);
  if (top && c % 2 === 0) { R.lights.push([x + 8, y + 4, 44, 0.8]); R.blooms.push([x + 8, y + 6, 14, 'rgba(255,120,40,0.25)']); }
}
export function drawWater(W) {
  const { ctx } = R, f = R.frame;
  const c0 = Math.floor(W.camX / 16) - 1, c1 = c0 + Math.ceil(R.VW / 16) + 2;
  for (let c = c0; c <= c1; c++) for (let r = 0; r < 15; r++) {
    if (tileAt(W, c, r) !== '~') continue;
    const x = c * 16, y = r * 16, top = tileAt(W, c, r - 1) !== '~';
    ctx.fillStyle = 'rgba(40,110,150,0.45)';
    if (top) {
      ctx.beginPath(); ctx.moveTo(x, y + 16);
      for (let i = 0; i <= 16; i += 2) ctx.lineTo(x + i, y + 2 + Math.sin(f * 0.06 + (x + i) * 0.25) * 1.2);
      ctx.lineTo(x + 16, y + 16); ctx.fill();
      ctx.strokeStyle = 'rgba(200,240,255,.55)'; ctx.lineWidth = 0.6; ctx.beginPath();
      for (let i = 0; i <= 16; i += 2) { const yy = y + 2 + Math.sin(f * 0.06 + (x + i) * 0.25) * 1.2; i ? ctx.lineTo(x + i, yy) : ctx.moveTo(x, yy); }
      ctx.stroke();
    } else ctx.fillRect(x, y, 16, 16);
  }
}

export function drawGrass(W) {
  if (!R.theme.grassBlades) return;
  const { ctx } = R, h = W.hero;
  const c0 = Math.floor(W.camX / 16) - 1, c1 = c0 + Math.ceil(R.VW / 16) + 2;
  const hx = h.x / SUB + 8, hy = h.y / SUB + 16;
  const paths = [new Path2D(), new Path2D()];
  for (let c = c0; c <= c1; c++) for (let r = 1; r < 15; r++) {
    if (tileAt(W, c, r) !== 'G' || tileAt(W, c, r - 1) !== '.' || isUnder(W, c)) continue;
    const y = r * 16;
    for (let b = 0; b < 7; b++) {
      const bx = c * 16 + b * 2.3 + hsh(c * 11 + b) * 1.5, ht = 2.5 + hsh(c * 5 + b * 3) * 4.5;
      let sway = Math.sin(R.frame * 0.045 + bx * 0.13) * 1.1;
      const dx = bx - hx; if (Math.abs(dx) < 11 && Math.abs(hy - y) < 8) sway += Math.sign(dx || 1) * (11 - Math.abs(dx)) * 0.4;
      const p = paths[b % 2]; p.moveTo(bx - 0.5, y + 1); p.quadraticCurveTo(bx + sway * 0.4, y - ht * 0.5, bx + sway, y - ht); p.lineTo(bx + 0.5, y + 1);
    }
  }
  ctx.fillStyle = R.theme.ground.blades[0]; ctx.fill(paths[0]); ctx.fillStyle = R.theme.ground.blades[1]; ctx.fill(paths[1]);
}

export function drawGem(x, y, glow = true) {
  const { ctx } = R, f = R.frame;
  const cx = x + 5, cy = y + 6, bob = Math.sin(f * 0.06 + x * 0.1) * 1; const Y = cy + bob;
  const g = ctx.createLinearGradient(cx - 5, Y - 5, cx + 5, Y + 6); g.addColorStop(0, '#e8fffb'); g.addColorStop(0.45, '#6ff0e0'); g.addColorStop(1, '#16807c');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(cx - 3, Y - 5); ctx.lineTo(cx + 3, Y - 5); ctx.lineTo(cx + 5, Y - 2); ctx.lineTo(cx, Y + 6); ctx.lineTo(cx - 5, Y - 2); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(10,60,70,.5)'; ctx.lineWidth = 0.35; ctx.beginPath(); ctx.moveTo(cx - 5, Y - 2); ctx.lineTo(cx + 5, Y - 2); ctx.moveTo(cx - 1.5, Y - 5); ctx.lineTo(cx - 2, Y - 2); ctx.lineTo(cx, Y + 6); ctx.moveTo(cx + 1.5, Y - 5); ctx.lineTo(cx + 2, Y - 2); ctx.lineTo(cx, Y + 6); ctx.stroke();
  const tw = (Math.sin(f * 0.08 + x) + 1) / 2;
  if (tw > 0.7) { ctx.fillStyle = `rgba(255,255,255,${(tw - 0.7) * 3})`; const s = 2.2 * tw; ctx.beginPath(); ctx.moveTo(cx - 2, Y - 3 - s); ctx.lineTo(cx - 1.6, Y - 3.4); ctx.lineTo(cx - 2 + s, Y - 3); ctx.lineTo(cx - 1.6, Y - 2.6); ctx.lineTo(cx - 2, Y - 3 + s); ctx.lineTo(cx - 2.4, Y - 2.6); ctx.lineTo(cx - 2 - s, Y - 3); ctx.lineTo(cx - 2.4, Y - 3.4); ctx.fill(); }
  if (glow) { R.lights.push([cx, Y, 20, 0.45]); R.blooms.push([cx, Y, 10, 'rgba(120,255,235,0.18)']); }
}
R.drawGem = drawGem;

// ---------- Dusky ----------
// Visual-only state (scarf, blink, lantern swing) lives on hero.vis and ticks at 60 Hz with the sim.
export function animHero(W) {
  const h = W.hero, V = h.vis || (h.vis = initVis(h));
  h.sx += (1 - h.sx) * 0.2; h.sy += (1 - h.sy) * 0.2;
  if ((h.ground && h.vx !== 0) || W.state === 'walkout') V.ph += (W.state === 'walkout' ? 0.5 : Math.abs(h.vx) / SUB * 0.32);
  else if (h.wet) V.ph += 0.12;
  if (--V.blink < -6) V.blink = 100 + Math.random() * 200;
  const acc = (h.vx - V.pvx) / SUB; V.pvx = h.vx;
  V.lanV += -V.lanA * 0.06 - acc * 0.9 * h.face + (h.vy / SUB) * 0.004; V.lanV *= 0.9; V.lanA += V.lanV; V.lanA = clamp(V.lanA, -1, 1);
  const ax = h.x / SUB + 8 - h.face * 1.5, ay = h.y / SUB + 16 - 11;
  const sc = V.scarf; sc[0].x = ax; sc[0].y = ay;
  for (let i = 1; i < sc.length; i++) { const p = sc[i], vx = (p.x - p.px) * 0.86, vy = (p.y - p.py) * 0.86; p.px = p.x; p.py = p.y;
    p.x += vx - h.face * 0.05 + Math.sin(R.frame * 0.12 + i) * 0.05 + (W.windOn ? W.wind.dir * 0.25 : 0); p.y += vy + (h.wet ? -0.02 : 0.12); }
  for (let k = 0; k < 3; k++) for (let i = 1; i < sc.length; i++) { const a = sc[i - 1], b = sc[i], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, f = (d - 2) / d; b.x -= dx * f; b.y -= dy * f; }
}
function initVis(h) {
  const x = h.x / SUB + 8, y = h.y / SUB + 5, scarf = [];
  for (let i = 0; i < 6; i++) scarf.push({ x: x - i * 2, y, px: x - i * 2, py: y });
  return { ph: 0, blink: 120, lanA: 0, lanV: 0, pvx: 0, scarf };
}
export function drawDusky(W) {
  const h = W.hero; if (h.hidden) return;
  const { ctx } = R, V = h.vis || (h.vis = initVis(h)), f = R.frame;
  const cx = h.x / SUB + 8, by = h.y / SUB + 16, dying = W.state === 'dying' || W.state === 'dead';
  ctx.save();
  if (h.inv > 0 && (h.inv >> 2) % 2) ctx.globalAlpha = 0.35;
  if (!dying) { ctx.strokeStyle = h.flame ? '#ff6a4a' : h.glow ? '#fff0a8' : '#ff8a3d'; ctx.lineWidth = 2.1; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); V.scarf.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke(); }
  ctx.translate(cx, by);
  if (dying) { ctx.translate(0, -9); ctx.rotate(Math.min(W.t, 30) * 0.12); ctx.translate(0, 9); }
  ctx.scale(h.sx * h.face, h.sy);
  if (h.ground && !dying && !h.wet) { ctx.fillStyle = 'rgba(8,4,20,.35)'; ctx.beginPath(); ctx.ellipse(0, 0, 6.5, 1.3, 0, 0, 7); ctx.fill(); }
  const cloakA = h.flame ? '#fff0d8' : h.glow ? '#ffd07a' : '#4fe0cf', cloakB = h.flame ? '#e0402a' : h.glow ? '#d86a1c' : '#0f6f6a';
  const moving = ((h.ground && h.vx !== 0) || W.state === 'walkout') && !dying;
  [-1, 1].forEach(i => {
    let lx = i * 2.4, ly = 0;
    if (moving) { const a = V.ph + (i > 0 ? Math.PI : 0); lx += Math.sin(a) * 2.6; ly = -Math.max(0, Math.cos(a)) * 1.6; }
    else if (h.wet && !h.ground) { const a = V.ph * 2 + (i > 0 ? Math.PI : 0); lx = i * 2 + Math.sin(a) * 1.5; ly = -1; }
    else if (!h.ground || dying) { lx = i > 0 ? 3 : -1.5; ly = i > 0 ? -2.5 : -0.5; }
    if (h.skid) { lx = i > 0 ? 3.5 : 0.5; }
    ctx.fillStyle = '#2a1a3a'; rr(ctx, lx - 2, ly - 3.4, 4, 3.4, 1.2); ctx.fill();
    ctx.fillStyle = h.glow ? '#fff0a8' : '#ff8a3d'; ctx.fillRect(lx - 2, ly - 3.4, 4, 0.9);
  });
  const cg = ctx.createLinearGradient(-6, -13, 5, -2); cg.addColorStop(0, cloakA); cg.addColorStop(1, cloakB);
  ctx.fillStyle = cg; ctx.beginPath(); ctx.moveTo(-3.8, -12.5); ctx.quadraticCurveTo(-7.4, -6, -6.6, -2.6);
  ctx.quadraticCurveTo(0, -1.2, 6.6, -2.6); ctx.quadraticCurveTo(7, -7, 3.8, -12.5); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(10,30,40,.35)'; ctx.lineWidth = 0.4; ctx.beginPath(); ctx.moveTo(-2, -10); ctx.quadraticCurveTo(-3.5, -6, -3, -2.5); ctx.stroke();
  const hg = ctx.createRadialGradient(-1.5, -18, 1, 0, -15, 7.5); hg.addColorStop(0, cloakA); hg.addColorStop(1, cloakB);
  ctx.fillStyle = hg;
  ctx.beginPath(); ctx.moveTo(-4.8, -18); ctx.lineTo(-6, -24.2); ctx.lineTo(-1.4, -20.4); ctx.closePath(); ctx.moveTo(2, -20.6); ctx.lineTo(5.2, -24.6); ctx.lineTo(5.4, -18.4); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ff9fb0'; ctx.beginPath(); ctx.moveTo(-4.5, -19.2); ctx.lineTo(-5.2, -22.8); ctx.lineTo(-2.6, -20.4); ctx.closePath(); ctx.moveTo(3, -20.4); ctx.lineTo(4.7, -23.2); ctx.lineTo(4.8, -19.4); ctx.closePath(); ctx.fill();
  ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(0, -15.4, 6.4, 0, 7); ctx.fill();
  ctx.fillStyle = '#ffd6b8'; ctx.beginPath(); ctx.ellipse(1.4, -14.6, 4.3, 3.9, 0, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(255,120,130,.45)'; ctx.beginPath(); ctx.ellipse(4.1, -13.2, 1.1, 0.7, 0, 0, 7); ctx.fill();
  const blink = V.blink < 0 || dying ? 0.25 : 1;
  ctx.fillStyle = '#1b1030';
  [[0.2, -15.2], [3.3, -15.2]].forEach(([ex, ey]) => { ctx.beginPath(); ctx.ellipse(ex, ey, 0.85, 1.35 * blink, 0, 0, 7); ctx.fill(); });
  if (blink === 1) { ctx.fillStyle = '#fff'; ctx.fillRect(0.3, -16.2, 0.5, 0.5); ctx.fillRect(3.4, -16.2, 0.5, 0.5); }
  if (!dying) {
    const thr = h.throwT > 0 ? h.throwT / 10 : 0, hx2 = 5.6 + thr * 2.4, hy2 = -8.6 - thr * 2.5;
    ctx.strokeStyle = cloakB; ctx.lineWidth = 1.6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(2.5, -9.5); ctx.lineTo(hx2, hy2); ctx.stroke();
    ctx.save(); ctx.translate(hx2 + 0.4, hy2 - 0.2); ctx.rotate(V.lanA - thr * 0.8);
    ctx.strokeStyle = '#2a1a3a'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 1.6); ctx.stroke();
    ctx.fillStyle = '#2a1a3a'; rr(ctx, -2, 1.5, 4, 5.2, 0.8); ctx.fill();
    const fl = 0.8 + Math.sin(f * 0.4) * 0.1 + Math.random() * 0.1;
    ctx.fillStyle = '#ffbf5a'; ctx.fillRect(-1.3, 2.3, 2.6, 3.6);
    ctx.fillStyle = '#fff3c4'; ctx.beginPath(); ctx.ellipse(0, 4.4, 0.7 * fl, 1.3 * fl, 0, 0, 7); ctx.fill();
    ctx.restore();
  }
  ctx.restore();
  if (!dying) {
    const lx = cx + h.face * h.sx * (6 + Math.sin(V.lanA) * 4), ly = by - 5;
    const fl = 1 + Math.sin(f * 0.3) * 0.05 + Math.random() * 0.04;
    R.lights.push([lx, ly, (h.glow ? 92 : 74) * fl * (R.theme.dark[0] > 0.4 ? 1.15 : 1), 1]); R.blooms.push([lx, ly, 16 * fl, 'rgba(255,190,100,0.35)']);
    if (h.glow) R.blooms.push([cx, by - 9, 20, h.flame ? 'rgba(255,100,60,0.24)' : 'rgba(255,160,70,0.2)']);
  }
}

// ---------- enemies ----------
export function drawEnemy(W, e) {
  switch (e.t) {
    case 'bug': return drawBug(W, e);
    case 'thorn': return drawThorn(e);
    case 'moth': return drawMoth(e);
    case 'hopper': return drawHopper(W, e);
    case 'snail': case 'shell': return drawSnail(W, e);
    case 'fish': return drawFish(e);
  }
}
function drawBug(W, e) {
  const { ctx } = R, x = e.x / SUB + 8, y = e.y / SUB + 16, t = R.frame;
  ctx.save(); ctx.translate(x, y);
  if (e.dead === 'flip') { ctx.translate(0, -6); ctx.scale(1, -1); ctx.translate(0, 6); }
  if (e.dead === 'flat') {
    ctx.fillStyle = 'rgba(8,4,20,.35)'; ctx.beginPath(); ctx.ellipse(0, 0, 8, 1.4, 0, 0, 7); ctx.fill();
    const g = ctx.createLinearGradient(0, -4, 0, 0); g.addColorStop(0, '#7fd06a'); g.addColorStop(1, '#2d6a34');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, -1.6, 8.2, 2.2, 0, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#d8b878'; ctx.fillRect(-7, -1.2, 14, 1.2);
    ctx.restore(); return;
  }
  ctx.fillStyle = 'rgba(8,4,20,.35)'; ctx.beginPath(); ctx.ellipse(0, 0, 7.5, 1.3, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = '#1e1428'; ctx.lineWidth = 1; ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) { const lx = -5 + i * 5, sw = Math.sin(t * 0.35 + i * 2) * 1.6; ctx.beginPath(); ctx.moveTo(lx, -3.5); ctx.lineTo(lx + sw, -0.3); ctx.stroke(); }
  ctx.fillStyle = '#d8b878'; ctx.beginPath(); ctx.ellipse(0, -3.6, 7.6, 2.2, 0, 0, 7); ctx.fill();
  const g = ctx.createRadialGradient(-2.5, -11, 1, 0, -6, 10); g.addColorStop(0, '#a6ec82'); g.addColorStop(0.55, '#4caf50'); g.addColorStop(1, '#1f5a2a');
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, -4.4, 7.8, 8, 0, Math.PI, 0); ctx.fill();
  ctx.fillStyle = 'rgba(30,80,40,.55)'; [[-3.5, -8, 1.6], [2.5, -10, 1.2], [4.5, -6, 1.1], [-0.5, -6, 0.9]].forEach(([a, b, r]) => { ctx.beginPath(); ctx.arc(a, b, r, 0, 7); ctx.fill(); });
  ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.arc(-1, -5.5, 5.5, Math.PI * 1.15, Math.PI * 1.45); ctx.stroke();
  const look = clamp((W.hero.x - e.x) / SUB / 30, -1, 1) * 0.5;
  [-2.8, 2.8].forEach(ex => { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ex, -3.9, 1.35, 0, 7); ctx.fill(); ctx.fillStyle = '#140c20'; ctx.beginPath(); ctx.arc(ex + look, -3.7, 0.7, 0, 7); ctx.fill(); });
  ctx.restore();
}
function drawThorn(e) {
  const { ctx } = R, x = e.x / SUB + 8, y = e.y / SUB + 16, rot = e.x / SUB * 0.12;
  ctx.save(); ctx.translate(x, y);
  if (e.dead === 'flip') { ctx.translate(0, -7); ctx.scale(1, -1); ctx.translate(0, 7); }
  ctx.fillStyle = 'rgba(8,4,20,.35)'; ctx.beginPath(); ctx.ellipse(0, 0, 6.5, 1.3, 0, 0, 7); ctx.fill();
  ctx.save(); ctx.translate(0, -7); ctx.rotate(rot);
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; ctx.fillStyle = '#ffe7a0'; ctx.beginPath(); ctx.moveTo(Math.cos(a - 0.22) * 5.5, Math.sin(a - 0.22) * 5.5); ctx.lineTo(Math.cos(a) * 9.2, Math.sin(a) * 9.2); ctx.lineTo(Math.cos(a + 0.22) * 5.5, Math.sin(a + 0.22) * 5.5); ctx.fill(); }
  ctx.restore();
  const g = ctx.createRadialGradient(-2, -9, 0.5, 0, -7, 7); g.addColorStop(0, '#ff8fb2'); g.addColorStop(0.6, '#d8386e'); g.addColorStop(1, '#6e1a3e');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, -7, 6.2, 0, 7); ctx.fill();
  const d = e.vx > 0 ? 1 : -1;
  [-2.2, 2.2].forEach(ex => { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ex + d, -7.2, 1.3, 0, 7); ctx.fill(); ctx.fillStyle = '#140c20'; ctx.beginPath(); ctx.arc(ex + d * 1.4, -7, 0.65, 0, 7); ctx.fill(); });
  ctx.strokeStyle = '#3a0c22'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(-3.6 + d, -9.4); ctx.lineTo(-1 + d, -8.5); ctx.moveTo(3.6 + d, -9.4); ctx.lineTo(1 + d, -8.5); ctx.stroke();
  ctx.restore();
}
function drawMoth(e) {
  // Duskmoth: a soft violet moth with glowing wing eyes.
  const { ctx } = R, x = e.x / SUB + 8, y = e.y / SUB + 8, f = R.frame, flap = Math.sin(f * 0.45 + e.t0);
  ctx.save(); ctx.translate(x, y);
  if (e.dead === 'flip') { ctx.scale(1, -1); }
  const d = e.vx > 0 ? -1 : 1;
  for (const s of [-1, 1]) {
    ctx.save(); ctx.scale(s, 1 * (0.55 + 0.45 * Math.abs(flap)));
    const g = ctx.createRadialGradient(4, -3, 0.5, 4, -2, 8); g.addColorStop(0, '#e8c8ff'); g.addColorStop(0.6, '#9a6ad8'); g.addColorStop(1, '#4a2a7a');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0.5, -1); ctx.quadraticCurveTo(6, -10, 9.5, -4); ctx.quadraticCurveTo(8, 1, 0.5, 1); ctx.fill();
    ctx.fillStyle = '#7a4ab8'; ctx.beginPath(); ctx.moveTo(0.5, 0.5); ctx.quadraticCurveTo(6, 1, 6, 5); ctx.quadraticCurveTo(2, 5, 0.5, 1.5); ctx.fill();
    ctx.fillStyle = '#ffe9a8'; ctx.beginPath(); ctx.arc(5.4, -3.6, 1.2, 0, 7); ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = '#2a1a3a'; ctx.beginPath(); ctx.ellipse(0, 0, 1.5, 4, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = '#2a1a3a'; ctx.lineWidth = 0.4; ctx.beginPath(); ctx.moveTo(-0.5, -3.5); ctx.quadraticCurveTo(-2 * d, -7, -3 * d, -7); ctx.moveTo(0.5, -3.5); ctx.quadraticCurveTo(1 * d, -7.5, 0, -8); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-0.6 * d, -3, 0.6, 0, 7); ctx.fill();
  ctx.restore();
  if (!e.dead) { R.lights.push([x, y, 18, 0.35]); R.blooms.push([x, y, 7, 'rgba(255,233,168,0.15)']); }
}
function drawHopper(W, e) {
  // Puddlehop: a round toad-ish blob with a leaf cap.
  const { ctx } = R, x = e.x / SUB + 8, y = e.y / SUB + 16;
  ctx.save(); ctx.translate(x, y);
  if (e.dead === 'flip') { ctx.translate(0, -6); ctx.scale(1, -1); ctx.translate(0, 6); }
  const air = !e.ground && !e.dead, sq = e.dead === 'flat' ? 0.35 : air ? 1.15 : 1;
  ctx.fillStyle = 'rgba(8,4,20,.35)'; ctx.beginPath(); ctx.ellipse(0, 0, 6.5, 1.3, 0, 0, 7); ctx.fill();
  ctx.scale(1 / Math.sqrt(sq), sq);
  const g = ctx.createRadialGradient(-2, -9, 1, 0, -5, 9); g.addColorStop(0, '#ffe08a'); g.addColorStop(0.6, '#e0903a'); g.addColorStop(1, '#8a4a1a');
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, -5.5, 7, 5.8, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#fff2c8'; ctx.beginPath(); ctx.ellipse(0, -3, 4.5, 2.6, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#3f9a52'; ctx.beginPath(); ctx.ellipse(-1, -11, 4, 1.6, -0.3, 0, 7); ctx.fill();
  const look = clamp((W.hero.x - e.x) / SUB / 30, -1, 1) * 0.6;
  [-2.6, 2.6].forEach(ex => { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ex, -8, 1.6, 0, 7); ctx.fill(); ctx.fillStyle = '#140c20'; ctx.beginPath(); ctx.arc(ex + look, -8, 0.8, 0, 7); ctx.fill(); });
  ctx.restore();
}
function drawSnail(W, e) {
  // Pebblesnail: stone shell, teal body. In its shell it can be kicked.
  const { ctx } = R, x = e.x / SUB + 8, y = e.y / SUB + 16, shell = e.t === 'shell';
  ctx.save(); ctx.translate(x, y);
  if (e.dead === 'flip') { ctx.translate(0, -6); ctx.scale(1, -1); ctx.translate(0, 6); }
  ctx.fillStyle = 'rgba(8,4,20,.35)'; ctx.beginPath(); ctx.ellipse(0, 0, 7, 1.3, 0, 0, 7); ctx.fill();
  const d = e.vx > 0 ? 1 : -1;
  if (!shell) {
    ctx.fillStyle = '#4fd8c8'; ctx.beginPath(); ctx.ellipse(d * 3, -2, 6, 2.2, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = '#4fd8c8'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(d * 7, -3); ctx.lineTo(d * 8.5, -7); ctx.moveTo(d * 6, -3); ctx.lineTo(d * 6.5, -7.5); ctx.stroke();
    ctx.fillStyle = '#140c20'; ctx.beginPath(); ctx.arc(d * 8.5, -7, 0.7, 0, 7); ctx.arc(d * 6.5, -7.5, 0.7, 0, 7); ctx.fill();
  }
  const spin = shell && e.vx !== 0 ? R.frame * 0.5 * d : 0;
  ctx.save(); ctx.translate(shell ? 0 : -d * 1.5, -6); ctx.rotate(spin);
  const g = ctx.createRadialGradient(-2, -2, 1, 0, 0, 7); g.addColorStop(0, '#d8d4f0'); g.addColorStop(0.6, '#8a86b0'); g.addColorStop(1, '#4a4670');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 6, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(40,36,70,.7)'; ctx.lineWidth = 0.7; ctx.beginPath();
  for (let a = 0; a < 9; a += 0.3) { const r = 5.2 - a * 0.55; a ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(r, 0); }
  ctx.stroke(); ctx.restore();
  if (shell && e.vx === 0 && e.rest > 300 && (R.frame >> 2) % 2) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-1.5, -6, 0.7, 0, 7); ctx.arc(1.5, -6, 0.7, 0, 7); ctx.fill(); }
  ctx.restore();
}
function drawFish(e) {
  // Glimmerfin: a lantern fish with a little lure.
  const { ctx } = R, x = e.x / SUB + 8, y = e.y / SUB + 8, d = e.vx > 0 ? 1 : -1, f = R.frame;
  ctx.save(); ctx.translate(x, y); ctx.scale(d, 1);
  if (e.dead === 'flip') ctx.scale(1, -1);
  const g = ctx.createLinearGradient(0, -5, 0, 5); g.addColorStop(0, '#6a8ad8'); g.addColorStop(1, '#2a3a7a');
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, 6.5, 4.5, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(-9, -3.5 + Math.sin(f * 0.3) * 1); ctx.lineTo(-9, 3.5 + Math.sin(f * 0.3) * 1); ctx.fill();
  ctx.fillStyle = '#e8f0ff'; ctx.beginPath(); ctx.moveTo(2, 1.5); ctx.lineTo(6, 1); ctx.lineTo(5, 3); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(3, -1.5, 1.3, 0, 7); ctx.fill(); ctx.fillStyle = '#140c20'; ctx.beginPath(); ctx.arc(3.4, -1.5, 0.6, 0, 7); ctx.fill();
  ctx.strokeStyle = '#2a3a7a'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(1, -4); ctx.quadraticCurveTo(4, -9, 7, -6); ctx.stroke();
  ctx.fillStyle = '#fff2a0'; ctx.beginPath(); ctx.arc(7, -6, 1.2, 0, 7); ctx.fill();
  ctx.restore();
  R.lights.push([x + 7 * d, y - 6, 22, 0.6]); R.blooms.push([x + 7 * d, y - 6, 6, 'rgba(255,240,160,0.3)']);
}

// ---------- items, platforms, springs, shots ----------
export function drawItem(it) {
  const { ctx } = R, x = it.x / SUB + 8, y = it.y / SUB + 9, f = R.frame;
  if (it.k === 'life') {
    ctx.save(); ctx.translate(x, y + 1); ctx.rotate(Math.sin(f * 0.1) * 0.15);
    ctx.fillStyle = '#e8dcff'; rr(ctx, -4, -5, 8, 10, 1.5); ctx.fill(); ctx.fillRect(-2, -7, 4, 2);
    ctx.fillStyle = '#ffb65c'; ctx.fillRect(-3, -3.5, 6, 7); ctx.fillStyle = '#fff4c8'; ctx.beginPath(); ctx.ellipse(0, 0.5, 1.1, 2, 0, 0, 7); ctx.fill();
    ctx.restore(); R.lights.push([x, y, 44, 0.8]); R.blooms.push([x, y, 12, 'rgba(255,200,120,0.3)']); return;
  }
  if (it.k === 'flame') {
    // Fire blossom: a stem and leaves under five flickering flame petals around a white-hot heart.
    ctx.fillStyle = '#3f8a4a'; ctx.fillRect(x - 0.6, y - 1, 1.2, 7);
    ctx.beginPath(); ctx.ellipse(x - 2.6, y + 3.5, 2.6, 1, -0.5, 0, 7); ctx.ellipse(x + 2.6, y + 3.5, 2.6, 1, 0.5, 0, 7); ctx.fill();
    for (let i = 0; i < 5; i++) {
      const a = i / 5 * Math.PI * 2 + f * 0.05, l = 4.2 + Math.sin(f * 0.4 + i * 1.7) * 0.8;
      ctx.fillStyle = i % 2 ? '#ff5a2a' : '#ff9a3a';
      ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * 2.6, y - 4 + Math.sin(a) * 2.6, l * 0.55, 1.6, a, 0, 7); ctx.fill();
    }
    ctx.fillStyle = '#fff4c8'; ctx.beginPath(); ctx.arc(x, y - 4, 1.8, 0, 7); ctx.fill();
    R.lights.push([x, y - 4, 50, 0.9]); R.blooms.push([x, y - 4, 14, 'rgba(255,110,60,0.35)']); return;
  }
  const s = 1 + Math.sin(f * 0.3) * 0.06;
  const g = ctx.createRadialGradient(x, y + 1, 0.5, x, y, 7); g.addColorStop(0, '#fffbe0'); g.addColorStop(0.35, '#ffd070'); g.addColorStop(0.7, '#ff7a3a'); g.addColorStop(1, 'rgba(255,90,40,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x, y - 8 * s + Math.sin(f * 0.25)); ctx.bezierCurveTo(x + 6 * s, y - 2, x + 5 * s, y + 5, x, y + 5); ctx.bezierCurveTo(x - 5 * s, y + 5, x - 6 * s, y - 2, x, y - 8 * s); ctx.fill();
  R.lights.push([x, y, 48, 0.9]); R.blooms.push([x, y, 14, 'rgba(255,170,80,0.35)']);
}
export function drawPlat(p) {
  if (p.gone) return;
  const { ctx } = R, style = R.theme.ledge;
  let x = p.x, y = p.y;
  if (p.k === 'fall' && p.t > 0 && p.t <= 22) x += Math.sin(p.t * 1.7) * 0.6;
  const w = p.w;
  if (style === 'cloud') {
    ctx.fillStyle = 'rgba(240,236,255,.96)'; ctx.beginPath();
    for (let i = 0; i <= w; i += 5) ctx.ellipse(x + i, y + 4 + Math.sin(i) * 0.8, 4.4, 4, 0, 0, 7);
    ctx.fill(); ctx.fillStyle = 'rgba(180,160,220,.7)'; ctx.fillRect(x, y + 7, w, 1.5);
  } else {
    const wood = style === 'branch', fall = p.k === 'fall';
    const g = ctx.createLinearGradient(0, y, 0, y + 7);
    g.addColorStop(0, fall ? '#d8a070' : wood ? '#a87a50' : '#b0acd0'); g.addColorStop(1, fall ? '#7a3a2a' : wood ? '#5a3a24' : '#5a5680');
    ctx.fillStyle = g; rr(ctx, x, y, w, 7, 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(x + 1.5, y + 0.8, w - 3, 0.6);
    ctx.fillStyle = 'rgba(20,10,30,.35)'; for (let i = 16; i < w; i += 16) ctx.fillRect(x + i - 0.3, y + 1, 0.6, 5.5);
    if (p.k === 'move') {
      // rope/chain anchors that hint at the path
      ctx.strokeStyle = 'rgba(40,30,50,.55)'; ctx.lineWidth = 0.6; ctx.beginPath();
      ctx.moveTo(x + 3, y); ctx.lineTo(x + 3, y - 6); ctx.moveTo(x + w - 3, y); ctx.lineTo(x + w - 3, y - 6); ctx.stroke();
      ctx.fillStyle = '#ffb65c'; ctx.beginPath(); ctx.arc(x + w / 2, y + 3.5, 1.2, 0, 7); ctx.fill();
      R.lights.push([x + w / 2, y + 3, 30, 0.6]);
    }
  }
}
export function drawSpring(s) {
  const { ctx } = R, x = s.x, y = s.y + 16, k = s.sq > 0 ? 0.45 + (12 - s.sq) / 12 * 0.55 : 1;
  const h = 10 * k;
  ctx.strokeStyle = '#c8c4e0'; ctx.lineWidth = 1.2; ctx.beginPath();
  for (let i = 0; i <= 6; i++) { const yy = y - 2 - i * (h - 3) / 6; ctx.lineTo(x + 8 + (i % 2 ? 4 : -4), yy); }
  ctx.stroke();
  ctx.fillStyle = '#3a2a4a'; rr(ctx, x + 2, y - 3, 12, 3, 1); ctx.fill();
  const g = ctx.createLinearGradient(0, y - h - 3, 0, y - h + 1); g.addColorStop(0, '#ff9a6a'); g.addColorStop(1, '#c04a4a');
  ctx.fillStyle = g; rr(ctx, x + 1, y - h - 3, 14, 4, 1.5); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(x + 2.5, y - h - 2.4, 11, 0.6);
}
export function drawShot(s) {
  const { ctx } = R, x = s.x / SUB, y = s.y / SUB, f = R.frame;
  if (s.k === 'meteor') {
    if (s.warn > 0) {
      // warning glint at the top of the screen
      const a = (s.warn >> 2) % 2 ? 0.9 : 0.4, wx = x - 8;
      ctx.fillStyle = `rgba(255,210,120,${a})`; ctx.beginPath(); ctx.moveTo(wx, 4); ctx.lineTo(wx + 4, 11); ctx.lineTo(wx - 4, 11); ctx.fill();
      return;
    }
    const tg = ctx.createLinearGradient(x, y, x + 20, y - 36); tg.addColorStop(0, 'rgba(255,220,140,.9)'); tg.addColorStop(1, 'rgba(255,120,80,0)');
    ctx.strokeStyle = tg; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 20, y - 36); ctx.stroke();
    ctx.fillStyle = '#fff4d0'; ctx.beginPath(); ctx.arc(x, y, 3.2, 0, 7); ctx.fill();
    R.lights.push([x, y, 50, 0.9]); R.blooms.push([x, y, 14, 'rgba(255,200,120,0.4)']);
  } else {
    ctx.save(); ctx.translate(x, y); ctx.rotate(f * 0.3);
    ctx.fillStyle = '#ff8fb2'; ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; ctx.lineTo(Math.cos(a) * (i % 2 ? 2 : 4), Math.sin(a) * (i % 2 ? 2 : 4)); } ctx.fill();
    ctx.restore(); R.lights.push([x, y, 16, 0.5]);
  }
}

// A thrown ember: a spinning white-hot core with four flame tongues and a short trail.
export function drawBolt(o) {
  const { ctx } = R, x = o.x / SUB + 4, y = o.y / SUB + 4, a = R.frame * 0.5 * Math.sign(o.vx);
  ctx.fillStyle = 'rgba(255,120,60,0.35)'; ctx.beginPath(); ctx.arc(x - o.vx / SUB * 1.2, y - o.vy / SUB * 1.2, 2.2, 0, 7); ctx.fill();
  ctx.save(); ctx.translate(x, y); ctx.rotate(a);
  ctx.fillStyle = '#ff6a2a'; ctx.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? 1.6 : 3.6, t = i / 8 * Math.PI * 2; ctx.lineTo(Math.cos(t) * r, Math.sin(t) * r); } ctx.fill();
  ctx.fillStyle = '#ffd070'; ctx.beginPath(); ctx.arc(0, 0, 1.8, 0, 7); ctx.fill();
  ctx.fillStyle = '#fffbe0'; ctx.fillRect(-0.7, -0.7, 1.4, 1.4);
  ctx.restore(); R.lights.push([x, y, 34, 0.8]); R.blooms.push([x, y, 9, 'rgba(255,140,70,0.35)']);
}

// ---------- bosses ----------
// Gloomlings: shadow creatures that hoard the dusk. Colors shift per world.
const BOSS_COL = [null,
  ['#6a4a9a', '#2a1a4a', '#ffcf6a'], ['#3a6a4a', '#122a1a', '#ff8fb2'], ['#3a5a8a', '#101a3a', '#6ff0e0'], ['#8a3a4a', '#2a0e1a', '#ffd27a'],
  ['#3a6a6a', '#0e2a2a', '#c8ff8a'], ['#5a6ab8', '#1a2050', '#ffffff'], ['#b890d8', '#4a2a70', '#ffe08a'], ['#8a6a3a', '#2a1e0e', '#ffb65c'],
  ['#9a3a1a', '#2a0a04', '#fff0a0'], ['#4a3a9a', '#120a3a', '#ffe9a8'], ['#1a1030', '#000000', '#ff6a6a']];
export function drawBoss(W) {
  const b = W.boss; if (!b) return;
  const { ctx } = R, f = R.frame, [c1, c2, eye] = BOSS_COL[b.kind] || BOSS_COL[1];
  const x = b.x / SUB + 16, y = b.y / SUB + 16, big = b.kind === 11 ? 1.2 : 1;
  ctx.save(); ctx.translate(x, y);
  if (b.dead) { ctx.translate(0, -15); ctx.rotate(b.t * 0.1); ctx.translate(0, 15); }
  if (b.inv > 0 && (b.inv >> 2) % 2) ctx.globalAlpha = 0.45;
  ctx.fillStyle = 'rgba(8,4,20,.4)'; ctx.beginPath(); ctx.ellipse(0, 0, 16, 2.5, 0, 0, 7); ctx.fill();
  ctx.scale(b.face * big, big);
  const air = !b.ground, sq = air ? 1.08 : 1 + Math.sin(f * 0.15) * 0.03;
  ctx.scale(1 / sq, sq);
  // wispy shadow skirt
  ctx.fillStyle = c2; ctx.beginPath(); ctx.moveTo(-15, -12);
  for (let i = 0; i <= 6; i++) ctx.lineTo(-15 + i * 5, -1 + Math.sin(f * 0.2 + i) * 1.5 + (i % 2) * 2);
  ctx.lineTo(15, -12); ctx.fill();
  const g = ctx.createRadialGradient(-5, -24, 2, 0, -14, 20); g.addColorStop(0, c1); g.addColorStop(1, c2);
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, -14, 15, 14, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(255,220,200,.22)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.ellipse(0, -14, 15, 14, 0, Math.PI * 1.05, Math.PI * 1.7); ctx.stroke();
  // horns
  ctx.fillStyle = c2; ctx.beginPath(); ctx.moveTo(-9, -24); ctx.quadraticCurveTo(-16, -34, -12, -38); ctx.quadraticCurveTo(-10, -30, -4, -27); ctx.moveTo(9, -24); ctx.quadraticCurveTo(16, -34, 12, -38); ctx.quadraticCurveTo(10, -30, 4, -27); ctx.fill();
  // eyes
  const angry = b.hp <= Math.ceil(b.max / 2);
  ctx.fillStyle = eye; [[-5, -16], [5, -16]].forEach(([ex, ey]) => { ctx.beginPath(); ctx.ellipse(ex + 2, ey, 3, angry ? 1.8 : 2.6, 0, 0, 7); ctx.fill(); });
  ctx.fillStyle = '#140c20'; [[-5, -16], [5, -16]].forEach(([ex, ey]) => { ctx.beginPath(); ctx.arc(ex + 3, ey, 1.1, 0, 7); ctx.fill(); });
  ctx.strokeStyle = c2; ctx.lineWidth = 1.5; if (angry) { ctx.beginPath(); ctx.moveTo(-9, -21); ctx.lineTo(-2, -18.5); ctx.moveTo(9, -21); ctx.lineTo(2, -18.5); ctx.stroke(); }
  ctx.fillStyle = eye; ctx.globalAlpha *= 0.8; ctx.beginPath(); ctx.moveTo(-4, -8); for (let i = 0; i <= 4; i++) ctx.lineTo(-4 + i * 2.5, -8 + (i % 2 ? 2 : 0)); ctx.lineTo(6, -7); ctx.lineTo(-4, -7); ctx.fill();
  ctx.restore();
  if (b.flash > 0) R.blooms.push([x, y - 16, 20, `rgba(255,140,70,${0.05 * b.flash})`]);
  R.blooms.push([x, y - 16, 22, 'rgba(120,60,180,0.12)']);
  R.lights.push([x + 3 * b.face, y - 16, 30, 0.4]);
}

// ---------- goal: lantern pole and hut ----------
export function drawPoleAndHut(W) {
  const { ctx } = R, f = R.frame, VW = R.VW;
  const x = W.pole * 16 + 8;
  if (x > W.camX - 60 && x < W.camX + VW + 60) {
    const g = ctx.createLinearGradient(x - 1.5, 0, x + 1.5, 0); g.addColorStop(0, '#1e1830'); g.addColorStop(0.4, '#77708e'); g.addColorStop(1, '#1e1830');
    ctx.fillStyle = g; ctx.fillRect(x - 1.5, 36, 3, 156);
    ctx.fillStyle = '#2a2240'; ctx.fillRect(x - 4, 188, 8, 4);
    ctx.strokeStyle = '#2a2240'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, 36); ctx.quadraticCurveTo(x + 8, 30, x + 10, 22); ctx.stroke();
    const lx = x + 10, ly = 22;
    ctx.fillStyle = '#1e1830'; ctx.beginPath(); ctx.moveTo(lx - 5, ly + 4); ctx.lineTo(lx + 5, ly + 4); ctx.lineTo(lx + 2.5, ly); ctx.lineTo(lx - 2.5, ly); ctx.closePath(); ctx.fill();
    rr(ctx, lx - 4.4, ly + 4, 8.8, 11, 1); ctx.fill();
    const fl = 1 + Math.sin(f * 0.25) * 0.08 + Math.random() * 0.05;
    ctx.fillStyle = W.lit ? '#ffc060' : '#3c3054'; ctx.fillRect(lx - 3.2, ly + 5.2, 6.4, 8.6);
    if (W.lit) { ctx.fillStyle = '#fff4c8'; ctx.beginPath(); ctx.ellipse(lx, ly + 9.6, 1.4 * fl, 2.6 * fl, 0, 0, 7); ctx.fill(); R.lights.push([lx, ly + 10, 150 * fl, 1]); R.blooms.push([lx, ly + 10, 30, 'rgba(255,190,100,0.4)']); }
    else { ctx.fillStyle = 'rgba(255,140,80,.5)'; ctx.beginPath(); ctx.arc(lx, ly + 12, 0.9, 0, 7); ctx.fill(); R.lights.push([lx, ly + 10, 16, 0.4]); }
    ctx.fillStyle = '#1e1830'; ctx.fillRect(lx - 0.4, ly + 4, 0.8, 11); ctx.fillRect(lx - 5, ly + 14.5, 10, 1.6);
  }
  drawHut(W);
}

export function drawForeground(camX, under) {
  const { ctx } = R, VW = R.VW;
  if (!R.theme.fern) return;
  const ua = under ? under[0] * 16 - camX : 1e9, uz = under ? (under[1] + 1) * 16 - camX : -1e9;
  ctx.fillStyle = R.theme.fern;
  const par = 1.3, sp = 150, off = camX * par;
  for (let k = Math.floor(off / sp) - 1; k < Math.ceil((off + VW) / sp) + 1; k++) {
    if (hsh(k * 2.7) < 0.45) continue;
    const X = k * sp + hsh(k) * 80 - off, Y = VH + 2, n = 5 + Math.floor(hsh(k * 9) * 4), sw = Math.sin(R.frame * 0.02 + k) * 1.5;
    if (X > ua - 20 && X < uz + 20) continue;
    ctx.beginPath();
    for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (i - (n - 1) / 2) * 0.32, len = 22 + hsh(k + i) * 16;
      const tx = X + Math.cos(a) * len + sw, ty = Y + Math.sin(a) * len;
      ctx.moveTo(X - 1.5, Y); ctx.quadraticCurveTo(X + Math.cos(a) * len * 0.5 - 3, Y + Math.sin(a) * len * 0.6, tx, ty); ctx.quadraticCurveTo(X + Math.cos(a) * len * 0.5 + 3, Y + Math.sin(a) * len * 0.6, X + 1.5, Y); }
    ctx.fill();
  }
}

export function drawLighting(camX, dark, under) {
  const { lctx, LC, ctx, cv, S, VW } = R;
  lctx.setTransform(1, 0, 0, 1, 0, 0); lctx.globalCompositeOperation = 'source-over'; lctx.clearRect(0, 0, LC.width, LC.height);
  lctx.fillStyle = `rgba(10,6,34,${dark})`; lctx.fillRect(0, 0, LC.width, LC.height);
  if (under) {
    // underground is darker; fade the edge over a tile so the tunnel mouth is soft
    const k = S * LC.width / cv.width, a = Math.max(0, under[0] * 16 - camX) * k, z = Math.min(VW, (under[1] + 1) * 16 - camX) * k;
    if (z > a) {
      const extra = Math.max(0, 0.62 - dark), g = lctx.createLinearGradient(a - 16 * k, 0, z + 16 * k, 0);
      const e = Math.min(0.5, 16 * k / Math.max(1, z - a + 32 * k));
      g.addColorStop(0, 'rgba(4,4,16,0)'); g.addColorStop(e, `rgba(4,4,16,${extra})`); g.addColorStop(1 - e, `rgba(4,4,16,${extra})`); g.addColorStop(1, 'rgba(4,4,16,0)');
      lctx.fillStyle = g; lctx.fillRect(a - 16 * k, 0, z - a + 32 * k, LC.height);
    }
  }
  lctx.drawImage(R.VIG, 0, 0);
  lctx.globalCompositeOperation = 'destination-out';
  const k = S * LC.width / cv.width; lctx.setTransform(k, 0, 0, k, -camX * k, 0);
  for (const [x, y, r, a] of R.lights) {
    if (x + r < camX || x - r > camX + VW || a <= 0.01) continue;
    lctx.globalAlpha = Math.min(1, a); lctx.drawImage(R.LIGHT, x - r, y - r, r * 2, r * 2);
  }
  lctx.globalAlpha = 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(LC, 0, 0, cv.width, cv.height);
}

// ---------- checkpoints: little lantern posts that light up when Dusky passes ----------
export function drawCheckpoints(W) {
  const { ctx } = R, f = R.frame;
  W.cps.forEach((c, i) => {
    const x = c * 16 + 8; if (x < W.camX - 30 || x > W.camX + R.VW + 30) return;
    let r = 0; while (r < 15 && !(SOLID.has(W.g[r][c]) || W.g[r][c] === '-')) r++;
    const y = r * 16, lit = i <= W.cp;
    ctx.fillStyle = 'rgba(8,4,20,.35)'; ctx.beginPath(); ctx.ellipse(x, y, 6, 1.3, 0, 0, 7); ctx.fill();
    const g = ctx.createLinearGradient(x - 1.2, 0, x + 1.2, 0); g.addColorStop(0, '#2a1a14'); g.addColorStop(0.5, '#8a6a4a'); g.addColorStop(1, '#2a1a14');
    ctx.fillStyle = g; ctx.fillRect(x - 1.2, y - 40, 2.4, 40);
    ctx.fillStyle = '#2a1a14'; ctx.fillRect(x - 5, y - 41, 10, 1.6);
    const sw = Math.sin(f * 0.04 + i) * 0.12;
    ctx.save(); ctx.translate(x + 3.5, y - 40); ctx.rotate(sw);
    ctx.strokeStyle = '#2a1a14'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 2); ctx.stroke();
    ctx.fillStyle = '#1e1830'; rr(ctx, -2.6, 2, 5.2, 7, 1); ctx.fill();
    ctx.fillStyle = lit ? '#ffc060' : '#3c3054'; ctx.fillRect(-1.8, 3, 3.6, 5);
    if (lit) { ctx.fillStyle = '#fff4c8'; ctx.beginPath(); ctx.ellipse(0, 5.6, 0.8, 1.5, 0, 0, 7); ctx.fill(); }
    ctx.restore();
    if (lit) { R.lights.push([x + 3.5, y - 34, 70, 0.9]); R.blooms.push([x + 3.5, y - 34, 14, 'rgba(255,190,100,0.35)']); }
    else R.lights.push([x + 3.5, y - 34, 10, 0.3]);
  });
}

// ---------- fire: wheels and jets ----------
export function drawFire(W) {
  const { ctx } = R, f = R.frame;
  for (const fb of W.fire) {
    if (fb.c * 16 < W.camX - 100 || fb.c * 16 > W.camX + R.VW + 100) continue;
    if (fb.t === 'firebar') {
      const balls = fireballs(W, fb);
      ctx.fillStyle = 'rgba(40,16,8,0.9)'; ctx.beginPath(); ctx.arc(fb.c * 16 + 8, fb.r * 16 + 8, 3.2, 0, 7); ctx.fill();
      balls.forEach(([x, y], i) => {
        const r = 4.6 + Math.sin(f * 0.4 + i) * 0.5;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, '#fffbe0'); g.addColorStop(0.35, '#ffd070'); g.addColorStop(0.75, '#ff6a2a'); g.addColorStop(1, 'rgba(255,80,30,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
        if (i % 2 === 0) R.lights.push([x, y, 26, 0.7]);
        if (i === balls.length - 1 || i % 3 === 0) R.blooms.push([x, y, 9, 'rgba(255,140,60,0.35)']);
      });
    } else {
      const x = fb.c * 16, y1 = (fb.r + 1) * 16, ph = jetPhase(W, fb), h = (fb.h || 3) * 16;
      // nozzle grate set into the floor
      ctx.fillStyle = '#2a2230'; ctx.fillRect(x + 2, y1 - 2, 12, 3);
      ctx.fillStyle = '#6a5a6a'; for (let i = 0; i < 4; i++) ctx.fillRect(x + 3 + i * 3, y1 - 2, 1.4, 2);
      if (ph === 'warn') {
        const a = 0.4 + 0.4 * Math.sin(f * 0.8);
        ctx.fillStyle = `rgba(255,150,60,${a})`; ctx.beginPath(); ctx.ellipse(x + 8, y1 - 3, 3, 2 + Math.random() * 2, 0, 0, 7); ctx.fill();
        R.lights.push([x + 8, y1 - 4, 18, 0.5]);
      } else if (ph === 'on') {
        const top = y1 - h;
        for (let k = 0; k < 3; k++) {
          const w = [6, 4.2, 2.4][k], col = [['#ff5a1a', 'rgba(255,90,30,0)'], ['#ffb040', 'rgba(255,170,60,0)'], ['#fff4c8', 'rgba(255,240,200,0)']][k];
          const g = ctx.createLinearGradient(0, y1, 0, top); g.addColorStop(0, col[0]); g.addColorStop(0.8, col[0]); g.addColorStop(1, col[1]);
          ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x + 8 - w, y1);
          for (let yy = y1; yy > top; yy -= 6) ctx.lineTo(x + 8 - w * (0.7 + 0.3 * Math.sin(f * 0.6 + yy * 0.3 + k)), yy);
          ctx.lineTo(x + 8, top - 4 - Math.random() * 4);
          for (let yy = top; yy < y1; yy += 6) ctx.lineTo(x + 8 + w * (0.7 + 0.3 * Math.sin(f * 0.5 + yy * 0.25 + k)), yy);
          ctx.lineTo(x + 8 + w, y1); ctx.fill();
        }
        for (let yy = y1 - 8; yy > top; yy -= 16) R.lights.push([x + 8, yy, 40, 0.8]);
        R.blooms.push([x + 8, y1 - h / 2, 18, 'rgba(255,130,50,0.3)']);
      }
    }
  }
}

// ---------- doors between zones ----------
export function drawDoors(W) {
  const { ctx } = R, f = R.frame;
  for (const d of W.doors) {
    const x = d.c * 16 + 8, y = (d.r + 1) * 16;
    if (x < W.camX - 60 || x > W.camX + R.VW + 60) continue;
    if (d.kind === 'down') {
      // a little stone cellar hut with the door ajar
      ctx.fillStyle = 'rgba(8,4,20,.35)'; ctx.beginPath(); ctx.ellipse(x, y, 26, 2.5, 0, 0, 7); ctx.fill();
      const g = ctx.createLinearGradient(0, y - 44, 0, y); g.addColorStop(0, '#8a86a8'); g.addColorStop(1, '#4a4668');
      ctx.fillStyle = g; rr(ctx, x - 22, y - 36, 44, 36, 3); ctx.fill();
      ctx.strokeStyle = 'rgba(30,24,50,.5)'; ctx.lineWidth = 0.5;
      for (let r = 0; r < 5; r++) for (let k = 0; k < 4; k++) { const bx = x - 22 + k * 11 + (r % 2) * 5.5, by = y - 36 + r * 7.2; ctx.strokeRect(bx, by, 11, 7.2); }
      ctx.fillStyle = '#6a3a3a'; ctx.beginPath(); ctx.moveTo(x - 27, y - 34); ctx.lineTo(x, y - 50); ctx.lineTo(x + 27, y - 34); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#0a0612'; rr(ctx, x - 8, y - 26, 16, 26, 8); ctx.fill();
      ctx.fillStyle = '#6a4a30'; ctx.beginPath(); ctx.moveTo(x - 8, y - 18); ctx.lineTo(x - 13, y - 22); ctx.lineTo(x - 13, y + 1); ctx.lineTo(x - 8, y); ctx.fill();
      // stairs going down inside the doorway
      ctx.fillStyle = '#2a2238'; for (let i = 0; i < 3; i++) ctx.fillRect(x - 6 + i * 2, y - 6 + i * 2, 12 - i * 4, 1.4);
      const bob = Math.sin(f * 0.1) * 2;
      ctx.fillStyle = '#ffd68a'; ctx.beginPath(); ctx.moveTo(x - 4, y - 60 + bob); ctx.lineTo(x + 4, y - 60 + bob); ctx.lineTo(x, y - 54 + bob); ctx.fill();
      ctx.fillStyle = '#ffb65c'; ctx.fillRect(x + 12, y - 30, 4, 5); R.lights.push([x + 14, y - 27, 50, 0.8]); R.blooms.push([x + 14, y - 27, 10, 'rgba(255,190,100,0.35)']);
    } else {
      // a lit doorway with a ladder up to the surface
      const g = ctx.createLinearGradient(0, 32, 0, y); g.addColorStop(0, 'rgba(255,220,160,0.55)'); g.addColorStop(1, 'rgba(255,200,140,0.1)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 10, 32); ctx.lineTo(x + 10, 32); ctx.lineTo(x + 18, y); ctx.lineTo(x - 18, y); ctx.fill();
      ctx.strokeStyle = '#8a6a4a'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x - 6, 32); ctx.lineTo(x - 6, y); ctx.moveTo(x + 6, 32); ctx.lineTo(x + 6, y);
      for (let yy = 40; yy < y; yy += 10) { ctx.moveTo(x - 6, yy); ctx.lineTo(x + 6, yy); } ctx.stroke();
      const bob = Math.sin(f * 0.1) * 2;
      ctx.fillStyle = '#ffd68a'; ctx.beginPath(); ctx.moveTo(x - 4, y - 44 + bob); ctx.lineTo(x + 4, y - 44 + bob); ctx.lineTo(x, y - 50 + bob); ctx.fill();
      for (let yy = 40; yy < y; yy += 28) R.lights.push([x, yy, 46, 0.8]);
      R.blooms.push([x, 40, 24, 'rgba(255,220,160,0.25)']);
    }
  }
}
