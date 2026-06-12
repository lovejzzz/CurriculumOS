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

export function linkStage(course: Course): LinkSummary {
  let linked = 0;
  let missed = 0;
  const g = course.graph;

  for (const concept of g.concepts) {
    let best: ReturnType<typeof linkConcept> = null;
    let bestLen = 0;
    for (const shardId of Object.keys(SHARDS)) {
      const hit = linkConcept(shardId, concept.name);
      if (hit) {
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
