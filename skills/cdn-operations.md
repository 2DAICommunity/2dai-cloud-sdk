---
name: 2DAI CDN Operations
capability: cdn_operations
version: 1.11.0
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

[Back to Main Skill](../skill.md) | [Image Generation](./image-generation.md) | [Video Generation](./video-generation.md)
