// Folders namespace — list + CRUD the collections in your cloud drive.

import { normalizeFolder } from './internal';
import type { Http } from './http';
import type { DeleteFolderOptions, Folder, FolderInput, FolderPatch } from './types';

export interface FoldersNamespace {
  /** All your folders (collections). */
  list(signal?: AbortSignal): Promise<Folder[]>;
  /** Create a folder. */
  create(input: FolderInput, signal?: AbortSignal): Promise<Folder>;
  /** Rename / re-describe a folder. */
  update(folderId: string, patch: FolderPatch, signal?: AbortSignal): Promise<Folder>;
  /** Delete a folder. By default its creations detach to the drive root; pass
   *  `{ trashContents: true }` to send them to trash instead. */
  delete(folderId: string, opts?: DeleteFolderOptions): Promise<{ folderId: string; deleted: boolean }>;
}

export function createFolders(http: Http): FoldersNamespace {
  return {
    async list(signal?: AbortSignal): Promise<Folder[]> {
      const raw = await http.request<any>('GET', '/v1/folders', { idempotent: true, signal });
      return Array.isArray(raw?.folders) ? raw.folders.map(normalizeFolder) : [];
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
