// =============== Input ===============
// Keyboard, gamepad and touch merged in poll(); edge-detected presses for menus and jumping.
const KEYMAP = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', KeyZ: 'jump', Space: 'jump', ArrowUp: 'up', KeyK: 'jump', KeyW: 'up',
  ArrowDown: 'down', KeyS: ['down', 'fire'], KeyC: 'fire', KeyL: 'fire', KeyX: 'run', ShiftLeft: 'run', ShiftRight: 'run', KeyJ: 'run', Enter: 'start', KeyP: 'start', Escape: 'back', Backspace: 'back' };
const BUTTONS = ['left', 'right', 'up', 'down', 'jump', 'run', 'fire', 'start', 'back'];
const keys = {}, touch = {};
let prev = {}, tap = false;
export const inp = {};
export function initInput(cv, { onKey, onFirst }) {
  addEventListener('keydown', e => {
    onFirst();
    if (e.target && e.target.tagName === 'SELECT') return;
    const k = KEYMAP[e.code]; if (k) { for (const n of [].concat(k)) keys[n] = true; e.preventDefault(); }
    onKey(e);
  });
  addEventListener('keyup', e => { const k = KEYMAP[e.code]; if (k) { for (const n of [].concat(k)) keys[n] = false; e.preventDefault(); } });
  addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
  document.querySelectorAll('#pad button').forEach(b => {
    const k = b.dataset.k;
    const on = e => { e.preventDefault(); onFirst(); touch[k] = true; b.classList.add('on'); try { b.setPointerCapture(e.pointerId); } catch (_) {} };
    const off = e => { e.preventDefault(); touch[k] = false; b.classList.remove('on'); };
    b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off);
    b.addEventListener('lostpointercapture', off); b.addEventListener('contextmenu', e => e.preventDefault());
  });
}
export function tapStart() { tap = true; }
export function poll() {
  const pad = (navigator.getGamepads ? [...navigator.getGamepads()] : []).find(p => p);
  const gp = {};
  if (pad) { const ax = pad.axes[0] || 0, ay = pad.axes[1] || 0, B = i => pad.buttons[i] && pad.buttons[i].pressed;
    gp.left = ax < -0.4 || B(14); gp.right = ax > 0.4 || B(15); gp.up = ay < -0.5 || B(12); gp.down = ay > 0.5 || B(13);
    gp.jump = B(0) || B(1); gp.run = B(2) || B(3); gp.fire = B(5) || B(7); gp.start = B(9); gp.back = B(8); }
  const cur = {}; for (const k of BUTTONS) cur[k] = !!(keys[k] || touch[k] || gp[k]);
  // Up doubles as jump in play (it always did), but menus treat it as its own direction.
  cur.jumpBtn = cur.jump; cur.jump = cur.jump || cur.up;
  if (tap) cur.start = true;
  for (const k of BUTTONS) inp[k] = cur[k];
  inp.jumpBtn = cur.jumpBtn;
  for (const k of BUTTONS) inp[k + 'P'] = cur[k] && !prev[k];
  inp.jumpBtnP = cur.jumpBtn && !prev.jumpBtn;
  prev = { ...cur }; if (tap) { tap = false; prev.start = false; }
}
