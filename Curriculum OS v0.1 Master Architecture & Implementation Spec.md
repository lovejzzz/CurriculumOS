
# Curriculum OS v0.1 Master Architecture & Implementation Spec

**Target Audience:** AI Coder / Autonomous Dev Agent
**Tech Stack Context:** React/Next.js (Frontend), Tailwind CSS, Node.js/TypeScript (Backend), Prisma (ORM), PostgreSQL.
**System Goal:** An AI-driven curriculum design system based on a deterministic State Machine, Single Source of Truth (SSOT), and Directed Acyclic Graph (DAG) dependency tracking.

---

## PART 1: Core Architecture

### 0. Core Architectural Principles (STRICT RULES)
1. **Single Source of Truth (SSOT):** The `CourseModel` (JSON) is the ONLY source of truth. Documents/Artifacts are read-only render targets.
2. **No Direct LLM Patching:** The LLM NEVER generates raw JSON Patches. The LLM acts as an operator that outputs structured `IntentOps`. The Backend Engine translates `IntentOps` into standard JSON Patches.
3. **Draft/Commit Pattern:** State changes that violate constraints (e.g., Grading != 100%) MUST yield a `DraftPlan` with conflicts. The database is NOT updated until the user resolves conflicts and triggers a `Commit`.
4. **Pure Function Generators:** Content Generators (e.g., Assignment, Rubric) DO NOT read previous outputs. They generate content purely from the current `CourseModel` subset.
5. **The Override Layer:** Manual human edits to text do NOT mutate the `CourseModel`. They are saved in an `Override` object tied to a specific `SectionID`.
6. **Plugin-Based Extensibility:** Core engine logic MUST be strictly separated from specific deliverable logic (e.g., Assignment, Quiz). All content generators MUST be implemented as independent plugins registered via a central Registry. No hardcoded `if/else` statements for specific artifact types in the main engine.
7. **Prompt Decoupling:** LLM System Prompts MUST NOT be embedded deeply within business logic functions. They should be stored in isolated configuration files or a registry.

### 1. Core Data Models (TypeScript Interfaces)

#### 1.1 Course Model (The SSOT)
All IDs must be UUIDs or stable prefixed strings (e.g., `LO-1`, `A-2`).
*Note: The `version` inside the `CourseModel` JSON MUST strictly sync with the `versionNumber` of the `CourseVersion` Prisma record when persisting.*

```typescript
interface CourseModel {
  courseId: string;
  version: number; 
  meta: {
    title: string;
    durationWeeks: number;
    audience: string;
  };
  learningOutcomes: Array<{
    id: string; // e.g., "LO-1"
    text: string;
  }>;
  policies: {
    grading: Array<{
      id: string; // e.g., "G-1"
      name: string;
      weight: number; // MUST sum to 100 globally
    }>;
  };
  assessments: Array<{
    id: string; // e.g., "A-1"
    type: "reflection" | "project" | "essay" | "quiz";
    count: number;
    rubricRequired: boolean;
    linkedOutcomes: string[]; // references LO ids
  }>;
  weeks: Array<{
    id: string; // e.g., "W-1"
    theme: string;
    deliverables: string[]; // references Assessment IDs + instance (e.g., "A-1#instance1")
  }>;
}

```

#### 1.2 Artifact & Section State (The Override Layer)

Documents are split into stable sections. This prevents AI from overwriting human fine-tuning.

```typescript
interface ArtifactSection {
  sectionId: string; // DB ID
  artifactId: string; 
  sectionKey: string; // Stable business ID e.g., "A-1-rubric"
  modelDependencies: string[]; // JSON Paths, e.g., ["/assessments/A-1"]
  
  // The Pure Function Output
  generatedContent: string; // Markdown
  
  // The Human Override Layer
  overrideContent: string | null; // Sanitized HTML
  isLocked: boolean; // If true, rendering engine uses overrideContent
  
  // Sync tracking
  lastGeneratedModelVersion: number; 
}

```

### 2. Intent Ops API (The LLM Contract)

When processing natural language edits, the LLM MUST output an array of `IntentOp` objects.

```typescript
type IntentOp = 
  | { op: "ADD_ASSESSMENT"; payload: { type: string; linkedOutcomes?: string[]; targetWeek?: string } }
  | { op: "UPDATE_GRADING_WEIGHT"; payload: { assessmentId: string; newWeight: number } }
  | { op: "ADD_WEEK"; payload: { insertAfterWeekId: string } }
  | { op: "REASSIGN_DELIVERABLE"; payload: { assessmentInstanceId: string; newWeekId: string } };

// Example LLM Output for "Change participation to 5%":
// [{ "op": "UPDATE_GRADING_WEIGHT", "payload": { "assessmentId": "participation", "newWeight": 5 } }]

```

### 3. Orchestrator State Machine (Draft & Commit Workflow)

**Phase 1: Engine Pipeline (`calculate_impact`)**

1. Receive `IntentOp[]`.
2. Map `IntentOp[]` to standard `JSONPatch[]`.
3. Apply patches to an *in-memory clone* of `CourseModel`.
4. Validate constraints (e.g., Check if `SUM(policies.grading.weight) === 100`).
5. Traverse the **DAG** to find impacted generators.
6. Return `DraftPlan`.

```typescript
interface DraftPlan {
  planId: string;
  proposedPatches: JSONPatch[];
  impactedGenerators: string[]; // e.g., ["CourseMap", "AssignmentPack"]
  conflicts: Array<{
    type: "GRADING_SUM_INVALID" | "WEEK_OUT_OF_BOUNDS" | "MISSING_DELIVERABLE_SLOT";
    message: string;
    requiredAction: string;
  }>;
  isCommittable: boolean; // MUST be false if conflicts.length > 0
}

```

**Phase 2: Commit & Regenerate (`commit_plan`)**

1. Assert `DraftPlan.isCommittable === true`.
2. Apply `proposedPatches` to the Database `CourseModel`. Increment `version`.
3. Dispatch background jobs to run `impactedGenerators`.

### 4. Dependency Graph (DAG) Registry

The Engine uses this mapping to determine which generators to trigger based on the `JSONPatch` path prefix.

| JSON Path Prefix Modified | Triggered Generators |
| --- | --- |
| `/meta` | `CourseMapGen` |
| `/learningOutcomes` | `CourseMapGen`, `AssignmentPackGen`, `RubricGen` |
| `/policies/grading` | `CourseMapGen` |
| `/assessments/{id}` | `AssignmentPackGen`, `CourseMapGen`, `RubricGen` (if required), `WeeklyPlanGen` |
| `/weeks/{id}` | `WeeklyPlanGen`, `CourseMapGen` |

### 5. UI Rendering & Override Resolution Logic

When the Frontend requests a Document (Artifact) to display, the Backend MUST assemble it using this precise logic.
*Note: The UI must be prepared to render `generatedContent` as Markdown and `overrideContent` as sanitized HTML.*

```typescript
function renderArtifact(sections: ArtifactSection[], currentModelVersion: number) {
  return sections.map(section => {
    // 1. Check if human locked the section
    if (section.isLocked && section.overrideContent) {
      // 2. Warn if the underlying structural model changed since the lock
      const isOutOfSync = section.lastGeneratedModelVersion < currentModelVersion;
      
      return {
        content: section.overrideContent, // Render as HTML
        warning: isOutOfSync ? "Structural data changed. Your manual edits may be outdated." : null
      };
    }
    
    // 3. Default to AI-generated SSOT content
    return {
      content: section.generatedContent, // Render as Markdown
      warning: null
    };
  });
}

```

### 6. Generator Plugin Architecture (The Extensibility Contract)

To allow team members to add new curriculum artifacts without altering the core Orchestrator or Database schema, all generators MUST implement the `DeliverableGenerator` interface and be registered in `GENERATOR_REGISTRY`.

```typescript
// Draft type for returning from pure functions (no DB IDs required)
type GeneratedSectionDraft = {
  sectionKey: string;
  modelDependencies: string[];
  generatedContent: string;
}

interface DeliverableGenerator {
  pluginId: string;          // Unique ID, e.g., "discussion_prompts"
  displayName: string;       // For UI rendering, e.g., "Discussion Prompts"
  description: string;       // Injected into LLM Intent Parser prompt automatically
  
  // DAG Registration: Which JSON paths trigger this generator?
  dependsOnPaths: string[];  // e.g., ["/weeks/*"]
  
  // The Pure Function logic
  generate: (model: CourseModel, currentVersion: number) => Promise<GeneratedSectionDraft[]>;
}

```

```typescript
// src/generators/registry.ts
export const GENERATOR_REGISTRY: DeliverableGenerator[] = [
  CourseMapGen,
  AssignmentPackGen,
  // Future coworkers will simply import and add their new generators here.
];

```

### 7. Frontend UI Architecture Boundaries (The 3-Pane Layout)

The Frontend MUST enforce the SSOT principle visually through a strictly decoupled layout.

* **Pane 1: Course Navigator (Left - Structural SSOT)**
* **Purpose:** Render and edit the `CourseModel` (JSON) directly via schema-driven UI forms. Actions here trigger `IntentOps` via the Copilot pane workflow.


* **Pane 2: The Workbench (Middle - Preview & Override)**
* **Purpose:** Display context-aware content based on Pane 1 selection.
* **Override Entry:** Hovering over a generated section reveals an `[Edit & Lock]` button. Clicking it opens a rich-text editor that saves to the `overrideContent` field in the database.


* **Pane 3: Copilot & Impact Panel (Right - Negotiation & Commit)**
* **Purpose:** Handle all non-deterministic LLM interactions and State Commits. Displays the `DraftPlan` in a "Review Changes" card showing `impactedGenerators` and `conflicts`.



---

## PART 2: Database Schema & API Contracts

### 1. Database Schema Spec (Prisma ORM)

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Course {
  id        String   @id @default(uuid())
  title     String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  versions  CourseVersion[]
  artifacts Artifact[]
}

model CourseVersion {
  id             String   @id @default(uuid())
  courseId       String
  versionNumber  Int      // 递增版本号：1, 2, 3...
  
  // SSOT Data
  modelData      Json     // 对应 CourseModel 接口
  
  commitReason   String?  
  createdAt      DateTime @default(now())

  course         Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  sections       ArtifactSection[] 
}

model Artifact {
  id          String   @id @default(uuid())
  courseId    String
  type        String   // "CourseMap" | "WeeklyPlan" | "AssignmentPack" | "Rubrics"
  title       String
  updatedAt   DateTime @updatedAt

  course      Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  sections    ArtifactSection[]
}

model ArtifactSection {
  id               String   @id @default(uuid())
  artifactId       String
  versionId        String   
  sectionKey       String   // 稳定的业务 ID，例如 "A-1-rubric"
  modelDependencies Json    // 字符串数组：["/assessments/A-1"]
  
  generatedContent String   @db.Text
  overrideContent  String?  @db.Text
  isLocked         Boolean  @default(false)
  
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  artifact         Artifact      @relation(fields: [artifactId], references: [id], onDelete: Cascade)
  courseVersion    CourseVersion @relation(fields: [versionId], references: [id])

  @@unique([artifactId, sectionKey]) 
}

```

### 2. API / RPC Contract (RESTful & Types)

* **POST `/api/courses/:courseId/intents/draft**`
* **Description:** Translates intents to a DraftPlan.
* **Fallback:** If the LLM returns invalid JSON or unmapped `IntentOps`, the backend MUST return a `400 Bad Request` with `{ error: "INTENT_PARSE_FAILED", rawResponse: "..." }`.
* **Request Body:** `{ "ops": [{ "op": "ADD_ASSESSMENT", "payload": { "type": "essay", "targetWeek": "W-3" } }] }`
* **Response (200 OK):** `{ "planId": "...", "impactedGenerators": [...], "conflicts": [...], "isCommittable": false }`


* **POST `/api/courses/:courseId/intents/commit**`
* **Description:** Applies changes, creates `CourseVersion`, triggers generators.
* **Request Body:** `{ "planId": "plan-uuid-1234" }`
* **Response (200 OK):** `{ "success": true, "newVersionNumber": 4 }`


* **PUT `/api/courses/:courseId/sections/:sectionId/override**`
* **Description:** Saves manual rich-text edits and locks the section.
* **Request Body:** `{ "overrideContent": "<p>Teacher polished content</p>", "isLocked": true }`



---

## PART 3: LLM Prompt & Tool Schema Registry

### 1. System Prompt (Intent Parser)

```text
You are the Intent Parsing Engine for a Curriculum Operating System.
Your job is to translate the user's natural language requests regarding curriculum changes into structured API operations (IntentOps).
You do NOT generate the curriculum content. You only orchestrate the structural changes.

Rules:
1. Map the user's intent to one or more available tool calls.
2. If the user asks to "add an assignment", use the `add_assessment` tool.
3. If the user asks to change the weight of a grading policy, use the `update_grading_weight` tool.
4. If a request is ambiguous, make the safest assumption based on standard pedagogical practices.

```

### 2. Tool JSON Schema (Function Calling)

```json
[
  {
    "type": "function",
    "function": {
      "name": "add_assessment",
      "description": "Add a new assessment/assignment to the course structure.",
      "parameters": {
        "type": "object",
        "properties": {
          "type": { "type": "string", "enum": ["reflection", "project", "essay", "quiz", "exam"] },
          "targetWeek": { "type": "string", "description": "The week ID where this is due, e.g., 'W-3'." },
          "weight": { "type": "number", "description": "The percentage of the total grade." }
        },
        "required": ["type"]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "update_grading_weight",
      "description": "Modify the grading percentage weight of an existing assessment.",
      "parameters": {
        "type": "object",
        "properties": {
          "assessmentId": { "type": "string", "description": "The ID of the assessment, e.g., 'A-1'." },
          "newWeight": { "type": "number", "description": "The new weight percentage (0-100)." }
        },
        "required": ["assessmentId", "newWeight"]
      }
    }
  }
]

```

---

## PART 4: UX Interaction & State Flow Spec

### 1. Global UI State Management

The Frontend MUST maintain a global state (e.g., via React Context or Redux) to handle the `Draft -> Commit` lifecycle.

* `courseModel`: The current saved JSON state (SSOT).
* `activeDraft`: Null by default. Populated when the user attempts a change that requires recalculation.
* `activeSelection`: `{ type: "node", id: string } | { type: "artifact", id: string } | null` (Determines what is shown in the Middle Pane Workbench).

### 2. Core Workflow A: The "Copilot Intent" Flow (Natural Language)

* **Step 1: Input (Idle State)** User types in Copilot (Right Pane) and sends.
* **Step 2: Processing (Loading State)** UI shows non-blocking loader. Frontend calls: `POST /api/courses/{id}/intents/draft`.
* **Step 3: Review & Negotiate (Draft State)** Right Pane expands into "Review Changes" card. Shows green/red diff. If `isCommittable === false`, UI MUST render interactive form fields inside the Copilot pane to resolve conflicts.
* **Step 4: Commit (Resolution State)** User resolves conflicts and clicks "Apply Changes". Frontend calls: `POST /api/courses/{id}/intents/commit`. UI fetches updated `CourseModel`.

### 3. Core Workflow B: The "Structured Edit" Flow (Form Editing)

**Direct UI clicks MUST follow the same Draft/Commit pipeline as AI commands.**

* **Step 1: User Edit** User changes a value in the Left Pane (e.g., Participation weight).
* **Step 2: Intercept & Draft** Frontend translates action to `IntentOp` (e.g., `[{ op: "UPDATE_GRADING_WEIGHT", payload: { assessmentId: "participation", newWeight: 5 } }]`) and silently calls `draft` API.
* **Step 3: Unsaved Changes & Conflict UI** If Draft returns a conflict, input turns Red. A sticky "Unsaved Changes" bar appears: *"Curriculum constraints violated."* Once fixed, bar turns green, user clicks Save (triggers Commit).

### 4. Core Workflow C: The "Manual Polish" Flow (Override Layer)

* **Step 1: Reading Mode** User selects Artifact. Middle Pane renders `ArtifactSection[]` as read-only Markdown.
* **Step 2: Enter Override Mode** User hovers over section, clicks `[Edit Text 🔒]`. Markdown swaps to Rich Text Editor.
* **Step 3: Save & Lock** User saves. Frontend calls `override` API with `isLocked: true`. UI collapses back to read-only but displays permanent 🔒 icon.

---

## PART 5: Implementation Epic & Ticket List

### Epic 1: Core Data & State Machine (Backend Core)

* **[Ticket 1.1]** Initialize Prisma Schema, run DB migration.
* **[Ticket 1.2]** Implement `CourseModel` CRUD.
* **[Ticket 1.3]** Implement `JSONPatch` logic with unit tests.
* **[Ticket 1.4]** Implement Constraint Validator middleware (e.g., Grading sum == 100).

### Epic 2: The DAG & Orchestrator (Engine)

* **[Ticket 2.1]** Build `DependencyRegistry` based on JSON Path prefixes.
* **[Ticket 2.2]** Implement `/api/.../draft` endpoint.
* **[Ticket 2.3]** Implement `/api/.../commit` endpoint with DB versioning.

### Epic 3: LLM Integration & Generators (AI Layer)

* **[Ticket 3.1]** Implement `Intent Parser` via OpenAI/Gemini SDK using Function Calling schema. Ensure fallback handling.
* **[Ticket 3.2]** Implement `CourseMapGen` as the first plugin using the `DeliverableGenerator` contract.
* **[Ticket 3.3]** Connect generator execution to the `commit` endpoint flow.

### Epic 4: Frontend UI & Override Layer (Client)

* **[Ticket 4.1]** Build 3-Pane Dashboard skeleton. Connect Pane 1 to `CourseModel` JSON.
* **[Ticket 4.2]** Build Draft & Commit interaction UI in Pane 3 (Review Changes & Conflicts).
* **[Ticket 4.3]** Build Artifact Renderer in Pane 2. Implement logic switching between `generatedContent` (Markdown) and `overrideContent` (HTML).

```

```