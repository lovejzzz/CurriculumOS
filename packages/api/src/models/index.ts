/** models/index.ts — the model factory + key validation (ADR-07).
 *  Per-provider key prefixes validated at entry (trap #5): sk- (OpenAI),
 *  sk-ant- (Anthropic), AIza (Google). Keys are never logged. */
import type { ModelPort } from '@curriculumos/core';
import { FakeModelPort } from '@curriculumos/core';
import { OpenAIModelPort } from './openai.ts';

export { OpenAIModelPort, ProviderError, redact } from './openai.ts';

export type Provider = 'openai' | 'deepseek' | 'fake';

export function validateKeyPrefix(key: string): boolean {
  return key.startsWith('sk-') || key.startsWith('sk-ant-') || key.startsWith('AIza');
}

export interface ModelEnv {
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
  DEEPSEEK_API_KEY?: string;
  DEEPSEEK_MODEL?: string;
}

/** Build the active ModelPort from env. Falls back to the fake (deterministic,
 *  $0) when no key is configured — so the API runs offline without lying about
 *  cost. The chosen provider is named in the receipt's model field (Law 9). */
export function modelFromEnv(env: ModelEnv = process.env): { port: ModelPort; provider: Provider; model: string } {
  if (env.OPENAI_API_KEY && validateKeyPrefix(env.OPENAI_API_KEY)) {
    const model = env.OPENAI_MODEL ?? 'gpt-5.4-mini';
    return {
      port: new OpenAIModelPort({ apiKey: env.OPENAI_API_KEY, model, label: 'openai', supportsReasoningEffort: true }),
      provider: 'openai',
      model,
    };
  }
  if (env.DEEPSEEK_API_KEY) {
    const model = env.DEEPSEEK_MODEL ?? 'deepseek-v4';
    return {
      port: new OpenAIModelPort({
        apiKey: env.DEEPSEEK_API_KEY,
        model,
        baseUrl: 'https://api.deepseek.com/v1',
        label: 'deepseek',
        supportsReasoningEffort: false,
      }),
      provider: 'deepseek',
      model,
    };
  }
  return { port: new FakeModelPort(), provider: 'fake', model: 'fake-deterministic' };
}
