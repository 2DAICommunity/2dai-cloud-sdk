# LLM Text Generation

Generate text using AI with support for streaming, memory, JSON output, and OpenAI-compatible API.

## Table of Contents

- [Basic Usage](#basic-usage)
- [With System Prompt & Memory](#with-system-prompt--memory)
- [JSON Format Output](#json-format-output)
- [Markdown Formatting](#markdown-formatting)
- [Image Description (Vision)](#image-description-vision)
- [Streaming](#streaming)
- [OpenAI-Compatible API](#openai-compatible-api)
- [Response Types](#response-types)

---

## Basic Usage

```typescript
import { createClient } from '2dai-cloud-sdk';

const client = createClient('2dai_pk_your_api_key');

const result = await client.generateText({
  prompt: 'Write a short poem about AI and creativity'
});

console.log(result.response);
```

---

## With System Prompt & Memory

Provide context and conversation history for more relevant responses.

```typescript
const result = await client.generateText({
  prompt: 'What were we discussing?',
  system: 'You are a helpful assistant',
  memory: [
    'User asked about AI capabilities',
    'Discussed image generation features'
  ]
});
```

---

## JSON Format Output

Get structured JSON responses.

```typescript
const result = await client.generateText({
  prompt: 'Analyze this product review: "Great product, fast shipping!"',
  jsonFormat: true,
  jsonTemplate: {
    sentiment: 'positive/negative/neutral',
    score: '1-10',
    summary: 'brief summary'
  }
});

console.log(result.json);
// { sentiment: "positive", score: "9", summary: "..." }
```

---

## Markdown Formatting

Enable markdown in responses for rich text output.

```typescript
const formatted = await client.generateText({
  prompt: 'Explain what TypeScript is. Use headers and code examples.',
  useMarkdown: true
});

console.log(formatted.response);
// Contains # headers, ```code blocks```, bullet points, etc.
```

---

## Image Description (Vision)

Analyze images with the LLM.

```typescript
// First generate or have an image
const image = await client.generateImage({
  prompt: 'a futuristic city at night'
});

// Then analyze it
const description = await client.generateText({
  prompt: 'Analyze this image and extract structured data',
  system: 'Extract information from images into structured JSON format.',
  imageId: image.imageId,
  jsonFormat: true,
  jsonTemplate: {
    main_subject: 'string - primary subject of the image',
    objects: 'array of strings - objects visible in the image',
    colors: 'array of strings - dominant colors',
    mood: 'string - overall mood/atmosphere'
  }
});

console.log(description.json);
// { main_subject: "futuristic cityscape", objects: ["buildings", "lights"], ... }
```

---

## Streaming

Stream text responses token-by-token for real-time display.

### SDK Streaming (Recommended)

```typescript
// REST SSE Streaming
const controller = client.generateTextStream({
  prompt: 'Write a short story about a robot',
  system: 'You are a creative writer',
  onChunk: (chunk) => {
    process.stdout.write(chunk);
  },
  onComplete: (result) => {
    console.log(`\n\nDone! Total tokens: ${result.totalTokens}`);
  },
  onError: (error) => {
    console.error('Stream error:', error.message);
  }
});

// Wait for completion
const result = await controller.done;

// Or abort early
controller.abort();
```

### WebSocket Streaming

```typescript
await client.wsConnect();

const wsController = client.wsGenerateLlmStream(
  {
    prompt: 'Explain quantum computing',
    system: 'You are a physics teacher'
  },
  {
    onChunk: (chunk) => process.stdout.write(chunk),
    onComplete: (response) => {
      console.log(`\nTokens: ${response.result.tokensUsed}`);
      console.log(`Prompt tokens: ${response.result.promptTokens}`);
      console.log(`Completion tokens: ${response.result.completionTokens}`);
    },
    onError: (error) => console.error('Error:', error)
  }
);

// Abort if needed
wsController.abort();
```

### Streaming Notes

- **JSON Format Disabled**: When `jsonFormat: true`, streaming is automatically disabled
- **Rate Limiting**: Streaming requests consume one slot from start to completion
- **Upstream Cancellation**: Calling `abort()` stops GPU processing server-side, saving compute resources
- **End Signal**: Stream ends with `data: [DONE]` event

---

## OpenAI-Compatible API

> **See Also:** For comprehensive framework integrations (LangChain, Vercel AI SDK, LlamaIndex, etc.), see [OpenAI Compatibility](OpenAI-Compatibility).

Drop-in replacement for OpenAI's `/v1/chat/completions` endpoint.

### Using OpenAI SDK

```typescript
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: '2dai_pk_your_api_key_here',
  baseURL: 'https://api.2dai.io/v1'
});

// Non-streaming
const completion = await client.chat.completions.create({
  model: 'default',
  messages: [
    { role: 'system', content: 'You are a helpful assistant' },
    { role: 'user', content: 'What is the capital of France?' }
  ]
});

console.log(completion.choices[0].message.content);
```

### Streaming with OpenAI SDK

```typescript
const stream = await client.chat.completions.create({
  model: 'default',
  messages: [
    { role: 'user', content: 'Write a haiku about programming' }
  ],
  stream: true
});

for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content;
  if (content) {
    process.stdout.write(content);
  }
}
```

### Direct HTTP Request

```typescript
const response = await fetch('https://api.2dai.io/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'default',
    messages: [
      { role: 'system', content: 'You are a helpful assistant' },
      { role: 'user', content: 'Hello!' }
    ],
    stream: false
  })
});

const data = await response.json();
console.log(data.choices[0].message.content);
```

### JSON Mode

```typescript
const response = await fetch('https://api.2dai.io/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'default',
    messages: [
      { role: 'user', content: 'List 3 programming languages as JSON array' }
    ],
    response_format: { type: 'json_object' }
  })
});
```

### Parameter Support

| Parameter | Supported | Notes |
|-----------|-----------|-------|
| `model` | Yes | Accepted, uses 2DAI's model |
| `messages` | Yes | Full support for system/user/assistant roles |
| `stream` | Yes | SSE streaming with usage in final chunk |
| `response_format` | Yes | `{ type: 'json_object' }` for JSON mode |
| `temperature` | Partial | Accepted but not applied |
| `max_tokens` | Partial | Accepted but not applied |

### Response Format

```json
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "created": 1704067200,
  "model": "2dai-llm",
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "Paris is the capital of France."
    },
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 15,
    "completion_tokens": 8,
    "total_tokens": 23
  }
}
```

> **Note:** Token counts (`prompt_tokens`, `completion_tokens`) are accurately reported from the underlying vLLM model.

---

## Response Types

### TextGenerationResult

```typescript
interface TextGenerationResult {
  success: boolean;
  response: string;
  json?: any;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}
```

### TextStreamResult

```typescript
interface TextStreamResult {
  success: boolean;
  response: string;
  totalTokens?: number;
}
```

### WsLlmResponse

```typescript
interface WsLlmResponse {
  result: {
    text: string;
    json?: any;
    tokensUsed: number;
    promptTokens?: number;
    completionTokens?: number;
  };
}
```

---

## Options Reference

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `prompt` | `string` | required | The user's prompt/question |
| `system` | `string` | - | System prompt for behavior |
| `memory` | `string[]` | - | Conversation history |
| `jsonFormat` | `boolean` | `false` | Enable JSON output |
| `jsonTemplate` | `object` | - | Template for JSON structure |
| `useMarkdown` | `boolean` | `false` | Enable markdown formatting |
| `imageId` | `string` | - | CDN image ID for vision |
| `useRandomSeed` | `boolean` | `false` | Use random seed for variety |

---

## Next Steps

- [OpenAI Compatibility](OpenAI-Compatibility) - Framework integrations (LangChain, Vercel AI, etc.)
- [CDN Operations](CDN-Operations) - Download generated content
- [WebSocket API](WebSocket-API) - Real-time generation
- [Examples](Examples) - Complete code examples

---

← [Video Generation](Video-Generation) | [OpenAI Compatibility](OpenAI-Compatibility) →
