# 010-schema/api.md — the API surface, with examples

_Normative companion to `courseObject.ts`, `editOps.ts`, `machine.ts`. The contract that defines the company: **no response without a receipt** — every 200 carries `quality`, `provenance` access, and `cost`._

## Auth

Two modes, same engine:

- **BYO key (browser engine):** no platform auth; the user's provider key never leaves their browser. The API below still describes the in-browser engine's facade — clients call the same functions with the same shapes.
- **Platform key (server engine):** `Authorization: Bearer cos_…`, metered per the cost ledger; the ledger in every response is also the invoice line.

Common headers: `Idempotency-Key` (POST/PATCH; 24h window; replay returns the original response with `Idempotent-Replay: true`), `X-Budget-Usd` (hard cap, Law 9).

---

## POST /courses

```http
POST /courses
Idempotency-Key: 01J9Z…
X-Budget-Usd: 0.25
Content-Type: application/json

{
  "brief": "Intro to Microeconomics, 14 weeks, two midterms (20% each),
            weekly problem sets, we read Freakonomics ch. 1-4 in week 3…",
  "materials": [{ "name": "old-syllabus.pdf", "contentBase64": "…" }],
  "options": {
    "voice": true,            // default true
    "lens": null,             // null = infer discipline from brief
    "artifacts": "all"        // or ["syllabus","quizBank",…]
  }
}
```

**Response: `202` + SSE stream.** Frames are exactly `PipelineSSEFrame` (machine.ts):

```
event: state
data: {"buildId":"b_01J…","state":{"state":"intake","detail":{"heard":{"weeks":14,"assessments":["Midterm 1 (20%)","Midterm 2 (20%)","weekly problem sets"],"readings":["Freakonomics ch. 1-4 (week 3)"],"discipline":"social-science"}}},"costSoFarUsd":0,"at":"…"}

event: state
data: {"buildId":"b_01J…","state":{"state":"author","pass":"B","batch":{"done":2,"total":4}},"costSoFarUsd":0.018,"at":"…"}

…

event: done
data: { <the full Course Object> }
```

Terminal failure: `event: done` with `state: blocked` and the named `BlockedReason` — partial receipts (cost so far, states reached) are always present. There is no unnamed failure.

## PATCH /courses/{id}

```http
PATCH /courses/c_01J…
Idempotency-Key: 01JA0…
Content-Type: application/json

{ "ops": [ { "type": "assessment.set_weight", "id": "A7.2", "weightPct": 25 } ],
  "actor": "instructor" }
```

```http
200 OK
{
  "applied": true,
  "seq": 41,
  "diff": [
    { "artifact": "syllabus",   "entityId": "A7.2", "change": "updated",
      "summary": "Grading table: Midterm 2 — 20% → 25%",
      "before": "Midterm 2 … 20%", "after": "Midterm 2 … 25%" },
    { "artifact": "rubrics",    "entityId": "A7.2", "change": "updated",
      "summary": "Rubric header weight updated" },
    { "artifact": "studyGuides","surfaceId": "guide:S7:exam-prep", "change": "updated",
      "summary": "Weight mention in S7 exam-prep paragraph" }
  ],
  "grade": { "structural": { "score": 100, "letter": "A", "findings": [] },
             "teachability": { "score10": 8, "dimensions": { "sameness": 8, "specificity": 8, "arc": 7 } },
             "gradedAt": "…" },
  "cost": { "usd": 0, "itemized": [] }
}
```

Atomicity: the batch applies entirely or not at all. A `kernel.refresh` or `voice.refresh` op in the batch makes `cost.usd` nonzero and itemized — nothing else may spend.

## Reads

```
GET /courses/{id}                          → the Course Object
GET /courses/{id}/artifacts/{kind}         → one rendered artifact (JSON)
GET /courses/{id}/package?format=zip       → bytes; zip ALWAYS contains
                                             QUALITY_REPORT.md + PACKAGE_MANIFEST.json
                                             (formats: zip | docx | pptx; later scorm, canvas)
GET /courses/{id}/receipt                  → { quality, provenance, cost, builds }
GET /courses/{id}/events?since={seq}       → the edit log (audit, undo, time travel)
POST /courses/{id}/chat                    → the TA; its tool calls are EditOp batches,
                                             so TA turns return EditResult diffs like
                                             any other PATCH (one edit pathway).
```

## Error taxonomy (closed set)

| Status | code                          | Meaning / contract                                                    |
| ------ | ----------------------------- | --------------------------------------------------------------------- |
| 400    | `invalid-op`                  | op shape unknown / payload malformed; names the op index              |
| 402    | `budget-exceeded`             | `X-Budget-Usd` would be crossed; response says needed vs allowed      |
| 404    | `course-not-found`            |                                                                       |
| 409    | `idempotency-replay-mismatch` | same key, different body                                              |
| 409    | `stale-seq`                   | optimistic concurrency: client's `If-Match: seq` lost the race        |
| 422    | `precondition-failed`         | op precondition (e.g. weights > 100, removing a session with dues)    |
| 422    | `contract-violation`          | model output failed lint after retry (authoring/voice contracts)      |
| 424    | `provider-failure`            | upstream model/provider down after retries; partial receipts included |

Every error body: `{ code, message, detail?, receipt?: { costSoFarUsd, states } }`. Errors carry receipts too — failure is not exempt from honesty.
