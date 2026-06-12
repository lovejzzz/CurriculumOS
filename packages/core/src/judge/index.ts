/** judge/index.ts — the judgment layer: prerequisite-gap diagnosis + cited
 *  bridges. When a linked concept's genome prerequisite is taught later (or
 *  not at all), a Bridge primer renders before that session, citations
 *  included. This is what catches the econ seeded gap (elasticity before the
 *  demand curve) — the grader's seeded-gap check fails the round if it stays
 *  silent (050-fixtures). Pure (the genome provides verified citations). */
import { diagnoseGaps, getConcept } from '@curriculumos/knowledge';
import type { BridgeId, Course } from '../schema/courseObject.ts';

export interface JudgeSummary {
  gaps: number;
  bridges: number;
}

export function judgeStage(course: Course): JudgeSummary {
  const g = course.graph;

  // build (conceptKey, teaching index) pairs for every linked concept, in order
  const linkedInOrder: { conceptKey: string; index: number }[] = [];
  for (const s of [...g.sessions].sort((a, b) => a.index - b.index)) {
    for (const cid of s.conceptIds) {
      const concept = g.concepts.find((c) => c.id === cid);
      if (concept?.genomeRef) linkedInOrder.push({ conceptKey: concept.genomeRef.conceptKey, index: s.index });
    }
  }

  const gaps = diagnoseGaps(linkedInOrder);
  let bridgeN = g.bridges.length;
  const seen = new Set<string>();

  for (const gap of gaps) {
    const key = `${gap.conceptKey}<-${gap.missingPrereqKey}`;
    if (seen.has(key)) continue;
    seen.add(key);

    // find the graph concept + session for the gap
    const gapConcept = g.concepts.find((c) => c.genomeRef?.conceptKey === gap.conceptKey);
    const beforeSession = g.sessions.find((s) => s.index === gap.atIndex);
    if (!gapConcept || !beforeSession) continue;

    const [shardId] = gap.missingPrereqKey.split('/');
    const prereqGenome = shardId ? getConcept(shardId, gap.missingPrereqKey) : null;
    if (!prereqGenome) continue;

    bridgeN += 1;
    const id = `B${bridgeN}` as BridgeId;
    g.bridges.push({
      id,
      gapConceptId: gapConcept.id,
      beforeSessionId: beforeSession.id,
      primer: {
        text:
          `Before working with ${gapConcept.name.toLowerCase()}, make sure you are comfortable with ${prereqGenome.name.toLowerCase()}. ` +
          `${prereqGenome.definition} This primer fills the prerequisite gap so the session can build on solid ground.`,
        citations: prereqGenome.citations,
      },
    });
  }

  return { gaps: gaps.length, bridges: g.bridges.length };
}
