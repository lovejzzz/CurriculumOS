/** render/misc.ts — courseMap (graph table of contents) and courseFaq. */
import type { Course } from '../schema/courseObject.ts';
import { rotate } from '../util.ts';
import { FAQ_LEADS } from './templates/phrasing.ts';
import { assessmentsDueIn, readingsForSession, sessionsInOrder } from './helpers.ts';
import type { RenderBlock, RenderedArtifact } from './types.ts';

export function renderCourseMap(course: Course): RenderedArtifact {
  const rows: string[][] = [['Session', 'Title', 'Concepts', 'Outcomes', 'Due', 'Readings']];
  for (const s of sessionsInOrder(course)) {
    rows.push([
      s.id,
      s.title,
      s.conceptIds.join(', ') || '—',
      s.outcomeIds.join(', ') || '—',
      assessmentsDueIn(course, s.id).map((a) => a.id).join(', ') || '—',
      readingsForSession(course, s.id).map((r) => r.id).join(', ') || '—',
    ]);
  }
  return {
    kind: 'courseMap',
    scope: 'course',
    title: `${course.graph.courseTitle} — Course Map`,
    blocks: [{ kind: 'map', heading: 'Course map', rows }],
    surfaces: [],
  };
}

export function renderFaq(course: Course): RenderedArtifact {
  const blocks: RenderBlock[] = [];
  // Course-level: grading, late work, materials — from the same registry the syllabus uses
  const graded = course.graph.assessments.filter((a) => a.weightPct !== null);
  const total = graded.reduce((s, a) => s + (a.weightPct ?? 0), 0);
  blocks.push({
    kind: 'course-faq',
    heading: 'Course questions',
    rows: [
      ['How is the course graded?', `Across ${graded.length} graded items totaling ${total.toFixed(0)}%.`],
      ['What materials do I need?', `${course.graph.readings.length} readings and ${course.graph.resources.length} resources, listed by session.`],
      ['What is the late-work policy?', 'Late work follows institutional policy unless the instructor states otherwise.'],
    ],
  });

  // Per-session: 2–3 anticipated questions answered from graph facts
  let i = 0;
  for (const s of sessionsInOrder(course)) {
    const due = assessmentsDueIn(course, s.id);
    const qa: string[][] = [];
    qa.push([`${rotate(FAQ_LEADS, i)} what ${s.id} covers.`, `${s.title}.`]);
    if (due.length) {
      qa.push([`Is anything due in ${s.id}?`, due.map((a) => `${a.id} ${a.title} (${a.weightPct ?? 'ungraded'}%)`).join('; ')]);
    }
    const readings = readingsForSession(course, s.id);
    if (readings.length) qa.push([`What do I read for ${s.id}?`, readings.map((r) => `${r.id} ${r.title}`).join('; ')]);
    blocks.push({ kind: 'session-faq', entityId: s.id, heading: `${s.id} ${s.title}`, rows: qa });
    i++;
  }

  return { kind: 'courseFaq', scope: 'course', title: `${course.graph.courseTitle} — FAQ`, blocks, surfaces: [] };
}
