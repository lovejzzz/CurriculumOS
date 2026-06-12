/** render/syllabus.ts — the syllabus (1 per course), per 040-artifact-specs. */
import type { Course } from '../schema/courseObject.ts';
import { LENSES } from './templates/lenses.ts';
import {
  assessmentsDueIn,
  provenanceSorted,
  readingsForSession,
  sessionsInOrder,
  voiceBlock,
} from './helpers.ts';
import { weightScheme } from './weights.ts';
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

  // Grading table — stated weights when the brief gives them (A4), otherwise a
  // suggested distribution clearly marked "edit me" (V0.0.3). Either way the
  // table is functional — a number in every row, summing to 100.
  const scheme = weightScheme(course);
  const gradeRows = g.assessments.map((a) => [a.id, a.title, `${scheme.byId[a.id] ?? 0}%`]);
  const total = g.assessments.reduce((s, a) => s + (scheme.byId[a.id] ?? 0), 0);
  const gradingBlock: RenderBlock = {
    kind: 'grading-table',
    heading: scheme.suggested ? 'Grading — suggested weighting (edit me)' : 'Grading',
    rows: [['Id', 'Assessment', 'Weight'], ...gradeRows],
    meta: scheme.suggested
      ? { note: 'The brief did not state weights; this is a suggested distribution to adjust. Totals 100%.' }
      : Math.abs(total - 100) > 0.05
        ? { note: `Stated weights sum to ${total.toFixed(0)}% — confirm the intended distribution.` }
        : undefined,
  };
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
