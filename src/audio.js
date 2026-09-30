// =============== Audio ===============
// WebAudio synth SFX, a convolver reverb, and an original music loop that each world
// re-voices (mode, root, tempo, lead, phrase order). The source melody is in D dorian.
let AC = null, master, sfxBus, musicBus;
export const audio = { on: true };
export function audioInit() {
  if (AC) { if (AC.state === 'suspended') AC.resume(); return; }
  try {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    const comp = AC.createDynamicsCompressor(); comp.connect(AC.destination);
    master = AC.createGain(); master.gain.value = 0.32; master.connect(comp);
    const rev = AC.createConvolver(), len = AC.sampleRate * 2.2, ir = AC.createBuffer(2, len, AC.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    rev.buffer = ir; const revG = AC.createGain(); revG.gain.value = 0.35; rev.connect(revG); revG.connect(master);
    sfxBus = AC.createGain(); sfxBus.connect(master); const sSend = AC.createGain(); sSend.gain.value = 0.25; sfxBus.connect(sSend); sSend.connect(rev);
    musicBus = AC.createGain(); musicBus.gain.value = audio.on ? 0.55 : 0; musicBus.connect(master);
    const mSend = AC.createGain(); mSend.gain.value = 0.6; musicBus.connect(mSend); mSend.connect(rev);
  } catch (e) { AC = null; }
}
export function setMusicOn(on) { audio.on = on; if (musicBus) musicBus.gain.value = on ? 0.55 : 0; }
function tone(f0, f1, dur, type = 'square', vol = 0.5, delay = 0, dest, atk = 0.004, lp = 0) {
  if (!AC) return; const t = AC.currentTime + delay;
  const o = AC.createOscillator(), g = AC.createGain(); let node = o;
  o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  if (lp) { const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; o.connect(f); node = f; }
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + atk); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  node.connect(g); g.connect(dest || sfxBus); o.start(t); o.stop(t + dur + 0.05);
}
function noise(dur, vol = 0.5, freq = 800, type = 'bandpass') {
  if (!AC) return; const t = AC.currentTime;
  const b = AC.createBuffer(1, Math.ceil(AC.sampleRate * dur), AC.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const s = AC.createBufferSource(), g = AC.createGain(), f = AC.createBiquadFilter();
  f.type = type; f.frequency.value = freq; s.buffer = b;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  s.connect(f); f.connect(g); g.connect(sfxBus); s.start(t);
}
export const SFX = {
  jump: () => { tone(300, 560, 0.13, 'triangle', 0.45, 0, null, 0.004, 2400); noise(0.08, 0.12, 1800); },
  bigjump: () => { tone(260, 640, 0.17, 'triangle', 0.45, 0, null, 0.004, 2400); noise(0.1, 0.15, 1600); },
  land: () => noise(0.07, 0.18, 400, 'lowpass'),
  gem: () => { tone(1320, 1320, 0.09, 'sine', 0.35); tone(1980, 1980, 0.35, 'sine', 0.3, 0.07); tone(2640, 2640, 0.3, 'sine', 0.12, 0.07); },
  stomp: () => { tone(220, 60, 0.16, 'sine', 0.8); noise(0.1, 0.35, 700); },
  bump: () => { tone(120, 70, 0.12, 'sine', 0.8); noise(0.06, 0.25, 300, 'lowpass'); },
  brk: () => { noise(0.35, 0.7, 900); tone(90, 40, 0.25, 'sine', 0.7); },
  ember: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, f, 0.35, 'triangle', 0.25, i * 0.06, null, 0.01, 3000)),
  crate: () => [392, 523, 659].forEach((f, i) => tone(f, f, 0.3, 'triangle', 0.25, i * 0.05, null, 0.01, 3000)),
  oneup: () => [659, 784, 1319, 1047, 1175, 1568].forEach((f, i) => tone(f, f, 0.18, 'square', 0.12, i * 0.08, null, 0.005, 3000)),
  hurt: () => tone(500, 140, 0.4, 'sawtooth', 0.25, 0, null, 0.004, 1400),
  die: () => [494, 440, 392, 330, 294, 220].forEach((f, i) => tone(f, f * 0.98, 0.3, 'triangle', 0.35, 0.35 + i * 0.16, null, 0.01, 2000)),
  clear: () => [392, 494, 587, 784, 988, 1175, 1568].forEach((f, i) => tone(f, f, 0.5, 'triangle', 0.28, i * 0.09, null, 0.01, 3200)),
  tick: () => tone(2200, 2200, 0.03, 'sine', 0.12),
  lantern: () => { noise(0.6, 0.25, 500, 'lowpass'); tone(220, 660, 0.8, 'sine', 0.35, 0, null, 0.05); },
  hurry: () => [880, 988, 880, 988].forEach((f, i) => tone(f, f, 0.12, 'triangle', 0.2, i * 0.12)),
  spring: () => { tone(200, 900, 0.22, 'sine', 0.5, 0, null, 0.004); tone(400, 1200, 0.2, 'triangle', 0.15, 0.02); },
  splash: () => noise(0.35, 0.35, 1200, 'bandpass'),
  stroke: () => { noise(0.12, 0.12, 900, 'lowpass'); tone(300, 420, 0.1, 'sine', 0.12); },
  kick: () => { tone(160, 80, 0.12, 'square', 0.35, 0, null, 0.004, 1200); noise(0.08, 0.3, 1000); },
  creak: () => { tone(90, 70, 0.3, 'sawtooth', 0.15, 0, null, 0.02, 600); },
  whoosh: () => noise(0.6, 0.2, 700, 'bandpass'),
  boom: () => { noise(0.5, 0.6, 300, 'lowpass'); tone(80, 30, 0.4, 'sine', 0.6); },
  wind: () => noise(1.2, 0.18, 500, 'bandpass'),
  gate: () => { tone(70, 50, 0.6, 'sawtooth', 0.35, 0, null, 0.01, 500); noise(0.5, 0.4, 250, 'lowpass'); },
  fireball: () => { tone(900, 240, 0.1, 'square', 0.16, 0, null, 0.003, 2600); noise(0.08, 0.18, 2200); },
  sizzle: () => { noise(0.18, 0.3, 3000, 'highpass'); tone(420, 260, 0.1, 'sawtooth', 0.12, 0, null, 0.004, 1800); },
  blossom: () => [587, 740, 880, 1175, 1480, 1760].forEach((f, i) => tone(f, f, 0.3, 'triangle', 0.24, i * 0.05, null, 0.01, 3400)),
  spit: () => { tone(600, 300, 0.12, 'square', 0.2, 0, null, 0.004, 2000); },
  thud: () => { tone(70, 35, 0.3, 'sine', 0.8); noise(0.2, 0.4, 200, 'lowpass'); },
  bosshit: () => { tone(300, 100, 0.3, 'sawtooth', 0.35, 0, null, 0.004, 1600); noise(0.2, 0.4, 600); },
  bossdown: () => { [330, 294, 262, 220, 196, 165].forEach((f, i) => tone(f, f * 0.9, 0.3, 'sawtooth', 0.22, i * 0.1, null, 0.01, 1400)); noise(1.2, 0.5, 300, 'lowpass'); },
  checkpoint: () => [784, 988, 1175, 1568].forEach((f, i) => tone(f, f, 0.4, 'triangle', 0.22, i * 0.07, null, 0.01, 3200)),
  rage: () => { tone(110, 55, 0.8, 'sawtooth', 0.35, 0, null, 0.02, 900); noise(0.6, 0.35, 400, 'lowpass'); },
  doordown: () => { [392, 330, 262, 196].forEach((f, i) => tone(f, f, 0.18, 'triangle', 0.25, i * 0.08, null, 0.01, 2000)); noise(0.3, 0.2, 300, 'lowpass'); },
  doorup: () => [196, 262, 330, 392, 523].forEach((f, i) => tone(f, f, 0.18, 'triangle', 0.25, i * 0.07, null, 0.01, 2600)),
  select: () => tone(880, 1320, 0.08, 'triangle', 0.25),
  move: () => tone(660, 660, 0.04, 'triangle', 0.15),
  deny: () => tone(200, 160, 0.12, 'square', 0.15, 0, null, 0.004, 900),
};
export const playSfx = n => { const f = SFX[n]; if (f) f(); };

// ---------- music ----------
const MODES = { ionian: [0, 2, 4, 5, 7, 9, 11], dorian: [0, 2, 3, 5, 7, 9, 10], phrygian: [0, 1, 3, 5, 7, 8, 10], lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10], aeolian: [0, 2, 3, 5, 7, 8, 10], harmonic: [0, 2, 3, 5, 7, 8, 11] };
// Source melody as scale degrees of D dorian (0 = D). null is a rest.
const MEL = [0, 2, 4, 3, 2, 0, -1, 0, 1, 3, 6, 4, 3, 1, 0, null, 0, 2, 4, 6, 7, 6, 4, 3, 2, 3, 4, 2, 0, null, 0, null];
const BASS = [0, 0, 4, 4, -1, -1, 3, 3, 0, 0, 4, 4, 2, 2, 3, 3];
const PADS = [[0, 2, 4], [-1, 1, 3], [0, 2, 4], [2, 4, 6]];
const PERMS = [[0, 1, 2, 3], [2, 1, 0, 3], [0, 2, 1, 3], [1, 0, 3, 2], [2, 3, 0, 1], [0, 3, 2, 1], [3, 1, 2, 0], [1, 2, 0, 3], [2, 0, 3, 1], [0, 1, 3, 2], [3, 2, 1, 0]];
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
let song = null, nextNote = 0, step = 0;
function build(cfg, boss, under) {
  // underground: the same tune a fifth lower, slower, in aeolian, with a walking bass and no pads
  const mode = MODES[boss ? 'phrygian' : under ? 'aeolian' : cfg.mode] || MODES.dorian, root = cfg.root - (boss ? 2 : under ? 7 : 0);
  const deg = d => root + 12 * Math.floor(d / 7) + mode[((d % 7) + 7) % 7];
  const perm = PERMS[cfg.shape % PERMS.length], flip = cfg.shape % 3 === 2;
  const mel = []; for (const p of perm) for (let i = 0; i < 8; i++) { const d = MEL[p * 8 + i]; mel.push(d === null ? 0 : deg(flip ? 4 - d : d)); }
  return { mel, bass: BASS.map(d => deg(d) - 24), pads: under ? [] : PADS.map(c => c.map(deg)), eighth: 60 / (cfg.tempo + (boss ? 24 : under ? -14 : 0)) / 2,
    lead: boss ? 'sawtooth' : under ? 'square' : cfg.lead, boss, under };
}
export function musicStart(cfg, boss = false, under = false) { if (!AC) return; song = build(cfg, boss, under); nextNote = AC.currentTime + 0.08; step = 0; }
export function musicStop() { song = null; }
export const musicPlaying = () => !!song;
let ambientTick = () => false;
export function setAmbientChirps(fn) { ambientTick = fn; }
setInterval(() => {
  if (!AC) return;
  if (ambientTick() && Math.random() < 0.035) { const f = 4200 + Math.random() * 600; for (let i = 0; i < 3; i++) tone(f, f, 0.03, 'sine', 0.025, i * 0.05); }
  if (!song) return;
  const E = song.eighth;
  while (nextNote < AC.currentTime + 0.25) {
    const d = nextNote - AC.currentTime, m = song.mel[step % 32];
    if (m && !(song.under && step % 4 === 3)) tone(mtof(m + 12), mtof(m + 12), E * (song.under ? 0.8 : 1.6), song.lead, song.lead === 'triangle' || song.lead === 'sine' ? 0.16 : 0.07, d, musicBus, 0.01, song.boss ? 1800 : song.under ? 1200 : 2600);
    if (step % 2 === 0 || song.boss || song.under) { const b = mtof(song.bass[(step >> 1) % 16]); tone(b, b, E * (song.boss ? 0.9 : 1.9), 'sine', 0.42, d, musicBus, 0.01); }
    if (song.under && step % 2 === 1) tone(3000, 3000, 0.02, 'square', 0.02, d, musicBus, 0.001, 4000);
    if (step % 8 === 0 && song.pads.length) song.pads[(step >> 3) % 4].forEach(n => tone(mtof(n), mtof(n), E * 8, 'sawtooth', 0.035, d, musicBus, 0.35, 900));
    if (song.boss && step % 4 === 2) tone(90, 45, 0.12, 'sine', 0.3, d, musicBus);
    nextNote += E; step++;
  }
}, 50);
