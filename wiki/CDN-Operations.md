# CDN Operations

Download, transform, and watermark generated content.

## Table of Contents

- [Downloading Content](#downloading-content)
- [Format Conversion](#format-conversion)
- [Resizing](#resizing)
- [Video Frame Extraction](#video-frame-extraction)
- [Watermarking](#watermarking)
- [Manual Download](#manual-download)
- [CDN URL Pattern](#cdn-url-pattern)

---

## Downloading Content

Use `downloadFromCDN()` to download images or videos with automatic authentication.

### Basic Download

```typescript
import fs from 'fs';
import { createClient } from '2dai-cloud-sdk';

const client = createClient('2dai_pk_your_api_key');

const { buffer, mimeType, size } = await client.downloadFromCDN(imageId);
fs.writeFileSync('image.jpg', buffer);
console.log(`Downloaded ${size} bytes (${mimeType})`);
```

### Download Options

| Option | Type | Description |
|--------|------|-------------|
| `format` | `'jpg' \| 'png' \| 'gif' \| 'mp4'` | Output format |
| `width` | `number` | Target width in pixels |
| `height` | `number` | Target height in pixels |
| `watermark` | `string` | Watermark CDN ID |
| `watermarkPosition` | `string` | Watermark position |
| `seek` | `number` | Video timestamp in ms |

---

## Format Conversion

Convert between image/video formats on download.

```typescript
// Convert to PNG
const { buffer: pngBuffer } = await client.downloadFromCDN(imageId, {
  format: 'png'
});
fs.writeFileSync('image.png', pngBuffer);

// Convert to GIF
const { buffer: gifBuffer } = await client.downloadFromCDN(imageId, {
  format: 'gif'
});
```

### Supported Formats

| Format | Extension | Description |
|--------|-----------|-------------|
| JPEG | `.jpg`, `.jpeg` | Standard image format |
| PNG | `.png` | Lossless with transparency |
| GIF | `.gif` | Static or animated |
| MP4 | `.mp4` | Video format |

### Conversion Matrix

| From \ To | PNG | JPG | GIF |
|-----------|-----|-----|-----|
| PNG       | -   | Yes | Yes |
| JPG       | Yes | -   | Yes |
| GIF       | Yes | Yes | -   |
| MP4       | Yes | Yes | Yes |

**Notes:**
- Converting animated GIF extracts the first frame
- MP4 to image formats extracts a single frame

---

## Resizing

Resize images on download.

```typescript
// Create thumbnail
const { buffer } = await client.downloadFromCDN(imageId, {
  format: 'jpg',
  width: 256,
  height: 256
});
fs.writeFileSync('thumbnail.jpg', buffer);
```

---

## Video Frame Extraction

Extract frames from videos at specific timestamps.

```typescript
// Extract frame at 5 seconds
const { buffer } = await client.downloadFromCDN(videoId, {
  format: 'jpg',
  seek: 5000  // milliseconds
});
fs.writeFileSync('frame-5s.jpg', buffer);

// Extract as GIF
const { buffer: gifFrame } = await client.downloadFromCDN(videoId, {
  format: 'gif',
  seek: 1000
});
```

---

## Watermarking

Apply watermarks to images and videos.

### During Generation

```typescript
const image = await client.generateImage({
  prompt: 'a beautiful landscape',
  watermark: 'watermark-cdn-id',
  watermarkPosition: 'southeast',
  copyright: '2026 My Company'
});
```

### On Download

```typescript
const { buffer } = await client.downloadFromCDN(imageId, {
  format: 'jpg',
  watermark: 'watermark-cdn-id',
  watermarkPosition: 'southeast'
});
```

### Tiled Watermark

```typescript
const image = await client.generateImage({
  prompt: 'product photography',
  watermark: 'watermark-cdn-id',
  watermarkAsTiles: true  // Repeats watermark across image
});
```

### Watermark Positions

**Sharp gravity constants:**
- `northwest`, `north`, `northeast`
- `west`, `center`, `east`
- `southwest`, `south`, `southeast`

**Human-readable alternatives:**
- `top-left`, `top-center`, `top-right`
- `middle-left`, `middle-center`, `middle-right`
- `bottom-left`, `bottom-center`, `bottom-right`

---

## Manual Download

For direct URL access without the SDK, include the `Authorization` header.

### cURL

```bash
# Download image
curl -H "Authorization: Bearer 2dai_pk_your_api_key" \
  "https://api.2dai.io/api/v1/cdn/{imageId}.jpg" \
  -o image.jpg

# With resize
curl -H "Authorization: Bearer 2dai_pk_your_api_key" \
  "https://api.2dai.io/api/v1/cdn/{imageId}.jpg?w=256&h=256" \
  -o thumbnail.jpg

# Extract video frame at 1.5 seconds
curl -H "Authorization: Bearer 2dai_pk_your_api_key" \
  "https://api.2dai.io/api/v1/cdn/{videoId}.jpg?seek=1500" \
  -o frame.jpg
```

### Fetch API (Browser/Node.js)

```typescript
const apiKey = '2dai_pk_your_api_key';
const baseUrl = 'https://api.2dai.io';

// Download image
const response = await fetch(`${baseUrl}/api/v1/cdn/${imageId}.jpg`, {
  headers: { 'Authorization': `Bearer ${apiKey}` }
});
const buffer = await response.arrayBuffer();

// In browser: create blob URL for display
const blob = new Blob([buffer], { type: 'image/jpeg' });
const imageUrl = URL.createObjectURL(blob);

// In Node.js: save to file
import fs from 'fs';
fs.writeFileSync('image.jpg', Buffer.from(buffer));
```

### Axios (Node.js)

```typescript
import axios from 'axios';
import fs from 'fs';

const baseUrl = 'https://api.2dai.io';
const apiKey = '2dai_pk_your_api_key';

// Download image
const response = await axios.get(
  `${baseUrl}/api/v1/cdn/${imageId}.jpg`,
  {
    responseType: 'arraybuffer',
    headers: { 'Authorization': `Bearer ${apiKey}` }
  }
);
fs.writeFileSync('output.jpg', response.data);

// With resize
const thumb = await axios.get(
  `${baseUrl}/api/v1/cdn/${imageId}.jpg?w=256&h=256`,
  {
    responseType: 'arraybuffer',
    headers: { 'Authorization': `Bearer ${apiKey}` }
  }
);
```

> **Important:** CDN URLs always require authentication. You cannot use them directly in `<img src="">` tags or browser address bar without the Authorization header.

---

## CDN URL Pattern

```
GET /api/v1/cdn/{id}.{format}?{queryParams}
```

> **Authentication Required**: CDN URLs require Bearer token authentication.
> You cannot use these URLs directly in browsers or `<img>` tags.
> Use `client.downloadFromCDN()` (recommended) or include the `Authorization: Bearer {apiKey}` header.

### Query Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `w` | Target width | `?w=1024` |
| `h` | Target height | `?h=768` |
| `watermark` | Watermark file ID | `?watermark=abc123` |
| `position` | Watermark position | `?position=southeast` |
| `seek` | Video timestamp (ms) | `?seek=5000` |

---

## Response Type

### CDNDownloadResult

```typescript
interface CDNDownloadResult {
  buffer: Buffer;
  mimeType: string;
  size: number;
}
```

---

## 1.14.0 Features — Batch Delete, getFileURL, Max-Side Resize

### Max-side resize — `?s=N` / `maxSide`

Scales the **longest side** of the file to `N` pixels while preserving aspect ratio. Takes precedence over `width` / `height` if both are set. Server cap: **4096 px**. Values outside `(0, 4096]` → HTTP 400.

```bash
# 256-px thumbnail of an image
curl -H "Authorization: Bearer $API_KEY" \
  "https://apiv2.2dai.io:800/api/v1/cdn/abc123.jpg?s=256" \
  --output thumb.jpg
```

SDK:

```typescript
// downloadFromCDN already supported width/height/seek; now also maxSide.
const { buffer } = await client.downloadFromCDN('abc123', {
  format: 'jpg',
  maxSide: 256
});

// Or build the URL without downloading (see getFileURL below).
```

### `getFileURL(id, opts?)` — build a CDN URL without downloading

Returns the URL string only — no network round-trip. The caller is responsible for the `Authorization` header when fetching. Useful for `<img>`/`<video>` tags or for handing the URL to a third-party worker.

```typescript
import type { CDNFileURLOptions } from '2dai-cloud-sdk';

// All options optional
const opts: CDNFileURLOptions = {
  format: 'png',       // 'jpg' | 'png' | 'gif' | 'mp4'
  maxSide: 1024,       // resize longest side
  width: 800,          // explicit width  (maxSide takes precedence)
  height: 600,         // explicit height (maxSide takes precedence)
  watermark: 'wmId',
  watermarkPosition: 'southeast',
  seek: 3500           // video frame extraction (ms)
};

const url = client.getFileURL('abc123', opts);
// → '/api/v1/cdn/abc123.png?w=800&h=600&watermark=wmId&position=southeast&seek=3500&s=1024'
```

### `batchDeleteFiles(ids)` — delete up to 1000 files in one round-trip

Endpoint: `POST /api/v1/cdn/batch-delete` with body `{ ids: string[] }`. Up to **1000** ids per call (constant `MAX_BATCH_DELETE_IDS = 1000` exported from the SDK).

**Idempotent semantics** (RFC 7231 §4.3.5): ids that were already absent on the server report `success: true, alreadyDeleted: true`. To find *real* failures: `r => !r.success && !r.alreadyDeleted`.

**Server-side dedup**: `["a","a","b"]` is processed as `["a","b"]` — `response.total === 2`, not 3.

```typescript
import type { BatchDeleteResponse } from '2dai-cloud-sdk';

const res: BatchDeleteResponse = await client.batchDeleteFiles([
  'id-1', 'id-2', 'id-3'
]);

console.log(`Deleted ${res.succeeded}/${res.total}`);

// Distinguish "really deleted" from "was already gone"
for (const r of res.results) {
  if (r.success && r.alreadyDeleted) console.log(`Already gone: ${r.id}`);
  else if (r.success)                 console.log(`Deleted: ${r.id}`);
  else                                console.warn(`Failed: ${r.id} — ${r.error}`);
}
```

**Server fallback**: against a server older than 1.14.0, the SDK throws an `Error` with `.code === 'BATCH_DELETE_NOT_SUPPORTED'`:

```typescript
try {
  await client.batchDeleteFiles(ids);
} catch (e: any) {
  if (e.code === 'BATCH_DELETE_NOT_SUPPORTED') {
    // Fall back to per-id deletes
    for (const id of ids) await singleDeleteFallback(id);
  } else {
    throw e;
  }
}
```

### Performance

Single round-trip vs. N×deleteFile: roughly **two orders of magnitude faster** for cleanup batches (one auth + one HTTP request instead of N).

---

## Next Steps

- [WebSocket API](WebSocket-API) - Real-time generation
- [API Reference](API-Reference) - Full endpoint documentation

---

← [OpenAI Compatibility](OpenAI-Compatibility) | [WebSocket API](WebSocket-API) →
