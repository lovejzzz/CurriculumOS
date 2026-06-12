import { describe, expect, it } from 'vitest';
import { runRound } from '../src/round.ts';

describe('crucible (fake engine)', () => {
  it('drives the smoke course to ready and writes a passing report', async () => {
    const { results, pass, report } = await runRound({ courses: 'smoke', real: false, voice: false, maxSpend: Infinity });
    expect(results.length).toBe(1);
    expect(results[0]!.terminal).toBe('ready');
    expect(results[0]!.structural).toBeGreaterThanOrEqual(80);
    expect(pass).toBe(true);
    expect(report).toContain('verdict: PASS');
  });

  it('diagnoses the econ seeded gap across the extended set', async () => {
    const { results } = await runRound({ courses: 'econ-intro', real: false, voice: false, maxSpend: Infinity });
    const econ = results.find((r) => r.id === 'econ-intro')!;
    expect(econ.terminal).toBe('ready');
    expect(econ.bridges).toBeGreaterThan(0); // the elasticity→demand-curve bridge
    expect(econ.linked).toBeGreaterThanOrEqual(8);
  });

  it('all four audit courses build to ready (the regression bar)', async () => {
    const { results, pass } = await runRound({ courses: 'all', real: false, voice: false, maxSpend: Infinity });
    expect(results.length).toBe(4);
    expect(results.every((r) => r.terminal === 'ready')).toBe(true);
    expect(pass).toBe(true);
  });
});
