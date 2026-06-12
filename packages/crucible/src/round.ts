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
import { buildPackage, auditPackage, gradeStructural } from '@curriculumos/core';
import { driveCourse, type DriveResult } from './driver.ts';
import { judgeCourse, type JudgeVerdict } from './judge.ts';
// the fixtures are plain data (.mjs) copied from the handoff kit
// @ts-expect-error — .mjs fixture has no types; shape is known
import { resolveCourses } from '../fixtures/courses.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

interface Args {
  courses: string;
  real: boolean;
  voice: boolean;
  maxSpend: number;
  /** run the model judge (advisory; drift vs the meter is the gated number) */
  judge: boolean;
}

function parseArgs(argv: string[]): Args {
  const a: Args = { courses: 'smoke', real: false, voice: false, maxSpend: Infinity, judge: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--courses') a.courses = argv[++i] ?? 'smoke';
    else if (argv[i] === '--real') a.real = true;
    else if (argv[i] === '--voice') a.voice = true;
    else if (argv[i] === '--judge') a.judge = true;
    else if (argv[i] === '--max-spend') a.maxSpend = Number(argv[++i]);
  }
  return a;
}

export async function runRound(args: Args): Promise<{ results: DriveResult[]; pass: boolean; report: string }> {
  const courses = resolveCourses(args.courses) as { id: string; title: string; prompt: string; seededGap?: unknown; expectGenome?: string }[];
  const results: DriveResult[] = [];
  const judgeVerdicts = new Map<string, JudgeVerdict>();
  const auditCounts = new Map<string, number>();
  let totalSpend = 0;

  for (const c of courses) {
    if (totalSpend >= args.maxSpend) break;
    const r = await driveCourse(c, { real: args.real, voice: args.voice, budgetUsd: args.maxSpend - totalSpend });
    totalSpend += r.costUsd;
    results.push(r);

    // Law 1: the artifact is the test — build the REAL package bytes and run
    // the export audit on them, every round
    const auditFindings = auditPackage(buildPackage(r.course)).filter((f) => f.severity === 'P0');
    auditCounts.set(r.id, auditFindings.length);

    // the judge (ADR-11): advisory verdict + drift vs the in-app meter
    if (args.judge && r.terminal === 'ready' && totalSpend < args.maxSpend) {
      const v = await judgeCourse(r.course);
      totalSpend += v.usd;
      judgeVerdicts.set(r.id, v);
    }
  }

  // ── the bars ──
  const lines: string[] = [];
  lines.push(`# Crucible round — ${args.real ? 'REAL provider' : 'fake engine'}${args.judge ? ' · judged' : ''}`);
  lines.push('');
  lines.push(`courses: ${args.courses} · voice: ${args.voice} · total spend: $${totalSpend.toFixed(4)}`);
  lines.push('');
  lines.push('| course | terminal | structural | teachable | judge | drift | export P0s | findings | linked | bridges | $ |');
  lines.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |');

  let pass = true;
  for (const r of results) {
    const ready = r.terminal === 'ready';
    if (!ready) pass = false;
    const exportP0s = auditCounts.get(r.id) ?? 0;
    if (exportP0s > 0) pass = false; // rendered-bytes audit gates the round (G4)
    const v = judgeVerdicts.get(r.id);
    const drift = v ? Math.abs(v.score10 - r.teachability) : null;
    lines.push(
      `| ${r.id} | ${ready ? 'ready' : `blocked:${r.blockedReason}`} | ${r.structural}/${r.letter} | ${r.teachability}/10 | ${v ? `${v.score10}/10` : '—'} | ${drift !== null ? drift.toFixed(0) : '—'} | ${exportP0s} | ${r.findings} | ${r.linked} | ${r.bridges} | $${r.costUsd.toFixed(4)} |`,
    );
  }
  lines.push('');

  // findings detail for any course under 90 — a 70/C must explain itself in the report
  for (const r of results) {
    if (r.structural < 90) {
      const s = gradeStructural(r.course);
      lines.push(`findings (${r.id}, ${r.structural}/${r.letter}):`);
      for (const f of s.findings.slice(0, 10)) lines.push(`  - ${f.severity} [${f.dimension}] ${f.detail} :: ${f.evidence.slice(0, 70)}`);
      lines.push('');
    }
  }

  // drift gate (G6): in-app meter vs judge within 2 points or the round fails.
  // V0.0.3 tightened this from 3 → 2 — the meter was recalibrated to track the
  // judge, so a wider band would let the meter drift back into over-crediting.
  const DRIFT_TOLERANCE = 2;
  for (const [id, v] of judgeVerdicts) {
    const r = results.find((x) => x.id === id)!;
    const drift = Math.abs(v.score10 - r.teachability);
    lines.push(`judge (${id}): ${v.score10}/10 — "${v.verdictLine}"`);
    for (const pa of v.perArtifact) lines.push(`  - ${pa.artifact}: ${pa.score10}/10 — ${pa.deficiency}`);
    if (drift > DRIFT_TOLERANCE) {
      lines.push(`  ✗ DRIFT GATE: |judge ${v.score10} − meter ${r.teachability}| = ${drift} > ${DRIFT_TOLERANCE} — round fails (G6)`);
      pass = false;
    }
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
  if (blocked.length) {
    lines.push(`blocked courses: ${blocked.map((b) => `${b.id}(${b.blockedReason})`).join(', ')}`);
    for (const b of blocked) {
      // surface the NAMED error from the build record (Law 6)
      const errState = b.course.receipts.builds.at(-1)?.states.find((s) => s.state === 'error');
      if (errState?.detail) lines.push(`  ${b.id}: ${errState.detail}`);
    }
  }

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
