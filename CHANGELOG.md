# Changelog

## 2.4.1 (2026-08-21)

- `telegramUser` author attribution extended to `generate.imageWithRefs` and
  `generate.wallpaper` (was image/video/similar/uploads only) — official 2DAI
  bot integrations only, same key-policy rules as 2.4.0.
- `RefParams.refCreationIds` is now optional for `character-ref` submits
  on community-enabled keys: the platform supplies the community character's
  reference images automatically and caller refs are ignored. All other
  tools still require refs (`REFS_REQUIRED` / 400).
- `UploadInput.sceneDescription` (opt-in): the upload's generated caption
  focuses on the scene, outfit and pose instead of describing the pictured
  subject. Omitted = unchanged default caption.

## 2.4.0 (2026-08-11)

- `aspectRatio: 'auto'` on `generate.image` / `generate.imageWithRefs`: the
  sentinel is passed through to the server, where the 2DAI prompt agent picks
  the best-fitting ratio from your prompt (portrait for standing characters,
  wide for landscapes, square when nothing clearly leans either way). Explicit
  `width`/`height` still win; concrete presets still resolve client-side.
- `integration: 'telegram'` + `telegramUser` author attribution on
  image/video/similar/uploads — official 2DAI bot integrations only (the key
  must carry a bot policy with `acceptExternalAuthor`).

## 2.3.2

Docs-only release: adds an "About the models" section — clarifies that
generation runs on 2DAI's own **Gen 7.1** stack on the 2DAI Private Cloud,
never re-sold third-party model access. Same content mirrored on the wiki
and in the client's top-of-file docstring. No code changes.

## 2.3.1

Docs-only release: the README shipped in the 2.3.0 tarball predated the 2.3.0
feature set — this republishes with the full 2.3.0 documentation (browsing,
organising, stats, read-only wallet data) plus the npm badge. No code changes.

## 2.3.0

Additive release — no breaking changes. Requires the server wave shipped with
the 2026-08-04 /v1 parity update (older servers 404 the new endpoints and
ignore the new listing params).

### Added
- **The full listing engine on `creations.list`** — the same lenses and
  filters the studio's cloud drive uses. Modes (mutually exclusive, 400
  `CONFLICTING_FILTERS` otherwise): the default flat listing (unchanged),
  `activity` (`all`/`history`/`uploaded`/`likes`/`public`/`trash`/`sdk`/
  `mcp`/`portfolio`), `smart` (`faces`, `videos`, `crop`, `alpha`,
  `favorites`), and `sharedFolderId` (folders shared WITH you). Cross-cutting:
  `search` (tags + descriptions, trailing-`*` prefix tokens), `sort`
  (`newest`/`oldest`/`updated`/`size-*`/`type-*`), `ratioFilter`
  (`square`/`landscape`/`portrait`), `from`/`to` date range, `hideFiled`,
  and 1-based `page` offset paging alongside the `beforeDate` cursor. The
  page now also echoes `page`/`limit`/`count`.
- **`creations.random(filters)`** — ONE uniformly-sampled creation from the
  filtered collection (or `null`). Same filters as `list`, no paging;
  `list({ random })` is rejected client-side so the two contracts stay clean.
- **`creations.feed({ limit?, page?, includeNsfw? })`** — the cross-user
  public feed, newest-published first. Non-owner rows hide prompts.
- **Row enrichment** — `Creation` gains `description`, `folderId`, `inTrash`,
  `isPublicShared`, `likes`, `isLiked`, `isOwner`, `nsfwFlagged`, `username`.
- **`creations.like(ref, liked)`** — IDEMPOTENT like set (never a toggle, so
  retries are safe) → `{ liked, likeCount, changed }`.
- **NSFW + ref tooling**: `creations.flagNsfw` (manual safe→NSFW escalation,
  owner-only), `creations.explainNsfw` (vision-LLM "why was this flagged",
  cached on the row), `creations.scoreFaceRef` / `scoreCharacterRef`
  (ref-quality scores, cached). The uncached calls burn an LLM pass and need
  the `generate` scope.
- **`creations.reorder(creationIds)`** — stamp drag-reorder order (≤1000).
- **`creations.batch(action, ids)`** — bulk trash / untrash / delete in one
  request (≤1000 ids) → `{ action, requested, processed, skipped }`.
- **`queue.cancel(queueId)`** — stop a PENDING generation; refund + slot
  release included. 409 `NOT_PENDING` once a worker picked it up.
- **`generate.wallpaper({ inputCreationId, dimension, … })`** — wallpaper-
  resize; `dimension` drives pricing (fail-closed), quality forced Ultra.
- **`'smart-edit'`** joins `generate.imageWithRefs` — refs[0] is the image to
  EDIT (≤4 refs), `prompt` is the edit instruction.
- **Upload lineage + targeting** — `uploads.image` accepts
  `croppedFromCreationId` / `erasedFromCreationId` (mutually exclusive) and
  `targetFolderId`; plus **`uploads.checkDuplicate(md5, folderId?)`** for an
  advisory pre-flight dedup probe.
- **Folder groups + richer folders** — `folders.groups.list/create/rename/
  remove` (sidebar groups; removing a group only detaches its folders);
  `Folder` gains `groupId` / `isFavorite`; `folders.create` takes `groupId`;
  `folders.update` takes `groupId: string | null`, `posterCreationId:
  string | null`, and `isFavorite`.
- **`stats` namespace** (scope `read`): `overview()` (storage / counters /
  streak / smart counts / per-tool recents), `generations({ days: 30 | 90 })`
  (volume + spend by day / tool / source), `top()` (most-used refs with
  suggested configs, styles, keywords). Cache-backed where noted.
- **`finance` namespace** — READ-ONLY money data, named 1:1 with the new
  opt-in `finance` key scope (money mutations stay dashboard-only):
  `wallet()`, `tier()`, `lock()`, `transactions({ limit?, page? })`,
  `balanceHistory({ limit? })`, `creditHistory({ limit? })`,
  `creditSources({ days? })`. `tokenPrice()` and `tiers()` only need `read`.
  `Scope` gains `'finance'`.

## 2.2.0

Additive release — no breaking changes. Requires the server wave shipped with
platform v20096 (older servers 404 the two new endpoints).

### Added
- **`generate.similar(ref, opts?)`** — re-run a stored creation ("Generate
  Similar"). The server re-derives the original tool's parameters (prompt,
  style, quality, dimensions, references) from the stored row and submits a
  fresh generation at the usual price, with the same `wait` / ticket contract
  as the other generate methods. Wallpaper-resize rows and raw uploads can't
  be re-derived and reject with a 400 `ValidationError`
  (`REGEN_UNSUPPORTED_TOOL`).
- **`creations.clone(ref)`** — byte-identical duplicate (images only). The
  copy gets its own CDN file, inherits the original's description, tags and
  moderation verdict, lands private in the same folder as the original
  (`move` it afterwards to relocate), and costs no credit. Clone chains are
  flattened server-side: cloning a clone points at the original. Requires
  the `manage` scope.
- **`creations.list({ usedRef })`** — filter to creations BUILT FROM a given
  creation: any reference slot (image refs, face/character refs, style
  sources) or lineage parent (retry, crop, erase, clone, edit) counts, with
  the same clone-family expansion as the studio's filter-by-reference lens.
- **`Creation.isCloned` / `Creation.clonedFromCreationId`** — typed on
  single-creation fetches (list rows stay curated and omit them).

### Fixed
- Old queue ids no longer go dark: the server now archives settled queue rows
  past the newest 200 per account, and `queue.get()` transparently resolves
  archived rows too, so a stored `queueId` keeps answering with its terminal
  status and `creationId` indefinitely. (Server-side change — no SDK code
  involved, documented here because 2.1.0 consumers could observe a 404
  `NotFoundError` on ids older than ~a day during the rollout window.)

## 2.1.0

> **Read the Breaking section even though this is a minor release.** Two
> published behaviours changed. A `^2.0.x` range resolves to this version
> automatically, so pin `2.0.2` if you need the old surface while you migrate.

### Breaking
- **`ClientOptions.userAgent` is removed.** It was a free-form string, but the
  server derives each creation's `source` from the User-Agent, and `source`
  drives the dashboard's SDK / MCP collections and the origin pills — an open
  string invited both typos and spoofing of a value the platform stores as data.
  Replaced by a closed set:

  ```ts
  new Client({ apiKey, integration: 'mcp', integrationVersion: '1.0.0' })
  ```

  `integration` is `'sdk'` (default) or `'mcp'`. `integrationVersion` must be a
  real `x.y.z`; a malformed value is replaced by `0.0.0` rather than omitted,
  because the token has to match `name/x.y.z` for the integration to be
  recognised at all. Normal consumers set neither and land as `sdk`, exactly as
  before. If you were passing `userAgent` to label your own traffic there is no
  replacement, by design: `source` records which official integration made the
  call, not who wrote the caller.

- **`folders.list` returns a page, not an array.** It was the one navigation
  surface with no bound at all — a drive with hundreds of collections returned
  every one of them in a single response.

  ```ts
  // before
  const folders = await client.folders.list();
  // after
  let page = await client.folders.list({ limit: 50 });
  while (page.nextBeforeDate) {
    page = await client.folders.list({ limit: 50, beforeDate: page.nextBeforeDate });
  }
  ```

  The cursor contract matches `creations.list`. The bare-`AbortSignal` call form
  (`folders.list(signal)`) still works; only the return type changed. Server-side,
  `GET /v1/folders` now defaults to 20 rows (max 100) where it used to return
  everything — a real change for a raw REST caller that sent no `limit`, **and
  for `2dai-cloud-sdk@2.0.x`**, whose `folders.list()` sends no params: against
  the updated API it returns the 20 newest folders (date order) instead of the
  full set. Upgrade to 2.1.0 for the cursor; the 2.0.x line is deprecated on npm.

### Added
- **CDN server-side resize** on `cdn.fetch`, `cdn.download`, `cdn.toBlob`,
  `cdn.toDataUrl` and `cdn.url`: `maxSide` (longest edge, aspect ratio
  preserved), plus `width` / `height` for a specific axis. The CDN does the work,
  so nothing is decoded client-side and a thumbnail costs a fraction of the
  transfer — measured against production, a 1164 kB asset returns at 132 kB with
  `maxSide: 512` and 47 kB at 256.

  ```ts
  const preview = await client.cdn.toDataUrl(gen, { maxSide: 512 });
  await client.cdn.download(gen, { maxSide: 256, savePath: './thumb' });
  ```

  `fetch` / `toBlob` / `toDataUrl` still accept a bare `AbortSignal` as their
  second argument, so existing calls are untouched. Non-finite or non-positive
  values now throw `ApiError('INVALID_TRANSFORM')` client-side rather than
  reaching the CDN as `?w=NaN`.

- `folders.list` accepts `sort` — `index`, `date-desc`, `date-asc`, `name-asc`,
  `name-desc`, `update-desc`, the same vocabulary the studio uses. Note the
  interaction with the cursor: `beforeDate` filters on the creation date, so it
  can only walk a date-descending sequence without skipping or repeating rows.
  Any other ordering is honoured but returns no `nextBeforeDate` — raise `limit`
  instead. Emitting a cursor that silently corrupts the sequence would be worse
  than withholding one.

### Fixed
- `expired` is now a terminal `QueueStatus`. The server marks stale pending jobs
  `expired`, but the SDK's terminal set omitted it, so `queue.waitFor` (and every
  `wait: true` generate call) kept polling a job the server had already settled,
  then threw `TimeoutError` instead of returning the state.
- The User-Agent reported `2dai-cloud-sdk/2.0.0` from every 2.0.x release — the
  version was hardcoded and had drifted from `package.json`. Corrected, and
  `npm run check:version` now fails the publish if the two ever diverge again.

### Documentation
- `enhanced` is documented properly: it routes your prompt through **TIXI**, the
  2DAI prompt agent, which expands a short brief into a full image-gen prompt
  (camera, lighting, composition, style anchoring) before the image model sees
  it. Costs ~2 s and no extra credit. Your text stays in `Creation.prompt`; TIXI's
  rewrite is in `raw.finalPrompt`. Also documented: face-ref, character-ref and
  wallpaper-resize always run TIXI regardless of the flag, and `generate.video`
  has no `enhanced` option at all.

## 2.0.2

### Documentation
- README now documents the **raw REST API** — base URL, bearer auth, the
  submit/poll flow with curl, and an endpoint table with required scopes —
  so non-JavaScript users have a first-class path. Full request/response
  shapes live in the new REST API wiki page.

## 2.0.1

### Added
- `Creation.source` — origin of a creation (`'web'` studio, `'sdk'`,
  `'mcp'`, `'api'` raw REST). Mirrors the dashboard's SDK / MCP cloud
  collections; stamped server-side from the request User-Agent.

## 2.0.0

Complete rewrite for the 2DAI v2 platform. **Breaking** — v2 is a new API and
a new client; v1.x code and `2dai_pk_…` keys do not carry over. Create a
`2dai_sk_…` key in your dashboard (**Integrations → API keys**) to get started.

### Added
- `Client` with typed namespaces: `generate` (image / image-with-refs / video,
  auto-polling by default), `creations` (list/get + move, trash, restore,
  delete, publish, unpublish), `folders` (list/create/update/delete),
  `uploads` (path / bytes / Blob / base64), `queue` (get / waitFor), and
  `cdn` (authenticated url / fetch / download / toBlob / toDataUrl).
- Typed error classes (`InsufficientCreditError`, `SpendLimitError`,
  `ScopeError`, `NsfwRejectedError`, `TierError`, `QueueLimitError`,
  `NotFoundError`, `RateLimitError`, `ValidationError`,
  `GenerationFailedError`, `TimeoutError` — all extending `ApiError`).
- Scoped API keys (`read` / `generate` / `manage` / `publish`) with optional
  per-key spend caps.
- Auto-minted idempotency tokens on generation submits; idempotent GETs retry
  on 429/5xx honouring `Retry-After`; submits never auto-retry.
- Request timeouts that also govern response-body reads; `AbortSignal`
  support end to end.
- Dual ESM + CJS build, TypeScript declarations, zero runtime dependencies,
  Node ≥ 18 and modern browsers.

### Removed
- The entire gen6-era 1.x surface.
