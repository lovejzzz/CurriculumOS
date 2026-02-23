
Before we begin implementation, I have a few clarifying questions regarding the tech stack and specific implementation details:

Next.js Architecture: Are we using the App Router or Pages Router? Are the backend API contracts (/api/...) going to be implemented as Next.js Route Handlers/Server Actions, or are we building a completely separate Node.js (e.g., Express/NestJS) backend service?
State Management: The spec mentions React Context or Redux for global UI state. Do you have a strict preference, or would you be open to using Zustand, which is typically lighter and excellent for this kind of Draft/Commit state?
Generators & LLMs: For the DeliverableGenerator plugins (e.g., CourseMapGen), do these use LLMs under the hood to generate the Markdown, or are they deterministic template string builders? If they use LLMs, do we need to implement a websocket/SSE architecture to stream the background generation status to the frontend?
LLM Provider: Which LLM provider(s) (e.g., OpenAI, Anthropic) are we initially targeting for the Intent Parsing Engine? This will determine the specific function-calling SDK we use.
Starting Point: Which Epic or specific ticket would you like to tackle first? (I recommend starting with Epic 1: Prisma Schema & CourseModel CRUD to establish the SSOT foundation).



Answer:
---

Excellent questions. It is great that we are aligned on the architecture. Here are the definitive technical decisions for this MVP:

**1. Next.js Architecture**

* **Router:** Use the modern **Next.js App Router** (`app/` directory).
* **Backend:** Do NOT build a separate Node.js service. Implement all backend API contracts (`/api/...`) as Next.js **Route Handlers** within the same repository. We want a unified full-stack monorepo for MVP velocity.

**2. State Management**

* **Tool:** I highly encourage using **Zustand**. You are right; it is much lighter than Redux and avoids the re-rendering complexities of React Context.
* **Implementation:** Create a centralized store to manage the `courseModel` (SSOT), `activeDraft` (Draft/Commit lifecycle), and `activeSelection` (3-Pane UI view state).

**3. Generators & LLMs (Streaming vs. Blocking)**

* **Logic:** The `DeliverableGenerator` plugins *will* use LLMs under the hood (combined with deterministic data mapping). They are not just simple string templates.
* **Streaming:** For v0.1 MVP, **do NOT implement WebSockets or SSE.** Keep the infrastructure simple. Use standard asynchronous API calls (`await`). The Frontend should handle this by simply showing a blocking "Generating Artifacts..." loading state while the backend waits for the LLM to return the Markdown. We will optimize with SSE in a later epic.

**4. LLM Provider**

* **Provider:** Target **OpenAI** (specifically the `gpt-4o` class models) for the Intent Parsing Engine, as our Tool JSON Schema in the spec is natively aligned with OpenAI's Function Calling API.
* **SDK:** Feel free to use the official OpenAI Node.js SDK, or the Vercel AI SDK (`ai` / `@ai-sdk/openai`) if you prefer their standardized core API (`generateObject`, `generateText`, etc.).

**5. Starting Point**

* I agree completely. Please begin with **Epic 1: Core Data & State Machine**.
* Start specifically with **Ticket 1.1 (Prisma Schema setup)** and **Ticket 1.2 (CourseModel CRUD)**.

Please go ahead and initialize the project, set up Prisma, and write the schema. Let me know when you have the Prisma schema ready for review or if you run into any setup blockers!