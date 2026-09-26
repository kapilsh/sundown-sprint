// Level-building helpers for tools/gen-levels.mjs. Produces the JSON shape the game loads.
export const LH = 15;
export class Builder {
  constructor(w) { this.w = w; this.g = []; for (let r = 0; r < LH; r++) this.g.push(new Array(w).fill('.')); this.ents = []; this.gems = []; }
  set(c, r, t) { if (c >= 0 && c < this.w && r >= 0 && r < LH) this.g[r][c] = t; }
  get(c, r) { return (c >= 0 && c < this.w && r >= 0 && r < LH) ? this.g[r][c] : '.'; }
  fill(c0, c1, r0, r1, t) { for (let c = c0; c <= c1; c++) for (let r = r0; r <= r1; r++) this.set(c, r, t); }
  row(r, from, str) { [...str].forEach((t, i) => t !== '.' && this.set(from + i, r, t)); }
  pillar(c, h, base = 12) { for (let i = 0; i < h; i++) { const r = base - i, top = i === h - 1; this.set(c, r, top ? 'l' : 'L'); this.set(c + 1, r, top ? 'r' : 'R'); } }
  stair(c, h, base = 12, t = 'S') { for (let i = 0; i < h; i++) this.set(c, base - i, t); }
  ent(t, c, r, extra = {}) { this.ents.push({ t, c, r, ...extra }); }
  gem(c, r) { if (!this.gems.some(([a, b]) => a === c && b === r)) this.gems.push([c, r]); }
  toJSON(meta) {
    // Levels end 14 columns past the lantern pole, like the original.
    const w = meta.pole ? Math.min(this.w, meta.pole + 14) : this.w;
    this.ents.sort((a, b) => a.c - b.c);
    return { ...meta, rows: this.g.map(r => r.slice(0, w).join('')), ents: this.ents.filter(e => e.c < w), gems: this.gems.filter(([c]) => c < w) };
  }
}
