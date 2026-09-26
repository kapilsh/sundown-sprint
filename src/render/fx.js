// =============== Effects: particles, pops, tile bumps, ambient life ===============
// Driven by sim events, so the sim stays deterministic and free of Math.random.
import { R, VH } from './ctx.js';
import { SUB } from '../physics.js';
import { clamp } from '../util.js';
import { hutStyle, CHIMNEY } from './huts.js';

export const FX = { parts: [], pops: [], bumps: [], amb: [] };
export function resetFx() { FX.parts = []; FX.pops = []; FX.bumps = []; FX.amb = []; }

export function dust(x, y, n, dir = 0, spd = 0.6) { for (let i = 0; i < n; i++) FX.parts.push({ k: 'dust', x: x + (Math.random() - 0.5) * 6, y, vx: (Math.random() - 0.5) * spd + dir * 0.4, vy: -Math.random() * 0.5, r: 1.2 + Math.random() * 1.8, life: 0, max: 26 + Math.random() * 14 }); }
export function sparks(x, y, n, col = '#ffd27a', spd = 1.6) { for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, s = Math.random() * spd; FX.parts.push({ k: 'spark', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 0.6, life: 0, max: 22 + Math.random() * 18, col }); } }

// Returns sfx names so main can play them.
export function consumeEvents(W, onSfx, onMusic) {
  for (const e of W.ev) {
    switch (e.k) {
      case 'sfx': onSfx(e.n); break;
      case 'music': onMusic(e); break;
      case 'dust': dust(e.x, e.y, e.n, e.dir || 0, e.spd ?? 0.6); break;
      case 'sparks': sparks(e.x + (e.post ? 3.5 : 0), e.post ? postY(W, e.x) : e.y, e.n, e.col, e.spd ?? 1.6); break;
      case 'glowspark': sparks(e.x + (Math.random() - 0.5) * 8, e.y, 1, '#ffb65c', 0.5); break;
      case 'pop': FX.pops.push({ x: e.x, y: e.y, s: e.s, t: 0 }); break;
      case 'gempop': FX.parts.push({ k: 'gem', x: e.x, y: e.y, vy: -5, t: 0 }); break;
      case 'bump': FX.bumps.push({ c: e.c, r: e.r, t: 0 }); break;
      case 'debris':
        for (let i = 0; i < 8; i++) FX.parts.push({ k: 'deb', x: e.c * 16 + 4 + (i % 4) * 3, y: e.r * 16 + 4 + (i >> 2) * 6, vx: (i % 4 - 1.5) * 0.9, vy: -4 - Math.random() * 2, rot: 0, vr: (Math.random() - 0.5) * 0.4, s: 2 + Math.random() * 2.5, life: 0, col: e.gate ? '#6a6284' : null });
        break;
      case 'splash':
        for (let i = 0; i < 10; i++) FX.parts.push({ k: 'drop', x: e.x + (Math.random() - 0.5) * 10, y: e.y, vx: (Math.random() - 0.5) * 1.6, vy: -1.5 - Math.random() * 2, life: 0 });
        break;
      case 'bubbles': for (let i = 0; i < e.n; i++) FX.parts.push({ k: 'bub', x: e.x + (Math.random() - 0.5) * 6, y: e.y, vx: 0, vy: -0.4 - Math.random() * 0.4, life: 0, max: 60 + Math.random() * 40 }); break;
    }
  }
  W.ev.length = 0;
}

// sparks at a checkpoint lantern: find the ground under that column
function postY(W, x) { const c = Math.floor(x / 16); let r = 0; while (r < 15 && !'GBMCEUSLRlrNI<>X-'.includes(W.g[r][c])) r++; return r * 16 - 34; }
export function updateFx(W) {
  for (const p of FX.parts) {
    p.life = (p.life || 0) + 1;
    if (p.k === 'gem') { p.y += p.vy; p.vy += 0.4; if (p.life > 22) p.gone = true; }
    else if (p.k === 'dust') { p.x += p.vx; p.y += p.vy; p.vx *= 0.94; p.vy -= 0.01; p.r += 0.05; if (p.life > p.max) p.gone = true; }
    else if (p.k === 'spark') { p.x += p.vx; p.y += p.vy; p.vx *= 0.95; p.vy = p.vy * 0.95 - 0.02; if (p.life > p.max) p.gone = true; }
    else if (p.k === 'smoke') { p.x += p.vx + 0.15; p.y += p.vy; p.r += 0.06; if (p.life > 140) p.gone = true; }
    else if (p.k === 'drop') { p.x += p.vx; p.y += p.vy; p.vy += 0.2; if (p.life > 40) p.gone = true; }
    else if (p.k === 'bub') { p.x += Math.sin(p.life * 0.2) * 0.2; p.y += p.vy; if (p.life > p.max || W.g[Math.floor(p.y / 16)]?.[Math.floor(p.x / 16)] !== '~') p.gone = true; }
    else { p.x += p.vx; p.y += p.vy; p.vy += 0.3; p.rot += p.vr; if (p.y > VH + 20) p.gone = true; }
  }
  FX.parts = FX.parts.filter(p => !p.gone);
  for (const p of FX.pops) { p.t++; p.y -= 0.5; } FX.pops = FX.pops.filter(p => p.t < 50);
  for (const b of FX.bumps) b.t++; FX.bumps = FX.bumps.filter(b => b.t < 10);
  updateAmbient(W);
  const hx = W.hut * 16, ch = CHIMNEY[hutStyle(W)];
  if (ch && hx > W.camX - 100 && hx < W.camX + R.VW + 50 && R.frame % 14 === 0) FX.parts.push({ k: 'smoke', x: hx + ch[0], y: ch[1], vx: (Math.random() - 0.5) * 0.1, vy: -0.25, r: 2, life: 0 });
}

// Ambient particles per theme: fireflies, spores, snow, embers, wind streaks, dust motes.
function updateAmbient(W) {
  const kind = R.theme.ambient, A = FX.amb, cam = W.camX, VW = R.VW;
  const want = { flies: 26, spores: 30, snow: 70, embers: 40, wind: 18, motes: 24, stars: 20 }[kind] || 0;
  while (A.length < want) A.push(newAmb(kind, cam + Math.random() * VW, Math.random() * VH));
  for (const f of A) {
    f.ph += 0.02 * f.sp;
    if (kind === 'flies' || kind === 'motes' || kind === 'stars') { f.x += Math.cos(f.ph * 1.3) * 0.25; f.y += Math.sin(f.ph * 2.1) * 0.18; }
    else if (kind === 'spores') { f.x += Math.cos(f.ph) * 0.15; f.y -= 0.12 * f.sp; if (f.y < -4) f.y = VH + 4; }
    else if (kind === 'snow') { f.x += Math.sin(f.ph * 2) * 0.3 - 0.2 + (W.windOn ? W.wind.dir * 1.2 : 0); f.y += 0.35 * f.sp + 0.1; if (f.y > VH + 4) f.y = -4; }
    else if (kind === 'embers') { f.x += Math.sin(f.ph * 3) * 0.2; f.y -= 0.35 * f.sp; if (f.y < -4) { f.y = VH + 4; } }
    else if (kind === 'wind') { f.x += (W.windOn ? W.wind.dir * 5 : -1.2) * f.sp; f.y += Math.sin(f.ph * 2) * 0.1; }
    if (f.x < cam - 30 || f.x > cam + VW + 30) f.x = f.x < cam - 30 ? cam + VW + 20 : cam - 20;
  }
}
function newAmb(kind, x, y) {
  if (kind === 'flies') y = 110 + Math.random() * 95;
  return { x, y, ph: Math.random() * 7, sp: 0.4 + Math.random() * 0.6 };
}

export function drawAmbient(prog) {
  const { ctx } = R, kind = R.theme.ambient;
  for (const f of FX.amb) {
    if (kind === 'flies' || kind === 'stars') {
      const a = (Math.sin(f.ph * 3) + 1) / 2 * clamp(prog * 1.5 + 0.25, 0, 1);
      if (a < 0.05) continue;
      const c = kind === 'stars' ? '255,240,200' : '230,255,150';
      ctx.fillStyle = `rgba(${c},${a})`; ctx.beginPath(); ctx.arc(f.x, f.y, 0.8, 0, 7); ctx.fill();
      R.blooms.push([f.x, f.y, 5, `rgba(${kind === 'stars' ? '255,220,160' : '200,255,120'},${0.25 * a})`]); R.lights.push([f.x, f.y, 12, 0.35 * a]);
    } else if (kind === 'spores') {
      const a = 0.4 + 0.4 * Math.sin(f.ph * 4);
      ctx.fillStyle = `rgba(120,255,230,${a})`; ctx.fillRect(f.x, f.y, 0.9, 0.9); R.lights.push([f.x, f.y, 8, 0.25 * a]);
    } else if (kind === 'snow') { ctx.fillStyle = 'rgba(240,244,255,.8)'; ctx.beginPath(); ctx.arc(f.x, f.y, 0.5 + f.sp * 0.6, 0, 7); ctx.fill(); }
    else if (kind === 'embers') { const a = 0.5 + 0.5 * Math.sin(f.ph * 5); ctx.fillStyle = `rgba(255,${140 + a * 80 | 0},60,${a})`; ctx.fillRect(f.x, f.y, 0.9, 0.9); R.lights.push([f.x, f.y, 7, 0.3 * a]); }
    else if (kind === 'wind') { ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(f.x + 14 * f.sp, f.y); ctx.stroke(); }
    else if (kind === 'motes') { ctx.fillStyle = 'rgba(255,230,190,.35)'; ctx.fillRect(f.x, f.y, 0.7, 0.7); }
  }
}

export function drawParts(additive) {
  const { ctx } = R;
  for (const p of FX.parts) {
    if (additive !== (p.k === 'spark')) continue;
    if (p.k === 'gem') R.drawGem(p.x, p.y, false);
    else if (p.k === 'dust') { const a = 1 - p.life / p.max; ctx.fillStyle = `rgba(200,180,220,${0.45 * a})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); }
    else if (p.k === 'smoke') { const a = Math.max(0, 0.22 - p.life / 700); ctx.fillStyle = `rgba(190,180,210,${a})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); }
    else if (p.k === 'spark') { const a = 1 - p.life / p.max; ctx.fillStyle = p.col; ctx.globalAlpha = a; ctx.beginPath(); ctx.arc(p.x, p.y, 0.8 + a * 0.6, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
    else if (p.k === 'drop') { ctx.fillStyle = 'rgba(170,220,255,.8)'; ctx.fillRect(p.x, p.y, 1, 1.4); }
    else if (p.k === 'bub') { ctx.strokeStyle = 'rgba(200,240,255,.7)'; ctx.lineWidth = 0.4; ctx.beginPath(); ctx.arc(p.x, p.y, 1.1, 0, 7); ctx.stroke(); }
    else if (p.k === 'deb') { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.col || R.theme.brick.deb; ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s); ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(-p.s / 2, -p.s / 2, p.s, 0.5); ctx.restore(); }
  }
}
export function drawPops() {
  const { ctx } = R;
  for (const p of FX.pops) { ctx.font = `800 7px ${R.font}`; ctx.textAlign = 'center'; ctx.fillStyle = `rgba(255,255,255,${1 - p.t / 50})`; ctx.fillText(p.s, p.x, p.y); ctx.textAlign = 'left'; }
}
export { SUB };
