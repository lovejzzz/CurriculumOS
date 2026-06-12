/** crucible/judge.ts — the judge (ADR-11). A model evaluator asking the
 *  prototype's question — "would a professor teach from this as-is?" — over a
 *  SAMPLE of the real rendered artifacts. The judge NEVER gates CI (flaky,
 *  paid); it re-calibrates the deterministic teachability meter on schedule,
 *  and the DRIFT between the two is itself a gated number (G6). */
import { artifactToMarkdown, render, type Course } from '@curriculumos/core';
import { modelFromEnv } from '@curriculumos/api';

export interface JudgeVerdict {
  score10: number;
  perArtifact: { artifact: string; score10: number; deficiency: string }[];
  verdictLine: string;
  usd: number;
}

const JUDGE_SYSTEM = [
  'You are a veteran professor reviewing machine-generated course materials.',
  'The only question that matters: would a professor teach from this AS-IS, without rewriting it?',
  'Score each artifact 1-10. 9-10: teach tomorrow, as-is. 7-8: teach with light edits. 5-6: usable skeleton, needs real work. 1-4: would not use.',
  'Judge SUBSTANCE over format: real subject matter vs generic filler, varied vs templated phrasing, a narrative arc vs disconnected sessions, assessments a student would actually learn from.',
  'Name the single biggest deficiency per artifact, concretely.',
  'Return strict JSON: { "overall": n, "verdictLine": "one sentence", "artifacts": [{"artifact": "...", "score": n, "deficiency": "..."}] }.',
].join('\n');

/** Sample the highest-signal artifacts: syllabus, two lesson plans (an early
 *  and a late session), one quiz, one study guide. */
function sampleArtifacts(course: Course): { label: string; markdown: string }[] {
  const rc = render(course);
  const ordered = [...course.graph.sessions].sort((a, b) => a.index - b.index);
  const early = ordered[Math.floor(ordered.length / 4)];
  const late = ordered[Math.floor((3 * ordered.length) / 4)];
  const picks: { label: string; key: string }[] = [
    { label: 'syllabus', key: 'syllabus:course' },
    { label: `lessonPlan(${early?.id})`, key: `lessonPlans:${early?.id}` },
    { label: `lessonPlan(${late?.id})`, key: `lessonPlans:${late?.id}` },
    { label: `quiz(${early?.id})`, key: `quizBank:${early?.id}` },
    { label: `studyGuide(${late?.id})`, key: `studyGuides:${late?.id}` },
  ];
  const out: { label: string; markdown: string }[] = [];
  for (const p of picks) {
    const art = rc.byKey[p.key];
    if (art) out.push({ label: p.label, markdown: artifactToMarkdown(art).slice(0, 6000) });
  }
  return out;
}

export async function judgeCourse(course: Course): Promise<JudgeVerdict> {
  const { port: model } = modelFromEnv();
  const sample = sampleArtifacts(course);
  const user =
    `Course: ${course.graph.courseTitle} (${course.graph.discipline}, ${course.graph.sessions.length} sessions).\n` +
    `Review these ${sample.length} artifacts and return your verdict as JSON.\n\n` +
    sample.map((s) => `=== ${s.label} ===\n${s.markdown}`).join('\n\n');

  const res = await model.completeJSON({ purpose: 'chat', reasoning: 'medium', system: JUDGE_SYSTEM, user });
  const json = res.json as { overall?: number; verdictLine?: string; artifacts?: { artifact?: string; score?: number; deficiency?: string }[] };
  const overall = typeof json.overall === 'number' ? Math.max(1, Math.min(10, json.overall)) : 0;
  return {
    score10: overall,
    perArtifact: (json.artifacts ?? []).map((a) => ({
      artifact: String(a.artifact ?? '?'),
      score10: typeof a.score === 'number' ? a.score : 0,
      deficiency: String(a.deficiency ?? ''),
    })),
    verdictLine: String(json.verdictLine ?? ''),
    usd: res.usd,
  };
}
