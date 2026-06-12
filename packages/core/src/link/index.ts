/** link/index.ts — the knowledge layer's link stage (founding §7).
 *  Cache-first genome linking: each concept's name is matched against every
 *  shard; the best hit sets genomeRef and seeds a Kernel into the overlays
 *  (definition, misconceptions, worked example, citations). A miss sets
 *  genomeRef: null — the honest value (Law 6), never invented coverage.
 *  Pure: linking spends nothing ($0 cache hit, the flywheel). */
import { SHARDS, linkConcept } from '@curriculumos/knowledge';
import type { Course, Kernel } from '../schema/courseObject.ts';
import { fnv1a } from '../util.ts';

export interface LinkSummary {
  linked: number;
  missed: number;
  total: number;
}

/** Disciplines whose shards may satisfy a LOOSE (contains) match for a course.
 *  A humanities course must never pull a health concept by substring (the
 *  V0.0.1 audit: world-lit's Tang-poetry lesson contaminated with leukocyte
 *  content from the nursing shard). Exact alias matches may still cross — a
 *  stats concept legitimately named in a nursing course is real linkage. */
const CONTAINS_COMPATIBLE: Record<string, string[]> = {
  'stem-quant': ['stem-quant', 'stem-lab'],
  'stem-lab': ['stem-lab', 'stem-quant'],
  cs: ['cs'],
  'social-science': ['social-science'],
  health: ['health', 'stem-lab', 'stem-quant'], // A&P/biochem/biostats overlap
  humanities: ['humanities'],
  language: ['language'],
  arts: ['arts'],
  business: ['business', 'social-science'],
  education: ['education'],
  general: [], // unknown discipline → no loose cross-linking at all
};

export function linkStage(course: Course): LinkSummary {
  let linked = 0;
  let missed = 0;
  const g = course.graph;
  const courseDisc = g.discipline;
  const compatible = new Set(CONTAINS_COMPATIBLE[courseDisc] ?? [courseDisc]);

  for (const concept of g.concepts) {
    let best: ReturnType<typeof linkConcept> = null;
    let bestLen = 0;
    for (const shardId of Object.keys(SHARDS)) {
      const hit = linkConcept(shardId, concept.name);
      if (hit) {
        // a loose (contains) match only counts from a discipline-compatible
        // shard; exact alias matches may cross disciplines (real linkage)
        if (hit.matchedOn !== 'exact' && !compatible.has(SHARDS[shardId]!.discipline)) continue;
        const score = hit.matchedOn === 'exact' ? 1000 : hit.conceptKey.length;
        if (score > bestLen) {
          best = hit;
          bestLen = score;
        }
      }
    }
    if (best) {
      concept.genomeRef = { shard: best.shard, conceptKey: best.conceptKey };
      // seed the kernel from the genome concept (the cache)
      const gc = best.concept;
      const outcomeHash = fnv1a(
        g.outcomes
          .filter((o) => concept.sessionIds.includes(o.sessionId))
          .map((o) => o.text)
          .join('|'),
      );
      const titleHash = fnv1a(concept.name);
      const kernel: Kernel = {
        conceptId: concept.id,
        definition: gc.definition,
        misconceptions: gc.misconceptions,
        ...(gc.workedExample ? { workedExample: gc.workedExample } : {}),
        citations: gc.citations,
        sourceCue: 'the assigned course materials',
        basedOn: { outcomeHash, titleHash },
      };
      course.overlays.kernels[concept.id] = kernel;
      linked++;
    } else {
      concept.genomeRef = null;
      missed++;
    }
  }

  return { linked, missed, total: g.concepts.length };
}
