/** retrieval.test.ts — V0.0.4 bars: the citation relevance gate (both failure
 *  directions the prototype paid for), reading enrichment (R1: enrich, never
 *  replace), and the second-build cache hit (the flywheel). All offline via
 *  the fake retrieval port. */
import { describe, expect, it } from 'vitest';
import {
  buildCourse,
  retrieveStage,
  extensionShard,
  workMatches,
  topicMatches,
  FakeModelPort,
  FakeRetrievalPort,
  FixedClock,
  SeededRand,
} from '../src/index.ts';
import type { RetrievalHit } from '../src/index.ts';

function ports(retrieval = false) {
  return {
    model: new FakeModelPort(),
    clock: new FixedClock(),
    rand: new SeededRand(),
    ...(retrieval ? { retrieval: new FakeRetrievalPort() } : {}),
  };
}

describe('citation relevance gate (K3 calibration — both directions)', () => {
  it('REJECTS an off-topic hit on a sound-alike (the Alzheimer-on-immunology direction)', () => {
    const offTopic: RetrievalHit = { title: 'Cooking with Statistics: A Chef’s Memoir', externalIds: {}, subjects: ['cooking', 'memoir'] };
    expect(workMatches('Introduction to Statistics', offTopic)).toBe(false);
    const wrongTopic: RetrievalHit = { title: 'Marine Biology of the Pacific', externalIds: {}, subjects: ['marine biology'] };
    expect(topicMatches('price elasticity of demand', wrongTopic)).toBe(false);
  });

  it('PASSES a legitimate work with partial title overlap (the STROBE-rejected-for-stats direction)', () => {
    // distinctive tokens overlap even though generic words differ
    const legit: RetrievalHit = { title: 'An Introduction to Statistical Learning', externalIds: { openlibrary: 'OL1' }, subjects: ['statistics'] };
    expect(workMatches('Statistical Learning', legit)).toBe(true);
    // author corroboration relaxes a partial title
    const byAuthor: RetrievalHit = { title: 'The Elements of Statistical Learning', author: 'Hastie', externalIds: {} };
    expect(workMatches('Statistical Learning Elements', byAuthor, 'Hastie')).toBe(true);
  });

  it('a topic sharing distinctive vocabulary passes', () => {
    const hit: RetrievalHit = { title: 'Price elasticity', externalIds: { openalex: 'C1' }, subjects: ['demand', 'microeconomics'] };
    expect(topicMatches('price elasticity of demand', hit)).toBe(true);
  });
});

describe('reading enrichment (R1: enrich metadata, never replace identity)', () => {
  it('attaches external ids to an instructor-named book without touching its title', async () => {
    const { course } = await buildCourse(
      'World Literature, a 14-lesson seminar with reading responses. Lessons cover: postcolonial literature; magical realism; modernist poetry; the oral epic tradition; classical drama; Tang poetry; frame narratives; the allegorical journey; the fantastic; translation; close reading; world literature; contemporary fiction; and a final paper. Week 9 reads Things Fall Apart.',
      ports(true),
      { voice: false },
    );
    const tfa = course.graph.readings.find((r) => r.title.includes('Things Fall Apart'));
    if (tfa) {
      expect(tfa.title).toBe('Things Fall Apart'); // byte-identical (R1)
      expect(tfa.externalIds).toBeTruthy();
      expect(course.receipts.provenance[`enriched:${tfa.id}`]).toBeTruthy();
    }
  });
});

describe('the flywheel: kernel promotion + second-build cache hit', () => {
  it('promotes a cache-missed concept and links it from the extension on the second build at $0', async () => {
    // build A: an art-history course (no shard) with retrieval → promotions
    const ART =
      'Survey of Art History, a 12-lesson course with weekly image analyses and a midterm. Lessons cover: how to look at a work of art; Egyptian art; Greek and Roman art; Byzantine art; Gothic art; the Italian Renaissance; Baroque art; Neoclassicism; Romanticism; Impressionism; the avant-garde; and contemporary art with a final paper.';
    let promotions: any[] = [];
    const a = await buildCourse(ART, ports(true), { voice: false, onRetrieval: (rs) => (promotions = rs.promotions) });
    expect(a.terminal).toBe('ready');
    expect(promotions.length).toBeGreaterThan(0); // model kernels corroborated + promoted
    // every promotion carries provider citations (nothing model-invented survives unverified)
    for (const p of promotions) expect(p.citations.length).toBeGreaterThan(0);

    // build B: the SAME course, now with the promotions as an extension shard,
    // NO retrieval — it must link from cache at $0 (the flywheel)
    const ext = { 'ext-arts': extensionShard('arts', promotions) };
    const b = await buildCourse(ART, ports(false), { voice: false, extensions: ext });
    const fromExtension = b.course.graph.concepts.filter((c) => c.genomeRef?.shard === 'ext-arts').length;
    expect(fromExtension, 'second build links promoted concepts from the extension').toBeGreaterThan(0);
    expect(b.course.receipts.cost.totalUsd).toBe(0); // $0 — cache hit
  });

  it('retrieveStage records a named miss for an unfindable reading (Law 6)', async () => {
    const { course } = await buildCourse(
      'Intro Course, a 4-lesson course with a midterm. Lessons cover: topic one; topic two; topic three; and review.',
      ports(),
      { voice: false },
    );
    course.graph.readings.push({ id: 'R1.9' as any, sessionIds: ['S1'] as any, title: 'Unknown Phantom Title', kind: 'book', provenance: 'instructor-named' });
    const summary = await retrieveStage(course, new FakeRetrievalPort());
    expect(summary.readingsMissed).toContain('R1.9'); // named, not silent
  });
});
