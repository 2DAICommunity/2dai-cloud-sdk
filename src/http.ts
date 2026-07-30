// Low-level transport: auth injection, JSON/multipart/bytes requests, typed
// error mapping, and bounded retries for idempotent GETs. Internal — not
// exported from the package root.

import { ApiError } from './errors';
import type { ClientOptions, Integration } from './types';

const DEFAULT_BASE_URL = 'https://dapp.2dai.io:444';
/** Must equal `package.json`'s version — the User-Agent is how the server
 *  identifies the client, and a stale value here silently reports the wrong one
 *  (it read 2.0.0 while every 2.0.x shipped). `scripts/check-version.mjs` runs on
 *  `prepublishOnly` and fails the publish if this and `package.json` diverge —
 *  importing package.json instead would leak a JSON module into the dual
 *  ESM/CJS build. */
export const SDK_VERSION = '2.1.0';

/** The exact token each integration announces. Closed on purpose: the server's
 *  `machineSourceFromUserAgent` matches these as whole `name/semver` words to
 *  derive a creation's `source`, so an arbitrary string here would either be
 *  ignored or — worse — mislabel someone's work. */
const INTEGRATION_TOKEN: Record<Exclude<Integration, 'sdk'>, string> = {
  mcp: '2dai-mcp-server',
};

/** Only a real semver reaches the wire. The server requires `x.y.z` (with an
 *  optional prerelease/build suffix) and ignores anything else, so a malformed
 *  version would produce a token that looks official but attributes nothing.
 *  Substitute `0.0.0` rather than omitting the version: the token still has to
 *  match `name/x.y.z` for the integration to be recognised at all, so an honest
 *  placeholder beats losing the attribution. */
const SEMVER = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/;

export function buildUserAgent(integration?: Integration, integrationVersion?: string): string {
  const base = `2dai-cloud-sdk/${SDK_VERSION}`;
  if (!integration || integration === 'sdk') return base;
  const name = INTEGRATION_TOKEN[integration];
  if (!name) return base;
  const version = integrationVersion && SEMVER.test(integrationVersion) ? integrationVersion : '0.0.0';
  return `${base} ${name}/${version}`;
}

interface RequestOptions {
  json?: unknown;
  form?: FormData;
  query?: Record<string, string | number | undefined>;
  signal?: AbortSignal;
  /** Safe to auto-retry on 429/5xx/network (never set for generation submits). */
  idempotent?: boolean;
  /** Per-request override of the client timeout (e.g. large uploads). */
  timeoutMs?: number;
}

export class Http {
  readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly ua: string;

  constructor(opts: ClientOptions) {
    if (!opts || typeof opts.apiKey !== 'string' || !opts.apiKey.trim()) {
      throw new ApiError('MISSING_API_KEY', 0, 'A `2dai_sk_...` apiKey is required to construct the client.');
    }
    this.apiKey = opts.apiKey.trim();
    this.baseUrl = (opts.baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, '');
    const f = opts.fetch || (globalThis as any).fetch;
    if (typeof f !== 'function') {
      throw new ApiError('NO_FETCH', 0, 'No global fetch found. Use Node 18+ or pass `fetch` in ClientOptions.');
    }
    this.fetchImpl = f;
    this.timeoutMs = opts.timeoutMs ?? 60_000;
    this.maxRetries = Math.max(0, opts.maxRetries ?? 2);
    this.ua = buildUserAgent(opts.integration, opts.integrationVersion);
  }

  /** JSON request → parsed T. Throws a typed ApiError on any non-2xx. */
  async request<T>(method: string, path: string, opts: RequestOptions = {}): Promise<T> {
    const url = this.buildUrl(path, opts.query);
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      Accept: 'application/json',
      'User-Agent': this.ua,
    };
    let body: string | FormData | undefined;
    if (opts.form) {
      body = opts.form; // fetch sets the multipart boundary itself
    } else if (opts.json !== undefined) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(opts.json);
    }
    const { res, finish } = await this.send(method, url, headers, body, opts.signal, opts.idempotent === true, opts.timeoutMs);
    // The timer + abort wiring stay armed until the BODY is fully consumed —
    // a server that sends headers then stalls mid-body still times out, and a
    // caller abort during the body read cancels the download.
    try {
      return await this.parseJson<T>(res);
    } catch (err: any) {
      throw this.mapBodyError(err, opts.signal);
    } finally {
      finish();
    }
  }

  /** GET raw bytes (CDN downloads). Throws ApiError on non-2xx. */
  async requestBytes(path: string, signal?: AbortSignal): Promise<{ bytes: Uint8Array; contentType: string }> {
    const url = this.buildUrl(path);
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      'User-Agent': this.ua,
    };
    const { res, finish } = await this.send('GET', url, headers, undefined, signal, true, undefined);
    try {
      if (!res.ok) throw await this.errorFromResponse(res);
      const buf = new Uint8Array(await res.arrayBuffer());
      return { bytes: buf, contentType: res.headers.get('content-type') || 'application/octet-stream' };
    } catch (err: any) {
      throw this.mapBodyError(err, signal);
    } finally {
      finish();
    }
  }

  /** Body-read rejections carry the abort reason (our TIMEOUT ApiError) or a
   *  runtime AbortError — normalise them to the same typed errors the
   *  header-phase throws. Already-typed errors pass through. */
  private mapBodyError(err: any, signal: AbortSignal | undefined): ApiError {
    if (err instanceof ApiError) return err;
    if (signal?.aborted) return new ApiError('ABORTED', 0, 'Request aborted.');
    return new ApiError('NETWORK_ERROR', 0, err?.message || 'Network request failed.');
  }

  private buildUrl(path: string, query?: Record<string, string | number | undefined>): string {
    let url = this.baseUrl + (path.startsWith('/') ? path : '/' + path);
    if (query) {
      const qs = new URLSearchParams();
      for (const [k, v] of Object.entries(query)) {
        if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
      }
      const s = qs.toString();
      if (s) url += (url.includes('?') ? '&' : '?') + s;
    }
    return url;
  }

  /** Header-phase transport. Resolves `{ res, finish }` — the timeout timer
   *  and caller-abort listener stay ARMED so the body read is governed too;
   *  the caller MUST invoke `finish()` once the body has been consumed. On
   *  retries/throws each attempt cleans its own wiring. */
  private async send(
    method: string,
    url: string,
    headers: Record<string, string>,
    body: string | FormData | undefined,
    signal: AbortSignal | undefined,
    idempotent: boolean,
    timeoutOverrideMs: number | undefined,
  ): Promise<{ res: Response; finish: () => void }> {
    let attempt = 0;
    // Only idempotent requests are ever retried, and only on transient failures.
    const maxAttempts = idempotent ? this.maxRetries + 1 : 1;
    const budgetMs = timeoutOverrideMs ?? this.timeoutMs;
    for (;;) {
      attempt++;
      const ctrl = new AbortController();
      const onAbort = () => ctrl.abort((signal as any)?.reason);
      if (signal) {
        if (signal.aborted) ctrl.abort((signal as any).reason);
        else signal.addEventListener('abort', onAbort, { once: true });
      }
      const timer = setTimeout(() => ctrl.abort(new ApiError('TIMEOUT', 0, `Request timed out after ${budgetMs}ms`)), budgetMs);
      const cleanup = () => {
        clearTimeout(timer);
        if (signal) signal.removeEventListener('abort', onAbort);
      };
      try {
        const res = await this.fetchImpl(url, { method, headers, body, signal: ctrl.signal });
        if (idempotent && attempt < maxAttempts && (res.status === 429 || res.status >= 500)) {
          cleanup();
          await backoff(attempt, res.headers.get('retry-after'));
          continue;
        }
        return { res, finish: cleanup };
      } catch (err: any) {
        cleanup();
        // Caller-driven aborts propagate immediately; transient network errors retry.
        if (signal?.aborted) throw new ApiError('ABORTED', 0, 'Request aborted.');
        if (idempotent && attempt < maxAttempts) {
          await backoff(attempt, null);
          continue;
        }
        if (err instanceof ApiError) throw err;
        throw new ApiError('NETWORK_ERROR', 0, err?.message || 'Network request failed.');
      }
    }
  }

  private async parseJson<T>(res: Response): Promise<T> {
    if (!res.ok) throw await this.errorFromResponse(res);
    const text = await res.text();
    if (!text) return undefined as unknown as T;
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new ApiError('BAD_RESPONSE', res.status, 'Server returned a non-JSON success body.');
    }
  }

  private async errorFromResponse(res: Response): Promise<ApiError> {
    let body: any = {};
    try {
      const text = await res.text();
      if (text) body = JSON.parse(text);
    } catch {
      /* non-JSON error body — keep {} */
    }
    return ApiError.from(res.status, body);
  }
}

async function backoff(attempt: number, retryAfter: string | null): Promise<void> {
  let ms = Math.min(8000, 300 * Math.pow(2, attempt - 1));
  const ra = retryAfter ? parseInt(retryAfter, 10) : NaN;
  if (!isNaN(ra) && ra > 0) ms = Math.min(15_000, ra * 1000);
  ms += Math.floor(Math.random() * 200); // jitter
  await new Promise((r) => setTimeout(r, ms));
}
