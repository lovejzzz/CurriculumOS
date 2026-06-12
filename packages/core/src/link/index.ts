/** link/index.ts — the knowledge layer's link stage (founding §7).
 *  Cache-first genome linking: each concept's name is matched against every
 *  shard; the best hit sets genomeRef and seeds a Kernel into the overlays
 *  (definition, misconceptions, worked example, citations). A miss sets
 *  genomeRef: null — the honest value (Law 6), never invented coverage.
 *  Pure: linking spends nothing ($0 cache hit, the flywheel). */
import { mergedShards, linkConcept, type GenomeShard } from '@curriculumos/knowledge';
import type { Course, Kernel } from '../schema/courseObject.ts';
import { fnv1a } from '../util.ts';

export interface LinkSummary {
  linked: number;
  missed: number;
  total: number;
}

/** Disciplines whose shards may satisfy a match for a course — ALL matches,
 *  exact included. A humanities course must never pull a health concept by
 *  substring (the V0.0.1 audit: world-lit's Tang-poetry lesson contaminated
 *  with leukocyte content from the nursing shard) — and exact names cross
 *  just as wrongly: the V0.0.8 round linked lit's "Magical realism" (García
 *  Márquez) into an art-history Realism session because same-name concepts
 *  are DIFFERENT concepts across fields. Legitimate crossings (stats in a
 *  nursing course) are encoded here as compatible lanes, not as a loophole. */
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

export function linkStage(course: Course, extensions: Record<string, GenomeShard> = {}): LinkSummary {
  let linked = 0;
  let missed = 0;
  const g = course.graph;
  const courseDisc = g.discipline;
  // a course always links its OWN discipline's shards (extensions included)
  const compatible = new Set([courseDisc, ...(CONTAINS_COMPATIBLE[courseDisc] ?? [])]);
  // the flywheel: promoted kernels persisted by the server arrive as extension
  // shards; built-ins win on collision (mergedShards)
  const shards = mergedShards(extensions);

  for (const concept of g.concepts) {
    let best: ReturnType<typeof linkConcept> = null;
    let bestLen = 0;
    for (const shardId of Object.keys(shards)) {
      const hit = linkConcept(shardId, concept.name, shards);
      if (hit) {
        // every match — exact or contains — must come from a compatible lane
        if (!compatible.has(shards[shardId]!.discipline)) continue;
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
        ...(gc.romanization && Object.keys(gc.romanization).length ? { romanization: gc.romanization } : {}),
        ...(gc.excerpt && (gc.excerpt.text || gc.excerpt.locator) ? { excerpt: gc.excerpt } : {}),
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
