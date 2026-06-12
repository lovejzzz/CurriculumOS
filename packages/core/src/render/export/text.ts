/** render/export/text.ts — render artifacts to Markdown for the package.
 *  Pure: data → text. Identity lines (ids) are printed so the grader, the diff,
 *  and the instructor cross-reference (040 common rules). */
import type { RenderBlock, RenderedArtifact } from '../types.ts';

function tableMd(rows: string[][]): string {
  if (rows.length === 0) return '';
  const header = rows[0]!;
  const sep = header.map(() => '---');
  const body = rows.slice(1);
  const fmt = (r: string[]) => `| ${r.map((c) => String(c).replace(/\n/g, ' ').replace(/\|/g, '\\|')).join(' | ')} |`;
  return [fmt(header), `| ${sep.join(' | ')} |`, ...body.map(fmt)].join('\n');
}

function blockMd(b: RenderBlock, depth = 2): string {
  const parts: string[] = [];
  if (b.heading) parts.push(`${'#'.repeat(Math.min(depth, 6))} ${b.heading}`);
  if (b.text) parts.push(b.text);
  if (b.rows && b.rows.length) parts.push(tableMd(b.rows));
  if (b.meta) {
    if (typeof b.meta.notes === 'string') parts.push(`> Speaker notes: ${b.meta.notes}`);
    if (typeof b.meta.explanation === 'string') parts.push(`_Answer key:_ ${b.meta.explanation}`);
    if (typeof b.meta.answer === 'string') parts.push(`_Answer:_ ${b.meta.answer}`);
    if (typeof b.meta.visual === 'string') parts.push(`_(native visual: ${b.meta.visual})_`);
    if (Array.isArray(b.meta.citations)) parts.push(`_Citations:_ ${(b.meta.citations as string[]).join('; ')}`);
    if (typeof b.meta.note === 'string') parts.push(`> ${b.meta.note}`);
  }
  if (b.children) for (const c of b.children) parts.push(blockMd(c, depth + 1));
  return parts.filter(Boolean).join('\n\n');
}

export function artifactToMarkdown(a: RenderedArtifact): string {
  const head = `# ${a.title}\n`;
  return [head, ...a.blocks.map((b) => blockMd(b, 2))].join('\n\n') + '\n';
}
