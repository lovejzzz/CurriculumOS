/** grade/structural.ts — the structural grader (ported in spirit from
 *  deepQualityGrader). Reopens the RENDERED artifacts (trap #8: scan the bytes,
 *  not the data) and checks reconciliation, coverage, placeholder leakage,
 *  shingle repetition, verbatim survival, weight integrity. Findings are
 *  checkable (each quotes its evidence). Deterministic — gates on this, never a
 *  raw model verdict (ADR-11). */
import type { Course, Finding } from '../schema/courseObject.ts';
import { render } from '../render/index.ts';
import type { RenderBlock, RenderedArtifact } from '../render/types.ts';
import { shingles } from '../util.ts';

export const GRADER_VERSION = 'cos-structural-1';

const PLACEHOLDERS = [/\bTBD\b/i, /\bTODO\b/i, /\bLorem\b/i, /\$\{/, /\bplaceholder\b/i, /\[\s*\]/];

function blockText(b: RenderBlock): string {
  const parts: string[] = [];
  if (b.heading) parts.push(b.heading);
  if (b.text) parts.push(b.text);
  if (b.rows) parts.push(b.rows.map((r) => r.join(' ')).join('\n'));
  if (b.meta) {
    for (const v of Object.values(b.meta)) if (typeof v === 'string') parts.push(v);
  }
  b.children?.forEach((c) => parts.push(blockText(c)));
  return parts.join('\n');
}

function artifactText(a: RenderedArtifact): string {
  return [a.title, ...a.blocks.map(blockText)].join('\n');
}

let fid = 0;
function finding(severity: Finding['severity'], dimension: string, detail: string, evidence: string, extra: Partial<Finding> = {}): Finding {
  fid += 1;
  return { id: `F${fid}`, severity, dimension, detail, evidence, ...extra };
}

export interface StructuralReport {
  score: number;
  letter: 'A' | 'B' | 'C' | 'D' | 'F';
  findings: Finding[];
}

export function gradeStructural(course: Course): StructuralReport {
  fid = 0;
  const findings: Finding[] = [];
  const g = course.graph;
  const rc = render(course);

  // ── Reconciliation gate (G3): every graph assessment has its downstream artifacts ──
  for (const a of g.assessments) {
    const needsBriefRubric = a.kind === 'graded-artifact' || a.kind === 'project' || a.kind === 'oral';
    if (needsBriefRubric) {
      if (!rc.byKey[`assignments:${a.id}`]) findings.push(finding('P0', 'reconciliation', `assessment ${a.id} has no brief`, a.id, { entityId: a.id }));
      if (!rc.byKey[`rubrics:${a.id}`]) findings.push(finding('P0', 'reconciliation', `assessment ${a.id} has no rubric`, a.id, { entityId: a.id }));
    }
    if (a.kind === 'exam' && !rc.byKey[`quizBank:${a.id}`]) {
      findings.push(finding('P0', 'reconciliation', `exam ${a.id} has no exam doc`, a.id, { entityId: a.id }));
    }
  }

  // ── Coverage gate (G2): kernel coverage; warn <60% relative to linkable concepts ──
  const linkable = g.concepts.filter((c) => c.genomeRef !== null).length || g.concepts.length;
  const withKernel = g.concepts.filter((c) => course.overlays.kernels[c.id]).length;
  const coverage = g.concepts.length ? withKernel / Math.max(1, linkable) : 1;
  if (g.concepts.length > 0 && coverage < 0.6) {
    findings.push(finding('P1', 'coverage', `kernel coverage ${(coverage * 100).toFixed(0)}% below 60%`, `${withKernel}/${linkable} concepts`));
  }

  // ── Weight integrity (A4): graded weights should sum to 100 ──
  const total = g.assessments.reduce((s, a) => s + (a.weightPct ?? 0), 0);
  if (g.assessments.some((a) => a.weightPct !== null) && Math.abs(total - 100) > 0.5) {
    findings.push(finding('P1', 'weights', `graded weights sum to ${total.toFixed(1)}%, not 100%`, `${total.toFixed(1)}%`));
  }

  // ── Verbatim survival (V1): instructor-named reading titles appear untransformed ──
  for (const r of g.readings.filter((x) => x.provenance === 'instructor-named')) {
    const inSyllabus = rc.byKey['syllabus:course'] ? artifactText(rc.byKey['syllabus:course']!).includes(r.title) : false;
    if (!inSyllabus && (r.kind === 'book' || r.kind === 'chapter')) {
      findings.push(finding('P1', 'verbatim', `instructor reading ${r.id} title missing from syllabus`, r.title, { entityId: r.id }));
    }
  }

  // ── Export audit (G4): placeholder leakage + shingle repetition in RENDERED text ──
  for (const a of rc.artifacts) {
    const text = artifactText(a);
    for (const re of PLACEHOLDERS) {
      const m = text.match(re);
      if (m) {
        findings.push(finding('P0', 'placeholder', `placeholder in ${a.kind}:${a.scope}`, m[0]));
        break;
      }
    }
  }
  // shingle repetition — 12 per SECTION, i.e. within a single rendered artifact
  // (040/G4; rubrics are pure structure so identical descriptors are correct, not a defect)
  for (const a of rc.artifacts) {
    if (a.kind === 'rubrics') continue;
    const counts = new Map<string, number>();
    for (const sh of shingles(artifactText(a))) counts.set(sh, (counts.get(sh) ?? 0) + 1);
    for (const [sh, count] of counts) {
      if (count >= 12) {
        findings.push(finding('P1', 'texture', `phrase repeated ${count}× in ${a.kind}:${a.scope} (limit 12)`, sh));
        break; // one texture finding per artifact is enough signal
      }
    }
  }

  // ── Outcome alignment: assessments should have outcomes to assess against ──
  for (const s of g.sessions) {
    if (s.outcomeIds.length === 0) {
      findings.push(finding('P2', 'alignment', `session ${s.id} has no outcomes`, s.id, { entityId: s.id }));
    }
  }

  // ── Score: start at 100, subtract by severity (calibrated weights) ──
  let score = 100;
  for (const f of findings) score -= f.severity === 'P0' ? 12 : f.severity === 'P1' ? 5 : 1;
  score = Math.max(0, Math.min(100, score));
  const letter = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F';

  return { score, letter, findings };
}
