// =============== Render: background (sky, sun, clouds, parallax layers) ===============
import { R, VH } from './ctx.js';
import { hsh, fbm, mix, clamp } from '../util.js';

const STARS = Array.from({ length: 220 }, (_, i) => [hsh(i * 3.1) * 900, hsh(i * 7.7) * 150, hsh(i * 1.3), hsh(i * 5.5)]);
const CLOUDS = Array.from({ length: 8 }, (_, i) => ({ x: i * 150 + hsh(i) * 90, y: 28 + hsh(i * 2.2) * 70, s: 0.7 + hsh(i * 4.1) * 0.8 }));
const LAYERS = [
  { par: 0.05, base: 150, amp: 58, f: 1 / 120, seed: 1, depth: 0.82 },
  { par: 0.12, base: 166, amp: 44, f: 1 / 85, seed: 2, depth: 0.62 },
  { par: 0.24, base: 184, amp: 30, f: 1 / 62, seed: 3, depth: 0.42 },
  { par: 0.4, base: 200, amp: 22, f: 1 / 46, seed: 4, depth: 0.2 }];

function ridgeFn(kind, Ly, off) {
  switch (kind) {
    case 'soft': return x => Ly.base + 6 - fbm((x + off) * Ly.f * 0.8, Ly.seed) * Ly.amp * 0.8;
    case 'flat': return x => Ly.base + 18 - fbm((x + off) * Ly.f, Ly.seed) * Ly.amp * 0.35;
    case 'peaks': return x => { const u = (x + off) * Ly.f * 1.3; return Ly.base + 4 - (Math.abs(fbm(u, Ly.seed) - 0.5) * -2 + 1) * Ly.amp * 1.1; };
    case 'city': return x => { const k = Math.floor((x + off) / 22); return Ly.base + 10 - (0.35 + hsh(k * 3.3 + Ly.seed) * 0.8) * Ly.amp; };
    case 'mesas': return x => { const v = fbm((x + off) * Ly.f, Ly.seed); return Ly.base + 6 - Math.round(v * 3) / 3 * Ly.amp * 1.1; };
    case 'clouds': return x => Ly.base - 10 - fbm((x + off) * Ly.f * 1.4, Ly.seed) * Ly.amp * 0.9 - Math.abs(Math.sin((x + off) * 0.05 + Ly.seed)) * 6;
    case 'cave': return x => Ly.base + 8 - fbm((x + off) * Ly.f * 1.5, Ly.seed) * Ly.amp;
    default: return x => Ly.base - fbm((x + off) * Ly.f, Ly.seed) * Ly.amp;
  }
}

export function drawSky(p, camX) {
  const { ctx, S, VW } = R, th = R.theme, f = R.frame;
  ctx.setTransform(S, 0, 0, S, 0, 0);
  const g = ctx.createLinearGradient(0, 0, 0, VH);
  [0, 0.42, 0.7, 1].forEach((s, i) => g.addColorStop(s, mix(th.sky[i][0], th.sky[i][1], p)));
  ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
  const sx = camX * 0.02;
  // stars
  if (th.stars) {
    const n = th.stars > 1 ? STARS.length : 140;
    for (let i = 0; i < n; i++) {
      const [x, y, b, tw] = STARS[i];
      const X = ((x - sx) % 900 + 900) % 900; if (X > VW) continue;
      const a = clamp(p * 1.3 - (y / 140) * 0.5 + 0.15 + (th.stars > 1 ? 0.3 : 0), 0, 1) * (0.5 + 0.5 * Math.sin(f * 0.03 + tw * 20)) * (0.4 + b * 0.6);
      if (a <= 0.02) continue; ctx.fillStyle = `rgba(235,230,255,${a})`; ctx.fillRect(X, y, b > 0.85 ? 1.1 : 0.6, b > 0.85 ? 1.1 : 0.6);
    }
    if (th.stars > 1 || p > 0.6) {
      // occasional shooting star
      const k = Math.floor(f / 240), t = (f % 240) / 40;
      if (t < 1 && hsh(k * 1.7) > (th.stars > 1 ? 0.2 : 0.6)) {
        const x0 = hsh(k * 2.3) * VW, y0 = 10 + hsh(k * 4.1) * 50, x = x0 - t * 90, y = y0 + t * 40;
        const lg = ctx.createLinearGradient(x, y, x + 24, y - 10); lg.addColorStop(0, `rgba(255,250,230,${0.9 * (1 - t)})`); lg.addColorStop(1, 'rgba(255,250,230,0)');
        ctx.strokeStyle = lg; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 24, y - 10); ctx.stroke();
      }
    }
  }
  if (th.sun) {
    const sunX = VW * 0.7 - camX * 0.03, sunY = 124 + p * 80;
    const sg = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 140);
    sg.addColorStop(0, `rgba(255,214,150,${0.75 * (1 - p * 0.8)})`); sg.addColorStop(0.2, `rgba(255,150,110,${0.35 * (1 - p * 0.8)})`); sg.addColorStop(1, 'rgba(255,120,110,0)');
    ctx.fillStyle = sg; ctx.fillRect(0, 0, VW, VH);
    ctx.fillStyle = mix('#fff2cf', '#ff8a7a', p); ctx.beginPath(); ctx.arc(sunX, sunY, 15, 0, 7); ctx.fill();
    if (p < 0.8) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 6; i++) {
        const a = -Math.PI / 2 - 1.1 + i * 0.42 + Math.sin(f * 0.004 + i) * 0.05, w = 0.06 + hsh(i) * 0.06;
        ctx.fillStyle = `rgba(255,190,140,${0.035 * (1 - p)})`; ctx.beginPath(); ctx.moveTo(sunX, sunY);
        ctx.lineTo(sunX + Math.cos(a - w) * 400, sunY + Math.sin(a - w) * 400); ctx.lineTo(sunX + Math.cos(a + w) * 400, sunY + Math.sin(a + w) * 400); ctx.fill();
      }
      ctx.restore();
    }
    if (p > 0.45) {
      // the moon comes up as the sun goes down
      const m = clamp((p - 0.45) / 0.4, 0, 1), mx = VW * 0.18 - camX * 0.015, my = 90 - m * 50;
      const mg = ctx.createRadialGradient(mx, my, 0, mx, my, 50); mg.addColorStop(0, `rgba(200,210,255,${0.25 * m})`); mg.addColorStop(1, 'rgba(200,210,255,0)');
      ctx.fillStyle = mg; ctx.fillRect(mx - 50, my - 50, 100, 100);
      ctx.fillStyle = `rgba(240,236,255,${0.9 * m})`; ctx.beginPath(); ctx.arc(mx, my, 9, 0, 7); ctx.fill();
      ctx.fillStyle = mix(th.sky[0][0], th.sky[0][1], p, m); ctx.beginPath(); ctx.arc(mx + 4, my - 2, 8, 0, 7); ctx.fill();
    }
  }
  if (th.clouds) {
    for (const c of CLOUDS) {
      const x = ((c.x - camX * 0.1 + f * 0.03) % 1200 + 1200) % 1200 - 150; if (x > VW + 60) continue;
      const top = mix(th.clouds[0][0], th.clouds[0][1], p, 0.55), bot = mix(th.clouds[1][0], th.clouds[1][1], p, 0.6);
      const cg = ctx.createLinearGradient(0, c.y - 10 * c.s, 0, c.y + 8 * c.s); cg.addColorStop(0, top); cg.addColorStop(1, bot);
      ctx.fillStyle = cg; ctx.beginPath();
      [[0, 0, 26, 7], [-18, 3, 16, 5], [20, 2, 18, 6], [6, -5, 14, 7], [-6, -3, 12, 6]].forEach(([dx, dy, rx, ry]) => { ctx.moveTo(x + dx * c.s + rx * c.s, c.y + dy * c.s); ctx.ellipse(x + dx * c.s, c.y + dy * c.s, rx * c.s, ry * c.s, 0, 0, 7); });
      ctx.fill();
    }
  }
  // mountain layers
  const hazeD = th.haze[0];
  LAYERS.forEach((Ly, li) => {
    const off = camX * Ly.par, style = th.layers[li];
    const base = mix(p > 0.5 ? th.near[1] : th.near[0], hazeD, Ly.depth * (1 - p * 0.7));
    ctx.fillStyle = base;
    const ridge = ridgeFn(th.ridge, Ly, off);
    if (th.ridge === 'clouds') {
      ctx.beginPath();
      for (let x = -20; x <= VW + 20; x += 14) { const y = ridge(x), r = 12 + hsh(Math.floor((x + off) / 14) + li) * 8; ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, 7); }
      ctx.rect(0, ridge(0), VW, VH); ctx.fill();
    } else {
      ctx.beginPath(); ctx.moveTo(0, VH);
      if (th.ridge === 'city') { for (let x = -22; x <= VW + 22; x += 1) { const y = ridge(x); ctx.lineTo(x, y); } }
      else for (let x = 0; x <= VW + 3; x += 3) ctx.lineTo(x, ridge(x));
      ctx.lineTo(VW, VH); ctx.closePath(); ctx.fill();
    }
    if (th.ridge === 'cave') drawCeiling(Ly, li, off, base);
    decorate(style, Ly, li, off, ridge, base, p);
    const fg = ctx.createLinearGradient(0, Ly.base - 18, 0, Ly.base + 30);
    fg.addColorStop(0, mix(th.haze[0], th.haze[1], p, 0)); fg.addColorStop(0.55, mix(th.fogHi, th.haze[1], p, 0.22 * (1 - li * 0.15))); fg.addColorStop(1, mix(th.haze[0], th.haze[1], p, 0));
    ctx.fillStyle = fg; ctx.fillRect(0, Ly.base - 18, VW, 48);
  });
}

function drawCeiling(Ly, li, off, col) {
  const { ctx, VW } = R;
  const top = x => 8 + li * 6 + fbm((x + off) * Ly.f * 1.7, Ly.seed + 9) * (Ly.amp * 0.8);
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, 0);
  for (let x = 0; x <= VW + 3; x += 3) ctx.lineTo(x, top(x));
  ctx.lineTo(VW, 0); ctx.closePath(); ctx.fill();
  const sp = 16 + li * 6; ctx.beginPath();
  for (let k = Math.floor(off / sp) - 1; k < Math.ceil((off + VW) / sp) + 1; k++) {
    if (hsh(k * 5.3 + li) < 0.35) continue;
    const X = k * sp + hsh(k + li * 3) * sp * 0.6 - off, Y = top(clamp(X, 0, VW)) - 2, len = 8 + hsh(k * 2.1 + li) * (14 + li * 6), w = 2 + len * 0.18;
    ctx.moveTo(X - w, Y); ctx.lineTo(X, Y + len); ctx.lineTo(X + w, Y);
  }
  ctx.fill();
}

function decorate(style, Ly, li, off, ridge, col, p) {
  const { ctx, VW } = R, f = R.frame;
  const each = (sp, skip, fn) => { for (let k = Math.floor(off / sp) - 1; k < Math.ceil((off + VW) / sp) + 1; k++) { if (hsh(k * 7.1 + Ly.seed) < skip) continue; const X = k * sp + hsh(k + Ly.seed * 3) * sp * 0.6 - off; fn(X, ridge(clamp(X, 0, VW)), k); } };
  if (style === 'pines') {
    const sp = li === 3 ? 12 : 18; ctx.beginPath();
    each(sp, 0.3, (X, Y0, k) => {
      const Y = Y0 + 3, ht = (9 + hsh(k * 3.3) * 14) * (li === 3 ? 1.15 : 0.8), w = ht * 0.32;
      for (let t = 0; t < 3; t++) { const ty = Y - ht + t * ht * 0.28; ctx.moveTo(X, ty); ctx.lineTo(X + w * (0.55 + t * 0.25), ty + ht * 0.42); ctx.lineTo(X - w * (0.55 + t * 0.25), ty + ht * 0.42); ctx.closePath(); }
      ctx.rect(X - 0.6, Y - ht * 0.2, 1.2, ht * 0.25);
    });
    ctx.fill();
  } else if (style === 'trees') {
    const sp = [0, 30, 24, 20][li], sc = [0, 0.7, 0.95, 1.25][li]; ctx.beginPath();
    each(sp, 0.25, (X, Y0, k) => {
      const ht = (22 + hsh(k * 3.3) * 18) * sc, Y = Y0 + 4, r = ht * 0.32;
      ctx.rect(X - 1 * sc, Y - ht * 0.6, 2 * sc, ht * 0.6);
      ctx.moveTo(X + r, Y - ht * 0.72); ctx.ellipse(X, Y - ht * 0.72, r, r * 0.9, 0, 0, 7);
      ctx.moveTo(X - r * 0.4 + r * 0.7, Y - ht * 0.55); ctx.ellipse(X - r * 0.4, Y - ht * 0.55, r * 0.7, r * 0.6, 0, 0, 7);
      ctx.moveTo(X + r * 0.5 + r * 0.7, Y - ht * 0.58); ctx.ellipse(X + r * 0.5, Y - ht * 0.58, r * 0.7, r * 0.6, 0, 0, 7);
    });
    ctx.fill();
    if (li >= 2 && p > 0.2) each(sp * 3, 0.5, (X, Y0, k) => { // hanging lanterns in the far trees
      const a = clamp((p - 0.2) * 2, 0, 1) * (0.7 + 0.3 * Math.sin(f * 0.05 + k));
      ctx.fillStyle = `rgba(255,190,110,${a * 0.9})`; ctx.beginPath(); ctx.arc(X + 4, Y0 - 16 * (li === 3 ? 1.2 : 0.9), 1.1, 0, 7); ctx.fill();
    });
  } else if (style === 'spires') {
    const sp = [0, 22, 18, 14][li]; ctx.beginPath();
    each(sp, 0.3, (X, Y0, k) => { const ht = (10 + hsh(k * 3.3) * 22) * (0.6 + li * 0.2), w = 2 + ht * 0.16; ctx.moveTo(X - w, Y0 + 4); ctx.lineTo(X, Y0 - ht); ctx.lineTo(X + w, Y0 + 4); });
    ctx.fill();
  } else if (style === 'crystals') {
    each(34, 0.4, (X, Y0, k) => {
      const ht = 8 + hsh(k * 3.3) * 14, a = 0.35 + 0.25 * Math.sin(f * 0.03 + k);
      ctx.fillStyle = `rgba(110,240,220,${a})`; ctx.beginPath(); ctx.moveTo(X - 3, Y0 + 2); ctx.lineTo(X - 1, Y0 - ht); ctx.lineTo(X + 2, Y0 - ht * 0.7); ctx.lineTo(X + 4, Y0 + 2); ctx.fill();
    });
  } else if (style === 'roofs') {
    const sp = [0, 26, 22, 20][li], sc = [0, 0.6, 0.8, 1][li];
    each(sp, 0.15, (X, Y0, k) => {
      const w = (14 + hsh(k * 2.2) * 10) * sc, h = (18 + hsh(k * 3.3) * 26) * sc, Y = Y0 + 12;
      ctx.fillStyle = col; ctx.beginPath(); ctx.rect(X - w / 2, Y - h, w, h + 40); ctx.moveTo(X - w / 2 - 2, Y - h); ctx.lineTo(X, Y - h - w * 0.45); ctx.lineTo(X + w / 2 + 2, Y - h); ctx.fill();
      if (hsh(k * 1.9) > 0.5) ctx.fillRect(X + w * 0.2, Y - h - w * 0.4, 2.5 * sc, 6 * sc);
      const lit = clamp(p * 1.6 - 0.1, 0, 1);
      if (lit > 0) for (let i = 0; i < 4; i++) { if (hsh(k * 5 + i) < 0.45) continue; ctx.fillStyle = `rgba(255,200,120,${lit * (0.5 + 0.4 * hsh(k + i)) * sc})`; ctx.fillRect(X - w / 2 + 2 + (i % 2) * w * 0.5, Y - h + 4 + (i >> 1) * 8 * sc, 2.2 * sc, 3 * sc); }
    });
  } else if (style === 'reeds') {
    ctx.strokeStyle = col; ctx.lineWidth = 0.8 + li * 0.2; ctx.beginPath();
    each(5 + li, 0.2, (X, Y0, k) => { const ht = 8 + hsh(k * 3.3) * 14 * (0.6 + li * 0.25), sw = Math.sin(f * 0.02 + k) * 1.5; ctx.moveTo(X, Y0 + 4); ctx.quadraticCurveTo(X + sw * 0.4, Y0 - ht * 0.5, X + sw, Y0 - ht); });
    ctx.stroke(); ctx.fillStyle = col; ctx.beginPath();
    each(19 + li * 3, 0.4, (X, Y0, k) => { const ht = 12 + hsh(k) * 10; ctx.ellipse(X + 1, Y0 - ht, 1.2, 3.2, 0, 0, 7); });
    ctx.fill();
  } else if (style === 'peaks') {
    // snowcaps: a band that follows the ridge down to a snow line
    const line = Ly.base - Ly.amp * 0.5;
    ctx.fillStyle = `rgba(240,244,255,${0.5 - li * 0.1})`; ctx.beginPath(); ctx.moveTo(0, ridge(0));
    for (let x = 0; x <= VW + 3; x += 3) ctx.lineTo(x, ridge(x));
    for (let x = VW + 3; x >= 0; x -= 3) { const y = ridge(x); ctx.lineTo(x, y + Math.max(0, Math.min(9, line - y))); }
    ctx.closePath(); ctx.fill();
  } else if (style === 'ruins') {
    const sp = [0, 60, 48, 40][li], sc = [0, 0.6, 0.8, 1][li];
    each(sp, 0.35, (X, Y0, k) => {
      const w = 22 * sc, h = (20 + hsh(k * 3.1) * 24) * sc;
      ctx.fillStyle = col; ctx.beginPath(); ctx.rect(X - w / 2, Y0 - h, w, h + 30); ctx.fill();
      if (hsh(k * 2.9) > 0.5) { // gear
        const gx = X, gy = Y0 - h - 6 * sc, r = 7 * sc, rot = f * 0.01 * (k % 2 ? 1 : -1);
        ctx.beginPath(); for (let i = 0; i < 16; i++) { const a = rot + i / 16 * Math.PI * 2, rr2 = i % 2 ? r : r * 1.25; ctx.lineTo(gx + Math.cos(a) * rr2, gy + Math.sin(a) * rr2); } ctx.fill();
      }
    });
  } else if (style === 'crags') {
    const sp = [22, 18, 0, 0][li]; ctx.beginPath();
    each(sp, 0.3, (X, Y0, k) => { const ht = 10 + hsh(k * 3.3) * 20; ctx.moveTo(X - 6, Y0 + 3); ctx.lineTo(X - 2, Y0 - ht); ctx.lineTo(X + 1, Y0 - ht * 0.6); ctx.lineTo(X + 3, Y0 - ht * 0.9); ctx.lineTo(X + 7, Y0 + 3); });
    ctx.fill();
    const glow = ctx.createLinearGradient(0, VH - 60, 0, VH); glow.addColorStop(0, 'rgba(255,90,30,0)'); glow.addColorStop(1, `rgba(255,90,30,${0.12 + 0.04 * Math.sin(f * 0.05)})`);
    ctx.fillStyle = glow; ctx.fillRect(0, VH - 60, VW, 60);
  } else if (style === 'mesas') {
    // nothing extra: the stepped ridge is the silhouette
  } else if (style === 'cloudbank') {
    // puffs are part of the ridge
  }
}

// Underground backdrop: drawn over the sky inside the tunnel's columns. Brick wall in parallax,
// support columns, and a few glowing drips.
export function drawUnderBg(W) {
  const u = W.lv.under; if (!u) return;
  const { ctx, S, VW } = R, camX = W.camX, a = u[0] * 16 - camX, z = (u[1] + 1) * 16 - camX;
  if (z < 0 || a > VW) return;
  ctx.setTransform(S, 0, 0, S, 0, 0);
  ctx.save(); ctx.beginPath(); ctx.rect(Math.max(0, a), 0, Math.min(VW, z) - Math.max(0, a), VH); ctx.clip();
  const g = ctx.createLinearGradient(0, 0, 0, VH); g.addColorStop(0, '#080812'); g.addColorStop(1, mix('#141428', R.theme.haze[1], 0.25));
  ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
  // far brick wall
  const off = camX * 0.35;
  ctx.fillStyle = 'rgba(80,90,140,0.10)';
  for (let row = 0; row < 16; row++) {
    const y = 36 + row * 12, sh = (row % 2) * 12;
    for (let x = -((off + sh) % 24) - 24; x < VW + 24; x += 24) ctx.fillRect(x + 1, y + 1, 22, 10);
  }
  // support columns and arches
  const off2 = camX * 0.6;
  for (let k = Math.floor(off2 / 140) - 1; k < Math.ceil((off2 + VW) / 140) + 1; k++) {
    const x = k * 140 - off2 + 30;
    ctx.fillStyle = 'rgba(20,22,44,0.9)'; ctx.fillRect(x, 30, 16, VH);
    ctx.fillStyle = 'rgba(90,100,160,0.18)'; ctx.fillRect(x + 2, 30, 2, VH);
    ctx.strokeStyle = 'rgba(20,22,44,0.9)'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(x + 78, 64, 62, Math.PI, 0); ctx.stroke();
    if (hsh(k * 3.1) > 0.5) { const t = ((R.frame + k * 37) % 180) / 180, dy = 40 + t * 150; ctx.fillStyle = `rgba(140,220,255,${0.5 * (1 - t)})`; ctx.fillRect(x + 40, dy, 1, 3); }
  }
  // soft edges at the tunnel mouths
  for (const [ex, dir] of [[a, 1], [z, -1]]) if (ex > -40 && ex < VW + 40) {
    const eg = ctx.createLinearGradient(ex, 0, ex + 30 * dir, 0); eg.addColorStop(0, 'rgba(8,8,18,0.9)'); eg.addColorStop(1, 'rgba(8,8,18,0)');
    ctx.fillStyle = eg; ctx.fillRect(dir > 0 ? ex : ex - 30, 0, 30, VH);
  }
  ctx.restore();
}
