# TTS Text-to-Speech

Voice synthesis with voice models, cloning, realtime mode, and streaming.

## Table of Contents

- [Overview](#overview)
- [REST API](#rest-api)
- [Voice Models](#voice-models)
- [Voice Cloning](#voice-cloning)
- [Realtime Mode](#realtime-mode)
- [SSE Streaming](#sse-streaming)
- [WebSocket API](#websocket-api)
- [WebSocket Streaming](#websocket-streaming)
- [Output Formats](#output-formats)
- [Languages](#languages)
- [Error Handling](#error-handling)

---

## Overview

The TTS API converts text to speech with:
- Two built-in voice models (Paul and Alice)
- Voice cloning from reference audio
- Realtime mode for low-latency generation
- Speed control (0.25x - 4.0x)
- 6 output audio formats
- 10 supported languages
- Real-time streaming via SSE and WebSocket

---

## REST API

### Basic Speech Generation

```typescript
import { createClient, TTS_VOICES } from '2dai-cloud-sdk';

const client = createClient('2dai_pk_your_api_key');

// Generate speech
const result = await client.generateSpeech({
  text: 'Hello, welcome to 2DAI!',
  voice: TTS_VOICES.PAUL
});

console.log(`Duration: ${result.duration}s`);
console.log(`Format: ${result.format}`);
console.log(`Characters: ${result.characterCount}`);

// Save audio
if (result.audio) {
  const audioBuffer = Buffer.from(result.audio, 'base64');
  fs.writeFileSync('output.wav', audioBuffer);
}
```

### TTSOptions

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `text` | `string` | Yes | Text to synthesize (max 500 characters) |
| `voice` | `string` | Conditional | Voice model: `paul`, `alice`. Required if no `referenceAudio` |
| `referenceAudio` | `string` | No | Base64 encoded reference audio for voice cloning (3+ seconds) |
| `referenceTranscript` | `string` | Conditional | Exact transcript of reference audio. Required with `referenceAudio` |
| `language` | `string` | No | Language (default: `auto`). See [Languages](#languages) |
| `speed` | `number` | No | Speed multiplier: 0.25 - 4.0 (default: 1.0) |
| `outputFormat` | `string` | No | Output format (default: `wav`). See [Output Formats](#output-formats) |
| `sampleRate` | `number` | No | Output sample rate in Hz |
| `realtime` | `boolean` | No | Enable realtime mode for low-latency. Not compatible with voice cloning |

### TTSResult

```typescript
interface TTSResult {
  success: boolean;
  audio?: string;          // Base64 encoded audio
  cdnFileId?: string;      // CDN file ID (if audio exceeds threshold)
  format?: string;         // Output format
  duration?: number;       // Duration in seconds
  sampleRate?: number;     // Sample rate in Hz
  characterCount?: number; // Characters processed
  language?: string;       // Language used
}
```

### Custom Options Example

```typescript
const result = await client.generateSpeech({
  text: 'Bonjour, ceci est un test.',
  voice: TTS_VOICES.ALICE,
  language: 'fr',
  speed: 0.8,
  outputFormat: 'mp3'
});
```

---

## Voice Models

Two built-in voice models are available:

| Voice | Constant | Description |
|-------|----------|-------------|
| Paul | `TTS_VOICES.PAUL` | Male voice |
| Alice | `TTS_VOICES.ALICE` | Female voice |

```typescript
import { TTS_VOICES } from '2dai-cloud-sdk';

// Use Paul voice
const result = await client.generateSpeech({
  text: 'Hello!',
  voice: TTS_VOICES.PAUL
});

// Use Alice voice
const result = await client.generateSpeech({
  text: 'Hello!',
  voice: TTS_VOICES.ALICE
});
```

---

## Voice Cloning

Clone any voice using a reference audio sample (3+ seconds).

```typescript
import * as fs from 'fs';

// Load reference audio
const referenceAudio = fs.readFileSync('reference.wav').toString('base64');

const result = await client.generateSpeech({
  text: 'This speech should mimic the reference voice.',
  referenceAudio,
  referenceTranscript: 'The exact words spoken in the reference audio'
});
```

### Voice Cloning Requirements

- Reference audio must be at least 3 seconds long
- `referenceTranscript` is required - it must exactly match what is spoken in the reference audio
- Cannot combine with `realtime: true`
- Supported audio formats: wav, mp3, aac, webm, ogg, m4a, flac

---

## Realtime Mode

Realtime mode provides significantly lower latency generation. Use it when response speed is more important than voice cloning capability.

```typescript
const result = await client.generateSpeech({
  text: 'Fast response with realtime mode.',
  voice: TTS_VOICES.PAUL,
  realtime: true
});
```

### Realtime with Custom Speed

```typescript
const result = await client.generateSpeech({
  text: 'Fast speech at 1.5x speed.',
  voice: TTS_VOICES.ALICE,
  realtime: true,
  speed: 1.5
});
```

### Realtime Limitations

- **Not compatible with voice cloning** (`referenceAudio` cannot be used with `realtime: true`)
- Use voice models (`paul`, `alice`) only

---

## SSE Streaming

Stream audio chunks in real-time for low-latency playback.

```typescript
const audioChunks: string[] = [];

const controller = client.generateSpeechStream({
  text: 'Hello world. This is a streaming test.',
  voice: TTS_VOICES.PAUL,
  onChunk: (audio, text, language) => {
    audioChunks.push(audio);
    console.log(`Chunk: ${text} (${(audio.length * 3 / 4 / 1024).toFixed(1)} KB)`);
  }
});

const result = await controller.done;

console.log(`Total chunks: ${audioChunks.length}`);
console.log(`Duration: ${result.duration}s`);
console.log(`Format: ${result.format}`);
```

### Abort Streaming

```typescript
const controller = client.generateSpeechStream({
  text: 'Long text that will produce many chunks...',
  voice: TTS_VOICES.ALICE,
  onChunk: (audio) => {
    // Abort after receiving some audio
    controller.abort();
  }
});
```

### SSE Event Format

```
data: {"audio":"<base64 audio chunk>","text":"Hello world.","language":"en"}

data: {"audio":"<base64 audio chunk>","text":" This is a streaming test.","language":"en"}

data: {"done":true,"format":"wav","duration":2.5,"sampleRate":24000,"characterCount":38,"language":"en"}
data: [DONE]
```

---

## WebSocket API

### Basic Generation

```typescript
await client.wsConnect();

const result = await client.wsGenerateSpeech({
  text: 'Hello from WebSocket TTS.',
  voice: TTS_VOICES.PAUL
});

console.log(`Duration: ${result.result.duration}s`);
console.log(`Format: ${result.result.format}`);

if (result.result.audio) {
  const audioBuffer = Buffer.from(result.result.audio, 'base64');
  fs.writeFileSync('ws-output.wav', audioBuffer);
}
```

### WsTtsRequest

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `text` | `string` | Yes | Text to synthesize (max 500 characters) |
| `voice` | `string` | Conditional | Voice model: `paul`, `alice` |
| `referenceAudio` | `string` | No | Base64 reference audio for cloning |
| `referenceTranscript` | `string` | Conditional | Transcript of reference audio |
| `language` | `string` | No | Language code |
| `speed` | `number` | No | Speed 0.25 - 4.0 |
| `outputFormat` | `string` | No | Output format |
| `sampleRate` | `number` | No | Sample rate in Hz |
| `realtime` | `boolean` | No | Enable realtime mode |

### Raw WebSocket Protocol

**Request:**
```json
{
  "type": "generate_tts",
  "requestId": "req_123",
  "data": {
    "text": "Hello from WebSocket TTS.",
    "voice": "paul",
    "realtime": true
  }
}
```

**Response:**
```json
{
  "type": "generation_complete",
  "requestId": "req_123",
  "data": {
    "result": {
      "audio": "<base64 encoded audio>",
      "format": "wav",
      "duration": 1.85,
      "sampleRate": 24000,
      "characterCount": 25,
      "language": "en"
    }
  }
}
```

---

## WebSocket Streaming

Stream audio chunks via WebSocket for lowest-latency playback.

```typescript
await client.wsConnect();

const audioChunks: string[] = [];

await new Promise<void>((resolve, reject) => {
  client.wsGenerateSpeechStream(
    {
      text: 'This is a WebSocket streaming test for TTS.',
      voice: TTS_VOICES.ALICE
    },
    {
      onChunk: (audio, text, language) => {
        audioChunks.push(audio);
        console.log(`WS Chunk: ${text}`);
      },
      onComplete: (response) => {
        console.log(`Duration: ${response.result.duration}s`);
        console.log(`Chunks: ${audioChunks.length}`);
        resolve();
      },
      onError: (err) => {
        reject(err);
      }
    }
  );
});
```

### Stream Messages

**Server → Client: TTS Chunk**
```json
{
  "type": "tts_chunk",
  "requestId": "req_123",
  "data": {
    "audio": "<base64 audio chunk>",
    "text": "This is a WebSocket",
    "language": "en"
  }
}
```

**Server → Client: Completion**
```json
{
  "type": "generation_complete",
  "requestId": "req_123",
  "data": {
    "result": {
      "audio": "<base64 combined audio>",
      "format": "wav",
      "duration": 2.5,
      "sampleRate": 24000,
      "characterCount": 44,
      "language": "en"
    }
  }
}
```

### Cancellation

```typescript
const controller = client.wsGenerateSpeechStream(
  { text: 'Long text...', voice: TTS_VOICES.PAUL },
  {
    onChunk: (audio) => {
      controller.abort(); // Cancel after first chunk
    },
    onComplete: () => {},
    onError: () => {}
  }
);
```

---

## Output Formats

| Format | Extension | Description |
|--------|-----------|-------------|
| WAV | `wav` | Uncompressed PCM (default) |
| MP3 | `mp3` | MPEG Layer 3 (192kbps) |
| Opus | `opus` | Opus codec (128kbps) |
| AAC | `aac` | Advanced Audio Coding (192kbps) |
| FLAC | `flac` | Free Lossless Audio Codec |
| PCM | `pcm` | Raw PCM 16-bit samples |

```typescript
// Generate MP3
const result = await client.generateSpeech({
  text: 'Hello!',
  voice: TTS_VOICES.PAUL,
  outputFormat: 'mp3'
});
```

---

## Languages

10 languages supported with auto-detection:

| Code | Language |
|------|----------|
| `auto` | Auto-detect (default) |
| `en` | English |
| `zh` | Chinese |
| `ja` | Japanese |
| `ko` | Korean |
| `de` | German |
| `fr` | French |
| `es` | Spanish |
| `ru` | Russian |
| `pt` | Portuguese |
| `it` | Italian |

```typescript
// French speech
const result = await client.generateSpeech({
  text: 'Bonjour le monde!',
  voice: TTS_VOICES.PAUL,
  language: 'fr'
});
```

---

## Error Handling

### Validation Errors (400)

```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Text is required and cannot be empty"
  }
}
```

Common validation errors:
- `"Text is required and cannot be empty"` - Missing text
- `"Text exceeds maximum length of 500 characters"` - Text too long
- `"Either voice model name or referenceAudio (with referenceTranscript) is required"` - No voice specified
- `"referenceTranscript is required when using referenceAudio for voice cloning"` - Missing transcript
- `"Speed must be between 0.25 and 4.0"` - Invalid speed
- `"Unsupported output format"` - Invalid format
- `"Unsupported language"` - Invalid language

### Rate Limit Errors (429)

```json
{
  "success": false,
  "error": {
    "code": "CONCURRENT_LIMIT_EXCEEDED",
    "message": "Maximum concurrent TTS operations exceeded. Please wait for existing operations to complete.",
    "retryAfter": 30
  }
}
```

---

## Rate Limits

Default TTS rate limits:

| Limit | Default |
|-------|---------|
| Requests per 15 min | 10 |
| Requests per day | 60 |

---

## Next Steps

- [STT Speech-to-Text](STT-Speech-to-Text) - Audio transcription
- [API Reference](API-Reference) - Complete endpoint documentation
- [WebSocket API](WebSocket-API) - Real-time generation

---

← [STT Speech-to-Text](STT-Speech-to-Text) | [CDN Operations](CDN-Operations) →
