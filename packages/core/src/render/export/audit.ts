/** render/export/audit.ts — the export rendered-bytes audit (contracts §G4,
 *  trap #8: Office XML re-opened and text-scanned catches what unit tests
 *  can't). Pure: package bytes in → findings out. Scans the EXTRACTED TEXT of
 *  every rendered file for placeholder leakage, encoding damage, phrase
 *  repetition, and font drift — never the data that produced them. */
import type { Finding } from '../../schema/courseObject.ts';
import { shingles } from '../../util.ts';
import { readZipStored, type ZipEntry } from './zip.ts';

const PLACEHOLDERS = [/\bTBD\b/, /\bTODO\b/i, /\bLorem\b/i, /\$\{/, /\[object Object\]/, /undefined undefined/];

/** Strip XML tags → text (the audit reads what a human would). */
function xmlToText(xml: string): string {
  return xml
    .replace(/<[^>]+>/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function officeText(entry: ZipEntry): string {
  const inner = readZipStored(entry.data);
  const textParts: string[] = [];
  for (const part of inner) {
    if (/word\/document\.xml$|ppt\/slides\/|ppt\/notesSlides\/|xl\/worksheets\//.test(part.path)) {
      textParts.push(xmlToText(new TextDecoder().decode(part.data)));
    }
  }
  return textParts.join('\n');
}

let auditId = 0;
function finding(severity: Finding['severity'], dimension: string, detail: string, evidence: string): Finding {
  auditId += 1;
  return { id: `X${auditId}`, severity, dimension, detail, evidence };
}

/** Audit a package zip's rendered bytes. */
export function auditPackage(packageBytes: Uint8Array): Finding[] {
  auditId = 0;
  const findings: Finding[] = [];
  const entries = readZipStored(packageBytes);

  // the contract: manifest + quality report ALWAYS present
  if (!entries.some((e) => e.path.endsWith('PACKAGE_MANIFEST.json')))
    findings.push(finding('P0', 'package', 'PACKAGE_MANIFEST.json missing from package', 'zip listing'));
  if (!entries.some((e) => e.path.endsWith('QUALITY_REPORT.md')))
    findings.push(finding('P0', 'package', 'QUALITY_REPORT.md missing from package', 'zip listing'));

  for (const entry of entries) {
    const isOffice = /\.(docx|pptx|xlsx)$/.test(entry.path);
    const isText = /\.(md|json)$/.test(entry.path);
    if (!isOffice && !isText) continue;

    let text: string;
    try {
      text = isOffice ? officeText(entry) : new TextDecoder().decode(entry.data);
    } catch (e) {
      findings.push(finding('P0', 'encoding', `unreadable rendered file ${entry.path}`, e instanceof Error ? e.message : 'parse failure'));
      continue;
    }

    // placeholder leakage (G4)
    for (const re of PLACEHOLDERS) {
      const m = text.match(re);
      if (m) {
        findings.push(finding('P0', 'placeholder', `placeholder in rendered bytes: ${entry.path}`, m[0]));
        break;
      }
    }

    // encoding damage: replacement chars
    if (text.includes('�')) {
      findings.push(finding('P0', 'encoding', `encoding damage (U+FFFD) in ${entry.path}`, '�'));
    }

    // phrase repetition per rendered file (rubrics are pure structure — exempt)
    if (isOffice && !/Rubric/i.test(entry.path)) {
      const counts = new Map<string, number>();
      for (const sh of shingles(text)) counts.set(sh, (counts.get(sh) ?? 0) + 1);
      for (const [sh, count] of counts) {
        if (count >= 12) {
          findings.push(finding('P1', 'texture', `phrase repeated ${count}× in ${entry.path} (limit 12)`, sh));
          break;
        }
      }
    }

    // font drift: docx styles must carry the universal set (trap #6)
    if (entry.path.endsWith('.docx')) {
      const styles = readZipStored(entry.data).find((p) => p.path === 'word/styles.xml');
      const stylesXml = styles ? new TextDecoder().decode(styles.data) : '';
      if (!stylesXml.includes('Georgia') || !stylesXml.includes('Trebuchet MS')) {
        findings.push(finding('P1', 'fonts', `non-universal fonts in ${entry.path}`, stylesXml.slice(0, 80)));
      }
    }
    if (entry.path.endsWith('.pptx')) {
      const theme = readZipStored(entry.data).find((p) => p.path === 'ppt/theme/theme1.xml');
      const themeXml = theme ? new TextDecoder().decode(theme.data) : '';
      if (!themeXml.includes('Trebuchet MS') || !themeXml.includes('Georgia')) {
        findings.push(finding('P1', 'fonts', `non-universal fonts in ${entry.path}`, themeXml.slice(0, 80)));
      }
    }
  }

  return findings;
}
