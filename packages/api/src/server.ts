/** server.ts — the metered API (founding §5, 010-schema/api.md). The routes
 *  ARE the §5 surface: two verbs (POST/PATCH) plus reads and renders. Every
 *  200 carries a receipt (quality access, provenance, cost). SSE streams the
 *  machine, nothing else (ADR-08). One core, server home. */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { join } from 'node:path';
import {
  buildCourse,
  applyEdit,
  render,
  buildPackage,
  proposeEdit,
  parseBrief,
  validateCourse,
  PreconditionError,
  InvalidOpError,
  type Course,
  type EditOp,
  type PipelineState,
} from '@curriculumos/core';
import { FileStorage, SystemClock, CryptoRand } from './store.ts';
import { modelFromEnv } from './models/index.ts';
import { ProviderError } from './models/openai.ts';
import { ApiError } from './errors.ts';

const PORT = Number(process.env.PORT ?? 8787);
const DATA_DIR = process.env.COS_DATA_DIR ?? join(process.cwd(), '.data', 'courses');
const storage = new FileStorage(DATA_DIR);
const clock = new SystemClock();
const rand = new CryptoRand();
const idempotency = new Map<string, { bodyHash: string; response: unknown }>();

function cors(res: ServerResponse): void {
  res.setHeader('access-control-allow-origin', '*');
  res.setHeader('access-control-allow-methods', 'GET,POST,PATCH,OPTIONS');
  res.setHeader('access-control-allow-headers', 'content-type,idempotency-key,x-budget-usd,if-match,authorization');
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const text = JSON.stringify(body);
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(text);
}

function sendError(res: ServerResponse, err: unknown): void {
  if (err instanceof ApiError) return sendJson(res, err.status, err.body());
  if (err instanceof PreconditionError) return sendJson(res, 422, { code: 'precondition-failed', message: err.message });
  if (err instanceof InvalidOpError) return sendJson(res, 400, { code: 'invalid-op', message: err.message, detail: { opIndex: err.opIndex } });
  if (err instanceof ProviderError) return sendJson(res, 424, { code: 'provider-failure', message: err.message });
  const message = err instanceof Error ? err.message : 'unknown error';
  sendJson(res, 500, { code: 'bad-request', message });
}

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  return Buffer.concat(chunks).toString('utf8');
}

async function loadCourse(id: string): Promise<Course> {
  const raw = await storage.get(id);
  if (!raw) throw new ApiError('course-not-found', `course ${id} not found`);
  return JSON.parse(raw) as Course;
}
async function saveCourse(course: Course): Promise<void> {
  await storage.put(course.id, JSON.stringify(course));
}

function fnvHash(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16);
}

// ── POST /courses — build, streaming the machine as SSE ──────────────────────
async function handleBuild(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = await readBody(req);
  const parsed = JSON.parse(body || '{}') as { brief?: string; options?: { voice?: boolean; lens?: string | null } };
  if (!parsed.brief || typeof parsed.brief !== 'string') throw new ApiError('bad-request', 'brief is required');
  const budget = Number(req.headers['x-budget-usd'] ?? Infinity);
  const { port: model, provider } = modelFromEnv();

  cors(res);
  res.writeHead(202, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache', connection: 'keep-alive' });
  const frame = (event: string, data: unknown) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

  let buildId = `b_pending`;
  const outcome = await buildCourse(
    parsed.brief,
    { model, clock, rand },
    {
      voice: parsed.options?.voice,
      budgetUsd: budget,
      lens: parsed.options?.lens ?? null,
      onState: (state: PipelineState, costSoFarUsd: number) => {
        frame('state', { buildId, state, costSoFarUsd, at: clock.nowISO() });
      },
    },
  );
  buildId = outcome.course.receipts.builds.at(-1)?.buildId ?? buildId;
  await saveCourse(outcome.course);
  // the terminal event carries the full Course Object (or the blocked course with named reason)
  frame('done', { provider, ...outcome.course });
  res.end();
}

// ── PATCH /courses/:id — apply ops, return EditResult ────────────────────────
async function handlePatch(req: IncomingMessage, res: ServerResponse, id: string): Promise<void> {
  const body = await readBody(req);
  const parsed = JSON.parse(body || '{}') as { ops?: EditOp[]; actor?: 'instructor' | 'ta' | 'system' };
  if (!Array.isArray(parsed.ops)) throw new ApiError('invalid-op', 'ops[] is required');

  // idempotency
  const key = req.headers['idempotency-key'] as string | undefined;
  const bodyHash = fnvHash(body);
  if (key) {
    const prior = idempotency.get(key);
    if (prior) {
      if (prior.bodyHash !== bodyHash) throw new ApiError('idempotency-replay-mismatch', 'same key, different body');
      res.setHeader('idempotent-replay', 'true');
      return sendJson(res, 200, prior.response);
    }
  }

  const course = await loadCourse(id);
  // optimistic concurrency (If-Match: seq)
  const ifMatch = req.headers['if-match'];
  if (ifMatch !== undefined) {
    const lastSeq = course.overlays.edits.at(-1)?.seq ?? 0;
    if (Number(ifMatch) !== lastSeq) throw new ApiError('stale-seq', `If-Match ${ifMatch} lost the race (current ${lastSeq})`);
  }

  const { port: model } = modelFromEnv();
  const result = await applyEdit(course, parsed.ops, parsed.actor ?? 'instructor', { clock, model });
  await saveCourse(course);
  if (key) idempotency.set(key, { bodyHash, response: result });
  sendJson(res, 200, result);
}

// ── GET reads ────────────────────────────────────────────────────────────────
async function handleGetCourse(res: ServerResponse, id: string): Promise<void> {
  const course = await loadCourse(id);
  validateCourse(course);
  sendJson(res, 200, course);
}
async function handleReceipt(res: ServerResponse, id: string): Promise<void> {
  const course = await loadCourse(id);
  sendJson(res, 200, { quality: course.receipts.quality, provenance: course.receipts.provenance, cost: course.receipts.cost, builds: course.receipts.builds });
}
async function handleArtifact(res: ServerResponse, id: string, kind: string, scope: string): Promise<void> {
  const course = await loadCourse(id);
  const rc = render(course);
  const art = rc.byKey[`${kind}:${scope}`] ?? rc.artifacts.find((a) => a.kind === kind);
  if (!art) throw new ApiError('bad-request', `artifact ${kind} not found`);
  sendJson(res, 200, art);
}
async function handleEvents(res: ServerResponse, id: string, since: number): Promise<void> {
  const course = await loadCourse(id);
  sendJson(res, 200, { events: course.overlays.edits.filter((e) => e.seq > since) });
}
async function handlePackage(res: ServerResponse, id: string, format: string): Promise<void> {
  if (format !== 'zip') throw new ApiError('unsupported-format', `format "${format}" not yet supported; use zip`);
  const course = await loadCourse(id);
  const bytes = buildPackage(course);
  const name = `${course.graph.courseTitle.replace(/[^A-Za-z0-9]+/g, '_')}.zip`;
  res.writeHead(200, { 'content-type': 'application/zip', 'content-disposition': `attachment; filename="${name}"` });
  res.end(Buffer.from(bytes));
}

// ── POST /courses/:id/chat — the TA (proposals into the Queue) ────────────────
async function handleChat(req: IncomingMessage, res: ServerResponse, id: string): Promise<void> {
  const body = await readBody(req);
  const parsed = JSON.parse(body || '{}') as { message?: string };
  if (!parsed.message) throw new ApiError('bad-request', 'message is required');
  const course = await loadCourse(id);
  const { port: model } = modelFromEnv();
  const proposal = await proposeEdit(course, parsed.message, model, clock);
  sendJson(res, 200, proposal);
}

// ── router ───────────────────────────────────────────────────────────────────
const server = createServer(async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }
  try {
    const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
    const parts = url.pathname.split('/').filter(Boolean); // ['courses', id, ...]
    if (parts[0] === 'health') return sendJson(res, 200, { ok: true, provider: modelFromEnv().provider });

    // intake reflection ($0, deterministic) — powers the Door's "heard so far"
    if (parts[0] === 'intake' && req.method === 'POST') {
      const b = JSON.parse((await readBody(req)) || '{}') as { brief?: string };
      return sendJson(res, 200, { heard: parseBrief(b.brief ?? '') });
    }

    if (parts[0] !== 'courses') throw new ApiError('bad-request', 'unknown route');

    if (parts.length === 1) {
      if (req.method === 'POST') return await handleBuild(req, res);
      if (req.method === 'GET') return sendJson(res, 200, { courses: await storage.list() });
      throw new ApiError('bad-request', 'method not allowed');
    }

    const id = parts[1]!;
    if (parts.length === 2) {
      if (req.method === 'GET') return await handleGetCourse(res, id);
      if (req.method === 'PATCH') return await handlePatch(req, res, id);
      throw new ApiError('bad-request', 'method not allowed');
    }
    const sub = parts[2];
    if (sub === 'receipt') return await handleReceipt(res, id);
    if (sub === 'events') return await handleEvents(res, id, Number(url.searchParams.get('since') ?? 0));
    if (sub === 'package') return await handlePackage(res, id, url.searchParams.get('format') ?? 'zip');
    if (sub === 'chat' && req.method === 'POST') return await handleChat(req, res, id);
    if (sub === 'artifacts') return await handleArtifact(res, id, parts[3] ?? '', parts[4] ?? 'course');
    throw new ApiError('bad-request', 'unknown route');
  } catch (err) {
    sendError(res, err);
  }
});

if (process.env.COS_NO_LISTEN !== '1') {
  server.listen(PORT, () => {
    const { provider, model } = modelFromEnv();
    // eslint-disable-next-line no-console
    console.log(`CurriculumOS API on :${PORT} — provider=${provider} model=${model} data=${DATA_DIR}`);
  });
}

export { server };
