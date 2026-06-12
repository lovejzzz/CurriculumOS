/** retrieval.ts — live retrieval providers (V0.0.4): OpenLibrary for works,
 *  OpenAlex for topics. Free, keyless APIs; impure (fetch), so this lives at
 *  the edge. Failures return null (an honest miss the build records by name) —
 *  retrieval NEVER breaks a build. Plus the genome extension store: promoted
 *  kernels persist here and return as extension shards (the flywheel). */
import type { RetrievalHit, RetrievalPort } from '@curriculumos/core';
import type { GenomeConcept, GenomeShard } from '@curriculumos/knowledge';
import { FileStorage } from './store.ts';

const TIMEOUT_MS = 6000;

async function getJson(url: string): Promise<unknown | null> {
  try {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
    const resp = await fetch(url, { signal: ctl.signal, headers: { 'user-agent': 'CurriculumOS/0.0.4 (course engine; contact: repo)' } });
    clearTimeout(timer);
    if (!resp.ok) return null;
    return (await resp.json()) as unknown;
  } catch {
    return null; // an honest miss, never a build-breaking throw
  }
}

export class LiveRetrievalPort implements RetrievalPort {
  async findWork(query: { title: string; author?: string }): Promise<RetrievalHit | null> {
    const q = encodeURIComponent(query.title + (query.author ? ` ${query.author}` : ''));
    const data = (await getJson(`https://openlibrary.org/search.json?q=${q}&limit=3&fields=title,author_name,first_publish_year,key,isbn`)) as
      | { docs?: { title?: string; author_name?: string[]; first_publish_year?: number; key?: string; isbn?: string[] }[] }
      | null;
    const doc = data?.docs?.[0];
    if (!doc?.title || !doc.key) return null;
    return {
      title: doc.title,
      ...(doc.author_name?.[0] ? { author: doc.author_name[0] } : {}),
      ...(doc.first_publish_year ? { year: doc.first_publish_year } : {}),
      externalIds: {
        openlibrary: doc.key.replace('/works/', ''),
        ...(doc.isbn?.[0] ? { isbn: doc.isbn[0] } : {}),
      },
    };
  }

  async findTopic(query: { name: string; discipline?: string }): Promise<RetrievalHit | null> {
    const q = encodeURIComponent(query.name);
    const data = (await getJson(`https://api.openalex.org/concepts?search=${q}&per-page=3`)) as
      | { results?: { id?: string; display_name?: string; ancestors?: { display_name?: string }[] }[] }
      | null;
    const hit = data?.results?.[0];
    if (!hit?.display_name || !hit.id) return null;
    return {
      title: hit.display_name,
      externalIds: { openalex: hit.id.replace('https://openalex.org/', '') },
      subjects: [hit.display_name, ...(hit.ancestors ?? []).map((a) => a.display_name ?? '').filter(Boolean)],
    };
  }
}

/** The genome extension store — where promoted kernels persist (concept
 *  abstractions only, never course/instructor content — founding §7). */
export class ExtensionStore {
  private storage: FileStorage;
  constructor(dir: string) {
    this.storage = new FileStorage(dir);
  }

  async load(): Promise<Record<string, GenomeShard>> {
    const out: Record<string, GenomeShard> = {};
    for (const id of await this.storage.list()) {
      const raw = await this.storage.get(id);
      if (raw) {
        const shard = JSON.parse(raw) as GenomeShard;
        out[shard.id] = shard;
      }
    }
    return out;
  }

  /** Merge newly promoted concepts into the discipline's extension shard. */
  async addPromotions(discipline: string, promotions: GenomeConcept[]): Promise<void> {
    if (promotions.length === 0) return;
    const id = `ext-${discipline}`;
    const raw = await this.storage.get(id);
    const shard: GenomeShard = raw ? (JSON.parse(raw) as GenomeShard) : { id, discipline, concepts: [] };
    for (const p of promotions) {
      if (!shard.concepts.some((c) => c.key === p.key)) shard.concepts.push(p);
    }
    await this.storage.put(id, JSON.stringify(shard, null, 2));
  }
}
