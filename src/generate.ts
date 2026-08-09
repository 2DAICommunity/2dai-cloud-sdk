// Generation namespace. Each method submits to the async queue; by default it
// polls to completion and returns the finished creation. Pass `{ wait: false }`
// to get the queue ticket immediately and poll yourself.

import { ApiError, GenerationFailedError } from './errors';
import { extractCreationId, mintClientToken, normalizeCreation, resolveDims } from './internal';
import { pollQueue } from './queue';
import type { Http } from './http';
import type {
  CreationRef,
  GenerationResult,
  ImageParams,
  QueueTicket,
  RefParams,
  SubmitOptions,
  VideoParams,
  WallpaperParams,
} from './types';

export interface GenerateNamespace {
  image(params: ImageParams, opts?: SubmitOptions & { wait?: true }): Promise<GenerationResult>;
  image(params: ImageParams, opts: SubmitOptions & { wait: false }): Promise<QueueTicket>;
  imageWithRefs(params: RefParams, opts?: SubmitOptions & { wait?: true }): Promise<GenerationResult>;
  imageWithRefs(params: RefParams, opts: SubmitOptions & { wait: false }): Promise<QueueTicket>;
  video(params: VideoParams, opts?: SubmitOptions & { wait?: true }): Promise<GenerationResult>;
  video(params: VideoParams, opts: SubmitOptions & { wait: false }): Promise<QueueTicket>;
  /** Wallpaper-resize: expand a stored creation into a target `dimension`
   *  (which drives pricing; unknown values are rejected fail-closed).
   *  Quality is forced to Ultra server-side, same as the studio's tool. */
  wallpaper(params: WallpaperParams, opts?: SubmitOptions & { wait?: true }): Promise<GenerationResult>;
  wallpaper(params: WallpaperParams, opts: SubmitOptions & { wait: false }): Promise<QueueTicket>;
  /** Re-run a stored creation ("Generate Similar"): the SERVER re-derives the
   *  original tool's parameters from the stored row — prompt, style, quality,
   *  dimensions, references — and submits a fresh generation at the usual
   *  price. Works for image, ref-tool, edit and video rows; wallpaper-resize
   *  rows and raw uploads can't be re-derived and reject with a 400
   *  `ValidationError` (`REGEN_UNSUPPORTED_TOOL`). */
  similar(ref: CreationRef, opts?: SubmitOptions & { wait?: true, telegramUser?: import('./types').TelegramAuthor }): Promise<GenerationResult>;
  similar(ref: CreationRef, opts: SubmitOptions & { wait: false, telegramUser?: import('./types').TelegramAuthor }): Promise<QueueTicket>;
}

export function createGenerate(http: Http): GenerateNamespace {
  return {
    image: (params: ImageParams, opts?: SubmitOptions) => {
      const { width, height, aspectRatio } = resolveDims(params);
      return submit(http, '/v1/generate/image', {
        prompt: params.prompt,
        style: params.style,
        quality: params.quality,
        width,
        height,
        aspectRatio,
        negativePrompt: params.negativePrompt,
        enhanced: params.enhanced,
        allowNSFW: params.allowNSFW,
        refCreationIds: params.refCreationIds,
        clientToken: params.clientToken,
        telegramUser: params.telegramUser,
      }, opts) as any;
    },
    imageWithRefs: (params: RefParams, opts?: SubmitOptions) => {
      const { width, height, aspectRatio } = resolveDims(params);
      return submit(http, '/v1/generate/image-with-refs', {
        tool: params.tool,
        prompt: params.prompt,
        refCreationIds: params.refCreationIds,
        quality: params.quality,
        width,
        height,
        aspectRatio,
        allowNSFW: params.allowNSFW,
        extractionDirective: params.extractionDirective,
        clientToken: params.clientToken,
      }, opts) as any;
    },
    wallpaper: (params: WallpaperParams, opts?: SubmitOptions) => {
      return submit(http, '/v1/generate/wallpaper', {
        inputCreationId: params.inputCreationId,
        dimension: params.dimension,
        refCreationIds: params.refCreationIds,
        prompt: params.prompt,
        allowNSFW: params.allowNSFW,
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
        telegramUser: params.telegramUser,
      }, opts) as any;
    },
    similar: (ref: CreationRef, opts?: SubmitOptions & { telegramUser?: import('./types').TelegramAuthor }) => {
      const creationId = extractCreationId(ref);
      if (!creationId) {
        return Promise.reject(new ApiError('NO_CREATION_ID', 0, 'Could not resolve a creation id from the argument.')) as any;
      }
      // No clientToken here: the server rebuilds the submit body from the
      // stored row, so a token in THIS body would be discarded. Rapid repeats
      // still dedup — identical derived bodies hit the server's 5s window.
      return submitTicket(http, '/v1/generate/similar', { creationId, telegramUser: opts?.telegramUser }, opts ?? {}) as any;
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
  return submitTicket(http, path, pruneUndefined(body), opts);
}

/** POST a submit body, then either return the ticket (`wait: false`) or poll
 *  the queue to a terminal state and enrich into a GenerationResult. */
async function submitTicket(
  http: Http,
  path: string,
  body: Record<string, unknown>,
  opts: SubmitOptions,
): Promise<GenerationResult | QueueTicket> {
  const ticket = await http.request<QueueTicket>('POST', path, { json: body, idempotent: false, signal: opts.signal });

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
