// Replays: the solver's winning inputs, stored compactly as macro-action indices.
// Shared by tools/solver-lib.mjs (which records them) and the game's Watch mode.
export const BLOCK = 4;
export const ACTIONS = [];
for (const dir of [1, 0, -1]) for (const jump of [false, true]) for (const run of [true, false]) {
  if (!run && dir === 0) continue;
  ACTIONS.push({ dir, jump, run });
}
// Per-frame inputs for a path, in the shape sim.step() takes.
export function pathInputs(path) {
  const out = []; let held = false;
  for (const ai of path) { const a = ACTIONS[ai]; for (let f = 0; f < BLOCK; f++) { out.push({ left: a.dir < 0, right: a.dir > 0, run: a.run, jump: a.jump, jumpP: a.jump && !held }); held = a.jump; } }
  return out;
}
