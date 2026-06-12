/** v0.1 bar tests (written FIRST, per the work order — Law 8).
 *  The bar: a build's zip contains real Office files (DOCX/PPTX/XLSX) with the
 *  universal fonts, zero placeholder leakage flagged by the export audit
 *  re-reading the RENDERED BYTES (trap #8), manifest + quality report always
 *  present, kit-spec folder layout and zero-padded filenames. */
import { describe, expect, it } from 'vitest';
import { buildCourse, buildPackage, auditPackage, readZipStored, FakeModelPort, FixedClock, SeededRand } from '../src/index.ts';
import { ECON_BRIEF, MANDARIN_BRIEF } from './fixtures.ts';
import type { Course } from '../src/index.ts';

function ports() {
  return { model: new FakeModelPort(), clock: new FixedClock(), rand: new SeededRand() };
}

async function econPackage(): Promise<{ course: Course; bytes: Uint8Array; names: string[] }> {
  const { course } = await buildCourse(ECON_BRIEF, ports(), { voice: false });
  const bytes = buildPackage(course);
  const names = readZipStored(bytes).map((e) => e.path);
  return { course, bytes, names };
}

describe('v0.1 bar — teacher-ready exports', () => {
  it('the zip ALWAYS contains PACKAGE_MANIFEST.json + QUALITY_REPORT.md', async () => {
    const { names } = await econPackage();
    expect(names.some((n) => n.endsWith('PACKAGE_MANIFEST.json'))).toBe(true);
    expect(names.some((n) => n.endsWith('QUALITY_REPORT.md'))).toBe(true);
  });

  it('artifacts export as real Office files in the kit folder layout', async () => {
    const { names } = await econPackage();
    expect(names.some((n) => /Syllabus\/.*\.docx$/.test(n))).toBe(true);
    expect(names.some((n) => /Lesson Plans\/Lesson 0\d - .*\.docx$/.test(n))).toBe(true); // zero-padded
    expect(names.some((n) => /Slide Decks\/.*\.pptx$/.test(n))).toBe(true);
    expect(names.some((n) => /Course Map\/.*\.xlsx$/.test(n))).toBe(true);
    expect(names.some((n) => /Rubrics\/.*\.docx$/.test(n))).toBe(true);
    expect(names.some((n) => /Quiz & Exam Bank\/.*\.docx$/.test(n))).toBe(true);
    // bulk files ride alongside per-session files (kit: "bulk file + per-session files")
    expect(names.some((n) => /Lesson Plans\/.*All Lesson Plans\.docx$/.test(n))).toBe(true);
  });

  it('docx parts carry the universal fonts (Georgia body, Trebuchet headings)', async () => {
    const { bytes } = await econPackage();
    const entries = readZipStored(bytes);
    const docx = entries.find((e) => e.path.endsWith('.docx'))!;
    const inner = readZipStored(docx.data);
    const styles = new TextDecoder().decode(inner.find((e) => e.path === 'word/styles.xml')!.data);
    expect(styles).toContain('Georgia');
    expect(styles).toContain('Trebuchet MS');
  });

  it('pptx decks contain title, body, speaker notes, and ≥2 drawn native visuals', async () => {
    const { bytes } = await econPackage();
    const entries = readZipStored(bytes);
    const pptx = entries.find((e) => e.path.endsWith('.pptx'))!;
    const inner = readZipStored(pptx.data);
    const slideParts = inner.filter((e) => /^ppt\/slides\/slide\d+\.xml$/.test(e.path));
    expect(slideParts.length).toBeGreaterThanOrEqual(8);
    const notesParts = inner.filter((e) => /^ppt\/notesSlides\//.test(e.path));
    expect(notesParts.length).toBeGreaterThanOrEqual(slideParts.length - 1);
    // drawn visuals: shape geometry beyond placeholders (ellipse/roundRect/line)
    const allSlides = slideParts.map((e) => new TextDecoder().decode(e.data)).join('');
    const drawn = (allSlides.match(/prstGeom prst="(ellipse|roundRect|line|rect)"/g) ?? []).length;
    expect(drawn).toBeGreaterThanOrEqual(2);
  });

  it('the export audit re-reads the bytes and finds no placeholder leakage or font drift', async () => {
    const { bytes } = await econPackage();
    const findings = auditPackage(bytes);
    const p0s = findings.filter((f) => f.severity === 'P0');
    expect(p0s, JSON.stringify(p0s, null, 1)).toHaveLength(0);
  });

  it('the export audit catches a planted placeholder in rendered bytes (armed, not decorative)', async () => {
    const { course } = await buildCourse(ECON_BRIEF, ports(), { voice: false });
    course.graph.sessions[0]!.title = 'TBD session about TODO things';
    const findings = auditPackage(buildPackage(course));
    expect(findings.some((f) => f.dimension === 'placeholder')).toBe(true);
  });

  it('mandarin study guides pair hanzi terms with romanization (ledger: no-study-guide-pairs-hanzi-with-tone-marked-pinyin)', async () => {
    const { course } = await buildCourse(MANDARIN_BRIEF, ports(), { voice: false });
    // give S1's concept a hanzi term kernel (the real model authors these; deterministic here)
    const s1 = course.graph.sessions.find((s) => s.id === 'S1')!;
    course.overlays.kernels[s1.conceptIds[0]!] = {
      ...course.overlays.kernels[s1.conceptIds[0]!]!,
      romanization: { 你好: 'nǐ hǎo' },
    };
    const bytes = buildPackage(course);
    const entries = readZipStored(bytes);
    const guide = entries.find((e) => /Study Guides\/Lesson 01 .*\.docx$/.test(e.path))!;
    const doc = new TextDecoder().decode(readZipStored(guide.data).find((e) => e.path === 'word/document.xml')!.data);
    expect(doc).toContain('你好');
    expect(doc).toContain('nǐ hǎo');
  });
});
