// CDN namespace — turn a creation (or a raw CDN id) into actual bytes, a file
// on disk, a Blob, or a data URL, authenticating with your key so it works for
// private creations too. Accepts a CDN id string OR any object that carries one
// (a Creation, a QueueState, or a generation result).

import { ApiError } from './errors';
import { extFromContentType, extractCdnId } from './internal';
import type { Http } from './http';
import type { CdnAsset, CdnRef } from './types';

export interface DownloadOptions {
  /** Node only — write the bytes here. A matching extension is appended if the
   *  path has none. */
  savePath?: string;
  signal?: AbortSignal;
}

export interface CdnNamespace {
  /** Absolute `…/cdn/file/<id>` URL. Loads directly in an `<img>` only for
   *  public creations; private ones need the key, so use `fetch`/`toDataUrl`. */
  url(ref: CdnRef): string;
  /** Fetch raw bytes + content-type (authenticated). */
  fetch(ref: CdnRef, signal?: AbortSignal): Promise<CdnAsset>;
  /** Node: write to `savePath` and return the final path. Without `savePath`
   *  (or in the browser) resolves the `CdnAsset` instead. */
  download(ref: CdnRef, opts?: DownloadOptions): Promise<string | CdnAsset>;
  /** Fetch as a Blob (browser-friendly). */
  toBlob(ref: CdnRef, signal?: AbortSignal): Promise<Blob>;
  /** Fetch as a `data:<mime>;base64,...` URL (drop straight into `<img src>`). */
  toDataUrl(ref: CdnRef, signal?: AbortSignal): Promise<string>;
}

export function createCdn(http: Http): CdnNamespace {
  const requireId = (ref: CdnRef): string => {
    const id = extractCdnId(ref);
    if (!id) throw new ApiError('NO_CDN_ID', 0, 'Could not resolve a CDN id from the argument.');
    return id;
  };

  const ns: CdnNamespace = {
    url(ref) {
      return `${http.baseUrl}/cdn/file/${encodeURIComponent(requireId(ref))}`;
    },

    async fetch(ref, signal) {
      const id = requireId(ref);
      const { bytes, contentType } = await http.requestBytes(`/cdn/file/${encodeURIComponent(id)}`, signal);
      return { bytes, contentType, ext: extFromContentType(contentType) };
    },

    async download(ref, opts = {}) {
      const asset = await ns.fetch(ref, opts.signal);
      if (!opts.savePath) return asset;
      if (typeof (globalThis as any).process === 'undefined') {
        throw new ApiError('UNSUPPORTED', 0, '`savePath` is Node-only; omit it to receive the bytes in the browser.');
      }
      const fs = await import('node:fs/promises');
      const path = /\.[a-z0-9]{1,5}$/i.test(opts.savePath) ? opts.savePath : `${opts.savePath}.${asset.ext}`;
      await fs.writeFile(path, asset.bytes);
      return path;
    },

    async toBlob(ref, signal) {
      const asset = await ns.fetch(ref, signal);
      return new Blob([asset.bytes], { type: asset.contentType });
    },

    async toDataUrl(ref, signal) {
      const asset = await ns.fetch(ref, signal);
      return `data:${asset.contentType};base64,${toBase64(asset.bytes)}`;
    },
  };
  return ns;
}

function toBase64(bytes: Uint8Array): string {
  const g: any = globalThis as any;
  if (typeof g.Buffer !== 'undefined') return g.Buffer.from(bytes).toString('base64');
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
