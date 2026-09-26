// Level designs. Each entry builds one level with the Builder API from lib-builder.mjs.
// Coordinates are tiles: columns left to right, rows 0 (top) to 14 (bottom). Ground top is row 13.
// Enemies stand on the row above their floor (r = floorRow - 1).
// Normal levels run about 400+ columns with one checkpoint; x-4 levels have a long approach,
// two checkpoints and a boss arena.

import { ground, pit, ledge, gemRow, gemArc, bugs, endZone, mesas, canopy, stairGap, stepStones, boss, meta, underground, lavaPits, fireHall, fireJets, fireBridge } from './sections.mjs';

// ---------- World 1: Dusk Hills ----------
function w1_1(Builder) {
  // First half: the original Duskrunner level, unchanged up to its big staircase.
  const b = new Builder(700);
  const gaps = [[69, 70], [86, 88], [153, 154]];
  for (let c = 0; c < 200; c++) { if (gaps.some(([a, z]) => c >= a && c <= z)) continue; b.set(c, 13, 'G'); b.set(c, 14, 'G'); }
  b.set(16, 9, 'C'); b.row(9, 20, 'BEBCB'); b.set(22, 5, 'C');
  b.pillar(28, 2); b.pillar(38, 3); b.pillar(46, 4); b.pillar(57, 4);
  b.set(64, 9, 'C'); b.row(9, 77, 'BCB'); b.row(5, 80, 'BBBBBBBB');
  b.row(5, 91, 'BBBC'); b.set(94, 9, 'M'); b.row(9, 100, 'BE');
  b.set(106, 9, 'C'); b.set(109, 9, 'C'); b.set(109, 5, 'C'); b.set(112, 9, 'C');
  b.set(118, 9, 'B'); b.row(5, 121, 'BBB'); b.row(5, 128, 'BCCB'); b.row(9, 129, 'BB');
  [1, 2, 3, 4].forEach((h, i) => b.stair(134 + i, h)); [4, 3, 2, 1].forEach((h, i) => b.stair(140 + i, h));
  [1, 2, 3, 4, 4].forEach((h, i) => b.stair(148 + i, h)); [4, 3, 2, 1].forEach((h, i) => b.stair(155 + i, h));
  b.pillar(163, 2); b.row(9, 168, 'BBCB'); b.pillar(179, 2);
  for (let i = 0; i < 8; i++) b.stair(181 + i, i + 1); b.stair(189, 8);
  bugs(b, [22, 40, 51, 53, 97, 99, 114, 116, 124, 126, 128, 130, 174, 176]); bugs(b, [80, 82], 4); bugs(b, [105, 160], 12, 'thorn');
  [41, 42, 43, 44].forEach(c => b.gem(c, 7)); [60, 61, 62].forEach(c => b.gem(c, 10));
  [90, 91, 92, 93].forEach(c => b.gem(c, 3)); [144, 145, 146].forEach(c => b.gem(c, 9)); [166, 167].forEach(c => b.gem(c, 11));
  // Second half: night falls over the far meadow.
  ground(b, 190, 420);
  const cp = 195;
  b.row(9, 199, 'BBCBB'); gemRow(b, 199, 7, 5); bugs(b, [205, 207]);
  b.pillar(212, 2); pit(b, 215, 217); gemArc(b, 215, 9, 3);
  // stone bridge over a pit, with a patrol on top
  pit(b, 224, 235); b.row(10, 222, 'SSSSSSSSSSSSSSS'); bugs(b, [227, 231], 9); gemRow(b, 226, 7, 6);
  b.pillar(242, 3); b.pillar(249, 4); b.pillar(256, 2); bugs(b, [246, 253], 12, 'thorn');
  b.row(9, 262, 'BMB'); b.row(5, 267, 'BBBBBB'); b.set(269, 9, 'N'); bugs(b, [269], 4); gemRow(b, 267, 3, 6);
  pit(b, 279, 281); gemArc(b, 279, 9, 3);
  stepStones(b, 290, 16, [[3, 2, 11], [8, 2, 9], [12, 2, 11]]);
  bugs(b, [312, 314, 316, 318]); b.row(9, 312, 'C.C.C'); bugs(b, [324], 12, 'thorn');
  pit(b, 330, 332); b.pillar(334, 3); pit(b, 337, 339); b.pillar(341, 4); gemArc(b, 330, 7, 3); gemArc(b, 337, 6, 3);
  b.fill(350, 351, 9, 12, 'B'); b.row(5, 348, 'BCB'); bugs(b, [355, 357]);
  b.row(9, 362, 'BBEBB'); bugs(b, [368, 371, 374]); bugs(b, [378], 12, 'thorn');
  // one last hop across the stream of stones
  stepStones(b, 384, 14, [[2, 2, 11], [6, 2, 10], [10, 2, 11]]); bugs(b, [402, 404]);
  const { pole, hut } = endZone(b, 408);
  return b.toJSON(meta('1-1', 'Sundown Meadow', 'hills', { sky: [0, 0.35], pole, hut, seed: 11, checkpoints: [cp] }));
}

function w1_2(Builder) {
  const b = new Builder(700);
  ground(b, 0, 600);
  for (const [a, z] of [[33, 35], [57, 59], [93, 95], [128, 131], [168, 170]]) b.fill(a, z, 13, 14, '.');
  b.row(9, 12, 'BCB'); b.row(9, 18, 'BEB'); gemArc(b, 12, 7, 3);
  b.pillar(24, 2); b.pillar(29, 3); b.pillar(38, 3); b.pillar(44, 4); b.pillar(50, 2);
  gemRow(b, 33, 8, 3);
  b.pillar(55, 3); b.pillar(60, 3); gemArc(b, 57, 8, 3);
  b.row(9, 67, 'BBCBBBB'); b.row(5, 70, 'BBNBB'); gemRow(b, 68, 3, 5);
  [1, 2, 3, 4].forEach((h, i) => b.stair(89 + i, h)); [4, 3, 2, 1].forEach((h, i) => b.stair(96 + i, h));
  gemArc(b, 93, 7, 3);
  b.row(9, 106, 'C.M.C'); b.set(108, 5, 'C'); gemRow(b, 114, 10, 4);
  b.pillar(125, 2); gemArc(b, 128, 8, 4);
  b.row(10, 138, 'SSS'); b.row(7, 144, 'SSSS'); gemRow(b, 144, 6, 4); b.row(10, 151, 'SSS');
  b.pillar(163, 3); b.pillar(172, 3); gemArc(b, 168, 8, 3);
  b.row(9, 178, 'BCBEB'); gemRow(b, 179, 7, 3);
  bugs(b, [20, 36, 42, 47, 64, 80, 82, 101, 103, 110, 112, 140, 142, 176, 184]); bugs(b, [71, 73], 8); b.ent('bug', 146, 6);
  bugs(b, [86, 120, 158], 12, 'thorn');
  // Second half: the pillars climb higher and the gaps get wider.
  const cp = 190;
  b.row(9, 195, 'BCMCB'); bugs(b, [201, 203]);
  b.pillar(207, 2); b.pillar(211, 3); b.pillar(215, 4); pit(b, 218, 221); b.pillar(222, 4); b.pillar(226, 3); b.pillar(230, 2);
  bugs(b, [213], 12, 'thorn'); bugs(b, [228], 12, 'thorn'); gemArc(b, 218, 6, 4);
  b.row(9, 237, 'BBBBBBBBBBBBB'); bugs(b, [241, 245]); bugs(b, [243], 8); gemRow(b, 238, 7, 11);
  pit(b, 253, 255); gemArc(b, 253, 9, 3);
  let c = stairGap(b, 258, 4, 4);
  c = stairGap(b, c + 3, 3, 3);
  b.row(9, c + 4, 'C.C.C'); bugs(b, [c + 9], 12, 'thorn'); bugs(b, [c + 12, c + 14, c + 16]); gemArc(b, c + 4, 6, 5);
  c = stepStones(b, c + 20, 17, [[2, 3, 11], [7, 3, 9], [12, 3, 11]]);
  b.pillar(c + 4, 3); b.pillar(c + 10, 4); b.pillar(c + 16, 2); bugs(b, [c + 7, c + 13]);
  pit(b, c + 20, c + 22); gemArc(b, c + 20, 8, 3);
  b.row(9, c + 28, 'BEB'); bugs(b, [c + 33, c + 35, c + 37]);
  // finale: a wide stair gap and a guarded pillar pair
  c = stairGap(b, c + 42, 4, 5);
  b.row(9, c + 4, 'BBMBB'); gemRow(b, c + 4, 7, 5); bugs(b, [c + 6, c + 8, c + 10]);
  b.pillar(c + 14, 3); b.ent('thorn', c + 18, 12); b.pillar(c + 21, 4); gemArc(b, c + 16, 7, 5);
  pit(b, c + 26, c + 29); gemArc(b, c + 26, 8, 4);
  c = stepStones(b, c + 33, 12, [[2, 2, 10], [6, 2, 8], [10, 2, 10]]);
  bugs(b, [c + 4, c + 6]);
  const { pole, hut } = endZone(b, c + 10);
  const ug = underground(b, 64, pole - 30);
  return b.toJSON(meta('1-2', 'Pillar Path', 'hills', { sky: [0.05, 0.4], pole, hut, seed: 12, checkpoints: [cp], ...ug }));
}

function w1_3(Builder) {
  const b = new Builder(700);
  ground(b, 0, 15);
  b.row(9, 7, 'BCB');
  const deco = (c0, w, top) => {
    if (w >= 5) b.ent('bug', c0 + Math.floor(w / 2), top - 1);
    if (w >= 7) b.row(top - 4, c0 + 2, w >= 8 ? 'BCEB' : 'BCB');
    b.gem(c0 - 2, top - 3);
  };
  let c = mesas(b, 16, [[3, 5, 11], [2, 4, 9], [3, 6, 10], [3, 3, 8], [2, 5, 11], [3, 8, 10], [3, 3, 9], [2, 3, 7], [3, 6, 9], [4, 5, 11],
    [3, 4, 9], [3, 7, 10], [2, 3, 8], [3, 3, 6], [3, 6, 9], [4, 8, 11], [3, 4, 9], [3, 5, 12], [3, 3, 10], [2, 6, 9]], deco);
  // checkpoint island
  c += 3; ground(b, c, c + 9); const cp = c + 3; b.row(9, c + 5, 'BNB'); c += 10;
  // Second half: brick bridges between the mesas, with patrols on them.
  c = mesas(b, c, [[3, 4, 10], [3, 3, 8], [4, 6, 11], [3, 3, 9], [2, 3, 7]], deco);
  b.row(8, c, 'BBBBBB..BBBBBBBB'); bugs(b, [c + 3, c + 12], 7); gemRow(b, c + 6, 5, 2); c += 16;
  c = mesas(b, c, [[0, 4, 8], [4, 5, 11], [3, 3, 8], [3, 3, 6], [4, 6, 9], [3, 4, 11], [2, 3, 9]], deco);
  b.row(10, c, 'BBB..BBBB..BBB'); bugs(b, [c + 6], 9); gemRow(b, c + 3, 8, 2); gemRow(b, c + 9, 8, 2); c += 14;
  c = mesas(b, c, [[0, 5, 10], [3, 3, 8], [3, 6, 10], [3, 4, 12], [3, 3, 10], [2, 6, 11]], deco);
  // last climb: tall narrow mesas, then a long brick bridge down to the goal
  c = mesas(b, c, [[3, 3, 9], [3, 3, 7], [3, 3, 5], [4, 5, 8], [3, 3, 10], [3, 4, 8], [3, 3, 6], [4, 7, 9]], deco);
  b.row(9, c, 'BBBB..BBBBB..BBBB'); bugs(b, [c + 2, c + 8, c + 14], 8); gemRow(b, c + 4, 7, 2); gemRow(b, c + 11, 7, 2); c += 17;
  c = mesas(b, c, [[0, 4, 9], [3, 5, 11], [3, 3, 9], [3, 6, 12]], deco);
  c += 3; ground(b, c, c + 60);
  b.ent('thorn', c + 3, 12);
  const { pole, hut } = endZone(b, c + 6);
  return b.toJSON(meta('1-3', 'Mesa Steps', 'hills', { sky: [0.1, 0.45], pole, hut, seed: 13, checkpoints: [cp] }));
}

function w1_4(Builder) {
  const b = new Builder(900);
  ground(b, 0, 600);
  // A: the old approach
  pit(b, 24, 26); pit(b, 44, 47);
  b.row(9, 10, 'BEB'); b.pillar(18, 2); b.pillar(28, 3); gemArc(b, 24, 8, 3);
  [1, 2, 3].forEach((h, i) => b.stair(38 + i, h)); b.stair(41, 3); b.stair(42, 3); b.stair(43, 3);
  [3, 2, 1].forEach((h, i) => b.stair(48 + i, h)); gemRow(b, 44, 7, 4);
  b.row(9, 56, 'BCNCB');
  bugs(b, [15, 33, 35, 60]); b.ent('thorn', 52, 12);
  // B: ramparts: stone walls with thornlings pacing between them
  for (const [c, h] of [[68, 2], [76, 3], [84, 4], [92, 3], [100, 2]]) b.fill(c, c + 1, 13 - h, 12, 'S');
  bugs(b, [72, 80, 88, 96], 12, 'thorn'); gemRow(b, 76, 7, 2); gemRow(b, 84, 6, 2); gemRow(b, 92, 7, 2);
  pit(b, 106, 109); gemArc(b, 106, 9, 4);
  b.row(9, 114, 'BBCBB'); b.row(5, 116, 'BMB'); bugs(b, [118, 121, 124]);
  let c = stairGap(b, 128, 4, 5);
  const cp1 = c + 3;
  // C: the brick tunnel. Low ceiling, bugs inside, crates overhead.
  b.fill(c + 8, c + 40, 9, 9, 'B'); b.set(c + 12, 9, 'C'); b.set(c + 22, 9, 'E'); b.set(c + 32, 9, 'C');
  b.fill(c + 8, c + 40, 5, 5, 'B'); gemRow(b, c + 14, 7, 6); gemRow(b, c + 26, 7, 6);
  bugs(b, [c + 16, c + 20, c + 26, c + 30, c + 36]); bugs(b, [c + 18, c + 34], 8);
  c += 44;
  c = stepStones(b, c, 18, [[2, 2, 11], [6, 2, 9], [10, 2, 11], [14, 2, 9]]);
  // D: pillar field with thorns
  b.pillar(c + 3, 3); b.pillar(c + 9, 4); b.pillar(c + 15, 3); b.pillar(c + 21, 4); bugs(b, [c + 6, c + 12, c + 18], 12, 'thorn');
  gemArc(b, c + 5, 6, 4); gemArc(b, c + 17, 6, 4);
  pit(b, c + 26, c + 29); gemArc(b, c + 26, 8, 4);
  b.row(9, c + 34, 'BCNCB');
  // D2: stone bridge over a long pit, patrolled from both ends
  pit(b, c + 42, c + 60); b.row(10, c + 40, 'SSSSSS...SSSSSSSSSSS'.slice(0, 22)); bugs(b, [c + 43, c + 55], 9); b.ent('thorn', c + 50, 9); gemRow(b, c + 46, 8, 3);
  b.pillar(c + 66, 3); b.pillar(c + 72, 4); bugs(b, [c + 69], 12, 'thorn');
  c += 34;
  c = stairGap(b, c + 42, 3, 4);
  // E: second tunnel, this time with holes in the floor
  b.fill(c + 4, c + 36, 9, 9, 'B'); b.fill(c + 4, c + 36, 5, 5, 'B'); b.set(c + 10, 9, 'C'); b.set(c + 20, 9, 'M'); b.set(c + 30, 9, 'C');
  pit(b, c + 12, c + 14); pit(b, c + 24, c + 26); b.fill(c + 12, c + 14, 9, 9, 'B'); b.fill(c + 24, c + 26, 9, 9, 'B'); b.fill(c + 12, c + 14, 5, 5, 'B'); b.fill(c + 24, c + 26, 5, 5, 'B');
  bugs(b, [c + 8, c + 18, c + 21, c + 31]); bugs(b, [c + 16, c + 28], 8); gemRow(b, c + 16, 7, 6);
  c += 40;
  const cp2 = c + 2;
  // F: mesa hops and a second rampart before the knoll
  pit(b, c + 6, c + 50);
  c = mesas(b, c + 6, [[0, 4, 11], [3, 3, 9], [3, 5, 10], [3, 3, 8], [2, 4, 10], [3, 3, 12], [3, 5, 11]], (c0, w, top) => { if (w >= 5) b.ent('bug', c0 + 2, top - 1); b.gem(c0 - 2, top - 3); });
  c += 3;
  for (const [o, h] of [[4, 2], [10, 3], [16, 4], [22, 3], [28, 2]]) b.fill(c + o, c + o + 1, 13 - h, 12, 'S');
  bugs(b, [c + 7, c + 13, c + 19, c + 25], 12, 'thorn'); gemRow(b, c + 16, 6, 2);
  c = stairGap(b, c + 34, 5, 4);
  bugs(b, [c + 8]);
  // G: the fortress gate: fire jets, a hall of fire wheels and a bridge over lava
  c = fireJets(b, c + 12, { n: 3, period: 170, on: 50 });
  c = fireHall(b, c + 2, { bars: 2, len: 4, speed: 0.03 });
  c = fireBridge(b, c + 2, { w: 16, bars: 2, len: 3, speed: 0.03 });
  ground(b, c, c + 8);
  lavaPits(b, 0, c);
  const A = boss(b, c + 8, { name: 'GLOOMLING', hp: 4, kind: 1, speed: 0x00A00, jump: 140 });
  b.row(9, A.c0 + 6, 'SSS'); b.row(9, A.c0 + 17, 'SSS');
  const pole = A.c0 + 38; b.set(pole, 12, 'S');
  return b.toJSON(meta('1-4', "Gloomling's Knoll", 'hills', { sky: [0.2, 0.5], pole, hut: pole + 4, seed: 14, boss: A, checkpoints: [cp1, cp2] }));
}

// ---------- World 2: Lantern Woods ----------
function w2_1(Builder) {
  const b = new Builder(700);
  ground(b, 0, 600);
  for (const [a, z] of [[38, 40], [66, 69], [94, 97], [140, 142], [148, 150]]) b.fill(a, z, 13, 14, '.');
  ledge(b, 14, 10, 4); ledge(b, 19, 7, 4); gemRow(b, 19, 5, 4);
  ledge(b, 37, 9, 5); gemRow(b, 38, 7, 3);
  b.row(9, 48, 'BCB'); ledge(b, 54, 9, 3); ledge(b, 58, 6, 4); b.set(60, 2, 'N');
  gemArc(b, 66, 9, 4);
  ground(b, 76, 84, 11); ground(b, 85, 92, 9); gemRow(b, 86, 6, 4);
  ledge(b, 104, 10, 3); ledge(b, 108, 8, 3); ledge(b, 112, 6, 3); ledge(b, 116, 8, 3); gemRow(b, 112, 4, 3);
  b.row(9, 124, 'BEB');
  b.pillar(144, 3); gemArc(b, 140, 8, 3); gemArc(b, 148, 8, 3);
  ledge(b, 156, 10, 4); ledge(b, 161, 8, 4); ledge(b, 166, 10, 4); gemRow(b, 161, 6, 4);
  bugs(b, [24, 28, 46, 52, 72, 106, 110, 114, 160, 162, 164]); b.ent('bug', 80, 10); b.ent('bug', 88, 8);
  bugs(b, [120, 172], 12, 'thorn');
  [[34, 8], [62, 7], [100, 8], [130, 8], [136, 6], [152, 9]].forEach(([c, r]) => b.ent('moth', c, r));
  // Second half: moth valley and the ledge towers.
  const cp = 178;
  pit(b, 184, 199); ledge(b, 185, 10, 3); ledge(b, 190, 8, 4); ledge(b, 196, 10, 3); gemRow(b, 190, 6, 4);
  [[188, 6], [194, 9], [199, 5]].forEach(([c, r]) => b.ent('moth', c, r));
  // tower: stacked ledges up to a stash
  ledge(b, 206, 10, 4); ledge(b, 210, 7, 4); ledge(b, 206, 4, 4); b.row(1, 207, 'CEC'); gemRow(b, 211, 5, 3); bugs(b, [204, 214]);
  ground(b, 220, 228, 11); ground(b, 229, 236, 9); ground(b, 237, 243, 11); bugs(b, [224], 10); bugs(b, [232], 8); bugs(b, [240], 10);
  pit(b, 247, 250); gemArc(b, 247, 8, 4); b.ent('moth', 250, 7);
  b.pillar(254, 3); b.pillar(260, 4); ledge(b, 256, 7, 4); gemRow(b, 256, 5, 4); bugs(b, [258], 12, 'thorn');
  pit(b, 266, 281); ledge(b, 267, 11, 3); ledge(b, 271, 9, 3); ledge(b, 275, 7, 3); ledge(b, 279, 10, 2); b.ent('moth', 274, 4); gemRow(b, 271, 7, 3);
  b.row(9, 288, 'BCBCB'); bugs(b, [292, 294, 296]); b.ent('moth', 300, 8);
  ledge(b, 304, 10, 4); ledge(b, 309, 7, 4); ledge(b, 314, 10, 4); gemRow(b, 309, 5, 4); bugs(b, [306, 311, 316]);
  pit(b, 321, 323); b.ent('moth', 326, 6);
  bugs(b, [330], 12, 'thorn'); bugs(b, [334, 336]);
  // the lantern grove: two towers and a moth-filled dip between them
  ledge(b, 342, 10, 3); ledge(b, 346, 7, 3); ledge(b, 342, 4, 3); b.row(1, 342, 'CMC'); bugs(b, [348]);
  pit(b, 352, 368); ledge(b, 353, 11, 2); ledge(b, 357, 9, 3); ledge(b, 362, 11, 2); ledge(b, 366, 9, 2); gemRow(b, 357, 7, 3);
  [[356, 5], [361, 8], [366, 6]].forEach(([c, r]) => b.ent('moth', c, r));
  ground(b, 371, 378, 11); ground(b, 379, 386, 9); bugs(b, [374], 10); bugs(b, [382], 8); b.row(5, 380, 'BCB');
  bugs(b, [392, 395], 12, 'thorn'); b.ent('moth', 398, 7);
  const { pole, hut } = endZone(b, 402);
  return b.toJSON(meta('2-1', 'Firefly Glade', 'woods', { sky: [0.25, 0.55], pole, hut, seed: 21, checkpoints: [cp] }));
}

function w2_2(Builder) {
  const b = new Builder(700);
  ground(b, 0, 12);
  let c = 13;
  const run = seq => { c = canopy(b, c, seq); };
  const island = (w, fn) => { c += 2; ground(b, c, c + w - 1); fn && fn(c); c += w; };
  run([[1, 4, 11], [1, 3, 9], [1, 4, 7], [2, 3, 9], [1, 4, 11]]);
  island(10, c0 => { b.row(9, c0 + 3, 'BCB'); b.ent('bug', c0 + 7, 12); });
  run([[2, 3, 10], [2, 3, 8], [2, 3, 6], [3, 4, 8], [2, 3, 10]]); b.ent('moth', c - 8, 5);
  island(13, c0 => { b.pillar(c0 + 5, 3); bugs(b, [c0 + 2, c0 + 9]); b.row(8, c0 + 8, 'BEB'); });
  run([[2, 5, 11], [1, 3, 8], [1, 3, 5], [2, 3, 8], [2, 5, 11]]); b.set(c - 11, 1, 'N'); b.ent('moth', c - 6, 7);
  island(8, c0 => b.ent('thorn', c0 + 4, 12));
  run([[3, 3, 10], [2, 3, 10], [2, 3, 8], [2, 3, 8], [2, 3, 10], [2, 3, 12]]); b.ent('moth', c - 12, 8);
  let cp; island(15, c0 => { b.row(9, c0 + 6, 'BCMCB'); bugs(b, [c0 + 12]); cp = c0 + 2; });
  // Second half: the high canopy
  run([[2, 4, 11], [2, 4, 9], [2, 4, 7], [2, 4, 9], [2, 4, 11]]); b.ent('moth', c - 14, 6); b.ent('moth', c - 4, 9);
  island(9, c0 => { bugs(b, [c0 + 3, c0 + 6]); });
  run([[2, 3, 10], [1, 2, 8], [1, 2, 6], [1, 2, 4], [2, 5, 6], [2, 3, 9], [2, 3, 11]]); b.row(1, c - 16, 'CEC'); b.ent('moth', c - 20, 8);
  island(12, c0 => { b.pillar(c0 + 3, 2); b.pillar(c0 + 8, 3); b.ent('thorn', c0 + 6, 12); });
  run([[3, 3, 11], [3, 3, 11], [3, 3, 9], [3, 3, 9], [3, 3, 7], [3, 4, 10]]); b.ent('moth', c - 10, 5); b.ent('moth', c - 18, 7);
  island(10, c0 => { b.row(9, c0 + 3, 'BNB'); bugs(b, [c0 + 7]); });
  run([[2, 4, 12], [2, 3, 10], [2, 3, 8], [2, 3, 10], [2, 3, 12]]); b.ent('moth', c - 7, 6);
  island(11, c0 => { b.row(9, c0 + 2, 'BCB'); bugs(b, [c0 + 6, c0 + 8]); });
  run([[2, 3, 11], [2, 2, 9], [2, 2, 7], [2, 2, 5], [3, 3, 7], [2, 2, 9], [2, 2, 11]]); b.ent('moth', c - 12, 3); b.ent('moth', c - 4, 8);
  island(8, c0 => b.ent('thorn', c0 + 4, 12));
  run([[3, 4, 10], [3, 3, 8], [3, 3, 10], [3, 3, 8], [3, 3, 6], [3, 4, 9], [3, 3, 11]]); b.ent('moth', c - 16, 5); b.ent('moth', c - 8, 7);
  island(12, c0 => { b.pillar(c0 + 4, 3); bugs(b, [c0 + 2, c0 + 8]); b.row(8, c0 + 7, 'BEB'); });
  run([[2, 3, 11], [2, 3, 9], [3, 3, 9], [2, 3, 7], [3, 4, 10], [2, 3, 12]]); b.ent('moth', c - 10, 6);
  c += 2; ground(b, c, c + 60); bugs(b, [c + 4]);
  const { pole, hut } = endZone(b, c + 8);
  const ug = underground(b, 40, pole - 30);
  return b.toJSON(meta('2-2', 'Canopy Climb', 'woods', { sky: [0.3, 0.6], pole, hut, seed: 22, checkpoints: [cp], ...ug }));
}

function w2_3(Builder) {
  const b = new Builder(700);
  ground(b, 0, 39);
  b.row(9, 10, 'BCB'); ground(b, 18, 24, 11); ground(b, 25, 30, 10); b.ent('bug', 22, 10); b.ent('bug', 34, 12);
  gemRow(b, 25, 8, 4);
  // ravine 1: a drifting raft
  b.ent('plat', 41, 11, { w: 3, dx: 5, period: 240 }); gemArc(b, 42, 8, 6);
  ground(b, 50, 72);
  ledge(b, 54, 10, 4); ledge(b, 59, 7, 4); gemRow(b, 59, 5, 4); bugs(b, [56, 64]); b.ent('moth', 68, 8);
  // ravine 2: a lift up to the high bank
  b.ent('plat', 74, 12, { w: 3, dy: -5, period: 220 });
  ground(b, 78, 96, 8); b.row(4, 84, 'BCB'); bugs(b, [88, 92], 7); gemRow(b, 80, 6, 3);
  ground(b, 97, 104, 10); ground(b, 105, 112, 12); b.ent('thorn', 108, 11);
  // ravine 3: two rafts in sequence
  b.ent('plat', 114, 11, { w: 3, dx: 4, period: 200 }); b.ent('plat', 123, 9, { w: 3, dx: 4, period: 200, phase: 100 });
  gemArc(b, 118, 7, 4); gemArc(b, 126, 5, 4);
  ground(b, 132, 150); b.row(9, 136, 'BEB'); b.pillar(144, 2); bugs(b, [140, 148]);
  const cp = 134;
  // Second half: falling logs, a lift down and a raft chain
  [152, 156, 160].forEach(c => b.ent('fall', c, 11, { w: 2 })); b.ent('fall', 163, 10, { w: 2 }); gemRow(b, 153, 8, 12);
  ground(b, 167, 180, 10); bugs(b, [171, 175], 9); b.row(6, 172, 'BCB');
  b.ent('plat', 181, 10, { w: 3, dy: 3, period: 200 }); ground(b, 185, 196); b.ent('moth', 192, 8); bugs(b, [194]);
  // raft chain over the wide ravine
  b.ent('plat', 198, 11, { w: 3, dx: 5, period: 220 }); b.ent('plat', 207, 8, { w: 3, dy: 3, period: 180 }); b.ent('plat', 212, 10, { w: 3, dx: 5, period: 220, phase: 110 });
  gemArc(b, 199, 8, 7); gemArc(b, 212, 7, 7);
  ground(b, 221, 238); b.row(9, 225, 'BNB'); bugs(b, [230, 233]); b.ent('thorn', 236, 12);
  ground(b, 241, 246, 11); ground(b, 249, 254, 9); ground(b, 257, 262, 11); gemArc(b, 246, 8, 3); gemArc(b, 254, 7, 3); b.ent('moth', 252, 5);
  ledge(b, 265, 10, 2); b.ent('fall', 269, 9, { w: 2 }); ledge(b, 273, 10, 2); gemRow(b, 265, 8, 10);
  ground(b, 277, 294); ledge(b, 281, 9, 4); ledge(b, 286, 6, 4); gemRow(b, 286, 4, 4); bugs(b, [283, 288, 291]);
  b.ent('plat', 296, 12, { w: 3, dy: -4, period: 200 }); ground(b, 300, 310, 9); bugs(b, [305], 8); b.row(5, 303, 'BCB');
  b.ent('plat', 312, 9, { w: 3, dx: 5, period: 200 }); ground(b, 321, 334); b.ent('moth', 326, 8); bugs(b, [328, 330]);
  // the great ravine: logs, a lift, and a raft pair
  [336, 340, 344].forEach((c, i) => b.ent('fall', c, 11 - i, { w: 2 })); gemRow(b, 336, 7, 10);
  ground(b, 348, 356, 8); bugs(b, [352], 7);
  b.ent('plat', 358, 8, { w: 3, dx: 6, period: 240 }); b.ent('plat', 370, 10, { w: 3, dx: 5, period: 220, phase: 60 }); gemArc(b, 359, 5, 8); gemArc(b, 370, 7, 7);
  ground(b, 380, 392); b.row(9, 383, 'BCB'); bugs(b, [388, 390]); b.ent('moth', 391, 7);
  b.ent('plat', 394, 12, { w: 3, dy: -5, period: 220 }); ground(b, 398, 408, 8); bugs(b, [403], 7); b.row(4, 401, 'BMB');
  [410, 414].forEach(c => b.ent('fall', c, 9, { w: 2 })); ground(b, 418, 460); bugs(b, [424]);
  const { pole, hut } = endZone(b, 428);
  return b.toJSON(meta('2-3', 'Rafts and Ravines', 'woods', { sky: [0.35, 0.65], pole, hut, seed: 23, checkpoints: [cp] }));
}

function w2_4(Builder) {
  const b = new Builder(1000);
  ground(b, 0, 130);
  // A: the old approach
  pit(b, 30, 33); pit(b, 50, 53);
  ledge(b, 12, 10, 3); ledge(b, 16, 7, 4); b.set(18, 3, 'E'); gemRow(b, 16, 5, 4);
  ledge(b, 29, 9, 6); gemRow(b, 30, 7, 4);
  b.pillar(40, 3); b.pillar(46, 4); ledge(b, 49, 8, 6);
  b.row(9, 58, 'BCNCB');
  bugs(b, [22, 26, 44, 62, 66]); b.ent('thorn', 56, 12); b.ent('moth', 36, 8); b.ent('moth', 54, 6);
  // B: canopy crossing
  pit(b, 72, 100); canopy(b, 72, [[1, 3, 11], [2, 3, 9], [2, 3, 7], [2, 4, 9], [2, 3, 11], [2, 3, 9]]);
  b.ent('moth', 80, 6); b.ent('moth', 92, 8);
  const cp1 = 102;
  bugs(b, [106, 108]); b.pillar(112, 3); b.pillar(118, 4); b.ent('thorn', 115, 12); b.row(8, 122, 'BEB');
  // C: rafts and falling logs over the deep hollow
  b.ent('plat', 131, 11, { w: 3, dx: 5, period: 220 }); gemArc(b, 132, 8, 7);
  ground(b, 140, 152); bugs(b, [144, 148]); b.ent('moth', 150, 7);
  [154, 158, 162, 166].forEach((x, i) => b.ent('fall', x, 11 - (i % 2), { w: 2 })); gemRow(b, 155, 8, 12);
  ground(b, 169, 186, 11); b.row(7, 173, 'BCB'); bugs(b, [176, 180], 10); b.ent('thorn', 184, 10);
  b.ent('plat', 188, 12, { w: 3, dy: -5, period: 220 });
  ground(b, 192, 214, 8); ledge(b, 197, 4, 4); b.set(198, 1, 'N'); bugs(b, [200, 204, 208], 7); gemRow(b, 196, 6, 3);
  ground(b, 215, 225, 10); ground(b, 226, 240); b.ent('moth', 222, 5); bugs(b, [230, 233]);
  const cp2 = 236;
  // D: the last stretch: ledges over a pit, a pillar yard, then the hollow
  ledge(b, 244, 10, 3); ledge(b, 248, 7, 3); ledge(b, 252, 10, 3); b.ent('moth', 250, 4); gemRow(b, 248, 5, 3);
  ground(b, 257, 280); b.pillar(262, 3); b.pillar(270, 4); bugs(b, [266], 12, 'thorn'); bugs(b, [274, 277]); gemArc(b, 263, 6, 8);
  ground(b, 285, 300); b.row(9, 289, 'BCB'); b.ent('moth', 296, 7);
  // E: the thorn canopy, a raft pair and one more log bridge
  canopy(b, 301, [[1, 3, 11], [2, 3, 9], [2, 2, 7], [2, 2, 5], [2, 3, 7], [2, 3, 9], [2, 3, 11]]); b.ent('moth', 312, 3); b.ent('moth', 322, 8);
  ground(b, 330, 342); b.pillar(334, 3); bugs(b, [338, 340]); b.row(8, 337, 'BCB');
  b.ent('plat', 344, 11, { w: 3, dx: 5, period: 220 }); b.ent('plat', 355, 9, { w: 3, dx: 4, period: 200, phase: 100 }); gemArc(b, 345, 8, 7); gemArc(b, 355, 6, 6);
  ground(b, 364, 378); bugs(b, [368, 371]); b.ent('thorn', 375, 12);
  [380, 384, 388, 392].forEach((x, i) => b.ent('fall', x, 11 - (i % 2) * 2, { w: 2 })); gemRow(b, 381, 7, 12);
  ground(b, 396, 410, 11); bugs(b, [400, 404], 10); b.row(7, 402, 'BNB');
  ground(b, 411, 440); b.ent('moth', 418, 7); bugs(b, [422, 425]);
  const cp3 = 414;
  // F: the burning hollow: jets, fire wheels and a lava bridge before Thornmaw
  let c = fireJets(b, 424, { n: 4, period: 160, on: 55 });
  c = fireHall(b, c + 2, { bars: 3, len: 5, speed: 0.035 });
  c = fireBridge(b, c + 2, { w: 18, bars: 2, len: 4, speed: 0.035 });
  ground(b, c, c + 8);
  lavaPits(b, 0, c);
  const A = boss(b, c + 8, { name: 'THORNMAW', hp: 5, kind: 2, speed: 0x00B00, jump: 120, shot: 150 });
  ledge(b, A.c0 + 5, 9, 4); ledge(b, A.c0 + 17, 9, 4); ledge(b, A.c0 + 11, 6, 3);
  const pole = A.c0 + 38; b.set(pole, 12, 'S');
  return b.toJSON(meta('2-4', "Thornmaw's Hollow", 'woods', { sky: [0.45, 0.7], pole, hut: pole + 4, seed: 24, boss: A, checkpoints: [cp1, cp2, cp3] }));
}

export const LEVELS = [w1_1, w1_2, w1_3, w1_4, w2_1, w2_2, w2_3, w2_4].map(build => ({ build }));
