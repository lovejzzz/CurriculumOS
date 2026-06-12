/** render/export/package.ts — assemble the downloadable package (040 §The
 *  package). The zip ALWAYS contains PACKAGE_MANIFEST.json + QUALITY_REPORT.md
 *  (same grader as CI). Artifacts export as real Office files — DOCX (bulk +
 *  per-session), PPTX decks with drawn visuals, the XLSX course map — in the
 *  kit's folder layout with zero-padded filenames. One builder per format; this
 *  façade only delegates (trap #7). */
import type { Course } from '../../schema/courseObject.ts';
import { render } from '../index.ts';
import type { ArtifactKind, RenderedArtifact } from '../types.ts';
import { zeroPad } from '../../util.ts';
import { artifactToMarkdown } from './text.ts';
import { buildZip, textEntry, bytesEntry, type ZipEntry } from './zip.ts';
import { buildDocx } from './docx.ts';
import { buildPptx, deckVisualStats } from './pptx.ts';
import { buildXlsx } from './xlsx.ts';
import { gradeStructural } from '../../grade/structural.ts';

const FOLDER: Record<ArtifactKind, string> = {
  courseMap: 'Course Map',
  syllabus: 'Syllabus',
  lessonPlans: 'Lesson Plans',
  slideDecks: 'Slide Decks',
  assignments: 'Assignment Briefs',
  rubrics: 'Rubrics',
  discussions: 'Discussion Prompts',
  quizBank: 'Quiz & Exam Bank',
  studyGuides: 'Study Guides',
  courseFaq: 'Course FAQ',
};

const ARTIFACT_LABEL: Record<ArtifactKind, string> = {
  courseMap: 'Course Map',
  syllabus: 'Syllabus',
  lessonPlans: 'Lesson Plan',
  slideDecks: 'Slides',
  assignments: 'Brief',
  rubrics: 'Rubric',
  discussions: 'Discussion',
  quizBank: 'Quiz',
  studyGuides: 'Study Guide',
  courseFaq: 'FAQ',
};

/** Kinds that ship a bulk file alongside per-scope files (kit layout). */
const BULK_LABEL: Partial<Record<ArtifactKind, string>> = {
  lessonPlans: 'All Lesson Plans',
  discussions: 'All Discussion Prompts',
  studyGuides: 'All Study Guides',
  quizBank: 'All Quizzes & Exams',
  assignments: 'All Assignment Briefs',
  rubrics: 'All Rubrics',
};

function safeName(s: string): string {
  return s
    .replace(/[‒-―−]/g, '-') // normalize unicode dashes → ASCII hyphen
    .replace(/…/g, '') // truncation ellipsis breaks some extractors' filename handling
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80)
    .trim();
}

function baseName(course: Course, a: RenderedArtifact): string {
  const session = course.graph.sessions.find((s) => s.id === a.scope);
  if (session) return `Lesson ${zeroPad(session.index)} - ${safeName(session.title)} - ${ARTIFACT_LABEL[a.kind]}`;
  return safeName(a.title);
}

export interface PackageManifest {
  course: { id: string; title: string; discipline: string; term?: string };
  counts: Record<string, number>;
  provenanceSummary: Record<string, number>;
  readings: { id: string; title: string; provenance: string }[];
  quality: { structural: number; letter: string; teachability: number | null };
  deckAudit: ReturnType<typeof deckVisualStats>;
  builtFrom: { schemaVersion: number; graderVersion: string };
}

function manifest(course: Course, decks: RenderedArtifact[]): PackageManifest {
  const provSummary: Record<string, number> = {};
  for (const mark of Object.values(course.receipts.provenance)) {
    provSummary[mark.source] = (provSummary[mark.source] ?? 0) + 1;
  }
  return {
    course: {
      id: course.id,
      title: course.graph.courseTitle,
      discipline: course.graph.discipline,
      ...(course.graph.term ? { term: course.graph.term } : {}),
    },
    counts: {
      sessions: course.graph.sessions.length,
      concepts: course.graph.concepts.length,
      outcomes: course.graph.outcomes.length,
      assessments: course.graph.assessments.length,
      readings: course.graph.readings.length,
      bridges: course.graph.bridges.length,
      kernels: Object.keys(course.overlays.kernels).length,
    },
    provenanceSummary: provSummary,
    readings: course.graph.readings.map((r) => ({ id: r.id, title: r.title, provenance: r.provenance })),
    quality: {
      structural: course.receipts.quality?.structural.score ?? 0,
      letter: course.receipts.quality?.structural.letter ?? 'F',
      teachability: course.receipts.quality?.teachability.score10 ?? null,
    },
    deckAudit: deckVisualStats(decks),
    builtFrom: { schemaVersion: course.schemaVersion, graderVersion: 'cos-structural-1' },
  };
}

function qualityReport(course: Course): string {
  const s = gradeStructural(course);
  const t = course.receipts.quality?.teachability;
  const lines: string[] = [
    `# Quality Report — ${course.graph.courseTitle}`,
    '',
    `**Structural quality:** ${s.score}/100 (${s.letter})`,
    `**Teachability:** ${t ? `${t.score10}/10 (sameness ${t.dimensions.sameness}, specificity ${t.dimensions.specificity}, arc ${t.dimensions.arc})` : 'not graded'}`,
    '',
    `## Findings (${s.findings.length})`,
    '',
  ];
  if (s.findings.length === 0) lines.push('_No findings._');
  for (const f of s.findings) {
    lines.push(`- **${f.severity}** [${f.dimension}] ${f.detail} — evidence: \`${f.evidence}\`${f.entityId ? ` (${f.entityId})` : ''}`);
  }
  const voiceFallbacks = Object.values(course.overlays.voice).filter((v) => v.status === 'fallback').length;
  lines.push('', `## Voice`, '', `${voiceFallbacks} surface(s) fell back to the compiled skeleton (counted, never silent).`);
  return lines.join('\n') + '\n';
}

export type PackageFormat = 'office' | 'markdown';

/** Build the package zip bytes. 'office' (default) is the teacher-ready set;
 *  'markdown' is the diff-friendly text render of the same artifacts. */
export function buildPackage(course: Course, format: PackageFormat = 'office'): Uint8Array {
  const root = safeName(course.graph.courseTitle) || 'Course';
  const rc = render(course);
  const decks = rc.artifacts.filter((a) => a.kind === 'slideDecks');
  const entries: ZipEntry[] = [];

  entries.push(textEntry(`${root}/PACKAGE_MANIFEST.json`, JSON.stringify(manifest(course, decks), null, 2)));
  entries.push(textEntry(`${root}/QUALITY_REPORT.md`, qualityReport(course)));

  if (format === 'markdown') {
    for (const a of rc.artifacts) {
      entries.push(textEntry(`${root}/${FOLDER[a.kind]}/${baseName(course, a)}.md`, artifactToMarkdown(a)));
    }
    return buildZip(entries);
  }

  // office format — per-scope files
  const byKind = new Map<ArtifactKind, RenderedArtifact[]>();
  for (const a of rc.artifacts) {
    byKind.set(a.kind, [...(byKind.get(a.kind) ?? []), a]);
  }
  for (const a of rc.artifacts) {
    const folder = FOLDER[a.kind];
    if (a.kind === 'slideDecks') {
      entries.push(bytesEntry(`${root}/${folder}/${baseName(course, a)}.pptx`, buildPptx(a)));
    } else if (a.kind === 'courseMap') {
      const rows = a.blocks.find((b) => b.rows)?.rows ?? [];
      entries.push(bytesEntry(`${root}/${folder}/${baseName(course, a)}.xlsx`, buildXlsx('Course Map', rows)));
    } else {
      entries.push(bytesEntry(`${root}/${folder}/${baseName(course, a)}.docx`, buildDocx([a])));
    }
  }
  // bulk files (kit: "per-artifact: bulk file + per-session files")
  for (const [kind, label] of Object.entries(BULK_LABEL) as [ArtifactKind, string][]) {
    const arts = byKind.get(kind);
    if (arts && arts.length > 1) {
      entries.push(bytesEntry(`${root}/${FOLDER[kind]}/${label}.docx`, buildDocx(arts)));
    }
  }

  return buildZip(entries);
}

export { manifest as packageManifest, qualityReport };
