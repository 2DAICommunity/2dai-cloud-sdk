// Uploads namespace — push a local image/gif/mp4 into your library so it can be
// used as a generation reference or animated into a video. Runs the same
// server-side moderation pass as the studio (throws NsfwRejectedError on block).

import { ApiError } from './errors';
import { mimeFromFilename, normalizeCreation } from './internal';
import type { Http } from './http';
import type { Creation, DuplicateCheck, UploadInput } from './types';

export interface UploadsNamespace {
  /** Upload an image/gif/mp4 and return the created (uploaded) creation.
   *  Optional lineage: `croppedFromCreationId` / `erasedFromCreationId`
   *  (mutually exclusive) record the upload as an edit of an existing
   *  creation you own; `targetFolderId` files it directly into a folder. */
  image(input: UploadInput): Promise<Creation>;
  /** Advisory pre-flight dedup: does a creation with this MD5 already exist
   *  (optionally within one folder)? Saves the full upload round-trip; the
   *  upload itself still re-checks, so treat a `false` as a hint, not a lock. */
  checkDuplicate(md5: string, folderId?: string, signal?: AbortSignal): Promise<DuplicateCheck>;
}

export function createUploads(http: Http): UploadsNamespace {
  return {
    async image(input: UploadInput): Promise<Creation> {
      const { blob, filename } = await toBlob(input);
      const form = new FormData();
      form.append('file', blob, filename);
      if (input.croppedFromCreationId) form.append('croppedFromCreationId', input.croppedFromCreationId);
      if (input.erasedFromCreationId) form.append('erasedFromCreationId', input.erasedFromCreationId);
      if (input.targetFolderId) form.append('targetFolderId', input.targetFolderId);
      // Uploads carry the file AND wait for the server-side moderation pass —
      // give them a 3-minute floor so a large mp4 on a slow uplink doesn't
      // trip the default 60s budget and orphan a server-side creation.
      const raw = await http.request<any>('POST', '/v1/uploads', { form, idempotent: false, signal: input.signal, timeoutMs: 180_000 });
      return normalizeCreation(raw, http.baseUrl);
    },

    async checkDuplicate(md5: string, folderId?: string, signal?: AbortSignal): Promise<DuplicateCheck> {
      return http.request('GET', '/v1/uploads/check-duplicate', {
        idempotent: true,
        signal,
        query: { md5, folderId },
      });
    },
  };
}

async function toBlob(input: UploadInput): Promise<{ blob: Blob; filename: string }> {
  let bytes: Uint8Array | undefined;
  let filename = input.filename;

  if (input.path) {
    if (typeof (globalThis as any).process === 'undefined') {
      throw new ApiError('UNSUPPORTED', 0, '`path` uploads are Node-only; use `data` or `base64` in the browser.');
    }
    const fs = await import('node:fs/promises');
    const nodePath = await import('node:path');
    bytes = new Uint8Array(await fs.readFile(input.path));
    filename = filename || nodePath.basename(input.path);
  } else if (input.data instanceof Uint8Array) {
    bytes = input.data;
  } else if (input.data instanceof ArrayBuffer) {
    bytes = new Uint8Array(input.data);
  } else if (typeof Blob !== 'undefined' && input.data instanceof Blob) {
    const ct = input.contentType || input.data.type || mimeFromFilename(filename);
    return { blob: input.data.type ? input.data : new Blob([input.data], { type: ct }), filename: filename || 'upload.' + extOf(ct) };
  } else if (input.base64) {
    bytes = decodeBase64(input.base64.replace(/^data:[^;]+;base64,/, ''));
  }

  if (!bytes) throw new ApiError('NO_INPUT', 0, 'Provide one of: path, data, or base64.');

  const contentType = input.contentType || mimeFromFilename(filename);
  const name = filename || 'upload.' + extOf(contentType);
  return { blob: new Blob([bytes], { type: contentType }), filename: name };
}

function extOf(ct: string): string {
  const m = ct.split('/')[1];
  return m ? m.replace('jpeg', 'jpg') : 'bin';
}

function decodeBase64(b64: string): Uint8Array {
  const g: any = globalThis as any;
  if (typeof g.Buffer !== 'undefined') return new Uint8Array(g.Buffer.from(b64, 'base64'));
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
