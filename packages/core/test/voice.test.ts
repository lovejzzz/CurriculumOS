import { describe, expect, it } from 'vitest';
import { checkVoice } from '../src/index.ts';

describe('voice contracts (W1–W3, calibrated)', () => {
  const base = { minWords: 5, maxWords: 200 };

  it('accepts prose that draws only on grounded facts', () => {
    const r = checkVoice({
      ...base,
      compiled: 'Kepler described elliptical orbits.',
      grounding: 'Kepler described elliptical orbits. The demand curve maps price to quantity. Newton.',
      voiced: 'Kepler showed that orbits are elliptical, a foundation the rest of the unit leans on.',
      frozen: [],
    });
    expect(r.ok).toBe(true);
  });

  it('does not flag a sentence-initial capitalized common word as a new name (calibration)', () => {
    const r = checkVoice({
      ...base,
      compiled: 'This session covers the demand curve.',
      grounding: 'This session covers the demand curve.',
      voiced: 'Through careful work, students trace the demand curve. Building from there, the idea sticks.',
      frozen: [],
    });
    // "Through", "Building" are sentence-initial → grammar, not claims
    expect(r.ok).toBe(true);
  });

  it('flags a genuinely new proper noun introduced mid-sentence (no new facts, W2)', () => {
    const r = checkVoice({
      ...base,
      compiled: 'This session covers the demand curve.',
      grounding: 'This session covers the demand curve.',
      voiced: 'This session covers the demand curve, a concept first formalized by Alfred Marshall in his text.',
      frozen: [],
    });
    expect(r.ok).toBe(false);
    expect(r.violations.some((v) => v.includes('Marshall'))).toBe(true);
  });

  it('flags a new number (W2)', () => {
    const r = checkVoice({
      ...base,
      compiled: 'The midterm is worth 20 percent.',
      grounding: 'The midterm is worth 20 percent.',
      voiced: 'The midterm is worth 20 percent and covers the first 7 lessons of the term.',
      frozen: [],
    });
    expect(r.ok).toBe(false);
    expect(r.violations.some((v) => v.includes('7'))).toBe(true);
  });

  it('enforces frozen substrings survive verbatim (W1)', () => {
    const r = checkVoice({
      ...base,
      compiled: 'Anchor your post in Antigone (R4.1).',
      grounding: 'Anchor your post in Antigone (R4.1).',
      voiced: 'For this discussion, ground your response in the assigned tragedy and cite it.',
      frozen: ['Anchor your post in Antigone', 'R4.1'],
    });
    expect(r.ok).toBe(false);
    expect(r.violations.some((v) => v.startsWith('W1-frozen'))).toBe(true);
  });

  it('enforces word bounds (W3)', () => {
    const short = checkVoice({ compiled: 'x', grounding: 'x', voiced: 'too short', frozen: [], minWords: 60, maxWords: 140 });
    expect(short.ok).toBe(false);
    expect(short.violations.some((v) => v.startsWith('W3-bounds'))).toBe(true);
  });
});
