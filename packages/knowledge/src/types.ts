/** Genome shard types — the knowledge layer's cache schema (founding §7).
 *  The genome is a cache, not an encyclopedia: linking is cache-first; misses
 *  stay honest (genomeRef: null) rather than inventing coverage. */

export interface GenomeCitation {
  title: string;
  source: 'openalex' | 'openlibrary' | 'genome';
  externalId: string;
  year?: number;
}

export interface GenomeConcept {
  key: string; // e.g. "econ/demand-curve"
  name: string;
  aliases: string[];
  /** Prerequisite edges by concept key — the judgment layer's raw material. */
  requires: string[];
  definition: string;
  misconceptions: { claim: string; correction: string }[];
  workedExample?: { setup: string; steps: string[]; answer: string };
  /** K2: non-Latin terms with romanization (lang shard). */
  romanization?: Record<string, string>;
  /** source-text anchor: public-domain excerpt or precise locator (lit shard). */
  excerpt?: { text?: string; locator?: string; work?: string };
  citations: GenomeCitation[];
}

export interface GenomeShard {
  id: string; // "econ", "cs", …
  discipline: string;
  concepts: GenomeConcept[];
}
