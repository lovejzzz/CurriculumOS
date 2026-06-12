#!/usr/bin/env node
// ADR-03: packages/core is pure — zero reachable fetch/DOM/fs/Date.now/Math.random.
// Effects are ports. This import-graph lint is the CI check that keeps the engine
// isomorphic (browser/server/CI) and replay deterministic.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const CORE = join(ROOT, 'packages/core/src');
const KNOWLEDGE = join(ROOT, 'packages/knowledge/src');

const BANNED = [
  { re: /\bDate\.now\s*\(/, name: 'Date.now()' },
  { re: /\bnew Date\s*\(\s*\)/, name: 'new Date() (argless)' },
  { re: /\bMath\.random\s*\(/, name: 'Math.random()' },
  { re: /\bfetch\s*\(/, name: 'fetch()' },
  { re: /from ['"]node:fs['"]/, name: 'node:fs import' },
  { re: /from ['"]fs['"]/, name: 'fs import' },
  { re: /from ['"]node:http['"]/, name: 'node:http import' },
  { re: /\bdocument\./, name: 'DOM access (document)' },
  { re: /\bwindow\./, name: 'DOM access (window)' },
  { re: /\blocalStorage\b/, name: 'localStorage' },
];

const failures = [];
function walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const entry of entries) {
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) walk(p);
    else if (/\.(ts|tsx)$/.test(entry) && !entry.endsWith('.test.ts')) {
      const text = readFileSync(p, 'utf8');
      for (const { re, name } of BANNED) {
        const lines = text.split('\n');
        lines.forEach((line, i) => {
          if (re.test(line) && !line.trimStart().startsWith('//') && !line.trimStart().startsWith('*')) {
            failures.push(`${p.replace(ROOT, '')}:${i + 1} — ${name}`);
          }
        });
      }
    }
  }
}
walk(CORE);
walk(KNOWLEDGE);
if (failures.length) {
  console.error('CORE PURITY VIOLATIONS (ADR-03):\n' + failures.join('\n'));
  process.exit(1);
}
console.log('core purity: no banned effects reachable from packages/core or packages/knowledge');
