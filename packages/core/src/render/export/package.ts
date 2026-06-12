/** render/export/package.ts — assemble the downloadable package (040 §The
 *  package). The zip ALWAYS contains PACKAGE_MANIFEST.json + QUALITY_REPORT.md
 *  (same grader as CI). Folder layout and zero-padded filenames per spec. */
import type { Course } from '../../schema/courseObject.ts';
import { render } from '../index.ts';
import type { ArtifactKind, RenderedArtifact } from '../types.ts';
import { zeroPad } from '../../util.ts';
import { artifactToMarkdown } from './text.ts';
import { buildZip, textEntry, type ZipEntry } from './zip.ts';
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

function safeName(s: string): string {
  return s
    .replace(/[‒-―−]/g, '-') // normalize unicode dashes → ASCII hyphen (universal extractors)
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
}

function fileName(course: Course, a: RenderedArtifact): string {
  const session = course.graph.sessions.find((s) => s.id === a.scope);
  if (session) {
    return `Lesson ${zeroPad(session.index)} - ${safeName(session.title)} - ${ARTIFACT_LABEL[a.kind]}.md`;
  }
  return `${safeName(a.title)}.md`;
}

export interface PackageManifest {
  course: { id: string; title: string; discipline: string; term?: string };
  counts: Record<string, number>;
  provenanceSummary: Record<string, number>;
  readings: { id: string; title: string; provenance: string }[];
  quality: { structural: number; letter: string; teachability: number | null };
  builtFrom: { schemaVersion: number; graderVersion: string };
}

function manifest(course: Course): PackageManifest {
  const provSummary: Record<string, number> = {};
  for (const mark of Object.values(course.receipts.provenance)) {
    provSummary[mark.source] = (provSummary[mark.source] ?? 0) + 1;
  }
  return {
    course: { id: course.id, title: course.graph.courseTitle, discipline: course.graph.discipline, ...(course.graph.term ? { term: course.graph.term } : {}) },
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

/** Build the package zip bytes. */
export function buildPackage(course: Course): Uint8Array {
  const root = safeName(course.graph.courseTitle) || 'Course';
  const rc = render(course);
  const entries: ZipEntry[] = [];

  entries.push(textEntry(`${root}/PACKAGE_MANIFEST.json`, JSON.stringify(manifest(course), null, 2)));
  entries.push(textEntry(`${root}/QUALITY_REPORT.md`, qualityReport(course)));

  for (const a of rc.artifacts) {
    const folder = FOLDER[a.kind];
    entries.push(textEntry(`${root}/${folder}/${fileName(course, a)}`, artifactToMarkdown(a)));
  }

  return buildZip(entries);
}

export { manifest as packageManifest, qualityReport };
