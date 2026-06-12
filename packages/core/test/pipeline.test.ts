import { describe, expect, it } from 'vitest';
import { buildCourse, render, gradeStructural, gradeTeachability, FakeModelPort, FixedClock, SeededRand } from '../src/index.ts';
import { ECON_BRIEF, CS_BRIEF, MANDARIN_BRIEF } from './fixtures.ts';

function ports() {
  return { model: new FakeModelPort(), clock: new FixedClock(), rand: new SeededRand() };
}

describe('pipeline behavior (M1/M2)', () => {
  it('links econ concepts to the genome and seeds kernels', async () => {
    const { course } = await buildCourse(ECON_BRIEF, ports(), { voice: false });
    const linked = course.graph.concepts.filter((c) => c.genomeRef);
    expect(linked.length).toBeGreaterThanOrEqual(8); // most of the 14 topics resolve
    expect(Object.keys(course.overlays.kernels).length).toBeGreaterThanOrEqual(8);
  });

  it('diagnoses the seeded prerequisite gap (elasticity before demand curve) with a cited bridge', async () => {
    const { course } = await buildCourse(ECON_BRIEF, ports(), { voice: false });
    // elasticity (lesson 5) requires demand-curve (lesson 6) — taught later → gap
    const bridge = course.graph.bridges.find((b) => b.primer.text.toLowerCase().includes('demand curve'));
    expect(bridge, 'a demand-curve prerequisite primer must exist').toBeTruthy();
    expect(bridge!.primer.citations.length).toBeGreaterThan(0); // citations included
  });

  it('grades a fake-built course with a real structural score and two meters', async () => {
    const { course } = await buildCourse(CS_BRIEF, ports(), { voice: false });
    const s = gradeStructural(course);
    const t = gradeTeachability(course);
    expect(s.score).toBeGreaterThanOrEqual(80); // no P0s; structurally sound
    expect(s.findings.every((f) => f.severity !== 'P0')).toBe(true);
    expect(t.score10).toBeGreaterThanOrEqual(1);
    expect(t.score10).toBeLessThanOrEqual(10);
    expect(course.receipts.quality).toBeTruthy();
  });

  it('renders all nine artifact kinds plus the course map', async () => {
    const { course } = await buildCourse(CS_BRIEF, ports(), { voice: false });
    const rc = render(course);
    const kinds = new Set(rc.artifacts.map((a) => a.kind));
    for (const k of ['courseMap', 'syllabus', 'lessonPlans', 'slideDecks', 'discussions', 'studyGuides', 'rubrics', 'assignments', 'quizBank', 'courseFaq']) {
      expect(kinds.has(k as never), `missing artifact: ${k}`).toBe(true);
    }
  });

  it('has no placeholder leakage in any rendered artifact', async () => {
    const { course } = await buildCourse(ECON_BRIEF, ports(), { voice: false });
    const s = gradeStructural(course);
    expect(s.findings.filter((f) => f.dimension === 'placeholder')).toHaveLength(0);
  });

  it('authors kernels even when the genome misses (the model proposes; §7)', async () => {
    // mandarin has no language shard, so every concept misses the cache — yet
    // each must still carry subject matter (a model-proposed kernel candidate)
    const { course } = await buildCourse(MANDARIN_BRIEF, ports(), { voice: false });
    const linked = course.graph.concepts.filter((c) => c.genomeRef).length;
    expect(linked).toBe(0); // genuinely a cache miss
    const withKernel = course.graph.concepts.filter((c) => course.overlays.kernels[c.id]).length;
    expect(withKernel).toBe(course.graph.concepts.length); // …but every concept has a kernel
    // candidates carry NO citations (K3: the model may not invent them)
    for (const k of Object.values(course.overlays.kernels)) expect(k.citations).toHaveLength(0);
  });

  it('marks model-proposed kernels distinctly from genome-verified ones (Law 6)', async () => {
    const { course } = await buildCourse(ECON_BRIEF, ports(), { voice: false });
    const verified = course.graph.concepts.find((c) => c.genomeRef);
    const proposed = course.graph.concepts.find((c) => !c.genomeRef && course.overlays.kernels[c.id]);
    if (verified) expect((course.receipts.provenance[`kernel:${verified.id}`] as any).source).toBe('genome');
    if (proposed) expect((course.receipts.provenance[`kernel:${proposed.id}`] as any).source).toBe('voiced');
  });

  it('never cross-contaminates disciplines via loose matches (V0.0.1 audit: poetry got leukocytes)', async () => {
    // a humanities course must not pull health/nursing concepts by substring
    const WORLDLIT = 'World Literature, a 14-lesson undergraduate seminar with weekly reading responses. Lessons cover: the oral epic tradition; classical drama; Tang poetry; frame narratives; the medieval journey; comparative reading; postcolonial literature; magical realism; modernist poetry; the fantastic; contemporary global fiction; translation; close reading methods; and a final paper.';
    const { course } = await buildCourse(WORLDLIT, ports(), { voice: false });
    const shards = new Set(course.graph.concepts.map((c) => c.genomeRef?.shard).filter(Boolean));
    expect(shards.has('nursing'), 'a literature course must never link the nursing shard').toBe(false);
    expect(shards.has('nutrition')).toBe(false);
    // no kernel may carry off-discipline subject matter
    const kernelText = Object.values(course.overlays.kernels).map((k) => k.definition).join(' ').toLowerCase();
    expect(kernelText).not.toContain('leukocyte');
    expect(kernelText).not.toContain('platelet');
  });

  it('assembles a graph with model-returned readings AND resources (V0.0.1 audit: the TDZ crash)', async () => {
    // geology names lab kits → the fake now emits resources; the assembler's
    // per-session counter must read the array it is building without a temporal
    // dead zone (the real round crashed here as a phantom "provider-failure")
    const GEO = 'Physical Geology, a 14-lesson undergraduate course with weekly labs using hand-specimen kits. Lessons cover: minerals and identification; silicate structures; igneous rocks; sedimentary rocks; metamorphic rocks; the rock cycle; plate tectonics; earthquakes; volcanic hazards; weathering; streams and groundwater; geologic time; field synthesis; and a final exam.';
    const out = await buildCourse(GEO, ports(), { voice: false });
    expect(out.terminal).toBe('ready');
    expect(out.course.graph.resources.length).toBeGreaterThan(0); // resources assembled, not crashed
    // ids are well-formed and unique
    const ids = out.course.graph.resources.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const r of out.course.graph.resources) expect(r.id).toMatch(/^X[1-9]\d*\.[1-9]\d*$/);
  });

  it('renders a romanization (Terms) block for non-Latin kernel terms (K2)', async () => {
    const { course } = await buildCourse(MANDARIN_BRIEF, ports(), { voice: false });
    const s1 = course.graph.sessions.find((s) => s.id === 'S1')!;
    const cid = s1.conceptIds[0]!;
    course.overlays.kernels[cid] = { ...course.overlays.kernels[cid]!, romanization: { 你好: 'nǐ hǎo', 谢谢: 'xiè xie' } };
    const plan = render(course).artifacts.find((a) => a.kind === 'lessonPlans' && a.scope === 'S1')!;
    const kernelBlock = plan.blocks.find((b) => b.kind === 'kernel');
    const terms = kernelBlock?.children?.find((c) => c.kind === 'romanization');
    expect(terms).toBeTruthy();
    expect(terms!.rows).toContainEqual(['你好', 'nǐ hǎo']);
  });

  it('grades all four audit courses 100/A with zero findings (the M1 bar)', async () => {
    for (const brief of [MANDARIN_BRIEF, CS_BRIEF, ECON_BRIEF]) {
      const { course } = await buildCourse(brief, ports(), { voice: false });
      const s = gradeStructural(course);
      expect(s.score, `${course.graph.courseTitle}`).toBe(100);
      expect(s.findings, `${course.graph.courseTitle}`).toHaveLength(0);
    }
  });
});
