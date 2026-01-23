# WebSocket API

Real-time generation with progress updates and streaming support.

## Table of Contents

- [Overview](#overview)
- [Connection & Authentication](#connection--authentication)
- [SDK Methods](#sdk-methods)
- [Image Generation](#image-generation)
- [Video Generation](#video-generation)
- [LLM Generation](#llm-generation)
- [LLM Streaming](#llm-streaming)
- [Image Upscaling](#image-upscaling)
- [Settings](#settings)
- [Raw WebSocket Protocol](#raw-websocket-protocol)
- [Connection Options](#connection-options)

---

## Overview

The WebSocket API provides:
- Real-time generation with progress updates
- Lower latency than REST for multiple operations
- LLM streaming support
- Automatic reconnection with backoff

**Connection URL:** `wss://api.2dai.io/ws/generation`

---

## Connection & Authentication

### Using the SDK (Recommended)

```typescript
import { createClient } from '2dai-cloud-sdk';

const client = createClient('2dai_pk_your_api_key');

// Connect and authenticate
await client.wsConnect();

// Use WebSocket methods...
const image = await client.wsGenerateImage({
  prompt: 'a beautiful sunset',
  style: 'cine'
});

// Close connection when done
await client.close();
```

### Connection Lifecycle

```typescript
// Connect
await client.wsConnect();

// Check if connected
// (internally tracked, auto-reconnects on failure)

// Close gracefully
await client.close();
```

---

## SDK Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `wsConnect()` | Connect and authenticate | `Promise<void>` |
| `wsGenerateImage()` | Generate image (text2img or img2img) | `Promise<WsImageResponse>` |
| `wsGenerateVideo()` | Generate video from image | `Promise<WsVideoResponse>` |
| `wsGenerateLlm()` | Generate text (non-streaming) | `Promise<WsLlmResponse>` |
| `wsGenerateLlmStream()` | Generate text (streaming) | `WsStreamController` |
| `wsUpscaleImage()` | AI upscale image | `Promise<WsUpscaleResponse>` |
| `wsGetSettings()` | Get API key settings | `Promise<WsSettingsResponse>` |
| `wsGetUsage()` | Get usage statistics | `Promise<WsUsageResponse>` |
| `wsGetRateLimits()` | Get rate limit status | `Promise<WsRateLimitsResponse>` |
| `close()` | Close connection | `Promise<void>` |

---

## Image Generation

### Text-to-Image

```typescript
await client.wsConnect();

const result = await client.wsGenerateImage({
  prompt: 'A sunset over mountains',
  style: 'realistic',
  format: 'landscape'
});

console.log(result.result.imageId);
console.log(`${result.result.width}x${result.result.height}`);
```

### Image-to-Image (Edit)

```typescript
const result = await client.wsGenerateImage({
  imageId: 'existing-image-id',
  prompt: 'add dramatic lighting'
});
```

### WsImageRequest Options

| Option | Type | Description |
|--------|------|-------------|
| `prompt` | `string` | Text description |
| `style` | `string` | Style preset |
| `format` | `string` | Format preset |
| `negativePrompt` | `string` | What to avoid |
| `seed` | `number` | For reproducibility (0-2000000000) |
| `width` | `number` | Custom width (320-1344) |
| `height` | `number` | Custom height (320-1344) |

### WsImg2ImgRequest Options

| Option | Type | Description |
|--------|------|-------------|
| `imageId` | `string` | Source image CDN ID |
| `prompt` | `string` | Edit instructions |
| `negativePrompt` | `string` | What to avoid |
| `seed` | `number` | For reproducibility |
| `width` | `number` | Output width (320-1344) |
| `height` | `number` | Output height (320-1344) |
| `resizePad` | `boolean` | Enable resize padding |

---

## Video Generation

```typescript
await client.wsConnect();

const result = await client.wsGenerateVideo({
  imageId: 'source-image-id',
  duration: 5,
  fps: 16
});

console.log(result.result.videoId);
console.log(`${result.result.duration}s at ${result.result.fps}fps`);
```

### WsVideoRequest Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `imageId` | `string` | required | Source image CDN ID |
| `duration` | `number` | `5` | Duration in seconds (1-10) |
| `fps` | `number` | `16` | Frames per second (8-60) |

---

## LLM Generation

### Basic Usage

```typescript
await client.wsConnect();

const result = await client.wsGenerateLlm({
  prompt: 'Explain TypeScript'
});

console.log(result.result.text);
console.log(`Tokens: ${result.result.tokensUsed}`);
```

### With System Prompt and JSON

```typescript
const result = await client.wsGenerateLlm({
  prompt: 'List 3 programming languages',
  system: 'You are a helpful assistant',
  jsonFormat: true,
  jsonTemplate: { languages: 'array of language names' }
});

console.log(result.result.json);
// { languages: ["JavaScript", "Python", "TypeScript"] }
```

### WsLlmRequest Options

| Option | Type | Description |
|--------|------|-------------|
| `prompt` | `string` | The prompt/question |
| `system` | `string` | System prompt for behavior |
| `memory` | `string[]` | Conversation history |
| `jsonFormat` | `boolean` | Enable JSON output |
| `jsonTemplate` | `object` | JSON structure template |
| `useRandomSeed` | `boolean` | Use random seed |
| `useMarkdown` | `boolean` | Enable markdown |
| `imageId` | `string` | Image for vision analysis |

### WsLlmResponse

```typescript
interface WsLlmResponse {
  result: {
    text: string;
    json?: any;
    tokensUsed: number;
    promptTokens?: number;      // Input tokens
    completionTokens?: number;  // Output tokens
  };
}
```

---

## LLM Streaming

Stream text chunks in real-time for responsive UIs.

```typescript
await client.wsConnect();

const controller = client.wsGenerateLlmStream(
  {
    prompt: 'Write a haiku about coding',
    system: 'You are a creative poet'
  },
  {
    onChunk: (chunk) => {
      process.stdout.write(chunk);
    },
    onComplete: (response) => {
      console.log(`\nTokens: ${response.result.tokensUsed}`);
      console.log(`Prompt tokens: ${response.result.promptTokens}`);
      console.log(`Completion tokens: ${response.result.completionTokens}`);
    },
    onError: (error) => {
      console.error('Stream error:', error.message);
    }
  }
);

// Optionally abort the stream
// controller.abort();
```

### Stream Controller

```typescript
interface WsStreamController {
  requestId: string;  // Request identifier
  abort: () => void;  // Cancel the stream
}
```

### Streaming Notes

- **JSON Format Disabled**: Streaming is not compatible with `jsonFormat: true`
- **Upstream Cancellation**: Calling `abort()` stops GPU processing server-side
- **Token Breakdown**: Final response includes `promptTokens` and `completionTokens`

---

## Image Upscaling

AI-powered image upscaling (2x, 3x, or 4x).

```typescript
await client.wsConnect();

const result = await client.wsUpscaleImage({
  imageId: 'source-image-id',
  factor: 2  // 2x, 3x, or 4x
});

console.log(result.result.imageId);
console.log(`${result.result.width}x${result.result.height}`);
```

### WsUpscaleRequest Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `imageId` | `string` | required | Source image CDN ID |
| `factor` | `number` | `2` | Upscale factor (2, 3, or 4) |
| `seed` | `number` | - | For reproducibility |

---

## Settings

Access API key settings, usage statistics, and rate limits via WebSocket.

### Get Settings

```typescript
await client.wsConnect();

const response = await client.wsGetSettings();

console.log('Status:', response.settings.status);
console.log('Image limit:', response.settings.rateLimits.image.requestsPer15Min);
console.log('Current image usage:', response.settings.currentUsage.image.current.requestsPer15Min);
```

### WsSettingsResponse

```typescript
interface WsSettingsResponse {
  settings: {
    status: string;                    // "active" | "suspended"
    rateLimits: {
      image: { requestsPer15Min: number; requestsPerDay: number };
      video: { requestsPer15Min: number; requestsPerDay: number };
      llm: { requestsPer15Min: number; requestsPerDay: number; tokensPer15Min?: number; tokensPerDay?: number };
      cdn: { requestsPer15Min: number; requestsPerDay: number };
    };
    currentUsage: {
      image: { current: {...}; remaining: {...}; resetAt: {...} };
      video: { current: {...}; remaining: {...}; resetAt: {...} };
      llm: { current: {...}; remaining: {...}; resetAt: {...} };
      cdn: { current: {...}; remaining: {...}; resetAt: {...} };
    };
    lastUsedAt?: string;
  };
}
```

### Get Usage Statistics

```typescript
await client.wsConnect();

// Get usage for last 7 days
const response = await client.wsGetUsage({ days: 7 });

console.log('Period:', response.usage.period.start, '-', response.usage.period.end);
console.log('Total requests:', response.usage.summary.total);
console.log('Success rate:', response.usage.summary.successRate, '%');
console.log('Total tokens:', response.usage.summary.totalTokens);
console.log('By operation:', response.usage.summary.byOperation);
```

### WsUsageResponse

```typescript
interface WsUsageResponse {
  usage: {
    period: {
      start: string;       // ISO date
      end: string;         // ISO date
      days: number;        // 7, 30, etc.
    };
    summary: {
      total: number;                                                   // Total requests
      byOperation: { image: number; video: number; llm: number; cdn: number };
      totalTokens: number;                                             // LLM tokens used
      successRate: number;                                             // Percentage (e.g., 95.24)
    };
    daily: Array<{
      date: string;        // "2026-01-22"
      total: number;
      byOperation: { image: number; video: number; llm: number; cdn: number };
      tokens: number;
    }>;
  };
}
```

### Get Rate Limits

```typescript
await client.wsConnect();

const response = await client.wsGetRateLimits();

for (const limit of response.rateLimits) {
  console.log(`${limit.operation}: ${limit.current.requestsPer15Min}/${limit.limit.requestsPer15Min} (15min)`);
}
```

### WsRateLimitsResponse

```typescript
interface WsRateLimitsResponse {
  rateLimits: Array<{
    operation: 'image' | 'video' | 'llm' | 'cdn';
    allowed: boolean;
    remaining15min: number;
    remainingDaily: number;
    current: {
      requestsPer15Min: number;
      requestsPerDay: number;
      tokensPer15Min: number;
      tokensPerDay: number;
    };
    limit: {
      requestsPer15Min: number;
      requestsPerDay: number;
      tokensPer15Min?: number;
      tokensPerDay?: number;
    };
    resetAt: {
      window15Min: string;  // ISO date
      daily: string;        // ISO date
    };
  }>;
}
```

---

## Raw WebSocket Protocol

For custom implementations without the SDK.

### Message Types (Client → Server)

| Type | Description |
|------|-------------|
| `auth` | Authenticate with API key |
| `generate_image` | Text-to-image or img2img |
| `generate_video` | Image-to-video |
| `generate_upscale` | AI image upscale |
| `generate_llm` | LLM text generation |
| `get_settings` | Get API key settings |
| `get_usage` | Get usage statistics |
| `get_rate_limits` | Get rate limit status |
| `cancel` | Cancel operation |
| `ping` | Keepalive ping |

### Message Types (Server → Client)

| Type | Description |
|------|-------------|
| `auth_success` | Authentication successful |
| `progress` | Generation progress (0-100) |
| `generation_complete` | Generation finished |
| `llm_chunk` | Streaming text chunk |
| `settings_response` | Settings/usage/rate limits data |
| `error` | Error with code and message |
| `pong` | Keepalive response |

### Message Examples

```json
// Client → Server: Authenticate
{ "type": "auth", "data": { "apiKey": "2dai_pk_your_key" } }

// Server → Client: Auth success
{ "type": "auth_success", "data": { "message": "Authenticated successfully" } }

// Client → Server: Generate image
{
  "type": "generate_image",
  "requestId": "req_123",
  "data": {
    "prompt": "a beautiful sunset",
    "style": "cine",
    "format": "landscape"
  }
}

// Server → Client: Progress update
{ "type": "progress", "requestId": "req_123", "data": { "progress": 45, "status": "generating" } }

// Server → Client: Generation complete
{
  "type": "generation_complete",
  "requestId": "req_123",
  "data": {
    "imageId": "img_abc123",
    "url": "https://cdn.2dai.io/img_abc123.jpg"
  }
}

// Client → Server: LLM generation (streaming)
{
  "type": "generate_llm",
  "requestId": "req_456",
  "data": {
    "prompt": "Tell me a story",
    "stream": true
  }
}

// Server → Client: LLM chunk (streaming)
{ "type": "llm_chunk", "requestId": "req_456", "data": { "chunk": "Once upon " } }

// Server → Client: LLM complete
{
  "type": "generation_complete",
  "requestId": "req_456",
  "data": {
    "result": {
      "text": "Once upon a time...",
      "tokensUsed": 156,
      "promptTokens": 12,
      "completionTokens": 144
    }
  }
}

// Server → Client: Error
{
  "type": "error",
  "requestId": "req_123",
  "data": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Please try again later."
  }
}

// Client → Server: Cancel operation
{ "type": "cancel", "requestId": "req_123" }

// Client → Server: Ping
{ "type": "ping" }

// Server → Client: Pong
{ "type": "pong" }

// Client → Server: Get settings
{ "type": "get_settings", "requestId": "req_789" }

// Server → Client: Settings response
{
  "type": "settings_response",
  "requestId": "req_789",
  "data": {
    "settings": {
      "status": "active",
      "rateLimits": {
        "image": { "requestsPer15Min": 15, "requestsPerDay": 360 },
        "video": { "requestsPer15Min": 5, "requestsPerDay": 30 },
        "llm": { "requestsPer15Min": 75, "requestsPerDay": 1800, "tokensPer15Min": 150000, "tokensPerDay": 3500000, "maxPromptLength": 90000 },
        "cdn": { "requestsPer15Min": 200, "requestsPerDay": 5000 }
      },
      "currentUsage": {
        "image": {
          "current": { "requestsPer15Min": 1, "requestsPerDay": 1, "tokensPer15Min": 0, "tokensPerDay": 0 },
          "remaining": { "requestsPer15Min": 14, "requestsPerDay": 359 },
          "resetAt": { "window15Min": "2026-01-23T03:15:00.000Z", "daily": "2026-01-23T05:00:00.000Z" }
        },
        "video": {
          "current": { "requestsPer15Min": 0, "requestsPerDay": 0, "tokensPer15Min": 0, "tokensPerDay": 0 },
          "remaining": { "requestsPer15Min": 5, "requestsPerDay": 30 },
          "resetAt": { "window15Min": "2026-01-23T03:15:00.000Z", "daily": "2026-01-23T05:00:00.000Z" }
        },
        "llm": {
          "current": { "requestsPer15Min": 0, "requestsPerDay": 0, "tokensPer15Min": 0, "tokensPerDay": 0 },
          "remaining": { "requestsPer15Min": 75, "requestsPerDay": 1800 },
          "resetAt": { "window15Min": "2026-01-23T03:15:00.000Z", "daily": "2026-01-23T05:00:00.000Z" }
        },
        "cdn": {
          "current": { "requestsPer15Min": 0, "requestsPerDay": 0, "tokensPer15Min": 0, "tokensPerDay": 0 },
          "remaining": { "requestsPer15Min": 200, "requestsPerDay": 5000 },
          "resetAt": { "window15Min": "2026-01-23T03:15:00.000Z", "daily": "2026-01-23T05:00:00.000Z" }
        }
      }
    }
  }
}

// Client → Server: Get usage
{ "type": "get_usage", "requestId": "req_790", "data": { "days": 7 } }

// Server → Client: Usage response
{
  "type": "settings_response",
  "requestId": "req_790",
  "data": {
    "usage": {
      "period": { "start": "2026-01-16T03:01:13.953Z", "end": "2026-01-23T03:01:13.953Z", "days": 7 },
      "summary": {
        "total": 105,
        "byOperation": { "image": 26, "video": 6, "llm": 12, "cdn": 0 },
        "totalTokens": 7547,
        "successRate": 95.24
      },
      "daily": [
        { "date": "2026-01-22", "total": 47, "byOperation": { "image": 0, "video": 0, "llm": 0, "cdn": 0 }, "tokens": 0 },
        { "date": "2026-01-23", "total": 58, "byOperation": { "image": 26, "video": 6, "llm": 12, "cdn": 0 }, "tokens": 7547 }
      ]
    }
  }
}

// Client → Server: Get rate limits
{ "type": "get_rate_limits", "requestId": "req_791" }

// Server → Client: Rate limits response
{
  "type": "settings_response",
  "requestId": "req_791",
  "data": {
    "rateLimits": [
      {
        "operation": "image",
        "allowed": true,
        "remaining15min": 14,
        "remainingDaily": 359,
        "current": { "requestsPer15Min": 1, "requestsPerDay": 1, "tokensPer15Min": 0, "tokensPerDay": 0 },
        "limit": { "requestsPer15Min": 15, "requestsPerDay": 360 },
        "resetAt": { "window15Min": "2026-01-23T03:15:00.000Z", "daily": "2026-01-23T05:00:00.000Z" }
      },
      {
        "operation": "video",
        "allowed": true,
        "remaining15min": 5,
        "remainingDaily": 30,
        "current": { "requestsPer15Min": 0, "requestsPerDay": 0, "tokensPer15Min": 0, "tokensPerDay": 0 },
        "limit": { "requestsPer15Min": 5, "requestsPerDay": 30 },
        "resetAt": { "window15Min": "2026-01-23T03:15:00.000Z", "daily": "2026-01-23T05:00:00.000Z" }
      },
      {
        "operation": "llm",
        "allowed": true,
        "remaining15min": 75,
        "remainingDaily": 1800,
        "current": { "requestsPer15Min": 0, "requestsPerDay": 0, "tokensPer15Min": 0, "tokensPerDay": 0 },
        "limit": { "requestsPer15Min": 75, "requestsPerDay": 1800, "tokensPer15Min": 150000, "tokensPerDay": 3500000 },
        "resetAt": { "window15Min": "2026-01-23T03:15:00.000Z", "daily": "2026-01-23T05:00:00.000Z" }
      },
      {
        "operation": "cdn",
        "allowed": true,
        "remaining15min": 200,
        "remainingDaily": 5000,
        "current": { "requestsPer15Min": 0, "requestsPerDay": 0, "tokensPer15Min": 0, "tokensPerDay": 0 },
        "limit": { "requestsPer15Min": 200, "requestsPerDay": 5000 },
        "resetAt": { "window15Min": "2026-01-23T03:15:00.000Z", "daily": "2026-01-23T05:00:00.000Z" }
      }
    ]
  }
}
```

---

## Connection Options

Configure WebSocket behavior when creating the client.

```typescript
const client = createClient('2dai_pk_your_api_key', {
  // Auto-reconnect on disconnect (default: true)
  wsAutoReconnect: true,

  // Initial reconnect delay in ms (default: 1000)
  wsReconnectIntervalMs: 1000,

  // Max reconnect delay with backoff (default: 30000)
  wsMaxReconnectDelayMs: 30000,

  // Ping interval to keep connection alive (default: 30000)
  wsPingIntervalMs: 30000
});
```

### Connection Options Reference

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `wsAutoReconnect` | `boolean` | `true` | Auto-reconnect on disconnect |
| `wsReconnectIntervalMs` | `number` | `1000` | Initial reconnect delay |
| `wsMaxReconnectDelayMs` | `number` | `30000` | Max backoff delay |
| `wsPingIntervalMs` | `number` | `30000` | Ping interval |

---

## Next Steps

- [API Reference](API-Reference) - Full endpoint documentation
- [Examples](Examples) - Complete code examples
- [Troubleshooting](Troubleshooting) - Common issues

---

← [CDN Operations](CDN-Operations) | [API Reference](API-Reference) →
