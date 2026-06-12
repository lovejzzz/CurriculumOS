# Roadmap V0.0.4 — the knowledge flywheel begins

_Written June 12, 2026, after V0.0.3 shipped (`4f34c8d`, tagged). This iteration's audit is short because V0.0.3's final judged round IS the audit; this document states what it implies, sets bars, and the release implements them (Law 8)._

---

## Part I — Audit

V0.0.3 closed the drift: all four audit courses ready at 100/A, meter↔judge drift 0–2 (mean 1.0, gate tightened to 2), ~$0.15/course, 81 tests green. The instruments now agree with each other. **The remaining problem is the content itself on cache-miss courses:**

| Course | linked concepts | judge | why |
| --- | --- | --- | --- |
| cs-python | 19–27 | **7** | genome-verified kernels everywhere |
| geology | 22–25 | 5–6 | genome-verified kernels everywhere |
| mandarin | **0** | 6 | no `lang` shard exists — every kernel is an unverified model candidate |
| world-lit | **0** | 5–6 | no `lit` shard exists — same |

The pattern is the founding doc's §7 thesis confirmed by measurement: **verified knowledge is what the judge rewards, and the genome is where verified knowledge lives.** The V0.0.3 CHANGELOG named it: "the v0.4 line, where the judge rises to meet the meter."

Secondary residuals: readings carry no external identifiers (no retrieval exists); model kernel candidates are never verified or persisted (no cache-miss promotion — the flywheel has no intake); the syllabus schedule still shows placeholder-ish reading cells on courses whose briefs name no texts.

## Part II — What V0.0.4 implements

1. **Two new shards — `lit` and `lang`.** The judgment is data: hand-built, citation-bearing kernels for the two uncovered disciplines (close reading, the epic tradition, tragedy, regulated Tang verse, frame narrative, postcolonial literature, magical realism, modernism, the fantastic, translation; pinyin and the four tones, 的 possession, measure words, SVO with 不/没, 吗 questions, numbers and dates…), with public-domain excerpts and romanization where the discipline demands it. This is the single biggest judge lever available — it converts the two 0-link courses into genome-verified builds.

2. **RetrievalPort + live providers (OpenAlex / OpenLibrary).** A pure port in core; impure fetch implementations at the API edge (free, keyless APIs). Used for:
   - **Reading enrichment (R1):** instructor-named books/chapters get verified external ids (OpenLibrary/OpenAlex, ISBN, year) attached as metadata — the title is NEVER replaced; failures are named in the build record, never silent.
   - **Kernel promotion (the flywheel's intake):** a cache-missed concept whose model kernel candidate is corroborated by retrieval (subject/title relevance gate) is promoted — citations attached from the provider, provenance flipped to `retrieved`, and the kernel persisted to a local genome **extension store** so the second same-discipline course links it at $0.

3. **The citation relevance gate** (pure, calibrated — the kit's scars): a hit must clear topical-overlap against the query; generic-token matches are excluded. Calibration cases encode both failure directions the prototype paid for (an off-topic hit on a sound-alike must reject; a legitimate work with partial title overlap must pass).

4. **The extension store + second-build cache hit.** The server persists promoted kernels under `.data/genome/`; `linkStage` accepts extension shards alongside the built-ins. Deterministic test: build course A with a fake retrieval port → kernels promote; build course B naming the same concepts → links from the extension at $0, no model kernel needed.

## Part III — Bars (before the work)

- `lit`/`lang` shards link: **world-lit ≥ 8 linked concepts, mandarin ≥ 8** (from 0), in the deterministic suite.
- Judge on the real provider: **world-lit and mandarin ≥ 7** (from 5–6), structural 100/A held, ≤ $0.16/course.
- Reading enrichment: an instructor-named real book gains external ids with its **title byte-identical** (R1); a failed lookup is a named build-record entry.
- Relevance gate calibration cases green (both failure directions).
- Second-build cache hit demonstrated deterministically (extension-linked concept, $0, no Pass B kernel used).
- The standing rule: fake retrieval port exercises every new path; suite stays green without network.

## Part IV — After V0.0.4 (bars only)
- **v0.5 — two homes** (browser BYO-key engine + metered platform) — unchanged from ROADMAP-V0.0.1 §IV.
- **v1 — beats CourseMapper v0.14.6** on teachability at equal cost, same Crucible, twice.
