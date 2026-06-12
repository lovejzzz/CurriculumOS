/** api.ts — the client for the engine's server home. Same shapes as
 *  010-schema/api.md. SSE is read as a stream so the Spine renders machine
 *  states as they happen (one vocabulary, three audiences). */

const BASE = '/api';

export interface Heard {
  weeks?: number;
  assessments: string[];
  readings: string[];
  discipline?: string;
}

export interface MachineState {
  state: string;
  pass?: string;
  detail?: any;
  reason?: string;
}

export interface MaterialIn {
  name: string;
  contentBase64: string;
}

export interface IntakeResult {
  heard: Heard;
  files?: { name: string; extracted: boolean }[];
  notes?: string[];
}

export async function intake(brief: string, materials: MaterialIn[] = []): Promise<IntakeResult> {
  const r = await fetch(`${BASE}/intake`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ brief, ...(materials.length ? { materials } : {}) }),
  });
  return r.json();
}

/** Build a course, streaming machine states. Resolves with the Course Object
 *  (or the blocked course, named) when the stream ends. */
export async function build(
  brief: string,
  opts: { voice?: boolean; budgetUsd?: number; materials?: MaterialIn[] },
  onState: (s: MachineState, costSoFarUsd: number) => void,
): Promise<any> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (opts.budgetUsd) headers['x-budget-usd'] = String(opts.budgetUsd);
  const resp = await fetch(`${BASE}/courses`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ brief, options: { voice: opts.voice }, ...(opts.materials?.length ? { materials: opts.materials } : {}) }),
  });
  if (!resp.body) throw new Error('no stream');
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  let course: any = null;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const blocks = buf.split('\n\n');
    buf = blocks.pop() ?? '';
    for (const block of blocks) {
      const ev = block.match(/^event: (.+)$/m)?.[1];
      const data = block.match(/^data: ([\s\S]+)$/m)?.[1];
      if (!ev || !data) continue;
      const parsed = JSON.parse(data);
      if (ev === 'state') onState(parsed.state, parsed.costSoFarUsd);
      else if (ev === 'done') course = parsed;
    }
  }
  return course;
}

export async function getCourse(id: string): Promise<any> {
  return (await fetch(`${BASE}/courses/${id}`)).json();
}

export async function getArtifact(id: string, kind: string, scope: string): Promise<any> {
  return (await fetch(`${BASE}/courses/${id}/artifacts/${kind}/${scope}`)).json();
}

export interface EditResult {
  applied: boolean;
  seq: number;
  diff: { artifact: string; entityId?: string; surfaceId?: string; change: string; summary: string; before?: string; after?: string }[];
  grade: any;
  cost: { usd: number; itemized: { op: string; usd: number }[] };
}

export async function patch(id: string, ops: any[], actor = 'instructor'): Promise<EditResult> {
  const r = await fetch(`${BASE}/courses/${id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ops, actor }) });
  const j = await r.json();
  if (!r.ok) throw Object.assign(new Error(j.message ?? 'patch failed'), { code: j.code });
  return j;
}

export interface TAProposal {
  reply: string;
  note?: string;
  ops: any[];
  preview: { diff: EditResult['diff']; grade: any } | null;
}

export async function chat(id: string, message: string): Promise<TAProposal> {
  const r = await fetch(`${BASE}/courses/${id}/chat`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ message }) });
  return r.json();
}

export function packageUrl(id: string): string {
  return `${BASE}/courses/${id}/package?format=zip`;
}

export interface Observation {
  id: string;
  kind: string;
  text: string;
  entityIds: string[];
  ops?: any[];
}

export async function observations(id: string): Promise<Observation[]> {
  const r = await fetch(`${BASE}/courses/${id}/observations`);
  return (await r.json()).observations ?? [];
}

export async function undo(id: string): Promise<{ undone: number; remaining: number; grade: any } | { code: string; message: string }> {
  const r = await fetch(`${BASE}/courses/${id}/undo`, { method: 'POST' });
  return r.json();
}

export async function receipt(id: string): Promise<any> {
  return (await fetch(`${BASE}/courses/${id}/receipt`)).json();
}
