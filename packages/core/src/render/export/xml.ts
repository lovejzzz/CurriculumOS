/** render/export/xml.ts — tiny XML emission helpers for the OOXML builders.
 *  Pure string assembly; every text node is escaped (the export audit scans
 *  for encoding damage, so we never emit raw user text into markup). */

// control characters XML 1.0 forbids (everything below 0x20 except \t \n \r)
const XML_FORBIDDEN = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g;

export function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(XML_FORBIDDEN, '');
}

export const XML_DECL = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';

/** Build an element. children: raw xml string or array of raw xml strings. */
export function el(tag: string, attrs: Record<string, string | number> = {}, children: string | string[] = ''): string {
  const a = Object.entries(attrs)
    .map(([k, v]) => ` ${k}="${esc(String(v))}"`)
    .join('');
  const inner = Array.isArray(children) ? children.join('') : children;
  return inner ? `<${tag}${a}>${inner}</${tag}>` : `<${tag}${a}/>`;
}
