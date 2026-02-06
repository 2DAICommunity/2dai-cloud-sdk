---
name: 2DAI STT Speech-to-Text
capability: stt_transcription
version: 1.12.0
api_base_url: https://apiv2.2dai.io:800
---

# STT Speech-to-Text Skills

Transcribe audio to text with streaming and multi-language support.

## Capabilities

| Mode | Description | Endpoint |
|------|-------------|----------|
| Transcribe | Single-response audio transcription | `POST /api/v1/stt/transcribe` |
| Stream | Real-time streaming transcription (SSE) | `POST /api/v1/stt/transcribe/stream` |

---

## Audio Transcription

Transcribe an audio file to text in a single response.

### Endpoint
```
POST https://apiv2.2dai.io:800/api/v1/stt/transcribe
```

### Request
```bash
# Encode audio file to base64
AUDIO_B64=$(base64 -i audio.wav)

curl -X POST "https://apiv2.2dai.io:800/api/v1/stt/transcribe" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"audio\": \"$AUDIO_B64\",
    \"audioFormat\": \"wav\",
    \"language\": \"en\"
  }"
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `audio` | string | Yes | Base64 encoded audio data |
| `audioFormat` | string | Yes | Audio format: `wav`, `mp3`, `aac`, `webm`, `ogg`, `m4a`, `flac` |
| `language` | string | No | Language code (auto-detected if omitted) |
| `prompt` | string | No | Context hint to improve transcription accuracy |

### Response
```json
{
  "success": true,
  "data": {
    "text": "Hello, this is a test of the speech to text system.",
    "language": "en"
  }
}
```

### Typical Response Time
2-8 seconds (varies with audio length)

---

## Streaming Transcription (SSE)

Receive transcription chunks in real-time using Server-Sent Events.

### Endpoint
```
POST https://apiv2.2dai.io:800/api/v1/stt/transcribe/stream
```

### Request
```bash
AUDIO_B64=$(base64 -i audio.wav)

curl -X POST "https://apiv2.2dai.io:800/api/v1/stt/transcribe/stream" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"audio\": \"$AUDIO_B64\",
    \"audioFormat\": \"wav\"
  }"
```

### SSE Response Stream
```
data: {"chunk":"Hello, this is","language":"en"}

data: {"chunk":" a test of the speech","language":"en"}

data: {"done":true,"text":"Hello, this is a test of the speech to text system.","language":"en"}
data: [DONE]
```

### Typical First Chunk
~1-2 seconds

---

## Supported Audio Formats

| Format | Extension | Description |
|--------|-----------|-------------|
| WAV | `.wav` | Uncompressed PCM audio |
| MP3 | `.mp3` | MPEG Layer 3 compressed |
| AAC | `.aac` | Advanced Audio Coding |
| WebM | `.webm` | WebM audio container |
| OGG | `.ogg` | Ogg Vorbis audio |
| M4A | `.m4a` | MPEG-4 audio |
| FLAC | `.flac` | Free Lossless Audio Codec |

> **Maximum file size:** 5MB (calculated from base64 encoding)

---

## Languages

The STT engine supports multi-language transcription with automatic language detection.

If `language` is not specified, the engine will auto-detect the spoken language.

---

## WebSocket Alternative

For real-time transcription via WebSocket:

```json
// Connect to: wss://apiv2.2dai.io:800/ws/generation

// Authenticate
{ "type": "auth", "data": { "apiKey": "2dai_pk_..." } }

// Transcribe audio
{
  "type": "generate_stt",
  "requestId": "stt_123",
  "data": {
    "audio": "<base64 encoded audio>",
    "audioFormat": "wav",
    "language": "en"
  }
}

// Response
{
  "type": "generation_complete",
  "requestId": "stt_123",
  "data": {
    "result": {
      "text": "Hello, this is a test.",
      "language": "en"
    }
  }
}
```

### WebSocket Streaming

Request with `stream: true` for chunk-by-chunk transcription:

```json
// Request
{
  "type": "generate_stt",
  "requestId": "stt_456",
  "data": {
    "audio": "<base64 encoded audio>",
    "audioFormat": "wav",
    "stream": true
  }
}

// Streaming chunks
{ "type": "stt_chunk", "requestId": "stt_456", "data": { "chunk": "Hello, this is", "language": "en" } }
{ "type": "stt_chunk", "requestId": "stt_456", "data": { "chunk": " a test.", "language": "en" } }

// Completion
{
  "type": "generation_complete",
  "requestId": "stt_456",
  "data": {
    "result": {
      "text": "Hello, this is a test.",
      "language": "en"
    }
  }
}
```

---

## Agent Decision Guide

| User Request | Use This | Key Parameters |
|--------------|----------|----------------|
| "Transcribe this audio" | Transcribe | `audio`, `audioFormat` |
| "What does this recording say?" | Transcribe | `audio`, `audioFormat` |
| "Convert speech to text" | Transcribe | `audio`, `audioFormat` |
| "Real-time transcription" | Streaming | `audio`, `audioFormat` |
| "Transcribe in French" | Transcribe | `audio`, `audioFormat`, `language: "fr"` |
| "What language is spoken?" | Transcribe (auto-detect) | `audio`, `audioFormat` (omit language) |

---

## Error Handling

| Error | Cause | Fix |
|-------|-------|-----|
| `"Audio data is required (base64 encoded)"` | Missing `audio` | Provide base64 audio |
| `"Audio format is required"` | Missing `audioFormat` | Specify format |
| `"Unsupported audio format"` | Invalid format | Use wav, mp3, aac, webm, ogg, m4a, or flac |
| `"Audio size exceeds maximum of 5MB"` | File too large | Compress or trim audio |
| `CONCURRENT_LIMIT_EXCEEDED` | Rate limited | Wait for existing operations to complete |

---

## Rate Limits

| Per 15 Minutes | Per Day |
|----------------|---------|
| 15 requests | 100 requests |

Check current limits:
```bash
curl -H "Authorization: Bearer $API_KEY" \
  "https://apiv2.2dai.io:800/api/v1/settings/rate-limits"
```

---

## Best Practices

### DO:
- Specify `language` when known for better accuracy
- Use `prompt` for domain-specific vocabulary hints
- Use streaming for real-time feedback on longer audio
- Check audio size before sending (max 5MB)
- Use WAV format for best quality transcription

### DO NOT:
- Send audio larger than 5MB
- Forget to specify `audioFormat`
- Send empty or corrupt audio data
- Ignore rate limits - check before batch operations

---

[Back to Main Skill](../skill.md) | [TTS Speech](./tts-speech.md) | [LLM Text](./llm-text.md)
