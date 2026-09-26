// Authors the level JSON files in levels/. Run: node tools/gen-levels.mjs [--only 1-2]
// The JSON files are the source of truth the game loads. This script is how they were written;
// re-running it overwrites them, so hand edits to the JSON should be ported back here.
import fs from 'node:fs';
import { Builder } from './lib-builder.mjs';
import { LEVELS as HAND } from './level-defs.mjs';
import { WORLDS_3_11 } from './worlds.mjs';
const LEVELS = [...HAND, ...WORLDS_3_11];

const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null;
const out = new URL('../levels/', import.meta.url);
const index = [];
for (const def of LEVELS) {
  const lv = def.build(Builder);
  index.push({ id: lv.id, name: lv.name, theme: lv.theme });
  if (only && lv.id !== only) continue;
  fs.writeFileSync(new URL(`w${lv.id}.json`, out), stringify(lv));
  console.log(`w${lv.id}.json  ${lv.rows[0].length} cols  ${lv.ents.length} ents  ${lv.gems.length} gems  "${lv.name}"`);
}
fs.writeFileSync(new URL('index.json', out), JSON.stringify(index, null, 1) + '\n');

// Rows one per line so the maps stay readable and diffable.
function stringify(lv) {
  const { rows, ents, gems, ...meta } = lv;
  return '{\n' + Object.entries(meta).map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},\n`).join('') +
    '  "rows": [\n' + rows.map(r => '    ' + JSON.stringify(r)).join(',\n') + '\n  ],\n' +
    '  "ents": [\n' + ents.map(e => '    ' + JSON.stringify(e)).join(',\n') + '\n  ],\n' +
    '  "gems": ' + JSON.stringify(gems) + '\n}\n';
}
