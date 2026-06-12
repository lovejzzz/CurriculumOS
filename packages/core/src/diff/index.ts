/** diff/index.ts — render-and-diff (founding §3: sync is a property, not a
 *  feature). The diff between two pure renders IS the sync plan. The desk
 *  plays these as the four-second glow; the Crucible asserts them. No
 *  hand-maintained dependency map exists, because the problem it approximated
 *  doesn't (030-ports kill list). */
import type { ArtifactDiff } from '../schema/editOps.ts';
import type { RenderBlock, RenderedArtifact, RenderedCourse } from '../render/types.ts';

function blockKey(b: RenderBlock, i: number): string {
  return `${b.kind}#${b.entityId ?? b.surfaceId ?? b.heading ?? i}`;
}
function blockSig(b: RenderBlock): string {
  const rows = b.rows ? b.rows.map((r) => r.join('|')).join('||') : '';
  return [b.heading ?? '', b.text ?? '', rows].join('␟');
}

function diffArtifact(before: RenderedArtifact | undefined, after: RenderedArtifact | undefined): ArtifactDiff[] {
  const out: ArtifactDiff[] = [];
  if (!before && after) {
    out.push({ artifact: after.kind, entityId: after.scope, change: 'added', summary: `${after.title} added` });
    return out;
  }
  if (before && !after) {
    out.push({ artifact: before.kind, entityId: before.scope, change: 'removed', summary: `${before.title} removed` });
    return out;
  }
  if (!before || !after) return out;

  const beforeMap = new Map(before.blocks.map((b, i) => [blockKey(b, i), b]));
  const afterMap = new Map(after.blocks.map((b, i) => [blockKey(b, i), b]));
  for (const [key, ab] of afterMap) {
    const bb = beforeMap.get(key);
    if (!bb) {
      out.push({ artifact: after.kind, ...idFor(ab), change: 'added', summary: `${after.kind}: ${ab.heading ?? ab.kind} added` });
    } else if (blockSig(bb) !== blockSig(ab)) {
      out.push({
        artifact: after.kind,
        ...idFor(ab),
        change: 'updated',
        summary: summarize(after.kind, ab, bb),
        before: shorten(blockSig(bb)),
        after: shorten(blockSig(ab)),
      });
    }
  }
  for (const [key, bb] of beforeMap) {
    if (!afterMap.has(key)) out.push({ artifact: before.kind, ...idFor(bb), change: 'removed', summary: `${before.kind}: ${bb.heading ?? bb.kind} removed` });
  }
  return out;
}

function idFor(b: RenderBlock): { entityId?: string; surfaceId?: string } {
  const o: { entityId?: string; surfaceId?: string } = {};
  if (b.entityId) o.entityId = b.entityId;
  if (b.surfaceId) o.surfaceId = b.surfaceId;
  return o;
}

function summarize(kind: string, after: RenderBlock, before: RenderBlock): string {
  // human-readable per the api.md example ("Grading table: Midterm 2 — 20% → 25%")
  if (after.kind === 'grading-table' && after.rows && before.rows) {
    for (let i = 1; i < after.rows.length; i++) {
      const ar = after.rows[i];
      const br = before.rows[i];
      if (ar && br && ar[2] !== br[2]) return `Grading table: ${ar[1]} — ${br[2]} → ${ar[2]}`;
    }
  }
  return `${kind}: ${after.heading ?? after.kind} updated`;
}

function shorten(s: string): string {
  const clean = s.replace(/␟/g, ' · ').replace(/\s+/g, ' ').trim();
  return clean.length > 120 ? clean.slice(0, 117) + '…' : clean;
}

/** Diff two full renders into the per-artifact change list. */
export function diffRenders(before: RenderedCourse, after: RenderedCourse): ArtifactDiff[] {
  const keys = new Set([...Object.keys(before.byKey), ...Object.keys(after.byKey)]);
  const out: ArtifactDiff[] = [];
  for (const key of keys) {
    out.push(...diffArtifact(before.byKey[key], after.byKey[key]));
  }
  return out;
}
