---
name: 2DAI TTS Text-to-Speech
capability: tts_speech
version: 1.12.0
api_base_url: https://apiv2.2dai.io:800
---

# TTS Text-to-Speech Skills

Synthesize speech from text with voice models, voice cloning, realtime mode, and streaming.

## Capabilities

| Mode | Description | Endpoint |
|------|-------------|----------|
| Generate | Single-response speech synthesis | `POST /api/v1/tts/generate` |
| Realtime | Low-latency speech generation | `POST /api/v1/tts/generate` with `realtime: true` |
| Stream | Real-time audio chunk streaming (SSE) | `POST /api/v1/tts/generate/stream` |
| Clone | Voice cloning from reference audio | `POST /api/v1/tts/generate` with `referenceAudio` |

---

## Speech Generation

Generate speech audio from text in a single response.

### Endpoint
```
POST https://apiv2.2dai.io:800/api/v1/tts/generate
```

### Request
```bash
curl -X POST "https://apiv2.2dai.io:800/api/v1/tts/generate" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello, welcome to 2DAI!",
    "voice": "paul"
  }'
```

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `text` | string | Yes | - | Text to synthesize (max 500 characters) |
| `voice` | string | Conditional | - | Voice model: `paul` (male) or `alice` (female). Required if no `referenceAudio` |
| `referenceAudio` | string | No | - | Base64 encoded reference audio for voice cloning (3+ seconds) |
| `referenceTranscript` | string | Conditional | - | Exact transcript of reference audio. Required with `referenceAudio` |
| `language` | string | No | `auto` | Language code (see [Languages](#languages)) |
| `speed` | number | No | 1.0 | Speed multiplier: 0.25 - 4.0 |
| `outputFormat` | string | No | `wav` | Output format (see [Output Formats](#output-formats)) |
| `sampleRate` | number | No | - | Output sample rate in Hz |
| `realtime` | boolean | No | false | Enable realtime mode for low-latency. Not compatible with voice cloning |

### Response
```json
{
  "success": true,
  "data": {
    "audio": "<base64 encoded audio>",
    "format": "wav",
    "duration": 1.85,
    "sampleRate": 24000,
    "characterCount": 23,
    "language": "en"
  }
}
```

> **Note:** If the audio exceeds a size threshold, `cdnFileId` is returned instead of inline `audio`. Use the CDN endpoint to download.

### Typical Response Time
3-10 seconds (standard mode), 1-3 seconds (realtime mode)

---

## Voice Models

Two built-in voice models are available:

| Voice | Value | Description |
|-------|-------|-------------|
| Paul | `paul` | Male voice |
| Alice | `alice` | Female voice |

### Example
```bash
# Male voice
curl -X POST "https://apiv2.2dai.io:800/api/v1/tts/generate" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello!", "voice": "paul"}'

# Female voice
curl -X POST "https://apiv2.2dai.io:800/api/v1/tts/generate" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello!", "voice": "alice"}'
```

---

## Realtime Mode

Realtime mode provides significantly lower latency generation. Use it when response speed is more important than voice cloning capability.

### Request
```bash
curl -X POST "https://apiv2.2dai.io:800/api/v1/tts/generate" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Fast response with realtime mode.",
    "voice": "paul",
    "realtime": true
  }'
```

### Realtime with Custom Speed
```bash
curl -X POST "https://apiv2.2dai.io:800/api/v1/tts/generate" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Fast speech at 1.5x speed.",
    "voice": "alice",
    "realtime": true,
    "speed": 1.5
  }'
```

### Realtime Limitations
- **Not compatible with voice cloning** (`referenceAudio` cannot be used with `realtime: true`)
- Use voice models (`paul`, `alice`) only

---

## Voice Cloning

Clone any voice using a reference audio sample (3+ seconds).

### Request
```bash
# Encode reference audio to base64
REF_AUDIO=$(base64 -i reference.wav)

curl -X POST "https://apiv2.2dai.io:800/api/v1/tts/generate" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"text\": \"This speech should mimic the reference voice.\",
    \"referenceAudio\": \"$REF_AUDIO\",
    \"referenceTranscript\": \"The exact words spoken in the reference audio\"
  }"
```

### Voice Cloning Requirements
- Reference audio must be at least 3 seconds long
- `referenceTranscript` is required - must exactly match what is spoken
- Cannot combine with `realtime: true`
- Supported formats: wav, mp3, aac, webm, ogg, m4a, flac

---

## Streaming (SSE)

Stream audio chunks in real-time for low-latency playback.

### Endpoint
```
POST https://apiv2.2dai.io:800/api/v1/tts/generate/stream
```

### Request
```bash
curl -X POST "https://apiv2.2dai.io:800/api/v1/tts/generate/stream" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello world. This is a streaming test.",
    "voice": "paul"
  }'
```

### SSE Response Stream
```
data: {"audio":"<base64 audio chunk>","text":"Hello world.","language":"en"}

data: {"audio":"<base64 audio chunk>","text":" This is a streaming test.","language":"en"}

data: {"done":true,"format":"wav","duration":2.5,"sampleRate":24000,"characterCount":38,"language":"en"}
data: [DONE]
```

### Typical First Chunk
~1-2 seconds

---

## Output Formats

| Format | Value | Description |
|--------|-------|-------------|
| WAV | `wav` | Uncompressed PCM (default) |
| MP3 | `mp3` | MPEG Layer 3 (192kbps) |
| Opus | `opus` | Opus codec (128kbps) |
| AAC | `aac` | Advanced Audio Coding (192kbps) |
| FLAC | `flac` | Free Lossless Audio Codec |
| PCM | `pcm` | Raw PCM 16-bit samples |

### Example
```bash
curl -X POST "https://apiv2.2dai.io:800/api/v1/tts/generate" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello!", "voice": "paul", "outputFormat": "mp3"}'
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

### Example
```bash
curl -X POST "https://apiv2.2dai.io:800/api/v1/tts/generate" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text": "Bonjour le monde!", "voice": "paul", "language": "fr"}'
```

---

## WebSocket Alternative

For real-time speech generation via WebSocket:

```json
// Connect to: wss://apiv2.2dai.io:800/ws/generation

// Authenticate
{ "type": "auth", "data": { "apiKey": "2dai_pk_..." } }

// Generate speech
{
  "type": "generate_tts",
  "requestId": "tts_123",
  "data": {
    "text": "Hello from WebSocket TTS.",
    "voice": "paul",
    "realtime": true
  }
}

// Response
{
  "type": "generation_complete",
  "requestId": "tts_123",
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

### WebSocket Streaming

Request with `stream: true` for chunk-by-chunk audio delivery:

```json
// Request
{
  "type": "generate_tts",
  "requestId": "tts_456",
  "data": {
    "text": "This is a WebSocket streaming test for TTS.",
    "voice": "alice",
    "stream": true
  }
}

// Streaming chunks
{
  "type": "tts_chunk",
  "requestId": "tts_456",
  "data": { "audio": "<base64 audio chunk>", "text": "This is a WebSocket", "language": "en" }
}
{
  "type": "tts_chunk",
  "requestId": "tts_456",
  "data": { "audio": "<base64 audio chunk>", "text": " streaming test for TTS.", "language": "en" }
}

// Completion
{
  "type": "generation_complete",
  "requestId": "tts_456",
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

---

## Agent Decision Guide

| User Request | Use This | Key Parameters |
|--------------|----------|----------------|
| "Read this text aloud" | Generate | `text`, `voice` |
| "Convert text to speech" | Generate | `text`, `voice` |
| "Say this in French" | Generate | `text`, `voice`, `language: "fr"` |
| "Fast speech response" | Realtime | `text`, `voice`, `realtime: true` |
| "Speak faster/slower" | Speed control | `text`, `voice`, `speed` |
| "Use a female voice" | Alice | `text`, `voice: "alice"` |
| "Use a male voice" | Paul | `text`, `voice: "paul"` |
| "Sound like this person" | Voice cloning | `text`, `referenceAudio`, `referenceTranscript` |
| "Stream audio in real-time" | Streaming | `text`, `voice` (use stream endpoint) |
| "Get MP3 audio" | Output format | `text`, `voice`, `outputFormat: "mp3"` |

---

## Error Handling

| Error | Cause | Fix |
|-------|-------|-----|
| `"Text is required and cannot be empty"` | Missing `text` | Provide text to synthesize |
| `"Text exceeds maximum length of 500 characters"` | Text too long | Shorten to 500 chars max |
| `"Either voice model name or referenceAudio is required"` | No voice specified | Set `voice` or `referenceAudio` |
| `"referenceTranscript is required when using referenceAudio"` | Missing transcript | Provide exact transcript of reference |
| `"Speed must be between 0.25 and 4.0"` | Invalid speed | Use 0.25 - 4.0 |
| `"Unsupported output format"` | Invalid format | Use wav, mp3, opus, aac, flac, or pcm |
| `"Unsupported language"` | Invalid language | Use supported language code |
| `CONCURRENT_LIMIT_EXCEEDED` | Rate limited | Wait for existing operations to complete |

---

## Rate Limits

| Per 15 Minutes | Per Day |
|----------------|---------|
| 10 requests | 60 requests |

Check current limits:
```bash
curl -H "Authorization: Bearer $API_KEY" \
  "https://apiv2.2dai.io:800/api/v1/settings/rate-limits"
```

---

## Best Practices

### DO:
- Use `realtime: true` when low latency is needed
- Specify `language` when known for better pronunciation
- Use streaming for real-time audio playback
- Use appropriate output format for the use case (mp3 for web, wav for quality)
- Keep text under 500 characters per request
- Split long text into sentences for streaming

### DO NOT:
- Use `realtime: true` with `referenceAudio` (incompatible)
- Send text longer than 500 characters
- Forget to provide `referenceTranscript` with voice cloning
- Ignore rate limits - check before batch operations
- Use PCM format unless you need raw audio data

---

[Back to Main Skill](../skill.md) | [STT Transcription](./stt-transcription.md) | [LLM Text](./llm-text.md)
