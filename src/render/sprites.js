// =============== Cached sprites and buffers ===============
// Anything that used to be a per-frame gradient or a full-screen pattern fill is baked here once
// (per resize) and drawn with drawImage, which is far cheaper on both CPU and GPU.
import { R, VH } from './ctx.js';

const mkCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

// Light hole: the same falloff the lighting pass always used (1 → 0.45 at half radius → 0).
// Drawn with globalAlpha = the light's strength.
function lightSprite() {
  const n = 128, c = mkCanvas(n, n), x = c.getContext('2d'), g = x.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
  g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.5, 'rgba(0,0,0,0.45)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.fillRect(0, 0, n, n); return c;
}

// Film grain: a few half-resolution noise frames with the opacity baked in (drawn crisp, 2x2).
function grainFrames(w, h) {
  const fw = Math.ceil(w / 2), fh = Math.ceil(h / 2), frames = [];
  for (let f = 0; f < 4; f++) {
    const c = mkCanvas(fw, fh), x = c.getContext('2d'), id = x.createImageData(fw, fh), d = id.data;
    for (let i = 0; i < d.length; i += 4) { const n = Math.random() * 255; d[i] = d[i + 1] = d[i + 2] = n; d[i + 3] = 6; }
    x.putImageData(id, 0, 0); frames.push(c);
  }
  return frames;
}
// Vignette at light-map resolution; the lighting pass stamps it in, so it costs no extra full-screen pass.
function vignette(w, h) {
  const c = mkCanvas(w, h), x = c.getContext('2d'), g = x.createRadialGradient(w / 2, h * 0.55, h * 0.35, w / 2, h / 2, w * 0.72);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(4,2,12,0.55)'); x.fillStyle = g; x.fillRect(0, 0, w, h); return c;
}

export function buildBuffers(w, h) {
  R.LIGHT = R.LIGHT || lightSprite();
  // light map at quarter resolution: lights are soft, so this is invisible and 4x cheaper than half
  R.LC = mkCanvas(Math.ceil(w / 4), Math.ceil(h / 4)); R.lctx = R.LC.getContext('2d');
  // background (sky + parallax) buffer, capped at 2 device px per world px
  R.SB = Math.min(R.S, 2); R.BG = mkCanvas(Math.round(R.VW * R.SB), Math.round(VH * R.SB)); R.bgx = R.BG.getContext('2d', { alpha: false });
  R.VIG = vignette(R.LC.width, R.LC.height);
  R.OVL = grainFrames(w, h);
  bloomCache.clear();
}

// Blooms: one sprite per base colour, alpha applied at draw time.
const bloomCache = new Map(), parsed = new Map();
function bloomSprite(rgb) {
  let c = bloomCache.get(rgb); if (c) return c;
  const n = 64; c = mkCanvas(n, n); const x = c.getContext('2d'), g = x.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
  g.addColorStop(0, `rgba(${rgb},1)`); g.addColorStop(1, `rgba(${rgb},0)`); x.fillStyle = g; x.fillRect(0, 0, n, n);
  bloomCache.set(rgb, c); return c;
}
function parseRGBA(s) {
  let p = parsed.get(s); if (p) return p;
  const m = s.match(/rgba?\(([^)]+)\)/), v = m ? m[1].split(',').map(t => t.trim()) : ['255', '255', '255', '1'];
  p = [`${v[0]},${v[1]},${v[2]}`, v[3] === undefined ? 1 : +v[3]];
  if (parsed.size > 400) parsed.clear();
  parsed.set(s, p); return p;
}
export function drawBlooms() {
  const { ctx } = R;
  for (const [x, y, r, c] of R.blooms) {
    const [rgb, a] = parseRGBA(c); if (a <= 0.004) continue;
    ctx.globalAlpha = Math.min(1, a); ctx.drawImage(bloomSprite(rgb), x - r, y - r, r * 2, r * 2);
  }
  ctx.globalAlpha = 1;
}

let ovl = 0;
export function drawOverlay() {
  const { ctx, cv } = R;
  if (R.noGrain) return;
  if (R.frame % 2 === 0) ovl = (ovl + 1 + Math.floor(Math.random() * 2)) % R.OVL.length;
  // nearest-neighbour: crisp 2x2 grain, not smudged by smoothing
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false; ctx.drawImage(R.OVL[ovl], 0, 0, cv.width, cv.height); ctx.imageSmoothingEnabled = true;
}
