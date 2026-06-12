/** crucible/driver.ts — the harness drives a build (founding §8: the Crucible
 *  is the CI). It grades the engine DIRECTLY (and can drive the client too).
 *  Captures the machine states, the grade, the cost — then a round report
 *  diffs against the verdict ledger and the drift gate fails on >3pt delta. */
import { buildCourse, gradeStructural, gradeTeachability, type BuildPorts, type Course } from '@curriculumos/core';
import { FakeModelPort, FixedClock, SeededRand } from '@curriculumos/core';
import { modelFromEnv } from '@curriculumos/api';
import { SystemClock, CryptoRand } from '@curriculumos/api';

export interface DriveResult {
  id: string;
  title: string;
  states: string[];
  terminal: 'ready' | 'blocked';
  blockedReason?: string;
  structural: number;
  letter: string;
  teachability: number;
  findings: number;
  costUsd: number;
  course: Course;
  /** seeded-gap honesty: did a prerequisite bridge get diagnosed? */
  bridges: number;
  linked: number;
}

export interface DriveOptions {
  real?: boolean; // use the configured provider (OpenAI/DeepSeek) instead of the fake
  voice?: boolean;
  budgetUsd?: number;
}

export async function driveCourse(course: { id: string; title: string; prompt: string }, opts: DriveOptions = {}): Promise<DriveResult> {
  const ports: BuildPorts = opts.real
    ? { model: modelFromEnv().port, clock: new SystemClock(), rand: new CryptoRand() }
    : { model: new FakeModelPort(), clock: new FixedClock(), rand: new SeededRand() };

  const states: string[] = [];
  const outcome = await buildCourse(course.prompt, ports, {
    voice: opts.voice ?? false,
    budgetUsd: opts.budgetUsd ?? Infinity,
    onState: (s) => states.push(s.state),
  });

  const c = outcome.course;
  const s = gradeStructural(c);
  const t = gradeTeachability(c);
  return {
    id: course.id,
    title: course.title,
    states,
    terminal: outcome.terminal,
    ...(outcome.blockedReason ? { blockedReason: outcome.blockedReason } : {}),
    structural: s.score,
    letter: s.letter,
    teachability: t.score10,
    findings: s.findings.length,
    costUsd: c.receipts.cost.totalUsd,
    course: c,
    bridges: c.graph.bridges.length,
    linked: c.graph.concepts.filter((x) => x.genomeRef).length,
  };
}
