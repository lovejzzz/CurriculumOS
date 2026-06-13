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
  /** write a versioned corpus record (F.1) — implied by --courses campaign */
  corpus: boolean;
}

function parseArgs(argv: string[]): Args {
  const a: Args = { courses: 'smoke', real: false, voice: false, maxSpend: Infinity, judge: false, corpus: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--courses') a.courses = argv[++i] ?? 'smoke';
    else if (argv[i] === '--real') a.real = true;
    else if (argv[i] === '--voice') a.voice = true;
    else if (argv[i] === '--judge') a.judge = true;
    else if (argv[i] === '--corpus') a.corpus = true;
    else if (argv[i] === '--max-spend') a.maxSpend = Number(argv[++i]);
  }
  if (a.courses === 'campaign') a.corpus = true;
  return a;
}

/** One course's archived measurement (F.1: versioned history, like the
 *  verdicts ledger this repo inherited). */
export interface CorpusRecord {
  stamp: string;
  date: string;
  spec: string;
  courses: {
    id: string;
    terminal: string;
    structural: number;
    teachability: number;
    judge: number | null;
    /** both judge calls when stability demanded two (F.3) */
    judgeCalls: number[];
    drift: number | null;
    perArtifact: { artifact: string; score10: number; deficiency: string }[];
    linked: number;
    bridges: number;
    costUsd: number;
  }[];
  totalSpend: number;
  pass: boolean;
}

/** drift gate tolerance (G6) — V0.0.3 tightened this from 3 → 2 */
const DRIFT_TOLERANCE = 2;

export async function runRound(args: Args): Promise<{ results: DriveResult[]; pass: boolean; report: string; corpus: CorpusRecord }> {
  const courses = resolveCourses(args.courses) as { id: string; title: string; prompt: string; seededGap?: unknown; expectGenome?: string }[];
  const results: DriveResult[] = [];
  const judgeVerdicts = new Map<string, JudgeVerdict>();
  const judgeCalls = new Map<string, number[]>();
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

    // the judge (ADR-11): advisory verdict + drift vs the in-app meter.
    // Judge stability (F.3): a single call that would FAIL the drift gate is
    // re-asked once — variance is a measurement problem, not a content
    // problem; the AVERAGE gates, both calls are archived.
    if (args.judge && r.terminal === 'ready' && totalSpend < args.maxSpend) {
      const v1 = await judgeCourse(r.course);
      totalSpend += v1.usd;
      const calls = [v1.score10];
      let verdict = v1;
      if (Math.abs(v1.score10 - r.teachability) > DRIFT_TOLERANCE && totalSpend < args.maxSpend) {
        const v2 = await judgeCourse(r.course);
        totalSpend += v2.usd;
        calls.push(v2.score10);
        const avg = Math.round((v1.score10 + v2.score10) / 2);
        // keep the per-artifact detail of the call CLOSER to the average
        const closer = Math.abs(v1.score10 - avg) <= Math.abs(v2.score10 - avg) ? v1 : v2;
        verdict = { ...closer, score10: avg, usd: v1.usd + v2.usd };
      }
      judgeCalls.set(r.id, calls);
      judgeVerdicts.set(r.id, verdict);
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

  // Pass C instrumentation (the 10/10 plan, R1): every item fallback is named
  for (const r of results) {
    const itemsState = r.course.receipts.builds.at(-1)?.states.find((s) => s.state === 'items');
    if (itemsState?.detail && itemsState.detail.includes('fallback') && !itemsState.detail.includes('0 fallback')) {
      lines.push(`items (${r.id}): ${itemsState.detail}`);
    }
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
  for (const [id, v] of judgeVerdicts) {
    const r = results.find((x) => x.id === id)!;
    const drift = Math.abs(v.score10 - r.teachability);
    const calls = judgeCalls.get(id) ?? [];
    const stability = calls.length > 1 ? ` (judged twice: ${calls.join(', ')} → avg ${v.score10})` : '';
    lines.push(`judge (${id}): ${v.score10}/10${stability} — "${v.verdictLine}"`);
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

  // ── the corpus record (F.1): the versioned, committable measurement ──
  const stamp = process.env.ROUND_STAMP ?? String(process.pid);
  const corpus: CorpusRecord = {
    stamp,
    date: new Date().toISOString().slice(0, 10),
    spec: args.courses,
    courses: results.map((r) => {
      const v = judgeVerdicts.get(r.id);
      return {
        id: r.id,
        terminal: r.terminal === 'ready' ? 'ready' : `blocked:${r.blockedReason}`,
        structural: r.structural,
        teachability: r.teachability,
        judge: v?.score10 ?? null,
        judgeCalls: judgeCalls.get(r.id) ?? [],
        drift: v ? Math.abs(v.score10 - r.teachability) : null,
        perArtifact: v?.perArtifact ?? [],
        linked: r.linked,
        bridges: r.bridges,
        costUsd: Number(r.costUsd.toFixed(4)),
      };
    }),
    totalSpend: Number(totalSpend.toFixed(4)),
    pass,
  };

  return { results, pass, report: lines.join('\n'), corpus };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const { pass, report, corpus } = await runRound(args);
  const dir = join(HERE, '..', 'rounds');
  mkdirSync(dir, { recursive: true });
  const path = join(dir, `round-${corpus.stamp}.md`);
  writeFileSync(path, report);
  // the corpus is COMMITTED history (rounds/ is gitignored scratch; corpus/
  // is the archive the 10/10 claim cites — F.1)
  if (args.corpus) {
    const corpusDir = join(HERE, '..', 'corpus');
    mkdirSync(corpusDir, { recursive: true });
    writeFileSync(join(corpusDir, `${corpus.date}-${corpus.stamp}.json`), JSON.stringify(corpus, null, 2));
  }
  // eslint-disable-next-line no-console
  console.log(report);
  // eslint-disable-next-line no-console
  console.log(`\nreport written: ${path}${args.corpus ? ` · corpus record: ${corpus.date}-${corpus.stamp}.json` : ''}`);
  if (!pass) process.exitCode = 1;
}

// run when invoked directly
if (process.argv[1] && process.argv[1].endsWith('round.ts')) {
  void main();
}
