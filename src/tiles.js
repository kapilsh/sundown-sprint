// =============== Tile chars ===============
// G ground, B brick, M multi-gem brick, C gem crate, E ember crate, N lantern (1-up) crate, U used crate,
// S stone, L/R pillar body, l/r pillar cap, I ice, < > conveyors, X boss gate,
// - one-way ledge, ~ water, V lava, ^ spikes, . empty
export const SOLID = new Set(['G', 'B', 'C', 'U', 'S', 'L', 'R', 'l', 'r', 'M', 'E', 'N', 'I', '<', '>', 'X']);
export const ONEWAY = '-';
export const WATER = '~';
export const LAVA = 'V';
export const SPIKE = '^';
export const TILE_CHARS = new Set([...SOLID, '.', '-', '~', 'V', '^']);
