import { describe, expect, it } from 'vitest';
import { buildCourse, applyEdit, stableStringify, FakeModelPort, FixedClock, SeededRand } from '../src/index.ts';
import type { PipelineState } from '../src/index.ts';
import { ECON_BRIEF, CS_BRIEF, MANDARIN_BRIEF } from './fixtures.ts';

function freshPorts() {
  return { model: new FakeModelPort(), clock: new FixedClock(), rand: new SeededRand() };
}

describe('core/replay (M0 bar 4) — determinism', () => {
  it('build(brief, fakeModel) twice yields byte-identical Course Objects', async () => {
    const a = await buildCourse(ECON_BRIEF, freshPorts(), { voice: true });
    const b = await buildCourse(ECON_BRIEF, freshPorts(), { voice: true });
    expect(a.terminal).toBe('ready');
    expect(stableStringify(a.course)).toBe(stableStringify(b.course));
  });

  it('build + identical edit batch twice yields byte-identical Course Objects', async () => {
    const build = async () => {
      const out = await buildCourse(ECON_BRIEF, freshPorts(), { voice: false });
      const a = out.course.graph.assessments.find((x) => x.weightPct !== null)!;
      await applyEdit(out.course, [{ type: 'assessment.set_weight', id: a.id, weightPct: a.weightPct! }], 'instructor', { clock: new FixedClock(42) });
      return out.course;
    };
    expect(stableStringify(await build())).toBe(stableStringify(await build()));
  });

  it('streams every machine state idle→ready in order', async () => {
    const seen: string[] = [];
    const out = await buildCourse(CS_BRIEF, freshPorts(), {
      voice: true,
      onState: (s: PipelineState) => seen.push(s.state),
    });
    expect(out.terminal).toBe('ready');
    // intake → author → link → judge → compile → voice → verify → grade → ready
    for (const required of ['intake', 'author', 'link', 'judge', 'compile', 'voice', 'verify', 'grade', 'ready']) {
      expect(seen).toContain(required);
    }
    expect(seen[0]).toBe('intake');
    expect(seen[seen.length - 1]).toBe('ready');
  });

  it('builds the mandarin fixture to ready', async () => {
    const out = await buildCourse(MANDARIN_BRIEF, freshPorts(), { voice: false });
    expect(out.terminal).toBe('ready');
    expect(out.course.graph.sessions.length).toBe(15);
  });
});
