# 2dai-cloud-sdk

Typed JavaScript/TypeScript client for the [2DAI](https://2dai.io) generation API.
Generate images and video, upload references, and download results — all with an
API key. Node 18+ and modern browsers. Zero runtime dependencies.

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

// Non-blocking: get a ticket now, poll later.
const { queueId } = await client.generate.image({ prompt: '…' }, { wait: false });
const state = await client.queue.waitFor(queueId, { timeoutMs: 300_000 });

// Reference tools (face-ref / character-ref / style-transfer):
const ref = await client.generate.imageWithRefs({
  tool: 'face-ref',
  prompt: 'as an astronaut',
  refCreationIds: [gen.creationId],
});

// Video from an existing still:
const vid = await client.generate.video({
  prompt: 'gentle camera push-in',
  inputCreationId: gen.creationId,
  duration: 5,
});
```

## Uploading your own media

Bring an image/gif/mp4 into your library so it can be used as a reference or
animated. The same moderation pass as the studio runs server-side.

```ts
const up = await client.uploads.image({ path: './portrait.jpg' });      // Node
const up2 = await client.uploads.image({ data: fileBlob });             // Browser
await client.generate.imageWithRefs({ tool: 'character-ref', prompt: 'in a suit', refCreationIds: [up.creationId] });
```

## Downloading

`client.cdn` authenticates with your key, so it works for private creations too.
Accepts a CDN id, a `Creation`, a `QueueState`, or a generation result.

```ts
await client.cdn.download(gen, { savePath: './out' });   // Node → './out.jpg' (ext inferred)
const asset = await client.cdn.fetch(gen);               // { bytes, contentType, ext }
const blob = await client.cdn.toBlob(gen);               // Browser
const dataUrl = await client.cdn.toDataUrl(gen);         // <img src={dataUrl} />
```

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

Browse it: `creations.list({ folderId })`, `{ folderId: 'root' }`, or
`{ trashed: true }` — paginate with `nextBeforeDate` (limit 1..100).

## Account & history

```ts
const me = await client.me();
console.log(me.creditUsd, me.tier, me.key.scopes);

const page = await client.creations.list({ limit: 20 });
const one = await client.creations.get(page.creations[0].creationId);

const state = await client.queue.get(queueId);       // one-shot status read
const url = client.cdn.url(one);                      // raw CDN url (public creations)
```

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
| POST | `/v1/generate/image-with-refs` | `generate` | Face / character ref, style transfer |
| POST | `/v1/generate/video` | `generate` | Still → video |
| POST | `/v1/uploads` | `generate` | Upload media (multipart) |
| GET | `/v1/queue/:queueId` | `read` | Poll a generation |
| GET | `/v1/creations` | `read` | List your drive (paginated) |
| GET | `/v1/creations/:id` | `read` | One creation, full detail |
| POST | `/v1/creations/:id/move` \| `/trash` \| `/restore` | `manage` | Organise |
| DELETE | `/v1/creations/:id` | `manage` | Permanent delete (trash first) |
| POST | `/v1/creations/:id/publish` \| `/unpublish` | `publish` | Public feed |
| GET/POST/PATCH/DELETE | `/v1/folders` | `read` / `manage` | Folders |
| GET | `/cdn/file/:cdnId` | `read` | Download bytes (`?w=512` for a preview) |

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
});
```

Generation submits are never auto-retried (they may charge); the SDK attaches an
idempotency token so your own retry of an identical call within a few seconds is
de-duplicated server-side.

## License

MIT
