/**
 * knowledge/index.ts — the genome cache + linker + prerequisite judgment.
 * The genome is a CACHE, not an encyclopedia (founding §7): linking is
 * cache-first by alias; a miss stays honest (genomeRef null) rather than
 * inventing coverage. Pure — no effects (ADR-03 purity lint covers this dir).
 */
import type { GenomeConcept, GenomeShard } from './types.ts';
import { econ } from './shards/econ.ts';
import { cs } from './shards/cs.ts';
import { geo } from './shards/geo.ts';
import { stats } from './shards/stats.ts';
import { psych } from './shards/psych.ts';
import { nursing } from './shards/nursing.ts';
import { nutrition } from './shards/nutrition.ts';
import { astro } from './shards/astro.ts';
import { lit } from './shards/lit.ts';
import { lang } from './shards/lang.ts';

export type { GenomeShard, GenomeConcept, GenomeCitation } from './types.ts';

export const SHARDS: Record<string, GenomeShard> = {
  econ,
  cs,
  geo,
  stats,
  psych,
  nursing,
  nutrition,
  astro,
  lit,
  lang,
};

function norm(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface LinkHit {
  shard: string;
  conceptKey: string;
  concept: GenomeConcept;
  matchedOn: string;
}

/** Merge the built-in shards with runtime extensions (the flywheel: promoted
 *  kernels persisted by the server come back as extension shards). Built-ins
 *  win on id collision — verified, hand-built knowledge outranks promotions. */
export function mergedShards(extensions: Record<string, GenomeShard> = {}): Record<string, GenomeShard> {
  return { ...extensions, ...SHARDS };
}

/** Cache-first link: match a session/concept title against a shard's concept
 *  names and aliases. Returns null on miss — the honest value (Law 6). */
export function linkConcept(shardId: string, title: string, shards: Record<string, GenomeShard> = SHARDS): LinkHit | null {
  const shard = shards[shardId];
  if (!shard) return null;
  const n = norm(title);
  if (!n) return null;
  // exact name/alias match first
  for (const concept of shard.concepts) {
    const candidates = [concept.name, ...concept.aliases].map(norm);
    if (candidates.includes(n)) return { shard: shardId, conceptKey: concept.key, concept, matchedOn: 'exact' };
  }
  // containment match (the title mentions the concept, or vice versa) — longest alias wins
  let best: LinkHit | null = null;
  let bestLen = 0;
  for (const concept of shard.concepts) {
    for (const cand of [concept.name, ...concept.aliases]) {
      const c = norm(cand);
      if (c.length < 4) continue;
      if ((n.includes(c) || c.includes(n)) && c.length > bestLen) {
        best = { shard: shardId, conceptKey: concept.key, concept, matchedOn: 'contains' };
        bestLen = c.length;
      }
    }
  }
  return best;
}

export function getConcept(shardId: string, conceptKey: string, shards: Record<string, GenomeShard> = SHARDS): GenomeConcept | null {
  return shards[shardId]?.concepts.find((c) => c.key === conceptKey) ?? null;
}

/** Map a DisciplineLens to the shard most likely to cover it. */
export function shardForDiscipline(discipline: string): string | null {
  const map: Record<string, string> = {
    'social-science': 'econ', // resolved further by content; econ/psych both social-science
    cs: 'cs',
    'stem-lab': 'geo',
    'stem-quant': 'stats',
    health: 'nursing',
  };
  return map[discipline] ?? null;
}

export interface PrereqGap {
  /** the concept taught whose prerequisite has not yet been taught */
  conceptKey: string;
  missingPrereqKey: string;
  missingPrereqName: string;
  /** session index (1-based) where the gap concept is first taught */
  atIndex: number;
}

/**
 * Prerequisite-gap diagnosis (the judgment layer). Given linked concepts in
 * teaching order, find concepts whose genome prerequisites are taught LATER or
 * not at all — these need a cited primer bridge before the session.
 * This is what catches the econ seeded gap (elasticity before demand curve).
 */
export function diagnoseGaps(linkedInOrder: { conceptKey: string; index: number }[]): PrereqGap[] {
  const firstTaught = new Map<string, number>();
  for (const { conceptKey, index } of linkedInOrder) {
    if (!firstTaught.has(conceptKey)) firstTaught.set(conceptKey, index);
  }
  const gaps: PrereqGap[] = [];
  for (const { conceptKey, index } of linkedInOrder) {
    const [shardId] = conceptKey.split('/');
    const concept = shardId ? getConcept(shardId, conceptKey) : null;
    if (!concept) continue;
    for (const prereq of concept.requires) {
      const prereqIndex = firstTaught.get(prereq);
      const prereqConcept = shardId ? getConcept(shardId, prereq) : null;
      // gap if the prerequisite is taught later, or not in this course at all
      if (prereqConcept && (prereqIndex === undefined || prereqIndex > index)) {
        gaps.push({
          conceptKey,
          missingPrereqKey: prereq,
          missingPrereqName: prereqConcept.name,
          atIndex: index,
        });
      }
    }
  }
  return gaps;
}
