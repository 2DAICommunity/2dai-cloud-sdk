// Generation namespace. Each method submits to the async queue; by default it
// polls to completion and returns the finished creation. Pass `{ wait: false }`
// to get the queue ticket immediately and poll yourself.

import { GenerationFailedError } from './errors';
import { mintClientToken, normalizeCreation, resolveDims } from './internal';
import { pollQueue } from './queue';
import type { Http } from './http';
import type {
  GenerationResult,
  ImageParams,
  QueueTicket,
  RefParams,
  SubmitOptions,
  VideoParams,
} from './types';

export interface GenerateNamespace {
  image(params: ImageParams, opts?: SubmitOptions & { wait?: true }): Promise<GenerationResult>;
  image(params: ImageParams, opts: SubmitOptions & { wait: false }): Promise<QueueTicket>;
  imageWithRefs(params: RefParams, opts?: SubmitOptions & { wait?: true }): Promise<GenerationResult>;
  imageWithRefs(params: RefParams, opts: SubmitOptions & { wait: false }): Promise<QueueTicket>;
  video(params: VideoParams, opts?: SubmitOptions & { wait?: true }): Promise<GenerationResult>;
  video(params: VideoParams, opts: SubmitOptions & { wait: false }): Promise<QueueTicket>;
}

export function createGenerate(http: Http): GenerateNamespace {
  return {
    image: (params: ImageParams, opts?: SubmitOptions) => {
      const { width, height } = resolveDims(params);
      return submit(http, '/v1/generate/image', {
        prompt: params.prompt,
        style: params.style,
        quality: params.quality,
        width,
        height,
        negativePrompt: params.negativePrompt,
        enhanced: params.enhanced,
        allowNSFW: params.allowNSFW,
        refCreationIds: params.refCreationIds,
        clientToken: params.clientToken,
      }, opts) as any;
    },
    imageWithRefs: (params: RefParams, opts?: SubmitOptions) => {
      const { width, height } = resolveDims(params);
      return submit(http, '/v1/generate/image-with-refs', {
        tool: params.tool,
        prompt: params.prompt,
        refCreationIds: params.refCreationIds,
        quality: params.quality,
        width,
        height,
        allowNSFW: params.allowNSFW,
        extractionDirective: params.extractionDirective,
        clientToken: params.clientToken,
      }, opts) as any;
    },
    video: (params: VideoParams, opts?: SubmitOptions) => {
      return submit(http, '/v1/generate/video', {
        prompt: params.prompt,
        inputCreationId: params.inputCreationId,
        duration: params.duration,
        quality: params.quality,
        style: params.style,
        frameInterpolation: params.frameInterpolation,
        allowNSFW: params.allowNSFW,
        clientToken: params.clientToken,
      }, opts) as any;
    },
  };
}

async function submit(
  http: Http,
  path: string,
  body: Record<string, unknown>,
  opts: SubmitOptions = {},
): Promise<GenerationResult | QueueTicket> {
  // Always carry a clientToken so a user-driven retry can't double-charge (the
  // server dedups identical bodies for 5s). The submit itself is never
  // auto-retried by the transport.
  if (!body.clientToken) body.clientToken = mintClientToken();
  const clean = pruneUndefined(body);
  const ticket = await http.request<QueueTicket>('POST', path, { json: clean, idempotent: false, signal: opts.signal });

  if (opts.wait === false) return ticket;

  const terminal = await pollQueue(http, ticket.queueId, {
    intervalMs: opts.intervalMs,
    timeoutMs: opts.timeoutMs,
    signal: opts.signal,
  });
  if (terminal.status !== 'completed') {
    throw new GenerationFailedError(terminal.status, terminal.error, ticket.queueId);
  }
  return enrich(http, ticket, terminal);
}

/** Turn a completed queue state into a full GenerationResult, enriching with
 *  the creation row (width/height/prompt) when available. Best-effort: falls
 *  back to the queue-derived fields if the creation fetch fails. */
async function enrich(http: Http, ticket: QueueTicket, terminal: { creationId?: string; cdnId?: string; downloadUrl?: string }): Promise<GenerationResult> {
  const base = {
    queueId: ticket.queueId,
    costUsd: ticket.costUsd,
    creationId: terminal.creationId || '',
    cdnId: terminal.cdnId,
    downloadUrl: terminal.downloadUrl,
  };
  if (terminal.creationId) {
    try {
      const res = await http.request<{ creation: any }>('GET', `/v1/creations/${encodeURIComponent(terminal.creationId)}`, { idempotent: true });
      const c = normalizeCreation(res.creation, http.baseUrl);
      return { ...c, ...base, cdnId: c.cdnId ?? base.cdnId, downloadUrl: c.downloadUrl ?? base.downloadUrl };
    } catch {
      /* fall through to the queue-derived result */
    }
  }
  return base as GenerationResult;
}

function pruneUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) if (v !== undefined) out[k] = v;
  return out;
}
