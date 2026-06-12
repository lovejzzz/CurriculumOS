/** render/export/pptx.ts — the PPTX builder. Pure: a slideDecks artifact →
 *  bytes. Speaker notes on every content slide; the ≥2 native visuals per deck
 *  are DRAWN here as shapes (concept map: nodes + connectors; worked-example
 *  chart: step bars) from graph/kernel data — zero AI calls (040 spec). The
 *  per-deck visual audit line is computed by the caller from the same blocks. */
import type { RenderBlock, RenderedArtifact } from '../types.ts';
import { buildZip, textEntry } from './zip.ts';
import { XML_DECL, esc } from './xml.ts';

const NS =
  'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" ' +
  'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ' +
  'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"';

const EMU_W = 12192000; // 13.33in × 7.5in
const EMU_H = 6858000;

// ── theme (fonts: Trebuchet MS major / Georgia minor — the universal set) ────
function themeXml(name: string): string {
  const accent = (v: string) => `<a:srgbClr val="${v}"/>`;
  const solid = '<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>';
  return (
    XML_DECL +
    `<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="${name}"><a:themeElements>` +
    `<a:clrScheme name="${name}">` +
    `<a:dk1>${accent('0F172A')}</a:dk1><a:lt1>${accent('FFFFFF')}</a:lt1>` +
    `<a:dk2>${accent('334155')}</a:dk2><a:lt2>${accent('F8FAFC')}</a:lt2>` +
    `<a:accent1>${accent('4F46E5')}</a:accent1><a:accent2>${accent('6366F1')}</a:accent2>` +
    `<a:accent3>${accent('64748B')}</a:accent3><a:accent4>${accent('94A3B8')}</a:accent4>` +
    `<a:accent5>${accent('059669')}</a:accent5><a:accent6>${accent('D97706')}</a:accent6>` +
    `<a:hlink>${accent('4338CA')}</a:hlink><a:folHlink>${accent('6366F1')}</a:folHlink>` +
    '</a:clrScheme>' +
    `<a:fontScheme name="${name}">` +
    '<a:majorFont><a:latin typeface="Trebuchet MS"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont>' +
    '<a:minorFont><a:latin typeface="Georgia"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont>' +
    '</a:fontScheme>' +
    `<a:fmtScheme name="${name}">` +
    `<a:fillStyleLst>${solid}${solid}${solid}</a:fillStyleLst>` +
    `<a:lnStyleLst><a:ln w="9525">${solid}</a:ln><a:ln w="19050">${solid}</a:ln><a:ln w="28575">${solid}</a:ln></a:lnStyleLst>` +
    '<a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst>' +
    `<a:bgFillStyleLst>${solid}${solid}${solid}</a:bgFillStyleLst>` +
    '</a:fmtScheme></a:themeElements></a:theme>'
  );
}

const EMPTY_TREE =
  '<p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/></p:spTree>';

const CLR_MAP =
  '<p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" ' +
  'accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>';

// ── shape helpers ────────────────────────────────────────────────────────────
let shapeId = 1;
function sp(opts: {
  name: string;
  x: number;
  y: number;
  cx: number;
  cy: number;
  geom?: string;
  fill?: string;
  line?: string;
  text?: string;
  size?: number;
  bold?: boolean;
  align?: 'l' | 'ctr';
  ph?: string;
}): string {
  shapeId += 1;
  const phXml = opts.ph ? `<p:ph type="${opts.ph}"${opts.ph === 'body' ? ' idx="1"' : ''}/>` : '';
  const geom = opts.geom ? `<a:prstGeom prst="${opts.geom}"><a:avLst/></a:prstGeom>` : '';
  const fill = opts.fill ? `<a:solidFill><a:srgbClr val="${opts.fill}"/></a:solidFill>` : '';
  const line = opts.line ? `<a:ln w="12700"><a:solidFill><a:srgbClr val="${opts.line}"/></a:solidFill></a:ln>` : '';
  const paras = (opts.text ?? '')
    .split('\n')
    .map(
      (lineText) =>
        `<a:p><a:pPr algn="${opts.align ?? 'l'}"/><a:r><a:rPr lang="en-US" sz="${(opts.size ?? 18) * 100}"${opts.bold ? ' b="1"' : ''} dirty="0"/><a:t>${esc(lineText)}</a:t></a:r></a:p>`,
    )
    .join('');
  return (
    `<p:sp><p:nvSpPr><p:cNvPr id="${shapeId}" name="${esc(opts.name)}"/><p:cNvSpPr/><p:nvPr>${phXml}</p:nvPr></p:nvSpPr>` +
    `<p:spPr><a:xfrm><a:off x="${Math.round(opts.x)}" y="${Math.round(opts.y)}"/><a:ext cx="${Math.round(opts.cx)}" cy="${Math.round(opts.cy)}"/></a:xfrm>${geom}${fill}${line}</p:spPr>` +
    `<p:txBody><a:bodyPr wrap="square" anchor="ctr"/><a:lstStyle/>${paras || '<a:p/>'}</p:txBody></p:sp>`
  );
}

function connector(x1: number, y1: number, x2: number, y2: number): string {
  shapeId += 1;
  const x = Math.min(x1, x2);
  const y = Math.min(y1, y2);
  const cx = Math.abs(x2 - x1) || 1;
  const cy = Math.abs(y2 - y1) || 1;
  const flipH = x2 < x1 ? ' flipH="1"' : '';
  const flipV = y2 < y1 ? ' flipV="1"' : '';
  return (
    `<p:cxnSp><p:nvCxnSpPr><p:cNvPr id="${shapeId}" name="conn"/><p:cNvCxnSpPr/><p:nvPr/></p:nvCxnSpPr>` +
    `<p:spPr><a:xfrm${flipH}${flipV}><a:off x="${Math.round(x)}" y="${Math.round(y)}"/><a:ext cx="${Math.round(cx)}" cy="${Math.round(cy)}"/></a:xfrm>` +
    '<a:prstGeom prst="line"><a:avLst/></a:prstGeom>' +
    '<a:ln w="19050"><a:solidFill><a:srgbClr val="94A3B8"/></a:solidFill></a:ln></p:spPr></p:cxnSp>'
  );
}

// ── the two native visuals, drawn from data ─────────────────────────────────
function conceptMapShapes(center: string, related: string[]): string {
  const cx = EMU_W / 2;
  const cy = EMU_H / 2 + 400000;
  const nodeW = 2200000;
  const nodeH = 800000;
  const radius = 2300000;
  const parts: string[] = [];
  const n = Math.max(1, related.length);
  related.forEach((name, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    const sx = cx + radius * Math.cos(angle);
    const sy = cy + radius * 0.62 * Math.sin(angle);
    parts.push(connector(cx, cy, sx, sy));
    parts.push(
      sp({ name: `node-${i}`, x: sx - nodeW / 2, y: sy - nodeH / 2, cx: nodeW, cy: nodeH, geom: 'ellipse', fill: 'F8FAFC', line: '94A3B8', text: name, size: 12, align: 'ctr' }),
    );
  });
  // center node last so it sits on top
  parts.push(
    sp({ name: 'center', x: cx - nodeW / 2, y: cy - nodeH / 2, cx: nodeW, cy: nodeH, geom: 'roundRect', fill: 'EEF2FF', line: '4F46E5', text: center, size: 14, bold: true, align: 'ctr' }),
  );
  return parts.join('');
}

function workedExampleChart(steps: string[], answer: string): string {
  const parts: string[] = [];
  const baseY = EMU_H - 1200000;
  const barW = 1500000;
  const gap = 500000;
  const startX = (EMU_W - steps.length * (barW + gap)) / 2;
  steps.forEach((step, i) => {
    const h = 900000 + i * 700000; // ascending bars: progress through the steps
    const x = startX + i * (barW + gap);
    parts.push(sp({ name: `bar-${i}`, x, y: baseY - h, cx: barW, cy: h, geom: 'rect', fill: i === steps.length - 1 ? '4F46E5' : 'C7D2FE', line: '6366F1' }));
    parts.push(sp({ name: `lbl-${i}`, x, y: baseY + 50000, cx: barW, cy: 600000, text: `Step ${i + 1}`, size: 11, align: 'ctr' }));
  });
  parts.push(sp({ name: 'answer', x: EMU_W / 2 - 3000000, y: 1100000, cx: 6000000, cy: 700000, geom: 'roundRect', fill: 'ECFDF5', line: '059669', text: `Answer: ${answer}`.slice(0, 90), size: 13, align: 'ctr' }));
  return parts.join('');
}

// ── slides ───────────────────────────────────────────────────────────────────
function slideXml(block: RenderBlock, index: number, hasNotes: boolean): string {
  shapeId = 1;
  const parts: string[] = [];
  parts.push(
    sp({ name: 'Title', ph: 'title', x: 600000, y: 350000, cx: EMU_W - 1200000, cy: 900000, text: block.heading ?? `Slide ${index + 1}`, size: 30, bold: true }),
  );

  const visual = block.meta?.visual as string | undefined;
  if (visual === 'concept-map') {
    parts.push(conceptMapShapes(String(block.meta?.concept ?? 'Concept'), (block.meta?.related as string[]) ?? []));
  } else if (visual === 'worked-example-chart') {
    const steps = (block.meta?.steps as string[]) ?? ['identify', 'apply', 'check'];
    parts.push(workedExampleChart(steps, String(block.meta?.answer ?? block.text ?? '')));
  } else {
    const bullets: string[] = [];
    if (block.text) bullets.push(...block.text.split('\n'));
    if (block.rows) bullets.push(...block.rows.map((r) => r.filter(Boolean).join(' — ')));
    if (bullets.length) {
      parts.push(
        sp({ name: 'Body', ph: 'body', x: 600000, y: 1500000, cx: EMU_W - 1200000, cy: EMU_H - 2100000, text: bullets.join('\n'), size: 18 }),
      );
    }
  }

  return (
    XML_DECL +
    `<p:sld ${NS}><p:cSld><p:spTree>` +
    '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/>' +
    parts.join('') +
    '</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>'
  );
}

function notesXml(notes: string): string {
  shapeId = 1;
  return (
    XML_DECL +
    `<p:notes ${NS}><p:cSld><p:spTree>` +
    '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/>' +
    sp({ name: 'Notes', ph: 'body', x: 685800, y: 4572000, cx: 5486400, cy: 3600000, text: notes, size: 12 }) +
    '</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:notes>'
  );
}

const RELS_NS = 'xmlns="http://schemas.openxmlformats.org/package/2006/relationships"';
const RT = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';

/** Build one .pptx from a slideDecks artifact (blocks of kind 'slide'). */
export function buildPptx(artifact: RenderedArtifact): Uint8Array {
  const slides = artifact.blocks.filter((b) => b.kind === 'slide');
  const entries = [];

  // content types
  const overrides: string[] = [
    '<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>',
    '<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>',
    '<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>',
    '<Override PartName="/ppt/notesMasters/notesMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.notesMaster+xml"/>',
    '<Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>',
    '<Override PartName="/ppt/theme/theme2.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>',
  ];
  slides.forEach((_b, i) => {
    overrides.push(`<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`);
    overrides.push(`<Override PartName="/ppt/notesSlides/notesSlide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.notesSlide+xml"/>`);
  });
  entries.push(
    textEntry(
      '[Content_Types].xml',
      XML_DECL +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        overrides.join('') +
        '</Types>',
    ),
  );

  entries.push(textEntry('_rels/.rels', XML_DECL + `<Relationships ${RELS_NS}><Relationship Id="rId1" Type="${RT}/officeDocument" Target="ppt/presentation.xml"/></Relationships>`));

  // presentation + rels
  const sldIds = slides.map((_b, i) => `<p:sldId id="${256 + i}" r:id="rId${3 + i}"/>`).join('');
  entries.push(
    textEntry(
      'ppt/presentation.xml',
      XML_DECL +
        `<p:presentation ${NS}>` +
        '<p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>' +
        '<p:notesMasterIdLst><p:notesMasterId r:id="rId2"/></p:notesMasterIdLst>' +
        `<p:sldIdLst>${sldIds}</p:sldIdLst>` +
        `<p:sldSz cx="${EMU_W}" cy="${EMU_H}"/><p:notesSz cx="6858000" cy="9144000"/>` +
        '</p:presentation>',
    ),
  );
  const presRels = [
    `<Relationship Id="rId1" Type="${RT}/slideMaster" Target="slideMasters/slideMaster1.xml"/>`,
    `<Relationship Id="rId2" Type="${RT}/notesMaster" Target="notesMasters/notesMaster1.xml"/>`,
    ...slides.map((_b, i) => `<Relationship Id="rId${3 + i}" Type="${RT}/slide" Target="slides/slide${i + 1}.xml"/>`),
  ];
  entries.push(textEntry('ppt/_rels/presentation.xml.rels', XML_DECL + `<Relationships ${RELS_NS}>${presRels.join('')}</Relationships>`));

  // masters, layout, themes
  entries.push(
    textEntry(
      'ppt/slideMasters/slideMaster1.xml',
      XML_DECL + `<p:sldMaster ${NS}><p:cSld>${EMPTY_TREE}</p:cSld>${CLR_MAP}<p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst></p:sldMaster>`,
    ),
  );
  entries.push(
    textEntry(
      'ppt/slideMasters/_rels/slideMaster1.xml.rels',
      XML_DECL + `<Relationships ${RELS_NS}><Relationship Id="rId1" Type="${RT}/slideLayout" Target="../slideLayouts/slideLayout1.xml"/><Relationship Id="rId2" Type="${RT}/theme" Target="../theme/theme1.xml"/></Relationships>`,
    ),
  );
  entries.push(
    textEntry('ppt/slideLayouts/slideLayout1.xml', XML_DECL + `<p:sldLayout ${NS}><p:cSld>${EMPTY_TREE}</p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>`),
  );
  entries.push(
    textEntry('ppt/slideLayouts/_rels/slideLayout1.xml.rels', XML_DECL + `<Relationships ${RELS_NS}><Relationship Id="rId1" Type="${RT}/slideMaster" Target="../slideMasters/slideMaster1.xml"/></Relationships>`),
  );
  entries.push(
    textEntry('ppt/notesMasters/notesMaster1.xml', XML_DECL + `<p:notesMaster ${NS}><p:cSld>${EMPTY_TREE}</p:cSld>${CLR_MAP}</p:notesMaster>`),
  );
  entries.push(
    textEntry('ppt/notesMasters/_rels/notesMaster1.xml.rels', XML_DECL + `<Relationships ${RELS_NS}><Relationship Id="rId1" Type="${RT}/theme" Target="../theme/theme2.xml"/></Relationships>`),
  );
  entries.push(textEntry('ppt/theme/theme1.xml', themeXml('COS')));
  entries.push(textEntry('ppt/theme/theme2.xml', themeXml('COS Notes')));

  // slides + notes
  slides.forEach((block, i) => {
    const notes = typeof block.meta?.notes === 'string' ? (block.meta.notes as string) : '';
    entries.push(textEntry(`ppt/slides/slide${i + 1}.xml`, slideXml(block, i, !!notes)));
    entries.push(
      textEntry(
        `ppt/slides/_rels/slide${i + 1}.xml.rels`,
        XML_DECL +
          `<Relationships ${RELS_NS}>` +
          `<Relationship Id="rId1" Type="${RT}/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>` +
          `<Relationship Id="rId2" Type="${RT}/notesSlide" Target="../notesSlides/notesSlide${i + 1}.xml"/>` +
          '</Relationships>',
      ),
    );
    entries.push(textEntry(`ppt/notesSlides/notesSlide${i + 1}.xml`, notesXml(notes || ' ')));
    entries.push(
      textEntry(
        `ppt/notesSlides/_rels/notesSlide${i + 1}.xml.rels`,
        XML_DECL +
          `<Relationships ${RELS_NS}>` +
          `<Relationship Id="rId1" Type="${RT}/notesMaster" Target="../notesMasters/notesMaster1.xml"/>` +
          `<Relationship Id="rId2" Type="${RT}/slide" Target="../slides/slide${i + 1}.xml"/>` +
          '</Relationships>',
      ),
    );
  });

  return buildZip(entries);
}

/** The PPTX visual audit line (kept at export — 030-ports adaptation note). */
export function deckVisualStats(artifacts: RenderedArtifact[]): { decks: number; slides: number; visuals: { min: number; max: number; median: number } } {
  const counts = artifacts.map((a) => a.blocks.filter((b) => b.kind === 'slide' && b.meta?.visual).length);
  const slides = artifacts.reduce((s, a) => s + a.blocks.filter((b) => b.kind === 'slide').length, 0);
  const sorted = [...counts].sort((x, y) => x - y);
  return {
    decks: artifacts.length,
    slides,
    visuals: {
      min: sorted[0] ?? 0,
      max: sorted[sorted.length - 1] ?? 0,
      median: sorted[Math.floor(sorted.length / 2)] ?? 0,
    },
  };
}
