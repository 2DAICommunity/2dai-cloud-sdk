# 2DAI SDK Documentation

Welcome to the official documentation for **2dai-cloud-sdk** - the TypeScript/JavaScript SDK for 2DAI.io Cloud AI Generation API.

## Quick Navigation

| Guide | Description |
|-------|-------------|
| [Getting Started](Getting-Started) | Installation, API key setup, initialization |
| [Image Generation](Image-Generation) | Text-to-image, image editing, AI upscaling |
| [Video Generation](Video-Generation) | Image-to-video creation |
| [LLM & Streaming](LLM-Text-Generation) | Text generation, streaming, OpenAI-compatible API |
| [OpenAI Compatibility](OpenAI-Compatibility) | Framework integrations: LangChain, Vercel AI, LlamaIndex |
| [AI Agent Integration](AI-Agent-Integration) | Enable AI agents (Claude, GPT, etc.) to use the SDK |
| [STT Speech-to-Text](STT-Speech-to-Text) | Audio transcription, streaming, multi-language |
| [TTS Text-to-Speech](TTS-Text-to-Speech) | Voice synthesis, cloning, realtime mode, streaming |
| [CDN Operations](CDN-Operations) | Downloads, watermarks, format conversion |
| [WebSocket API](WebSocket-API) | Real-time generation with progress updates |
| [API Reference](API-Reference) | Complete endpoint documentation |
| [Examples](Examples) | Full code examples |
| [Troubleshooting](Troubleshooting) | Common issues, debug mode, best practices |

## What's New in 1.14.0

- **Priority Queue Tiers** — `priority: 'normal'|'high'|'urgent'|'critical'` on every generation method. Higher tiers jump the queue (DWRR scheduling on the server).
- **Enhanced Vision** — `enhancedVision: true` on LLM requests routes image analysis to a dedicated vision model with auto-fallback.
- **Batch CDN Delete** — `batchDeleteFiles(ids)` deletes up to 1000 files in one round-trip. Idempotent (`alreadyDeleted: true` markers), deduped server-side.
- **Max-Side Resize** — `?s=N` query param on CDN GET (and `maxSide` on `downloadFromCDN` / `getFileURL`). Scales longest side to N px (cap 4096). Takes precedence over `width`/`height`.
- **`getFileURL()`** — Build a CDN URL without downloading. Useful for `<img>` / `<video>` tags.

All new fields are **optional and additive**. 1.12.x code keeps working unmodified.

## Features

- **Text-to-Image** - Generate images from text prompts with 14 style presets
- **Image-to-Image** - Edit and transform existing images
- **AI Image Upscale** - Upscale images 2-4x using AI
- **Image-to-Video** - Create videos from static images
- **LLM Text Generation** - Generate text with memory, JSON support, streaming, and enhanced vision
- **OpenAI-Compatible API** - Drop-in `/v1/chat/completions` endpoint
- **Image Description (Vision)** - Analyze images with LLM (now with `enhancedVision` flag)
- **STT Speech-to-Text** - Audio transcription with streaming and multi-language support
- **TTS Text-to-Speech** - Voice synthesis with voice models, cloning, realtime mode, and streaming
- **Priority Queue** *(1.14.0)* - Workload prioritization; higher priorities also route to faster compute on the server
- **CDN Batch Delete** *(1.14.0)* - Idempotent bulk file cleanup
- **Built-in Watermarking** - Apply custom watermarks to content
- **WebSocket Support** - Real-time generation with progress updates
- **Full TypeScript Support** - Comprehensive type definitions

## Quick Install

```bash
npm install 2dai-cloud-sdk
```

## Quick Example

```typescript
import { createClient, STYLES, FORMATS } from '2dai-cloud-sdk';

const client = createClient('2dai_pk_your_api_key');

// Generate an image
const image = await client.generateImage({
  prompt: 'A beautiful sunset over mountains',
  style: STYLES.realistic,
  format: FORMATS.landscape
});

console.log('Image ID:', image.imageId);
```

## Need Help?

- [Troubleshooting Guide](Troubleshooting)
- [GitHub Issues](https://github.com/2DAICommunity/2dai-cloud-sdk/issues)
- [Changelog](https://github.com/2DAICommunity/2dai-cloud-sdk/blob/main/CHANGELOG.md)

---

**Version:** 1.14.0 | [View on npm](https://www.npmjs.com/package/2dai-cloud-sdk)
