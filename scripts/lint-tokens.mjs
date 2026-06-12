#!/usr/bin/env node
// 060-design-system.md, the CI scans (Law 10 — the guardrails guard the guard):
//  1. No 8/9/11px text in owned chrome; 10px only per the counted ledger below.
//  2. Accent rule: amber/green/red color literals only in status-bearing files.
//  3. Radius scale: only var(--radius-*) radii.
// Scans run against the apps/ glob; an empty glob is green, not an error.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const APPS = join(ROOT, 'apps');

// The counted 10px badge ledger — adding an entry is a deliberate, reviewed edit.
const BADGE_LEDGER = {
  'apps/coursemapper/src/styles.css': 6, // id badges, chips, count pills, spine state labels, ticker, ledger rows
};
// Files allowed to carry status colors (amber/green/red) — status-bearing components only.
const STATUS_FILES = [/styles\.css$/];

const failures = [];
function walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return; // no app yet — scans run against an empty glob without erroring
  }
  for (const entry of entries) {
    if (entry === 'node_modules' || entry === 'dist') continue;
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) walk(p);
    else if (/\.(css|tsx|ts)$/.test(entry)) scan(p);
  }
}
function scan(p) {
  const rel = p.replace(ROOT, '');
  const text = readFileSync(p, 'utf8');
  const subTwelve = text.match(/font-size:\s*(8|9|11)px/g);
  if (subTwelve) failures.push(`${rel} — sub-floor text (${subTwelve.join(', ')}); the floor is 12px`);
  const tens = (text.match(/font-size:\s*10px/g) || []).length;
  const allowed = BADGE_LEDGER[rel] ?? 0;
  if (tens > allowed) failures.push(`${rel} — ${tens}× 10px but ledger allows ${allowed} (edit the ledger deliberately)`);
  if (/border-radius:\s*\d/.test(text) && !/border-radius:\s*(50%|9999px)/.test(text)) {
    const bespoke = text.match(/border-radius:\s*\d+px/g)?.filter((r) => !/var\(/.test(r));
    if (bespoke?.length) failures.push(`${rel} — bespoke radii ${bespoke.join(', ')}; use var(--radius-lg|md|sm)`);
  }
  if (!STATUS_FILES.some((re) => re.test(rel))) {
    const statusColor = text.match(/#(?:d97706|059669|dc2626|b45309|047857|b91c1c)/gi);
    if (statusColor) failures.push(`${rel} — status color literal outside a status-bearing file`);
  }
}
walk(APPS);
if (failures.length) {
  console.error('DESIGN TOKEN SCAN FAILURES (Law 10):\n' + failures.join('\n'));
  process.exit(1);
}
console.log('token scans: floors, accent rule, radius scale all green');
