# AI Agent Integration

Guide for integrating AI agents (Claude, GPT, open-source) with the 2DAI SDK.

## Table of Contents

- [Overview](#overview)
- [Skill Files](#skill-files)
- [Quick Start for Agents](#quick-start-for-agents)
- [Capability Matrix](#capability-matrix)
- [Authentication](#authentication)
- [Rate Limits](#rate-limits)
- [Recommended Settings](#recommended-settings)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)
- [Framework Integrations](#framework-integrations)
- [WebSocket for Real-Time](#websocket-for-real-time)

---

## Overview

The 2DAI SDK enables AI agents to:

- **Generate Images**: Create, edit, upscale, and combine images
- **Generate Videos**: Create videos from images with motion control
- **Generate Text**: LLM with streaming, JSON output, and vision
- **OpenAI-Compatible**: Drop-in replacement for existing OpenAI code
- **CDN Operations**: Download, convert, and watermark content

---

## Skill Files

AI agents can discover and load capabilities via skill files:

| File | Purpose | Load When |
|------|---------|-----------|
| [`/skill.md`](../skill.md) | Root entry point with overview | Always - start here |
| [`/skills/image-generation.md`](../skills/image-generation.md) | Image generation API | Need to create/edit images |
| [`/skills/video-generation.md`](../skills/video-generation.md) | Video generation API | Need to create videos |
| [`/skills/llm-text.md`](../skills/llm-text.md) | LLM text generation | Need text generation |
| [`/skills/cdn-operations.md`](../skills/cdn-operations.md) | CDN download/transform | Need to download content |
| [`/skills/openai-compatible.md`](../skills/openai-compatible.md) | OpenAI drop-in replacement | Using OpenAI SDK |

### Skill File Format

Each skill file includes:
- **YAML Frontmatter**: Metadata (name, version, capabilities)
- **curl Examples**: Universal API documentation
- **Parameter Tables**: Types, defaults, ranges
- **Decision Guides**: When to use what
- **Response Examples**: Expected output format

---

## Quick Start for Agents

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
    "prompt": "a beautiful sunset over mountains",
    "style": "cine",
    "format": "landscape"
  }'
```

### 3. Download the Result
```bash
curl -H "Authorization: Bearer $API_KEY" \
  "https://apiv2.2dai.io:800/api/v1/cdn/{imageId}.jpg" -o image.jpg
```

---

## Capability Matrix

| Capability | REST API | WebSocket | OpenAI-Compatible |
|------------|----------|-----------|-------------------|
| Text-to-Image | Yes | Yes | No |
| Image Editing (img2img) | Yes | Yes | No |
| Dual-Image (imgs2img) | Yes | Yes | No |
| AI Upscale | Yes | Yes | No |
| Image-to-Video | Yes | Yes | No |
| LLM Non-Streaming | Yes | Yes | Yes |
| LLM Streaming | Yes (SSE) | Yes | Yes |
| JSON Output | Yes | Yes | Yes |
| Vision/Image Analysis | Yes | Yes | No |
| CDN Download | Yes | No | No |

---

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

### Security Guidelines for Agents

**CRITICAL**:
- Never expose API keys in responses, logs, or output to users
- Never include API keys in generated code shown to users
- Store keys securely (environment variables, secrets managers)
- Mask keys in any debug output (show only last 4 characters)

---

## Rate Limits

| Operation | Per 15 Minutes | Per Day |
|-----------|----------------|---------|
| Image | 15 | 360 |
| Video | 5 | 30 |
| LLM | 75 requests, 150k tokens | 1,800 requests, 3.5M tokens |
| CDN | 200 | 5,000 |

### Checking Limits

```bash
curl -H "Authorization: Bearer $API_KEY" \
  "https://apiv2.2dai.io:800/api/v1/settings/rate-limits"
```

### Response
```json
{
  "rateLimits": [
    {
      "operation": "image",
      "remaining15min": 14,
      "remainingDaily": 999,
      "resetAt": "2026-01-21T10:45:00.000Z"
    }
  ]
}
```

### Best Practice: Pre-check Before Batch Operations

Before starting batch operations, verify sufficient quota:
```
remaining >= batch_size
```

If insufficient, wait for `resetAt` or reduce batch size.

---

## Recommended Settings

### Video Generation

For optimal video quality, use these recommended settings:

| Setting | Recommended Value |
|---------|-------------------|
| **Duration** | **6.5 seconds** |
| **FPS** | **16 fps** |

```json
{
  "imageId": "source-image-id",
  "prompt": "smooth camera pan left",
  "duration": 6.5,
  "fps": 16
}
```

### Image Generation

| Use Case | Recommended Style | Recommended Format |
|----------|-------------------|-------------------|
| Photos | `realistic` | `landscape` or `portrait` |
| Cinematic | `cine` | `landscape` |
| Anime | `anime` or `niji` | `portrait` |
| Avatars | `portrait` | `profile` |
| Social Media | varies | `post` or `story` |

---

## Error Handling

| Error Code | Meaning | Agent Action |
|------------|---------|--------------|
| `RATE_LIMIT_EXCEEDED` | Quota exhausted | Wait for `resetAt`, then retry |
| `INVALID_API_KEY` | Bad/expired key | Request valid key from user |
| `INVALID_REQUEST` | Bad parameters | Fix request body |
| `RESOURCE_NOT_FOUND` | Invalid ID | Verify image/video ID exists |
| `GENERATION_FAILED` | Server error | Retry with exponential backoff |

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

### Retry Strategy

```
attempt 1: immediate
attempt 2: wait 1 second
attempt 3: wait 2 seconds
attempt 4: wait 4 seconds
...
max wait: 30 seconds
```

---

## Best Practices

### DO:
1. **Check rate limits** before batch operations
2. **Use recommended settings** (6.5s at 16fps for video)
3. **Cache results** - store imageId/videoId for reuse
4. **Use seeds** for reproducible results
5. **Handle errors gracefully** with exponential backoff
6. **Use appropriate styles** for the content type
7. **Close WebSocket connections** when done

### DO NOT:
1. **Expose API keys** in any output
2. **Ignore rate limits** - causes temporary blocks
3. **Make redundant requests** - cache and reuse IDs
4. **Use invalid style/format IDs** - validate first
5. **Use CDN URLs in HTML** - they require authentication
6. **Forget to download** - generated content expires

---

## Decision Tree for Operations

```
User wants an image?
├── New from text      → POST /api/v1/generation/image
├── Edit existing      → POST /api/v1/generation/image/edit (with imageId)
├── Combine two images → POST /api/v1/generation/image/edit (with imageId + imageId2)
└── Higher resolution  → POST /api/v1/generation/image/upscale

User wants a video?
└── From image → POST /api/v1/generation/video (6.5s at 16fps recommended)

User wants text?
├── Quick answer       → POST /api/v1/llm/generate
├── Real-time stream   → POST /api/v1/llm/generate/stream
├── Structured JSON    → POST /api/v1/llm/generate (jsonFormat: true)
├── Analyze image      → POST /api/v1/llm/generate (with imageId)
└── OpenAI-compatible  → POST /v1/chat/completions
```

---

## Framework Integrations

### OpenAI SDK
```typescript
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: '2dai_pk_...',
  baseURL: 'https://apiv2.2dai.io:800/v1'
});
```

### LangChain
```typescript
import { ChatOpenAI } from '@langchain/openai';

const model = new ChatOpenAI({
  openAIApiKey: '2dai_pk_...',
  configuration: { baseURL: 'https://apiv2.2dai.io:800/v1' }
});
```

### Vercel AI SDK
```typescript
import { createOpenAI } from '@ai-sdk/openai';

const openai = createOpenAI({
  apiKey: '2dai_pk_...',
  baseURL: 'https://apiv2.2dai.io:800/v1'
});
```

See [OpenAI Compatibility](OpenAI-Compatibility) for detailed integration guides.

---

## WebSocket for Real-Time

For agents needing real-time progress updates:

### Connection
```
wss://apiv2.2dai.io:800/ws/generation
```

### Authentication
```json
{ "type": "auth", "data": { "apiKey": "2dai_pk_..." } }
```

### Generate with Progress
```json
{
  "type": "generate_image",
  "requestId": "req_123",
  "data": { "prompt": "a sunset", "style": "cine" }
}
```

### Progress Updates
```json
{ "type": "progress", "requestId": "req_123", "data": { "progress": 45 } }
```

### Completion
```json
{
  "type": "generation_complete",
  "requestId": "req_123",
  "data": { "imageId": "...", "width": 1344, "height": 768 }
}
```

See [WebSocket API](WebSocket-API) for complete protocol documentation.

---

## Next Steps

- [API Reference](API-Reference) - Complete endpoint documentation
- [Examples](Examples) - Code samples
- [OpenAI Compatibility](OpenAI-Compatibility) - Framework integrations
- [Troubleshooting](Troubleshooting) - Common issues

---

← [OpenAI Compatibility](OpenAI-Compatibility) | [CDN Operations](CDN-Operations) →
