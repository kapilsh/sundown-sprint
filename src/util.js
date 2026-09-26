// =============== Utils ===============
export const hsh = n => { const v = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
export function vnoise(x, s) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return hsh(i + s * 101.7) * (1 - u) + hsh(i + 1 + s * 101.7) * u; }
export const fbm = (x, s) => vnoise(x, s) * 0.6 + vnoise(x * 2.1, s + 1) * 0.28 + vnoise(x * 4.3, s + 2) * 0.12;
export const hexRGB = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
export const mix = (a, b, t, al = 1) => { const A = hexRGB(a), B = hexRGB(b); return `rgba(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')},${al})`; };
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export function rr(x, c, y, w, h, r) { x.beginPath(); x.moveTo(c + r, y); x.arcTo(c + w, y, c + w, y + h, r); x.arcTo(c + w, y + h, c, y + h, r); x.arcTo(c, y + h, c, y, r); x.arcTo(c, y, c + w, y, r); x.closePath(); }
export const FONT = '"Bricolage Grotesque", "Avenir Next", "Segoe UI", system-ui, sans-serif';
export const MONO = '"IBM Plex Mono", ui-monospace, Menlo, monospace';
// Small deterministic PRNG (mulberry32) for anything the sim or level tools randomize.
export function mulberry(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
