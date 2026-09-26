// =============== Physics (SMB1, 1/4096 px per frame) ===============
// Positions and velocities are integers in 1/4096 px. The sim ticks at a fixed 60 Hz.
export const SUB = 4096;
export const P = { MIN_WALK: 0x00130, WALK_ACC: 0x00098, RUN_ACC: 0x000E4, REL_DEC: 0x000D0, SKID_DEC: 0x001A0,
  MAX_WALK: 0x01900, MAX_RUN: 0x02900, SKID_TURN: 0x00900, MAX_FALL: 0x04800, FALL_CAP: 0x04000, STOMP_BOUNCE: 0x04000 };
export const JUMPS = [
  { lim: 0x01000, v: 0x04000, hold: 0x00200, fall: 0x00700 },
  { lim: 0x02500, v: 0x04000, hold: 0x001E0, fall: 0x00600 },
  { lim: Infinity, v: 0x05000, hold: 0x00280, fall: 0x00900 } ];

// Extensions for mechanics SMB1 never had on land. Same units, still integer-only.
export const SWIM = { STROKE: 0x01800, GRAV: 0x000C0, MAX_FALL: 0x01000, MAX_X: 0x01000, MAX_X_RUN: 0x01600, DRAG: 0x00040 };
export const SPRING = { LOW: 0x04800, HIGH: 0x06C00 };
export const ICE = { ACC_SHIFT: 1, REL_SHIFT: 3, SKID_SHIFT: 2 };
export const CONVEYOR = 0x00A00;
export const SHELL_KICK = 0x03000;

export const hex = n => '0x' + n.toString(16).toUpperCase().padStart(5, '0');
export const jumpParams = s => JUMPS.find(j => s < j.lim);
