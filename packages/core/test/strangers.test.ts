/** strangers.test.ts — v0.0.8 bar (workstream E): the stranger disciplines
 *  link ≥8 concepts each. Briefs are verbatim from the Crucible stranger pool
 *  (packages/crucible/fixtures/courses.mjs); the fake names one concept per
 *  lesson title, so this pins the shard alias coverage deterministically. */
import { describe, expect, it } from 'vitest';
import { buildCourse, render, FakeModelPort, FixedClock, SeededRand } from '../src/index.ts';

function ports() {
  return { model: new FakeModelPort(), clock: new FixedClock(), rand: new SeededRand() };
}

const ART_HISTORY_BRIEF =
  'Survey of Art History, a 14-lesson introductory college course with weekly museum-style image analyses and a midterm. Lessons cover: how to look at and describe a work of art; prehistoric and ancient Near Eastern art; Egyptian art and architecture; Greek and Roman art; early Christian and Byzantine art; medieval and Gothic art; the Italian Renaissance; the Northern Renaissance; Baroque art; Rococo and Neoclassicism; Romanticism and Realism; Impressionism and Post-Impressionism; modernism and the twentieth-century avant-garde; and contemporary and global art with a final visual-analysis paper.';

const MUSIC_THEORY_BRIEF =
  'Fundamentals of Music Theory, a 14-lesson introductory college course with weekly ear-training drills and a midterm. Lessons cover: reading pitch on the staff and clefs; note durations and rhythm; time signatures and meter; major scales and key signatures; minor scales; intervals; triads and chord qualities; seventh chords; diatonic harmony and Roman numerals; cadences; voice leading basics; non-chord tones; basic form and phrase structure; and a final analysis and composition project.';

const PHILOSOPHY_BRIEF =
  'Introduction to Philosophy, a 12-lesson introductory college course with weekly argument analyses and a midterm. Lessons cover: what philosophy is and how to read an argument; logic and the structure of valid arguments; the theory of knowledge and skepticism; the mind-body problem; personal identity; free will and determinism; arguments for and against the existence of God; the problem of evil; ethical theory and the good life; justice and political philosophy; the meaning of life; and a final philosophical essay.';

const BUSINESS_ETHICS_BRIEF =
  'Business Ethics, a 12-lesson introductory college course with weekly case discussions and a midterm. Lessons cover: what business ethics is and why it matters; major ethical frameworks including utilitarianism, deontology, and virtue ethics; corporate social responsibility; stakeholder theory; whistleblowing and organizational loyalty; conflicts of interest; fair employment and workplace rights; consumer protection and product safety; environmental responsibility and sustainability; ethics in marketing and advertising; global business and cross-cultural ethics; and an integrative capstone case analysis.';

const CASES: { name: string; brief: string; shard: string; discipline: string }[] = [
  { name: 'art-history', brief: ART_HISTORY_BRIEF, shard: 'arts', discipline: 'arts' },
  { name: 'music-theory', brief: MUSIC_THEORY_BRIEF, shard: 'arts', discipline: 'arts' },
  { name: 'intro-philosophy', brief: PHILOSOPHY_BRIEF, shard: 'philosophy', discipline: 'humanities' },
  { name: 'business-ethics', brief: BUSINESS_ETHICS_BRIEF, shard: 'business', discipline: 'business' },
];

describe('stranger disciplines link to the genome (v0.0.8 bar: ≥8 each)', () => {
  for (const c of CASES) {
    it(`${c.name} links ≥8 concepts to the ${c.shard} shard`, async () => {
      const out = await buildCourse(c.brief, ports(), { voice: false });
      expect(out.terminal).toBe('ready');
      expect(out.course.graph.discipline).toBe(c.discipline);
      const linked = out.course.graph.concepts.filter((x) => x.genomeRef?.shard === c.shard);
      expect(linked.length, `${c.name}: ${linked.map((l) => l.genomeRef!.conceptKey).join(', ')}`).toBeGreaterThanOrEqual(8);
      // linked concepts carry full kernels (definition + ≥1 misconception)
      for (const concept of linked) {
        const k = out.course.overlays.kernels[concept.id];
        expect(k, `kernel for ${concept.name}`).toBeTruthy();
        expect(k!.misconceptions.length).toBeGreaterThanOrEqual(1);
      }
    });
  }

  it('the new shards do not contaminate existing courses (world-lit keeps linking lit)', async () => {
    const WORLD_LIT_BRIEF =
      'World Literature, a 14-lesson undergraduate seminar with weekly reading responses and close-reading checks; named primary texts are expected throughout. Lessons cover: what counts as world literature; the oral epic tradition with Gilgamesh and Homer; classical drama with Sophocles; Tang poetry with Li Bai and Du Fu; the Thousand and One Nights and frame narratives; Dante; comparative reading methods culminating in a comparative essay proposal; translation and cultural mediation; postcolonial literature with Achebe; magical realism with García Márquez; modernist poetry; the fantastic with Borges; contemporary global fiction; and a final paper with course synthesis.';
    const out = await buildCourse(WORLD_LIT_BRIEF, ports(), { voice: false });
    const litLinked = out.course.graph.concepts.filter((x) => x.genomeRef?.shard === 'lit').length;
    expect(litLinked).toBeGreaterThanOrEqual(8); // the v0.0.4 bar still holds
    // philosophy shares the humanities lane — it must not steal lit's lessons
    const philLinked = out.course.graph.concepts.filter((x) => x.genomeRef?.shard === 'philosophy').length;
    expect(philLinked).toBe(0);
  });

  it('exact-name matches are discipline-gated too (v0.0.8 scar: García Márquez in an art course)', async () => {
    // the v0.0.8 round 2: an art-history session on Realism authored a concept
    // named exactly "Magical realism" — the lit shard's literary genre linked
    // by EXACT match across disciplines and students would be drilled on
    // García Márquez in a painting course. Same-name concepts are different
    // concepts across fields; exact matches obey the compatibility lanes now.
    const ART_WITH_TRAP =
      'Survey of Art History, a 6-lesson introductory college course with weekly image analyses and a midterm. Lessons cover: how to look at and describe a work of art; Romanticism and Realism; magical realism; Impressionism and Post-Impressionism; modernism and the twentieth-century avant-garde; and contemporary and global art with a final paper.';
    const out = await buildCourse(ART_WITH_TRAP, ports(), { voice: false });
    expect(out.course.graph.discipline).toBe('arts');
    const shards = new Set(out.course.graph.concepts.map((c) => c.genomeRef?.shard).filter(Boolean));
    expect(shards.has('lit'), 'an art course must never link the lit shard by exact name').toBe(false);
    const kernelText = Object.values(out.course.overlays.kernels)
      .map((k) => k.definition)
      .join(' ')
      .toLowerCase();
    expect(kernelText).not.toContain('garcía márquez');
    // the arts links themselves still hold
    expect(out.course.graph.concepts.filter((c) => c.genomeRef?.shard === 'arts').length).toBeGreaterThanOrEqual(4);
  });

  it('a brief-cue hit overrides the model\'s discipline classification (v0.0.8 round 3 scar)', async () => {
    // the real model classified art history as 'humanities', locking out the
    // arts shard (3 links) and letting lit's magical realism into a painting
    // course. The cue table is deterministic and tested — it wins; the model
    // only fills in when cues return 'general'.
    const fake = new FakeModelPort();
    const tampering: typeof fake = Object.create(fake);
    tampering.completeJSON = async (req) => {
      const res = await fake.completeJSON(req);
      if (req.purpose === 'authorA' && res.json && typeof res.json === 'object') {
        (res.json as { discipline?: string }).discipline = 'humanities'; // the model is wrong
      }
      return res;
    };
    const out = await buildCourse(ART_HISTORY_BRIEF, { model: tampering, clock: new FixedClock(), rand: new SeededRand() }, { voice: false });
    expect(out.course.graph.discipline).toBe('arts'); // the cue corrected it
    expect(out.course.graph.concepts.filter((c) => c.genomeRef?.shard === 'arts').length).toBeGreaterThanOrEqual(8);
    expect(out.course.graph.concepts.some((c) => c.genomeRef?.shard === 'lit')).toBe(false);
  });

  it('study-guide warnings dedupe when two concepts share one kernel (v0.0.8 round 5 scar)', async () => {
    // "Romanticism" and "Realism" both link arts/romanticism-realism — the
    // 'Watch out for' section must warn once, not once per concept
    const out = await buildCourse(ART_HISTORY_BRIEF, ports(), { voice: false });
    const course = out.course;
    const s1 = course.graph.sessions.find((s) => s.index === 1)!;
    const [a, b] = [course.graph.concepts[0]!, course.graph.concepts[1]!];
    s1.conceptIds = [a.id, b.id];
    course.overlays.kernels[b.id] = { ...course.overlays.kernels[a.id]!, conceptId: b.id }; // shared kernel content
    const rc = render(course);
    const guide = rc.byKey[`studyGuides:${s1.id}`]!;
    const warn = guide.blocks.find((bl) => bl.kind === 'misconception-warnings');
    expect(warn).toBeTruthy();
    const claims = warn!.rows!.map((r) => r[0]);
    expect(new Set(claims).size).toBe(claims.length);
  });

  it('prereq edges in the new shards diagnose honest gaps (music out of order)', async () => {
    // teach seventh chords before triads → the genome edge fires a bridge
    const OUT_OF_ORDER =
      'Fundamentals of Music Theory, a 6-lesson course with weekly ear-training drills. Lessons cover: reading pitch on the staff and clefs; seventh chords; triads and chord qualities; cadences; diatonic harmony and Roman numerals; and a final analysis project.';
    const out = await buildCourse(OUT_OF_ORDER, ports(), { voice: false });
    expect(out.terminal).toBe('ready');
    expect(out.course.graph.bridges.length).toBeGreaterThanOrEqual(1);
  });
});
