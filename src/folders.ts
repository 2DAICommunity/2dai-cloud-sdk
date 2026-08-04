// Folders namespace — list + CRUD the collections in your cloud drive.

import { normalizeFolder } from './internal';
import type { Http } from './http';
import type {
  DeleteFolderOptions,
  Folder,
  FolderGroup,
  FolderInput,
  FolderListArg,
  FolderListOptions,
  FolderPage,
  FolderPatch,
} from './types';

/** Sidebar folder groups — the collapsible sections the studio's cloud drive
 *  organises collections into. Deleting a group only detaches its member
 *  folders; folders and creations are never deleted here. */
export interface FolderGroupsNamespace {
  /** Your groups, sidebar (index) order. */
  list(signal?: AbortSignal): Promise<FolderGroup[]>;
  /** Create a group (max 100; 409 `GROUP_LIMIT_REACHED`). */
  create(title: string, signal?: AbortSignal): Promise<FolderGroup>;
  /** Rename a group. */
  rename(groupId: string, title: string, signal?: AbortSignal): Promise<FolderGroup>;
  /** Delete a group — member folders detach back to the drive root pane. */
  remove(groupId: string, signal?: AbortSignal): Promise<{ groupId: string; deleted: boolean }>;
}

export interface FoldersNamespace {
  /** A page of your folders (collections), newest first unless you pass `sort`;
   *  paginate with `nextBeforeDate`. Also accepts a bare `AbortSignal` — the
   *  signature this method had before it was paginated. */
  list(arg?: FolderListArg): Promise<FolderPage>;
  /** Create a folder (max 500; 409 `FOLDER_LIMIT_REACHED`), optionally inside
   *  one of your sidebar groups. */
  create(input: FolderInput, signal?: AbortSignal): Promise<Folder>;
  /** Edit folder metadata: title, description, sidebar group (`groupId` —
   *  string to set, `null` to detach), poster (`posterCreationId` — string to
   *  pin, `null` to clear), and `isFavorite`. */
  update(folderId: string, patch: FolderPatch, signal?: AbortSignal): Promise<Folder>;
  /** Delete a folder. By default its creations detach to the drive root; pass
   *  `{ trashContents: true }` to send them to trash instead. */
  delete(folderId: string, opts?: DeleteFolderOptions): Promise<{ folderId: string; deleted: boolean }>;
  /** Sidebar folder groups (list / create / rename / remove). */
  readonly groups: FolderGroupsNamespace;
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
        json: { title: input.title, description: input.description, groupId: input.groupId },
        idempotent: false,
        signal,
      });
      return normalizeFolder(raw.folder);
    },

    async update(folderId: string, patch: FolderPatch, signal?: AbortSignal): Promise<Folder> {
      const raw = await http.request<any>('PATCH', `/v1/folders/${encodeURIComponent(folderId)}`, {
        // `undefined` fields drop out at JSON.stringify; explicit `null` rides
        // through — that is the wire contract for detach (groupId) and clear
        // (posterCreationId).
        json: {
          title: patch.title,
          description: patch.description,
          groupId: patch.groupId,
          posterCreationId: patch.posterCreationId,
          isFavorite: patch.isFavorite,
        },
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

    groups: {
      async list(signal?: AbortSignal): Promise<FolderGroup[]> {
        const raw = await http.request<{ groups: FolderGroup[] }>('GET', '/v1/folder-groups', { idempotent: true, signal });
        return Array.isArray(raw?.groups) ? raw.groups : [];
      },

      async create(title: string, signal?: AbortSignal): Promise<FolderGroup> {
        const raw = await http.request<{ group: FolderGroup }>('POST', '/v1/folder-groups', {
          json: { title },
          idempotent: false,
          signal,
        });
        return raw.group;
      },

      async rename(groupId: string, title: string, signal?: AbortSignal): Promise<FolderGroup> {
        const raw = await http.request<{ group: FolderGroup }>('PATCH', `/v1/folder-groups/${encodeURIComponent(groupId)}`, {
          json: { title },
          idempotent: false,
          signal,
        });
        return raw.group;
      },

      async remove(groupId: string, signal?: AbortSignal): Promise<{ groupId: string; deleted: boolean }> {
        return http.request('DELETE', `/v1/folder-groups/${encodeURIComponent(groupId)}`, { idempotent: false, signal });
      },
    },
  };
}
