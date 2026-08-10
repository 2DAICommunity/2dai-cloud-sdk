// Public types mirroring the 2DAI /v1 REST surface. Field names match the
// server payloads, except `outputCdnId` is surfaced as `cdnId` and relative
// `/cdn/file/...` paths are surfaced as absolute `downloadUrl`s.

export type Scope = 'read' | 'generate' | 'manage' | 'publish' | 'finance';

export interface KeyContext {
  keyId: string;
  label: string;
  scopes: Scope[];
  /** null = uncapped (the account's main credit is the only limit). */
  spendLimitUsd: number | null;
  spentUsd: number;
}

/** `GET /v1/me` — identity, balance, tier, and the calling key's context. */
export interface Account {
  userId: string;
  username?: string;
  creditUsd: number;
  tier: string;
  /** Whether the account's tier (Holder+/tier2+) may turn OFF the 2DAI
   *  watermark on downloads/deliveries. Below the gate it is forced on. */
  canDisableWatermark?: boolean;
  key: KeyContext;
}

export type QueueStatus =
  | 'pending' | 'pendingCharge' | 'processing' | 'inProgress'
  | 'completed' | 'failed' | 'cancelled' | 'dismissed' | 'timeout' | 'expired';

/** What a non-blocking `generate.*({ wait: false })` returns immediately. */
export interface QueueTicket {
  queueId: string;
  status: QueueStatus;
  /** Present only when a non-zero charge was applied at submit time. */
  costUsd?: number;
}

/** `GET /v1/queue/:id` — the live state of a generation. */
export interface QueueState {
  queueId: string;
  status: QueueStatus;
  costUsd?: number;
  creationId?: string;
  cdnId?: string;
  downloadUrl?: string;
  error?: string;
  createdAt?: string;
  completedAt?: string;
}

/** A creation row (from `list`, `get`, or an enriched generation result). */
export interface Creation {
  creationId: string;
  prompt?: string;
  /** Vision-derived description (owner rows carry the short form when set). */
  description?: string;
  toolKind?: string;
  style?: string | null;
  quality?: string;
  aiModel?: string;
  cdnId?: string;
  downloadUrl?: string;
  width?: number;
  height?: number;
  isUploaded?: boolean;
  /** Origin of the creation: 'web' (studio), 'sdk', 'mcp' or 'api' (raw
   *  REST). Powers the dashboard's SDK / MCP cloud collections. */
  source?: string;
  /** True for byte-identical duplicates made with `creations.clone`. Only set
   *  when the server actually sent the flag (single-creation fetches). */
  isCloned?: boolean;
  /** The ORIGIN of a clone — chains are flattened server-side, so a
   *  clone-of-a-clone still points at the original creation. */
  clonedFromCreationId?: string;
  /** Containing folder, or null/absent at the drive root (owner-only). */
  folderId?: string | null;
  inTrash?: boolean;
  isPublicShared?: boolean;
  /** Total like count. */
  likes?: number;
  /** Whether the CALLING account has liked this creation. */
  isLiked?: boolean;
  isOwner?: boolean;
  nsfwFlagged?: boolean;
  nsfwRate?: number;
  /** Owner's username (feed / shared-folder rows). */
  username?: string;
  creationDate?: string;
  /** The untouched server payload, for fields not surfaced above. */
  raw?: Record<string, unknown>;
}

export interface CreationPage {
  creations: Creation[];
  /** 1-based page echoed by the server (offset paging). */
  page?: number;
  limit?: number;
  /** Rows in THIS page (not the collection total). */
  count?: number;
  /** Pass as `beforeDate` to fetch the next page; absent when the list is exhausted. */
  nextBeforeDate?: string;
}

/** A folder (collection) in your cloud drive. */
export interface Folder {
  folderId: string;
  title?: string;
  description?: string;
  icon?: string;
  kind?: string;
  isPublicShared?: boolean;
  isShared?: boolean;
  posterCreationId?: string;
  /** Sidebar group this folder sits in; absent when ungrouped. */
  groupId?: string;
  /** Starred in the sidebar (drives the `smart: 'favorites'` lens). */
  isFavorite?: boolean;
  createdAt?: string;
  updatedAt?: string;
  raw?: Record<string, unknown>;
}

export interface FolderPage {
  folders: Folder[];
  /** Pass as `beforeDate` to fetch the next page; absent when the list is exhausted. */
  nextBeforeDate?: string;
}

export interface FolderInput {
  title: string;
  description?: string;
  /** Create the folder inside one of YOUR sidebar groups. */
  groupId?: string;
}

export interface FolderPatch {
  title?: string;
  description?: string;
  /** A group id to move the folder into, or `null` to detach it. */
  groupId?: string | null;
  /** A creation id to pin as the folder poster, or `null` to clear it. */
  posterCreationId?: string | null;
  /** Star / unstar the folder in the sidebar. */
  isFavorite?: boolean;
}

/** A sidebar folder group (`folders.groups`). */
export interface FolderGroup {
  groupId: string;
  title: string;
  sortIndex?: number;
  collapsed?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** A creation id, or any object carrying one (Creation / QueueState / result). */
export type CreationRef = string | { creationId?: string };

/** Move destination: a folder id, or `null` / `'root'` to detach to the drive root. */
export type MoveTarget = string | null;

/** The resolved result of `generate.*({ wait: true })` — a finished creation
 *  plus the originating queue id and charge. */
export interface GenerationResult extends Creation {
  queueId: string;
  costUsd?: number;
}

export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '3:2' | '2:3';

export interface ImageParams {
  prompt: string;
  /** Style id, or `'auto'` (default) to let the server pick by tier. */
  style?: string;
  /** Quality id, or `'auto'` (default) to let the server pick by tier. */
  quality?: string;
  /** Preset → width/height at ~1MP, or `'auto'` to let the 2DAI prompt
   *  agent pick the best-fitting ratio server-side (portrait for standing
   *  characters, wide for landscapes…). Ignored if width/height are given. */
  aspectRatio?: AspectRatio | 'auto';
  width?: number;
  height?: number;
  negativePrompt?: string;
  /** Rewrite the prompt with **TIXI**, the 2DAI prompt agent, before it reaches
   *  the image model (default `false`).
   *
   *  TIXI is an LLM that turns a short brief into a full image-gen prompt:
   *  it fills in camera, lens and lighting, sets composition and framing,
   *  anchors the style, and groups related details together (scattering them
   *  is what produces anatomy errors). `"a warrior"` becomes a paragraph.
   *
   *  Costs ~2 s of extra latency and nothing in credit. Best for short or
   *  vague briefs; leave it off when you have already written a precise prompt
   *  and want it honoured verbatim.
   *
   *  Your text is never discarded — the returned `Creation.prompt` is still what
   *  you sent, and TIXI's rewrite is in `raw.finalPrompt`.
   *
   *  Not a free-for-all switch across the API: face-ref, character-ref and
   *  wallpaper-resize always run TIXI (their directives depend on it), while
   *  `generate.video` has no `enhanced` option at all. */
  enhanced?: boolean;
  allowNSFW?: boolean;
  /** Up to 3 soft-conditioning reference creations. */
  refCreationIds?: string[];
  /** Idempotency token; auto-minted if omitted. */
  clientToken?: string;
  /** Official bot integrations only — see {@link TelegramAuthor}. */
  telegramUser?: TelegramAuthor;
}

export type RefTool = 'face-ref' | 'character-ref' | 'style-transfer' | 'smart-edit';

export interface RefParams {
  tool: RefTool;
  /** face/character-ref: identity refs (≤6). style-transfer: style-source
   *  refs (≤3). smart-edit: refs[0] = the image to EDIT (+ up to 3 support
   *  refs, ≤4 total); `prompt` is the edit instruction. */
  refCreationIds: string[];
  prompt?: string;
  quality?: string;
  /** Output shape. `'auto'` (server picks the best-fitting ratio) applies to
   *  `face-ref` / `character-ref` only — `smart-edit` and `style-transfer`
   *  derive their dims from the source ref, so `'auto'` there is ignored. */
  aspectRatio?: AspectRatio | 'auto';
  width?: number;
  height?: number;
  allowNSFW?: boolean;
  /** style-transfer only — what to extract (default `'style'`). */
  extractionDirective?: string;
  clientToken?: string;
}

export interface WallpaperParams {
  /** The creation to expand/resize into the target dimension. */
  inputCreationId: string;
  /** Target wallpaper dimension id — drives pricing server-side (unknown
   *  values are rejected, fail-closed). Quality is forced to Ultra. */
  dimension: string;
  /** Up to 3 extra soft-conditioning references. */
  refCreationIds?: string[];
  prompt?: string;
  allowNSFW?: boolean;
  clientToken?: string;
}

export interface VideoParams {
  prompt: string;
  /** The still creation to animate. */
  inputCreationId: string;
  /** Seconds; tier-gated (7s needs Supporter+). */
  duration?: number;
  quality?: string;
  style?: string;
  frameInterpolation?: boolean;
  allowNSFW?: boolean;
  clientToken?: string;
  /** Official bot integrations only — see {@link TelegramAuthor}. */
  telegramUser?: TelegramAuthor;
}

export interface SubmitOptions {
  /** Poll to completion and return the finished creation (default true). */
  wait?: boolean;
  /** Poll interval in ms (default 2000). */
  intervalMs?: number;
  /** Give-up deadline in ms (default 300000). */
  timeoutMs?: number;
  signal?: AbortSignal;
}

export interface WaitOptions {
  intervalMs?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
}

/** Activity lenses — the studio's fixed collections. Same membership rules
 *  as the dashboard sidebar. */
export type CreationActivity =
  | 'all' | 'history' | 'uploaded' | 'likes' | 'public' | 'trash'
  | 'sdk' | 'mcp' | 'portfolio';

/** Ordering for `creations.list`. Default is newest first; only that primary
 *  ordering emits a `nextBeforeDate` cursor. */
export type CreationSort =
  | 'newest' | 'oldest' | 'updated'
  | 'size-desc' | 'size-asc' | 'type-asc' | 'type-desc';

/** Aspect-ratio buckets for `ratioFilter` — a single bucket or a
 *  comma-separated set (`'square,portrait'`). Unknown ids are dropped
 *  server-side. */
export type RatioBucket = 'square' | 'landscape' | 'portrait';

/** The cross-cutting listing filters shared by `creations.list` and
 *  `creations.random`. The MODES are mutually exclusive — combining
 *  `activity`, `smart`, `sharedFolderId` or a `folderId` mode rejects with
 *  400 `CONFLICTING_FILTERS`, as does `trashed` with anything but the
 *  default listing. */
export interface CreationFilterOptions {
  /** Filter to a collection; `'root'` = ungrouped drive root. */
  folderId?: string;
  /** List the trash instead of the active library. */
  trashed?: boolean;
  /** Activity lens (studio fixed collections). */
  activity?: CreationActivity;
  /** Smart-collection lens: `'faces'`, `'videos'`, `'crop'`, `'alpha'`, or
   *  `'favorites'` (creations inside starred folders). */
  smart?: string;
  /** A folder SHARED WITH you (view access) — read-only collaborator lens. */
  sharedFolderId?: string;
  /** Free-text search over descriptions + tags. Whole-word AND across
   *  tokens; a trailing `*` makes a token a prefix (`cur*`). Capped at
   *  128 chars / 8 tokens. */
  search?: string;
  /** Ordering override (default: newest first). */
  sort?: CreationSort;
  /** Aspect-ratio buckets — one id or a comma-separated set. */
  ratioFilter?: RatioBucket | string;
  /** Only creations at/after this date (ISO string or epoch ms). */
  from?: string | number;
  /** Only creations at/before this date (ISO string or epoch ms). */
  to?: string | number;
  /** Exclude creations already filed into a folder. Only meaningful on the
   *  history/uploaded/likes/sdk/mcp activity lenses. */
  hideFiled?: boolean;
  /** Only creations BUILT FROM this creation — any reference slot or lineage
   *  parent (retry, crop, erase, clone, edit) counts, and the server expands
   *  clone families exactly like the studio's filter-by-reference lens. */
  usedRef?: CreationRef;
  signal?: AbortSignal;
}

export interface ListOptions extends CreationFilterOptions {
  /** 1..100 (default 20). */
  limit?: number;
  /** 1-based page for offset paging. Prefer the `beforeDate` cursor for
   *  deep walks — offsets get slower with depth. */
  page?: number;
  /** ISO date — return creations strictly older than this (pagination cursor). */
  beforeDate?: string;
  /** Not accepted here — use `creations.random()` for a random pick. */
  random?: never;
}

/** `creations.random` — same filters as `list`, minus paging (the sample
 *  considers the whole filtered collection). */
export type RandomOptions = CreationFilterOptions;

export interface FeedOptions {
  /** 1..48 (default 24). */
  limit?: number;
  /** 1-based page (max 1000). */
  page?: number;
  /** Include NSFW-flagged rows (you are an authenticated viewer). */
  includeNsfw?: boolean;
  signal?: AbortSignal;
}

/** A page of the cross-user public feed. Non-owner rows hide prompts. */
export interface FeedPage {
  creations: Creation[];
  page: number;
  limit: number;
  hasMore: boolean;
}

/** `creations.like` — idempotent SET, so `changed` is false on repeats. */
export interface LikeResult {
  liked: boolean;
  likeCount: number;
  changed: boolean;
}

/** `creations.flagNsfw` — manual escalation (safe → NSFW, owner-only). */
export interface NsfwFlagResult {
  nsfwFlagged: true;
  nsfwManual: string;
  nsfwRate: number;
}

/** `creations.explainNsfw` — vision-LLM "why was this flagged". */
export interface NsfwExplanation {
  explanation: string;
  /** True when served from the stored explanation (free, no LLM call). */
  cached: boolean;
  nsfwRate?: number;
  nsfwThreshold: number;
}

/** `creations.scoreFaceRef` / `scoreCharacterRef` — ref-quality score. */
export interface RefScore {
  score: number;
  scoredAt?: string;
  /** True when served from the stored score (free, no LLM call). */
  cached: boolean;
}

export type BatchAction = 'trash' | 'untrash' | 'delete';

/** `creations.batch` — rows whose state doesn't fit the action are counted
 *  in `skipped` (e.g. `delete` requires the row to already be in trash). */
export interface BatchResult {
  action: BatchAction;
  requested: number;
  processed: number;
  skipped: number;
}

/** Ordering for `folders.list`. Same vocabulary the studio uses; `index` is the
 *  drag-reorder order shown in the sidebar. */
export type FolderSort = 'index' | 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc' | 'update-desc';

/** Pagination for `folders.list` — the same cursor contract as `ListOptions`,
 *  minus the creation filters, which have no meaning on a folder list. */
export interface FolderListOptions {
  /** 1..100 (default 20). */
  limit?: number;
  /** ISO date — return folders strictly older than this (pagination cursor).
   *  Only meaningful for the default and `date-desc` orderings; see `sort`. */
  beforeDate?: string;
  /** Ordering (default: newest first). Note the interaction with the cursor:
   *  `beforeDate` filters on the creation date, so it can only walk a
   *  date-descending sequence without skipping or repeating rows. Ask for any
   *  other ordering and you get it, but `nextBeforeDate` comes back undefined —
   *  raise `limit` instead, which at 100 covers any realistic drive. */
  sort?: FolderSort;
  signal?: AbortSignal;
}

/** `folders.list` took a bare `AbortSignal` before it was paginated; both forms
 *  still work. */
export type FolderListArg = AbortSignal | FolderListOptions;

export interface DeleteFolderOptions {
  /** Also send the folder's creations to trash (default: detach them to root). */
  trashContents?: boolean;
  signal?: AbortSignal;
}

/** An uploadable source. Node accepts `path`; both runtimes accept `data`/`base64`. */
/** External display-author for OFFICIAL bot integrations only. Requires an
 *  API key minted with `acceptExternalAuthor` (superadmin bot keys); any other
 *  key gets 403 EXTERNAL_AUTHOR_FORBIDDEN. Display-only — ownership stays on
 *  the key's account. */
export interface TelegramAuthor {
  id: number;
  username?: string;
  first_name?: string;
}

export interface UploadInput {
  /** Official bot integrations only — see {@link TelegramAuthor}. */
  telegramUser?: TelegramAuthor;
  path?: string;
  data?: Uint8Array | ArrayBuffer | Blob;
  base64?: string;
  filename?: string;
  contentType?: string;
  /** Record this upload as a CROP of an existing creation you own (images
   *  only) — description/tags/moderation verdict are inherited. Mutually
   *  exclusive with `erasedFromCreationId`. */
  croppedFromCreationId?: string;
  /** Record this upload as an ERASE edit of an existing creation you own
   *  (images only). Mutually exclusive with `croppedFromCreationId`. */
  erasedFromCreationId?: string;
  /** Land the upload directly inside this folder instead of the drive root. */
  targetFolderId?: string;
  signal?: AbortSignal;
}

/** `uploads.checkDuplicate` — advisory pre-flight (the upload itself still
 *  re-checks; a concurrent upload can race this answer). */
export interface DuplicateCheck {
  duplicate: boolean;
  existingCreationId: string | null;
  folderId: string | null;
}

/** Raw bytes of a CDN asset plus its content-type. */
export interface CdnAsset {
  bytes: Uint8Array;
  contentType: string;
  ext: string;
}

/** Anything that carries a CDN id — a raw id, or a Creation / QueueState / result. */
export type CdnRef =
  | string
  | { cdnId?: string; outputCdnId?: string; downloadUrl?: string };

/** Freshness of the server-side stats cache backing a response. */
export interface StatsCacheInfo {
  computedAt: string | null;
  ageSeconds: number | null;
  /** True when the blob was stale — a background refresh has been kicked;
   *  re-fetch in a bit for fresher numbers. */
  stale: boolean;
}

/** `stats.overview` — storage, counters, streak, smart-collection counts and
 *  per-tool recents for the key's account. */
export interface StatsOverview {
  storage: {
    usedBytes: number;
    quotaBytes: number;
    imageBytes: number;
    videoBytes: number;
    uploadBytes: number;
    trashBytes: number;
  };
  counters: {
    totalCreations: number;
    weekCreations: number;
    weekDelta: number;
    privateFolders: number;
    sharedFolders: number;
    favoriteFolders: number;
    trashCreations: number;
  };
  streak: { days: number };
  smartSummaries: Array<{ id: string; count: number }>;
  toolsRecent: Record<string, { total: number; recentIds: string[] }>;
  cache: StatsCacheInfo;
}

/** `stats.generations` — net generation volume + spend over a window. */
export interface StatsGenerations {
  days: number;
  totals: { count: number; costUsd: number };
  byDay: Array<{ day: string; count: number; costUsd: number }>;
  byTool: Array<{ toolKind: string; count: number; costUsd: number }>;
  bySource: {
    machine: { count: number; costUsd: number };
    studio: { count: number; costUsd: number };
  };
}

/** One most-used reference with the config the studio would suggest for it. */
export interface TopRef {
  referenceCreationId: string;
  useCount: number;
  suggestedTool?: string;
  latestUsedAt: string | null;
  suggestedConfig: {
    quality: string | null;
    style: string | null;
    motionStyle: string | null;
    requestedDuration: number | null;
    isEnhanced: boolean;
    frameInterpolation: boolean;
  };
}

/** `stats.top` — most-used refs, styles and keywords. */
export interface StatsTop {
  topRefs: TopRef[];
  topStyles: Array<{ style: string; count: number }>;
  topKeywords: Array<{ tag: string; count: number }>;
  cache: StatsCacheInfo;
}

/** `finance.wallet` — balance snapshot for the key's account. */
export interface FinanceWallet {
  /** $2DAI token balance (on-chain ledger, withdrawable). */
  tokens: number;
  /** USD credit (off-chain ledger, spend-only — what generations burn). */
  creditUsd: number;
  /** Effective tier id (`tier0`..`tier5`). */
  tier: string;
  pendingWithdrawal: boolean;
  pendingSwap: boolean;
  lockActive: boolean;
}

/** `finance.tier` — the 4 legs the effective tier is the max of. */
export interface AccountTier {
  effective: string;
  legs: {
    db: string | null;
    watermark: string | null;
    holdWatermark: string | null;
    dynamic: string | null;
  };
}

/** `finance.lock` — staking-lock lifecycle. `expiring-soon` = under 24h left
 *  (or ended, pending the expiry sweep). */
export type WalletLockStatus =
  | { kind: 'none' }
  | { kind: 'active' | 'expiring-soon'; lock: Record<string, unknown>; remainingMs: number };

/** One row of `finance.transactions` (deposits / withdrawals / swaps). */
export interface WalletTransaction {
  id: string;
  type: string;
  /** Unified status pill: credited / sent / refunded / rejected / pending /
   *  confirming / canceled / swapped. */
  status: string;
  asset: '2DAI' | 'USD';
  /** Magnitude — prepend the sign from `type` yourself. */
  amount: number;
  hash: string | null;
  date: string;
  processedDate: string | null;
  counterparty: string | null;
  reason: string | null;
  needsAdminReview: boolean;
  /** Swap rows only: the USD credited alongside the debited tokens. */
  secondaryUsd: number | null;
}

export interface TransactionPage {
  transactions: WalletTransaction[];
  /** 0-based page echoed by the server. */
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/** One point of a balance/credit history chart. */
export interface BalancePoint {
  date: string;
  /** Running balance AFTER this event. */
  balance: number;
  delta: number;
  /** The transaction type that produced the point. */
  type: string;
}

/** `finance.balanceHistory` — $2DAI balance over time. */
export interface BalanceHistory {
  currentBalance: number;
  airdropUsdCredit: number;
  points: BalancePoint[];
}

/** `finance.creditHistory` — USD credit over time. */
export interface CreditHistory {
  currentCredit: number;
  tokenBalance: number;
  points: BalancePoint[];
}

/** `finance.creditSources` — where credit came from / went over a window. */
export interface CreditSources {
  days: number;
  accruedUsd: number;
  bonusesUsd: number;
  swappedUsd: number;
  spentUsd: number;
}

/** `finance.tokenPrice` — the cached $2DAI quote (machines never trigger a
 *  live refresh; `staleMs` says how old the cache is). */
export interface TokenPrice {
  usdPrice: number;
  asOf: string | null;
  staleMs: number | null;
}

/** One entry of the public tier catalogue (`finance.tiers`). */
export interface TierInfo {
  /** Stable tier id (`tier0`..`tier5`). */
  key: string;
  name: string;
  /** USD lock-value floor to qualify. 0 for the free tier. */
  valueUSD: number;
  icon?: string;
  color?: string;
  gradientFrom?: string;
  gradientTo?: string;
  /** Per-tier defaults (queue caps, storage quota, feature gates, …). */
  settings?: Record<string, unknown>;
}

export interface ClientOptions {
  /** `2dai_sk_<keyId>_<secret>` from the dashboard → Integrations → API keys. */
  apiKey: string;
  /** API origin. Default `https://dapp.2dai.io:444`. */
  baseUrl?: string;
  /** Injectable fetch (tests / custom agents). Defaults to the global. */
  fetch?: typeof fetch;
  /** Per-request network timeout in ms (default 60000). */
  timeoutMs?: number;
  /** Retry cap for idempotent GETs on 429/5xx (default 2). */
  maxRetries?: number;
  /** Which official 2DAI integration this client runs inside (default `'sdk'`).
   *
   *  This is a closed set, not a free-form User-Agent: the server derives each
   *  creation's `source` from the client token, and `source` drives the
   *  dashboard's SDK / MCP collections and the origin pills. An open string
   *  invited both typos and spoofing of a label the platform treats as data.
   *
   *  Set `'mcp'` only from the official MCP server and `'telegram'` only from
   *  the official Telegram bot. Everything else — your own app, a script, a
   *  backend job — leaves this alone and lands as `sdk`. */
  integration?: Integration;
  /** Version of that integration, appended to the User-Agent for diagnostics
   *  (e.g. the MCP server's own version). Must look like `1.2.3`, optionally
   *  with a prerelease/build suffix. A malformed value is replaced by `0.0.0`
   *  rather than omitted — the token must match `name/x.y.z` for the server to
   *  recognise the integration at all, so an honest placeholder beats silently
   *  losing the attribution. */
  integrationVersion?: string;
}

/** Official integrations that may identify themselves to the API. Extending
 *  this means teaching `machineSourceFromUserAgent` about the new token too —
 *  the two live and die together. */
export type Integration = 'sdk' | 'mcp' | 'telegram';
