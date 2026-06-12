/** grade/teachability.ts — the second meter (Law 5, ADR-11), v2: calibrated to
 *  SPREAD. A meter that grades every course 7/10 measures nothing (the V0.0.1
 *  audit's headline finding). v2's dimensions are chosen so a deliberately
 *  thin course (no kernels, generic arcs) lands ≤4 and a rich one ≥7 — the
 *  calibration tests in test/calibration.test.ts pin both ends, and the
 *  Crucible judge re-calibrates the weights on schedule (never gating raw).
 *
 *  sameness    — unique-shingle ratio over rendered text (templating shows up here)
 *  specificity — kernel richness: definitions, misconception plurality, worked
 *                examples, romanization where scripts demand it, item variety
 *  arc         — narrative: neighbor-aware transitions, opener variety,
 *                discipline-specific (lens) activities vs generic frames
 */
import type { Course } from '../schema/courseObject.ts';
import { render } from '../render/index.ts';
import { LENSES } from '../render/templates/lenses.ts';
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
  const unique = new Set(sh).size;
  const uniqueness = sh.length ? unique / sh.length : 1;
  const sameness = clamp(Math.round(uniqueness * 10), 1, 10);

  // ── specificity: kernel richness per concept ──
  const concepts = course.graph.concepts;
  let richness = 0;
  for (const c of concepts) {
    const k = course.overlays.kernels[c.id];
    if (!k) continue;
    let r = 0.35; // a definition exists
    r += Math.min(k.misconceptions.length, 2) * 0.2; // misconception plurality (≤0.4)
    r += k.workedExample ? 0.2 : 0;
    r += k.romanization && Object.keys(k.romanization).length ? 0.05 : 0;
    richness += Math.min(1, r);
  }
  const kernelScore = concepts.length ? richness / concepts.length : 0;
  // item variety: distinct MC stems across the quiz bank (templating in items)
  const stems = new Set<string>();
  let mcCount = 0;
  for (const a of rc.artifacts) {
    if (a.kind !== 'quizBank') continue;
    for (const b of a.blocks) {
      if (b.kind === 'mc' && b.text) {
        mcCount++;
        stems.add(b.text.replace(/[A-Z][a-zA-Z’' -]+/g, '%').slice(0, 40)); // stem shape, concept-masked
      }
    }
  }
  const stemVariety = mcCount ? stems.size / Math.min(mcCount, 6) : 0;
  const specificity = clamp(Math.round((kernelScore * 0.8 + Math.min(1, stemVariety) * 0.2) * 10), 1, 10);

  // ── arc: narrative through-line ──
  const ordered = [...course.graph.sessions].sort((a, b) => a.index - b.index);
  // neighbor-aware transitions: does each plan's transition text name a neighbor session?
  let neighborAware = 0;
  let openerTexts: string[] = [];
  for (const art of rc.artifacts) {
    if (art.kind !== 'lessonPlans') continue;
    const session = ordered.find((s) => s.id === art.scope);
    const transition = art.blocks.find((b) => b.kind === 'transition-notes');
    if (session && transition?.text) {
      const prev = ordered.find((x) => x.index === session.index - 1);
      const next = ordered.find((x) => x.index === session.index + 1);
      if ((prev && transition.text.includes(prev.id)) || (next && transition.text.includes(next.id))) neighborAware++;
    }
    const opener = art.blocks.find((b) => b.kind === 'opener');
    if (opener?.text) openerTexts.push(...sentenceOpeners(opener.text, 4));
  }
  const neighborScore = ordered.length ? neighborAware / ordered.length : 0;
  const openerUnique = openerTexts.length ? new Set(openerTexts).size / openerTexts.length : 0.5;
  const lensSpecific = LENSES[course.graph.discipline].arc ? 1 : 0.4; // generic frames cap the arc
  // narrative connecting EMPTY sessions is scaffolding, not arc — content gates it
  const kernelCoverage = concepts.length ? Object.keys(course.overlays.kernels).length / concepts.length : 0;
  const contentFactor = 0.5 + 0.5 * Math.min(1, kernelCoverage * 1.5);
  const arc = clamp(Math.round((neighborScore * 0.45 + openerUnique * 0.25 + lensSpecific * 0.3) * contentFactor * 10), 1, 10);

  // composite — weights pinned by the calibration suite (thin ≤4, rich ≥7)
  const score10 = clamp(Math.round(sameness * 0.3 + specificity * 0.4 + arc * 0.3), 1, 10);
  return { score10, dimensions: { sameness, specificity, arc } };
}
