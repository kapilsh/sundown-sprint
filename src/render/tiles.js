// =============== Tiles (vector, cached at render resolution per theme) ===============
import { R } from './ctx.js';
import { hsh, mix, rr } from '../util.js';

function mk(draw) { const c = document.createElement('canvas'); c.width = c.height = Math.round(16 * R.S); const x = c.getContext('2d'); x.scale(R.S, R.S); draw(x); return c; }
function pebbles(x, seed, n, y0, cols) { for (let i = 0; i < n; i++) { x.fillStyle = cols[i % cols.length]; x.beginPath(); x.ellipse(hsh(seed + i) * 16, y0 + hsh(seed + i * 3.1) * (16 - y0), 0.5 + hsh(seed + i * 7) * 1.1, 0.4 + hsh(seed + i * 5) * 0.7, 0, 0, 7); x.fill(); } }

import { underOf } from '../themes.js';
// Builds the world's tiles into R.T and its underground variant into R.TU.
export function buildTiles(th) { buildSet(underOf(th)); R.TU = R.T; buildSet(th); }
function buildSet(th) {
  const T = R.T = {}, gd = th.ground;
  if (gd.style === 'cloud') return buildCloudGround(th), buildRest(th);
  T.top = [0, 1, 2].map(v => mk(x => {
    const g = x.createLinearGradient(0, 2, 0, 16); g.addColorStop(0, gd.top[0]); g.addColorStop(1, gd.top[1]);
    x.fillStyle = g; x.fillRect(0, 2, 16, 14);
    pebbles(x, v * 40 + 3, 9, 6, gd.peb);
    x.fillStyle = gd.grass[0]; x.beginPath(); x.moveTo(0, 0); x.lineTo(16, 0); x.lineTo(16, 4);
    for (let i = 16; i >= 0; i -= 2) x.lineTo(i, 4.2 + hsh(v * 9 + i) * 2.2); x.closePath(); x.fill();
    const gg = x.createLinearGradient(0, 0, 0, 4); gg.addColorStop(0, gd.grass[1]); gg.addColorStop(1, gd.grass[2]);
    x.fillStyle = gg; x.fillRect(0, 0, 16, 3.2);
  }));
  T.soil = [0, 1, 2].map(v => mk(x => {
    const g = x.createLinearGradient(0, 0, 0, 16); g.addColorStop(0, gd.soil[0]); g.addColorStop(1, gd.soil[1]);
    x.fillStyle = g; x.fillRect(0, 0, 16, 16);
    pebbles(x, v * 71 + 11, 8, 0, gd.peb.slice(0, 2));
    if (v === 1) { x.strokeStyle = 'rgba(120,86,60,.35)'; x.lineWidth = 0.6; x.beginPath(); x.moveTo(2, 0); x.bezierCurveTo(6, 5, 3, 9, 8, 14); x.stroke(); }
  }));
  buildRest(th);
}
// Cloud worlds: puffy tops and a soft body instead of soil and grass.
function buildCloudGround(th) {
  const T = R.T, gd = th.ground;
  T.top = [0, 1, 2].map(v => mk(x => {
    const g = x.createLinearGradient(0, 0, 0, 16); g.addColorStop(0, gd.top[0]); g.addColorStop(1, gd.top[1]);
    x.fillStyle = g; x.fillRect(0, 5, 16, 11);
    x.fillStyle = gd.grass[1]; x.beginPath();
    for (let i = -2; i <= 18; i += 5) x.ellipse(i + hsh(v * 3 + i) * 2, 5.5, 4.2, 4 + hsh(v + i) * 1.4, 0, 0, 7);
    x.fill();
    x.fillStyle = 'rgba(255,255,255,.5)'; x.beginPath(); x.ellipse(5 + v * 3, 3.2, 2.4, 1.1, 0, 0, 7); x.fill();
  }));
  T.soil = [0, 1, 2].map(v => mk(x => {
    const g = x.createLinearGradient(0, 0, 0, 16); g.addColorStop(0, gd.soil[0]); g.addColorStop(1, gd.soil[1]);
    x.fillStyle = g; x.fillRect(0, 0, 16, 16);
    x.fillStyle = 'rgba(255,255,255,.18)'; x.beginPath(); x.ellipse(4 + v * 4, 6, 3.5, 2.2, 0, 0, 7); x.ellipse(12 - v * 2, 12, 3, 1.8, 0, 0, 7); x.fill();
  }));
}
function buildRest(th) {
  const T = R.T;
  const bk = th.brick;
  T.brick = [0, 1, 2, 3].map(v => mk(x => {
    x.fillStyle = bk.mortar; x.fillRect(0, 0, 16, 16);
    const stones = [[0, 0, 7.6], [8, 0, 8], [0, 8, 3.6], [4, 8, 7.6], [12, 8, 4]];
    stones.forEach(([sx, sy, w], i) => {
      const k = hsh(v * 13 + i), g = x.createLinearGradient(0, sy, 0, sy + 8);
      g.addColorStop(0, mix(bk.hi[0], bk.hi[1], k)); g.addColorStop(1, mix(bk.lo[0], bk.lo[1], k));
      x.fillStyle = g; rr(x, sx + 0.4, sy + 0.4, w - 0.8, 7.2, 1.2); x.fill();
      x.fillStyle = 'rgba(255,255,255,.22)'; x.fillRect(sx + 1, sy + 0.8, w - 2, 0.6);
      x.fillStyle = 'rgba(20,14,40,.35)'; x.fillRect(sx + 1, sy + 6.6, w - 2, 0.7);
      if (k > 0.6) { x.strokeStyle = 'rgba(30,24,60,.55)'; x.lineWidth = 0.35; x.beginPath(); x.moveTo(sx + w * 0.3, sy + 1.5); x.lineTo(sx + w * 0.45, sy + 4); x.lineTo(sx + w * 0.38, sy + 6); x.stroke(); }
    });
  }));
  const crateBase = (x, used) => {
    x.fillStyle = used ? '#241a26' : '#3a2210'; rr(x, 0.2, 0.2, 15.6, 15.6, 1.6); x.fill();
    for (let i = 0; i < 3; i++) {
      const g = x.createLinearGradient(1 + i * 4.7, 0, 5.4 + i * 4.7, 0);
      g.addColorStop(0, used ? '#5b4a58' : '#d59a58'); g.addColorStop(1, used ? '#3e3240' : '#9a5e2e');
      x.fillStyle = g; x.fillRect(1.2 + i * 4.6, 1.2, 4.3, 13.6);
      x.strokeStyle = used ? 'rgba(20,14,24,.4)' : 'rgba(80,40,14,.35)'; x.lineWidth = 0.3;
      for (let k = 0; k < 3; k++) { x.beginPath(); x.moveTo(1.8 + i * 4.6 + k * 1.2, 1.5); x.bezierCurveTo(2.5 + i * 4.6 + k, 6, 1.5 + i * 4.6 + k * 1.3, 10, 2.2 + i * 4.6 + k, 14.5); x.stroke(); }
    }
    [[0.6, 0.6], [11.4, 0.6], [0.6, 11.4], [11.4, 11.4]].forEach(([a, b]) => {
      const g = x.createLinearGradient(a, b, a + 4, b + 4); g.addColorStop(0, '#b4b4c8'); g.addColorStop(1, '#55556a');
      x.fillStyle = g; rr(x, a, b, 4, 4, 0.8); x.fill(); x.fillStyle = '#2a2a38'; x.beginPath(); x.arc(a + 2, b + 2, 0.55, 0, 7); x.fill();
    });
  };
  T.crate = mk(x => {
    crateBase(x, false);
    x.fillStyle = '#1b1022'; x.beginPath(); x.moveTo(8, 3.2); x.lineTo(12.2, 7.4); x.lineTo(8, 12.8); x.lineTo(3.8, 7.4); x.closePath(); x.fill();
    const g = x.createLinearGradient(5, 4, 11, 12); g.addColorStop(0, '#dffff9'); g.addColorStop(0.4, '#6ff0e0'); g.addColorStop(1, '#1f9c96');
    x.fillStyle = g; x.beginPath(); x.moveTo(8, 4.2); x.lineTo(11, 7.4); x.lineTo(8, 11.6); x.lineTo(5, 7.4); x.closePath(); x.fill();
    x.fillStyle = 'rgba(255,255,255,.85)'; x.beginPath(); x.moveTo(8, 4.8); x.lineTo(9.4, 6.6); x.lineTo(8, 7.2); x.lineTo(6.4, 6.8); x.closePath(); x.fill();
  });
  T.life = mk(x => {
    crateBase(x, false);
    x.fillStyle = '#1b1022'; rr(x, 4.2, 3.4, 7.6, 9.8, 1.4); x.fill();
    x.fillStyle = '#e8dcff'; rr(x, 5, 4.6, 6, 7.8, 1); x.fill(); x.fillRect(6.6, 3.4, 2.8, 1.4);
    x.fillStyle = '#ffb65c'; x.fillRect(5.8, 5.6, 4.4, 5.8); x.fillStyle = '#fff4c8'; x.beginPath(); x.ellipse(8, 8.8, 0.9, 1.7, 0, 0, 7); x.fill();
  });
  T.used = mk(x => { crateBase(x, true); x.fillStyle = '#120c18'; x.beginPath(); x.moveTo(8, 4.2); x.lineTo(11, 7.4); x.lineTo(8, 11.6); x.lineTo(5, 7.4); x.closePath(); x.fill(); });
  const st = th.stone;
  T.stone = [0, 1].map(v => mk(x => {
    const g = x.createLinearGradient(0, 0, 16, 16); g.addColorStop(0, st.hi); g.addColorStop(1, st.lo);
    x.fillStyle = st.bg; x.fillRect(0, 0, 16, 16); x.fillStyle = g; rr(x, 0.4, 0.4, 15.2, 15.2, 1.5); x.fill();
    const g2 = x.createLinearGradient(0, 3, 0, 13); g2.addColorStop(0, st.in[0]); g2.addColorStop(1, st.in[1]);
    x.fillStyle = g2; rr(x, 3.2, 3.2, 9.6, 9.6, 1); x.fill();
    x.fillStyle = 'rgba(255,255,255,.3)'; x.fillRect(1.2, 1, 13.6, 0.6);
    if (v) { x.fillStyle = st.moss; x.beginPath(); x.ellipse(4, 1.4, 3.4, 1.2, 0, 0, 7); x.ellipse(11, 1.2, 2, 0.9, 0, 0, 7); x.fill(); }
  }));
  const pl = th.pillar;
  const colGrad = (x, off) => { const g = x.createLinearGradient(-off, 0, 32 - off, 0); [0, 0.18, 0.36, 0.62, 1].forEach((s, i) => g.addColorStop(s, pl.c[i])); return g; };
  const column = (x, off, cap) => {
    x.fillStyle = colGrad(x, off); x.fillRect(0, cap ? 7 : 0, 16, cap ? 9 : 16);
    if (pl.style === 'trunk') {
      x.strokeStyle = 'rgba(20,10,4,.45)'; x.lineWidth = 0.6;
      for (let i = 0; i < 5; i++) { const lx = 2 + i * 7 - off; if (lx > -2 && lx < 18) { x.beginPath(); x.moveTo(lx, cap ? 7 : 0); x.bezierCurveTo(lx + 1.5, 5, lx - 1.5, 10, lx + 0.5, 16); x.stroke(); } }
    } else {
      x.strokeStyle = 'rgba(40,36,70,.35)'; x.lineWidth = 0.5;
      for (let i = 3; i < 32; i += 4.4) { const lx = i - off; if (lx > 0 && lx < 16) { x.beginPath(); x.moveTo(lx, cap ? 7 : 0); x.lineTo(lx, 16); x.stroke(); } }
    }
    x.fillStyle = pl.dark; if (off === 0) x.fillRect(0, cap ? 7 : 0, 0.6, 16); else x.fillRect(15.4, cap ? 7 : 0, 0.6, 16);
    if (cap) {
      const g = x.createLinearGradient(-off, 0, 32 - off, 0); g.addColorStop(0, pl.cap[0]); g.addColorStop(0.35, pl.cap[1]); g.addColorStop(1, pl.cap[2]);
      if (pl.style === 'trunk') {
        x.fillStyle = pl.dark; x.fillRect(0, 4, 16, 3.4);
        x.fillStyle = g; x.beginPath(); for (let i = 0; i <= 16; i += 2) { x.ellipse(i, 3.2 + hsh(i + off) * 1.4, 2.6, 2.4, 0, 0, 7); } x.fill();
      } else {
        x.fillStyle = pl.dark; x.fillRect(0, 0, 16, 7.4);
        x.fillStyle = g; x.fillRect(off === 0 ? 0.5 : 0, 0.5, 15.5, 3.4); x.fillRect(off === 0 ? 1.4 : 0, 4.3, 14.6, 2.6);
        x.fillStyle = 'rgba(255,255,255,.4)'; x.fillRect(0, 0.6, 16, 0.5);
      }
    }
  };
  T.pilL = mk(x => column(x, 0, false)); T.pilR = mk(x => column(x, 16, false));
  T.capL = mk(x => column(x, 0, true)); T.capR = mk(x => column(x, 16, true));
  // one-way ledges: [left end, middle, right end, single]
  T.ledge = [0, 1, 2, 3].map(v => mk(x => ledgeTile(x, th.ledge, v)));
  T.ice = [0, 1].map(v => mk(x => {
    const g = x.createLinearGradient(0, 0, 16, 16); g.addColorStop(0, '#e8f4ff'); g.addColorStop(0.5, '#9cc8f0'); g.addColorStop(1, '#5a8ac8');
    x.fillStyle = '#2a4a7a'; x.fillRect(0, 0, 16, 16); x.fillStyle = g; rr(x, 0.4, 0.4, 15.2, 15.2, 1.4); x.fill();
    x.strokeStyle = 'rgba(255,255,255,.7)'; x.lineWidth = 0.6; x.beginPath(); x.moveTo(3, 3 + v * 4); x.lineTo(7, 2 + v * 3); x.moveTo(9, 12); x.lineTo(13, 9 - v * 2); x.stroke();
    x.fillStyle = 'rgba(255,255,255,.8)'; x.fillRect(1.2, 1, 13.6, 0.7);
  }));
  T.gate = mk(x => {
    x.fillStyle = '#140e22'; x.fillRect(0, 0, 16, 16);
    for (let i = 0; i < 3; i++) { const g = x.createLinearGradient(2 + i * 5, 0, 5 + i * 5, 0); g.addColorStop(0, '#3a3450'); g.addColorStop(0.5, '#8a82a8'); g.addColorStop(1, '#2a2440'); x.fillStyle = g; x.fillRect(2 + i * 5, 0, 3, 16); }
    x.fillStyle = '#5a5270'; x.fillRect(0, 6.5, 16, 2.4); x.fillStyle = 'rgba(255,255,255,.25)'; x.fillRect(0, 6.5, 16, 0.5);
  });
}

function ledgeTile(x, style, v) {
  const L = v === 0 || v === 3, Rt = v === 2 || v === 3;
  if (style === 'branch') {
    const g = x.createLinearGradient(0, 1, 0, 7); g.addColorStop(0, '#9a6c48'); g.addColorStop(1, '#4a3020');
    x.fillStyle = g; rr(x, L ? 1 : -2, 1, (L ? 15 : 18) - (Rt ? 1 : -2) + (L ? 0 : 0), 5.2, 2.4); x.fill();
    x.strokeStyle = 'rgba(30,16,8,.5)'; x.lineWidth = 0.4; x.beginPath(); x.moveTo(0, 3.6); x.bezierCurveTo(5, 3, 10, 4.2, 16, 3.4); x.stroke();
    x.fillStyle = '#3f9a52'; x.beginPath(); x.ellipse(4 + v * 3, 1.2, 2.6, 1.2, -0.3, 0, 7); x.fill();
    x.fillStyle = '#7fd49a'; x.beginPath(); x.ellipse(11 - v, 1.4, 1.8, 0.9, 0.4, 0, 7); x.fill();
  } else if (style === 'line') {
    // a washing line with laundry pegged to it
    x.strokeStyle = '#e8dcc8'; x.lineWidth = 0.6; x.beginPath(); x.moveTo(0, 1.2); x.quadraticCurveTo(8, 2.2, 16, 1.2); x.stroke();
    const cols = ['#f07a8c', '#4fd8c8', '#ffd68a', '#a59cc9', '#efeaff'];
    const k = v === 3 ? 1 : 2;
    for (let i = 0; i < k; i++) {
      const cx = 3 + i * 7 + (v % 2) * 2, col = cols[(v * 2 + i) % cols.length];
      x.fillStyle = col;
      if ((v + i) % 2) { x.beginPath(); x.moveTo(cx - 3, 1.6); x.lineTo(cx + 3, 1.6); x.lineTo(cx + 3.6, 4); x.lineTo(cx + 2, 4.4); x.lineTo(cx + 2, 9); x.lineTo(cx - 2, 9); x.lineTo(cx - 2, 4.4); x.lineTo(cx - 3.6, 4); x.closePath(); x.fill(); }
      else { x.fillRect(cx - 1.4, 1.6, 2.4, 6); x.fillRect(cx - 1.4, 6.2, 3.8, 2); }
      x.fillStyle = '#6a5040'; x.fillRect(cx - 0.4, 0.8, 0.8, 1.6);
    }
  } else if (style === 'cloud') {
    x.fillStyle = 'rgba(240,236,255,.95)'; x.beginPath();
    for (let i = 0; i < 4; i++) x.ellipse(2 + i * 4, 4 + hsh(v * 7 + i) * 1.2, 3.4, 3.2, 0, 0, 7);
    x.fill(); x.fillStyle = 'rgba(180,160,220,.6)'; x.fillRect(0, 6.6, 16, 1.2);
  } else {
    const g = x.createLinearGradient(0, 0, 0, 5); g.addColorStop(0, '#c89060'); g.addColorStop(1, '#7a4a2a');
    x.fillStyle = g; x.fillRect(L ? 0.5 : 0, 0.5, 16 - (L ? 0.5 : 0) - (Rt ? 0.5 : 0), 4.6);
    x.fillStyle = 'rgba(255,255,255,.3)'; x.fillRect(0, 0.6, 16, 0.5);
    x.fillStyle = '#3a2210'; x.fillRect(7.6, 0.5, 0.6, 4.6);
    x.fillStyle = '#b4b4c8'; x.beginPath(); x.arc(3, 2.8, 0.6, 0, 7); x.arc(12, 2.8, 0.6, 0, 7); x.fill();
    if (L || Rt) { x.fillStyle = '#4a3020'; x.fillRect(L ? 2 : 12, 5, 2, 3); }
  }
}
