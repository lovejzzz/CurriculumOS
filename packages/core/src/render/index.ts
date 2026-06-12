/** render/index.ts — render(course) → all artifacts.
 *  Pure function (Law 4: structure is free). The same render runs in compile,
 *  in the grader, in the diff, and in the package builder — one render, many
 *  consumers, zero drift. Voice overlays are applied inside helpers.voiceBlock. */
import type { Course } from '../schema/courseObject.ts';
import { renderSyllabus } from './syllabus.ts';
import { renderLessonPlan, renderSlideDeck, renderDiscussion, renderStudyGuide } from './sessions.ts';
import { renderBrief, renderRubric, renderQuiz, renderExam } from './assessments.ts';
import { renderCourseMap, renderFaq } from './misc.ts';
import { sessionsInOrder } from './helpers.ts';
import type { RenderedArtifact, RenderedCourse } from './types.ts';

export * from './types.ts';

/** Assessments that bear a brief + rubric (graded-artifact, project, oral). */
function briefBearing(kind: string): boolean {
  return kind === 'graded-artifact' || kind === 'project' || kind === 'oral';
}

export function render(course: Course): RenderedCourse {
  const artifacts: RenderedArtifact[] = [];
  artifacts.push(renderCourseMap(course));
  artifacts.push(renderSyllabus(course));

  const sessions = sessionsInOrder(course);
  for (const s of sessions) {
    artifacts.push(renderLessonPlan(course, s));
    artifacts.push(renderSlideDeck(course, s));
    artifacts.push(renderDiscussion(course, s));
    artifacts.push(renderStudyGuide(course, s));
  }

  // assignments + rubrics: one per brief-bearing assessment (cadence handled by registry)
  for (const a of course.graph.assessments) {
    if (briefBearing(a.kind)) {
      artifacts.push(renderBrief(course, a));
      artifacts.push(renderRubric(course, a));
    }
  }

  // quiz bank: one per quiz-cadence session + one exam doc per exam assessment
  const quizSessions = new Set<string>();
  for (const a of course.graph.assessments) {
    if (a.kind === 'quiz') {
      const targets = a.cadence === 'per-session' ? a.coveredSessionIds ?? [a.sessionId] : [a.sessionId];
      for (const t of targets) quizSessions.add(t);
    }
  }
  for (const s of sessions) {
    if (quizSessions.has(s.id)) artifacts.push(renderQuiz(course, s));
  }
  for (const a of course.graph.assessments) {
    if (a.kind === 'exam') artifacts.push(renderExam(course, a));
  }

  artifacts.push(renderFaq(course));

  const byKey: Record<string, RenderedArtifact> = {};
  for (const a of artifacts) byKey[`${a.kind}:${a.scope}`] = a;
  return { artifacts, byKey };
}

/** All voice surface ids the current graph exposes (voice stage iterates these). */
export function allSurfaces(course: Course): string[] {
  return render(course).artifacts.flatMap((a) => a.surfaces);
}
