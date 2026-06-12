/** render/export/docx.ts — the DOCX builder (one builder; the package façade
 *  delegates — trap #7). Pure: RenderedArtifact[] → bytes via the stored zip
 *  writer. Fonts are the universal set only (Georgia body, Trebuchet MS
 *  headings — trap #6); the export audit verifies them in the bytes. */
import type { RenderBlock, RenderedArtifact } from '../types.ts';
import { buildZip, textEntry } from './zip.ts';
import { XML_DECL, el, esc } from './xml.ts';

const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

function run(text: string, opts: { bold?: boolean; italic?: boolean } = {}): string {
  const props: string[] = [];
  if (opts.bold) props.push('<w:b/>');
  if (opts.italic) props.push('<w:i/>');
  const rPr = props.length ? `<w:rPr>${props.join('')}</w:rPr>` : '';
  return `<w:r>${rPr}<w:t xml:space="preserve">${esc(text)}</w:t></w:r>`;
}

function para(text: string, style?: string, opts: { italic?: boolean } = {}): string {
  const pPr = style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : '';
  // split hard newlines into separate runs with breaks
  const lines = text.split('\n');
  const runs = lines.map((l, i) => (i === 0 ? run(l, opts) : `<w:r><w:br/></w:r>${run(l, opts)}`)).join('');
  return `<w:p>${pPr}${runs}</w:p>`;
}

const CELL_BORDERS =
  '<w:tcBorders>' +
  ['top', 'left', 'bottom', 'right'].map((s) => `<w:${s} w:val="single" w:sz="4" w:color="CBD5E1"/>`).join('') +
  '</w:tcBorders>';

function table(rows: string[][]): string {
  const trs = rows
    .map((row, r) =>
      el(
        'w:tr',
        {},
        row
          .map((cell) =>
            `<w:tc><w:tcPr>${CELL_BORDERS}</w:tcPr>${para(String(cell ?? ''), r === 0 ? 'TableHeader' : undefined)}</w:tc>`,
          )
          .join(''),
      ),
    )
    .join('');
  return (
    '<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders>' +
    ['top', 'left', 'bottom', 'right', 'insideH', 'insideV']
      .map((s) => `<w:${s} w:val="single" w:sz="4" w:color="CBD5E1"/>`)
      .join('') +
    '</w:tblBorders></w:tblPr>' +
    trs +
    '</w:tbl><w:p/>'
  );
}

function blockToXml(b: RenderBlock, depth: number): string {
  const parts: string[] = [];
  if (b.heading) parts.push(para(b.heading, `Heading${Math.min(depth, 3)}`));
  if (b.text) parts.push(para(b.text));
  if (b.rows && b.rows.length) parts.push(table(b.rows));
  if (b.meta) {
    if (typeof b.meta.notes === 'string') parts.push(para(`Speaker notes: ${b.meta.notes}`, undefined, { italic: true }));
    if (typeof b.meta.answer === 'string') parts.push(para(`Answer: ${b.meta.answer}`, undefined, { italic: true }));
    if (typeof b.meta.explanation === 'string') parts.push(para(`Answer key: ${b.meta.explanation}`, undefined, { italic: true }));
    if (typeof b.meta.note === 'string') parts.push(para(String(b.meta.note), undefined, { italic: true }));
    if (Array.isArray(b.meta.citations)) parts.push(para(`Citations: ${(b.meta.citations as string[]).join('; ')}`, undefined, { italic: true }));
  }
  for (const c of b.children ?? []) parts.push(blockToXml(c, depth + 1));
  return parts.join('');
}

/** styles.xml — Georgia 12pt body; Trebuchet MS headings (the universal set). */
const STYLES_XML =
  XML_DECL +
  `<w:styles xmlns:w="${W}">` +
  '<w:docDefaults><w:rPrDefault><w:rPr>' +
  '<w:rFonts w:ascii="Georgia" w:hAnsi="Georgia" w:eastAsia="Georgia"/>' +
  '<w:sz w:val="24"/><w:szCs w:val="24"/>' +
  '</w:rPr></w:rPrDefault></w:docDefaults>' +
  heading('Heading1', 36, true) +
  heading('Heading2', 30, true) +
  heading('Heading3', 26, false) +
  '<w:style w:type="paragraph" w:styleId="TableHeader"><w:name w:val="Table Header"/>' +
  '<w:rPr><w:rFonts w:ascii="Trebuchet MS" w:hAnsi="Trebuchet MS"/><w:b/><w:sz w:val="22"/></w:rPr></w:style>' +
  '</w:styles>';

function heading(id: string, halfPoints: number, bold: boolean): string {
  return (
    `<w:style w:type="paragraph" w:styleId="${id}"><w:name w:val="${id}"/>` +
    '<w:pPr><w:spacing w:before="240" w:after="120"/></w:pPr>' +
    `<w:rPr><w:rFonts w:ascii="Trebuchet MS" w:hAnsi="Trebuchet MS"/>${bold ? '<w:b/>' : ''}<w:sz w:val="${halfPoints}"/></w:rPr>` +
    '</w:style>'
  );
}

const CONTENT_TYPES =
  XML_DECL +
  '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
  '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
  '<Default Extension="xml" ContentType="application/xml"/>' +
  '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
  '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>' +
  '</Types>';

const ROOT_RELS =
  XML_DECL +
  '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
  '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
  '</Relationships>';

const DOC_RELS =
  XML_DECL +
  '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
  '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
  '</Relationships>';

/** Build one .docx from one or more rendered artifacts (multiple = a bulk file;
 *  each artifact opens with its title as Heading1). */
export function buildDocx(artifacts: RenderedArtifact[]): Uint8Array {
  const body: string[] = [];
  for (const a of artifacts) {
    body.push(para(a.title, 'Heading1'));
    for (const b of a.blocks) body.push(blockToXml(b, 2));
  }
  const documentXml =
    XML_DECL +
    `<w:document xmlns:w="${W}"><w:body>` +
    body.join('') +
    '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>' +
    '</w:body></w:document>';

  return buildZip([
    textEntry('[Content_Types].xml', CONTENT_TYPES),
    textEntry('_rels/.rels', ROOT_RELS),
    textEntry('word/_rels/document.xml.rels', DOC_RELS),
    textEntry('word/document.xml', documentXml),
    textEntry('word/styles.xml', STYLES_XML),
  ]);
}
