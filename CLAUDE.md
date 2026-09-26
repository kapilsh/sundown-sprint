# Sundown Sprint

A browser-native 2D platformer. Dusky carries a lantern home at dusk. Vanilla JS ES modules, Canvas 2D, WebAudio, no build step and no runtime dependencies beyond Google Fonts. Started from the single-file "Duskrunner" prototype. Level 1-1 is that prototype's level, unchanged.

Run it with `npm run dev` (zero-dependency static server on :8080). ES modules don't load from `file://`.

## Goal

A **44-level game**: 11 worlds × 4 levels. Every x-2 goes underground: a short surface start ends at a cellar door; walking in fades to a sealed underground area, and a lit ladder at its end fades back up to the surface near the goal. Every x-4 is a fire fortress (lava pits, rotating fire wheels, floor fire jets, lava bridges) ending in a boss arena. Keep the existing feel and look.

**Length targets** (bot frames from `npm run solve`): normal levels ≥ ~2,500 frames (about 400–470 columns, one checkpoint); x-4 levels ≥ ~3,800 frames (long approach, two or three checkpoints). Every level gets `time` 400, the maximum. Bosses get a second phase at half health (faster, jumpier, one extra seed).

## Non-negotiables

- **Physics stays SMB1-exact.** `P` and `JUMPS` in `src/physics.js` hold the reverse-engineered SMB1 constants, in units of 1/4096 px per frame. Positions and velocities are integers. The sim ticks at a fixed 60 Hz, and rendering is decoupled. `tests/physics.test.mjs` replays golden traces recorded from the original prototype (on its frozen map, `tests/golden/level-duskrunner.json`) and must stay bit-exact.
- **Additions** that SMB1 never had on land (swimming, springs, ice, conveyors, wind, shells) live in `SWIM`/`SPRING`/`ICE`/`CONVEYOR` and only apply where those tiles or entities exist. Fire hazards (`firebar`, `jet` entities) are pure functions of the frame count (`fireballs()`, `jetPhase()` in `sim.js`), so the renderer and the sim always agree.
- **"Modern assists"** (coyote time, jump buffer) are a toggle (`W.assist`). Strict mode must still behave like 1985.
- **Hitboxes are fixed** (`HOX/HW/HOY/HH` for the hero; 14px bodies for enemies). Squash/stretch is visual only.
- **All art is original and procedural.** No Nintendo sprites, names, music, or recognizable level layouts.
- World units: 16px tiles, level height 15 rows (240px), view is 240 tall × `VW` wide (16:9). The sim uses a fixed `VIEW_W = 427` for the camera and spawning so it's resolution independent.

## Layout

| Path | What's there |
|---|---|
| `src/physics.js` | `P`, `JUMPS`, extension constants |
| `src/sim.js` | **Pure deterministic gameplay** (no DOM, audio or `Math.random`). `createWorld(level)`, `step(W, input)`, `cloneWorld`. Visual side effects go out as events in `W.ev` |
| `src/tiles.js` | Tile chars. `G` ground, `B` brick, `M` multi-gem brick, `C` gem crate, `E` ember crate, `N` lantern (1-up) crate, `U` used, `S` stone, `L/R/l/r` pillar, `-` one-way ledge, `~` water, `V` lava, `^` spikes, `I` ice, `<` `>` conveyors, `X` boss gate |
| `src/themes.js` | One theme per world: sky stops, parallax styles, tile palette, darkness, ambient particles, music voicing |
| `src/render/*` | `tiles` (cached per theme), `sky` (parallax styles), `world` (tiles, Dusky, enemies, bosses, goal, lighting), `fx` (particles from sim events), `hud` (HUD, level select, cards) |
| `src/audio.js` | Synth SFX and the music loop. Each world re-voices the same D-dorian melody |
| `src/input.js` | Keyboard, gamepad and touch merged in `poll()` |
| `src/main.js` | Mode machine `title → select → intro → play ↔ paused → cleared/over/ending`, save (`localStorage`, guarded), test mode, the fixed-step loop |
| `levels/w{W}-{L}.json` | Level data: `rows` (15 strings), `ents`, `gems`, `pole`, `hut`, `start`, `sky` (time-of-day range), `theme`, `checkpoints` (columns with lantern posts; dying respawns at the last one passed), optional `boss`, `wind`, `meteors`, `under` ([c0, c1] columns that are underground: brick ceiling, underground tiles, backdrop and music), `zones` (areas the camera never crosses; `door` entities with `to: [col, row]` move Dusky between them with a fade), `home` (11-4 only) |
| `tools/level-defs.mjs` | Worlds 1–2, designed column by column. `node tools/gen-levels.mjs` writes the JSON |
| `tools/sections.mjs` | Reusable pieces: gaps (or lava), pillars, stair gaps, stepping stones, ledges, mesas, rafts, lifts, falling logs, spring walls, water pools, ice, conveyor belts, spikes, cave ceilings, cloud islands, brick tunnels, boss arenas |
| `tools/compose.mjs`, `tools/worlds.mjs` | Worlds 3–11. Each level is a seeded sequence of pieces from its world's set (weights in `worlds.mjs`), plus hand-picked signature pieces. To change a level: edit its spec, or change `reseed` to try another arrangement, then solve it |
| `tools/solve.mjs` | Beam-search bot that plays the real sim. `npm run solve` must pass for every level |

## Workflow for a level

1. Design it in `tools/level-defs.mjs` (or its spec in `tools/worlds.mjs`).
2. `npm run levels` then `npm test` (structural checks and physics).
3. `npm run solve -- 3-2` must say PASS (and "boss beaten" on x-4). A FAIL prints the furthest x the bot reached.
   Then `node tools/solve.mjs 3-2 --out levels/replays.json` to record the run Watch mode plays (`npm run replays` redoes all 44, which takes a while; `--beam 600` helps a stuck search). `npm test` fails if a replay is stale.
   If the bot needs far more frames than similar levels, look for a spot where it hesitates; that usually means the layout is awkward for people too.
4. Look at it: `npm run dev`, then `http://localhost:8080/?level=3-2`.

## Test mode

Watch mode (`?watch=2-1`, the "Watch the bot play" button, or `V` on the level select) replays `levels/replays.json` through every built level.

Test mode only exists in local development (localhost or file://); the published site always starts at the title with the player's own progress. `?test` or the Test mode button: every built level unlocked, infinite lives, progress not saved, a jump-to menu, and in game `[` `]` for previous/next level and `R` to restart. `?level=2-3` starts a level directly.

## Conventions

- Keep everything drawable procedurally. No external asset downloads at runtime except Google Fonts.
- Keep rendering at integer device pixels for tiles (`worldXform()` rounds the camera to 1/S).
- Test at 360px wide (touch controls appear on coarse pointers) and on 60 Hz and 120 Hz displays. Speed must be identical on both.
