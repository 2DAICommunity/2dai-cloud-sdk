// CDN namespace — turn a creation (or a raw CDN id) into actual bytes, a file
// on disk, a Blob, or a data URL, authenticating with your key so it works for
// private creations too. Accepts a CDN id string OR any object that carries one
// (a Creation, a QueueState, or a generation result).

import { ApiError } from './errors';
import { extFromContentType, extractCdnId } from './internal';
import type { Http } from './http';
import type { CdnAsset, CdnRef } from './types';

/** Server-side resize, applied by the CDN before the bytes are sent. Nothing is
 *  decoded or re-encoded client-side, so a thumbnail costs a fraction of the
 *  transfer of the full asset — a 2496×1664 JPEG at 1.2 MB comes back around
 *  130 kB at `maxSide: 512`.
 *
 *  Give `maxSide` on its own to scale the longest edge and keep the aspect
 *  ratio; that is what you want for previews. `width` / `height` target those
 *  axes specifically, and may crop or letterbox to fit. */
export interface CdnTransform {
  /** Target width in px (`?w`). */
  width?: number;
  /** Target height in px (`?h`). */
  height?: number;
  /** Longest side in px, aspect ratio preserved (`?s`). */
  maxSide?: number;
  /** Overlay the account's default 2DAI watermark on the returned bytes
   *  (bottom-right). Applies to images and to video frames alike. Only
   *  the boolean form is exposed here — the server expands `?watermark=1`
   *  to the current default watermark CDN id. */
  watermark?: boolean;
}

export interface CdnFetchOptions extends CdnTransform {
  signal?: AbortSignal;
}

export interface DownloadOptions extends CdnTransform {
  /** Node only — write the bytes here. A matching extension is appended if the
   *  path has none. */
  savePath?: string;
  signal?: AbortSignal;
}

/** The second argument of `fetch` / `toBlob` / `toDataUrl` accepted a bare
 *  `AbortSignal` before transforms existed; both forms still work. */
export type CdnFetchArg = AbortSignal | CdnFetchOptions;

export interface CdnNamespace {
  /** Absolute `…/cdn/file/<id>` URL, with any transform applied as query
   *  params. Loads directly in an `<img>` only for public creations; private
   *  ones need the key, so use `fetch`/`toDataUrl`. */
  url(ref: CdnRef, transform?: CdnTransform): string;
  /** Fetch raw bytes + content-type (authenticated). Pass a `CdnTransform` to
   *  have the CDN resize before sending. */
  fetch(ref: CdnRef, arg?: CdnFetchArg): Promise<CdnAsset>;
  /** Node: write to `savePath` and return the final path. Without `savePath`
   *  (or in the browser) resolves the `CdnAsset` instead. */
  download(ref: CdnRef, opts?: DownloadOptions): Promise<string | CdnAsset>;
  /** Fetch as a Blob (browser-friendly). */
  toBlob(ref: CdnRef, arg?: CdnFetchArg): Promise<Blob>;
  /** Fetch as a `data:<mime>;base64,...` URL (drop straight into `<img src>`). */
  toDataUrl(ref: CdnRef, arg?: CdnFetchArg): Promise<string>;
}

/** Accepts either calling convention without making callers care. */
function splitFetchArg(arg?: CdnFetchArg): { signal?: AbortSignal; transform: CdnTransform } {
  if (!arg) return { transform: {} };
  // An AbortSignal is identified structurally rather than with `instanceof`:
  // polyfilled and cross-realm signals fail the prototype check.
  if (typeof (arg as AbortSignal).aborted === 'boolean') {
    return { signal: arg as AbortSignal, transform: {} };
  }
  const { signal, ...transform } = arg as CdnFetchOptions;
  return { ...(signal ? { signal } : {}), transform };
}

/** Positive finite integers only — a NaN or negative value would otherwise
 *  reach the CDN as `?w=NaN` and be rejected there instead of here. */
function transformQuery(transform: CdnTransform): string {
  const parts: string[] = [];
  const add = (key: string, value: number | undefined) => {
    if (value === undefined) return;
    if (!Number.isFinite(value) || value <= 0) {
      throw new ApiError('INVALID_TRANSFORM', 0, `CDN transform "${key}" must be a positive number (got ${JSON.stringify(value)}).`);
    }
    parts.push(`${key}=${Math.round(value)}`);
  };
  add('w', transform.width);
  add('h', transform.height);
  add('s', transform.maxSide);
  // Watermark is a server-expanded sentinel: `?watermark=1` on the API
  // proxy is rewritten to the account's default watermark CDN id + a
  // sensible position, so the client stays ignorant of the actual id.
  if (transform.watermark === true) parts.push('watermark=1');
  return parts.length ? `?${parts.join('&')}` : '';
}

export function createCdn(http: Http): CdnNamespace {
  const requireId = (ref: CdnRef): string => {
    const id = extractCdnId(ref);
    if (!id) throw new ApiError('NO_CDN_ID', 0, 'Could not resolve a CDN id from the argument.');
    return id;
  };

  const ns: CdnNamespace = {
    url(ref, transform) {
      return `${http.baseUrl}/cdn/file/${encodeURIComponent(requireId(ref))}${transform ? transformQuery(transform) : ''}`;
    },

    async fetch(ref, arg) {
      const id = requireId(ref);
      const { signal, transform } = splitFetchArg(arg);
      const path = `/cdn/file/${encodeURIComponent(id)}${transformQuery(transform)}`;
      const { bytes, contentType } = await http.requestBytes(path, signal);
      return { bytes, contentType, ext: extFromContentType(contentType) };
    },

    async download(ref, opts = {}) {
      const { savePath, signal, ...transform } = opts;
      const asset = await ns.fetch(ref, { ...transform, ...(signal ? { signal } : {}) });
      if (!savePath) return asset;
      if (typeof (globalThis as any).process === 'undefined') {
        throw new ApiError('UNSUPPORTED', 0, '`savePath` is Node-only; omit it to receive the bytes in the browser.');
      }
      const fs = await import('node:fs/promises');
      const path = /\.[a-z0-9]{1,5}$/i.test(savePath) ? savePath : `${savePath}.${asset.ext}`;
      await fs.writeFile(path, asset.bytes);
      return path;
    },

    async toBlob(ref, arg) {
      const asset = await ns.fetch(ref, arg);
      return new Blob([asset.bytes], { type: asset.contentType });
    },

    async toDataUrl(ref, arg) {
      const asset = await ns.fetch(ref, arg);
      return `data:${asset.contentType};base64,${toBase64(asset.bytes)}`;
    },
  };
  return ns;
}

function toBase64(bytes: Uint8Array): string {
  const g: any = globalThis as any;
  if (typeof g.Buffer !== 'undefined') return g.Buffer.from(bytes).toString('base64');
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  return g.btoa(bin);
}
