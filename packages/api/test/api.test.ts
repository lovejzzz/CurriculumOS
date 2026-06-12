import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Server } from 'node:http';

// configure env BEFORE importing the server (fake provider, no auto-listen, temp data)
process.env.COS_NO_LISTEN = '1';
process.env.COS_DATA_DIR = mkdtempSync(join(tmpdir(), 'cos-api-'));
delete process.env.OPENAI_API_KEY;
delete process.env.DEEPSEEK_API_KEY;

const { server } = (await import('../src/server.ts')) as { server: Server };

let base = '';
beforeAll(async () => {
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const addr = server.address();
  const portNum = typeof addr === 'object' && addr ? addr.port : 0;
  base = `http://127.0.0.1:${portNum}`;
});
afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

const BRIEF =
  'Introduction to Computer Science with Python, a 15-lesson introductory college course with weekly autograded quizzes and hands-on coding labs. Lessons cover: variables, expressions, and types; conditionals and boolean logic; while loops; for loops and range; functions and scope; lists; strings and text processing; dictionaries and nested data; file input and output; a midterm exam; recursion; classes and objects; debugging and testing; an introduction to algorithms; and a final project integrating the full semester.';

async function buildViaSSE(): Promise<{ states: string[]; course: any; provider: string }> {
  const resp = await fetch(`${base}/courses`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ brief: BRIEF, options: { voice: false } }) });
  expect(resp.status).toBe(202);
  const text = await resp.text();
  const states: string[] = [];
  let course: any = null;
  let provider = '';
  for (const block of text.split('\n\n')) {
    const ev = block.match(/^event: (.+)$/m)?.[1];
    const data = block.match(/^data: (.+)$/m)?.[1];
    if (!ev || !data) continue;
    const parsed = JSON.parse(data);
    if (ev === 'state') states.push(parsed.state.state);
    if (ev === 'done') {
      course = parsed;
      provider = parsed.provider;
    }
  }
  return { states, course, provider };
}

describe('api (fake provider)', () => {
  it('POST /courses streams machine states and returns the Course Object', async () => {
    const { states, course, provider } = await buildViaSSE();
    expect(provider).toBe('fake');
    for (const s of ['intake', 'author', 'link', 'judge', 'compile', 'verify', 'grade', 'ready']) expect(states).toContain(s);
    expect(course.id).toMatch(/^c_/);
    expect(course.receipts.quality.structural.score).toBeGreaterThan(0);
  });

  it('GET /courses/:id returns a valid course; receipt has all three ledgers', async () => {
    const { course } = await buildViaSSE();
    const got = await (await fetch(`${base}/courses/${course.id}`)).json();
    expect(got.id).toBe(course.id);
    const receipt = await (await fetch(`${base}/courses/${course.id}/receipt`)).json();
    expect(receipt.quality).toBeTruthy();
    expect(receipt.cost).toBeTruthy();
    expect(receipt.provenance).toBeTruthy();
  });

  it('PATCH applies a weight change and returns a diff + fresh grade + $0 cost', async () => {
    const { course } = await buildViaSSE();
    const a = course.graph.assessments.find((x: any) => x.weightPct !== null && x.cadence === 'once');
    const other = course.graph.assessments.find((x: any) => x.id !== a.id && x.weightPct !== null && x.cadence === 'once');
    const newW = (a.weightPct === 25 ? 24 : 25);
    const ops = [{ type: 'assessment.set_weight', id: a.id, weightPct: newW }];
    if (other) ops.push({ type: 'assessment.set_weight', id: other.id, weightPct: Math.max(0, other.weightPct - (newW - a.weightPct)) });
    const res = await (await fetch(`${base}/courses/${course.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ops, actor: 'instructor' }) })).json();
    expect(res.applied).toBe(true);
    expect(res.grade.structural).toBeTruthy();
    expect(res.cost.usd).toBe(0);
    expect(res.diff.some((d: any) => d.artifact === 'syllabus')).toBe(true);
  });

  it('idempotency: same key + same body replays; different body conflicts', async () => {
    const { course } = await buildViaSSE();
    const a = course.graph.assessments.find((x: any) => x.weightPct !== null && x.cadence === 'once');
    const body = JSON.stringify({ ops: [{ type: 'assessment.set_weight', id: a.id, weightPct: a.weightPct }] });
    const r1 = await fetch(`${base}/courses/${course.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json', 'idempotency-key': 'k1' }, body });
    expect(r1.status).toBe(200);
    const r2 = await fetch(`${base}/courses/${course.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json', 'idempotency-key': 'k1' }, body });
    expect(r2.headers.get('idempotent-replay')).toBe('true');
    const r3 = await fetch(`${base}/courses/${course.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json', 'idempotency-key': 'k1' }, body: JSON.stringify({ ops: [] }) });
    const j3 = await r3.json();
    expect(j3.code).toBe('idempotency-replay-mismatch');
  });

  it('precondition violation returns 422 with named code', async () => {
    const { course } = await buildViaSSE();
    const graded = course.graph.assessments.filter((x: any) => x.weightPct !== null);
    const ops = graded.map((x: any) => ({ type: 'assessment.set_weight', id: x.id, weightPct: 90 }));
    const r = await fetch(`${base}/courses/${course.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ops }) });
    expect(r.status).toBe(422);
    expect((await r.json()).code).toBe('precondition-failed');
  });

  it('GET /package?format=zip returns a zip containing the manifest + report', async () => {
    const { course } = await buildViaSSE();
    const r = await fetch(`${base}/courses/${course.id}/package?format=zip`);
    expect(r.headers.get('content-type')).toBe('application/zip');
    const buf = Buffer.from(await r.arrayBuffer());
    expect(buf.length).toBeGreaterThan(1000);
    const text = buf.toString('latin1');
    expect(text).toContain('PACKAGE_MANIFEST.json');
    expect(text).toContain('QUALITY_REPORT.md');
    expect(text.slice(0, 2)).toBe('PK'); // zip magic
  });

  it('unsupported package format fails loud with a named code', async () => {
    const { course } = await buildViaSSE();
    const r = await fetch(`${base}/courses/${course.id}/package?format=docx`);
    expect(r.status).toBe(400);
    expect((await r.json()).code).toBe('unsupported-format');
  });

  it('TA chat proposes an EditOp batch with a preview (one edit pathway)', async () => {
    const { course } = await buildViaSSE();
    const a = course.graph.assessments.find((x: any) => x.weightPct !== null);
    const msg = `set weight of ${a.id} to ${a.weightPct}`;
    const r = await (await fetch(`${base}/courses/${course.id}/chat`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ message: msg }) })).json();
    expect(r.ops.length).toBe(1);
    expect(r.ops[0].type).toBe('assessment.set_weight');
    expect(r.preview).toBeTruthy();
    expect(r.preview.grade.structural).toBeTruthy();
  });

  it('404 for a missing course', async () => {
    const r = await fetch(`${base}/courses/c_missing`);
    expect(r.status).toBe(404);
    expect((await r.json()).code).toBe('course-not-found');
  });
});
