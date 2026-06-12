/** models/openai.ts — the OpenAI ModelPort (ADR-07). Lives outside core (it
 *  uses fetch). Per-provider quirks live ONLY here: JSON-mode requires the word
 *  "JSON" in the prompt (trap #1, asserted), reasoning is a per-stage knob
 *  (trap #3), usage is provider-reported (trap #4). OpenAI-compatible: the
 *  DeepSeek port reuses this with a different baseURL + model. */
import type { ModelPort, ModelRequest, ModelResult } from '@curriculumos/core';
import { computeUsd } from './pricing.ts';

export interface OpenAIPortConfig {
  apiKey: string;
  model: string;
  baseUrl?: string; // default https://api.openai.com/v1
  label?: string; // provider label for errors
  /** some providers reject reasoning_effort — disable per provider */
  supportsReasoningEffort?: boolean;
  maxRetries?: number;
}

export class ProviderError extends Error {
  constructor(
    public provider: string,
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

export class OpenAIModelPort implements ModelPort {
  constructor(private cfg: OpenAIPortConfig) {}

  async completeJSON(req: ModelRequest): Promise<ModelResult> {
    // trap #1: json_object mode requires the literal word "JSON" in the prompt
    const userWithPayload =
      req.payload !== undefined ? `${req.user}\n\nInput (JSON):\n${JSON.stringify(req.payload)}` : req.user;
    const user = /json/i.test(userWithPayload) ? userWithPayload : `${userWithPayload}\n\nReturn JSON.`;

    const body: Record<string, unknown> = {
      model: this.cfg.model,
      messages: [
        { role: 'system', content: req.system },
        { role: 'user', content: user },
      ],
      response_format: { type: 'json_object' },
    };
    if (req.maxOutputTokens) body.max_completion_tokens = req.maxOutputTokens;
    if (req.reasoning && this.cfg.supportsReasoningEffort !== false) body.reasoning_effort = req.reasoning;

    const baseUrl = this.cfg.baseUrl ?? 'https://api.openai.com/v1';
    const maxRetries = this.cfg.maxRetries ?? 4;
    let lastErr: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const resp = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${this.cfg.apiKey}` },
          body: JSON.stringify(body),
        });
        if (!resp.ok) {
          const text = await resp.text().catch(() => '');
          // retry transient 429/5xx; fail fast on 4xx auth/shape errors.
          // 429s are TPM windows — Retry-After (when sent) or exponential
          // seconds-scale backoff; a 250ms wait just burns the retry budget
          // (the V0.0.1 audit's geology/world-lit provider-failures).
          if ((resp.status === 429 || resp.status >= 500) && attempt < maxRetries) {
            const retryAfter = Number(resp.headers.get('retry-after'));
            const backoffMs = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 1000 * 3 ** attempt; // 1s, 3s, 9s, 27s
            await delay(Math.min(backoffMs, 30_000));
            continue;
          }
          throw new ProviderError(this.cfg.label ?? 'openai', resp.status, redact(text).slice(0, 300));
        }
        const data = (await resp.json()) as OpenAIResponse;
        const content = data.choices?.[0]?.message?.content ?? '{}';
        let json: unknown;
        try {
          json = JSON.parse(content);
        } catch {
          json = extractJson(content);
        }
        const usage = data.usage ?? { prompt_tokens: 0, completion_tokens: 0 };
        const reasoningTokens = usage.completion_tokens_details?.reasoning_tokens ?? 0;
        const inputTokens = usage.prompt_tokens ?? 0;
        const outputTokens = usage.completion_tokens ?? 0;
        return {
          json,
          usage: { inputTokens, outputTokens, reasoningTokens },
          model: data.model ?? this.cfg.model,
          usd: computeUsd(data.model ?? this.cfg.model, inputTokens, outputTokens),
        };
      } catch (err) {
        lastErr = err;
        if (err instanceof ProviderError && err.status < 500 && err.status !== 429) throw err;
        if (attempt < maxRetries) {
          await delay(250 * (attempt + 1));
          continue;
        }
      }
    }
    throw lastErr instanceof Error ? lastErr : new ProviderError(this.cfg.label ?? 'openai', 0, 'provider failed after retries');
  }
}

interface OpenAIResponse {
  model?: string;
  choices?: { message?: { content?: string } }[];
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    completion_tokens_details?: { reasoning_tokens?: number };
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function extractJson(text: string): unknown {
  const m = text.match(/\{[\s\S]*\}/);
  if (m) {
    try {
      return JSON.parse(m[0]);
    } catch {
      /* fall through */
    }
  }
  return {};
}

/** Redaction patterns cover all three key prefixes (trap #5) — applied before
 *  any provider text reaches a log line. */
export function redact(text: string): string {
  return text.replace(/sk-[A-Za-z0-9_-]{10,}/g, 'sk-***').replace(/AIza[A-Za-z0-9_-]{10,}/g, 'AIza***');
}
