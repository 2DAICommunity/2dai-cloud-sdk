// Folders namespace — list + CRUD the collections in your cloud drive.

import { normalizeFolder } from './internal';
import type { Http } from './http';
import type {
  DeleteFolderOptions,
  Folder,
  FolderInput,
  FolderListArg,
  FolderListOptions,
  FolderPage,
  FolderPatch,
} from './types';

export interface FoldersNamespace {
  /** A page of your folders (collections), newest first unless you pass `sort`;
   *  paginate with `nextBeforeDate`. Also accepts a bare `AbortSignal` — the
   *  signature this method had before it was paginated. */
  list(arg?: FolderListArg): Promise<FolderPage>;
  /** Create a folder. */
  create(input: FolderInput, signal?: AbortSignal): Promise<Folder>;
  /** Rename / re-describe a folder. */
  update(folderId: string, patch: FolderPatch, signal?: AbortSignal): Promise<Folder>;
  /** Delete a folder. By default its creations detach to the drive root; pass
   *  `{ trashContents: true }` to send them to trash instead. */
  delete(folderId: string, opts?: DeleteFolderOptions): Promise<{ folderId: string; deleted: boolean }>;
}

/** Accepts either calling convention without making callers care. */
function splitListArg(arg?: FolderListArg): FolderListOptions {
  if (!arg) return {};
  // An AbortSignal is identified structurally rather than with `instanceof`:
  // polyfilled and cross-realm signals fail the prototype check.
  if (typeof (arg as AbortSignal).aborted === 'boolean') return { signal: arg as AbortSignal };
  return arg as FolderListOptions;
}

export function createFolders(http: Http): FoldersNamespace {
  return {
    async list(arg?: FolderListArg): Promise<FolderPage> {
      const opts = splitListArg(arg);
      const raw = await http.request<any>('GET', '/v1/folders', {
        idempotent: true,
        signal: opts.signal,
        query: { limit: opts.limit, beforeDate: opts.beforeDate, sort: opts.sort },
      });
      return {
        folders: Array.isArray(raw?.folders) ? raw.folders.map(normalizeFolder) : [],
        nextBeforeDate: raw?.nextBeforeDate || undefined,
      };
    },

    async create(input: FolderInput, signal?: AbortSignal): Promise<Folder> {
      const raw = await http.request<{ folder: any }>('POST', '/v1/folders', {
        json: { title: input.title, description: input.description },
        idempotent: false,
        signal,
      });
      return normalizeFolder(raw.folder);
    },

    async update(folderId: string, patch: FolderPatch, signal?: AbortSignal): Promise<Folder> {
      const raw = await http.request<any>('PATCH', `/v1/folders/${encodeURIComponent(folderId)}`, {
        json: { title: patch.title, description: patch.description },
        idempotent: false,
        signal,
      });
      // Current servers return { folder: <full view> }; older ones returned a
      // bare partial ack — accept both (normalizeFolder no longer fabricates
      // flags for fields a partial doesn't carry).
      return normalizeFolder(raw?.folder ?? raw);
    },

    async delete(folderId: string, opts: DeleteFolderOptions = {}): Promise<{ folderId: string; deleted: boolean }> {
      const raw = await http.request<any>('DELETE', `/v1/folders/${encodeURIComponent(folderId)}`, {
        query: opts.trashContents ? { trashContents: '1' } : undefined,
        idempotent: false,
        signal: opts.signal,
      });
      return { folderId: raw?.folderId ?? folderId, deleted: raw?.deleted === true };
    },
  };
}
