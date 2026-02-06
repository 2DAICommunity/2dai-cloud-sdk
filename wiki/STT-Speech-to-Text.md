# STT Speech-to-Text

Audio transcription with streaming and multi-language support.

## Table of Contents

- [Overview](#overview)
- [REST API](#rest-api)
- [SSE Streaming](#sse-streaming)
- [WebSocket API](#websocket-api)
- [WebSocket Streaming](#websocket-streaming)
- [Supported Formats](#supported-formats)
- [Languages](#languages)
- [Error Handling](#error-handling)

---

## Overview

The STT API converts audio to text with:
- Single-response transcription (REST and WebSocket)
- Real-time streaming transcription (SSE and WebSocket)
- Multi-language support with auto-detection
- Support for 7 audio formats up to 5MB

---

## REST API

### Basic Transcription

```typescript
import { createClient } from '2dai-cloud-sdk';

const client = createClient('2dai_pk_your_api_key');

// Transcribe audio
const result = await client.transcribeAudio({
  audio: audioBase64,       // Base64 encoded audio
  audioFormat: 'wav',       // Audio format
  language: 'en'            // Optional: auto-detected if omitted
});

console.log(result.text);       // "Hello, this is a test."
console.log(result.language);   // "en"
```

### TranscribeOptions

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `audio` | `string` | Yes | Base64 encoded audio data |
| `audioFormat` | `string` | Yes | Audio format (see [Supported Formats](#supported-formats)) |
| `language` | `string` | No | Language code (auto-detected if omitted) |
| `prompt` | `string` | No | Context hint to improve accuracy |

### TranscribeResult

```typescript
interface TranscribeResult {
  success: boolean;
  text: string;       // Transcribed text
  language: string;   // Detected or provided language
}
```

---

## SSE Streaming

Stream transcription results in real-time for lower latency.

```typescript
const audioChunks: string[] = [];

const controller = client.transcribeAudioStream({
  audio: audioBase64,
  audioFormat: 'wav',
  onChunk: (text, language) => {
    audioChunks.push(text);
    console.log(`Chunk: ${text} (${language})`);
  }
});

const result = await controller.done;

console.log('Full text:', result.text);
console.log('Language:', result.language);
```

### Abort Streaming

```typescript
const controller = client.transcribeAudioStream({
  audio: audioBase64,
  audioFormat: 'wav',
  onChunk: (text) => {
    console.log(text);
    // Abort after first chunk
    controller.abort();
  }
});
```

### SSE Event Format

```
data: {"chunk":"Hello, this is","language":"en"}

data: {"chunk":" a test of the speech","language":"en"}

data: {"done":true,"text":"Hello, this is a test of the speech to text system.","language":"en"}
data: [DONE]
```

---

## WebSocket API

### Basic Transcription

```typescript
await client.wsConnect();

const result = await client.wsTranscribeAudio({
  audio: audioBase64,
  audioFormat: 'wav',
  language: 'en'
});

console.log(result.result.text);
console.log(result.result.language);
```

### WsSttRequest

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `audio` | `string` | Yes | Base64 encoded audio data |
| `audioFormat` | `string` | Yes | Audio format |
| `language` | `string` | No | Language code |
| `prompt` | `string` | No | Context hint |

### Raw WebSocket Protocol

**Request:**
```json
{
  "type": "generate_stt",
  "requestId": "req_123",
  "data": {
    "audio": "<base64 encoded audio>",
    "audioFormat": "wav",
    "language": "en"
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
      "text": "Hello, this is a test.",
      "language": "en"
    }
  }
}
```

---

## WebSocket Streaming

Stream transcription results via WebSocket for the lowest latency.

```typescript
await client.wsConnect();

await new Promise<void>((resolve, reject) => {
  client.wsTranscribeAudioStream(
    {
      audio: audioBase64,
      audioFormat: 'wav',
      language: 'en'
    },
    {
      onChunk: (text, language) => {
        console.log(`Chunk: ${text}`);
      },
      onComplete: (response) => {
        console.log('Full text:', response.result.text);
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

**Server → Client: STT Chunk**
```json
{
  "type": "stt_chunk",
  "requestId": "req_123",
  "data": {
    "chunk": "Hello, this is",
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
      "text": "Hello, this is a test of the speech to text system.",
      "language": "en"
    }
  }
}
```

---

## Supported Formats

| Format | Extension | Description |
|--------|-----------|-------------|
| WAV | `.wav` | Uncompressed PCM audio |
| MP3 | `.mp3` | MPEG Layer 3 compressed |
| AAC | `.aac` | Advanced Audio Coding |
| WebM | `.webm` | WebM audio container |
| OGG | `.ogg` | Ogg Vorbis audio |
| M4A | `.m4a` | MPEG-4 audio |
| FLAC | `.flac` | Free Lossless Audio Codec |

> **Note:** Maximum audio file size is **5MB** (calculated from base64 encoding).

---

## Languages

The STT engine supports multi-language transcription with auto-detection.

If `language` is not specified, the engine will auto-detect the spoken language.

---

## Error Handling

### Validation Errors (400)

```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Audio data is required (base64 encoded)"
  }
}
```

Common validation errors:
- `"Audio data is required (base64 encoded)"` - Missing `audio` field
- `"Audio format is required"` - Missing `audioFormat` field
- `"Unsupported audio format: xyz. Supported: wav, mp3, aac, webm, ogg, m4a, flac"` - Invalid format
- `"Audio size exceeds maximum of 5MB"` - File too large

### Rate Limit Errors (429)

```json
{
  "success": false,
  "error": {
    "code": "CONCURRENT_LIMIT_EXCEEDED",
    "message": "Maximum concurrent STT operations exceeded. Please wait for existing operations to complete.",
    "retryAfter": 30
  }
}
```

---

## Rate Limits

Default STT rate limits:

| Limit | Default |
|-------|---------|
| Requests per 15 min | 15 |
| Requests per day | 100 |

---

## Next Steps

- [TTS Text-to-Speech](TTS-Text-to-Speech) - Voice synthesis
- [API Reference](API-Reference) - Complete endpoint documentation
- [WebSocket API](WebSocket-API) - Real-time generation

---

← [LLM & Streaming](LLM-Text-Generation) | [TTS Text-to-Speech](TTS-Text-to-Speech) →
