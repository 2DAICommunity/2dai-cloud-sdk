# API Reference

Complete reference of all REST and WebSocket endpoints available in the 2DAI API.

## Table of Contents

- [System Endpoints](#system-endpoints)
- [Settings API](#settings-api)
- [Generation API](#generation-api)
- [LLM API](#llm-api)
- [CDN API](#cdn-api)
- [OpenAI-Compatible API](#openai-compatible-api)
- [WebSocket API](#websocket-api)
- [Type Definitions](#type-definitions)
- [Error Codes](#error-codes)

---

## System Endpoints

Public endpoints that don't require authentication.

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/health` | API health check | No |
| GET | `/version` | API version info | No |

### GET /health

```json
{
  "status": "ok",
  "timestamp": "2026-01-22T22:30:34.801Z",
  "version": "1.6.0",
  "environment": "local"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | Always `"ok"` when healthy |
| `timestamp` | string | ISO 8601 timestamp |
| `version` | string | API version |
| `environment` | string | `"live"` or `"development"` |

### GET /version

```json
{
  "version": "1.6.0",
  "environment": "local"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `version` | string | API version |
| `environment` | string | Environment name |

---

## Settings API

Account settings, rate limits, and usage statistics.

**Base Path:** `/api/v1/settings`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/settings` | Get account status, rate limits, current usage |
| GET | `/api/v1/settings/usage` | Usage statistics for date range |
| GET | `/api/v1/settings/usage/recent` | Recent usage logs with filtering |
| GET | `/api/v1/settings/rate-limits` | Current rate limit status |

### GET /api/v1/settings

Get account status, rate limits, and current usage.

```json
{
  "success": true,
  "data": {
    "status": "active",
    "rateLimits": {
      "image": {
        "requestsPer15Min": 15,
        "requestsPerDay": 360
      },
      "video": {
        "requestsPer15Min": 5,
        "requestsPerDay": 30
      },
      "llm": {
        "requestsPer15Min": 75,
        "requestsPerDay": 1800,
        "tokensPer15Min": 150000,
        "tokensPerDay": 3500000,
        "maxPromptLength": 90000
      },
      "cdn": {
        "requestsPer15Min": 200,
        "requestsPerDay": 5000
      }
    },
    "currentUsage": {
      "image": {
        "current": {
          "requestsPer15Min": 0,
          "requestsPerDay": 0,
          "tokensPer15Min": 0,
          "tokensPerDay": 0
        },
        "remaining": {
          "requestsPer15Min": 15,
          "requestsPerDay": 360
        },
        "resetAt": {
          "window15Min": "2026-01-22T22:45:00.000Z",
          "daily": "2026-01-23T05:00:00.000Z"
        }
      },
      "video": {
        "current": {
          "requestsPer15Min": 0,
          "requestsPerDay": 0,
          "tokensPer15Min": 0,
          "tokensPerDay": 0
        },
        "remaining": {
          "requestsPer15Min": 5,
          "requestsPerDay": 30
        },
        "resetAt": {
          "window15Min": "2026-01-22T22:45:00.000Z",
          "daily": "2026-01-23T05:00:00.000Z"
        }
      },
      "llm": {
        "current": {
          "requestsPer15Min": 0,
          "requestsPerDay": 0,
          "tokensPer15Min": 0,
          "tokensPerDay": 0
        },
        "remaining": {
          "requestsPer15Min": 75,
          "requestsPerDay": 1800
        },
        "resetAt": {
          "window15Min": "2026-01-22T22:45:00.000Z",
          "daily": "2026-01-23T05:00:00.000Z"
        }
      },
      "cdn": {
        "current": {
          "requestsPer15Min": 0,
          "requestsPerDay": 42,
          "tokensPer15Min": 0,
          "tokensPerDay": 0
        },
        "remaining": {
          "requestsPer15Min": 200,
          "requestsPerDay": 4958
        },
        "resetAt": {
          "window15Min": "2026-01-22T22:45:00.000Z",
          "daily": "2026-01-23T05:00:00.000Z"
        }
      }
    }
  }
}
```

> **Note:** Image, Video, and LLM use rate-based limits (`requestsPer15Min`, `requestsPerDay`). CDN uses traditional rate-based limits (`requestsPer15Min`, `requestsPerDay`).

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Request success status |
| `data.status` | string | Account status (`"active"`) |
| `data.rateLimits` | object | Rate limit configuration per operation |
| `data.rateLimits.image.requestsPer15Min` | number | Image requests allowed per 15 minutes |
| `data.rateLimits.image.requestsPerDay` | number | Image requests allowed per day |
| `data.rateLimits.video.requestsPer15Min` | number | Video requests allowed per 15 minutes |
| `data.rateLimits.video.requestsPerDay` | number | Video requests allowed per day |
| `data.rateLimits.llm.requestsPer15Min` | number | LLM requests allowed per 15 minutes |
| `data.rateLimits.llm.requestsPerDay` | number | LLM requests allowed per day |
| `data.rateLimits.llm.tokensPer15Min` | number | LLM tokens allowed per 15 minutes |
| `data.rateLimits.llm.tokensPerDay` | number | LLM tokens allowed per day |
| `data.rateLimits.llm.maxPromptLength` | number | Maximum prompt length allowed |
| `data.rateLimits.cdn.requestsPer15Min` | number | CDN requests allowed per 15 minutes |
| `data.rateLimits.cdn.requestsPerDay` | number | CDN requests allowed per day |
| `data.currentUsage` | object | Current usage per operation |
| `data.currentUsage.*.current` | object | Current usage values |
| `data.currentUsage.*.remaining` | object | Remaining usage values |
| `data.currentUsage.*.resetAt` | object | Reset timestamps |

### GET /api/v1/settings/usage

Usage statistics for a date range.

**Query Parameters:**
- `days` - Number of days to include (default: 7)

```json
{
  "success": true,
  "data": {
    "period": {
      "start": "2026-01-15T22:30:34.826Z",
      "end": "2026-01-22T22:30:34.826Z",
      "days": 7
    },
    "summary": {
      "total": 243,
      "byOperation": {
        "image": 35,
        "video": 8,
        "llm": 13,
        "cdn": 42
      },
      "totalTokens": 17129,
      "successRate": 100
    },
    "daily": [
      {
        "date": "2026-01-22",
        "total": 243,
        "byOperation": {
          "image": 35,
          "video": 8,
          "llm": 13,
          "cdn": 42
        },
        "tokens": 17129
      }
    ]
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Request success status |
| `data.period.start` | string | Period start timestamp (ISO 8601) |
| `data.period.end` | string | Period end timestamp (ISO 8601) |
| `data.period.days` | number | Number of days in period |
| `data.summary.total` | number | Total requests in period |
| `data.summary.byOperation` | object | Breakdown by operation type |
| `data.summary.byOperation.*.count` | number | Request count for operation |
| `data.summary.totalTokens` | number | Total LLM tokens used |
| `data.summary.successRate` | number | Success rate percentage |
| `data.daily` | array | Daily breakdown |
| `data.daily[].date` | string | Date (YYYY-MM-DD) |
| `data.daily[].total` | number | Total requests for day |
| `data.daily[].byOperation` | object | Operation breakdown for day |
| `data.daily[].tokens` | number | Tokens used for day |

### GET /api/v1/settings/usage/recent

Recent usage logs with filtering.

**Query Parameters:**
- `limit` - Number of logs to return (default: 10)
- `operation` - Filter by operation type (`image`, `video`, `llm`, `cdn`)

```json
{
  "success": true,
  "data": {
    "count": 5,
    "logs": [
      {
        "_id": "697296255e9a9d4a01171eb1",
        "apiKey": "1f3827add11cc9a16cddfc1a88f3b6fa94c0b98140f4b7c7c20db7e6e742be17",
        "operation": "image",
        "timestamp": "2026-01-22T21:27:01.021Z",
        "success": true,
        "metadata": {
          "type": "img2img",
          "imageId": "91b2d374-60da-4961-9c63-57d74315f4ca",
          "prompt": "add a blue border",
          "seed": 1852839921,
          "duration": 70500
        }
      },
      {
        "_id": "697295de5e9a9d4a01171eaf",
        "apiKey": "1f3827add11cc9a16cddfc1a88f3b6fa94c0b98140f4b7c7c20db7e6e742be17",
        "operation": "image",
        "timestamp": "2026-01-22T21:25:50.514Z",
        "success": true,
        "metadata": {
          "prompt": "a simple red circle on white background",
          "style": "raw",
          "width": 1024,
          "height": 1024,
          "seed": 753504967,
          "duration": 66499
        }
      },
      {
        "_id": "6972959c5e9a9d4a01171ead",
        "apiKey": "1f3827add11cc9a16cddfc1a88f3b6fa94c0b98140f4b7c7c20db7e6e742be17",
        "operation": "openai_stream",
        "timestamp": "2026-01-22T21:24:44.014Z",
        "success": true,
        "tokensUsed": 118,
        "metadata": {
          "model": "default",
          "tokensUsed": 118,
          "duration": 272
        }
      },
      {
        "_id": "6972959b5e9a9d4a01171eab",
        "apiKey": "1f3827add11cc9a16cddfc1a88f3b6fa94c0b98140f4b7c7c20db7e6e742be17",
        "operation": "openai_completion",
        "timestamp": "2026-01-22T21:24:43.737Z",
        "success": true,
        "tokensUsed": 115,
        "metadata": {
          "model": "default",
          "tokensUsed": 115,
          "promptTokens": 111,
          "completionTokens": 4,
          "duration": 195
        }
      },
      {
        "_id": "6972959b5e9a9d4a01171ea9",
        "apiKey": "1f3827add11cc9a16cddfc1a88f3b6fa94c0b98140f4b7c7c20db7e6e742be17",
        "operation": "llm_stream",
        "timestamp": "2026-01-22T21:24:43.538Z",
        "success": true,
        "tokensUsed": 118,
        "metadata": {
          "promptLength": 17,
          "model": "2DAI-LLM",
          "tokensUsed": 118,
          "promptTokens": 112,
          "completionTokens": 6,
          "duration": 284
        }
      }
    ]
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Request success status |
| `data.count` | number | Number of logs returned |
| `data.logs` | array | Array of usage log entries |
| `data.logs[].operation` | string | Operation type (`image`, `video`, `llm`, `cdn`) |
| `data.logs[].timestamp` | string | Log timestamp (ISO 8601) |
| `data.logs[].success` | boolean | Whether operation succeeded |
| `data.logs[].tokensUsed` | number | Tokens used (LLM only) |
| `data.logs[].durationMs` | number | Operation duration in milliseconds |
| `data.logs[].metadata` | object | Operation-specific metadata |

### GET /api/v1/settings/rate-limits

Current rate limit status for all operations.

```json
{
  "success": true,
  "data": [
    {
      "operation": "image",
      "allowed": true,
      "remaining15min": 15,
      "remainingDaily": 360,
      "current": {
        "requestsPer15Min": 0,
        "requestsPerDay": 0,
        "tokensPer15Min": 0,
        "tokensPerDay": 0
      },
      "limit": {
        "requestsPer15Min": 15,
        "requestsPerDay": 360
      },
      "resetAt": {
        "window15Min": "2026-01-23T03:00:00.000Z",
        "daily": "2026-01-23T05:00:00.000Z"
      }
    },
    {
      "operation": "video",
      "allowed": true,
      "remaining15min": 5,
      "remainingDaily": 30,
      "current": {
        "requestsPer15Min": 0,
        "requestsPerDay": 0,
        "tokensPer15Min": 0,
        "tokensPerDay": 0
      },
      "limit": {
        "requestsPer15Min": 5,
        "requestsPerDay": 30
      },
      "resetAt": {
        "window15Min": "2026-01-23T03:00:00.000Z",
        "daily": "2026-01-23T05:00:00.000Z"
      }
    },
    {
      "operation": "llm",
      "allowed": true,
      "remaining15min": 75,
      "remainingDaily": 1800,
      "current": {
        "requestsPer15Min": 0,
        "requestsPerDay": 0,
        "tokensPer15Min": 0,
        "tokensPerDay": 0
      },
      "limit": {
        "requestsPer15Min": 75,
        "requestsPerDay": 1800,
        "tokensPer15Min": 150000,
        "tokensPerDay": 3500000
      },
      "resetAt": {
        "window15Min": "2026-01-23T03:00:00.000Z",
        "daily": "2026-01-23T05:00:00.000Z"
      }
    },
    {
      "operation": "cdn",
      "allowed": true,
      "remaining15min": 194,
      "remainingDaily": 4879,
      "current": {
        "requestsPer15Min": 6,
        "requestsPerDay": 121,
        "tokensPer15Min": 0,
        "tokensPerDay": 0
      },
      "limit": {
        "requestsPer15Min": 200,
        "requestsPerDay": 5000
      },
      "resetAt": {
        "window15Min": "2026-01-23T03:00:00.000Z",
        "daily": "2026-01-23T05:00:00.000Z"
      }
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Request success status |
| `data` | array | Array of rate limit status objects (ordered: image, video, llm, cdn) |
| `data[].operation` | string | Operation type: `image`, `video`, `llm`, `cdn` |
| `data[].allowed` | boolean | Whether operation is allowed |
| `data[].remaining15min` | number | Remaining requests in 15-min window |
| `data[].remainingDaily` | number | Remaining requests in day |
| `data[].current` | object | Current usage values |
| `data[].limit` | object | Limit values |
| `data[].resetAt` | object | Reset timestamps |

---

## Generation API

Image and video generation endpoints.

**Base Path:** `/api/v1/generation`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/generation/image` | Generate images (text2img) |
| POST | `/api/v1/generation/image/edit` | Edit/transform images (img2img) |
| POST | `/api/v1/generation/image/edit` | Dual-image editing (imgs2img) with `imageId2` |
| POST | `/api/v1/generation/image/upscale` | AI upscale images (img2ximg) |
| POST | `/api/v1/generation/video` | Generate videos (img2vid) |

> **Note:** The `url` field in responses points to the CDN endpoint, which requires authentication.

### POST /api/v1/generation/image

Generate an image from a text prompt.

**Request:**
```json
{
  "prompt": "a futuristic city at sunset",
  "style": "cine",
  "format": "landscape"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `prompt` | string | Yes | Text description of the image |
| `style` | string | No | Style preset (see [Styles](#styles)) |
| `format` | string | No | Format preset (see [Formats](#formats)) |
| `negativePrompt` | string | No | What to avoid in the image |
| `seed` | number | No | Seed for reproducibility (0-2000000000) |

**Response:**
```json
{
  "success": true,
  "data": {
    "imageId": "55f8a56d-91de-4441-9f35-6a21fa26ecab",
    "width": 1024,
    "height": 1024,
    "seed": 1050720317
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Request success status |
| `data.imageId` | string | Generated image CDN ID (UUID) |
| `data.width` | number | Image width in pixels |
| `data.height` | number | Image height in pixels |
| `data.seed` | number | Seed used for generation |

> **Note:** Use the `imageId` with the CDN endpoint to download: `GET /api/v1/cdn/{imageId}.jpg`

### POST /api/v1/generation/image/edit

Edit an existing image (img2img).

**Request:**
```json
{
  "imageId": "f71f8d0d-488f-4b94-a260-06de434ae5ed",
  "prompt": "add flying cars to the scene"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `imageId` | string | Yes | Source image CDN ID |
| `prompt` | string | Yes | Edit instructions |
| `negativePrompt` | string | No | What to avoid |
| `seed` | number | No | Seed for reproducibility |

**Response:**
```json
{
  "success": true,
  "data": {
    "imageId": "9cba3bf4-865f-4d2d-a0a2-92470fba2dc8",
    "seed": 1904179547
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Request success status |
| `data.imageId` | string | Edited image CDN ID (UUID) |
| `data.seed` | number | Seed used for generation |

### POST /api/v1/generation/image/edit (Dual-Image Mode - imgs2img)

Edit images using two source images. Use this to merge, blend, or mix elements from two images together.

**Request:**
```json
{
  "imageId": "f71f8d0d-488f-4b94-a260-06de434ae5ed",
  "imageId2": "9cba3bf4-865f-4d2d-a0a2-92470fba2dc8",
  "prompt": "make an image with both subjects"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `imageId` | string | Yes | Image 1 (primary) - CDN ID of the main image |
| `imageId2` | string | Yes | Image 2 (secondary) - CDN ID for dual-image mode |
| `prompt` | string | Yes | Instructions using "image 1" and "image 2" terminology |
| `negativePrompt` | string | No | What to avoid |
| `seed` | number | No | Seed for reproducibility |
| `width` | number | No | Output width (320-1344) |
| `height` | number | No | Output height (320-1344) |

**Prompt Examples:**

| Action | Prompt |
|--------|--------|
| Combine subjects | `make an image with both subjects` |
| Blend character | `blend the character from image 2 into the scene of image 1` |
| Apply style | `apply the style of image 2 to image 1` |
| Mix elements | `mix elements from image 2 into image 1` |
| Combine | `combine image 1 and image 2 into a seamless scene` |

**Response:**
```json
{
  "success": true,
  "data": {
    "imageId": "1f1af23f-643b-43b8-8f5c-09fd10e6719a",
    "seed": 666934679
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Request success status |
| `data.imageId` | string | Result image CDN ID (UUID) |
| `data.seed` | number | Seed used for generation |

### POST /api/v1/generation/image/upscale

AI upscale an image (2x, 3x, or 4x).

**Request:**
```json
{
  "imageId": "f71f8d0d-488f-4b94-a260-06de434ae5ed",
  "factor": 2
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `imageId` | string | Yes | Source image CDN ID |
| `factor` | number | No | Upscale factor: 2, 3, or 4 (default: 2) |
| `seed` | number | No | Seed for reproducibility |

**Response:**
```json
{
  "success": true,
  "data": {
    "imageId": "756cebda-9c82-40b5-96c3-23bb92b5c252",
    "width": 2048,
    "height": 2048,
    "seed": 126568457
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Request success status |
| `data.imageId` | string | Upscaled image CDN ID (UUID) |
| `data.width` | number | Upscaled image width in pixels |
| `data.height` | number | Upscaled image height in pixels |
| `data.seed` | number | Seed used for upscaling |

### POST /api/v1/generation/video

Generate a video from an image.

**Request:**
```json
{
  "imageId": "f71f8d0d-488f-4b94-a260-06de434ae5ed",
  "prompt": "the scene view (the camera) pans left, smooth motion",
  "duration": 3,
  "fps": 16
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `imageId` | string | Yes | Source image CDN ID |
| `prompt` | string | No | Motion/animation prompt (e.g., "the scene view (the camera) pans left", "zoom in slowly") |
| `duration` | number | No | Duration in seconds: 1-10 (default: 5) |
| `fps` | number | No | Frames per second: 8-60 (default: 16) |

**Response:**
```json
{
  "success": true,
  "data": {
    "videoId": "4c14085e-02da-4186-a928-9c1e931383fe",
    "duration": 2,
    "fps": 8,
    "seed": 1638417043
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Request success status |
| `data.videoId` | string | Generated video CDN ID (UUID) |
| `data.duration` | number | Video duration in seconds |
| `data.fps` | number | Video frames per second |
| `data.seed` | number | Seed used for generation |

> **Note:** Use the `videoId` with the CDN endpoint to download: `GET /api/v1/cdn/{videoId}.mp4`

---

## LLM API

Text generation endpoints.

**Base Path:** `/api/v1/llm`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/llm/generate` | Non-streaming LLM text generation |
| POST | `/api/v1/llm/generate/stream` | Streaming text generation (SSE) |

### POST /api/v1/llm/generate

Generate text (non-streaming).

**Request:**
```json
{
  "prompt": "Explain quantum computing in simple terms",
  "system": "You are a helpful assistant"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `prompt` | string | Yes | The prompt/question |
| `system` | string | No | System prompt for behavior |
| `memory` | string[] | No | Conversation history |
| `jsonFormat` | boolean | No | Enable JSON output |
| `jsonTemplate` | object | No | JSON structure template |
| `useMarkdown` | boolean | No | Enable markdown formatting |
| `imageId` | string | No | Image for vision analysis |

**Response:**
```json
{
  "success": true,
  "data": {
    "text": "Hello there. How's it goin?",
    "tokensUsed": 132,
    "promptTokens": 122,
    "completionTokens": 10
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Request success status |
| `data.text` | string | Generated text response |
| `data.tokensUsed` | number | Total tokens used |
| `data.promptTokens` | number | Input/prompt tokens |
| `data.completionTokens` | number | Output/completion tokens |
| `data.json` | any | Parsed JSON (if `jsonFormat: true`) |

### POST /api/v1/llm/generate/stream (SSE)

Generate text with streaming (Server-Sent Events).

**Request:**
```json
{
  "prompt": "Write a short poem about the moon"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `prompt` | string | Yes | The prompt/question |
| `system` | string | No | System prompt for behavior |
| `memory` | string[] | No | Conversation history |
| `useMarkdown` | boolean | No | Enable markdown formatting |
| `imageId` | string | No | Image for vision analysis |

> **Note:** `jsonFormat` is not supported with streaming - use non-streaming endpoint for JSON output.

**Response (SSE):**
```
data: {"chunk":"1.\n2.\n3."}

data: {"done":true,"tokensUsed":119,"promptTokens":112,"completionTokens":7}
data: [DONE]
```

**Chunk Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `chunk` | string | Text chunk (content events) |
| `done` | boolean | `true` on final event |
| `response` | string | Full accumulated response (final event) |
| `tokensUsed` | number | Total tokens used (final event) |
| `promptTokens` | number | Input tokens (final event) |
| `completionTokens` | number | Output tokens (final event) |

> **Note:** The stream ends with `data: [DONE]`. The final chunk includes token counts.

---

## CDN API

Download and transform generated content.

**Base Path:** `/api/v1/cdn`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/cdn/{id}.{format}` | Download/convert files |

> **Note:** All CDN endpoints require authentication via `Authorization: Bearer <api_key>` header.

### GET /api/v1/cdn/{id}.{format}

Download generated content with optional resize and watermarking.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | CDN file ID (UUID from generation response) |
| `format` | string | Yes | File extension: `jpg`, `jpeg`, `png`, `gif`, `mp4` |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `w` | number | No | Target width for resize (pixels) |
| `h` | number | No | Target height for resize (pixels) |
| `watermark` | string | No | Watermark image CDN ID |
| `position` | string | No | Watermark position (default: `southeast`) |
| `seek` | number | No | Video timestamp in ms for frame extraction |

**Examples:**
```bash
# Download image as JPEG
GET /api/v1/cdn/{imageId}.jpg

# Download video as MP4
GET /api/v1/cdn/{videoId}.mp4

# Download video as GIF
GET /api/v1/cdn/{videoId}.gif

# Download with watermark
GET /api/v1/cdn/{imageId}.jpg?watermark={watermarkId}&position=southeast

# Download with resize
GET /api/v1/cdn/{imageId}.jpg?w=256&h=256

# Extract video frame at 1.5 seconds
GET /api/v1/cdn/{videoId}.jpg?seek=1500
```

**Response:** Binary file data with appropriate `Content-Type` header.

**Response Headers:**

| Header | Type | Description |
|--------|------|-------------|
| `Content-Type` | string | MIME type: `image/jpeg`, `image/png`, `image/gif`, `video/mp4` |
| `Cache-Control` | string | Cache directive (1 year) |
| `X-CDN-File-ID` | string | The requested file ID |

> **Note:** The CDN supports format conversion. Request `.png` to get PNG, `.jpg` for JPEG, `.gif` for GIF. Video frame extraction is supported via the `seek` parameter.

### CDN Response Examples

**GET /api/v1/cdn/{imageId}.jpg**
```json
{
  "contentType": "image/jpeg",
  "size": 156703,
  "statusCode": 200
}
```
Notes: Content-Type: image/jpeg, Size: 156703 bytes

**GET /api/v1/cdn/{imageId}.png**
```json
{
  "contentType": "image/jpeg",
  "size": 475325
}
```
Notes: CDN returns original format: image/jpeg (format conversion not supported)

**GET /api/v1/cdn/{imageId}.jpg?w=64&h=64**
```json
{
  "contentType": "image/jpeg",
  "size": 3467
}
```
Notes: Resized image: 3467 bytes

**GET /api/v1/cdn/{videoId}.mp4**
```json
{
  "contentType": "video/mp4",
  "size": 138811
}
```
Notes: Video: 138811 bytes

**GET /api/v1/cdn/{imageId}.jpg?seek=500**
```json
{
  "contentType": "image/jpeg",
  "size": 13133
}
```
Notes: Frame at 500ms: 13133 bytes

---

## OpenAI-Compatible API

Drop-in compatibility with OpenAI's API format.

**Base Path:** `/v1`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/models` | Get available models |
| POST | `/v1/chat/completions` | Chat completion (supports streaming) |

### GET /v1/models

```json
{
  "object": "list",
  "data": [
    {
      "id": "2DAI-LLM",
      "object": "model",
      "created": 1769121035,
      "owned_by": "2DAI"
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `object` | string | Always `"list"` |
| `data` | array | Array of available models |
| `data[].id` | string | Model identifier (`2DAI-LLM`) |
| `data[].object` | string | Always `"model"` |
| `data[].created` | number | Unix timestamp of model creation |
| `data[].owned_by` | string | Model owner (`2DAI`) |

### POST /v1/chat/completions (non-streaming)

**Request:**
```json
{
  "model": "2DAI-LLM",
  "messages": [
    { "role": "system", "content": "You are a helpful assistant." },
    { "role": "user", "content": "Hello!" }
  ],
  "temperature": 0.7,
  "max_tokens": 500
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `model` | string | No | Model ID: `2DAI-LLM` or `default` |
| `messages` | array | Yes | Array of chat messages |
| `messages[].role` | string | Yes | Message role: `system`, `user`, `assistant` |
| `messages[].content` | string | Yes | Message content |
| `stream` | boolean | No | Enable streaming (default: `false`) |
| `temperature` | number | No | *Accepted but not applied* |
| `max_tokens` | number | No | *Accepted but not applied* |
| `response_format` | object | No | Set `{ "type": "json_object" }` for JSON mode |

**Response:**
```json
{
  "id": "chatcmpl-59193630-c1c7-43e5-90b4-f9b670854d9c",
  "object": "chat.completion",
  "created": 1769121035,
  "model": "default",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello there.Zuschauer."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 111,
    "completion_tokens": 6,
    "total_tokens": 117
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique completion ID |
| `object` | string | Always `"chat.completion"` |
| `created` | number | Unix timestamp |
| `model` | string | Model used (`2DAI-LLM`) |
| `choices` | array | Array of completion choices |
| `choices[].index` | number | Choice index (always `0`) |
| `choices[].message.role` | string | Always `"assistant"` |
| `choices[].message.content` | string | Generated response text |
| `choices[].finish_reason` | string | `"stop"` or `"length"` |
| `usage.prompt_tokens` | number | Input tokens used |
| `usage.completion_tokens` | number | Output tokens generated |
| `usage.total_tokens` | number | Total tokens used |

> **Note:** Use model `"2DAI-LLM"` or `"default"` for the request.

### POST /v1/chat/completions (streaming)

**Request:**
```json
{
  "model": "2DAI-LLM",
  "messages": [{ "role": "user", "content": "Hi!" }],
  "stream": true
}
```

**Response (SSE):**
```
data: {"id":"chatcmpl-120f732f-cd8b-4d3c-9061-95363e65feef","object":"chat.completion.chunk","created":1769121035,"model":"default","choices":[{"index":0,"delta":{"role":"assistant"},"finish_reason":null}]}

data: {"id":"chatcmpl-120f732f-cd8b-4d3c-9061-95363e65feef","object":"chat.completion.chunk","created":1769121035,"model":"default","choices":[{"index":0,"delta":{"content":"Hello"},"finish_reason":null}]}

data: {"id":"chatcmpl-120f732f-cd8b-4d3c-9061-95363e65feef","object":"chat.completion.chunk","created":1769121035,"model":"default","choices":[{"index":0,"delta":{"content":"!"},"finish_reason":null}]}

data: {"id":"chatcmpl-120f732f-cd8b-4d3c-9061-95363e65feef","object":"chat.completion.chunk","created":1769121035,"model":"default","choices":[{"index":0,"delta":{},"finish_reason":"stop"}],"usage":{"prompt_tokens":112,"completion_tokens":6,"total_tokens":118}}

data: [DONE]
```

**Chunk Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Completion ID (same for all chunks) |
| `object` | string | Always `"chat.completion.chunk"` |
| `created` | number | Unix timestamp |
| `model` | string | Model used |
| `choices[].index` | number | Choice index |
| `choices[].delta.role` | string | Role (first chunk only) |
| `choices[].delta.content` | string | Text content (content chunks) |
| `choices[].finish_reason` | string | `"stop"` on final chunk, else `null` |
| `usage` | object | Token usage (final chunk only) |

### Using OpenAI Client Libraries

```typescript
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: '2dai_pk_your_key',
  baseURL: 'https://api.2dai.io/v1'
});

// Works exactly like OpenAI API
const completion = await client.chat.completions.create({
  model: 'default',
  messages: [{ role: 'user', content: 'Hello!' }],
  stream: true  // Streaming supported
});

for await (const chunk of completion) {
  process.stdout.write(chunk.choices[0]?.delta?.content || '');
}
```

> **Note:** Use model `"2dai-llm"` or `"default"` for the request.

### POST /v1/chat/completions (streaming)

**Request:**
```json
{
  "model": "2DAI-LLM",
  "messages": [{ "role": "user", "content": "Hi!" }],
  "stream": true
}
```

**Response (SSE):**
```
data: {"id":"chatcmpl-120f732f-cd8b-4d3c-9061-95363e65feef","object":"chat.completion.chunk","created":1769121035,"model":"default","choices":[{"index":0,"delta":{"role":"assistant"},"finish_reason":null}]}

data: {"id":"chatcmpl-120f732f-cd8b-4d3c-9061-95363e65feef","object":"chat.completion.chunk","created":1769121035,"model":"default","choices":[{"index":0,"delta":{"content":"Hello"},"finish_reason":null}]}

data: {"id":"chatcmpl-120f732f-cd8b-4d3c-9061-95363e65feef","object":"chat.completion.chunk","created":1769121035,"model":"default","choices":[{"index":0,"delta":{"content":"!"},"finish_reason":null}]}

data: {"id":"chatcmpl-120f732f-cd8b-4d3c-9061-95363e65feef","object":"chat.completion.chunk","created":1769121035,"model":"default","choices":[{"index":0,"delta":{},"finish_reason":"stop"}],"usage":{"prompt_tokens":112,"completion_tokens":6,"total_tokens":118}}

data: [DONE]
```

**Chunk Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Completion ID (same for all chunks) |
| `object` | string | Always `"chat.completion.chunk"` |
| `created` | number | Unix timestamp |
| `model` | string | Model used |
| `choices[].index` | number | Choice index |
| `choices[].delta.role` | string | Role (first chunk only) |
| `choices[].delta.content` | string | Text content (content chunks) |
| `choices[].finish_reason` | string | `"stop"` on final chunk, else `null` |
| `usage` | object | Token usage (final chunk only) |

### Using OpenAI Client Libraries

```typescript
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: '2dai_pk_your_key',
  baseURL: 'https://api.2dai.io/v1'
});

// Works exactly like OpenAI API
const completion = await client.chat.completions.create({
  model: 'default',
  messages: [{ role: 'user', content: 'Hello!' }],
  stream: true  // Streaming supported
});

for await (const chunk of completion) {
  process.stdout.write(chunk.choices[0]?.delta?.content || '');
}
```

---

## WebSocket API

For detailed WebSocket documentation, see the dedicated [WebSocket API](WebSocket-API) page.

**Connection:** `wss://api.2dai.io/ws/generation`

**Supported Operations:**
- `generate_image` - Text-to-image, img2img, or imgs2img (dual-image with `imageId2`)
- `generate_video` - Image-to-video
- `generate_upscale` - AI image upscale
- `generate_llm` - LLM text generation (supports streaming)

### WebSocket Dual-Image Example (imgs2img)

**Request:**
```json
{
  "type": "generate_image",
  "requestId": "req_1770076044100",
  "data": {
    "imageId": "f71f8d0d-488f-4b94-a260-06de434ae5ed",
    "imageId2": "9cba3bf4-865f-4d2d-a0a2-92470fba2dc8",
    "prompt": "blend elements from image 2 into the scene of image 1"
  }
}
```

**Response:**
```json
{
  "type": "generation_complete",
  "requestId": "req_1770076044100",
  "data": {
    "result": {
      "imageId": "91f613a7-5816-42a8-a6b4-543cecc09975",
      "seed": 1338529555
    }
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `type` | string | Always `"generation_complete"` on success |
| `requestId` | string | Matches the request ID sent |
| `data.result.imageId` | string | Result image CDN ID (UUID) |
| `data.result.seed` | number | Seed used for generation |

---

## Type Definitions

### ImageGenerationOptions

```typescript
interface ImageGenerationOptions {
  prompt: string;
  style?: StylePreset | string;
  format?: FormatPreset | string;
  negativePrompt?: string;
  seed?: number;
  width?: number;
  height?: number;
  imageId2?: string;           // Image 2 for dual-image mode (imgs2img)
  watermark?: string;
  watermarkPosition?: WatermarkPosition;
  watermarkAsTiles?: boolean;
  copyright?: string;
}
```

### VideoGenerationOptions

```typescript
interface VideoGenerationOptions {
  imageId?: string;
  imageBuffer?: Buffer;
  prompt?: string;    // Motion/animation prompt
  duration?: number;  // 1-10 seconds
  fps?: number;       // 8-60 fps
  watermark?: string;
  watermarkPosition?: WatermarkPosition;
}
```

### TextGenerationOptions

```typescript
interface TextGenerationOptions {
  prompt: string;
  system?: string;
  memory?: string[];
  jsonFormat?: boolean;
  jsonTemplate?: { [key: string]: string };
  useRandomSeed?: boolean;
  askKnowledge?: {
    sources?: string[];
    query?: string;
  };
  useMarkdown?: boolean;
  imageId?: string;  // For vision/image analysis
}
```

### UpscaleOptions

```typescript
interface UpscaleOptions {
  factor?: number;  // 2, 3, or 4 (default: 2)
  seed?: number;
}
```

### WatermarkPosition

```typescript
type WatermarkPosition =
  // Sharp gravity constants (recommended)
  | 'center'
  | 'northwest' | 'north' | 'northeast'
  | 'west' | 'east'
  | 'southwest' | 'south' | 'southeast'
  // Human-readable alternatives
  | 'top-left' | 'top-center' | 'top-right'
  | 'middle-left' | 'middle-center' | 'middle-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right';
```

### OperationUsage (Concurrent Slots)

For Image, Video, and LLM operations:

```typescript
interface ConcurrentUsage {
  activeSlots: number;      // Currently active operations
  available: number;        // Slots available
  resetAt: {
    window15Min: string | null;
  };
}
```

### OperationUsage (Rate-Based)

For CDN operations:

```typescript
interface RateBasedUsage {
  requestsPer15Min: number;
  requestsPerDay: number;
  resetAt: {
    window15Min: string | null;
    daily: string | null;
  };
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `INVALID_API_KEY` | Invalid or missing API key |
| `RATE_LIMIT_EXCEEDED` | Rate limit exceeded |
| `INVALID_REQUEST` | Malformed request body |
| `RESOURCE_NOT_FOUND` | Requested resource not found |
| `GENERATION_FAILED` | Generation failed |
| `INTERNAL_ERROR` | Internal server error |

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Please try again later.",
    "details": {
      "operation": "image",
      "resetAt": "2026-01-21T10:45:00.000Z"
    }
  }
}
```

---

## Next Steps

- [Examples](Examples) - Complete code examples
- [Troubleshooting](Troubleshooting) - Common issues and solutions
- [WebSocket API](WebSocket-API) - Real-time generation

---

← [WebSocket API](WebSocket-API) | [Examples](Examples) →
