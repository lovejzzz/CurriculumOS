import { describe, expect, it } from 'vitest';
import { runRound } from '../src/round.ts';
import { excerptForJudge } from '../src/judge.ts';

describe('crucible (fake engine)', () => {
  it('drives the smoke course to ready and writes a passing report', async () => {
    const { results, pass, report } = await runRound({ courses: 'smoke', real: false, voice: false, maxSpend: Infinity, judge: false });
    expect(results.length).toBe(1);
    expect(results[0]!.terminal).toBe('ready');
    expect(results[0]!.structural).toBeGreaterThanOrEqual(80);
    expect(pass).toBe(true);
    expect(report).toContain('verdict: PASS');
  });

  it('diagnoses the econ seeded gap across the extended set', async () => {
    const { results } = await runRound({ courses: 'econ-intro', real: false, voice: false, maxSpend: Infinity, judge: false });
    const econ = results.find((r) => r.id === 'econ-intro')!;
    expect(econ.terminal).toBe('ready');
    expect(econ.bridges).toBeGreaterThan(0); // the elasticity→demand-curve bridge
    expect(econ.linked).toBeGreaterThanOrEqual(8);
  });

  it('all four audit courses build to ready (the regression bar)', async () => {
    const { results, pass } = await runRound({ courses: 'all', real: false, voice: false, maxSpend: Infinity, judge: false });
    expect(results.length).toBe(4);
    expect(results.every((r) => r.terminal === 'ready')).toBe(true);
    expect(pass).toBe(true);
  });

  it('the campaign spec resolves the 10/10 six and yields a committable corpus record (F.1)', async () => {
    const { results, corpus } = await runRound({ courses: 'campaign', real: false, voice: false, maxSpend: Infinity, judge: false, corpus: true });
    expect(results.map((r) => r.id)).toEqual(['mandarin', 'cs-python', 'geology', 'world-lit', 'art-history', 'intro-philosophy']);
    expect(results.every((r) => r.terminal === 'ready')).toBe(true);
    expect(corpus.spec).toBe('campaign');
    expect(corpus.courses).toHaveLength(6);
    for (const c of corpus.courses) {
      expect(c.structural).toBeGreaterThanOrEqual(80);
      expect(c.linked, `${c.id} links the genome`).toBeGreaterThanOrEqual(8); // v0.0.8 bar holds across the campaign set
    }
  });

  it('judge excerpts cut at a line boundary with an explicit marker, never mid-sentence (v0.0.8 scar)', () => {
    // the v0.0.8 round: a silent .slice(6000) made long lesson plans read as
    // truncated documents and the judge docked two courses for the harness's
    // own artifact — the excerpt must SAY it is an excerpt
    const long = Array.from({ length: 400 }, (_, i) => `Row ${i}: a complete sentence about the session content.`).join('\n');
    const excerpt = excerptForJudge(long);
    expect(excerpt.length).toBeLessThan(long.length);
    expect(excerpt).toContain('the full document continues and is complete');
    // the cut lands on a line boundary: the last content line before the marker is intact
    const lines = excerpt.split('\n');
    expect(lines[lines.length - 3]).toMatch(/\.$/);
    // short artifacts pass through untouched
    expect(excerptForJudge('# Short doc\nDone.')).toBe('# Short doc\nDone.');
  });
});
