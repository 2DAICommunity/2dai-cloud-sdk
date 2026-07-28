// Creations namespace — list/fetch your creations and organise your cloud
// drive (move, trash, restore, delete, publish, unpublish).

import { ApiError } from './errors';
import { extractCreationId, normalizeCreation } from './internal';
import type { Http } from './http';
import type { Creation, CreationPage, CreationRef, ListOptions, MoveTarget } from './types';

export interface CreationsNamespace {
  /** Newest-first page of your creations. Filter by `folderId` (or `'root'`) and
   *  `trashed`; paginate with `nextBeforeDate`. */
  list(opts?: ListOptions): Promise<CreationPage>;
  /** Fetch a single creation you own. */
  get(ref: CreationRef, signal?: AbortSignal): Promise<Creation>;

  /** Move a creation into a folder, or to the drive root (`null` / `'root'`). */
  move(ref: CreationRef, target: MoveTarget, signal?: AbortSignal): Promise<{ creationId: string; folderId: string | null }>;
  /** Send a creation to trash (reversible). */
  trash(ref: CreationRef, signal?: AbortSignal): Promise<{ creationId: string; trashed: boolean }>;
  /** Restore a creation from trash. */
  restore(ref: CreationRef, signal?: AbortSignal): Promise<{ creationId: string; trashed: boolean }>;
  /** Permanently delete a creation. It must be trashed first (409 NOT_IN_TRASH). */
  delete(ref: CreationRef, signal?: AbortSignal): Promise<{ creationId: string; deleted: boolean }>;
  /** Publish a generated creation to the public feed. */
  publish(ref: CreationRef, signal?: AbortSignal): Promise<{ creationId: string; isPublicShared: boolean }>;
  /** Remove a creation from the public feed. */
  unpublish(ref: CreationRef, signal?: AbortSignal): Promise<{ creationId: string; isPublicShared: boolean }>;
}

export function createCreations(http: Http): CreationsNamespace {
  const idOf = (ref: CreationRef): string => {
    const id = extractCreationId(ref);
    if (!id) throw new ApiError('NO_CREATION_ID', 0, 'Could not resolve a creation id from the argument.');
    return id;
  };
  const enc = (ref: CreationRef) => encodeURIComponent(idOf(ref));

  return {
    async list(opts: ListOptions = {}): Promise<CreationPage> {
      const raw = await http.request<any>('GET', '/v1/creations', {
        idempotent: true,
        signal: opts.signal,
        query: {
          limit: opts.limit,
          beforeDate: opts.beforeDate,
          folderId: opts.folderId === 'root' ? '__root__' : opts.folderId,
          trashed: opts.trashed ? '1' : undefined,
        },
      });
      return {
        creations: Array.isArray(raw?.creations) ? raw.creations.map((c: any) => normalizeCreation(c, http.baseUrl)) : [],
        nextBeforeDate: raw?.nextBeforeDate || undefined,
      };
    },

    async get(ref: CreationRef, signal?: AbortSignal): Promise<Creation> {
      const raw = await http.request<{ creation: any }>('GET', `/v1/creations/${enc(ref)}`, { idempotent: true, signal });
      return normalizeCreation(raw.creation, http.baseUrl);
    },

    // async so an unresolvable-id throw surfaces as a rejected promise, not a
    // synchronous throw — callers can rely on `.catch()`.
    async move(ref, target, signal) {
      const folderId = target === 'root' ? '__root__' : target; // null stays null (detach)
      return http.request('POST', `/v1/creations/${enc(ref)}/move`, { json: { folderId }, idempotent: false, signal });
    },

    async trash(ref, signal) {
      return http.request('POST', `/v1/creations/${enc(ref)}/trash`, { idempotent: false, signal });
    },

    async restore(ref, signal) {
      return http.request('POST', `/v1/creations/${enc(ref)}/restore`, { idempotent: false, signal });
    },

    async delete(ref, signal) {
      return http.request('DELETE', `/v1/creations/${enc(ref)}`, { idempotent: false, signal });
    },

    async publish(ref, signal) {
      return http.request('POST', `/v1/creations/${enc(ref)}/publish`, { idempotent: false, signal });
    },

    async unpublish(ref, signal) {
      return http.request('POST', `/v1/creations/${enc(ref)}/unpublish`, { idempotent: false, signal });
    },
  };
}
