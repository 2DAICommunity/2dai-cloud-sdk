# 2dai-cloud-sdk

[![npm](https://img.shields.io/npm/v/2dai-cloud-sdk)](https://www.npmjs.com/package/2dai-cloud-sdk)

Typed JavaScript/TypeScript client for the [2DAI](https://2dai.io) generation API.
Generate images and video, upload references, browse and organise your cloud
drive, and download results — all with an API key. Node 18+ and modern browsers.
Zero runtime dependencies.

Not on JavaScript? The same platform is a plain REST API — jump to
[Use the REST API](#not-on-javascript-use-the-rest-api).

```bash
npm install 2dai-cloud-sdk
```

## Get a key

Sign in at [2dai.io](https://2dai.io) (any active account works — no plan
required), then in the dashboard open **Integrations → API keys → + New key**.
Keys look like `2dai_sk_…`, carry scopes (`read`, `generate`, …), and can have
an optional spend cap. The secret is shown once — store it somewhere safe. API
generations spend your account credit exactly like the studio. Full walkthrough:
[Getting Started](https://github.com/2DAICommunity/2dai-cloud-sdk/wiki/Getting-Started).

## Quickstart

```ts
import { Client } from '2dai-cloud-sdk';

const client = new Client({ apiKey: process.env.TWODAI_API_KEY! });

// Generates, waits for completion, and returns the finished creation.
const gen = await client.generate.image({ prompt: 'a red origami fox', aspectRatio: '1:1' });
console.log(gen.creationId, gen.downloadUrl);

// Save the actual bytes to disk (Node).
await client.download(gen, { savePath: './fox' }); // → ./fox.jpg
```

## Generating

`generate.*` submits to an async queue. By default it **polls to completion** and
returns the finished `GenerationResult`. Pass `{ wait: false }` to get the queue
ticket immediately and poll yourself.

```ts
// One-shot (default): resolves when the image is ready.
const img = await client.generate.image({
  prompt: 'a neon city street, rain',
  aspectRatio: '16:9',
  // style + quality default to 'auto' (the server picks by your tier)
});

// `enhanced` rewrites your prompt with TIXI, the 2DAI prompt agent, before it
// reaches the image model — it fills in camera, lighting, composition and style
// from a short brief. ~2s extra, no extra credit. Your text stays in `.prompt`;
// TIXI's version is in `.raw.finalPrompt`.
const rich = await client.generate.image({ prompt: 'a warrior', enhanced: true });

// Non-blocking: get a ticket now, poll later.
const { queueId } = await client.generate.image({ prompt: '…' }, { wait: false });
const state = await client.queue.waitFor(queueId, { timeoutMs: 300_000 });

// Reference tools (face-ref / character-ref / style-transfer / smart-edit):
const ref = await client.generate.imageWithRefs({
  tool: 'face-ref',
  prompt: 'as an astronaut',
  refCreationIds: [gen.creationId],
});

// Smart edit: refs[0] is the image to EDIT, the prompt is the instruction.
const edited = await client.generate.imageWithRefs({
  tool: 'smart-edit',
  prompt: 'replace the background with a rainy neon street',
  refCreationIds: [gen.creationId],
});

// Video from an existing still:
const vid = await client.generate.video({
  prompt: 'gentle camera push-in',
  inputCreationId: gen.creationId,
  duration: 5,
});

// Wallpaper-resize: expand a creation into a wallpaper dimension.
// Quality is always Ultra; the dimension drives the price.
const wall = await client.generate.wallpaper({
  inputCreationId: gen.creationId,
  dimension: 'widescreen',   // 'standard' | 'photo' | 'widescreen' | 'ultrawide'
});
```

Each tool caps its references (3 image · 6 face/character · 3 style-transfer ·
4 smart-edit · 3 wallpaper) — exceeding a cap rejects with `TOO_MANY_REFS`
before anything is charged. A ticket that is still **pending** can be stopped
with `client.queue.cancel(queueId)`; the charge is refunded. Details:
[Generating](https://github.com/2DAICommunity/2dai-cloud-sdk/wiki/Generating).

## Uploading your own media

Bring an image/gif/mp4 into your library so it can be used as a reference or
animated. The same moderation pass as the studio runs server-side.

```ts
const up = await client.uploads.image({ path: './portrait.jpg' });      // Node
const up2 = await client.uploads.image({ data: fileBlob });             // Browser
await client.generate.imageWithRefs({ tool: 'character-ref', prompt: 'in a suit', refCreationIds: [up.creationId] });

// File it straight into a folder, and skip re-uploads with the md5 pre-flight:
const probe = await client.uploads.checkDuplicate(md5Hex, folder.folderId);
if (!probe.duplicate) {
  await client.uploads.image({ path: './portrait.jpg', targetFolderId: folder.folderId });
}
```

`targetFolderId` files the upload into a folder you can write to (403
`INVALID_FOLDER` otherwise). `croppedFromCreationId` / `erasedFromCreationId`
record the upload as a crop or erase edit of a creation you own. Details:
[Uploads](https://github.com/2DAICommunity/2dai-cloud-sdk/wiki/Uploads).

## Downloading

`client.cdn` authenticates with your key, so it works for private creations too.
Accepts a CDN id, a `Creation`, a `QueueState`, or a generation result.

```ts
await client.cdn.download(gen, { savePath: './out' });   // Node → './out.jpg' (ext inferred)
const asset = await client.cdn.fetch(gen);               // { bytes, contentType, ext }
const blob = await client.cdn.toBlob(gen);               // Browser
const dataUrl = await client.cdn.toDataUrl(gen);         // <img src={dataUrl} />

// The CDN can resize before it sends: `maxSide` scales the longest edge and
// keeps the aspect ratio, so one call covers portrait and landscape.
const preview = await client.cdn.toDataUrl(gen, { maxSide: 512 });   // 1164 kB → 132 kB
await client.cdn.download(gen, { maxSide: 256, savePath: './thumb' }); // composes with savePath
```

`maxSide` is what you want for previews and thumbnails; `width` / `height` target
one axis specifically and may crop. Details:
[Downloading](https://github.com/2DAICommunity/2dai-cloud-sdk/wiki/Downloading).

## Cloud drive

Organise your library from code — folders, moving, trash, publishing (scopes:
`manage` for organising, `publish` for the public feed).

```ts
const folder = await client.folders.create({ title: 'Brand assets' });
await client.creations.move(gen, folder.folderId);   // or move(gen, 'root')
await client.creations.publish(gen);                 // generated work only
await client.creations.trash(gen);                   // reversible
await client.creations.restore(gen);
await client.creations.trash(gen); await client.creations.delete(gen); // permanent (trash first)
await client.folders.delete(folder.folderId, { trashContents: true });
```

## Browsing your library

`creations.list` speaks the same lenses and filters as the studio's cloud
drive — one *mode* per call (a folder, an activity view, a smart collection,
or a folder shared with you), plus filters that compose with any of them.

```ts
await client.creations.list({ folderId: folder.folderId });   // or 'root', or { trashed: true }
await client.creations.list({ activity: 'uploaded' });        // all|history|uploaded|likes|public|trash|sdk|mcp|portfolio
await client.creations.list({ smart: 'faces' });              // faces|videos|crop|alpha|favorites

// Filters compose with any lens: whole-word search (trailing * = prefix),
// sort, aspect-ratio buckets, date range…
await client.creations.list({ search: 'red fox*', sort: 'size-desc', ratioFilter: 'portrait' });

// ONE uniformly-random creation from any lens:
const surprise = await client.creations.random({ smart: 'favorites' });

// The cross-user public feed:
const feed = await client.creations.feed({ limit: 48 });
```

Paginate with `nextBeforeDate` (limit 1..100) or 1-based `page`. Rows carry
`description`, `folderId`, `inTrash`, `isPublicShared`, `likes`, `isLiked`
and more. Details:
[Cloud Drive](https://github.com/2DAICommunity/2dai-cloud-sdk/wiki/Cloud-Drive).

## Organising

```ts
await client.creations.like(gen, true);              // idempotent SET, retry-safe
await client.creations.batch('trash', ids);          // bulk trash/untrash/delete, ≤1000 ids
await client.creations.reorder([id1, id2, id3]);     // stamp drag-reorder order

// Sidebar folder groups + folder metadata:
const group = await client.folders.groups.create('Client work');
await client.folders.update(folder.folderId, {
  groupId: group.groupId,            // null detaches
  posterCreationId: gen.creationId,  // null clears
  isFavorite: true,
});
```

Deleting a group only detaches its folders — nothing else is deleted.

## Account & history

```ts
const me = await client.me();
console.log(me.creditUsd, me.tier, me.key.scopes);

const page = await client.creations.list({ limit: 20 });
const one = await client.creations.get(page.creations[0].creationId);

const state = await client.queue.get(queueId);       // one-shot status read
const url = client.cdn.url(one);                      // raw CDN url (public creations)
```

## Stats

Read-only account analytics (scope `read`):

```ts
const o = await client.stats.overview();               // storage, counters, streak, per-tool recents
const g = await client.stats.generations({ days: 30 }); // volume + spend by day / tool / source
const t = await client.stats.top();                    // most-used refs (with suggested config), styles, keywords
```

## Wallet data (read-only)

The `finance` namespace reads your wallet: balance, tier, staking lock,
transactions, balance/credit history. It needs a key minted **with the opt-in
`finance` scope** (off by default) — and it is strictly read-only: no deposit,
withdraw, swap or lock operation exists on the API-key surface, so a `finance`
key can see numbers but can never move funds.

```ts
const w = await client.finance.wallet();          // tokens, creditUsd, tier, pending flags
const tx = await client.finance.transactions({ limit: 20 });
const price = await client.finance.tokenPrice();  // cached $2DAI quote — only needs `read`
```

Depth: [Stats & Wallet](https://github.com/2DAICommunity/2dai-cloud-sdk/wiki/Stats-and-Wallet).

## Error handling

Every failure throws a typed error you can branch on:

```ts
import { InsufficientCreditError, SpendLimitError, NsfwRejectedError, ApiError } from '2dai-cloud-sdk';

try {
  await client.generate.image({ prompt: '…' });
} catch (err) {
  if (err instanceof InsufficientCreditError) console.log('Top up:', err.deficitUsd);
  else if (err instanceof SpendLimitError) console.log('Key cap hit at', err.spendLimitUsd);
  else if (err instanceof NsfwRejectedError) console.log('Blocked by moderation');
  else if (err instanceof ApiError) console.log(err.code, err.httpStatus);
  else throw err;
}
```

Other errors: `AuthError`, `ScopeError`, `TierError`, `QueueLimitError`,
`RateLimitError`, `ValidationError`, `NotFoundError`, `GenerationFailedError`,
`TimeoutError`. All extend `ApiError` (`.code`, `.httpStatus`, `.details`).

## The 2DAI stack

We currently use our **Gen 7.1** model, and unlike others, we don't resell
model access. All our models originate from the open-source community or our
own R&D — we then disassemble, modify, fine-tune and optimize them to align
with our legacy and **2DAI❤️ART** lines. They also run on our own private
cloud network.

The prompt rewriter (the "TIXI" pass that expands short prompts before
generation) is our own in-house LLM — same rule: not re-sold third-party
model access. Depth:
[About the Models](https://github.com/2DAICommunity/2dai-cloud-sdk/wiki/About-the-Models).

## Not on JavaScript? Use the REST API

Everything below is plain HTTP — the SDK is a convenience layer, not a gate.
Base URL `https://dapp.2dai.io:444/v1`, bearer auth, JSON in and out.
Generation is asynchronous: submit, then poll.

```bash
# 1 · submit → returns a queueId
curl -X POST https://dapp.2dai.io:444/v1/generate/image \
  -H "Authorization: Bearer $TWODAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"a lighthouse at dusk"}'

# 2 · poll until status is completed, then fetch downloadUrl with the same bearer
curl https://dapp.2dai.io:444/v1/queue/$QUEUE_ID \
  -H "Authorization: Bearer $TWODAI_API_KEY"
```

| Method | Endpoint | Scope | What |
|---|---|---|---|
| GET | `/v1/me` | `read` | Account, credit, key scopes |
| POST | `/v1/generate/image` | `generate` | Text → image |
| POST | `/v1/generate/image-with-refs` | `generate` | Face / character ref, style transfer, smart edit |
| POST | `/v1/generate/wallpaper` | `generate` | Wallpaper-resize (priced by dimension) |
| POST | `/v1/generate/video` | `generate` | Still → video |
| POST | `/v1/uploads` | `generate` | Upload media (multipart) |
| GET | `/v1/uploads/check-duplicate` | `read` | md5 pre-flight dedup probe |
| GET | `/v1/queue/:queueId` | `read` | Poll a generation |
| POST | `/v1/queue/:queueId/cancel` | `generate` | Cancel a pending generation (refunds) |
| GET | `/v1/creations` | `read` | List / search your drive (lenses + filters) |
| GET | `/v1/creations/:id` | `read` | One creation, full detail |
| GET | `/v1/feed` | `read` | The cross-user public feed |
| POST | `/v1/creations/:id/move` \| `/trash` \| `/restore` \| `/like` | `manage` | Organise |
| POST | `/v1/creations/reorder` \| `/batch` | `manage` | Reorder / bulk actions |
| DELETE | `/v1/creations/:id` | `manage` | Permanent delete (trash first) |
| POST | `/v1/creations/:id/publish` \| `/unpublish` | `publish` | Public feed |
| GET/POST/PATCH/DELETE | `/v1/folders` | `read` / `manage` | Folders |
| GET/POST/PATCH/DELETE | `/v1/folder-groups` | `read` / `manage` | Sidebar folder groups |
| GET | `/v1/stats/overview` \| `/generations` \| `/top` | `read` | Account analytics |
| GET | `/v1/wallet*`, `/v1/account/tier` | `finance` | Read-only wallet data |
| GET | `/v1/tiers`, `/v1/token/price` | `read` | Tier catalogue, cached token quote |
| GET | `/cdn/file/:cdnId` | `read` | Download bytes (`?s=512` for a preview) |

Full request/response shapes, every error code and the limits are documented in
the **[REST API reference](https://github.com/2DAICommunity/2dai-cloud-sdk/wiki/REST-API)**.

## Configuration

```ts
new Client({
  apiKey: '2dai_sk_…',   // required
  baseUrl,               // default 'https://dapp.2dai.io:444'
  timeoutMs,             // per-request network timeout, default 60000
  maxRetries,            // idempotent GET retries on 429/5xx, default 2
  fetch,                 // inject a custom fetch
  integration,           // 'sdk' (default) | 'mcp' — official 2DAI integrations
  integrationVersion,    // that integration's own semver, e.g. '1.4.0'
});
```

`integration` is a closed set rather than a free-form User-Agent, and you should
leave it alone: the server stamps each creation's `source` from it, and the
dashboard reads `source` to fill its SDK / MCP collections and label where a row
came from. `'mcp'` is reserved for the official 2DAI MCP server; anything you
build reports as `sdk`. `integrationVersion` must be a real `1.2.3`; a malformed
value is replaced by `0.0.0` rather than omitted, so the token still attributes.

Generation submits are never auto-retried (they may charge); the SDK attaches an
idempotency token so your own retry of an identical call within a few seconds is
de-duplicated server-side.

## License

MIT
