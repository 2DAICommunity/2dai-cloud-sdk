# 2dai-cloud-sdk

Official TypeScript/JavaScript SDK for 2DAI.io Cloud AI Generation API

Generate images, videos, and text using state-of-the-art AI models through a simple and intuitive API.

[![npm version](https://img.shields.io/npm/v/2dai-cloud-sdk.svg)](https://www.npmjs.com/package/2dai-cloud-sdk)
[![npm downloads](https://img.shields.io/npm/dm/2dai-cloud-sdk.svg)](https://www.npmjs.com/package/2dai-cloud-sdk)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> 🤖 **New** AI agents can now discover and use this SDK automatically via [`skill.md`](./skill.md). See [AI Agent Integration](../../wiki/AI-Agent-Integration).

---

## Features

- **Text-to-Image** - Generate stunning images from text prompts
- **Image-to-Image** - Edit and transform existing images
- **Dual-Image Editing** - Face restoration, character consistency, and image merging with two source images
- **AI Image Upscale** - Upscale images 2-4x using AI
- **Image-to-Video** - Create videos from static images
- **LLM Text Generation** - Generate text with context, memory, and JSON support
- **LLM Streaming** - Real-time token-by-token streaming with SSE and WebSocket
- **Image Vision** - Analyze images with LLM for structured data extraction
- **STT Speech-to-Text** - Audio transcription with streaming and multi-language support
- **TTS Text-to-Speech** - Voice synthesis with voice models, cloning, realtime mode, and streaming
- **14 Style Presets** - Realistic, anime, manga, watercolor, cinematic, and more
- **7 Format Presets** - Portrait, landscape, profile, story, post, smartphone, banner
- **Built-in Watermarking** - Apply custom watermarks to generated content
- **WebSocket Support** - Real-time generation with progress updates
- **CDN Operations** - Format conversion, resizing, frame extraction
- **Full TypeScript Support** - Comprehensive type definitions

🤖 **For AI Agents and Tools:**

- **OpenAI-Compatible API** - Drop-in `/v1/chat/completions` endpoint
- **AI Agent Integration** - Enable any AI agent (Claude, GPT, etc.) to discover and use the SDK via `skill.md`

---

## Installation

```bash
npm install 2dai-cloud-sdk
```

---

## Quick Start

```typescript
import { createClient, STYLES, FORMATS } from '2dai-cloud-sdk';

// Initialize client
const client = createClient('2dai_pk_your_api_key_here');

// Generate an image
const image = await client.generateImage({
  prompt: 'a futuristic city at sunset with flying cars',
  style: STYLES.cine.id,
  format: FORMATS.landscape.id
});
console.log('Image ID:', image.imageId);

// Generate text
const text = await client.generateText({
  prompt: 'Explain quantum computing in simple terms',
  system: 'You are a helpful science teacher'
});
console.log(text.response);

// Stream text in real-time
const controller = client.generateTextStream({
  prompt: 'Write a short story about AI',
  onChunk: (chunk) => process.stdout.write(chunk),
  onComplete: (result) => console.log(`\nTokens: ${result.totalTokens}`)
});
await controller.done;

// Dual-image editing (merge, blend, mix two images)
const result = await client.editImage('image-1-id', {
  imageId2: 'image-2-id',
  prompt: 'make an image with both subjects'
});
console.log('Merged Image ID:', result.imageId);

// Text-to-Speech
const speech = await client.generateSpeech({
  text: 'Hello, how can I help you today?',
  voice: TTS_VOICES.PAUL
});
console.log(`Duration: ${speech.duration}s`);

// Text-to-Speech with realtime mode (low-latency)
const realtimeSpeech = await client.generateSpeech({
  text: 'Fast response with realtime mode.',
  voice: TTS_VOICES.ALICE,
  realtime: true
});

// Speech-to-Text
const transcript = await client.transcribeAudio({
  audio: audioBase64,
  language: 'en'
});
console.log(transcript.text);
```

---

## Documentation

Full documentation is available in the **[Wiki](../../wiki)**.

| Guide | Description |
|-------|-------------|
| [Getting Started](../../wiki/Getting-Started) | Installation, API key, initialization |
| [Image Generation](../../wiki/Image-Generation) | Text-to-image, editing, upscaling, styles & formats |
| [Video Generation](../../wiki/Video-Generation) | Image-to-video creation |
| [LLM & Streaming](../../wiki/LLM-Text-Generation) | Text generation, streaming, OpenAI-compatible API |
| [STT Speech-to-Text](../../wiki/STT-Speech-to-Text) | Audio transcription, streaming, multi-language |
| [TTS Text-to-Speech](../../wiki/TTS-Text-to-Speech) | Voice synthesis, cloning, realtime mode, streaming |
| [CDN Operations](../../wiki/CDN-Operations) | Downloads, watermarks, format conversion |
| [WebSocket API](../../wiki/WebSocket-API) | Real-time generation with progress updates |
| [API Reference](../../wiki/API-Reference) | Complete endpoint documentation |
| [Examples](../../wiki/Examples) | Full code examples |
| [Troubleshooting](../../wiki/Troubleshooting) | Common issues, debug mode, best practices |
| [AI Agent Integration](../../wiki/AI-Agent-Integration) | Enable AI agents to use the SDK |

---

## OpenAI Compatibility

Use with OpenAI client libraries:

```typescript
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: '2dai_pk_your_api_key_here',
  baseURL: 'https://api.2dai.io/v1'
});

const completion = await client.chat.completions.create({
  model: 'default',
  messages: [{ role: 'user', content: 'Hello!' }],
  stream: true
});

for await (const chunk of completion) {
  process.stdout.write(chunk.choices[0]?.delta?.content || '');
}
```

---

## Available Styles

| Style | Description |
|-------|-------------|
| `raw` | Unprocessed, natural look |
| `realistic` | Photo-realistic |
| `cine` | Cinematic, film-like |
| `portrait` | Optimized for portraits |
| `anime` | Japanese anime style |
| `manga` | Japanese manga style |
| `watercolor` | Watercolor painting |
| `paint` | Oil/acrylic painting |
| `comicbook` | Western comic style |

See [Image Generation](../../wiki/Image-Generation#styles-reference) for all 14 styles.

---

## Testing

The SDK includes comprehensive test suites covering REST, WebSocket, and OpenAI-compatible endpoints.

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:rest      # REST API tests (25 tests)
npm run test:ws        # WebSocket tests (38 tests)
npm run test:openai    # OpenAI-compatible tests (15 tests)
npm run test:stt       # STT speech-to-text tests
npm run test:tts       # TTS text-to-speech tests
```

See [tests/README.md](./tests/README.md) for detailed test documentation.

---

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for version history and release notes.

---

## License

MIT License - see [LICENSE](./LICENSE) for details.

---

## Support

- **Documentation**: [Wiki](../../wiki)
- **Issues**: [GitHub Issues](https://github.com/2DAICommunity/2dai-cloud-sdk/issues)
- **Email**: [support@2dai.io](mailto:support@2dai.io)
