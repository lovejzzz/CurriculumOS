/** v0.1 bar — materials-in. A syllabus document dropped at the Door shows
 *  correct "heard so far" chips and survives into brief.files with a hash. */
import { describe, expect, it } from 'vitest';
import { extractMaterials } from '../src/extract.ts';
import { buildDocx } from '@curriculumos/core';
import type { RenderedArtifact } from '@curriculumos/core';

const SYLLABUS_TEXT =
  'Introduction to Astronomy, a 12-lesson introductory college course with evening observing sessions and a midterm. ' +
  'Lessons cover: diurnal motion; the celestial sphere; the seasons; phases of the Moon; Kepler’s third law; the electromagnetic spectrum; ' +
  'spectral lines; telescopes; stellar parallax; apparent magnitude; the solar nebula hypothesis; and Hubble’s law with a course review.';

function syllabusDocxBase64(): string {
  // dogfood: the same DOCX builder instructors will receive
  const artifact: RenderedArtifact = {
    kind: 'syllabus',
    scope: 'course',
    title: 'Old Syllabus',
    blocks: [{ kind: 'para', text: SYLLABUS_TEXT }],
    surfaces: [],
  };
  return Buffer.from(buildDocx([artifact])).toString('base64');
}

describe('v0.1 bar — materials-in', () => {
  it('extracts text from a dropped .docx, hashes it, and the intake hears it', () => {
    const { files, notes } = extractMaterials([{ name: 'old-syllabus.docx', contentBase64: syllabusDocxBase64() }]);
    expect(notes).toHaveLength(0);
    expect(files).toHaveLength(1);
    expect(files[0]!.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(files[0]!.extractedText).toContain('12-lesson');
    expect(files[0]!.extractedText).toContain('midterm');
  });

  it('extracts plain text and markdown', () => {
    const { files } = extractMaterials([
      { name: 'notes.txt', contentBase64: Buffer.from('weekly quizzes and a final exam').toString('base64') },
      { name: 'plan.md', contentBase64: Buffer.from('# 14 weeks\nwe read Freakonomics ch. 1-4').toString('base64') },
    ]);
    expect(files[0]!.extractedText).toContain('weekly quizzes');
    expect(files[1]!.extractedText).toContain('Freakonomics');
  });

  it('extracts a simple text PDF', () => {
    // a minimal hand-built single-page PDF with one text object
    const pdf = [
      '%PDF-1.4',
      '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
      '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
      '3 0 obj << /Type /Page /Parent 2 0 R /Contents 4 0 R /MediaBox [0 0 612 792] >> endobj',
      '4 0 obj << /Length 90 >> stream',
      'BT /F1 12 Tf 72 720 Td (Physical Geology, a 14-lesson course with weekly labs.) Tj ET',
      'endstream endobj',
      'trailer << /Root 1 0 R >>',
      '%%EOF',
    ].join('\n');
    const { files, notes } = extractMaterials([{ name: 'syllabus.pdf', contentBase64: Buffer.from(pdf).toString('base64') }]);
    expect(notes).toHaveLength(0);
    expect(files[0]!.extractedText).toContain('14-lesson course with weekly labs');
  });

  it('degrades LOUDLY on an unsupported type — file recorded, note named', () => {
    const { files, notes } = extractMaterials([{ name: 'photo.png', contentBase64: Buffer.from('xx').toString('base64') }]);
    expect(files).toHaveLength(1); // never silently dropped
    expect(files[0]!.extractedText).toBe('');
    expect(notes[0]).toContain('photo.png');
    expect(notes[0]).toContain('unsupported');
  });
});
