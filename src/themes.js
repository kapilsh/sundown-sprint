// =============== Themes (one per world) ===============
// sky stops are [sunset, night] pairs; G.prog (0..1) blends between them.
// Everything here is palette and style. Gameplay never reads a theme.
const base = {
  sky: [['#1c2566', '#04061a'], ['#5e4199', '#191645'], ['#f08868', '#4c2a66'], ['#ffcf8e', '#22173e']],
  sun: true, stars: 1, clouds: [['#ffcaa8', '#3a3270'], ['#b0608a', '#1c1840']],
  haze: ['#d6788a', '#3a2a60'], fogHi: '#e89a90', near: ['#1a1232', '#08061a'],
  layers: ['none', 'none', 'pines', 'pines'], ridge: 'hills',
  ground: { top: ['#735038', '#4b3226'], soil: ['#4b3226', '#2f1f19'], peb: ['rgba(140,104,78,.8)', 'rgba(44,28,20,.7)', 'rgba(110,80,60,.9)'],
    grass: ['#2d6a3e', '#8ee07a', '#3f9a52'], blades: ['#3f9a52', '#7cd070'] },
  brick: { hi: ['#9a96c8', '#8c8ab0'], lo: ['#5c5890', '#4e4c78'], mortar: '#231d3a', deb: '#7e7bb0' },
  stone: { hi: '#b6b8dc', lo: '#5e5f8c', bg: '#2c2848', in: ['#7a7ca8', '#9a9cc6'], moss: 'rgba(90,160,90,.75)' },
  pillar: { style: 'column', c: ['#4c4a74', '#9e9ac4', '#e8e4fa', '#aaa6cc', '#3e3c62'], cap: ['#6a6894', '#f4f0ff', '#55537e'], dark: '#1e1a36' },
  ledge: 'plank', grassBlades: true, dark: [0.14, 0.5], ambient: 'flies', fern: 'rgba(6,4,14,0.92)',
  music: { mode: 'dorian', root: 62, tempo: 132, lead: 'triangle', shape: 0 },
};
const T = (o) => ({ ...base, ...o, ground: { ...base.ground, ...(o.ground || {}) } });

export const THEMES = {
  hills: T({ name: 'Dusk Hills' }),
  woods: T({
    name: 'Lantern Woods',
    sky: [['#16244f', '#030814'], ['#3a4f86', '#101c38'], ['#d88a72', '#2a2446'], ['#ffc48a', '#191a33']],
    clouds: [['#f0c0a8', '#2c3060'], ['#8a5a86', '#161a38']],
    haze: ['#8f8aa8', '#26304e'], fogHi: '#b8a8b8', near: ['#0f1e1f', '#040a0c'],
    layers: ['none', 'trees', 'trees', 'trees'], ridge: 'soft',
    ground: { top: ['#5e4630', '#3c2c20'], soil: ['#3c2c20', '#231913'], grass: ['#1f5a3a', '#7fd49a', '#2f8a5a'], blades: ['#2f8a5a', '#6cc88c'] },
    pillar: { style: 'trunk', c: ['#3a2618', '#6e4a30', '#9a6c48', '#6e4a30', '#2e1e14'], cap: ['#2f6a3e', '#7fd49a', '#1f5a3a'], dark: '#1a120c' },
    ledge: 'branch', dark: [0.24, 0.48], ambient: 'flies',
    music: { mode: 'aeolian', root: 64, tempo: 124, lead: 'sine', shape: 1 },
  }),
  cave: T({
    name: 'Glowcave', sun: false, stars: 0, clouds: null,
    sky: [['#0a0a1e', '#05050f'], ['#141430', '#0a0a1c'], ['#1c2440', '#10142a'], ['#243050', '#141a30']],
    haze: ['#2a4a6a', '#1a2a44'], fogHi: '#3a6a8a', near: ['#0a0c18', '#05060e'],
    layers: ['crystals', 'spires', 'spires', 'spires'], ridge: 'cave',
    ground: { top: ['#3a3a52', '#26263a'], soil: ['#26263a', '#16162a'], peb: ['rgba(90,90,120,.7)', 'rgba(20,20,34,.7)'], grass: ['#1a5a5a', '#6ff0d8', '#2a9a8a'], blades: ['#2a9a8a', '#6ff0d8'] },
    brick: { hi: ['#6a86a8', '#5a7494'], lo: ['#34486a', '#2a3a58'], mortar: '#141a2c', deb: '#56708e' },
    grassBlades: false, dark: [0.6, 0.12], ambient: 'spores', fern: 'rgba(4,6,12,0.95)',
    music: { mode: 'phrygian', root: 57, tempo: 108, lead: 'sine', shape: 2 },
  }),
  roofs: T({
    name: 'Rooftops',
    sky: [['#221f5e', '#050618'], ['#6a4396', '#1a1640'], ['#f0806a', '#4a2a5e'], ['#ffd08a', '#231a3a']],
    haze: ['#c87890', '#362a58'], near: ['#1c1428', '#0a0612'], layers: ['none', 'roofs', 'roofs', 'roofs'], ridge: 'city',
    ground: { top: ['#a4503e', '#6a3226'], soil: ['#5a3a3a', '#3a2226'], peb: ['rgba(140,80,70,.6)', 'rgba(40,20,20,.6)'], grass: ['#7a2e26', '#e0806a', '#b04a3a'], blades: ['#b04a3a', '#e0806a'] },
    grassBlades: false, ledge: 'line', facade: true, dark: [0.2, 0.5], ambient: 'motes',
    music: { mode: 'mixolydian', root: 60, tempo: 140, lead: 'square', shape: 3 },
  }),
  marsh: T({
    name: 'Marsh',
    sky: [['#1e3050', '#040a14'], ['#4a6a7a', '#12222e'], ['#c8a070', '#2a3040'], ['#f0d098', '#1a2230']],
    haze: ['#8aa090', '#26343a'], fogHi: '#b0c0a8', near: ['#10201a', '#040a08'], layers: ['none', 'reeds', 'reeds', 'reeds'], ridge: 'flat',
    ground: { top: ['#4a4a2a', '#30301c'], soil: ['#30301c', '#1c1c10'], grass: ['#3a5a2a', '#a8c870', '#5a8a3a'], blades: ['#5a8a3a', '#a8c870'] },
    dark: [0.22, 0.48], ambient: 'flies', music: { mode: 'dorian', root: 55, tempo: 112, lead: 'sine', shape: 4 },
  }),
  frost: T({
    name: 'Frost Pass',
    sky: [['#1a2a66', '#040820'], ['#5a6aa8', '#141a44'], ['#e0a0b8', '#3a3060'], ['#ffe0d0', '#20203e']],
    clouds: [['#ffe8f0', '#3a4070'], ['#a890b8', '#1c2040']],
    haze: ['#b0b8e0', '#3a4070'], fogHi: '#e0e8ff', near: ['#1a2040', '#080a1c'], layers: ['none', 'peaks', 'peaks', 'pines'], ridge: 'peaks',
    ground: { top: ['#6a6a8a', '#40405a'], soil: ['#40405a', '#28283a'], peb: ['rgba(160,160,200,.5)', 'rgba(30,30,50,.6)'], grass: ['#b8c8f0', '#ffffff', '#dfe8ff'], blades: ['#dfe8ff', '#ffffff'] },
    grassBlades: false, dark: [0.18, 0.5], ambient: 'snow', music: { mode: 'lydian', root: 67, tempo: 120, lead: 'sine', shape: 5 },
  }),
  clouds: T({
    name: 'Cloudsteps',
    sky: [['#2a3a8a', '#060a24'], ['#7a78c8', '#1c1c4a'], ['#f8a8a0', '#4a3a6a'], ['#ffe0b0', '#2a2448']],
    haze: ['#e8b0c0', '#4a3a70'], fogHi: '#fff0f0', near: ['#b890c0', '#2a2050'], layers: ['cloudbank', 'cloudbank', 'cloudbank', 'none'], ridge: 'clouds',
    ground: { style: 'cloud', top: ['#e8e0f8', '#b8a8d8'], soil: ['#b8a8d8', '#8878b0'], peb: ['rgba(255,255,255,.5)', 'rgba(140,120,180,.5)'], grass: ['#d8d0f0', '#fbf8ff', '#f0ecff'], blades: ['#f0ecff', '#ffffff'] },
    grassBlades: false, ledge: 'cloud', fern: null, dark: [0.1, 0.45], ambient: 'wind', music: { mode: 'lydian', root: 65, tempo: 128, lead: 'triangle', shape: 6 },
  }),
  clock: T({
    name: 'Clockwork Ruins',
    sky: [['#2a1c4a', '#070414'], ['#6a4a7a', '#1c1030'], ['#d08a60', '#3a2438'], ['#f0c080', '#22182a']],
    haze: ['#a88070', '#3a2a3a'], fogHi: '#d0a890', near: ['#1e1618', '#0a0608'], layers: ['none', 'ruins', 'ruins', 'ruins'], ridge: 'ruins',
    ground: { top: ['#8a6a3a', '#5a4428'], soil: ['#4a3a2a', '#2a2018'], peb: ['rgba(200,160,90,.5)', 'rgba(40,30,20,.6)'], grass: ['#6a5020', '#e8c060', '#a88030'], blades: ['#a88030', '#e8c060'] },
    grassBlades: false, dark: [0.24, 0.46], ambient: 'motes', music: { mode: 'harmonic', root: 57, tempo: 136, lead: 'square', shape: 7 },
  }),
  ember: T({
    name: 'Ember Caverns', sun: false, stars: 0, clouds: null,
    sky: [['#1a0808', '#0e0406'], ['#3a1010', '#1e0808'], ['#6a2010', '#3a1008'], ['#a04018', '#5a1a0a']],
    haze: ['#8a3018', '#4a1808'], fogHi: '#d06030', near: ['#1a0a0a', '#0a0404'], layers: ['crags', 'crags', 'spires', 'spires'], ridge: 'cave',
    ground: { top: ['#3a2a2a', '#241818'], soil: ['#241818', '#140c0c'], peb: ['rgba(255,120,60,.5)', 'rgba(20,10,10,.7)'], grass: ['#5a1a10', '#ff9040', '#a03a18'], blades: ['#a03a18', '#ff9040'] },
    brick: { hi: ['#8a5a5a', '#7a4a4a'], lo: ['#4a2a2a', '#3a2020'], mortar: '#1a0c0c', deb: '#6a4040' },
    grassBlades: false, dark: [0.52, 0.12], ambient: 'embers', fern: 'rgba(12,4,4,0.95)', music: { mode: 'phrygian', root: 52, tempo: 144, lead: 'sawtooth', shape: 8 },
  }),
  stars: T({
    name: 'Starfall',
    sky: [['#0a0c30', '#020312'], ['#2a2266', '#0a0826'], ['#6a3a7a', '#1c1438'], ['#a86088', '#1a1030']],
    haze: ['#6a4a8a', '#2a2050'], fogHi: '#9a7ab8', near: ['#140e28', '#06040e'], layers: ['none', 'mesas', 'mesas', 'mesas'], ridge: 'mesas',
    ground: { top: ['#4a3a6a', '#2e2446'], soil: ['#2e2446', '#1a142a'], peb: ['rgba(200,180,255,.5)', 'rgba(20,14,40,.6)'], grass: ['#3a2a6a', '#c8a8ff', '#7a5ab8'], blades: ['#7a5ab8', '#c8a8ff'] },
    stars: 2, grassBlades: false, dark: [0.34, 0.3], ambient: 'stars', music: { mode: 'dorian', root: 59, tempo: 118, lead: 'triangle', shape: 9 },
  }),
  home: T({
    name: 'Home Before Dark',
    sky: [['#0e1440', '#02030e'], ['#3a2a70', '#0a0a26'], ['#a05a78', '#241838'], ['#e89a80', '#1a1230']],
    haze: ['#a06a88', '#2a2048'], near: ['#120c24', '#040308'], layers: ['none', 'roofs', 'pines', 'pines'], ridge: 'hills',
    dark: [0.3, 0.42], ambient: 'flies', music: { mode: 'ionian', root: 62, tempo: 126, lead: 'triangle', shape: 10 },
  }),
};

export const WORLDS = ['hills', 'woods', 'cave', 'roofs', 'marsh', 'frost', 'clouds', 'clock', 'ember', 'stars', 'home'];

// Underground stretches (every x-2): stone floors and blue-gray bricks, tinted a little by the world.
export function underOf(th) {
  const tint = th.haze[1];
  return { ...th, ground: { ...th.ground, style: null, top: ['#4a4a66', '#2e2e46'], soil: ['#2e2e46', '#1a1a2c'], peb: ['rgba(120,120,160,.5)', 'rgba(14,14,26,.7)'],
    grass: ['#26263a', '#8a8ab8', '#56567a'] },
    brick: { hi: ['#7088c0', '#6078ac'], lo: ['#34467a', '#2a3a66'], mortar: '#12162a', deb: '#56709e' },
    stone: { hi: '#9a9cc8', lo: '#44466e', bg: '#1c1c34', in: ['#5a5c88', '#7a7ca8'], moss: 'rgba(90,120,160,.6)' },
    pillar: { style: 'column', c: ['#34365a', '#6a6c98', '#a8aad0', '#70729e', '#2a2c4a'], cap: ['#4a4c78', '#c8cae8', '#3e4068'], dark: '#141630' },
    ledge: 'plank', facade: false, tint };
}
