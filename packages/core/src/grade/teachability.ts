/** grade/teachability.ts — the second meter (Law 5, ADR-11). A deterministic
 *  proxy for the judge's question — "would a professor teach from this as-is?"
 *  — calibrated against the verdict ledger before it gates. Three dimensions:
 *   sameness    — slot-masked cross-document similarity (low repetition = high)
 *   specificity — kernel/subject-matter density vs generic scaffolding
 *   arc         — does each session's content vary and progress (opener variety)
 *  We gate on this code, never on a raw model verdict (flaky, paid). */
import type { Course } from '../schema/courseObject.ts';
import { render } from '../render/index.ts';
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

  // sameness: fraction of 8-word shingles that are unique (higher = less templated)
  const sh = shingles(corpus);
  const unique = new Set(sh).size;
  const uniqueness = sh.length ? unique / sh.length : 1;
  const sameness = clamp(Math.round(uniqueness * 10), 1, 10);

  // specificity: kernel coverage + worked-example presence vs concept count
  const concepts = course.graph.concepts.length || 1;
  const withKernel = course.graph.concepts.filter((c) => course.overlays.kernels[c.id]).length;
  const withExample = Object.values(course.overlays.kernels).filter((k) => (k as { workedExample?: unknown }).workedExample).length;
  const specRaw = (withKernel / concepts) * 0.7 + (withExample / concepts) * 0.3;
  const specificity = clamp(Math.round(specRaw * 10) + (withKernel > 0 ? 2 : 0), 1, 10);

  // arc: variety of session-opener openings (low repetition of opening phrases)
  const openerText: string[] = [];
  for (const art of rc.artifacts) {
    if (art.kind !== 'lessonPlans') continue;
    const opener = art.blocks.find((b) => b.kind === 'opener');
    if (opener?.text) openerText.push(...sentenceOpeners(opener.text, 4));
  }
  const openerUnique = new Set(openerText).size;
  const arcRaw = openerText.length ? openerUnique / openerText.length : 1;
  const arc = clamp(Math.round(arcRaw * 10), 1, 10);

  // overall: weighted, then clamped to the calibration band
  const score10 = clamp(Math.round(sameness * 0.4 + specificity * 0.4 + arc * 0.2), 1, 10);
  return { score10, dimensions: { sameness, specificity, arc } };
}
