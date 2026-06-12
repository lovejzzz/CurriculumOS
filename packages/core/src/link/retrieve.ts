/** link/retrieve.ts — retrieval enrichment + kernel promotion (V0.0.4, the
 *  flywheel's intake). Runs inside the link stage when a RetrievalPort is
 *  injected; without one, nothing here executes (the suite stays offline).
 *
 *  Enrichment (R1): instructor-named books/chapters gain verified external ids
 *  and metadata — the TITLE IS NEVER TOUCHED; a failed lookup is a named entry
 *  in the build record, never silent (Law 6).
 *
 *  Promotion (founding §7): a cache-missed concept whose model kernel candidate
 *  is corroborated by a provider topic (relevance-gated) gets provider
 *  citations, provenance 'retrieved', and is RETURNED for the caller (the
 *  server) to persist into the genome extension — the second same-discipline
 *  course then links it at $0. */
import type { Course } from '../schema/courseObject.ts';
import type { RetrievalPort } from '../ports/index.ts';
import type { GenomeConcept, GenomeShard } from '@curriculumos/knowledge';
import { workMatches, topicMatches } from './relevance.ts';

export interface RetrievalSummary {
  readingsEnriched: number;
  readingsMissed: string[]; // named (Law 6)
  kernelsPromoted: number;
  /** promoted concepts, shaped for the genome extension store */
  promotions: GenomeConcept[];
}

const RETRIEVAL_CONCURRENCY = 4;

export async function retrieveStage(course: Course, retrieval: RetrievalPort): Promise<RetrievalSummary> {
  const summary: RetrievalSummary = { readingsEnriched: 0, readingsMissed: [], kernelsPromoted: 0, promotions: [] };
  const g = course.graph;

  // ── reading enrichment (R1: enrich metadata, never replace identity) ──
  const candidates = g.readings.filter(
    (r) => (r.kind === 'book' || r.kind === 'chapter') && (r.provenance === 'instructor-named' || r.provenance === 'instructor-provided') && !r.externalIds,
  );
  for (let i = 0; i < candidates.length; i += RETRIEVAL_CONCURRENCY) {
    const wave = candidates.slice(i, i + RETRIEVAL_CONCURRENCY);
    const settled = await Promise.allSettled(wave.map((r) => retrieval.findWork({ title: r.title, ...(r.author ? { author: r.author } : {}) })));
    settled.forEach((outcome, j) => {
      const reading = wave[j]!;
      const hit = outcome.status === 'fulfilled' ? outcome.value : null;
      if (hit && workMatches(reading.title, hit, reading.author)) {
        reading.externalIds = {
          ...(hit.externalIds.openalex ? { openalex: hit.externalIds.openalex } : {}),
          ...(hit.externalIds.openlibrary ? { openlibrary: hit.externalIds.openlibrary } : {}),
          ...(hit.externalIds.isbn ? { isbn: hit.externalIds.isbn } : {}),
          ...(hit.externalIds.doi ? { doi: hit.externalIds.doi } : {}),
        };
        if (!reading.author && hit.author) reading.author = hit.author; // metadata enrichment only
        course.receipts.provenance[`enriched:${reading.id}`] = {
          source: 'retrieved',
          provider: hit.externalIds.openlibrary ? 'openlibrary' : 'openalex',
          externalId: hit.externalIds.openlibrary ?? hit.externalIds.openalex ?? hit.externalIds.isbn ?? '',
        };
        summary.readingsEnriched++;
      } else {
        summary.readingsMissed.push(reading.id); // named, never silent
      }
    });
  }

  // ── kernel promotion: corroborate model candidates with provider topics ──
  const missedConcepts = g.concepts.filter((c) => c.genomeRef === null && course.overlays.kernels[c.id]);
  for (let i = 0; i < missedConcepts.length; i += RETRIEVAL_CONCURRENCY) {
    const wave = missedConcepts.slice(i, i + RETRIEVAL_CONCURRENCY);
    const settled = await Promise.allSettled(wave.map((c) => retrieval.findTopic({ name: c.name, discipline: g.discipline })));
    settled.forEach((outcome, j) => {
      const concept = wave[j]!;
      const hit = outcome.status === 'fulfilled' ? outcome.value : null;
      if (!hit || !topicMatches(concept.name, hit)) return; // the gate: nothing model-invented survives unverified
      const kernel = course.overlays.kernels[concept.id]!;
      const source = hit.externalIds.openalex ? 'openalex' : 'openlibrary';
      const externalId = hit.externalIds.openalex ?? hit.externalIds.openlibrary ?? '';
      kernel.citations = [{ title: hit.title, source, externalId, ...(hit.year ? { year: hit.year } : {}) }];
      course.receipts.provenance[`kernel:${concept.id}`] = { source: 'retrieved', provider: source, externalId };
      summary.kernelsPromoted++;
      // shape the promotion for the extension store (concept abstraction ONLY —
      // never course or instructor content; the founding §7 privacy boundary)
      summary.promotions.push({
        key: `ext-${g.discipline}/${concept.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 48)}`,
        name: concept.name,
        aliases: [],
        requires: [],
        definition: kernel.definition,
        misconceptions: kernel.misconceptions,
        ...(kernel.workedExample ? { workedExample: kernel.workedExample } : {}),
        ...(kernel.romanization ? { romanization: kernel.romanization } : {}),
        ...(kernel.excerpt ? { excerpt: kernel.excerpt } : {}),
        citations: kernel.citations,
      });
    });
  }

  return summary;
}

/** Build an extension shard from promoted concepts (the server persists this). */
export function extensionShard(discipline: string, concepts: GenomeConcept[]): GenomeShard {
  return { id: `ext-${discipline}`, discipline, concepts };
}
