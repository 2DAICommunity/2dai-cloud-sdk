---
name: 2DAI LLM Text Generation
capability: llm_text_generation
version: 1.10.0
api_base_url: https://apiv2.2dai.io:800
---

# LLM Text Generation Skills

Generate text using AI language models with streaming, JSON output, and vision capabilities.

## Capabilities

| Mode | Description | Endpoint |
|------|-------------|----------|
| Standard | Non-streaming text generation | `POST /api/v1/llm/generate` |
| Streaming | Real-time token-by-token (SSE) | `POST /api/v1/llm/generate/stream` |
| JSON | Structured JSON output | `POST /api/v1/llm/generate` with `jsonFormat` |
| Vision | Image analysis with LLM | `POST /api/v1/llm/generate` with `imageId` |

---

## Non-Streaming Generation

Generate complete text response in a single request.

### Endpoint
```
POST https://apiv2.2dai.io:800/api/v1/llm/generate
```

### Request
```bash
curl -X POST "https://apiv2.2dai.io:800/api/v1/llm/generate" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Explain quantum computing in simple terms",
    "system": "You are a helpful science teacher who explains complex topics simply"
  }'
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `prompt` | string | Yes | User's question or request |
| `system` | string | No | System prompt defining AI behavior |
| `memory` | string[] | No | Conversation history for context |
| `jsonFormat` | boolean | No | Enable JSON output mode |
| `jsonTemplate` | object | No | Expected JSON structure |
| `useMarkdown` | boolean | No | Enable markdown formatting |
| `useRandomSeed` | boolean | No | Use random seed for variety |
| `imageId` | string | No | CDN ID of image for vision analysis |
| `askKnowledge` | object | No | Query knowledge base (see below) |

### Response
```json
{
  "success": true,
  "data": {
    "text": "Quantum computing is like having a super-powered calculator...",
    "tokensUsed": 132,
    "promptTokens": 45,
    "completionTokens": 87
  }
}
```

### Typical Response Time
2-11 seconds (varies with complexity)

---

## Streaming Generation (SSE)

Receive text token-by-token in real-time using Server-Sent Events.

### Endpoint
```
POST https://apiv2.2dai.io:800/api/v1/llm/generate/stream
```

### Request
```bash
curl -X POST "https://apiv2.2dai.io:800/api/v1/llm/generate/stream" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Write a short poem about the moon"
  }'
```

### SSE Response Stream
```
data: {"chunk": "The ", "done": false}
data: {"chunk": "moon ", "done": false}
data: {"chunk": "hangs ", "done": false}
...
data: {"chunk": "", "done": true, "tokensUsed": 45}
```

### Typical First Token
~1 second

---

## JSON Output Mode

Get structured JSON responses.

### Request
```bash
curl -X POST "https://apiv2.2dai.io:800/api/v1/llm/generate" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Analyze this product review: Great quality, fast shipping, highly recommend!",
    "jsonFormat": true,
    "jsonTemplate": {
      "sentiment": "positive/negative/neutral",
      "score": "1-10",
      "keywords": ["array", "of", "keywords"],
      "summary": "brief summary"
    }
  }'
```

### Response
```json
{
  "success": true,
  "data": {
    "text": "{\"sentiment\": \"positive\", \"score\": 9, \"keywords\": [\"quality\", \"shipping\", \"recommend\"], \"summary\": \"Very satisfied customer with fast delivery\"}",
    "tokensUsed": 67
  }
}
```

---

## Vision / Image Analysis

Analyze images using the LLM's vision capabilities.

### Request
```bash
curl -X POST "https://apiv2.2dai.io:800/api/v1/llm/generate" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Describe what you see in this image in detail",
    "imageId": "image-cdn-id"
  }'
```

### Use Cases
- Image description and captioning
- Object detection and identification
- Scene analysis
- Text extraction (OCR)
- Content moderation
- Visual Q&A

---

## Conversation Memory

Maintain context across multiple exchanges.

### Request with Memory
```bash
curl -X POST "https://apiv2.2dai.io:800/api/v1/llm/generate" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "What was the first thing I asked about?",
    "memory": [
      "User: What is the capital of France?",
      "Assistant: The capital of France is Paris.",
      "User: How many people live there?",
      "Assistant: Paris has approximately 2.2 million people in the city proper."
    ]
  }'
```

### Memory Format
- Array of strings
- Alternate between "User:" and "Assistant:" prefixes
- Keep relevant context, trim old messages to stay within limits

---

## Knowledge Base Queries

Query integrated knowledge sources.

### Request
```bash
curl -X POST "https://apiv2.2dai.io:800/api/v1/llm/generate" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "What are the shipping policies?",
    "askKnowledge": {
      "sources": ["company-docs", "faq"],
      "query": "shipping policy return"
    }
  }'
```

---

## WebSocket Streaming

For real-time streaming via WebSocket:

```json
// Connect to: wss://apiv2.2dai.io:800/ws/generation

// Authenticate
{ "type": "auth", "data": { "apiKey": "2dai_pk_..." } }

// Generate with streaming
{
  "type": "generate_llm",
  "requestId": "llm_123",
  "data": {
    "prompt": "Tell me a story",
    "stream": true
  }
}

// Streaming chunks
{ "type": "llm_chunk", "requestId": "llm_123", "data": { "chunk": "Once " } }
{ "type": "llm_chunk", "requestId": "llm_123", "data": { "chunk": "upon " } }
{ "type": "llm_chunk", "requestId": "llm_123", "data": { "chunk": "a time..." } }

// Completion
{
  "type": "generation_complete",
  "requestId": "llm_123",
  "data": { "text": "Once upon a time...", "tokensUsed": 150 }
}
```

---

## Agent Decision Guide

| User Request | Use This | Key Parameters |
|--------------|----------|----------------|
| "Answer this question..." | Non-streaming | `prompt`, `system` |
| "Explain..." | Non-streaming | `prompt`, `system` |
| "Chat with me..." | Streaming | `prompt`, `memory` |
| "Real-time response..." | Streaming | `prompt` |
| "Give me JSON data..." | JSON mode | `jsonFormat: true`, `jsonTemplate` |
| "Parse this into..." | JSON mode | `jsonFormat: true`, `jsonTemplate` |
| "What's in this image?" | Vision | `prompt`, `imageId` |
| "Describe this picture..." | Vision | `prompt`, `imageId` |
| "Continue our conversation..." | Memory | `prompt`, `memory` |

---

## Rate Limits

| Metric | Per 15 Minutes | Per Day |
|--------|----------------|---------|
| Requests | 75 | 1,800 |
| Tokens | 150,000 | 3,500,000 |
| Max Input | 90,000 chars | - |

Check current limits:
```bash
curl -H "Authorization: Bearer $API_KEY" \
  "https://apiv2.2dai.io:800/api/v1/settings/rate-limits"
```

---

## Best Practices

### DO:
- Use `system` prompt to set AI behavior and tone
- Use `memory` for multi-turn conversations
- Use `jsonFormat` when you need structured data
- Use streaming for better UX with long responses
- Cache and reuse conversation context

### DO NOT:
- Send extremely long prompts (>90k chars)
- Ignore token counts - they affect rate limits
- Forget to handle streaming errors
- Use vision without an actual imageId

---

[Back to Main Skill](../skill.md) | [Image Generation](./image-generation.md) | [OpenAI Compatible](./openai-compatible.md)
