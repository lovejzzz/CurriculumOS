/** link/relevance.ts — the citation relevance gate (contracts §K3, ported in
 *  spirit with the prototype's calibration scars):
 *   - an off-topic hit on a sound-alike must REJECT (the Alzheimer's-paper-on-
 *     immunology direction);
 *   - a legitimate work with partial title overlap must PASS (the STROBE-
 *     rejected-for-stats direction — an over-tight gate is also a failure).
 *  Pure; calibration cases live in test/retrieval.test.ts. */
import type { RetrievalHit } from '../ports/index.ts';

const GENERIC_TOKENS = new Set([
  'the', 'a', 'an', 'of', 'and', 'or', 'in', 'on', 'to', 'for', 'with', 'introduction',
  'principles', 'fundamentals', 'guide', 'handbook', 'study', 'studies', 'course',
  'edition', 'volume', 'book', 'works', 'complete', 'selected', 'new', 'first',
]);

function tokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !GENERIC_TOKENS.has(w)),
  );
}

function overlapRatio(query: Set<string>, hit: Set<string>): number {
  if (query.size === 0) return 0;
  let n = 0;
  for (const w of query) if (hit.has(w)) n++;
  return n / query.size;
}

/** Gate a WORK hit against the reading title it should match (R1 enrichment).
 *  Evidence must be BIDIRECTIONAL: the query's distinctive tokens must appear
 *  in the hit AND the hit's main title (before any subtitle) must be mostly
 *  explained by the query — otherwise "Introduction to Statistics" matches
 *  "Cooking with Statistics: A Chef's Memoir" on its one distinctive token
 *  (the off-topic sound-alike direction the prototype paid for). */
export function workMatches(queryTitle: string, hit: RetrievalHit, queryAuthor?: string): boolean {
  const q = tokens(queryTitle);
  const mainTitle = hit.title.split(/[:—–]/)[0] ?? hit.title; // subtitles are noise
  const h = tokens(mainTitle);
  if (q.size === 0) {
    // a fully-generic query title can still pass on an exact normalized match
    return queryTitle.trim().toLowerCase() === hit.title.trim().toLowerCase();
  }
  const queryRatio = overlapRatio(q, tokens(hit.title)); // query tokens found anywhere in the hit
  const hitRatio = h.size === 0 ? 1 : overlapRatio(h, q); // hit's main title explained by the query
  // author corroboration relaxes the title bar (partial-title direction)
  const authorOk =
    queryAuthor && hit.author
      ? overlapRatio(tokens(queryAuthor), tokens(hit.author)) > 0
      : false;
  return (queryRatio >= 0.8 && hitRatio >= 0.6) || (queryRatio >= 0.5 && authorOk);
}

/** Gate a TOPIC hit against a concept name (kernel promotion). The hit's title
 *  or subjects must share distinctive vocabulary with the concept — an
 *  unrelated topic that merely sound-alikes one token rejects. */
export function topicMatches(conceptName: string, hit: RetrievalHit): boolean {
  const q = tokens(conceptName);
  if (q.size === 0) return false;
  const titleRatio = overlapRatio(q, tokens(hit.title));
  const subjectText = (hit.subjects ?? []).join(' ');
  const subjectRatio = overlapRatio(q, tokens(subjectText));
  return titleRatio >= 0.6 || subjectRatio >= 0.6 || (titleRatio >= 0.4 && subjectRatio >= 0.3);
}

/** Gate a SUGGESTED reading against the concept it would be attached to.
 *  Suggesting a book is a positive editorial act on the instructor's syllabus
 *  — the standard is strict and asymmetric: silence is safe, junk is not
 *  (campaign day 1: a spectral-sequence text and a fiction title attached to
 *  an intro Python course made the syllabus "unteachably incoherent").
 *   - the concept must carry ≥2 distinctive tokens (a one-token concept like
 *     "Lists" matches any sound-alike — unsuggestable);
 *   - most concept tokens must appear in the hit (≥0.6) AND the hit's main
 *     title must be mostly explained by the concept (≥0.6, bidirectional). */
export function suggestionMatches(conceptName: string, hit: RetrievalHit): boolean {
  const q = tokens(conceptName);
  if (q.size < 2) return false;
  const mainTitle = hit.title.split(/[:—–]/)[0] ?? hit.title;
  const h = tokens(mainTitle);
  const queryRatio = overlapRatio(q, tokens(hit.title));
  const hitRatio = h.size === 0 ? 0 : overlapRatio(h, q);
  return queryRatio >= 0.6 && hitRatio >= 0.6;
}
