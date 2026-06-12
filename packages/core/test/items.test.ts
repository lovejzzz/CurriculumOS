/** items.test.ts — v0.0.3 bar: real assessment items (Pass C). The judge
 *  scored compiled quizzes 1–4/10; these pin the contracts that make a genuine
 *  item the only thing that ships, and that authored items reach the quiz. */
import { describe, expect, it } from 'vitest';
import { buildCourse, render, checkItem, checkItemSet, itemsStage, FakeModelPort, FixedClock, SeededRand } from '../src/index.ts';
import type { AssessmentItem, Kernel } from '../src/index.ts';
import { CS_BRIEF } from './fixtures.ts';

function ports(thin = false) {
  return { model: new FakeModelPort({ thin }), clock: new FixedClock(), rand: new SeededRand() };
}

const kernel: Kernel = {
  conceptId: 'C1',
  definition: 'A while loop repeats its body as long as a condition holds.',
  misconceptions: [
    { claim: 'The condition is re-checked continuously while the body runs.', correction: 'It is tested only between iterations.' },
    { claim: 'A while loop always runs at least once.', correction: 'If the condition is false initially, the body never runs.' },
  ],
  citations: [],
  basedOn: { outcomeHash: 'x', titleHash: 'y' },
};

describe('item contracts (Pass C)', () => {
  const good: AssessmentItem = {
    sessionId: 'S1',
    conceptId: 'C1',
    kind: 'mc',
    stem: 'When does a while loop test its condition?',
    options: [
      { text: 'Only between iterations of the body.', correct: true },
      { text: 'Continuously while the body runs.', correct: false },
      { text: 'The loop always runs its body at least once.', correct: false },
      { text: 'The condition is checked after the loop ends.', correct: false },
    ],
    answerKey: 'Between iterations — the condition is tested before each pass.',
    bloom: 'Understand',
    status: 'active',
  };

  it('accepts a genuine kernel-grounded MC item', () => {
    expect(checkItem(good, kernel).ok).toBe(true);
  });

  it('rejects two correct options', () => {
    const bad = { ...good, options: good.options!.map((o) => ({ ...o, correct: true })) };
    const r = checkItem(bad, kernel);
    expect(r.ok).toBe(false);
    expect(r.violations.some((v) => v.includes('ONE'))).toBe(true);
  });

  it('rejects a placeholder answer key', () => {
    expect(checkItem({ ...good, answerKey: 'TBD' }, kernel).ok).toBe(false);
  });

  it('rejects a stem that leaks the answer', () => {
    const leaked = {
      ...good,
      stem: 'A while loop tests its condition only between iterations of the body — when?',
      options: [
        { text: 'Only between iterations of the body.', correct: true },
        { text: 'Continuously.', correct: false },
        { text: 'After the loop.', correct: false },
        { text: 'Never.', correct: false },
      ],
    };
    expect(checkItem(leaked, kernel).ok).toBe(false);
  });

  it('flags a set of templated stems and missing Bloom variety', () => {
    const items: AssessmentItem[] = Array.from({ length: 4 }, () => ({ ...good, bloom: 'Understand' as const }));
    const r = checkItemSet(items);
    expect(r.ok).toBe(false);
  });
});

describe('Pass C end-to-end (fake authors real items)', () => {
  it('authored items reach the rendered quiz, replacing compiled ones', async () => {
    const out = await buildCourse(CS_BRIEF, ports(), { voice: false, items: true });
    expect(out.terminal).toBe('ready');
    const withItems = Object.keys(out.course.overlays.items ?? {}).length;
    expect(withItems).toBeGreaterThan(0);
    // every authored item set passes its own contracts
    for (const [, items] of Object.entries(out.course.overlays.items ?? {})) {
      expect(checkItemSet(items as AssessmentItem[]).ok).toBe(true);
      for (const it of items as AssessmentItem[]) {
        const k = (it as AssessmentItem).conceptId ? out.course.overlays.kernels[(it as AssessmentItem).conceptId!] : undefined;
        expect(checkItem(it as AssessmentItem, k).ok).toBe(true);
      }
    }
    // the rendered quiz uses them (4 distinct authored items, varied stems)
    const rc = render(out.course);
    const quiz = rc.artifacts.find((a) => a.kind === 'quizBank' && a.scope.startsWith('S'));
    expect(quiz).toBeTruthy();
    const mc = quiz!.blocks.filter((b) => b.kind === 'mc');
    expect(mc.length).toBeGreaterThanOrEqual(2);
    const stems = new Set(mc.map((b) => b.text));
    expect(stems.size).toBe(mc.length); // no templated/duplicate stems
  });

  it('items disabled → quiz falls back to compiled items (no crash, still valid)', async () => {
    const out = await buildCourse(CS_BRIEF, ports(), { voice: false, items: false });
    expect(out.terminal).toBe('ready');
    expect(out.course.overlays.items ?? {}).toEqual({});
    const rc = render(out.course);
    expect(rc.artifacts.some((a) => a.kind === 'quizBank')).toBe(true);
  });
});
