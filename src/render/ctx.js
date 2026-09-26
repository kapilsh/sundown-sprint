// Shared render state. VH is fixed at 240 world px; S is the integer-friendly render scale.
export const VH = 240;
export const R = {
  cv: null, ctx: null, S: 3, VW: 427,
  LC: null, lctx: null, VIG: null, GRAIN: null, T: {}, theme: null,
  lights: [], blooms: [], frame: 0,
};
