#!/usr/bin/env node
// ADR-10: no file in packages/ over 1,500 lines — the 18,289-line lesson.
// Template data files are exempt from the budget but must stay data-only
// (a template file importing logic fails lint-core-purity instead).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const BUDGET = 1500;
const SCAN_DIRS = ['packages', 'apps'];
const EXEMPT = [/render\/templates\//];

const failures = [];
function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'dist' || entry === 'types-out') continue;
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) walk(p);
    else if (/\.(ts|tsx|js|mjs|jsx)$/.test(entry)) {
      if (EXEMPT.some((re) => re.test(p))) continue;
      const lines = readFileSync(p, 'utf8').split('\n').length;
      if (lines > BUDGET) failures.push(`${p.replace(ROOT, '')} — ${lines} lines (budget ${BUDGET})`);
    }
  }
}
for (const d of SCAN_DIRS) {
  try {
    walk(join(ROOT, d));
  } catch {
    /* dir may not exist yet */
  }
}
if (failures.length) {
  console.error('FILE BUDGET EXCEEDED (ADR-10):\n' + failures.join('\n'));
  process.exit(1);
}
console.log('file budget: all files within 1,500 lines');
