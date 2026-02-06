---
name: 2DAI OpenAI Compatible API
capability: openai_compatible
version: 1.12.0
api_base_url: https://apiv2.2dai.io:800/v1
openai_compatible: true
---

# OpenAI-Compatible API Skills

Drop-in replacement for OpenAI's `/v1/chat/completions` endpoint. Use existing OpenAI code with 2DAI.

## Base URL

```
https://apiv2.2dai.io:800/v1
```

---

## Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/chat/completions` | POST | Chat completion (streaming & non-streaming) |
| `/v1/models` | GET | List available models |
| `/v1/models/:model` | GET | Get model details |

---

## Chat Completion (Non-Streaming)

### Request
```bash
curl -X POST "https://apiv2.2dai.io:800/v1/chat/completions" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "default",
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Hello, how are you?"}
    ]
  }'
```

### Response
```json
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "created": 1706745600,
  "model": "2DAI-LLM",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! I'm doing well, thank you for asking. How can I help you today?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 25,
    "completion_tokens": 18,
    "total_tokens": 43
  }
}
```

---

## Chat Completion (Streaming)

### Request
```bash
curl -X POST "https://apiv2.2dai.io:800/v1/chat/completions" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "default",
    "messages": [
      {"role": "user", "content": "Tell me a joke"}
    ],
    "stream": true
  }'
```

### Streaming Response (SSE)
```
data: {"id":"chatcmpl-abc123","object":"chat.completion.chunk","choices":[{"delta":{"content":"Why"},"index":0}]}

data: {"id":"chatcmpl-abc123","object":"chat.completion.chunk","choices":[{"delta":{"content":" did"},"index":0}]}

data: {"id":"chatcmpl-abc123","object":"chat.completion.chunk","choices":[{"delta":{"content":" the"},"index":0}]}

...

data: [DONE]
```

---

## JSON Mode

Get structured JSON responses.

### Request
```bash
curl -X POST "https://apiv2.2dai.io:800/v1/chat/completions" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "default",
    "messages": [
      {"role": "user", "content": "List 3 colors as JSON with name and hex code"}
    ],
    "response_format": {"type": "json_object"}
  }'
```

### Response
```json
{
  "choices": [
    {
      "message": {
        "content": "{\"colors\": [{\"name\": \"red\", \"hex\": \"#FF0000\"}, {\"name\": \"blue\", \"hex\": \"#0000FF\"}, {\"name\": \"green\", \"hex\": \"#00FF00\"}]}"
      }
    }
  ]
}
```

---

## List Models

### Request
```bash
curl -H "Authorization: Bearer $API_KEY" \
  "https://apiv2.2dai.io:800/v1/models"
```

### Response
```json
{
  "object": "list",
  "data": [
    {
      "id": "2DAI-LLM",
      "object": "model",
      "created": 1706745600,
      "owned_by": "2dai"
    }
  ]
}
```

---

## Parameter Support

| Parameter | Supported | Notes |
|-----------|-----------|-------|
| `model` | Yes | Use `"default"` or `"2DAI-LLM"` |
| `messages` | Yes | `system`, `user`, `assistant` roles |
| `stream` | Yes | SSE streaming |
| `response_format` | Yes | JSON mode with `{"type": "json_object"}` |
| `temperature` | Accepted | Parameter accepted but not applied |
| `max_tokens` | Accepted | Parameter accepted but not applied |
| `top_p` | Accepted | Parameter accepted but not applied |
| `frequency_penalty` | Accepted | Parameter accepted but not applied |
| `presence_penalty` | Accepted | Parameter accepted but not applied |

---

## Framework Integrations

### OpenAI SDK (TypeScript)
```typescript
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: '2dai_pk_your_api_key',
  baseURL: 'https://apiv2.2dai.io:800/v1'
});

const response = await client.chat.completions.create({
  model: 'default',
  messages: [
    { role: 'user', content: 'Hello!' }
  ]
});

console.log(response.choices[0].message.content);
```

### OpenAI SDK (Python)
```python
from openai import OpenAI

client = OpenAI(
    api_key="2dai_pk_your_api_key",
    base_url="https://apiv2.2dai.io:800/v1"
)

response = client.chat.completions.create(
    model="default",
    messages=[
        {"role": "user", "content": "Hello!"}
    ]
)

print(response.choices[0].message.content)
```

### LangChain (TypeScript)
```typescript
import { ChatOpenAI } from '@langchain/openai';

const model = new ChatOpenAI({
  openAIApiKey: '2dai_pk_your_api_key',
  configuration: {
    baseURL: 'https://apiv2.2dai.io:800/v1'
  },
  modelName: 'default'
});

const response = await model.invoke('Hello!');
console.log(response.content);
```

### LangChain (Python)
```python
from langchain_openai import ChatOpenAI

model = ChatOpenAI(
    openai_api_key="2dai_pk_your_api_key",
    openai_api_base="https://apiv2.2dai.io:800/v1",
    model_name="default"
)

response = model.invoke("Hello!")
print(response.content)
```

### Vercel AI SDK
```typescript
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

const openai = createOpenAI({
  apiKey: '2dai_pk_your_api_key',
  baseURL: 'https://apiv2.2dai.io:800/v1'
});

const { text } = await generateText({
  model: openai('default'),
  prompt: 'Hello!'
});

console.log(text);
```

### LlamaIndex (Python)
```python
from llama_index.llms.openai import OpenAI

llm = OpenAI(
    api_key="2dai_pk_your_api_key",
    api_base="https://apiv2.2dai.io:800/v1",
    model="default"
)

response = llm.complete("Hello!")
print(response.text)
```

---

## When to Use OpenAI-Compatible vs Native API

| Scenario | Recommendation |
|----------|----------------|
| Existing OpenAI code | **OpenAI-compatible** - minimal changes |
| LangChain/Vercel AI integration | **OpenAI-compatible** - native support |
| Need JSON output | Either - both support JSON mode |
| Image generation | **Native API only** |
| Video generation | **Native API only** |
| Image editing | **Native API only** |
| CDN operations | **Native API only** |
| Vision/image analysis | **Native API only** |
| Speech-to-text (STT) | **Native API only** |
| Text-to-speech (TTS) | **Native API only** |
| WebSocket real-time | **Native API only** |

---

## Agent Decision Guide

| User Request | Use This |
|--------------|----------|
| "Use OpenAI SDK with 2DAI" | OpenAI-compatible |
| "LangChain integration" | OpenAI-compatible |
| "Drop-in OpenAI replacement" | OpenAI-compatible |
| "Generate images" | Native API (`/api/v1/generation/image`) |
| "Create videos" | Native API (`/api/v1/generation/video`) |
| "Analyze images" | Native API (`/api/v1/llm/generate` with imageId) |

---

## Migration from OpenAI

To migrate existing OpenAI code to 2DAI:

1. **Change base URL:**
   ```
   // From
   https://api.openai.com/v1

   // To
   https://apiv2.2dai.io:800/v1
   ```

2. **Change API key:**
   ```
   // From
   sk-...

   // To
   2dai_pk_...
   ```

3. **Change model (optional):**
   ```
   // From
   gpt-4, gpt-3.5-turbo, etc.

   // To
   default (or 2DAI-LLM)
   ```

That's it! Your existing code should work with minimal changes.

---

## Rate Limits

Same as native LLM API:

| Metric | Per 15 Minutes | Per Day |
|--------|----------------|---------|
| Requests | 30 | 300 |
| Tokens | 150,000 | 1,500,000 |

---

[Back to Main Skill](../skill.md) | [LLM Text Generation](./llm-text.md) | [Image Generation](./image-generation.md)
