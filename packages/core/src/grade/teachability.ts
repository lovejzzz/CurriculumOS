/** grade/teachability.ts — the second meter (Law 5, ADR-11), v3: recalibrated
 *  to TRACK the judge. V0.0.1's meter spread but over-credited (it said 8–9
 *  where the judge said 4–6) because it rewarded structural PRESENCE — a kernel
 *  exists, a transition names a neighbor. v3 credits the specific things the
 *  judge actually rewards and docks their absence:
 *   sameness    — unique-shingle ratio (templating shows here)
 *   specificity — kernel DEPTH (def + ≥2 misconceptions + worked example +
 *                 source text), real authored items, a functional grading scheme
 *   arc         — operationalized outcomes (every outcome timed to a phase),
 *                 retrieval practice, neighbor-aware narrative, lens activities
 *  The drift gate (Crucible) keeps this honest against the live judge. */
import type { Course } from '../schema/courseObject.ts';
import { render } from '../render/index.ts';
import { LENSES } from '../render/templates/lenses.ts';
import { weightScheme } from '../render/weights.ts';
import type { RenderBlock } from '../render/types.ts';
import { sentenceOpeners, shingles, clamp } from '../util.ts';

export interface TeachabilityReport {
  score10: number;
  dimensions: { sameness: number; specificity: number; arc: number };
}

function collectText(b: RenderBlock, out: string[]): void {
  if (b.text) out.push(b.text);
  if (b.heading) out.push(b.heading);
  b.children?.forEach((c) => collectText(c, out));
}

export function gradeTeachability(course: Course): TeachabilityReport {
  const rc = render(course);
  const allText: string[] = [];
  for (const a of rc.artifacts) for (const b of a.blocks) collectText(b, allText);
  const corpus = allText.join('\n');

  // ── sameness: fraction of 8-word shingles that are unique ──
  const sh = shingles(corpus);
  const uniqueness = sh.length ? new Set(sh).size / sh.length : 1;
  const sameness = clamp(Math.round(uniqueness * 10), 1, 10);

  // ── specificity: kernel DEPTH (not mere presence) + real items + grading ──
  const concepts = course.graph.concepts;
  let depth = 0;
  for (const c of concepts) {
    const k = course.overlays.kernels[c.id];
    if (!k) continue;
    let r = 0.25; // a bare definition is the floor, not most of the score
    r += Math.min(k.misconceptions.length, 2) * 0.2; // up to +0.4 for real misconceptions
    r += k.workedExample ? 0.25 : 0;
    r += k.excerpt && (k.excerpt.text || k.excerpt.locator) ? 0.1 : 0;
    depth += Math.min(1, r);
  }
  const kernelDepth = concepts.length ? depth / concepts.length : 0;
  // real authored items (Pass C) — the judge's worst artifact when absent
  const sessionsWithItems = Object.values(course.overlays.items ?? {}).filter((items) => items.some((it) => it.status === 'active')).length;
  const itemCoverage = course.graph.sessions.length ? sessionsWithItems / course.graph.sessions.length : 0;
  // a functional grading scheme (stated or suggested both count; "per instructor" does not)
  const gradingFunctional = Object.keys(weightScheme(course).byId).length > 0 ? 1 : 0;
  const specificity = clamp(Math.round((kernelDepth * 0.55 + itemCoverage * 0.3 + gradingFunctional * 0.15) * 10), 1, 10);

  // ── arc: operationalized outcomes + retrieval practice + narrative ──
  const ordered = [...course.graph.sessions].sort((a, b) => a.index - b.index);
  let neighborAware = 0;
  let outcomesOperationalized = 0;
  let guidesWithRetrieval = 0;
  const openerTexts: string[] = [];
  for (const art of rc.artifacts) {
    if (art.kind === 'lessonPlans') {
      const session = ordered.find((s) => s.id === art.scope);
      const transition = art.blocks.find((b) => b.kind === 'transition-notes');
      if (session && transition?.text) {
        const prev = ordered.find((x) => x.index === session.index - 1);
        const next = ordered.find((x) => x.index === session.index + 1);
        if ((prev && transition.text.includes(prev.id)) || (next && transition.text.includes(next.id))) neighborAware++;
      }
      // every outcome of the session referenced somewhere in the arc rows
      const arc = art.blocks.find((b) => b.kind === 'arc');
      const sessionOutcomes = session ? course.graph.outcomes.filter((o) => o.sessionId === session.id) : [];
      if (arc?.rows && sessionOutcomes.length) {
        const arcText = arc.rows.flat().join(' ');
        if (sessionOutcomes.every((o) => arcText.includes(o.id))) outcomesOperationalized++;
      }
      const opener = art.blocks.find((b) => b.kind === 'opener');
      if (opener?.text) openerTexts.push(...sentenceOpeners(opener.text, 4));
    }
    if (art.kind === 'studyGuides' && art.blocks.some((b) => b.kind === 'retrieval-practice')) guidesWithRetrieval++;
  }
  const n = ordered.length || 1;
  const neighborScore = neighborAware / n;
  const operationalScore = outcomesOperationalized / n;
  const retrievalScore = guidesWithRetrieval / n;
  const openerUnique = openerTexts.length ? new Set(openerTexts).size / openerTexts.length : 0.5;
  const lensSpecific = LENSES[course.graph.discipline].arc ? 1 : 0.4;
  // narrative connecting EMPTY sessions is scaffolding — content still gates it
  const kernelCoverage = concepts.length ? Object.keys(course.overlays.kernels).length / concepts.length : 0;
  const contentFactor = 0.4 + 0.6 * Math.min(1, kernelCoverage * 1.5);
  const arcRaw = operationalScore * 0.3 + retrievalScore * 0.25 + neighborScore * 0.2 + openerUnique * 0.1 + lensSpecific * 0.15;
  const arc = clamp(Math.round(arcRaw * contentFactor * 10), 1, 10);

  // composite — specificity weighted highest (content is what the judge rewards)
  const score10 = clamp(Math.round(sameness * 0.25 + specificity * 0.45 + arc * 0.3), 1, 10);
  return { score10, dimensions: { sameness, specificity, arc } };
}
