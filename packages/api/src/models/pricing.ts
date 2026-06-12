/** models/pricing.ts — published per-million-token rates. Cost is computed
 *  from PROVIDER-REPORTED usage only (trap #4, Law 9); these rates convert
 *  reported tokens to USD. Rates are config (ADR-07: model names/prices are
 *  config, never hardcoded in stages) — override via env if a provider's
 *  pricing changes. */
export interface Rate {
  inputPerM: number; // USD per 1M input tokens
  outputPerM: number; // USD per 1M output tokens (reasoning tokens billed as output)
}

export const PRICING: Record<string, Rate> = {
  'gpt-5.4-mini': { inputPerM: 0.25, outputPerM: 2.0 },
  'gpt-5-mini': { inputPerM: 0.25, outputPerM: 2.0 },
  'gpt-4o-mini': { inputPerM: 0.15, outputPerM: 0.6 },
  'deepseek-v4': { inputPerM: 0.27, outputPerM: 1.1 },
  'deepseek-chat': { inputPerM: 0.27, outputPerM: 1.1 },
  'fake-deterministic': { inputPerM: 0, outputPerM: 0 },
};

export function rateFor(model: string): Rate {
  // env override: PRICE_<MODEL>=input,output  (per million)
  const envKey = `PRICE_${model.replace(/[^A-Za-z0-9]/g, '_').toUpperCase()}`;
  const env = process.env[envKey];
  if (env) {
    const [i, o] = env.split(',').map(Number);
    if (Number.isFinite(i) && Number.isFinite(o)) return { inputPerM: i!, outputPerM: o! };
  }
  return PRICING[model] ?? { inputPerM: 0.5, outputPerM: 2.0 };
}

export function computeUsd(model: string, inputTokens: number, outputTokens: number): number {
  const r = rateFor(model);
  const usd = (inputTokens / 1e6) * r.inputPerM + (outputTokens / 1e6) * r.outputPerM;
  return Math.round(usd * 1e6) / 1e6;
}
