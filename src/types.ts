// Public types mirroring the 2DAI /v1 REST surface. Field names match the
// server payloads, except `outputCdnId` is surfaced as `cdnId` and relative
// `/cdn/file/...` paths are surfaced as absolute `downloadUrl`s.

export type Scope = 'read' | 'generate' | 'manage' | 'publish';

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
  nsfwRate?: number;
  creationDate?: string;
  /** The untouched server payload, for fields not surfaced above. */
  raw?: Record<string, unknown>;
}

export interface CreationPage {
  creations: Creation[];
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
}

export interface FolderPatch {
  title?: string;
  description?: string;
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
  /** Sugar → width/height at ~1MP. Ignored if width/height are given. */
  aspectRatio?: AspectRatio;
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
}

export type RefTool = 'face-ref' | 'character-ref' | 'style-transfer';

export interface RefParams {
  tool: RefTool;
  /** face/character-ref: identity refs (≤6). style-transfer: style-source refs (≤3). */
  refCreationIds: string[];
  prompt?: string;
  quality?: string;
  aspectRatio?: AspectRatio;
  width?: number;
  height?: number;
  allowNSFW?: boolean;
  /** style-transfer only — what to extract (default `'style'`). */
  extractionDirective?: string;
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

export interface ListOptions {
  /** 1..100 (default 20). */
  limit?: number;
  /** ISO date — return creations strictly older than this (pagination cursor). */
  beforeDate?: string;
  /** Filter to a collection; `'root'` = ungrouped drive root. */
  folderId?: string;
  /** List the trash instead of the active library. */
  trashed?: boolean;
  signal?: AbortSignal;
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
export interface UploadInput {
  path?: string;
  data?: Uint8Array | ArrayBuffer | Blob;
  base64?: string;
  filename?: string;
  contentType?: string;
  signal?: AbortSignal;
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
   *  Set `'mcp'` only from the official MCP server. Everything else — your own
   *  app, a script, a backend job — leaves this alone and lands as `sdk`. */
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
export type Integration = 'sdk' | 'mcp';
