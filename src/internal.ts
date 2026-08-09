// Shared helpers — not part of the public API.

import type { AspectRatio, CdnRef, Creation, CreationRef, Folder, QueueState } from './types';

/** Standard ~1MP buckets (all multiples of 16) for the aspect-ratio sugar. */
const ASPECT_DIMS: Record<AspectRatio, [number, number]> = {
  '1:1': [1024, 1024],
  '16:9': [1344, 768],
  '9:16': [768, 1344],
  '4:3': [1152, 896],
  '3:4': [896, 1152],
  '3:2': [1216, 832],
  '2:3': [832, 1216],
};

export function dimsForAspect(ratio?: AspectRatio): { width?: number; height?: number } {
  if (!ratio || !(ratio in ASPECT_DIMS)) return {};
  const [width, height] = ASPECT_DIMS[ratio];
  return { width, height };
}

/** Resolve width/height from explicit dims (win) or the aspectRatio sugar.
 *  A LONE width or height is forwarded as-is (the server defaults the other
 *  side) — silently dropping a user-supplied dimension would be worse.
 *  `aspectRatio:'auto'` is NOT resolved client-side: the sentinel is passed
 *  through and the server's LLM pass picks the ratio from the prompt. */
export function resolveDims(p: { width?: number; height?: number; aspectRatio?: AspectRatio | 'auto' }): {
  width?: number;
  height?: number;
  aspectRatio?: 'auto';
} {
  const hasW = typeof p.width === 'number';
  const hasH = typeof p.height === 'number';
  if (hasW || hasH) {
    return { width: hasW ? p.width : undefined, height: hasH ? p.height : undefined };
  }
  if (p.aspectRatio === 'auto') return { aspectRatio: 'auto' };
  return dimsForAspect(p.aspectRatio);
}

/** Join a base origin with a server path (absolute passthrough). */
export function absoluteUrl(baseUrl: string, path?: string): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  const base = baseUrl.replace(/\/+$/, '');
  const p = path.startsWith('/') ? path : '/' + path;
  return base + p;
}

/** A collision-resistant idempotency token (native crypto, zero deps). */
export function mintClientToken(): string {
  const c: any = (globalThis as any).crypto;
  if (c && typeof c.randomUUID === 'function') return 'sdk_' + c.randomUUID();
  // Fallback for exotic runtimes without crypto.randomUUID.
  return 'sdk_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 12);
}

/** Pull a CDN id out of a raw id or a Creation / QueueState / result object. */
export function extractCdnId(ref: CdnRef): string | undefined {
  if (typeof ref === 'string') return ref || undefined;
  if (!ref || typeof ref !== 'object') return undefined;
  if (ref.cdnId) return ref.cdnId;
  if (ref.outputCdnId) return ref.outputCdnId;
  const m = typeof ref.downloadUrl === 'string' ? ref.downloadUrl.match(/\/cdn\/file\/([^/?.]+)/) : null;
  return m ? m[1] : undefined;
}

const CT_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
};

export function extFromContentType(ct?: string): string {
  if (!ct) return 'bin';
  const base = ct.split(';')[0].trim().toLowerCase();
  return CT_TO_EXT[base] || (base.split('/')[1] || 'bin');
}

const EXT_TO_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  mp4: 'video/mp4',
  webm: 'video/webm',
};

export function mimeFromFilename(name?: string): string {
  const ext = (name?.split('.').pop() || '').toLowerCase();
  return EXT_TO_MIME[ext] || 'application/octet-stream';
}

function num(v: unknown): number | undefined {
  return typeof v === 'number' && isFinite(v) ? v : undefined;
}

/** Normalize a server queue payload → QueueState with an absolute downloadUrl. */
export function normalizeQueue(raw: any, baseUrl: string): QueueState {
  return {
    queueId: raw?.queueId,
    status: raw?.status,
    costUsd: num(raw?.costUsd),
    creationId: raw?.creationId || undefined,
    cdnId: raw?.outputCdnId || undefined,
    downloadUrl: absoluteUrl(baseUrl, raw?.downloadUrl),
    error: raw?.error || undefined,
    createdAt: raw?.createdAt || undefined,
    completedAt: raw?.completedAt || undefined,
  };
}

/** Normalize a server creation payload (mapped or raw) → Creation. */
export function normalizeCreation(raw: any, baseUrl: string): Creation {
  const cdnId = raw?.cdnId || raw?.outputCdnId || undefined;
  const rel = raw?.downloadUrl || (cdnId ? `/cdn/file/${cdnId}` : undefined);
  return {
    creationId: raw?.creationId || raw?._id || raw?.id,
    // The server never emits a bare `prompt` on creation rows — owner prompts
    // live in `originalPrompt` / `finalPrompt`. Fall back so the typed field
    // is actually populated.
    prompt: raw?.prompt ?? raw?.originalPrompt ?? raw?.finalPrompt,
    toolKind: raw?.toolKind,
    style: raw?.style ?? undefined,
    quality: raw?.quality,
    aiModel: raw?.aiModel,
    cdnId,
    downloadUrl: absoluteUrl(baseUrl, rel),
    width: num(raw?.width) ?? num(raw?.outputWidth),
    height: num(raw?.height) ?? num(raw?.outputHeight),
    isUploaded: raw?.isUploaded === true,
    source: typeof raw?.source === 'string' ? raw.source : undefined,
    // Only when the payload carries them — list rows are curated and omit the
    // clone fields, and `undefined` must stay distinct from "not a clone".
    isCloned: raw?.isCloned === true || undefined,
    clonedFromCreationId: typeof raw?.clonedFromCreationId === 'string' ? raw.clonedFromCreationId : undefined,
    description: raw?.description ?? raw?.finalShortDescription ?? raw?.finalDescription ?? undefined,
    folderId: typeof raw?.folderId === 'string' ? raw.folderId : (raw?.folderId === null ? null : undefined),
    inTrash: bool(raw?.inTrash),
    isPublicShared: bool(raw?.isPublicShared),
    likes: num(raw?.likes) ?? num(raw?.likeCount),
    isLiked: bool(raw?.isLiked),
    isOwner: bool(raw?.isOwner),
    nsfwFlagged: bool(raw?.nsfwFlagged),
    nsfwRate: num(raw?.nsfwRate),
    username: typeof raw?.username === 'string' ? raw.username : (typeof raw?.user?.username === 'string' ? raw.user.username : undefined),
    creationDate: raw?.creationDate,
    raw,
  };
}

/** Booleans only when the payload actually carries one — a partial response
 *  must not invent `false` for state it doesn't know. */
function bool(v: unknown): boolean | undefined {
  return typeof v === 'boolean' ? v : undefined;
}

/** Pull a creation id out of a raw id or any object that carries one. */
export function extractCreationId(ref: CreationRef): string | undefined {
  if (typeof ref === 'string') return ref || undefined;
  if (!ref || typeof ref !== 'object') return undefined;
  return ref.creationId || (ref as any)._id || (ref as any).id || undefined;
}

/** Normalize a server folder payload → Folder. Boolean flags are only set
 *  when the payload actually carries them — a partial response (e.g. a PATCH
 *  ack) must not invent `false` for state it doesn't know. */
export function normalizeFolder(raw: any): Folder {
  return {
    folderId: raw?.folderId ?? raw?.id,
    title: raw?.title,
    description: raw?.description ?? undefined,
    icon: raw?.icon ?? undefined,
    kind: raw?.kind,
    isPublicShared: typeof raw?.isPublicShared === 'boolean' ? raw.isPublicShared : undefined,
    isShared: typeof raw?.isShared === 'boolean' ? raw.isShared : undefined,
    posterCreationId: raw?.posterCreationId ?? undefined,
    groupId: typeof raw?.groupId === 'string' ? raw.groupId : undefined,
    isFavorite: typeof raw?.isFavorite === 'boolean' ? raw.isFavorite : undefined,
    createdAt: raw?.createdAt ?? raw?.date,
    updatedAt: raw?.updatedAt ?? raw?.updateDate,
    raw,
  };
}

// Must mirror the server's terminal set (genQueue.ts) — a status missing here
// makes waitFor poll a finished job until its own deadline, then report
// TimeoutError for something the server settled long before.
export const TERMINAL_STATUSES = new Set(['completed', 'failed', 'cancelled', 'dismissed', 'timeout', 'expired']);
export const SUCCESS_STATUSES = new Set(['completed']);
