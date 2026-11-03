// Queue namespace + the shared polling loop used by `generate.*({ wait: true })`.

import { ApiError, TimeoutError } from './errors';
import { normalizeQueue, TERMINAL_STATUSES } from './internal';
import type { Http } from './http';
import type { QueueState, WaitOptions } from './types';

export interface QueueNamespace {
  /** One-shot status read. */
  get(queueId: string, signal?: AbortSignal): Promise<QueueState>;
  /** Poll until the item reaches a terminal state (or the deadline). Resolves
   *  on ANY terminal status — inspect `.status`; it does not throw on failure.
   *  Without `timeoutMs` the deadline is 5 min, 20 min for a video job. */
  waitFor(queueId: string, opts?: WaitOptions): Promise<QueueState>;
  /** Cancel a PENDING item — the charge is refunded and the queue slot
   *  released. Only works before a worker picks the job up: once it is
   *  processing there is no abort hook and the server answers 409
   *  `NOT_PENDING` (with the current status in `details.status`). */
  cancel(queueId: string, signal?: AbortSignal): Promise<{ queueId: string; status: 'cancelled' }>;
}

/** Default deadline of a video job (`generate.video`, `similar` or `queue.waitFor` of a clip) when the caller sets no
 *  `timeoutMs`: a clip renders for minutes, long ones well past the 5 min default. */
export const VIDEO_WAIT_TIMEOUT_MS = 1_200_000;

export function createQueue(http: Http): QueueNamespace {
  return {
    get: (queueId, signal) => getQueue(http, queueId, signal),
    waitFor: (queueId, opts) => pollQueue(http, queueId, { ...opts, videoTimeoutMs: opts?.timeoutMs === undefined ? VIDEO_WAIT_TIMEOUT_MS : undefined }),
    cancel: (queueId, signal) =>
      http.request('POST', `/v1/queue/${encodeURIComponent(queueId)}/cancel`, { idempotent: false, signal }),
  };
}

export async function getQueue(http: Http, queueId: string, signal?: AbortSignal): Promise<QueueState> {
  const raw = await http.request<any>('GET', `/v1/queue/${encodeURIComponent(queueId)}`, { idempotent: true, signal });
  return normalizeQueue(raw, http.baseUrl);
}

export async function pollQueue(http: Http, queueId: string, opts: WaitOptions & { videoTimeoutMs?: number } = {}): Promise<QueueState> {
  const intervalMs = Math.max(250, opts.intervalMs ?? 2000);
  let timeoutMs = Math.max(1000, opts.timeoutMs ?? 300_000);
  const startedAt = Date.now();
  let deadline = startedAt + timeoutMs;
  for (;;) {
    // A caller abort is a CANCEL, not a deadline — surface the same typed
    // `ABORTED` the transport throws when the abort lands mid-GET, so the
    // caller sees ONE class for one action regardless of timing.
    if (opts.signal?.aborted) throw new ApiError('ABORTED', 0, 'Wait aborted.', { queueId });
    const state = await getQueue(http, queueId, opts.signal);
    if (TERMINAL_STATUSES.has(state.status)) return state;
    // A job whose kind was unknown up front (`similar`, `queue.waitFor`) turns out to be a clip: give it the video deadline.
    if (opts.videoTimeoutMs !== undefined && (state.videoModel !== undefined || state.videoEngine !== undefined) && opts.videoTimeoutMs > timeoutMs) {
      timeoutMs = opts.videoTimeoutMs;
      deadline = startedAt + timeoutMs;
    }
    if (Date.now() + intervalMs >= deadline) {
      throw new TimeoutError(`Generation ${queueId} did not finish within ${timeoutMs}ms (last status: ${state.status}).`, queueId);
    }
    await sleep(intervalMs, opts.signal);
  }
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    // The abort handler must be REMOVED when the timer fires normally, else a
    // long-lived signal accumulates one dead listener per poll iteration
    // (Node warns at 11 and a 5-minute wait would stack ~150).
    const onAbort = () => { clearTimeout(t); resolve(); };
    const t = setTimeout(() => {
      if (signal) signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    if (signal) signal.addEventListener('abort', onAbort, { once: true });
  });
}
