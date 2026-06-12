/** extract.ts — materials-in text extraction (the API edge; impure on purpose,
 *  so it lives outside core). Supported: .txt/.md (utf8), .docx (unzip +
 *  inflate + XML strip), .pdf (text-object scan — simple text PDFs). Anything
 *  unextractable degrades LOUDLY: the file is recorded in brief.files with an
 *  empty extractedText and a named note (Law 6), never silently dropped. */
import { inflateRawSync, inflateSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import type { BriefFile } from '@curriculumos/core';

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25MB per file
export const MAX_BRIEF_BYTES = 1024 * 1024; // 1MB brief text

/** Minimal zip reader for REAL docx files (deflate or stored entries). */
function readZipAny(bytes: Buffer): { path: string; data: Buffer }[] {
  const out: { path: string; data: Buffer }[] = [];
  let off = 0;
  while (off + 30 <= bytes.length) {
    const sig = bytes.readUInt32LE(off);
    if (sig !== 0x04034b50) break;
    const flags = bytes.readUInt16LE(off + 6);
    const method = bytes.readUInt16LE(off + 8);
    let compSize = bytes.readUInt32LE(off + 18);
    const nameLen = bytes.readUInt16LE(off + 26);
    const extraLen = bytes.readUInt16LE(off + 28);
    const name = bytes.subarray(off + 30, off + 30 + nameLen).toString('utf8');
    const dataStart = off + 30 + nameLen + extraLen;
    // data-descriptor zips (bit 3) don't carry sizes in the local header; Word
    // doesn't produce them for document parts, so treat as unextractable
    if (flags & 0x8) throw new Error('docx uses streaming data descriptors (unsupported)');
    const raw = bytes.subarray(dataStart, dataStart + compSize);
    const data = method === 8 ? inflateRawSync(raw) : method === 0 ? Buffer.from(raw) : null;
    if (data === null) throw new Error(`unsupported zip method ${method}`);
    out.push({ path: name, data });
    off = dataStart + compSize;
  }
  return out;
}

function stripXml(xml: string): string {
  return xml
    .replace(/<w:p[ >]/g, '\n<w:p ') // paragraph boundaries become line breaks
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

function extractDocx(bytes: Buffer): string {
  const entries = readZipAny(bytes);
  const doc = entries.find((e) => e.path === 'word/document.xml');
  if (!doc) throw new Error('word/document.xml not found');
  return stripXml(doc.data.toString('utf8'));
}

/** Simple-PDF text extraction: collect string literals inside BT…ET text
 *  blocks (Tj/TJ operators), inflating Flate streams first. Handles the plain
 *  text PDFs syllabi usually are; scanned/encoded PDFs degrade loudly. */
function extractPdf(bytes: Buffer): string {
  const chunks: string[] = [];
  const raw = bytes.toString('latin1');
  // inflate Flate streams and scan those too
  const streams: string[] = [raw];
  const streamRe = /stream\r?\n/g;
  let m: RegExpExecArray | null;
  while ((m = streamRe.exec(raw))) {
    const start = m.index + m[0].length;
    const end = raw.indexOf('endstream', start);
    if (end < 0) continue;
    const body = bytes.subarray(start, end);
    try {
      streams.push(inflateSync(body).toString('latin1'));
    } catch {
      try {
        streams.push(inflateRawSync(body.subarray(2)).toString('latin1'));
      } catch {
        /* not Flate or encrypted — skip */
      }
    }
  }
  for (const s of streams) {
    const textBlocks = s.match(/BT[\s\S]*?ET/g) ?? [];
    for (const block of textBlocks) {
      for (const lit of block.match(/\(((?:\\.|[^\\)])*)\)\s*Tj/g) ?? []) {
        chunks.push(lit.replace(/\)\s*Tj$/, '').slice(1).replace(/\\([()\\])/g, '$1'));
      }
      for (const arr of block.match(/\[((?:\\.|[^\]])*)\]\s*TJ/g) ?? []) {
        for (const lit of arr.match(/\(((?:\\.|[^\\)])*)\)/g) ?? []) {
          chunks.push(lit.slice(1, -1).replace(/\\([()\\])/g, '$1'));
        }
      }
    }
  }
  return chunks.join(' ').replace(/\s+/g, ' ').trim();
}

export interface MaterialIn {
  name: string;
  contentBase64: string;
}

/** Extract many; returns files + named notes for any that degraded. Failure is
 *  a named degradation in the result (Law 6) — files are never silently dropped. */
export function extractMaterials(materials: MaterialIn[]): { files: BriefFile[]; notes: string[] } {
  const files: BriefFile[] = [];
  const notes: string[] = [];
  for (const m of materials) {
    const bytes = Buffer.from(m.contentBase64, 'base64');
    const sha256 = createHash('sha256').update(bytes).digest('hex');
    const ext = (m.name.split('.').pop() ?? '').toLowerCase();
    try {
      if (bytes.length > MAX_UPLOAD_BYTES) throw new Error(`exceeds ${MAX_UPLOAD_BYTES / 1024 / 1024}MB cap`);
      let text = '';
      if (ext === 'txt' || ext === 'md') text = bytes.toString('utf8');
      else if (ext === 'docx') text = extractDocx(bytes);
      else if (ext === 'pdf') text = extractPdf(bytes);
      else throw new Error(`unsupported type .${ext} (use txt, md, docx, pdf)`);
      if (!text.trim()) throw new Error('no extractable text (scanned or empty document)');
      files.push({ name: m.name, sha256, extractedText: text });
    } catch (err) {
      files.push({ name: m.name, sha256, extractedText: '' });
      notes.push(`material "${m.name}" not extracted: ${err instanceof Error ? err.message : 'unknown'}`);
    }
  }
  return { files, notes };
}
