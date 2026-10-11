// Typed errors for the 2DAI API. Every failed request throws an `ApiError`
// (or a subclass) so callers can `catch` and branch on `err.code` or on the
// concrete class. `ApiError.from()` routes a server `{error: CODE}` body to the
// most specific subclass.

export interface ApiErrorBody {
  error?: string;
  message?: string;
  [key: string]: unknown;
}

export class ApiError extends Error {
  /** Machine-readable server code, e.g. `INSUFFICIENT_CREDIT`. */
  readonly code: string;
  /** HTTP status, or 0 for client-side/network failures. */
  readonly httpStatus: number;
  /** The raw parsed error body (extra fields live here). */
  readonly details: ApiErrorBody;

  constructor(code: string, httpStatus: number, message: string, details: ApiErrorBody = {}) {
    super(message);
    this.name = new.target.name;
    this.code = code;
    this.httpStatus = httpStatus;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  /** Build the most specific error subclass from an HTTP status + body. */
  static from(httpStatus: number, body: ApiErrorBody | undefined): ApiError {
    const b: ApiErrorBody = body ?? {};
    const code = typeof b.error === 'string' && b.error ? b.error : `HTTP_${httpStatus}`;
    const msg = (typeof b.message === 'string' && b.message) ? b.message : messageForCode(code, httpStatus);

    switch (code) {
      case 'INVALID_API_KEY':
      case 'ACCOUNT_UNAVAILABLE':
        return new AuthError(code, httpStatus, msg, b);
      case 'MISSING_SCOPE':
        return new ScopeError(code, httpStatus, msg, b);
      case 'INSUFFICIENT_CREDIT':
        return new InsufficientCreditError(code, httpStatus, msg, b);
      case 'KEY_SPEND_LIMIT_REACHED':
        return new SpendLimitError(code, httpStatus, msg, b);
      case 'NSFW_REJECTED':
      case 'NSFW_REFS_BLOCKED':
        return new NsfwRejectedError(code, httpStatus, msg, b);
      case 'QUEUE_LIMIT_REACHED':
        return new QueueLimitError(code, httpStatus, msg, b);
      case 'QUEUE_ITEM_NOT_FOUND':
      case 'CREATION_NOT_FOUND':
      case 'NOT_FOUND':
      case 'KEY_NOT_FOUND':
        return new NotFoundError(code, httpStatus, msg, b);
    }
    if (code.includes('TIER')) return new TierError(code, httpStatus, msg, b);
    if (httpStatus === 429) return new RateLimitError(code, httpStatus, msg, b);
    // Code-less responses (e.g. the CDN gate replies with EMPTY bodies) route
    // by status so branch-on-class handling still works: 401 auth, 404 not
    // found, 403 generic forbidden — only genuine bad-input 4xx becomes
    // ValidationError.
    if (httpStatus === 401) return new AuthError(code, httpStatus, msg, b);
    if (httpStatus === 404) return new NotFoundError(code, httpStatus, msg, b);
    if (httpStatus === 403) return new ApiError(code, httpStatus, msg, b);
    if (httpStatus >= 400 && httpStatus < 500) return new ValidationError(code, httpStatus, msg, b);
    return new ApiError(code, httpStatus, msg, b);
  }
}

/** Bad or unusable credential — `INVALID_API_KEY`, `ACCOUNT_UNAVAILABLE`. */
export class AuthError extends ApiError {}

/** The key lacks the scope the endpoint needs — `MISSING_SCOPE`. */
export class ScopeError extends ApiError {
  get requiredScope(): string | undefined { return this.details.requiredScope as string | undefined; }
  get scopes(): string[] | undefined { return this.details.scopes as string[] | undefined; }
}

/** Not enough USD credit to run the generation — `INSUFFICIENT_CREDIT`. */
export class InsufficientCreditError extends ApiError {
  get costUsd(): number | undefined { return this.details.costUsd as number | undefined; }
  get creditUsd(): number | undefined { return this.details.creditUsd as number | undefined; }
  get deficitUsd(): number | undefined { return this.details.deficitUsd as number | undefined; }
}

/** The key hit its per-key spend cap — `KEY_SPEND_LIMIT_REACHED`.
 *  The account's main credit is unaffected; raise or remove the cap. */
export class SpendLimitError extends ApiError {
  get costUsd(): number | undefined { return this.details.costUsd as number | undefined; }
  get spentUsd(): number | undefined { return this.details.spentUsd as number | undefined; }
  get spendLimitUsd(): number | undefined { return this.details.spendLimitUsd as number | undefined; }
}

/** The tier gates this tool/quality/duration — `*_NOT_ALLOWED_FOR_TIER`, `INSUFFICIENT_TIER`. The server names the
 *  first tier that opens what was asked (`requiredTier` key, `requiredTierName` label) and ships a ready sentence in
 *  `message`; `tool` / `quality` echo the gated option when the code carries one. Nothing was charged. */
export class TierError extends ApiError {
  /** Tier key that opens the option (e.g. `tier2`), when the server knows one. */
  get requiredTier(): string | undefined { return this.details.requiredTier as string | undefined; }
  /** Tier label that opens the option (e.g. `Holder`), when the server knows one. */
  get requiredTierName(): string | undefined { return this.details.requiredTierName as string | undefined; }
  /** The gated tool on `TOOL_NOT_ALLOWED_FOR_TIER` (`video`, `video-next`, `image-next`, `style-transfer`, …). */
  get tool(): string | undefined { return this.details.tool as string | undefined; }
  /** The gated preset on `QUALITY_NOT_ALLOWED_FOR_TIER`. */
  get quality(): string | undefined { return this.details.quality as string | undefined; }
}

/** Content blocked by the moderation pass — `NSFW_REJECTED`, `NSFW_REFS_BLOCKED`. */
export class NsfwRejectedError extends ApiError {
  get nsfwRate(): number | undefined { return this.details.nsfwRate as number | undefined; }
}

/** Too many generations in flight — `QUEUE_LIMIT_REACHED`. Retry once some finish. */
export class QueueLimitError extends ApiError {
  get maxPending(): number | undefined { return this.details.maxPending as number | undefined; }
  get current(): number | undefined { return this.details.current as number | undefined; }
}

/** 404 — `QUEUE_ITEM_NOT_FOUND`, `CREATION_NOT_FOUND`. */
export class NotFoundError extends ApiError {}

/** 429 — too many requests. */
export class RateLimitError extends ApiError {}

/** Any other 4xx (bad input) — `INVALID_PROMPT`, `INVALID_STYLE`, `NO_FILE`, … */
export class ValidationError extends ApiError {}

/** The generation reached a terminal non-success state (`failed`/`cancelled`/`timeout`). */
export class GenerationFailedError extends ApiError {
  /** `detail` stays the server's internal outcome string (`CODE: detail`), as before; `outcome`
   *  adds its machine code and a human-readable message when the server sends them. */
  constructor(status: string, detail?: string, queueId?: string, outcome?: { errorCode?: string; errorMessage?: string }) {
    super('GENERATION_' + status.toUpperCase(), 0, detail || `Generation ${status}`, {
      status, queueId, errorCode: outcome?.errorCode, errorMessage: outcome?.errorMessage,
    });
  }
  get status(): string { return this.details.status as string; }
  get queueId(): string | undefined { return this.details.queueId as string | undefined; }
  /** Machine-readable outcome code (e.g. `NSFW_MAX_EXCEEDED`, `CAPACITY_FULL`) — branch on this. */
  get errorCode(): string | undefined { return this.details.errorCode as string | undefined; }
  /** Human-readable outcome to show a person. */
  get errorMessage(): string | undefined { return this.details.errorMessage as string | undefined; }
}

/** The client-side `waitFor` deadline elapsed before the queue reached a terminal state. */
export class TimeoutError extends ApiError {
  constructor(message: string, queueId?: string) {
    super('CLIENT_TIMEOUT', 0, message, { queueId });
  }
}

function messageForCode(code: string, status: number): string {
  const table: Record<string, string> = {
    INVALID_API_KEY: 'Invalid or revoked API key.',
    ACCOUNT_UNAVAILABLE: 'This account cannot use the API (banned, deleted, or terms not accepted).',
    MISSING_SCOPE: 'The API key is missing the scope required for this operation.',
    INSUFFICIENT_CREDIT: 'Not enough credit to run this generation.',
    KEY_SPEND_LIMIT_REACHED: 'This API key reached its spend cap.',
    NSFW_REJECTED: 'Content was rejected by the moderation pass.',
    NSFW_REFS_BLOCKED: 'One or more reference images were flagged NSFW.',
    QUEUE_LIMIT_REACHED: 'Too many generations are in progress. Wait for some to finish.',
    QUEUE_ITEM_NOT_FOUND: 'No such queue item.',
    CREATION_NOT_FOUND: 'No such creation.',
    KEY_POLICY_CHANNEL: 'This API key cannot submit to that model channel (see me().key.modelChannels).',
    IMAGE_MODEL_UNAVAILABLE: 'That image model is not available on this server.',
    VIDEO_MODEL_UNAVAILABLE: 'That video model is not available on this server.',
  };
  return table[code] || `Request failed (${code}, HTTP ${status}).`;
}
