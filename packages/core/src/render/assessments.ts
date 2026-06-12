/** render/assessments.ts — assignments (briefs), rubrics, quizBank.
 *  Brief criteria mirror the rubric 1:1 (040); quiz texture rotates phrasings
 *  so no 8-word shingle repeats ≥12× (the v0.14.6 scar, trap #9). */
import type { Assessment, Concept, Course, Kernel, Session } from '../schema/courseObject.ts';
import { rotate } from '../util.ts';
import { LENSES } from './templates/lenses.ts';
import { MC_CORRECT_STEMS, MC_EXPLANATION_LEADS } from './templates/phrasing.ts';
import { readingsForSession, readingLabel, voiceBlock, rubricPoints } from './helpers.ts';
import type { RenderBlock, RenderedArtifact } from './types.ts';

function sessionOf(course: Course, id: string): Session | undefined {
  return course.graph.sessions.find((s) => s.id === id);
}
function conceptsOfSession(course: Course, sessionId: string): Concept[] {
  const s = sessionOf(course, sessionId);
  if (!s) return [];
  return s.conceptIds.map((id) => course.graph.concepts.find((c) => c.id === id)).filter((c): c is Concept => !!c);
}
function kernelFor(course: Course, conceptId: string): Kernel | undefined {
  return course.overlays.kernels[conceptId as never];
}

/** The four rubric criteria names — shared by brief (Criteria) and rubric so
 *  they mirror 1:1 by name (040 spec). */
function criteriaNames(course: Course): string[] {
  const lens = LENSES[course.graph.discipline];
  return [
    `Command of ${lens.deliverable} content`,
    'Use of evidence and sources',
    'Reasoning and structure',
    'Clarity and conventions',
  ];
}

export function renderBrief(course: Course, a: Assessment): RenderedArtifact {
  const s = sessionOf(course, a.sessionId)!;
  const dueSession = sessionOf(course, a.dueSessionId);
  const concepts = conceptsOfSession(course, a.sessionId);
  const readings = readingsForSession(course, a.sessionId);
  const lens = LENSES[course.graph.discipline];
  const blocks: RenderBlock[] = [];

  blocks.push({
    kind: 'header',
    entityId: a.id,
    heading: `${a.id} · ${a.title}`,
    text: `Weight: ${a.weightPct ?? 'per instructor'}% · Due: ${a.dueSessionId} ${dueSession?.title ?? ''}`,
  });

  // Context — the highest-value voice slot in the product
  const k = concepts.map((c) => kernelFor(course, c.id)).find(Boolean);
  const compiledContext =
    `This ${lens.deliverable} asks you to apply ${(concepts[0]?.name ?? s.title).toLowerCase()}. ` +
    (k ? `${k.definition} ` : '') +
    `Ground your work in the session's materials.`;
  blocks.push(voiceBlock(course, `brief:${s.id}:context`, 'context', compiledContext, 'Context'));

  blocks.push({
    kind: 'task',
    heading: 'Task',
    text: `${rotate(lens.signatureVerbs, s.index).replace(/^./, (c) => c.toUpperCase())} a ${lens.deliverable} that demonstrates mastery of ${a.title.toLowerCase()}.`,
  });
  blocks.push({
    kind: 'deliverables',
    heading: 'Deliverables',
    text: `Submit one ${lens.deliverable}. Follow the format and length your instructor specifies.`,
  });
  // Criteria MUST mirror the rubric criteria 1:1 by name
  blocks.push({ kind: 'criteria', heading: 'Criteria', rows: criteriaNames(course).map((c, i) => [`${i + 1}`, c]) });

  if (readings.length) {
    blocks.push({ kind: 'sources', heading: 'Sources', rows: readings.map((r) => [r.id, readingLabel(r)]) });
  }

  return { kind: 'assignments', scope: a.id, title: `${a.id} ${a.title} — Brief`, blocks, surfaces: [`brief:${s.id}:context`] };
}

export function renderRubric(course: Course, a: Assessment): RenderedArtifact {
  const names = criteriaNames(course);
  const levels = ['Exemplary', 'Proficient', 'Developing', 'Beginning'];
  const pts = rubricPoints(a.weightPct);
  const per = pts / names.length;
  const blocks: RenderBlock[] = [];

  blocks.push({
    kind: 'header',
    entityId: a.id,
    heading: `${a.id} · ${a.title} — Rubric`,
    text: `Total: ${pts} points · Weight: ${a.weightPct ?? 'per instructor'}%`,
  });

  // 4 criteria × 4 levels, behavior-anchored descriptors
  const anchored = (criterion: string, level: string): string => {
    const lc = criterion.toLowerCase();
    switch (level) {
      case 'Exemplary':
        return `Work consistently demonstrates ${lc} with no significant gaps.`;
      case 'Proficient':
        return `Work demonstrates ${lc} with minor, non-substantive gaps.`;
      case 'Developing':
        return `Work shows partial ${lc}; key elements are missing or unclear.`;
      default:
        return `Work shows little evidence of ${lc}.`;
    }
  };
  blocks.push({
    kind: 'rubric-grid',
    rows: [
      ['Criterion', ...levels, 'Points'],
      ...names.map((c) => [c, ...levels.map((l) => anchored(c, l)), per.toFixed(1)]),
    ],
  });

  return { kind: 'rubrics', scope: a.id, title: `${a.id} ${a.title} — Rubric`, blocks, surfaces: [] };
}

function mcItem(course: Course, concept: Concept, idx: number, ns: string): RenderBlock {
  const k = kernelFor(course, concept.id);
  const correct = k ? k.misconceptions[0]?.correction ?? k.definition : `${concept.name} as defined in this session.`;
  const wrong = k?.misconceptions[0]?.claim ?? `A common misunderstanding of ${concept.name}.`;
  const options = [correct, wrong, `An unrelated property of ${concept.name}.`, `A definition from a different concept.`];
  return {
    kind: 'mc',
    entityId: concept.id,
    heading: `${ns}.${idx} (multiple choice)`,
    text: `Which statement about ${concept.name} is most accurate?`,
    rows: options.map((o, i) => [String.fromCharCode(65 + i), o]),
    meta: {
      answer: 'A',
      // rotate the correct-answer phrasing and explanation lead so no shingle repeats (trap #9)
      explanation: `${rotate(MC_CORRECT_STEMS, idx)} A. ${rotate(MC_EXPLANATION_LEADS, idx + 1)} ${correct}`,
    },
  };
}

export function renderQuiz(course: Course, s: Session): RenderedArtifact {
  const concepts = conceptsOfSession(course, s.id);
  const ns = `Q${s.index}`;
  const blocks: RenderBlock[] = [{ kind: 'header', entityId: s.id, heading: `${s.id} ${s.title} — Quiz`, text: `Item namespace: ${ns}` }];
  let n = 1;
  // ≥6 items: MC (4 options), short answer, one applied — Bloom mix Understand+Apply
  for (const c of concepts.slice(0, 4)) {
    blocks.push(mcItem(course, c, n++, ns));
  }
  while (blocks.length < 5) {
    const c = concepts[0];
    blocks.push({ kind: 'short-answer', heading: `${ns}.${n} (short answer)`, text: `Explain ${c?.name ?? s.title} in your own words.`, meta: { answer: `A correct answer references the session's definition of ${c?.name ?? s.title}.` }, entityId: c?.id });
    n++;
  }
  const applied = concepts.find((c) => kernelFor(course, c.id)?.workedExample);
  const ak = applied ? kernelFor(course, applied.id) : undefined;
  blocks.push({
    kind: 'applied',
    entityId: applied?.id,
    heading: `${ns}.${n++} (applied)`,
    text: ak?.workedExample ? `${ak.workedExample.setup}` : `Apply ${concepts[0]?.name ?? s.title} to a new situation of your choosing.`,
    meta: { answer: ak?.workedExample ? ak.workedExample.answer : 'Answers vary; must apply the concept correctly.' },
  });
  blocks.push({ kind: 'short-answer', heading: `${ns}.${n++} (short answer)`, text: `Describe one common error related to ${concepts[0]?.name ?? s.title} and how to avoid it.`, meta: { answer: 'References a misconception from the session.' } });

  return { kind: 'quizBank', scope: s.id, title: `${s.id} ${s.title} — Quiz`, blocks, surfaces: [] };
}

export function renderExam(course: Course, a: Assessment): RenderedArtifact {
  const covered = a.coveredSessionIds ?? [a.sessionId];
  const ns = `EX${a.id.replace(/[^0-9]/g, '')}`;
  const coveredSessions = covered
    .map((id) => course.graph.sessions.find((s) => s.id === id))
    .filter((s): s is Session => !!s)
    .sort((x, y) => x.index - y.index);
  const scopeLine = coveredSessions.length
    ? `Lessons ${coveredSessions[0]!.index}–${coveredSessions[coveredSessions.length - 1]!.index}`
    : 'Course scope';
  const blocks: RenderBlock[] = [
    { kind: 'header', entityId: a.id, heading: `${a.id} · ${a.title}`, text: `${scopeLine} · Weight: ${a.weightPct ?? 'per instructor'}%` },
  ];
  let n = 1;
  // ≥10 items, ≥1 per covered session, mixed types incl. short answer + essay
  for (const s of coveredSessions) {
    const concepts = conceptsOfSession(course, s.id);
    if (concepts[0]) blocks.push(mcItem(course, concepts[0], n++, ns));
  }
  // top up to 10 with short answers across covered sessions
  let guard = 0;
  while (blocks.length - 1 < 9 && guard < 40) {
    const s = coveredSessions[(n - 1) % Math.max(1, coveredSessions.length)];
    const concepts = s ? conceptsOfSession(course, s.id) : [];
    const c = concepts[0];
    blocks.push({ kind: 'short-answer', entityId: c?.id, heading: `${ns}.${n} (short answer)`, text: `Explain ${c?.name ?? s?.title ?? 'a key concept'} and give an example.`, meta: { answer: 'References the session definition with a correct example.' } });
    n++;
    guard++;
  }
  // essay keyed on rubric hints
  blocks.push({
    kind: 'essay',
    heading: `${ns}.${n} (essay)`,
    text: `Synthesize the major ideas across ${scopeLine.toLowerCase()} into a coherent argument.`,
    meta: { answer: 'Rubric hints: thesis clarity, correct use of ≥3 concepts, evidence, organization.' },
  });

  return { kind: 'quizBank', scope: a.id, title: `${a.id} ${a.title} — Exam`, blocks, surfaces: [] };
}
