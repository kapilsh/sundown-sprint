// =============== Main: state machine, progression, save, test mode, loop ===============
import { P, JUMPS, SUB, hex } from './physics.js';
import { clamp, FONT } from './util.js';
import { createWorld, step, updateCamera } from './sim.js';
import { THEMES } from './themes.js';
import { R, VH } from './render/ctx.js';
import { buildTiles } from './render/tiles.js';
import { drawSky, drawUnderBg } from './render/sky.js';
import { FX, resetFx, consumeEvents, updateFx, drawParts, drawPops, drawAmbient } from './render/fx.js';
import { drawDoors, drawFire, isUnder, drawCheckpoints, drawTiles, drawWater, drawGrass, drawGem, animHero, drawDusky, drawEnemy, drawItem, drawPlat, drawSpring, drawShot, drawBoss, drawPoleAndHut, drawForeground, drawLighting } from './render/world.js';
import { drawHUD, drawTitle, drawSelect, drawIntro, drawOverlays } from './render/hud.js';
import { audioInit, playSfx, musicStart, musicStop, musicPlaying, setMusicOn, audio, setAmbientChirps } from './audio.js';
import { initInput, poll, inp, tapStart } from './input.js';
import { pathInputs } from './replay.js';

R.font = FONT;

// ---------- physics table on the page ----------
document.getElementById('phys').innerHTML = [
  ['Walk accel', P.WALK_ACC], ['Run accel', P.RUN_ACC], ['Release decel', P.REL_DEC], ['Skid decel', P.SKID_DEC],
  ['Max walk', P.MAX_WALK], ['Max run', P.MAX_RUN], ['Jump v (slow)', JUMPS[0].v], ['Hold gravity (slow)', JUMPS[0].hold],
  ['Fall gravity (slow)', JUMPS[0].fall], ['Jump v (run)', JUMPS[2].v], ['Hold gravity (run)', JUMPS[2].hold],
  ['Fall gravity (run)', JUMPS[2].fall], ['Terminal fall', P.MAX_FALL]
].map(([n, v]) => `<tr><td>${n}</td><td class="hex">${hex(v)}</td><td>${(v / SUB).toFixed(4)}</td></tr>`).join('');

// ---------- save (localStorage, guarded) ----------
const SAVE_KEY = 'sundown-sprint:v1';
function loadSave() {
  try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s && typeof s.unlocked === 'number') return { unlocked: s.unlocked, best: s.best || {}, cleared: s.cleared || {} }; } catch (_) {}
  return { unlocked: 0, best: {}, cleared: {} };
}
function writeSave() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (_) {} }
const save = loadSave();

// ---------- levels ----------
let index = [];
const cache = new Map();
async function fetchLevel(id) {
  if (!cache.has(id)) cache.set(id, fetch(`levels/w${id}.json`).then(r => { if (!r.ok) throw new Error(`level ${id}: ${r.status}`); return r.json(); }));
  return cache.get(id);
}
const idOf = i => `${Math.floor(i / 4) + 1}-${i % 4 + 1}`;
const idxOf = id => { const [w, l] = id.split('-').map(Number); return (w - 1) * 4 + (l - 1); };
const exists = i => i >= 0 && i < 44 && index.some(e => e.id === idOf(i));

// ---------- state ----------
const params = new URLSearchParams(location.search);
const G = { mode: 'title', t: 0, sel: 0, cur: 0, W: null, test: params.has('test') || params.has('level'), debug: false, assist: true, fade: 0, loading: false,
  demo: null, carry: null, feed: null, watch: null, toast: null };
const cv = document.getElementById('screen');
R.cv = cv; R.ctx = cv.getContext('2d');

function setTheme(id) {
  const th = THEMES[id] || THEMES.hills;
  if (R.theme !== th) { R.theme = th; if (R.cv.width) buildTiles(th); FX.amb = []; }
}

async function startLevel(i, carry, watch = null) {
  if (!exists(i) || G.loading) return;
  G.watch = watch; G.feed = null;
  G.loading = true;
  try {
    const lv = await fetchLevel(idOf(i));
    G.cur = i; G.sel = i;
    // Watch mode replays the solver's recorded inputs, which assume assists on and a fresh run.
    G.W = createWorld(lv, { assist: watch ? true : G.assist, score: carry.score, gems: carry.gems, lives: carry.lives, glow: watch ? false : carry.glow, checkpoint: watch ? -1 : carry.cp ?? -1 });
    if (watch) G.feed = pathInputs(watch.path);
    G.carry = carry;
    setTheme(lv.theme); resetFx(); musicStop();
    G.mode = 'intro'; G.t = 0; G.fade = 0; G.under = isUnder(G.W, Math.floor((G.W.hero.x / SUB + 8) / 16));
    updateTestSelect();
  } catch (e) { console.error(e); }
  G.loading = false;
}
function beginPlay() { G.mode = 'play'; G.t = 0; startMusic(false); }
function startMusic(boss) { if (audio.on) musicStart(R.theme.music, boss, !boss && G.under); }
function restartLevel() { const W = G.W; startLevel(G.cur, { score: W.score, gems: W.gems, lives: W.lives, glow: false, cp: W.cp }); }
const freshRun = () => ({ score: 0, gems: 0, lives: 3, glow: false });

// ---------- watch mode ----------
let replays = null;
async function loadReplays() {
  if (!replays) { try { replays = await (await fetch('levels/replays.json')).json(); } catch (_) { replays = {}; } }
  return replays;
}
async function watchLevel(i, playlist) {
  const r = await loadReplays(), path = r[idOf(i)];
  if (!path) { playSfx('deny'); G.toast = { text: `No bot run recorded for ${idOf(i)} yet (npm run replays)`, t: 180 }; if (G.mode !== 'select') toSelect(); return false; }
  const W = G.W, carry = playlist && W && G.watch ? { score: W.score, gems: W.gems, lives: W.lives, glow: false } : freshRun();
  await startLevel(i, carry, { path, playlist });
  return true;
}

function toSelect() { G.watch = null; G.feed = null; G.mode = 'select'; G.t = 0; musicStop(); G.fade = 0; setTheme(WORLD_THEME(G.sel)); }

// ---------- per-tick update ----------
function onSfx(n) { playSfx(n); }
function onMusic(e) {
  if (e.on === false) musicStop();
  if (e.resume && G.mode === 'play') startMusic(!!(G.W && G.W.boss && !G.W.boss.dead));
  if (e.boss === true) startMusic(true);
  if (e.boss === false) { musicStop(); setTimeout(() => { if (G.mode === 'play' && G.W && G.W.state === 'play') startMusic(false); }, 1600); }
}
function update() {
  poll(); R.frame++; G.t++;
  const W = G.W;
  if (G.mode === 'title') {
    if (G.demo) { G.demo.camX = (Math.sin(R.frame * 0.0025 - 1.2) * 0.5 + 0.5) * 900; updateFx(G.demo); }
    if (inp.startP || inp.jumpBtnP) { playSfx('select'); G.sel = G.test ? G.sel : Math.min(save.unlocked, 43); toSelect(); }
    return;
  }
  if (G.mode === 'select') {
    const move = d => { const n = clamp(G.sel + d, 0, 43); if (n !== G.sel) { G.sel = n; playSfx('move'); setTheme(WORLD_THEME(n)); } };
    if (inp.rightP) move(1); if (inp.leftP) move(-1); if (inp.downP) move(4); if (inp.upP) move(-4);
    if (inp.backP) { G.mode = 'title'; setTheme('hills'); return; }
    if (keyWatch) { keyWatch = false; watchLevel(G.sel, true); return; }
    if (inp.startP || inp.jumpBtnP) {
      if (exists(G.sel) && (G.test || G.sel <= save.unlocked)) { playSfx('select'); startLevel(G.sel, freshRun()); }
      else playSfx('deny');
    }
    return;
  }
  if (!W) return;
  if (G.mode === 'intro') { if (G.t > 100 || (G.t > 20 && (inp.startP || inp.jumpBtnP))) beginPlay(); return; }
  if (G.mode === 'over' || G.mode === 'cleared' || G.mode === 'ending') {
    updateFx(W);
    if (G.watch) {
      if (inp.backP) { toSelect(); return; }
      if (G.t > 150) { if (G.mode === 'cleared' && G.watch.playlist && exists(G.cur + 1)) { if (!G.loading) watchLevel(G.cur + 1, true).then(ok => { if (!ok) toSelect(); }); } else toSelect(); }
      return;
    }
    if (G.t > 40 && (inp.startP || inp.jumpBtnP)) {
      if (G.mode === 'cleared' && exists(G.cur + 1)) startLevel(G.cur + 1, { score: W.score, gems: W.gems, lives: W.lives, glow: W.keepGlow });
      else if (G.mode === 'cleared' && G.cur === 43) { G.mode = 'ending'; G.t = 0; }
      else toSelect();
    }
    return;
  }
  if (G.mode === 'paused') {
    if (inp.startP) { G.mode = 'play'; if (audio.on && !musicPlaying() && W.state === 'play') startMusic(!!(W.boss && !W.boss.dead)); }
    if (inp.backP) toSelect();
    return;
  }
  // play
  if (G.watch && inp.backP) { toSelect(); return; }
  if (inp.startP || inp.backP) { if (W.state === 'play') { G.mode = 'paused'; musicStop(); return; } }
  const fadeTo = (W.state === 'dying' && W.t > 120) || W.state === 'dead' ? 1 : 0; G.fade += (fadeTo - G.fade) * 0.1;
  if (W.state === 'door') G.fade = W.t < 24 ? W.t / 22 : Math.max(0, (48 - W.t) / 22);
  // G.feed (set by automated checks) replays recorded inputs instead of the live controls.
  step(W, G.feed && G.feed.length ? G.feed.shift() : { left: inp.left, right: inp.right, jump: inp.jump, run: inp.run, jumpP: inp.jumpP });
  consumeEvents(W, onSfx, onMusic);
  animHero(W); updateFx(W);
  // going underground (or back up) swaps the music
  const under = isUnder(W, Math.floor((W.hero.x / SUB + 8) / 16));
  if (under !== G.under) { G.under = under; if (W.state === 'play' && musicPlaying() && !(W.boss && !W.boss.dead)) startMusic(false); }
  if (W.state === 'door') G.under = isUnder(W, W.door.to[0]);
  if (W.state === 'dead') {
    if (G.watch) { toSelect(); return; }
    if (G.test) { restartLevel(); return; }
    W.lives--;
    if (W.lives <= 0) { G.mode = 'over'; G.t = 0; G.fade = 0; }
    else startLevel(G.cur, { score: W.score, gems: W.gems, lives: W.lives, glow: false, cp: W.cp });
  } else if (W.state === 'done') {
    G.mode = 'cleared'; G.t = 0;
    if (!G.test && !G.watch) {
      save.cleared[W.id] = 1; save.best[W.id] = Math.max(save.best[W.id] || 0, W.score);
      save.unlocked = Math.max(save.unlocked, Math.min(G.cur + 1, 43)); writeSave();
    }
  }
}
const WORLD_THEME = n => ['hills', 'woods', 'cave', 'roofs', 'marsh', 'frost', 'clouds', 'clock', 'ember', 'stars', 'home'][Math.floor(n / 4)];

// ---------- render ----------
function worldXform(W, shake = 0) { const { ctx, S } = R; const sx = (Math.random() - 0.5) * shake * 2, sy = (Math.random() - 0.5) * shake * 2; ctx.setTransform(S, 0, 0, S, Math.round((-W.camX + sx) * S), Math.round(sy * S)); }
function renderWorld(W, opts = {}) {
  const { ctx, cv } = R;
  R.lights = []; R.blooms = [];
  const p = opts.prog ?? W.prog;
  drawSky(p, W.camX); drawUnderBg(W);
  W.shake *= 0.86; if (W.shake < 0.05) W.shake = 0;
  worldXform(W, W.shake);
  drawPoleAndHut(W); drawCheckpoints(W); drawDoors(W); drawTiles(W); drawGrass(W);
  for (const s of W.springs) if (s.x > W.camX - 20 && s.x < W.camX + R.VW + 4) drawSpring(s);
  for (const pl of W.plats) if (pl.x + pl.w > W.camX - 4 && pl.x < W.camX + R.VW + 4) drawPlat(pl);
  for (const g of W.gemList) if (!g.got && g.x > W.camX - 16 && g.x < W.camX + R.VW + 4) drawGem(g.x, g.y);
  for (const it of W.items) drawItem(it);
  for (const e of W.enemies) drawEnemy(W, e);
  drawBoss(W); drawFire(W);
  if (!opts.noHero) drawDusky(W);
  for (const s of W.shots) drawShot(s);
  drawWater(W);
  drawParts(false); drawAmbient(p); drawPops();
  const th = R.theme, dark = opts.dark ?? (th.dark[0] + p * th.dark[1]);
  drawLighting(W.camX, dark, W.lv.under);
  worldXform(W); ctx.globalCompositeOperation = 'lighter';
  for (const [x, y, r, c] of R.blooms) { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, c); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); }
  drawParts(true); ctx.globalCompositeOperation = 'source-over';
  ctx.setTransform(R.S, 0, 0, R.S, 0, 0); drawForeground(W.camX, W.lv.under);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(R.VIG, 0, 0);
  ctx.globalAlpha = 0.035; ctx.fillStyle = ctx.createPattern(R.GRAIN, 'repeat'); ctx.save(); ctx.translate(Math.random() * 160, Math.random() * 160); ctx.fillRect(-160, -160, cv.width + 160, cv.height + 160); ctx.restore(); ctx.globalAlpha = 1;
}
let selCam = 0;
function render() {
  const { ctx, S } = R;
  if (G.toast && --G.toast.t <= 0) G.toast = null;
  if (G.mode === 'title') {
    if (G.demo) renderWorld(G.demo, { prog: 0.15, dark: 0.3, noHero: true });
    ctx.setTransform(S, 0, 0, S, 0, 0); drawTitle(G); return;
  }
  if (G.mode === 'select') {
    selCam += 0.4; R.lights = []; R.blooms = [];
    drawSky(0.35, selCam);
    ctx.setTransform(S, 0, 0, S, 0, 0); drawSelect(G, index, save); drawToast(); return;
  }
  const W = G.W; if (!W) return;
  if (G.mode === 'intro') { ctx.setTransform(S, 0, 0, S, 0, 0); drawIntro(G, W, R.theme); return; }
  renderWorld(W);
  drawHUD(G, W, inp);
  drawOverlays(G, W, exists(G.cur + 1));
}

function drawToast() {
  if (!G.toast) return;
  const { ctx, VW } = R;
  ctx.font = `700 8px ${FONT}`; const w = ctx.measureText(G.toast.text).width + 24;
  ctx.globalAlpha = Math.min(1, G.toast.t / 20);
  ctx.fillStyle = 'rgba(58,20,30,0.92)'; ctx.beginPath(); ctx.roundRect(VW / 2 - w / 2, VH - 58, w, 18, 9); ctx.fill();
  ctx.fillStyle = '#ffd0d8'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(G.toast.text, VW / 2, VH - 48.5);
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.globalAlpha = 1;
}

// ---------- canvas & resolution ----------
function resize() {
  const r = cv.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
  let h = Math.floor((r.width * dpr * 9 / 16) / 120) * 120; h = clamp(h, 480, 1200);
  const w = Math.round(h * 16 / 9);
  if (cv.width === w && cv.height === h) return;
  cv.width = w; cv.height = h; R.S = h / VH; R.VW = w / R.S;
  R.LC = document.createElement('canvas'); R.LC.width = Math.ceil(w / 2); R.LC.height = Math.ceil(h / 2); R.lctx = R.LC.getContext('2d');
  R.VIG = document.createElement('canvas'); R.VIG.width = w; R.VIG.height = h;
  const v = R.VIG.getContext('2d'), g = v.createRadialGradient(w / 2, h * 0.55, h * 0.35, w / 2, h / 2, w * 0.72);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(4,2,12,0.55)'); v.fillStyle = g; v.fillRect(0, 0, w, h);
  R.GRAIN = document.createElement('canvas'); R.GRAIN.width = R.GRAIN.height = 160;
  const gx = R.GRAIN.getContext('2d'), id = gx.createImageData(160, 160);
  for (let i = 0; i < id.data.length; i += 4) { const n = Math.random() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = n; id.data[i + 3] = 255; }
  gx.putImageData(id, 0, 0);
  if (R.theme) buildTiles(R.theme);
}
new ResizeObserver(resize).observe(cv);

// ---------- page controls ----------
const bS = document.getElementById('btnSound'), bD = document.getElementById('btnDebug'), bA = document.getElementById('btnAssist'), bT = document.getElementById('btnTest');
const tSel = document.getElementById('testLevel'), tWrap = document.getElementById('testWrap'), bW = document.getElementById('btnWatch');
let keyWatch = false;
function toggleMusic() { setMusicOn(!audio.on); audioInit(); if (audio.on && G.mode === 'play' && !musicPlaying()) startMusic(!!(G.W && G.W.boss && !G.W.boss.dead)); bS.setAttribute('aria-pressed', audio.on); bS.textContent = audio.on ? 'Music on' : 'Music off'; }
function toggleDebug() { G.debug = !G.debug; bD.setAttribute('aria-pressed', G.debug); }
function toggleAssist() { G.assist = !G.assist; if (G.W) G.W.assist = G.assist; bA.setAttribute('aria-pressed', G.assist); bA.textContent = G.assist ? 'Modern assists on' : 'Strict 1985 rules'; }
function setTest(on) {
  G.test = on; bT.setAttribute('aria-pressed', on); bT.textContent = on ? 'Test mode on' : 'Test mode'; tWrap.hidden = !on;
  const u = new URL(location.href); if (on) u.searchParams.set('test', ''); else { u.searchParams.delete('test'); u.searchParams.delete('level'); }
  history.replaceState(null, '', u.toString().replace(/test=(&|$)/, 'test$1'));
}
function updateTestSelect() { if (G.W) tSel.value = G.W.id; }
bS.addEventListener('click', () => { toggleMusic(); cv.focus(); });
bD.addEventListener('click', () => { toggleDebug(); cv.focus(); });
bA.addEventListener('click', () => { toggleAssist(); cv.focus(); });
bT.addEventListener('click', () => { setTest(!G.test); cv.focus(); });
tSel.addEventListener('change', () => { audioInit(); startLevel(idxOf(tSel.value), freshRun()); cv.focus(); });
bW.addEventListener('click', () => { audioInit(); const i = G.W && ['play', 'paused', 'cleared', 'over', 'intro'].includes(G.mode) ? G.cur : exists(G.sel) ? G.sel : 0; watchLevel(i, true); cv.focus(); });
// Full screen: the real Fullscreen API where there is one, a fixed full-page layout otherwise (iPhone).
const gameEl = document.getElementById('game'), bF = document.getElementById('btnFs');
const fsEl = () => document.fullscreenElement || document.webkitFullscreenElement;
function toggleFullscreen() {
  if (fsEl()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
  else if (gameEl.classList.contains('full')) gameEl.classList.remove('full');
  else {
    const req = gameEl.requestFullscreen || gameEl.webkitRequestFullscreen;
    if (req) Promise.resolve(req.call(gameEl)).catch(() => gameEl.classList.add('full'));
    else gameEl.classList.add('full');
  }
  setTimeout(updateFs, 50); cv.focus();
}
function updateFs() { const on = !!fsEl() || gameEl.classList.contains('full'); bF.textContent = on ? 'Exit full screen' : 'Full screen'; bF.setAttribute('aria-pressed', on); }
document.addEventListener('fullscreenchange', updateFs); document.addEventListener('webkitfullscreenchange', updateFs);
bF.addEventListener('click', toggleFullscreen); document.getElementById('btnFsIcon').addEventListener('click', toggleFullscreen);
document.getElementById('btnStart').addEventListener('click', () => { audioInit(); tapStart(); cv.focus(); });
cv.addEventListener('pointerdown', () => { audioInit(); cv.focus(); if (['title', 'over', 'cleared', 'intro', 'ending', 'select'].includes(G.mode)) tapStart(); });
initInput(cv, {
  onFirst: audioInit,
  onKey: e => {
    if (e.code === 'KeyV' && G.mode === 'select') keyWatch = true;
    if (e.code === 'KeyF') toggleFullscreen();
    if (e.code === 'KeyM') toggleMusic(); if (e.code === 'KeyH') toggleDebug(); if (e.code === 'KeyG') toggleAssist();
    if (!G.test || !G.W || !['play', 'paused', 'cleared', 'over', 'intro'].includes(G.mode)) return;
    const carry = { score: G.W.score, gems: G.W.gems, lives: G.W.lives, glow: false };
    if (e.code === 'BracketRight' && exists(G.cur + 1)) startLevel(G.cur + 1, carry);
    if (e.code === 'BracketLeft' && exists(G.cur - 1)) startLevel(G.cur - 1, carry);
    if (e.code === 'KeyR') startLevel(G.cur, carry);
  },
});
setAmbientChirps(() => G.mode === 'play' && ['flies', 'stars'].includes(R.theme?.ambient));

// ---------- boot ----------
async function boot() {
  try { index = await (await fetch('levels/index.json')).json(); } catch (e) { console.error('could not load levels/index.json', e); }
  tSel.innerHTML = index.map(e => `<option value="${e.id}">${e.id}  ${e.name}</option>`).join('');
  setTest(G.test);
  setTheme('hills'); resize();
  try { const lv = await fetchLevel('1-1'); G.demo = createWorld(lv, { fx: false }); G.demo.camX = 0; } catch (_) {}
  const want = params.get('level');
  if (params.has('watch')) { const w = params.get('watch') || want || '1-1'; if (exists(idxOf(w))) watchLevel(idxOf(w), true); }
  else if (want && exists(idxOf(want))) startLevel(idxOf(want), freshRun());
  let last = performance.now(), accT = 0; const DT = 1000 / 60;
  function frame(now) {
    accT += Math.min(now - last, 250); last = now;
    let n = 0; while (accT >= DT && n < 5) { update(); accT -= DT; n++; } if (n === 5) accT = 0;
    if (cv.width) render(); requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
boot();
// exposed for automated checks (screenshots, smoke tests)
window.__game = { G, R, startLevel: (id, carry) => startLevel(idxOf(id), carry || freshRun()), step: () => update(), render };
