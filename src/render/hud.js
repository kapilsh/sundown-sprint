// =============== Render: HUD, menus, overlays ===============
import { R, VH } from './ctx.js';
import { SUB, hex } from '../physics.js';
import { clamp, rr, FONT, MONO, mix } from '../util.js';
import { THEMES, WORLDS } from '../themes.js';

function pill(x, y, w, h) { const { ctx } = R; ctx.fillStyle = 'rgba(12,8,30,0.55)'; rr(ctx, x, y, w, h, h / 2); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.09)'; ctx.lineWidth = 0.5; ctx.stroke(); }
export function hudLantern(x, y, lit = true) {
  const { ctx } = R;
  ctx.fillStyle = '#e8dcff'; rr(ctx, x - 3, y - 3.5, 6, 8, 1); ctx.fill(); ctx.fillRect(x - 1.5, y - 5, 3, 1.4);
  ctx.fillStyle = lit ? '#ffb65c' : '#3c3054'; ctx.fillRect(x - 2, y - 2.3, 4, 5.4);
  if (lit) { ctx.fillStyle = '#fff4c8'; ctx.beginPath(); ctx.ellipse(x, y + 0.6, 0.8, 1.5, 0, 0, 7); ctx.fill(); }
}
function gemIcon(x, y, s = 0.7) {
  const { ctx } = R;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); const g = ctx.createLinearGradient(-5, -5, 5, 6); g.addColorStop(0, '#e8fffb'); g.addColorStop(1, '#16807c');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-3, -5); ctx.lineTo(3, -5); ctx.lineTo(5, -2); ctx.lineTo(0, 6); ctx.lineTo(-5, -2); ctx.closePath(); ctx.fill(); ctx.restore();
}
function card(w, h, y) { const { ctx, VW } = R; const x = (VW - w) / 2; y = y ?? (VH - h) / 2; ctx.fillStyle = 'rgba(14,10,34,0.82)'; rr(ctx, x, y, w, h, 10); ctx.fill(); ctx.strokeStyle = 'rgba(255,190,120,.25)'; ctx.lineWidth = 0.6; ctx.stroke(); return [x, y]; }
export function ctext(s, y, font, col, x) { const { ctx, VW } = R; ctx.font = font; ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.fillText(s, x ?? VW / 2, y); ctx.textAlign = 'left'; }

export function drawHUD(G, W, inp) {
  const { ctx, S, VW } = R;
  ctx.setTransform(S, 0, 0, S, 0, 0);
  ctx.textBaseline = 'middle';
  pill(10, 10, 176, 22);
  hudLantern(24, 21); ctx.fillStyle = '#efeaff'; ctx.font = `700 11px ${FONT}`; ctx.fillText(G.test ? '×∞' : '×' + W.lives, 31, 21.5);
  gemIcon(56, 21);
  ctx.fillStyle = '#efeaff'; ctx.fillText(String(W.gems).padStart(2, '0'), 63, 21.5);
  ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(86, 15, 0.6, 12);
  ctx.fillStyle = '#a59cc9'; ctx.font = `500 7px ${FONT}`; ctx.fillText('SCORE', 94, 21.5);
  ctx.fillStyle = '#efeaff'; ctx.font = `800 12px ${FONT}`; ctx.fillText(String(W.score).padStart(6, '0'), 122, 21.5);
  // level tag
  const tag = (G.watch ? 'BOT · ' : G.test ? 'TEST · ' : '') + W.id;
  ctx.font = `700 9px ${FONT}`; const tw = ctx.measureText(tag).width + 18;
  pill(VW / 2 - tw / 2, 10, tw, 22); ctx.textAlign = 'center'; ctx.fillStyle = G.test ? '#4fd8c8' : '#ffd68a'; ctx.fillText(tag, VW / 2, 21.5); ctx.textAlign = 'left';
  // timer
  const tx = VW - 72; pill(tx, 10, 62, 22);
  const frac = clamp(W.time / (W.lv.time || 300), 0, 1), hurry = W.time <= 100 && W.state === 'play';
  ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(tx + 13, 21, 6, 0, 7); ctx.stroke();
  ctx.strokeStyle = hurry ? '#f07a8c' : '#ffb65c'; ctx.beginPath(); ctx.arc(tx + 13, 21, 6, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); ctx.stroke();
  ctx.fillStyle = hurry && (R.frame >> 4) % 2 ? '#f07a8c' : '#efeaff'; ctx.font = `800 12px ${FONT}`; ctx.fillText(String(Math.max(0, W.time)).padStart(3, '0'), tx + 24, 21.5);
  // boss health
  if (W.boss && !W.boss.dead) {
    const b = W.boss, w = 120, x = VW / 2 - w / 2, y = 38;
    pill(x - 6, y - 4, w + 12, 16); ctx.fillStyle = '#a59cc9'; ctx.font = `700 6.5px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText(W.lv.boss.name || 'GLOOMLING', VW / 2, y + 1.5); ctx.textAlign = 'left';
    for (let i = 0; i < b.max; i++) { const pw = (w - (b.max - 1) * 2) / b.max; ctx.fillStyle = i < b.hp ? '#f07a8c' : 'rgba(255,255,255,.12)'; rr(ctx, x + i * (pw + 2), y + 5, pw, 3.5, 1.5); ctx.fill(); }
  }
  if (W.windOn) { ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.font = `700 8px ${FONT}`; ctx.fillText(W.wind.dir > 0 ? 'gust ≫' : '≪ gust', VW - 60, 42); }
  if (G.watch && (R.frame >> 5) % 4 !== 3) {
    ctx.font = `700 8px ${FONT}`; const t = 'Watching the bot play  ·  Esc to stop', w = ctx.measureText(t).width + 20;
    pill(VW / 2 - w / 2, VH - 26, w, 16); ctx.textAlign = 'center'; ctx.fillStyle = '#ffd68a'; ctx.fillText(t, VW / 2, VH - 17.5); ctx.textAlign = 'left';
  }
  if (G.debug) {
    const h = W.hero; pill(10, 36, 150, 46); ctx.font = `500 7px ${MONO}`; ctx.fillStyle = '#9ffff2';
    const sg = v => (v < 0 ? '-' : ' ') + hex(Math.abs(v));
    ctx.fillText(`vx ${sg(h.vx)}  ${(h.vx / SUB).toFixed(3)} px/f`, 18, 45);
    ctx.fillText(`vy ${sg(h.vy)}  ${(h.vy / SUB).toFixed(3)} px/f`, 18, 54);
    ctx.fillStyle = '#ffb65c'; const holding = !h.ground && inp.jump && h.vy < 0;
    ctx.fillText(`g  ${hex(holding ? h.hold : h.fall)}  ${h.wet ? 'swim' : h.ground ? 'ground' : holding ? 'hold' : 'fall'}${h.skid ? ' · skid' : ''}${h.surface === 'I' && h.ground ? ' · ice' : ''}`, 18, 63);
    ctx.fillStyle = '#efeaff'; ctx.fillText(`coyote ${h.coyote}  buffer ${h.buffer}  ${W.assist ? 'assists' : 'strict'}`, 18, 72);
  }
  ctx.textBaseline = 'alphabetic';
}

export function drawTitle(G) {
  const { ctx, VW } = R;
  const g = ctx.createLinearGradient(0, 40, 0, 200); g.addColorStop(0, 'rgba(10,6,28,0)'); g.addColorStop(0.5, 'rgba(10,6,28,0.45)'); g.addColorStop(1, 'rgba(10,6,28,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 40, VW, 160);
  ctx.save(); ctx.shadowColor = 'rgba(255,150,90,.6)'; ctx.shadowBlur = 18 * R.S;
  const tg = ctx.createLinearGradient(VW / 2 - 130, 0, VW / 2 + 130, 0); tg.addColorStop(0, '#ffd68a'); tg.addColorStop(0.5, '#ff9a6a'); tg.addColorStop(1, '#f07a8c');
  ctext('Sundown Sprint', 104, `800 42px ${FONT}`, tg); ctx.restore();
  ctext('Get Dusky home before the lanterns go out', 124, `500 10px ${FONT}`, '#e6dcff');
  const a = 0.55 + Math.sin(R.frame * 0.08) * 0.45; ctext('Press Enter or tap to start', 152, `700 11px ${FONT}`, `rgba(255,214,150,${a})`);
  ctext('Z jump  ·  X run  ·  arrows move  ·  Esc menu', 170, `500 8px ${FONT}`, '#a59cc9');
  if (G.test) ctext('TEST MODE: every level unlocked, infinite lanterns', 196, `700 8px ${FONT}`, '#4fd8c8');
}

// Level select: 11 worlds × 4 levels.
export function drawSelect(G, index, save) {
  const { ctx, VW } = R;
  ctx.fillStyle = 'rgba(8,5,22,0.55)'; ctx.fillRect(0, 0, VW, VH);
  ctx.textBaseline = 'middle';
  ctext('Choose a level', 20, `800 15px ${FONT}`, '#ffd68a');
  const x0 = VW / 2 - 150, y0 = 38, rowH = 15.2;
  for (let w = 0; w < 11; w++) {
    const y = y0 + w * rowH, th = THEMES[WORLDS[w]];
    const worldSel = Math.floor(G.sel / 4) === w;
    if (worldSel) { ctx.fillStyle = 'rgba(255,182,92,0.1)'; rr(ctx, x0 - 6, y - 7, 312, 14, 7); ctx.fill(); }
    ctx.font = `800 8px ${FONT}`; ctx.fillStyle = worldSel ? '#ffd68a' : '#a59cc9'; ctx.fillText(String(w + 1), x0, y + 0.5);
    ctx.font = `600 8px ${FONT}`; ctx.fillStyle = worldSel ? '#efeaff' : '#8a82b0'; ctx.fillText(th.name, x0 + 14, y + 0.5);
    ctx.fillStyle = mix(th.sky[2][0], th.sky[3][0], 0.5); ctx.beginPath(); ctx.arc(x0 + 118, y, 2.2, 0, 7); ctx.fill();
    for (let l = 0; l < 4; l++) {
      const i = w * 4 + l, id = `${w + 1}-${l + 1}`, has = index.some(e => e.id === id), open = has && (G.test || i <= save.unlocked);
      const nx = x0 + 150 + l * 38, sel = G.sel === i;
      ctx.fillStyle = sel ? '#ffb65c' : open ? (save.cleared[id] ? '#2d6a5e' : '#2d2452') : 'rgba(45,36,82,0.35)';
      rr(ctx, nx, y - 5.5, 32, 11, 5.5); ctx.fill();
      if (sel) { ctx.strokeStyle = '#fff0c8'; ctx.lineWidth = 0.7; ctx.stroke(); }
      ctx.font = `700 7px ${FONT}`; ctx.fillStyle = sel ? '#1a1030' : open ? '#efeaff' : '#5a5080'; ctx.textAlign = 'center';
      ctx.fillText(has ? id : '·', nx + 16, y + 0.5); ctx.textAlign = 'left';
      if (save.cleared[id] && !sel) { ctx.fillStyle = '#6ff0e0'; ctx.beginPath(); ctx.arc(nx + 29, y - 4, 1.4, 0, 7); ctx.fill(); }
      if (l === 3) { ctx.fillStyle = sel ? '#1a1030' : '#f07a8c'; ctx.beginPath(); ctx.arc(nx + 3.5, y, 1.1, 0, 7); ctx.fill(); }
    }
  }
  const id = `${Math.floor(G.sel / 4) + 1}-${G.sel % 4 + 1}`, e = index.find(e => e.id === id);
  const open = e && (G.test || G.sel <= save.unlocked);
  const info = e ? (open ? `${id}  ${e.name}${save.best[id] ? `  ·  best ${save.best[id]}` : ''}` : `${id}  locked: clear the level before it`) : `${id}  not built yet`;
  ctext(info, VH - 22, `700 9px ${FONT}`, open ? '#efeaff' : '#8a82b0');
  ctext(G.test ? 'TEST MODE  ·  arrows pick  ·  Enter play  ·  V watch the bot  ·  [ ] skip levels in game' : 'Arrows pick  ·  Enter play  ·  V watch the bot  ·  Esc title', VH - 10, `500 7px ${FONT}`, G.test ? '#4fd8c8' : '#a59cc9');
  ctx.textBaseline = 'alphabetic';
}

export function drawIntro(G, W, th) {
  const { ctx, VW } = R;
  ctx.fillStyle = '#07051a'; ctx.fillRect(0, 0, VW, VH);
  const a = clamp(G.t / 15, 0, 1);
  ctx.globalAlpha = a;
  if (G.watch) ctext('WATCH MODE: the bot is playing', 70, `700 8px ${FONT}`, '#4fd8c8');
  ctext(`World ${W.id}`, 96, `800 20px ${FONT}`, '#ffd68a');
  ctext(W.lv.name, 116, `600 11px ${FONT}`, '#efeaff');
  ctext(th.name, 132, `500 8px ${FONT}`, '#a59cc9');
  hudLantern(VW / 2 - 14, 158); ctext(G.test ? '× ∞' : `× ${W.lives}`, 162, `700 11px ${FONT}`, '#efeaff', VW / 2 + 6);
  if (W.lv.boss) ctext('A Gloomling blocks the path', 190, `700 8px ${FONT}`, '#f07a8c');
  if (W.lv.under) ctext('The path runs underground', 190, `700 8px ${FONT}`, '#9ab0ff');
  ctx.globalAlpha = 1;
}

export function drawOverlays(G, W, nextExists) {
  const { ctx, S, VW } = R;
  ctx.setTransform(S, 0, 0, S, 0, 0);
  if (G.mode === 'paused') {
    card(170, 62); ctext('Paused', 116, `800 18px ${FONT}`, '#efeaff');
    ctext('Enter resume  ·  Esc level select', 132, `500 8px ${FONT}`, '#a59cc9');
    if (G.test) ctext('R restart  ·  [ ] previous / next level', 143, `500 7px ${FONT}`, '#4fd8c8');
  } else if (G.mode === 'over') {
    card(210, 76); ctext('The lanterns went out', 110, `800 16px ${FONT}`, '#ffb65c');
    ctext(`Final score ${W.score}`, 128, `500 9px ${FONT}`, '#efeaff'); if (G.t > 40) ctext('Press Enter', 144, `600 8px ${FONT}`, '#a59cc9');
  } else if (G.mode === 'cleared') {
    const [x, y] = card(230, 100);
    ctext(W.lv.boss ? 'Gloomling routed!' : 'Dusky made it to the hut', y + 24, `800 16px ${FONT}`, '#ffb65c');
    ctx.font = `500 9px ${FONT}`;
    [['Lantern bonus', W.poleScore], ['Gems', W.gems], ['Score', W.score]].forEach(([k, v], i) => {
      ctx.textAlign = 'left'; ctx.fillStyle = '#a59cc9'; ctx.fillText(k, x + 34, y + 44 + i * 12);
      ctx.textAlign = 'right'; ctx.fillStyle = '#efeaff'; ctx.fillText(String(v), x + 196, y + 44 + i * 12); });
    ctx.textAlign = 'left';
    if (G.t > 40) ctext(nextExists ? 'Enter for the next level' : 'That is every level built so far. Enter for the menu', y + 88, `600 8px ${FONT}`, '#d6ccff');
  } else if (G.mode === 'ending') drawEnding(G, W);
  if (G.fade > 0.01) {
    ctx.fillStyle = `rgba(4,2,12,${G.fade})`; ctx.fillRect(0, 0, VW, VH);
    if (W && W.state === 'dying' && W.t > 130) ctext(G.test ? 'Try again' : W.lives - 1 > 0 ? `${W.lives - 1} lantern${W.lives - 1 === 1 ? '' : 's'} left` : 'Last light', 124, `700 16px ${FONT}`, '#efeaff');
  }
}
function drawEnding(G, W) {
  const { ctx, VW } = R;
  ctx.fillStyle = `rgba(8,5,22,${clamp(G.t / 60, 0, 0.7)})`; ctx.fillRect(0, 0, VW, VH);
  ctext('Home before dark', 90, `800 24px ${FONT}`, '#ffd68a');
  ctext('Dusky hangs the lantern by the door. The whole valley is lit.', 112, `500 9px ${FONT}`, '#efeaff');
  ctext(`Final score ${W.score}`, 136, `700 10px ${FONT}`, '#ffb65c');
  if (G.t > 90) ctext('Thanks for playing. Enter for the menu', 170, `600 8px ${FONT}`, '#a59cc9');
}
