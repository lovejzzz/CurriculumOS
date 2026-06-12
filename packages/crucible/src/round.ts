/** crucible/round.ts — run a Crucible round (founding §8). Drives a set of
 *  fixture courses through the engine, grades each, writes a round report, and
 *  checks the bars: terminal=ready, no P0s, seeded-gap bridges present.
 *
 *  Usage: tsx packages/crucible/src/round.ts [--courses all|extended|smoke|<ids>]
 *                                            [--real] [--voice] [--max-spend 0.5]
 *
 *  --real uses the configured provider (OpenAI/DeepSeek); default is the fake
 *  engine ($0, deterministic) so the round runs in CI without keys.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { driveCourse, type DriveResult } from './driver.ts';
// the fixtures are plain data (.mjs) copied from the handoff kit
// @ts-expect-error — .mjs fixture has no types; shape is known
import { resolveCourses } from '../fixtures/courses.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

interface Args {
  courses: string;
  real: boolean;
  voice: boolean;
  maxSpend: number;
}

function parseArgs(argv: string[]): Args {
  const a: Args = { courses: 'smoke', real: false, voice: false, maxSpend: Infinity };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--courses') a.courses = argv[++i] ?? 'smoke';
    else if (argv[i] === '--real') a.real = true;
    else if (argv[i] === '--voice') a.voice = true;
    else if (argv[i] === '--max-spend') a.maxSpend = Number(argv[++i]);
  }
  return a;
}

interface SeededGap {
  id: string;
  expectBridge: boolean;
}

export async function runRound(args: Args): Promise<{ results: DriveResult[]; pass: boolean; report: string }> {
  const courses = resolveCourses(args.courses) as { id: string; title: string; prompt: string; seededGap?: unknown; expectGenome?: string }[];
  const results: DriveResult[] = [];
  let totalSpend = 0;

  for (const c of courses) {
    if (totalSpend >= args.maxSpend) break;
    const r = await driveCourse(c, { real: args.real, voice: args.voice, budgetUsd: args.maxSpend - totalSpend });
    totalSpend += r.costUsd;
    results.push(r);
  }

  // ── the bars ──
  const lines: string[] = [];
  lines.push(`# Crucible round — ${args.real ? 'REAL provider' : 'fake engine'}`);
  lines.push('');
  lines.push(`courses: ${args.courses} · voice: ${args.voice} · total spend: $${totalSpend.toFixed(4)}`);
  lines.push('');
  lines.push('| course | terminal | structural | teachable | findings | linked | bridges | $ |');
  lines.push('| --- | --- | --- | --- | --- | --- | --- | --- |');

  let pass = true;
  for (const r of results) {
    const ready = r.terminal === 'ready';
    if (!ready) pass = false;
    lines.push(
      `| ${r.id} | ${ready ? 'ready' : `blocked:${r.blockedReason}`} | ${r.structural}/${r.letter} | ${r.teachability}/10 | ${r.findings} | ${r.linked} | ${r.bridges} | $${r.costUsd.toFixed(4)} |`,
    );
  }
  lines.push('');

  // seeded-gap honesty (the econ elasticity→demand-curve gap must be bridged)
  const econ = results.find((r) => r.id === 'econ-intro');
  if (econ) {
    const ok = econ.bridges > 0;
    lines.push(`seeded-gap (econ-intro): ${ok ? '✓ bridge diagnosed' : '✗ MISSING — round fails'}`);
    if (!ok) pass = false;
  }

  // P0 honesty: no course may carry an unrepaired P0 (they'd block, but report it)
  const blocked = results.filter((r) => r.terminal !== 'ready');
  if (blocked.length) lines.push(`blocked courses: ${blocked.map((b) => `${b.id}(${b.blockedReason})`).join(', ')}`);

  lines.push('');
  lines.push(`## verdict: ${pass ? 'PASS' : 'FAIL'}`);

  return { results, pass, report: lines.join('\n') };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const { pass, report } = await runRound(args);
  const dir = join(HERE, '..', 'rounds');
  mkdirSync(dir, { recursive: true });
  const stamp = process.env.ROUND_STAMP ?? String(process.pid);
  const path = join(dir, `round-${stamp}.md`);
  writeFileSync(path, report);
  // eslint-disable-next-line no-console
  console.log(report);
  // eslint-disable-next-line no-console
  console.log(`\nreport written: ${path}`);
  if (!pass) process.exitCode = 1;
}

// run when invoked directly
if (process.argv[1] && process.argv[1].endsWith('round.ts')) {
  void main();
}
