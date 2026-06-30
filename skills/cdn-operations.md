---
name: 2DAI CDN Operations
capability: cdn_operations
version: 1.14.0
api_base_url: https://apiv2.2dai.io:800
---

# CDN Operations Skills

Download, convert, and transform generated content.

## Capabilities

| Operation | Description | Endpoint |
|-----------|-------------|----------|
| Download | Get generated images/videos | `GET /api/v1/cdn/{id}.{format}` |
| Convert | Change file format | `GET /api/v1/cdn/{id}.{format}` |
| Resize | Change dimensions | `GET /api/v1/cdn/{id}.{format}?w=&h=` |
| Watermark | Apply watermark | `GET /api/v1/cdn/{id}.{format}?watermark=` |
| Frame Extract | Get frame from video | `GET /api/v1/cdn/{id}.jpg?seek=` |

---

## Download File

Download generated images or videos.

### Endpoint
```
GET https://apiv2.2dai.io:800/api/v1/cdn/{id}.{format}
```

### Request
```bash
curl -H "Authorization: Bearer $API_KEY" \
  "https://apiv2.2dai.io:800/api/v1/cdn/550e8400-e29b-41d4-a716-446655440000.jpg" \
  -o image.jpg
```

### Supported Formats

| Format | Extension | Use For |
|--------|-----------|---------|
| JPEG | `.jpg` | Photos, web images |
| PNG | `.png` | Transparent images, screenshots |
| GIF | `.gif` | Animated images |
| MP4 | `.mp4` | Videos |

---

## Format Conversion

Convert between formats by changing the extension.

### Image to PNG
```bash
curl -H "Authorization: Bearer $API_KEY" \
  "https://apiv2.2dai.io:800/api/v1/cdn/{imageId}.png" -o image.png
```

### Image to JPG
```bash
curl -H "Authorization: Bearer $API_KEY" \
  "https://apiv2.2dai.io:800/api/v1/cdn/{imageId}.jpg" -o image.jpg
```

---

## Resize Image

Resize images on-the-fly using query parameters.

### Request
```bash
curl -H "Authorization: Bearer $API_KEY" \
  "https://apiv2.2dai.io:800/api/v1/cdn/{imageId}.jpg?w=256&h=256" \
  -o thumbnail.jpg
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `w` | number | Target width in pixels |
| `h` | number | Target height in pixels |

### Examples

| Use Case | URL Parameters |
|----------|----------------|
| Thumbnail (256x256) | `?w=256&h=256` |
| Half size | `?w=672&h=384` (for 1344x768 original) |
| Width only (auto height) | `?w=800` |
| Height only (auto width) | `?h=600` |

---

## Apply Watermark

Add a watermark image to generated content.

### Request
```bash
curl -H "Authorization: Bearer $API_KEY" \
  "https://apiv2.2dai.io:800/api/v1/cdn/{imageId}.jpg?watermark={watermarkId}&position=southeast" \
  -o watermarked.jpg
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `watermark` | string | CDN ID of watermark image |
| `position` | string | Watermark position (see below) |

### Watermark Positions

```
┌───────────┬───────────┬───────────┐
│ northwest │   north   │ northeast │
├───────────┼───────────┼───────────┤
│   west    │  center   │   east    │
├───────────┼───────────┼───────────┤
│ southwest │   south   │ southeast │
└───────────┴───────────┴───────────┘
```

| Position | Value |
|----------|-------|
| Top-left | `northwest` |
| Top-center | `north` |
| Top-right | `northeast` |
| Middle-left | `west` |
| Middle-center | `center` |
| Middle-right | `east` |
| Bottom-left | `southwest` |
| Bottom-center | `south` |
| Bottom-right | `southeast` (default) |

---

## Extract Video Frame

Get a still image from a specific point in a video.

### Request
```bash
curl -H "Authorization: Bearer $API_KEY" \
  "https://apiv2.2dai.io:800/api/v1/cdn/{videoId}.jpg?seek=5000" \
  -o frame.jpg
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `seek` | number | Timestamp in milliseconds |

### Examples

| Time | `seek` Value |
|------|--------------|
| Start (0 sec) | `?seek=0` |
| 1 second | `?seek=1000` |
| 3.25 seconds | `?seek=3250` |
| 5 seconds | `?seek=5000` |

---

## Combined Operations

Combine multiple operations in a single request.

### Resize + Watermark
```bash
curl -H "Authorization: Bearer $API_KEY" \
  "https://apiv2.2dai.io:800/api/v1/cdn/{imageId}.jpg?w=800&h=600&watermark={wmId}&position=southeast" \
  -o final.jpg
```

### Video Frame + Resize
```bash
curl -H "Authorization: Bearer $API_KEY" \
  "https://apiv2.2dai.io:800/api/v1/cdn/{videoId}.jpg?seek=3000&w=400&h=225" \
  -o thumbnail.jpg
```

---

## Agent Decision Guide

| User Request | Action | Parameters |
|--------------|--------|------------|
| "Download the image" | Download | `{id}.jpg` or `{id}.png` |
| "Get the video" | Download | `{id}.mp4` |
| "Make a thumbnail" | Resize | `?w=256&h=256` |
| "Convert to PNG" | Convert | `{id}.png` |
| "Add my logo" | Watermark | `?watermark={logoId}&position=...` |
| "Get a frame from the video" | Frame extract | `{id}.jpg?seek={ms}` |
| "Smaller version" | Resize | `?w={width}&h={height}` |

---

## Important Notes for Agents

### Authentication Required
All CDN URLs require the Authorization header. They cannot be used directly in HTML.

```bash
# Correct - with auth header
curl -H "Authorization: Bearer $API_KEY" "https://apiv2.2dai.io:800/api/v1/cdn/{id}.jpg"

# Incorrect - will fail
<img src="https://apiv2.2dai.io:800/api/v1/cdn/{id}.jpg">
```

### Response Type
CDN responses return binary data (not JSON). Handle as:
- `arraybuffer` in JavaScript
- `blob` for browser downloads
- Binary file write in other languages

### Best Practices

**DO:**
- Cache downloaded files locally
- Use appropriate format for use case (JPG for photos, PNG for transparency)
- Resize server-side to reduce bandwidth
- Use frame extraction for video thumbnails

**DO NOT:**
- Embed CDN URLs directly in HTML (auth required)
- Download the same file multiple times (cache it)
- Request unnecessarily large files
- Forget error handling for 404s

---

## Rate Limits

| Per 15 Minutes | Per Day |
|----------------|---------|
| 200 requests | 5,000 requests |

Check current limits:
```bash
curl -H "Authorization: Bearer $API_KEY" \
  "https://apiv2.2dai.io:800/api/v1/settings/rate-limits"
```

---

## Error Responses

| Status | Meaning | Action |
|--------|---------|--------|
| 200 | Success | Binary data returned |
| 401 | Unauthorized | Check API key |
| 404 | Not Found | Invalid ID or expired content |
| 429 | Rate Limited | Wait and retry |

---

## 1.14.0 Features — Batch Delete, getFileURL, Max-Side Resize

Three additions to the CDN surface.

### Max-side resize — `?s=N` query param

Scales the longest side of the file to `N` pixels while preserving aspect ratio. Takes precedence over `width`/`height`. Server cap: **4096 px**. Values outside `(0, 4096]` return HTTP 400.

```bash
# Build a 256-px thumbnail
curl -H "Authorization: Bearer $API_KEY" \
  "https://apiv2.2dai.io:800/api/v1/cdn/abc123.jpg?s=256" \
  --output thumb.jpg
```

In the SDK:

```typescript
const { buffer } = await client.downloadFromCDN('abc123', { maxSide: 256, format: 'jpg' });
```

### `getFileURL()` — build a CDN URL without downloading

Returns the URL string for a CDN file with optional resize / watermark / seek / max-side parameters. Useful for `<img>`/`<video>` tags or for handing the URL to a third-party worker.

```typescript
// Pass to a browser <img> tag
const thumb = client.getFileURL('abc123', { format: 'png', maxSide: 1024 });
// → '/api/v1/cdn/abc123.png?s=1024'

// Frame extraction from a video
const frame = client.getFileURL(videoId, { format: 'jpg', seek: 3500 });
```

The string is path-relative to the API base URL. Caller is responsible for the `Authorization` header when fetching.

### `batchDeleteFiles()` — delete up to 1000 files in one round-trip

`POST /api/v1/cdn/batch-delete` body: `{ "ids": [ "...", "..." ] }`. Up to **1000** ids per call.

**Idempotent**: ids that were already absent on the server report `success: true, alreadyDeleted: true`. To find *real* failures, filter `r => !r.success && !r.alreadyDeleted`.

**Deduplicated** server-side: `["a","a","b"]` is processed as `["a","b"]` — `response.total === 2`, NOT 3.

```bash
curl -X POST "https://apiv2.2dai.io:800/api/v1/cdn/batch-delete" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "ids": ["id-1", "id-2", "id-3"] }'
```

Response shape:

```json
{
  "success": true,
  "total": 3,
  "succeeded": 3,
  "results": [
    { "id": "id-1", "success": true },
    { "id": "id-2", "success": true, "alreadyDeleted": true },
    { "id": "id-3", "success": true }
  ]
}
```

In the SDK:

```typescript
import type { BatchDeleteResponse } from '2dai-cloud-sdk';

const res: BatchDeleteResponse = await client.batchDeleteFiles(idsToDelete);
console.log(`Deleted ${res.succeeded}/${res.total}`);

const realFailures = res.results.filter(r => !r.success && !r.alreadyDeleted);
if (realFailures.length) console.error('Failures:', realFailures);
```

**Server fallback**: against an older server that doesn't support batch delete, the SDK throws an `Error` whose `.code === 'BATCH_DELETE_NOT_SUPPORTED'` so callers can fall back to a per-id delete loop.

### Constants

- `MAX_BATCH_DELETE_IDS = 1000` — exported from `2dai-cloud-sdk`.
- `?s=` cap: 4096 px (server-enforced).

---

[Back to Main Skill](../skill.md) | [Image Generation](./image-generation.md) | [Video Generation](./video-generation.md)
