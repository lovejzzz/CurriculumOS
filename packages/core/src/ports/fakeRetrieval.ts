/** ports/fakeRetrieval.ts — a deterministic RetrievalPort (the standing rule:
 *  the fake exercises every path the live providers hit, so the flywheel is
 *  tested offline). Works/topics resolve from a small fixture catalog plus a
 *  hash-derived id for anything else "known"; unknown-prefixed queries miss. */
import type { RetrievalHit, RetrievalPort } from './index.ts';
import { fnv1a } from '../util.ts';

const CATALOG: RetrievalHit[] = [
  {
    title: 'Things Fall Apart',
    author: 'Chinua Achebe',
    year: 1958,
    externalIds: { openlibrary: 'OL1929568W', isbn: '9780385474542' },
    subjects: ['Igbo (African people)', 'Nigeria', 'fiction', 'colonialism'],
  },
  {
    title: 'One Hundred Years of Solitude',
    author: 'Gabriel García Márquez',
    year: 1967,
    externalIds: { openlibrary: 'OL27258W' },
    subjects: ['magical realism', 'Colombia', 'fiction'],
  },
  {
    title: 'The Waste Land',
    author: 'T. S. Eliot',
    year: 1922,
    externalIds: { openlibrary: 'OL1101W' },
    subjects: ['modernist poetry', 'poetry'],
  },
  {
    title: 'Freakonomics',
    author: 'Steven D. Levitt',
    year: 2005,
    externalIds: { openlibrary: 'OL3687557W', isbn: '9780061234002' },
    subjects: ['economics', 'incentives'],
  },
];

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

export class FakeRetrievalPort implements RetrievalPort {
  async findWork(query: { title: string; author?: string }): Promise<RetrievalHit | null> {
    const q = norm(query.title);
    if (q.startsWith('unknown')) return null; // deterministic miss path
    const exact = CATALOG.find((c) => norm(c.title) === q || norm(c.title).includes(q) || q.includes(norm(c.title)));
    if (exact) return exact;
    // any other title resolves with a hash-stable id (exercises the gate: the
    // returned title ECHOES the query, so workMatches passes honestly)
    return {
      title: query.title,
      ...(query.author ? { author: query.author } : {}),
      year: 2000,
      externalIds: { openlibrary: `OLFAKE${fnv1a(q)}W` },
      subjects: [],
    };
  }

  async findTopic(query: { name: string; discipline?: string }): Promise<RetrievalHit | null> {
    const q = norm(query.name);
    if (q.startsWith('unknown')) return null;
    return {
      title: query.name,
      externalIds: { openalex: `CFAKE${fnv1a(q)}` },
      subjects: [query.name, ...(query.discipline ? [query.discipline] : [])],
    };
  }
}
