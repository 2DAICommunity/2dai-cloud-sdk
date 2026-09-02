// Creations namespace — list/fetch your creations, browse the public feed,
// and organise your cloud drive (move, trash, restore, delete, publish,
// unpublish, like, reorder, batch, NSFW tooling).

import { ApiError } from './errors';
import { extractCreationId, normalizeCreation } from './internal';
import type { Http } from './http';
import type {
  BatchAction,
  BatchResult,
  Creation,
  CreationFilterOptions,
  CreationPage,
  CreationRef,
  FeedOptions,
  FeedPage,
  LikeResult,
  ListOptions,
  MoveTarget,
  NsfwExplanation,
  NsfwFlagResult,
  RandomOptions,
  RefScore,
} from './types';

export interface CreationsNamespace {
  /** A page of your creations. Modes (mutually exclusive): the default flat
   *  listing (`folderId` / `'root'`, `trashed`), an `activity` lens, a
   *  `smart` collection, or a `sharedFolderId`; plus the cross-cutting
   *  filters (`search`, `sort`, `ratioFilter`, `from`/`to`, `hideFiled`,
   *  `usedRef`). Paginate with `nextBeforeDate` (newest-first only) or
   *  `page`. For a random pick use `random()` — `list` always returns a page. */
  list(opts?: ListOptions): Promise<CreationPage>;
  /** ONE uniformly-sampled creation from the filtered collection (or null
   *  when the filter matches nothing). Same filters as `list`, no paging;
   *  the trash rejects with 400 `RANDOM_NOT_SUPPORTED`. */
  random(opts?: RandomOptions): Promise<Creation | null>;
  /** A page of the cross-user public feed, newest-published first. Non-owner
   *  rows hide prompts; `includeNsfw` opts into flagged rows. */
  feed(opts?: FeedOptions): Promise<FeedPage>;
  /** Fetch a single creation you own. */
  get(ref: CreationRef, signal?: AbortSignal): Promise<Creation>;
  /** Byte-identical duplicate of a creation (images only). The copy gets its
   *  own CDN file, inherits the original's description/tags/moderation verdict
   *  (same bytes — nothing is re-scored), and lands private in the SAME
   *  folder as the original (`move` it afterwards if you want it elsewhere).
   *  Costs no credit; rides the upload tier + storage-quota gates.
   *  Clone chains are flattened: cloning a clone points at the ORIGINAL. */
  clone(ref: CreationRef, signal?: AbortSignal): Promise<Creation>;

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

  /** IDEMPOTENT like SET (not a toggle — a retry can never double-toggle):
   *  `changed` is false when the state was already what you asked for.
   *  Any live creation is likeable; trashed/deleted rows answer 410. */
  like(ref: CreationRef, liked: boolean, signal?: AbortSignal): Promise<LikeResult>;
  /** Manually flag YOUR creation NSFW (safe → NSFW escalation; the reverse
   *  direction is not exposed here). Flips the CDN gate immediately. */
  flagNsfw(ref: CreationRef, signal?: AbortSignal): Promise<NsfwFlagResult>;
  /** Ask the vision LLM WHY a flagged creation was flagged. Cached on the
   *  row — the first call burns an LLM pass (hence the `generate` scope),
   *  repeats are free. 400 NOT_FLAGGED on clean rows; 503 = retry later. */
  explainNsfw(ref: CreationRef, signal?: AbortSignal): Promise<NsfwExplanation>;
  /** Vision-LLM quality score of a creation AS A FACE REFERENCE. Cached on
   *  the row (first call burns an LLM pass — `generate` scope). */
  scoreFaceRef(ref: CreationRef, signal?: AbortSignal): Promise<RefScore>;
  /** Vision-LLM quality score of a creation AS A CHARACTER REFERENCE. Cached
   *  on the row (first call burns an LLM pass — `generate` scope). */
  scoreCharacterRef(ref: CreationRef, signal?: AbortSignal): Promise<RefScore>;
  /** Stamp the drag-reorder order: `creationIds[i]` gets sortIndex i (≤1000
   *  ids). Ids you don't own are silently skipped. */
  reorder(creationIds: string[], signal?: AbortSignal): Promise<{ reordered: number }>;
  /** Bulk trash / untrash / delete in ONE request (≤1000 ids, owner-only).
   *  Rows whose state doesn't fit the action are counted in `skipped` —
   *  `delete` requires rows already in trash. */
  batch(action: BatchAction, ids: string[], signal?: AbortSignal): Promise<BatchResult>;
}

export function createCreations(http: Http): CreationsNamespace {
  const idOf = (ref: CreationRef): string => {
    const id = extractCreationId(ref);
    if (!id) throw new ApiError('NO_CREATION_ID', 0, 'Could not resolve a creation id from the argument.');
    return id;
  };
  const enc = (ref: CreationRef) => encodeURIComponent(idOf(ref));

  /** The shared filter params of `list` / `random` → query record. */
  const filterQuery = (opts: CreationFilterOptions) => ({
    folderId: opts.folderId === 'root' ? '__root__' : opts.folderId,
    trashed: opts.trashed ? '1' : undefined,
    activity: opts.activity,
    smart: opts.smart,
    sharedFolderId: opts.sharedFolderId,
    groupId: opts.groupId,
    search: opts.search,
    sort: opts.sort,
    ratioFilter: opts.ratioFilter,
    from: opts.from,
    to: opts.to,
    hideFiled: opts.hideFiled ? '1' : undefined,
    usedRef: opts.usedRef !== undefined ? idOf(opts.usedRef) : undefined,
  });

  return {
    async list(opts: ListOptions = {}): Promise<CreationPage> {
      if ((opts as Record<string, unknown>).random) {
        throw new ApiError('RANDOM_NOT_SUPPORTED', 0, '`list` always returns a page — use `creations.random()` for a random pick.');
      }
      const raw = await http.request<any>('GET', '/v1/creations', {
        idempotent: true,
        signal: opts.signal,
        query: {
          ...filterQuery(opts),
          limit: opts.limit,
          page: opts.page,
          beforeDate: opts.beforeDate,
        },
      });
      return {
        creations: Array.isArray(raw?.creations) ? raw.creations.map((c: any) => normalizeCreation(c, http.baseUrl)) : [],
        page: typeof raw?.page === 'number' ? raw.page : undefined,
        limit: typeof raw?.limit === 'number' ? raw.limit : undefined,
        count: typeof raw?.count === 'number' ? raw.count : undefined,
        nextBeforeDate: raw?.nextBeforeDate || undefined,
      };
    },

    async random(opts: RandomOptions = {}): Promise<Creation | null> {
      const raw = await http.request<{ creation: any }>('GET', '/v1/creations', {
        idempotent: true,
        signal: opts.signal,
        query: { ...filterQuery(opts), random: '1' },
      });
      return raw?.creation ? normalizeCreation(raw.creation, http.baseUrl) : null;
    },

    async feed(opts: FeedOptions = {}): Promise<FeedPage> {
      const raw = await http.request<any>('GET', '/v1/feed', {
        idempotent: true,
        signal: opts.signal,
        query: {
          limit: opts.limit,
          page: opts.page,
          includeNsfw: opts.includeNsfw ? '1' : undefined,
        },
      });
      return {
        creations: Array.isArray(raw?.creations) ? raw.creations.map((c: any) => normalizeCreation(c, http.baseUrl)) : [],
        page: raw?.page,
        limit: raw?.limit,
        hasMore: raw?.hasMore === true,
      };
    },

    async get(ref: CreationRef, signal?: AbortSignal): Promise<Creation> {
      const raw = await http.request<{ creation: any }>('GET', `/v1/creations/${enc(ref)}`, { idempotent: true, signal });
      return normalizeCreation(raw.creation, http.baseUrl);
    },

    async clone(ref: CreationRef, signal?: AbortSignal): Promise<Creation> {
      const raw = await http.request<{ creation: any }>('POST', `/v1/creations/${enc(ref)}/clone`, { idempotent: false, signal });
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

    async like(ref, liked, signal) {
      return http.request('POST', `/v1/creations/${enc(ref)}/like`, { json: { liked }, idempotent: false, signal });
    },

    async flagNsfw(ref, signal) {
      return http.request('POST', `/v1/creations/${enc(ref)}/flag-nsfw`, { idempotent: false, signal });
    },

    async explainNsfw(ref, signal) {
      return http.request('POST', `/v1/creations/${enc(ref)}/explain-nsfw`, { idempotent: false, signal });
    },

    async scoreFaceRef(ref, signal) {
      return http.request('POST', `/v1/creations/${enc(ref)}/score-face-ref`, { idempotent: false, signal });
    },

    async scoreCharacterRef(ref, signal) {
      return http.request('POST', `/v1/creations/${enc(ref)}/score-character-ref`, { idempotent: false, signal });
    },

    async reorder(creationIds, signal) {
      return http.request('POST', '/v1/creations/reorder', { json: { creationIds }, idempotent: false, signal });
    },

    async batch(action, ids, signal) {
      return http.request('POST', '/v1/creations/batch', { json: { action, ids }, idempotent: false, signal });
    },
  };
}
