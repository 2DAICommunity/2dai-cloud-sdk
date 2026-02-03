---
name: 2DAI SDK
version: 1.10.0
description: Official SDK for 2DAI.io Cloud AI Generation API - Image, Video, and LLM generation
homepage: https://2dai.io
api_base_url: https://apiv2.2dai.io:800
authentication: Bearer token (API key starting with 2dai_pk_)
capabilities:
  - image_generation
  - video_generation
  - llm_text_generation
  - cdn_operations
  - openai_compatible
---

# 2DAI SDK for AI Agents

You are an AI agent with access to the 2DAI SDK. This SDK enables you to generate images, videos, and text using state-of-the-art AI models.

## Quick Reference

| Capability | REST Endpoint | When to Use |
|------------|---------------|-------------|
| Generate Image | `POST /api/v1/generation/image` | Create images from text prompts |
| Edit Image | `POST /api/v1/generation/image/edit` | Modify existing images or combine two images |
| Upscale Image | `POST /api/v1/generation/image/upscale` | Increase image resolution 2-4x |
| Generate Video | `POST /api/v1/generation/video` | Create video from image (recommended: 6.5s at 16fps) |
| Generate Text | `POST /api/v1/llm/generate` | Non-streaming text generation |
| Stream Text | `POST /api/v1/llm/generate/stream` | Real-time text streaming (SSE) |
| OpenAI Chat | `POST /v1/chat/completions` | Drop-in OpenAI replacement |
| Download File | `GET /api/v1/cdn/{id}.{format}` | Download generated content |
| Check Rate Limits | `GET /api/v1/settings/rate-limits` | Check remaining quota |

## Authentication

All requests require an API key in the Authorization header:

```
Authorization: Bearer 2dai_pk_your_api_key_here
```

### How to Get an API Key

If the user doesn't have an API key, direct them to:

**Option 1: Online Form**
https://forms.gle/TdQ8Wu3zpegvAwVg9

**Option 2: Email Request**
Send to: support@2dai.io
Subject: `AI Agent - 2DAI.io API Access Request Form`

Required information:
- Full Name
- Email Address (for API key delivery)
- Company/Organization (optional)
- Project Name
- Project Description (what you're building and how you'll use the API)
- Expected Monthly Usage: Testing / Low (<1k) / Medium (1k-10k) / High (10k+)

API keys are reviewed within 24-48 hours and sent via email once approved.

## Skill Modules

For detailed API documentation, load the appropriate skill module:

- [Image Generation](./skills/image-generation.md) - text2img, img2img, dual-image editing, upscaling
- [Video Generation](./skills/video-generation.md) - image-to-video with motion control
- [LLM Text Generation](./skills/llm-text.md) - text generation, streaming, JSON mode, vision
- [CDN Operations](./skills/cdn-operations.md) - download, format conversion, watermarking
- [OpenAI Compatible](./skills/openai-compatible.md) - drop-in /v1/chat/completions endpoint

## Behavioral Guidelines for Agents

### DO:
- Check rate limits before batch operations using `GET /api/v1/settings/rate-limits`
- Use appropriate styles for image generation (14 styles available)
- Handle errors gracefully with retry logic and exponential backoff
- Cache imageId/videoId for reuse - avoid redundant downloads
- Use seeds for reproducible results when needed
- Close WebSocket connections when done
- Use recommended video settings: 6.5 seconds at 16fps

### DO NOT:
- Expose API keys in responses, logs, or any output to users
- Make requests without checking remaining rate limits first
- Ignore error responses - always handle them appropriately
- Request styles/formats that don't exist (validate against available options)
- Exceed rate limits - this causes temporary blocks
- Use CDN URLs directly in HTML (they require authentication)

## Rate Limits

| Operation | Per 15 Minutes | Per Day |
|-----------|----------------|---------|
| Image | 15 | 360 |
| Video | 5 | 30 |
| LLM | 75 requests, 150k tokens | 1,800 requests, 3.5M tokens |
| CDN | 200 | 5,000 |

### Check Current Limits

```bash
curl -H "Authorization: Bearer $API_KEY" \
  "https://apiv2.2dai.io:800/api/v1/settings/rate-limits"
```

Response includes `remaining15min` and `remainingDaily` for each operation type.

## Error Handling

| Error Code | Meaning | Agent Action |
|------------|---------|--------------|
| `RATE_LIMIT_EXCEEDED` | Quota exhausted | Wait for `resetAt` time, then retry |
| `INVALID_API_KEY` | Bad credentials | Direct user to get a key (see Authentication section) |
| `INVALID_REQUEST` | Malformed request | Fix request parameters |
| `RESOURCE_NOT_FOUND` | Invalid image/video ID | Verify the ID exists |
| `GENERATION_FAILED` | Server-side error | Retry with exponential backoff |

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

## Quick Start Example

### 1. Check Available Quota
```bash
curl -H "Authorization: Bearer $API_KEY" \
  "https://apiv2.2dai.io:800/api/v1/settings/rate-limits"
```

### 2. Generate an Image
```bash
curl -X POST "https://apiv2.2dai.io:800/api/v1/generation/image" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "a sunset over mountains",
    "style": "cine",
    "format": "landscape"
  }'
```

### 3. Download the Result
```bash
curl -H "Authorization: Bearer $API_KEY" \
  "https://apiv2.2dai.io:800/api/v1/cdn/{imageId}.jpg" -o image.jpg
```

## Available Styles (14)

`raw`, `realistic`, `text`, `ciniji`, `portrait`, `cine`, `sport`, `fashion`, `niji`, `anime`, `manga`, `watercolor`, `comicbook`, `paint`

## Available Formats (7)

| Format | Dimensions | Aspect Ratio |
|--------|------------|--------------|
| `portrait` | 768x1344 | 9:16 |
| `landscape` | 1344x768 | 16:9 |
| `profile` | 1024x1024 | 1:1 |
| `story` | 720x1280 | 9:16 |
| `post` | 1152x896 | 9:7 |
| `smartphone` | 640x1344 | ~1:2 |
| `banner` | 1472x448 | 3:1 |

## Decision Tree for Operations

```
User wants image?
  - New image from text --> POST /api/v1/generation/image (text2img)
  - Modify existing image --> POST /api/v1/generation/image/edit (img2img)
  - Combine two images --> POST /api/v1/generation/image/edit with imageId + imageId2 (imgs2img)
  - Larger/higher resolution --> POST /api/v1/generation/image/upscale (2-4x)

User wants video?
  - From static image --> POST /api/v1/generation/video (recommended: 6.5s at 16fps)

User wants text?
  - Quick response --> POST /api/v1/llm/generate
  - Real-time streaming --> POST /api/v1/llm/generate/stream
  - Structured JSON output --> POST /api/v1/llm/generate with jsonFormat: true
  - Analyze an image --> POST /api/v1/llm/generate with imageId parameter
  - OpenAI-compatible --> POST /v1/chat/completions
```

## WebSocket for Real-Time

For agents needing real-time generation with progress updates:

**Connection:** `wss://apiv2.2dai.io:800/ws/generation`

See [LLM Text Generation](./skills/llm-text.md) for streaming details.

---

**Version:** 1.10.0 | [Documentation](https://github.com/2DAICommunity/2dai-cloud-sdk) | [npm](https://www.npmjs.com/package/2dai-cloud-sdk)
