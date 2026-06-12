/** crucible/flywheel-live.ts — the live flywheel cycle (v0.0.8, workstream E.2).
 *  One REAL build of a cache-cold course with live retrieval: cache-missed
 *  concepts whose model kernels are corroborated by a provider topic get
 *  promoted, persist into the genome extension store, and the proof is the
 *  RE-LINK — the same concepts link from the extension at $0 (pure linkStage,
 *  no model call). This is the deterministic flywheel test run against the
 *  real world.
 *
 *  Usage: OPENAI_API_KEY=... npx tsx packages/crucible/src/flywheel-live.ts [courseId]
 *  Reports to stdout; the extension persists under .data/genome/ (gitignored). */
import { join } from 'node:path';
import { buildCourse, linkStage } from '@curriculumos/core';
import { modelFromEnv, SystemClock, CryptoRand, LiveRetrievalPort, ExtensionStore } from '@curriculumos/api';
import type { RetrievalSummary } from '@curriculumos/core';
// @ts-expect-error — .mjs fixture has no types; shape is known
import { getCourseById } from '../fixtures/courses.mjs';

const courseId = process.argv[2] ?? 'public-speaking';
const fixture = getCourseById(courseId) as { id: string; title: string; prompt: string } | null;
if (!fixture) {
  console.error(`unknown course id: ${courseId}`);
  process.exit(1);
}

const store = new ExtensionStore(join(process.cwd(), '.data', 'genome'));

async function main() {
  const { port: model, provider } = modelFromEnv();
  console.log(`flywheel-live: ${fixture!.id} via ${provider} + live retrieval`);

  // ── cycle 1: real build, live retrieval, promotions collected ──
  const before = await store.load();
  let summary: RetrievalSummary | null = null;
  const out = await buildCourse(
    fixture!.prompt,
    { model, clock: new SystemClock(), rand: new CryptoRand(), retrieval: new LiveRetrievalPort() },
    {
      voice: false,
      budgetUsd: 1.0,
      extensions: before,
      onRetrieval: (rs) => {
        summary = rs;
      },
    },
  );
  const course = out.course;
  const discipline = course.graph.discipline;
  const linked1 = course.graph.concepts.filter((c) => c.genomeRef).length;
  console.log(`build 1: terminal=${out.terminal} cost=$${course.receipts.cost.totalUsd.toFixed(4)}`);
  console.log(`link 1 (before promotion): ${linked1}/${course.graph.concepts.length} concepts linked`);
  if (!summary) {
    console.error('no retrieval summary — retrieval stage did not run');
    process.exit(1);
  }
  const s: RetrievalSummary = summary;
  console.log(`retrieval: ${s.readingsEnriched} enriched, ${s.readingsSuggested} suggested, ${s.kernelsPromoted} kernels promoted, ${s.readingsMissed.length} missed`);
  console.log(`concept names: ${course.graph.concepts.map((c) => c.name).join(' | ')}`);
  if (s.promotions.length === 0) {
    console.error('no promotions — nothing to persist; cycle inconclusive (named, not silent)');
    process.exit(1);
  }
  for (const p of s.promotions) {
    console.log(`  promoted: ${p.key} — "${p.name}" cited ${p.citations[0]?.source}:${p.citations[0]?.externalId}`);
  }

  // ── persist (what the server does post-build) ──
  await store.addPromotions(discipline, s.promotions);
  const after = await store.load();
  const ext = after[`ext-${discipline}`];
  console.log(`extension store: ext-${discipline} now holds ${ext?.concepts.length ?? 0} concepts`);

  // ── cycle 2: the SAME graph re-links from the extension at $0 ──
  // (pure linkStage — no model, no provider, no spend; the flywheel's payoff)
  for (const c of course.graph.concepts) {
    c.genomeRef = undefined as never;
    delete course.overlays.kernels[c.id];
  }
  const relink = linkStage(course, after);
  const fromExtension = course.graph.concepts.filter((c) => c.genomeRef?.shard === `ext-${discipline}`).length;
  console.log(`re-link (after promotion, $0): ${relink.linked}/${relink.total} linked, ${fromExtension} from ext-${discipline}`);

  const ok = fromExtension >= 1;
  console.log(ok ? 'verdict: FLYWHEEL TURNS — live promotion persisted and re-linked at $0' : 'verdict: FAILED — promotions persisted but did not re-link');
  process.exit(ok ? 0 : 1);
}

main().catch((err) => {
  console.error('flywheel-live crashed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
