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

## Features

- **Text-to-Image** - Generate images from text prompts with 14 style presets
- **Image-to-Image** - Edit and transform existing images
- **AI Image Upscale** - Upscale images 2-4x using AI
- **Image-to-Video** - Create videos from static images
- **LLM Text Generation** - Generate text with memory, JSON support, and streaming
- **OpenAI-Compatible API** - Drop-in `/v1/chat/completions` endpoint
- **Image Description (Vision)** - Analyze images with LLM
- **STT Speech-to-Text** - Audio transcription with streaming and multi-language support
- **TTS Text-to-Speech** - Voice synthesis with voice models, cloning, realtime mode, and streaming
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

**Version:** 1.12.0 | [View on npm](https://www.npmjs.com/package/2dai-cloud-sdk)
