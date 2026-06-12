/** errors.ts — the closed error taxonomy (010-schema/api.md). Every error body
 *  carries a receipt too — failure is not exempt from honesty (Law 6/9). */
export type ErrorCode =
  | 'invalid-op'
  | 'budget-exceeded'
  | 'course-not-found'
  | 'idempotency-replay-mismatch'
  | 'stale-seq'
  | 'precondition-failed'
  | 'contract-violation'
  | 'provider-failure'
  | 'unsupported-format'
  | 'bad-request';

const STATUS: Record<ErrorCode, number> = {
  'invalid-op': 400,
  'bad-request': 400,
  'budget-exceeded': 402,
  'course-not-found': 404,
  'idempotency-replay-mismatch': 409,
  'stale-seq': 409,
  'precondition-failed': 422,
  'contract-violation': 422,
  'provider-failure': 424,
  'unsupported-format': 400,
};

export class ApiError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public detail?: unknown,
    public receipt?: { costSoFarUsd: number; states: string[] },
  ) {
    super(message);
    this.name = 'ApiError';
  }
  get status(): number {
    return STATUS[this.code];
  }
  body(): Record<string, unknown> {
    return {
      code: this.code,
      message: this.message,
      ...(this.detail !== undefined ? { detail: this.detail } : {}),
      ...(this.receipt ? { receipt: this.receipt } : {}),
    };
  }
}
