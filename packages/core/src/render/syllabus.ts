/** render/syllabus.ts — the syllabus (1 per course), per 040-artifact-specs. */
import type { Course } from '../schema/courseObject.ts';
import { LENSES } from './templates/lenses.ts';
import {
  assessmentsDueIn,
  gradedAssessments,
  provenanceSorted,
  readingsForSession,
  sessionsInOrder,
  voiceBlock,
} from './helpers.ts';
import type { RenderBlock, RenderedArtifact } from './types.ts';

export function renderSyllabus(course: Course): RenderedArtifact {
  const g = course.graph;
  const lens = LENSES[g.discipline];
  const blocks: RenderBlock[] = [];

  blocks.push({
    kind: 'header',
    heading: g.courseTitle,
    text: [g.term, `${lens.label} lens`].filter(Boolean).join(' · '),
  });

  // Course description — the voice surface (≤140 words)
  const compiledWelcome =
    `This ${lens.label.toLowerCase()} course runs across ${g.sessions.length} sessions. ` +
    `Students engage through ${lens.activity}s and produce ${lens.deliverable}s, building from foundational ideas toward the course's culminating work.`;
  blocks.push(voiceBlock(course, 'syllabus:course:welcome', 'welcome', compiledWelcome, 'Course description'));

  // Grading table — one row per graded assessment, summing to 100 (A4)
  const graded = gradedAssessments(course);
  const total = graded.reduce((s, a) => s + (a.weightPct ?? 0), 0);
  const gradeRows = graded.map((a) => [a.id, a.title, `${a.weightPct}%`]);
  const ungraded = g.assessments.filter((a) => a.weightPct === null);
  for (const a of ungraded) gradeRows.push([a.id, a.title, 'weighting per instructor']);
  const gradingBlock: RenderBlock = {
    kind: 'grading-table',
    heading: 'Grading',
    rows: [['Id', 'Assessment', 'Weight'], ...gradeRows],
  };
  if (Math.abs(total - 100) > 0.05 && graded.length > 0) {
    gradingBlock.meta = { note: `Graded weights sum to ${total.toFixed(0)}% — weighting per instructor.` };
  }
  blocks.push(gradingBlock);

  // Schedule — one row per session in index order
  const scheduleRows: string[][] = [['Session', 'Title', 'Due', 'Readings']];
  for (const s of sessionsInOrder(course)) {
    const due = assessmentsDueIn(course, s.id)
      .map((a) => `${a.id} ${a.title}`)
      .join('; ');
    const readings = readingsForSession(course, s.id)
      .map((r) => `${r.id}${r.locator ? ` (${r.locator})` : ''}`)
      .join('; ');
    scheduleRows.push([s.id, s.title, due || '—', readings || '—']);
  }
  blocks.push({ kind: 'schedule', heading: 'Schedule', rows: scheduleRows });

  // Required texts — books/chapters, provenance-ordered
  const texts = provenanceSorted(g.readings.filter((r) => r.kind === 'book' || r.kind === 'chapter'));
  if (texts.length > 0) {
    blocks.push({
      kind: 'required-texts',
      heading: 'Required texts',
      rows: [
        ['Id', 'Text', 'Locator'],
        ...texts.map((r) => [r.id, `${r.author ? r.author + ', ' : ''}${r.title}`, r.locator ?? '']),
      ],
    });
  }

  // Policies — honest default block (brief-extracted policies would render here if named)
  blocks.push({
    kind: 'policies',
    heading: 'Policies',
    text:
      'Attendance, late work, and academic integrity follow institutional policy. ' +
      'Accommodations are arranged through the instructor and the disability services office.',
  });

  return {
    kind: 'syllabus',
    scope: 'course',
    title: `${g.courseTitle} — Syllabus`,
    blocks,
    surfaces: ['syllabus:course:welcome'],
  };
}
