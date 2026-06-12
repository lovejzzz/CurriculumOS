/** pipeline/cost.ts — the cost ledger accumulator (Law 9). Provider-reported
 *  tokens only (trap #4). Cost-bearing call sites are a whitelisted set; a
 *  stage may not emit cost after it completes (the trailing-events rule). */
import type { CostLedger } from '../schema/courseObject.ts';
import type { ModelPort, ModelRequest, ModelResult } from '../ports/index.ts';

export const COST_CALL_SITES = ['author', 'link', 'judge', 'items', 'voice', 'kernel.refresh'] as const;
export type CostCallSite = (typeof COST_CALL_SITES)[number];

export class BudgetExceededError extends Error {
  constructor(
    public neededUsd: number,
    public allowedUsd: number,
  ) {
    super(`budget exceeded: needed ${neededUsd.toFixed(4)} > allowed ${allowedUsd.toFixed(4)}`);
    this.name = 'BudgetExceededError';
  }
}

export class CostLedgerBuilder {
  private entries = new Map<string, CostLedger['entries'][number]>();
  constructor(public readonly budgetUsd: number = Infinity) {}

  add(stage: CostCallSite, res: ModelResult): void {
    const e = this.entries.get(stage) ?? {
      stage,
      model: res.model,
      calls: 0,
      inputTokens: 0,
      outputTokens: 0,
      reasoningTokens: 0,
      usd: 0,
    };
    e.calls += 1;
    e.inputTokens += res.usage.inputTokens;
    e.outputTokens += res.usage.outputTokens;
    e.reasoningTokens += res.usage.reasoningTokens;
    e.usd += res.usd;
    e.model = res.model;
    this.entries.set(stage, e);
    if (this.total() > this.budgetUsd + 1e-9) {
      throw new BudgetExceededError(this.total(), this.budgetUsd);
    }
  }

  total(): number {
    let t = 0;
    for (const e of this.entries.values()) t += e.usd;
    return Math.round(t * 1e6) / 1e6;
  }

  toLedger(): CostLedger {
    return { totalUsd: this.total(), entries: [...this.entries.values()] };
  }
}

/** Wrap a ModelPort so every call records into the ledger under `stage`.
 *  Lets the voice stage stay ledger-agnostic while cost stays accurate. */
export function meteredModel(inner: ModelPort, ledger: CostLedgerBuilder, stage: CostCallSite): ModelPort {
  return {
    async completeJSON(req: ModelRequest): Promise<ModelResult> {
      const res = await inner.completeJSON(req);
      ledger.add(stage, res);
      return res;
    },
  };
}
