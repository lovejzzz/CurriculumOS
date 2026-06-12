/** render/export/xlsx.ts — the XLSX builder (the Course Map sheet). Pure:
 *  rows → bytes. Inline strings keep it dependency-free and audit-readable. */
import { buildZip, textEntry } from './zip.ts';
import { XML_DECL, esc } from './xml.ts';

function colLetter(i: number): string {
  let s = '';
  let n = i;
  do {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return s;
}

export function buildXlsx(sheetName: string, rows: string[][]): Uint8Array {
  const sheetRows = rows
    .map((row, r) => {
      const cells = row
        .map((cell, c) => `<c r="${colLetter(c)}${r + 1}" t="inlineStr"><is><t xml:space="preserve">${esc(String(cell ?? ''))}</t></is></c>`)
        .join('');
      return `<row r="${r + 1}">${cells}</row>`;
    })
    .join('');

  const sheetXml =
    XML_DECL +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    `<sheetData>${sheetRows}</sheetData>` +
    '</worksheet>';

  const workbookXml =
    XML_DECL +
    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    `<sheets><sheet name="${esc(sheetName.slice(0, 31))}" sheetId="1" r:id="rId1"/></sheets>` +
    '</workbook>';

  const contentTypes =
    XML_DECL +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
    '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
    '</Types>';

  const rootRels =
    XML_DECL +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
    '</Relationships>';

  const workbookRels =
    XML_DECL +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
    '</Relationships>';

  return buildZip([
    textEntry('[Content_Types].xml', contentTypes),
    textEntry('_rels/.rels', rootRels),
    textEntry('xl/workbook.xml', workbookXml),
    textEntry('xl/_rels/workbook.xml.rels', workbookRels),
    textEntry('xl/worksheets/sheet1.xml', sheetXml),
  ]);
}
