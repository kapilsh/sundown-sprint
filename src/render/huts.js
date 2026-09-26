// =============== Goal buildings ===============
// The building at the end of each level. Styles vary by world and alternate between levels.
// Every style keeps the doorway centred at hut*16 + 40 on the ground line (y 208), because the
// walkout ends there. Everything is drawn procedurally.
import { R } from './ctx.js';
import { hsh, rr } from '../util.js';

const BY_THEME = {
  hills: ['cabin', 'cottage', 'windmill', 'cabin'],
  woods: ['treehouse', 'cabin', 'cottage', 'treehouse'],
  cave: ['mushroom', 'cottage', 'mushroom', 'mushroom'],
  roofs: ['townhouse', 'cottage', 'townhouse', 'townhouse'],
  marsh: ['reedhut', 'cabin', 'reedhut', 'reedhut'],
  frost: ['chalet', 'cabin', 'chalet', 'chalet'],
  clouds: ['pavilion', 'windmill', 'pavilion', 'pavilion'],
  clock: ['workshop', 'townhouse', 'workshop', 'workshop'],
  ember: ['forge', 'cottage', 'forge', 'forge'],
  stars: ['observatory', 'cottage', 'observatory', 'observatory'],
  home: ['cottage', 'windmill', 'cabin', 'home'],
};
export function hutStyle(W) {
  if (W.lv.hutStyle) return W.lv.hutStyle;
  if (W.lv.home) return 'home';
  const list = BY_THEME[W.lv.theme] || BY_THEME.hills, l = +(W.id.split('-')[1] || 1);
  return list[(l - 1) % list.length];
}
// Chimney smoke origin relative to the hut's left edge, or null for no smoke.
export const CHIMNEY = { cabin: [64, 150], cottage: [62, 148], townhouse: [60, 118], chalet: [58, 150], forge: [64, 140], home: [66, 128],
  reedhut: null, windmill: null, treehouse: [56, 118], mushroom: null, pavilion: null, workshop: [66, 136], observatory: null };

// ---------- shared parts ----------
function shadow(hx, y, w = 48) { const { ctx } = R; ctx.fillStyle = 'rgba(8,4,20,.4)'; ctx.beginPath(); ctx.ellipse(hx + 40, y, w, 3, 0, 0, 7); ctx.fill(); }
function door(hx, y, open, col = '#5a3a28', frame = '#2a1810') {
  const { ctx } = R;
  ctx.fillStyle = frame; rr(ctx, hx + 31, y - 30, 18, 30, 8); ctx.fill();
  ctx.fillStyle = open ? '#ffc070' : col; rr(ctx, hx + 33, y - 28, 14, 28, 7); ctx.fill();
  ctx.fillStyle = frame; ctx.beginPath(); ctx.arc(hx + 44, y - 13, 0.9, 0, 7); ctx.fill();
  if (open) { R.lights.push([hx + 40, y - 14, 90, 1]); R.blooms.push([hx + 40, y - 14, 24, 'rgba(255,180,90,0.3)']); }
}
function win(wx, wy, w = 12, h = 11, frame = '#2a1810', round = false) {
  const { ctx } = R;
  ctx.fillStyle = frame;
  if (round) { ctx.beginPath(); ctx.arc(wx + w / 2, wy + h / 2, w / 2 + 1.2, 0, 7); ctx.fill(); }
  else { rr(ctx, wx - 1, wy - 1, w + 2, h + 2, 1.5); ctx.fill(); }
  const g = ctx.createRadialGradient(wx + w / 2, wy + h / 2, 1, wx + w / 2, wy + h / 2, Math.max(w, h) * 0.8); g.addColorStop(0, '#fff0b8'); g.addColorStop(1, '#ff9a48');
  ctx.fillStyle = g;
  if (round) { ctx.beginPath(); ctx.arc(wx + w / 2, wy + h / 2, w / 2, 0, 7); ctx.fill(); } else ctx.fillRect(wx, wy, w, h);
  ctx.fillStyle = frame; ctx.fillRect(wx + w / 2 - 0.5, wy, 1, h); ctx.fillRect(wx, wy + h / 2 - 0.5, w, 1);
  R.lights.push([wx + w / 2, wy + h / 2, 60, 0.85]); R.blooms.push([wx + w / 2, wy + h / 2, 16, 'rgba(255,170,80,0.25)']);
}
function lg(y0, y1, a, b) { const g = R.ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, a); g.addColorStop(1, b); return g; }

// ---------- styles ----------
const STYLES = {
  cabin(hx, y, open) {
    const { ctx } = R;
    ctx.fillStyle = '#3a2418'; ctx.fillRect(hx + 60, y - 70, 9, 22);
    for (let i = 0; i < 7; i++) {
      ctx.fillStyle = lg(y - 46 + i * 6.6, y - 40 + i * 6.6, '#9a6a48', '#5a3a28'); rr(ctx, hx - 2, y - 46 + i * 6.6, 84, 6.4, 3); ctx.fill();
      ctx.fillStyle = '#c69468'; ctx.beginPath(); ctx.arc(hx - 1, y - 42.8 + i * 6.6, 2.6, 0, 7); ctx.arc(hx + 81, y - 42.8 + i * 6.6, 2.6, 0, 7); ctx.fill();
    }
    for (let i = 0; i < 6; i++) { const w = 96 - i * 13, ry = y - 48 - i * 5; ctx.fillStyle = lg(ry - 5, ry + 1, '#a8445a', '#5e2034'); rr(ctx, hx + 40 - w / 2, ry - 5, w, 6, 2); ctx.fill(); }
    door(hx, y, open); win(hx + 9, y - 34); win(hx + 59, y - 34);
  },
  cottage(hx, y, open) {
    const { ctx } = R;
    ctx.fillStyle = '#4a4458'; ctx.fillRect(hx + 58, y - 74, 10, 24);
    ctx.fillStyle = lg(y - 44, y, '#a8a2b8', '#6a6480'); ctx.fillRect(hx + 2, y - 44, 76, 44);
    ctx.strokeStyle = 'rgba(40,34,60,.45)'; ctx.lineWidth = 0.5;
    for (let r = 0; r < 6; r++) for (let k = 0; k < 7; k++) { const bx = hx + 2 + k * 11 + (r % 2 ? 5.5 : 0) - 5.5, by = y - 44 + r * 7.4; ctx.strokeRect(Math.max(hx + 2, bx), by, 11, 7.4); }
    // thatched roof
    ctx.fillStyle = lg(y - 76, y - 40, '#e0b870', '#8a6a30'); ctx.beginPath(); ctx.moveTo(hx - 8, y - 40); ctx.quadraticCurveTo(hx + 40, y - 92, hx + 88, y - 40); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(90,60,20,.5)'; ctx.lineWidth = 0.6; ctx.beginPath();
    for (let i = 0; i < 14; i++) { const x = hx - 4 + i * 7; ctx.moveTo(x, y - 41); ctx.lineTo(x + (i - 7) * 1.2, y - 50 - Math.sin(i / 13 * Math.PI) * 22); } ctx.stroke();
    door(hx, y, open, '#4a6a4a'); win(hx + 8, y - 34, 12, 12, '#3a3448', true); win(hx + 60, y - 34, 12, 12, '#3a3448', true);
    ctx.fillStyle = '#f07a8c'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(hx + 6 + i * 3.4, y - 20 + (i % 2), 1.4, 0, 7); ctx.arc(hx + 58 + i * 3.4, y - 20 + (i % 2), 1.4, 0, 7); ctx.fill(); }
  },
  windmill(hx, y, open) {
    const { ctx } = R;
    ctx.fillStyle = lg(y - 96, y, '#e8dcc8', '#9a8a78'); ctx.beginPath(); ctx.moveTo(hx + 18, y); ctx.lineTo(hx + 28, y - 90); ctx.lineTo(hx + 52, y - 90); ctx.lineTo(hx + 62, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#6a3a3a'; ctx.beginPath(); ctx.moveTo(hx + 22, y - 88); ctx.quadraticCurveTo(hx + 40, y - 112, hx + 58, y - 88); ctx.closePath(); ctx.fill();
    door(hx, y, open, '#5a4a6a'); win(hx + 35, y - 62, 10, 12, '#3a3040');
    const cx = hx + 40, cy = y - 88, a = R.frame * 0.02;
    for (let k = 0; k < 4; k++) {
      const t = a + k * Math.PI / 2, ex = cx + Math.cos(t) * 46, ey = cy + Math.sin(t) * 46;
      ctx.strokeStyle = '#4a3a30'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(t); ctx.fillStyle = 'rgba(240,232,220,.85)'; ctx.fillRect(10, 0.5, 34, 8); ctx.strokeStyle = 'rgba(80,60,50,.6)'; ctx.lineWidth = 0.4;
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(10 + i * 8.5, 0.5); ctx.lineTo(10 + i * 8.5, 8.5); ctx.stroke(); } ctx.restore();
    }
    ctx.fillStyle = '#2a2020'; ctx.beginPath(); ctx.arc(cx, cy, 3, 0, 7); ctx.fill();
  },
  treehouse(hx, y, open) {
    const { ctx } = R;
    ctx.fillStyle = lg(y - 70, y, '#6e4a30', '#3a2618'); ctx.beginPath(); ctx.moveTo(hx + 14, y); ctx.quadraticCurveTo(hx + 26, y - 30, hx + 24, y - 70); ctx.lineTo(hx + 56, y - 70); ctx.quadraticCurveTo(hx + 54, y - 30, hx + 66, y); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(20,10,4,.4)'; ctx.lineWidth = 0.7; ctx.beginPath(); for (let i = 0; i < 5; i++) { ctx.moveTo(hx + 28 + i * 6, y - 68); ctx.bezierCurveTo(hx + 30 + i * 6, y - 40, hx + 26 + i * 6, y - 20, hx + 29 + i * 6, y); } ctx.stroke();
    // the hut up in the branches
    ctx.fillStyle = '#5a3a28'; ctx.fillRect(hx + 6, y - 76, 68, 4);
    ctx.fillStyle = lg(y - 104, y - 76, '#b08050', '#7a5030'); ctx.fillRect(hx + 14, y - 102, 52, 26);
    ctx.fillStyle = '#3a6a3e'; ctx.beginPath(); ctx.moveTo(hx + 6, y - 100); ctx.lineTo(hx + 40, y - 124); ctx.lineTo(hx + 74, y - 100); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#2f8a5a'; for (const [ox, oy, r] of [[-10, -118, 18], [90, -112, 16], [-2, -96, 12], [84, -92, 12]]) { ctx.beginPath(); ctx.arc(hx + ox, y + oy, r, 0, 7); ctx.fill(); }
    win(hx + 22, y - 96, 10, 10); win(hx + 48, y - 96, 10, 10);
    ctx.strokeStyle = '#8a6a4a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(hx + 68, y - 76); ctx.lineTo(hx + 68, y); ctx.moveTo(hx + 74, y - 76); ctx.lineTo(hx + 74, y); for (let yy = y - 70; yy < y; yy += 9) { ctx.moveTo(hx + 68, yy); ctx.lineTo(hx + 74, yy); } ctx.stroke();
    door(hx, y, open, '#4a3020', '#1a100a');
    ctx.fillStyle = '#ffb65c'; ctx.beginPath(); ctx.arc(hx + 12, y - 70, 2, 0, 7); ctx.fill(); R.lights.push([hx + 12, y - 70, 40, 0.8]);
  },
  mushroom(hx, y, open) {
    const { ctx } = R;
    ctx.fillStyle = lg(y - 48, y, '#f0e0c8', '#b0a088'); ctx.beginPath(); ctx.moveTo(hx + 20, y); ctx.quadraticCurveTo(hx + 16, y - 30, hx + 24, y - 48); ctx.lineTo(hx + 56, y - 48); ctx.quadraticCurveTo(hx + 64, y - 30, hx + 60, y); ctx.closePath(); ctx.fill();
    const glow = 0.7 + 0.3 * Math.sin(R.frame * 0.04);
    ctx.fillStyle = lg(y - 96, y - 44, '#4fd8c8', '#1a6a6a'); ctx.beginPath(); ctx.ellipse(hx + 40, y - 48, 50, 38, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#0e4a4a'; ctx.fillRect(hx - 10, y - 50, 100, 4);
    for (let i = 0; i < 7; i++) { const sx = hx + 4 + hsh(i * 3.1) * 72, sy = y - 58 - hsh(i * 5.3) * 28; ctx.fillStyle = `rgba(200,255,240,${0.6 * glow})`; ctx.beginPath(); ctx.arc(sx, sy, 2 + hsh(i) * 3, 0, 7); ctx.fill(); R.lights.push([sx, sy, 16, 0.4 * glow]); }
    R.blooms.push([hx + 40, y - 70, 50, `rgba(110,240,220,${0.12 * glow})`]);
    door(hx, y, open, '#6a4a3a'); win(hx + 26, y - 40, 8, 8, '#6a5a48', true); win(hx + 48, y - 40, 8, 8, '#6a5a48', true);
  },
  townhouse(hx, y, open) {
    const { ctx } = R;
    ctx.fillStyle = '#4a2a2a'; ctx.fillRect(hx + 56, y - 110, 9, 20);
    ctx.fillStyle = lg(y - 96, y, '#b0604a', '#6a3026'); ctx.fillRect(hx + 10, y - 96, 60, 96);
    ctx.strokeStyle = 'rgba(40,16,12,.35)'; ctx.lineWidth = 0.4; for (let r = 0; r < 24; r++) { ctx.beginPath(); ctx.moveTo(hx + 10, y - 96 + r * 4); ctx.lineTo(hx + 70, y - 96 + r * 4); ctx.stroke(); }
    ctx.fillStyle = '#3a2a3a'; ctx.beginPath(); ctx.moveTo(hx + 4, y - 94); ctx.lineTo(hx + 40, y - 120); ctx.lineTo(hx + 76, y - 94); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e8dcc8'; ctx.fillRect(hx + 8, y - 64, 64, 3); ctx.fillRect(hx + 8, y - 34, 64, 2);
    for (const wy of [y - 88, y - 58]) { win(hx + 16, wy, 10, 16, '#2a1a1a'); win(hx + 54, wy, 10, 16, '#2a1a1a'); }
    win(hx + 35, y - 112, 10, 10, '#2a1a1a', true);
    door(hx, y, open, '#2a4a6a');
  },
  reedhut(hx, y, open) {
    const { ctx } = R;
    ctx.strokeStyle = '#5a4a2a'; ctx.lineWidth = 2; ctx.beginPath(); for (const x of [8, 72]) { ctx.moveTo(hx + x, y); ctx.lineTo(hx + x, y - 34); } ctx.stroke();
    ctx.fillStyle = lg(y - 40, y, '#8a7a4a', '#5a4a2a'); ctx.fillRect(hx + 8, y - 36, 64, 36);
    ctx.strokeStyle = 'rgba(40,30,10,.5)'; ctx.lineWidth = 0.6; ctx.beginPath(); for (let i = 0; i < 16; i++) { ctx.moveTo(hx + 9 + i * 4, y - 36); ctx.lineTo(hx + 9 + i * 4, y); } ctx.stroke();
    ctx.fillStyle = lg(y - 84, y - 34, '#c8b070', '#7a6a38'); ctx.beginPath(); ctx.moveTo(hx - 6, y - 32); ctx.quadraticCurveTo(hx + 40, y - 100, hx + 86, y - 32); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#c8b070'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(hx + 40, y - 66); ctx.lineTo(hx + 44, y - 80); ctx.moveTo(hx + 40, y - 66); ctx.lineTo(hx + 34, y - 78); ctx.stroke();
    door(hx, y, open, '#3a4a2a'); win(hx + 12, y - 28, 10, 10, '#3a2a10', true);
    ctx.fillStyle = '#ffb65c'; ctx.beginPath(); ctx.arc(hx + 66, y - 22, 2.2, 0, 7); ctx.fill(); R.lights.push([hx + 66, y - 22, 40, 0.8]);
  },
  chalet(hx, y, open) {
    const { ctx } = R;
    ctx.fillStyle = '#3a2a2a'; ctx.fillRect(hx + 56, y - 76, 9, 24);
    ctx.fillStyle = lg(y - 50, y, '#8a5a3a', '#4a2e1e'); ctx.fillRect(hx + 4, y - 48, 72, 48);
    ctx.fillStyle = '#5a3020'; ctx.beginPath(); ctx.moveTo(hx - 8, y - 44); ctx.lineTo(hx + 40, y - 92); ctx.lineTo(hx + 88, y - 44); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f4f6ff'; ctx.beginPath(); ctx.moveTo(hx - 10, y - 44); ctx.lineTo(hx + 40, y - 95); ctx.lineTo(hx + 90, y - 44); ctx.lineTo(hx + 84, y - 42); ctx.lineTo(hx + 40, y - 86); ctx.lineTo(hx - 4, y - 42); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(220,236,255,.9)'; for (let i = 0; i < 9; i++) { const ix = hx - 4 + i * 11; ctx.beginPath(); ctx.moveTo(ix, y - 43); ctx.lineTo(ix + 3, y - 43); ctx.lineTo(ix + 1.5, y - 36 - hsh(i) * 5); ctx.fill(); }
    ctx.fillStyle = '#f4f6ff'; ctx.fillRect(hx + 55, y - 79, 11, 4);
    door(hx, y, open, '#6a3a2a'); win(hx + 10, y - 38, 12, 12); win(hx + 58, y - 38, 12, 12); win(hx + 35, y - 72, 10, 10, '#2a1810', true);
  },
  pavilion(hx, y, open) {
    const { ctx } = R;
    ctx.fillStyle = 'rgba(240,236,255,.95)'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.ellipse(hx + 2 + i * 15, y + 1, 10, 5, 0, 0, 7); ctx.fill(); }
    ctx.fillStyle = lg(y - 50, y, '#f0ecff', '#b8a8d8');
    for (const x of [6, 24, 52, 70]) ctx.fillRect(hx + x, y - 46, 5, 46);
    ctx.fillStyle = '#e8e0f8'; ctx.fillRect(hx, y - 50, 80, 5);
    ctx.fillStyle = lg(y - 92, y - 50, '#ffd68a', '#c8a0d8'); ctx.beginPath(); ctx.ellipse(hx + 40, y - 50, 38, 36, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#ffd68a'; ctx.beginPath(); ctx.moveTo(hx + 40, y - 96); ctx.lineTo(hx + 42, y - 86); ctx.lineTo(hx + 38, y - 86); ctx.fill();
    ctx.fillStyle = 'rgba(40,30,70,.5)'; ctx.fillRect(hx + 11, y - 45, 13, 45); ctx.fillRect(hx + 57, y - 45, 13, 45);
    door(hx, y, open, '#8a78b8', '#5a4a8a');
    R.lights.push([hx + 40, y - 40, 70, 0.7]); R.blooms.push([hx + 40, y - 70, 30, 'rgba(255,214,138,0.15)']);
  },
  workshop(hx, y, open) {
    const { ctx } = R;
    ctx.fillStyle = '#3a3030'; ctx.fillRect(hx + 60, y - 86, 8, 32); ctx.fillStyle = '#8a6a3a'; ctx.fillRect(hx + 58, y - 88, 12, 3);
    ctx.fillStyle = lg(y - 56, y, '#6a5a4a', '#3a2e24'); ctx.fillRect(hx + 2, y - 56, 76, 56);
    ctx.fillStyle = '#8a6a3a'; ctx.fillRect(hx, y - 60, 80, 5); ctx.fillStyle = '#c8a060'; for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.arc(hx + 4 + i * 9, y - 57.5, 0.8, 0, 7); ctx.fill(); }
    const gx = hx + 14, gy = y - 70, rot = R.frame * 0.015;
    ctx.fillStyle = '#b08040'; ctx.beginPath(); for (let i = 0; i < 20; i++) { const a = rot + i / 20 * Math.PI * 2, r = i % 2 ? 11 : 14; ctx.lineTo(gx + Math.cos(a) * r, gy + Math.sin(a) * r); } ctx.fill();
    ctx.fillStyle = '#3a2e24'; ctx.beginPath(); ctx.arc(gx, gy, 4, 0, 7); ctx.fill();
    ctx.strokeStyle = '#8a8a9a'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(hx + 78, y - 40); ctx.lineTo(hx + 86, y - 40); ctx.lineTo(hx + 86, y); ctx.stroke();
    door(hx, y, open, '#4a4a5a'); win(hx + 8, y - 44, 14, 12, '#2a2020'); win(hx + 58, y - 44, 14, 12, '#2a2020');
  },
  forge(hx, y, open) {
    const { ctx } = R;
    ctx.fillStyle = '#2a1a1a'; ctx.fillRect(hx + 58, y - 84, 12, 36);
    ctx.fillStyle = lg(y - 52, y, '#5a4a4a', '#2a2020'); ctx.fillRect(hx + 2, y - 52, 76, 52);
    ctx.strokeStyle = 'rgba(10,6,6,.5)'; ctx.lineWidth = 0.5; for (let r = 0; r < 7; r++) for (let k = 0; k < 7; k++) ctx.strokeRect(hx + 2 + k * 11 + (r % 2) * 5, y - 52 + r * 7.4, 11, 7.4);
    ctx.fillStyle = '#3a2a2a'; ctx.beginPath(); ctx.moveTo(hx - 6, y - 50); ctx.lineTo(hx + 40, y - 72); ctx.lineTo(hx + 86, y - 50); ctx.closePath(); ctx.fill();
    // furnace mouth
    const fl = 0.7 + 0.3 * Math.sin(R.frame * 0.2) + Math.random() * 0.1;
    ctx.fillStyle = '#1a0a0a'; rr(ctx, hx + 6, y - 24, 18, 20, 8); ctx.fill();
    ctx.fillStyle = `rgba(255,${120 + fl * 60 | 0},40,${fl})`; rr(ctx, hx + 8, y - 20, 14, 16, 6); ctx.fill();
    R.lights.push([hx + 15, y - 12, 70, 0.9 * fl]); R.blooms.push([hx + 15, y - 12, 20, 'rgba(255,120,40,0.35)']);
    ctx.fillStyle = '#4a4a5a'; ctx.fillRect(hx + 56, y - 10, 16, 5); ctx.fillRect(hx + 60, y - 5, 8, 5); ctx.fillRect(hx + 52, y - 10, 5, 3);
    door(hx, y, open, '#4a2a1a'); win(hx + 58, y - 42, 12, 11);
  },
  observatory(hx, y, open) {
    const { ctx } = R;
    ctx.fillStyle = lg(y - 50, y, '#8a86a8', '#4a4668'); ctx.fillRect(hx + 6, y - 50, 68, 50);
    ctx.fillStyle = lg(y - 96, y - 50, '#c8c4e0', '#6a66a0'); ctx.beginPath(); ctx.ellipse(hx + 40, y - 50, 36, 36, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#1a1438'; ctx.beginPath(); ctx.moveTo(hx + 35, y - 86); ctx.lineTo(hx + 45, y - 86); ctx.lineTo(hx + 47, y - 52); ctx.lineTo(hx + 33, y - 52); ctx.fill();
    const t = -0.9 + Math.sin(R.frame * 0.005) * 0.15;
    ctx.save(); ctx.translate(hx + 40, y - 70); ctx.rotate(t); ctx.fillStyle = '#b0acd0'; ctx.fillRect(0, -3, 34, 6); ctx.fillStyle = '#fff4c8'; ctx.fillRect(32, -2.5, 3, 5); ctx.restore();
    ctx.fillStyle = 'rgba(255,240,200,.8)'; for (let i = 0; i < 5; i++) { const sx = hx + 40 + Math.cos(t) * 40 + i * 8, sy = y - 70 + Math.sin(t) * 40 - i * 7; ctx.fillRect(sx, sy, 1, 1); }
    door(hx, y, open, '#3a3060'); win(hx + 12, y - 40, 10, 10, '#2a2440', true); win(hx + 58, y - 40, 10, 10, '#2a2440', true);
  },
  home(hx, y, open) {
    // Dusky's own home: a two-storey cottage with a garland of lanterns along the eaves
    const { ctx } = R;
    ctx.fillStyle = '#3a2418'; ctx.fillRect(hx + 62, y - 104, 10, 28);
    ctx.fillStyle = lg(y - 80, y, '#c89a70', '#7a5238'); ctx.fillRect(hx - 6, y - 80, 92, 80);
    ctx.strokeStyle = 'rgba(60,36,20,.4)'; ctx.lineWidth = 0.5; for (let r = 0; r < 16; r++) { ctx.beginPath(); ctx.moveTo(hx - 6, y - 80 + r * 5); ctx.lineTo(hx + 86, y - 80 + r * 5); ctx.stroke(); }
    ctx.fillStyle = lg(y - 118, y - 76, '#a8445a', '#5e2034'); ctx.beginPath(); ctx.moveTo(hx - 16, y - 76); ctx.lineTo(hx + 40, y - 120); ctx.lineTo(hx + 96, y - 76); ctx.closePath(); ctx.fill();
    for (const wx of [hx + 2, hx + 64]) { win(wx, y - 66, 12, 14); win(wx, y - 36, 12, 12); }
    win(hx + 34, y - 100, 12, 12, '#2a1810', true);
    door(hx, y, open);
    for (let i = 0; i <= 12; i++) {
      const lx = hx - 14 + i * 9, ly = y - 78 + Math.sin(i / 12 * Math.PI) * -4 + 3, on = (R.frame >> 4) % 13 !== i;
      ctx.fillStyle = on ? ['#ffd070', '#ff9a6a', '#9ffff2', '#ffe9a8'][i % 4] : '#5a4a3a';
      ctx.beginPath(); ctx.arc(lx, ly, 1.6, 0, 7); ctx.fill();
      if (on) R.lights.push([lx, ly, 18, 0.6]);
    }
    R.lights.push([hx + 40, y - 40, 170, 0.9]); R.blooms.push([hx + 40, y - 40, 64, 'rgba(255,170,90,0.14)']);
  },
};

export function drawHut(W) {
  const hx = W.hut * 16;
  if (hx < W.camX - 130 || hx > W.camX + R.VW + 30) return;
  const y = 208, open = ['tally', 'done'].includes(W.state), style = hutStyle(W);
  shadow(hx, y, style === 'home' ? 58 : 48);
  (STYLES[style] || STYLES.cabin)(hx, y, open);
}
