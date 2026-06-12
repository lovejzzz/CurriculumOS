/** render/sessions.ts — per-session artifacts: lessonPlans, slideDecks,
 *  discussions, studyGuides. Each renders from the same graph + kernels. */
import type { Concept, Course, Kernel, Session } from '../schema/courseObject.ts';
import { rotate } from '../util.ts';
import { LENSES } from './templates/lenses.ts';
import {
  CLOSING_FRAMES,
  CORE_FRAMES,
  DISCUSSION_FRAMES,
  GUIDE_LEADS,
  PRACTICE_FRAMES,
  WARMUP_FRAMES,
} from './templates/phrasing.ts';
import { readingsForSession, readingLabel, voiceBlock, assessmentsDueIn } from './helpers.ts';
import type { RenderBlock, RenderedArtifact } from './types.ts';

function sessionConcepts(course: Course, s: Session): Concept[] {
  return s.conceptIds.map((id) => course.graph.concepts.find((c) => c.id === id)).filter((c): c is Concept => !!c);
}
function kernelFor(course: Course, conceptId: string): Kernel | undefined {
  return course.overlays.kernels[conceptId as never];
}
function sessionOutcomes(course: Course, s: Session) {
  return s.outcomeIds.map((id) => course.graph.outcomes.find((o) => o.id === id)).filter(Boolean);
}

export function renderLessonPlan(course: Course, s: Session): RenderedArtifact {
  const i = s.index - 1;
  const concepts = sessionConcepts(course, s);
  const outcomes = sessionOutcomes(course, s);
  const blocks: RenderBlock[] = [];

  blocks.push({
    kind: 'header',
    entityId: s.id,
    heading: `${s.id} · ${s.title}`,
    rows: outcomes.length
      ? [['Outcome', 'Bloom'], ...outcomes.map((o) => [`${o!.id} ${o!.text}`, o!.bloom])]
      : undefined,
  });

  // Bridge primer renders before the warm-up if one targets this session
  const bridge = course.graph.bridges.find((b) => b.beforeSessionId === s.id);
  if (bridge) {
    blocks.push({
      kind: 'bridge',
      entityId: bridge.id,
      heading: `Prerequisite primer (${bridge.id})`,
      text: bridge.primer.text,
      meta: { citations: bridge.primer.citations.map((c) => `${c.title} [${c.source}:${c.externalId}]`) },
    });
  }

  // Opener — voice surface
  const topic = concepts[0]?.name ?? s.title;
  const compiledOpener =
    `${rotate(WARMUP_FRAMES, i)} ${topic.toLowerCase()}. This session matters because it carries an idea the rest of the course builds on.`;
  blocks.push(voiceBlock(course, `plan:${s.id}:opener`, 'opener', compiledOpener, 'Why this session matters'));

  // Arc: warm-up → core → practice → closing, each tied to an outcome.
  // Discipline-specific frames when the lens defines them (a cs session reads
  // like cs, a lab like a lab); the generic pools are the fallback.
  const lensArc = LENSES[course.graph.discipline].arc;
  const t = topic.toLowerCase();
  const phase = (pool: string[] | undefined, generic: string[], idx: number): string =>
    pool ? `${rotate(pool, idx).replace(/%s/g, t)}.` : `${rotate(generic, idx)} ${t}.`;
  const arcRows: string[][] = [['Phase', 'Activity', 'Outcome']];
  const o1 = outcomes[0]?.id ?? '—';
  const o2 = outcomes[1]?.id ?? o1;
  arcRows.push(['Warm-up', phase(lensArc?.warmup, WARMUP_FRAMES, i + 1), o1]);
  arcRows.push(['Core', phase(lensArc?.core, CORE_FRAMES, i), o1]);
  arcRows.push(['Practice', phase(lensArc?.practice, PRACTICE_FRAMES, i), o2]);
  arcRows.push(['Closing', phase(lensArc?.closing, CLOSING_FRAMES, i), o2]);
  blocks.push({ kind: 'arc', heading: 'Session arc', rows: arcRows });

  // Materials: readings + resources by id
  const readings = readingsForSession(course, s.id);
  const resources = course.graph.resources.filter((r) => r.sessionIds.includes(s.id as never));
  if (readings.length || resources.length) {
    blocks.push({
      kind: 'materials',
      heading: 'Materials',
      rows: [...readings.map((r) => [r.id, readingLabel(r)]), ...resources.map((r) => [r.id, `${r.title} (${r.kind})`])],
    });
  }

  // Kernel-rendered block — only when concepts have kernels (never fake subject matter)
  for (const c of concepts) {
    const k = kernelFor(course, c.id);
    if (!k) continue;
    const children: RenderBlock[] = [{ kind: 'definition', entityId: c.id, text: k.definition }];
    if (k.misconceptions[0]) {
      children.push({
        kind: 'misconception',
        heading: 'Misconception alert',
        text: `Students often think: ${k.misconceptions[0].claim} In fact: ${k.misconceptions[0].correction}`,
      });
    }
    if (k.workedExample) {
      children.push({
        kind: 'worked-example',
        heading: 'Worked example',
        text: `${k.workedExample.setup}\nSteps: ${k.workedExample.steps.join(' → ')}\nAnswer: ${k.workedExample.answer}`,
      });
    }
    if (k.romanization && Object.keys(k.romanization).length) {
      // K2: the real script renders alongside its romanization, always
      children.push({
        kind: 'romanization',
        heading: 'Terms',
        rows: Object.entries(k.romanization).map(([term, rm]) => [term, rm]),
      });
    }
    blocks.push({ kind: 'kernel', entityId: c.id, heading: `Subject focus: ${c.name}`, children });
  }

  // Transition notes — voice surface, content-aware: the narrative through-line
  // names the actual neighboring sessions (arc is a course property, not a slogan)
  const ordered = [...course.graph.sessions].sort((a, b) => a.index - b.index);
  const prev = ordered.find((x) => x.index === s.index - 1);
  const next = ordered.find((x) => x.index === s.index + 1);
  const compiledTransitions = [
    prev ? `This session builds directly on "${prev.title}" (${prev.id}) — open by surfacing what carried over.` : `This session opens the course — anchor expectations before diving in.`,
    next ? `Close by pointing forward: today's work on ${topic.toLowerCase()} is what "${next.title}" (${next.id}) will assume.` : `Close by consolidating: this is the course's last session, so the synthesis is the destination.`,
  ].join(' ');
  blocks.push(voiceBlock(course, `plan:${s.id}:transition-notes`, 'transition-notes', compiledTransitions, 'Transition notes'));

  return {
    kind: 'lessonPlans',
    scope: s.id,
    title: `${s.id} ${s.title} — Lesson Plan`,
    blocks,
    surfaces: [`plan:${s.id}:opener`, `plan:${s.id}:transition-notes`],
  };
}

export function renderSlideDeck(course: Course, s: Session): RenderedArtifact {
  const concepts = sessionConcepts(course, s);
  const outcomes = sessionOutcomes(course, s);
  const slides: RenderBlock[] = [];
  const note = (t: string) => ({ notes: t });

  // title slide carries the hook voice surface
  const compiledHook = `An overview of ${s.title.toLowerCase()} and why it earns a session of its own.`;
  const hook = voiceBlock(course, `deck:${s.id}:hook`, 'hook', compiledHook);
  slides.push({ kind: 'slide', heading: s.title, surfaceId: `deck:${s.id}:hook`, text: hook.text, meta: note(hook.text ?? '') });

  slides.push({
    kind: 'slide',
    heading: 'Today’s outcomes',
    rows: outcomes.map((o) => [o!.id, o!.text]),
    meta: note('State each outcome and how it will be assessed.'),
  });

  // agenda: the session arc as an overview slide
  slides.push({
    kind: 'slide',
    heading: 'Session plan',
    rows: [
      ['Warm-up', 'Surface what you already believe.'],
      ['Core', 'Build the central idea together.'],
      ['Practice', 'Apply it to a concrete case.'],
      ['Closing', 'Check what stuck.'],
    ],
    meta: note('Walk the arc so students know where the session is going.'),
  });

  let visuals = 0;
  for (const c of concepts) {
    const k = kernelFor(course, c.id);
    slides.push({
      kind: 'slide',
      entityId: c.id,
      heading: c.name,
      text: k?.definition ?? `Core idea: ${c.name}.`,
      meta: note(k ? `Emphasize: ${k.definition}` : `Explain ${c.name} from first principles.`),
    });
    if (k?.misconceptions[0]) {
      slides.push({
        kind: 'slide',
        entityId: c.id,
        heading: 'A common misconception',
        text: `Many believe: ${k.misconceptions[0].claim}\nIn fact: ${k.misconceptions[0].correction}`,
        meta: note('Let students argue for the misconception before correcting it.'),
      });
    }
    // native concept-map visual (zero AI calls) — rendered from graph data
    slides.push({
      kind: 'slide',
      heading: `${c.name} — concept map`,
      meta: {
        ...note(`Walk the relationships around ${c.name}.`),
        visual: 'concept-map',
        concept: c.name,
        related: concepts.filter((x) => x.id !== c.id).map((x) => x.name).slice(0, 4),
      },
    });
    visuals++;
    if (k?.workedExample) {
      slides.push({
        kind: 'slide',
        heading: 'Worked example',
        text: `${k.workedExample.setup} → ${k.workedExample.answer}`,
        meta: { ...note(k.workedExample.steps.join('; ')), visual: 'worked-example-chart', steps: k.workedExample.steps, answer: k.workedExample.answer },
      });
      visuals++;
    }
  }

  slides.push({ kind: 'slide', heading: 'Practice', text: 'In-class practice tied to today’s outcomes.', meta: note('Circulate; surface common errors.') });
  slides.push({ kind: 'slide', heading: 'Recap', rows: outcomes.map((o) => [o!.id, 'covered']), meta: note('Confidence check on each outcome.') });

  // ensure ≥2 native visuals per deck (spec) — add a synthesis map if short
  if (visuals < 2) {
    slides.push({ kind: 'slide', heading: 'Session synthesis map', meta: { ...note('Connect today’s concepts.'), visual: 'concept-map' } });
  }

  return {
    kind: 'slideDecks',
    scope: s.id,
    title: `${s.id} ${s.title} — Slides`,
    blocks: slides,
    surfaces: [`deck:${s.id}:hook`],
  };
}

export function renderDiscussion(course: Course, s: Session): RenderedArtifact {
  const i = s.index - 1;
  const readings = readingsForSession(course, s.id);
  const concepts = sessionConcepts(course, s);
  // requirement line anchors a real ReadingId or ConceptId of this session (frozen text W1)
  const anchor = readings[0] ?? null;
  const anchorConcept = concepts[0] ?? null;
  const requirement = anchor
    ? `Anchor your post in ${anchor.title} (${anchor.id}).`
    : anchorConcept
      ? `Anchor your post in the concept of ${anchorConcept.name} (${anchorConcept.id}).`
      : `Anchor your post in this session's core idea.`;

  const compiledFraming = `${rotate(DISCUSSION_FRAMES, i)} ${s.title.toLowerCase()}.`;
  const blocks: RenderBlock[] = [
    voiceBlock(course, `discussion:${s.id}:framing`, 'framing', compiledFraming, 'Prompt'),
    { kind: 'requirement', entityId: anchor?.id ?? anchorConcept?.id, text: requirement },
    {
      kind: 'expectations',
      heading: 'Participation',
      text: 'Post once by midweek and reply substantively to at least two peers. Cite the anchor text or concept by id.',
    },
  ];
  const discAssessment = course.graph.assessments.find((a) => a.kind === 'discussion' && a.sessionId === s.id);
  if (discAssessment) {
    blocks.push({ kind: 'grading-note', entityId: discAssessment.id, text: `Graded as ${discAssessment.id} (${discAssessment.weightPct ?? 'ungraded'}%).` });
  }

  return {
    kind: 'discussions',
    scope: s.id,
    title: `${s.id} ${s.title} — Discussion`,
    blocks,
    surfaces: [`discussion:${s.id}:framing`],
  };
}

export function renderStudyGuide(course: Course, s: Session): RenderedArtifact {
  const i = s.index - 1;
  const concepts = sessionConcepts(course, s);
  const readings = readingsForSession(course, s.id);
  const due = assessmentsDueIn(course, s.id);
  const blocks: RenderBlock[] = [];

  const lead = `${rotate(GUIDE_LEADS, i)} ${(concepts[0]?.name ?? s.title).toLowerCase()}.`;
  blocks.push(voiceBlock(course, `guide:${s.id}:narrative`, 'narrative', lead, 'Overview'));

  blocks.push({
    kind: 'key-concepts',
    heading: 'Key concepts',
    rows: concepts.map((c) => {
      const k = kernelFor(course, c.id);
      return [c.id, c.name, k?.definition ?? '—'];
    }),
  });

  // K2 / verdict ledger ("no-study-guide-pairs-hanzi-with-tone-marked-pinyin"):
  // every non-Latin term renders WITH its romanization in the study guide
  const termRows: string[][] = [];
  for (const c of concepts) {
    const k = kernelFor(course, c.id);
    if (k?.romanization) for (const [term, rm] of Object.entries(k.romanization)) termRows.push([term, rm]);
  }
  if (termRows.length) {
    blocks.push({ kind: 'terms', heading: 'Terms', rows: [['Term', 'Romanization'], ...termRows] });
  }

  const misconceptions = concepts
    .map((c) => kernelFor(course, c.id)?.misconceptions[0])
    .filter(Boolean) as { claim: string; correction: string }[];
  if (misconceptions.length) {
    blocks.push({
      kind: 'misconception-warnings',
      heading: 'Watch out for',
      rows: misconceptions.map((m) => [m.claim, m.correction]),
    });
  }

  blocks.push({
    kind: 'what-to-practice',
    heading: 'What to practice',
    text: due.length
      ? `Prepare for ${due.map((a) => `${a.id} ${a.title}`).join(', ')}.`
      : `Practice applying this session's concepts to new examples.`,
  });

  if (readings.length) {
    blocks.push({ kind: 'reading-checklist', heading: 'Reading checklist', rows: readings.map((r) => [r.id, readingLabel(r)]) });
  }

  // exam sessions add an exam-prep section scoped to coveredSessionIds
  const exam = course.graph.assessments.find((a) => a.kind === 'exam' && a.dueSessionId === s.id);
  if (exam?.coveredSessionIds?.length) {
    const scope = exam.coveredSessionIds
      .map((id) => course.graph.sessions.find((x) => x.id === id)?.index)
      .filter((n): n is number => !!n)
      .sort((a, b) => a - b);
    blocks.push({
      kind: 'exam-prep',
      entityId: exam.id,
      surfaceId: `guide:${s.id}:exam-prep`,
      heading: `Exam preparation (${exam.id})`,
      text: `Review lessons ${scope[0]}–${scope[scope.length - 1]}. Weight: ${exam.weightPct ?? 'per instructor'}%.`,
    });
  }

  const surfaces = [`guide:${s.id}:narrative`];
  if (exam?.coveredSessionIds?.length) surfaces.push(`guide:${s.id}:exam-prep`);
  return { kind: 'studyGuides', scope: s.id, title: `${s.id} ${s.title} — Study Guide`, blocks, surfaces };
}
