// Worlds 3-11: one spec per level for tools/compose.mjs.
// pieces are weights; sig are hand-picked set pieces placed at a fraction of the level.
import { compose, PIECES } from './compose.mjs';
import * as S from './sections.mjs';
import { mulberry } from '../src/util.js';

const LEN = 430, BOSS_LEN = 480;
// Cave roofs: a two-row ceiling everywhere, with deeper stalactite dips over flat ground.
function caveCeiling(seed) {
  return (b, pole) => {
    const rng = mulberry(seed), end = pole - 4;
    S.ceiling(b, 0, end, 2);
    // no dips near the goal, which also keeps them out of boss arenas
    for (let c = 20; c < pole - 70; c += 12 + Math.floor(rng() * 14)) {
      const w = 3 + Math.floor(rng() * 4);
      let flat = true; for (let i = 0; i < w; i++) if (!(b.get(c + i, 13) !== '.' && b.get(c + i, 12) === '.' && b.get(c + i, 9) === '.' && b.get(c + i, 5) === '.')) flat = false;
      if (flat) S.ceiling(b, c, c + w - 1, 4);
    }
  };
}
const iceArena = (b, c0) => b.fill(c0, c0 + 25, 13, 13, 'I');
const ledgeArena = (b, c0) => { S.ledge(b, c0 + 5, 9, 4); S.ledge(b, c0 + 17, 9, 4); S.ledge(b, c0 + 11, 6, 3); };
const stoneArena = (b, c0) => { b.row(9, c0 + 6, 'SSS'); b.row(9, c0 + 17, 'SSS'); };
const beltArena = (b, c0) => { b.fill(c0 + 1, c0 + 8, 13, 13, '>'); b.fill(c0 + 17, c0 + 25, 13, 13, '<'); b.row(9, c0 + 11, 'SSSS'); };

const W = [];
function world(n, theme, sky, common, levels) {
  levels.forEach((l, i) => {
    const idx = (n - 1) * 4 + i, d = Math.min(1, 0.1 + (idx - 8) / 38 + (l.boss ? 0.05 : 0));
    const lo = sky[0] + (sky[1] - sky[0]) * i / 4, hi = lo + (sky[1] - sky[0]) / 2;
    // every x-4 is a fire fortress: wheels, jets and bridges on top of the world's own signature pieces
    if (l.boss) l = { ...l, sig: [[0.15, PIECES.fireJets], [0.35, PIECES.fireHall], [0.55, PIECES.fireBridge], [0.75, PIECES.fireHall], [0.9, PIECES.fireJets], ...(l.sig || [])] };
    W.push(Builder => compose(Builder, { theme, d, len: l.boss ? BOSS_LEN : LEN, sky: [+lo.toFixed(2), +hi.toFixed(2)], under: i === 1, ...common, ...l,
      id: `${n}-${i + 1}`, seed: n * 100 + i + 1 + (l.reseed || 0), post: common.post ? common.post(n * 100 + i) : l.post }));
  });
}

// ---------- 3 Glowcave: low ceilings, falling slabs, hoppers, spikes ----------
world(3, 'cave', [0.3, 0.6], { foes: ['bug', 'hopper', 'hopper'], post: s => caveCeiling(s),
  pieces: { gap: 2, pillars: 2, stairs: 1, stones: 2, logs: 3, spikes: 3, tunnel: 2, mesas: 2 } }, [
  { name: 'Mushroom Hollow', sig: [[0.15, PIECES.tunnel]] },
  { name: 'Crystal Drops', sig: [[0.3, PIECES.logs], [0.7, PIECES.logs]] },
  { name: 'Echo Depths', sig: [[0.25, PIECES.spikes], [0.6, PIECES.mesas]] },
  { name: "Glowmaw's Grotto", boss: { name: 'GLOWMAW', hp: 5, kind: 3, speed: 0x00B00, jump: 110, shot: 170 }, arena: stoneArena },
]);
// ---------- 4 Rooftops: springs, lifts, chimney pillars, rooftop gaps ----------
world(4, 'roofs', [0.45, 0.7], { foes: ['bug', 'thorn', 'bug', 'hopper'],
  pieces: { gap: 3, mesas: 3, spring: 3, lift: 2, raft: 1, pillars: 2, stairs: 1, ledges: 1 } }, [
  { name: 'Chimney Hop', pieces: { mesas: 2, gap: 2, pillars: 2, spring: 1, stairs: 1 },
    sig: [[0.12, PIECES.clothesline], [0.35, PIECES.attic], [0.6, PIECES.bellTower], [0.8, PIECES.clothesline]] },
  { name: 'Washing Lines', sig: [[0.3, PIECES.ledges], [0.65, PIECES.ledges]] },
  { name: 'Bell Tower Run', extra: { wind: { dir: -1, force: 0x00300, period: 540, on: 140 } }, pieces: { mesas: 2, lift: 1, raft: 1, gap: 1, pillars: 1 },
    sig: [[0.1, PIECES.bellTower], [0.3, PIECES.washers], [0.5, PIECES.attic], [0.68, PIECES.bellTower], [0.85, PIECES.washers]] },
  { name: "Chimney Gloom's Roof", boss: { name: 'CHIMNEY GLOOM', hp: 5, kind: 4, speed: 0x00B00, jump: 110, shot: 140 }, arena: stoneArena },
]);
// ---------- 5 Marsh: water pools and swimming, lily ledges, fish ----------
world(5, 'marsh', [0.5, 0.72], { foes: ['bug', 'hopper', 'hopper'],
  pieces: { pool: 4, ledges: 3, gap: 2, logs: 2, mesas: 1, stones: 2 } }, [
  { name: 'Reedwater', sig: [[0.1, PIECES.pool]] },
  { name: 'Lilypad Lane', sig: [[0.3, PIECES.ledges], [0.6, PIECES.pool]] },
  { name: 'Foghollow Fen', sig: [[0.2, PIECES.pool], [0.5, PIECES.pool], [0.8, PIECES.pool]] },
  { name: "Bogwraith's Mire", boss: { name: 'BOGWRAITH', hp: 6, kind: 5, speed: 0x00B00, jump: 100, shot: 130 }, arena: ledgeArena },
]);
// ---------- 6 Frost Pass: ice, pebblesnails and their shells ----------
world(6, 'frost', [0.55, 0.78], { foes: ['snail', 'bug', 'thorn', 'snail'],
  pieces: { ice: 4, gap: 2, pillars: 2, stairs: 2, spring: 1, logs: 1, mesas: 1 } }, [
  { name: 'First Frost', sig: [[0.15, PIECES.ice]] },
  { name: 'Icicle Ridge', sig: [[0.4, PIECES.stairs], [0.7, PIECES.ice]] },
  { name: 'Whiteout Walk', sig: [[0.3, PIECES.ice], [0.6, PIECES.ice]] },
  { name: "Frostfang's Peak", boss: { name: 'FROSTFANG', hp: 6, kind: 6, speed: 0x00C00, jump: 100, shot: 120 }, arena: iceArena },
]);
// ---------- 7 Cloudsteps: islands over the void, rafts, wind ----------
const wind = dir => ({ wind: { dir, force: 0x00400, period: 480, on: 160 } });
world(7, 'clouds', [0.55, 0.82], { foes: ['bug', 'hopper', 'bug'],
  pieces: { islands: 4, ledges: 3, raft: 2, logs: 2, lift: 1, spring: 1 } }, [
  { name: 'Cotton Stairs', sig: [[0.2, PIECES.islands]] },
  { name: 'Updraft Isles', extra: wind(-1), sig: [[0.5, PIECES.raft]] },
  { name: 'Gale Ferry', extra: wind(1), sig: [[0.3, PIECES.raft], [0.6, PIECES.logs]] },
  { name: "Stormcloak's Crown", fortressLava: false, extra: wind(-1), boss: { name: 'STORMCLOAK', hp: 6, kind: 7, speed: 0x00B00, jump: 100, shot: 120 }, arena: ledgeArena },
]);
// ---------- 8 Clockwork Ruins: conveyors, belts over pits, spikes, lifts ----------
world(8, 'clock', [0.65, 0.85], { foes: ['snail', 'bug', 'thorn', 'hopper'],
  pieces: { belt: 3, beltBridge: 3, spikes: 2, lift: 2, raft: 1, pillars: 1, tunnel: 1, logs: 1 } }, [
  { name: 'Rusted Gate', sig: [[0.15, PIECES.belt]] },
  { name: 'Belt and Cog', reseed: 3, sig: [[0.3, PIECES.beltBridge], [0.65, PIECES.beltBridge]] },
  { name: 'Pendulum Halls', sig: [[0.25, PIECES.tunnel], [0.6, PIECES.spikes]] },
  { name: "Gearheart's Engine", boss: { name: 'GEARHEART', hp: 7, kind: 8, speed: 0x00B00, jump: 100, shot: 110, spread: 2 }, arena: beltArena },
]);
// ---------- 9 Ember Caverns: lava floors, ceilings, fire-hardy foes ----------
world(9, 'ember', [0.6, 0.8], { foes: ['thorn', 'hopper', 'bug'], lava: true, post: s => caveCeiling(s),
  pieces: { gap: 3, stones: 3, logs: 2, spikes: 2, mesas: 2, tunnel: 1, beltBridge: 1 } }, [
  { name: 'Cinder Steps', sig: [[0.2, PIECES.stones]] },
  { name: 'Magma Ferry', sig: [[0.3, PIECES.logs], [0.6, PIECES.stones]] },
  { name: 'Ashfall Tunnels', sig: [[0.2, PIECES.tunnel], [0.6, PIECES.tunnel]] },
  { name: "Cinderhorn's Forge", boss: { name: 'CINDERHORN', hp: 7, kind: 9, speed: 0x00D00, jump: 100, shot: 100, spread: 2 }, arena: stoneArena },
]);
// ---------- 10 Starfall: meteors, mesas, springs ----------
const meteors = every => ({ meteors: { every } });
world(10, 'stars', [0.75, 0.95], { foes: ['snail', 'hopper', 'bug', 'thorn'],
  pieces: { mesas: 3, islands: 2, spring: 2, lift: 2, raft: 1, gap: 2, pillars: 1, ledges: 1 } }, [
  { name: 'Falling Lights', extra: meteors(170), sig: [[0.3, PIECES.mesas]] },
  { name: 'Comet Mesa', extra: meteors(150), sig: [[0.3, PIECES.spring], [0.6, PIECES.mesas]] },
  { name: 'Moonlit Plateau', extra: meteors(130), sig: [[0.4, PIECES.islands]] },
  { name: "Starveil's Observatory", extra: meteors(160), boss: { name: 'STARVEIL', hp: 7, kind: 10, speed: 0x00C00, jump: 100, shot: 110, spread: 2 }, arena: stoneArena },
]);
// ---------- 11 Home Before Dark: everything, then the Long Night ----------
world(11, 'home', [0.8, 1], { foes: ['bug', 'thorn', 'hopper', 'snail'],
  pieces: { gap: 2, pool: 1, ice: 1, belt: 1, spring: 1, lift: 1, raft: 1, logs: 1, spikes: 1, mesas: 1, ledges: 1, stones: 1, pillars: 1 } }, [
  { name: 'Lantern Row', sig: [[0.3, PIECES.spring], [0.6, PIECES.pool]] },
  { name: 'Last Bridge', sig: [[0.3, PIECES.ice], [0.6, PIECES.beltBridge]] },
  { name: 'The Long Road', extra: meteors(190), sig: [[0.25, PIECES.logs], [0.5, PIECES.lift], [0.75, PIECES.tunnel]] },
  { name: 'The Long Night', extra: { home: true }, boss: { name: 'THE LONG NIGHT', hp: 8, kind: 11, speed: 0x00D00, jump: 90, shot: 90, spread: 2 }, arena: ledgeArena },
]);

export const WORLDS_3_11 = W.map(build => ({ build }));
