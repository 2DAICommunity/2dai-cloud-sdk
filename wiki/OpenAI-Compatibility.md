# OpenAI Compatibility

Use 2DAI as a drop-in replacement for OpenAI's API with your favorite AI frameworks.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [API Endpoints](#api-endpoints)
- [Using the OpenAI SDK](#using-the-openai-sdk)
- [Streaming](#streaming)
- [JSON Mode](#json-mode)
- [Parameter Support](#parameter-support)
- [Response Format](#response-format)
- [Framework Integrations](#framework-integrations)
  - [LangChain (Python)](#langchain-python)
  - [LangChain.js](#langchainjs)
  - [LlamaIndex](#llamaindex)
  - [Vercel AI SDK](#vercel-ai-sdk)
  - [AutoGen](#autogen)
  - [Haystack](#haystack)
  - [cURL](#curl)
- [Migration Guide](#migration-guide)
- [Limitations](#limitations)
- [Next Steps](#next-steps)

---

## Overview

2DAI provides a fully OpenAI-compatible API endpoint, allowing you to use existing OpenAI-based tools and frameworks without code changes. Simply point your client to our API and use your 2DAI API key.

**Base URL:** `https://api.2dai.io/v1`

**Key Benefits:**
- Works with OpenAI SDK, LangChain, LlamaIndex, Vercel AI SDK, and more
- No code rewrites for existing OpenAI-based projects
- Same request/response format as OpenAI
- Streaming and non-streaming support
- JSON mode for structured outputs

---

## Quick Start

```typescript
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: '2dai_pk_your_api_key_here',
  baseURL: 'https://api.2dai.io/v1'
});

const response = await client.chat.completions.create({
  model: 'default',
  messages: [{ role: 'user', content: 'Hello!' }]
});

console.log(response.choices[0].message.content);
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/models` | List available models |
| GET | `/v1/models/:model` | Get model details |
| POST | `/v1/chat/completions` | Chat completion (streaming & non-streaming) |

---

## Using the OpenAI SDK

Install the OpenAI SDK:

```bash
npm install openai
```

### Non-Streaming

```typescript
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: '2dai_pk_your_api_key_here',
  baseURL: 'https://api.2dai.io/v1'
});

const completion = await client.chat.completions.create({
  model: 'default',
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'What is the capital of France?' }
  ]
});

console.log(completion.choices[0].message.content);
// Output: Paris is the capital of France.
```

### With Conversation History

```typescript
const completion = await client.chat.completions.create({
  model: 'default',
  messages: [
    { role: 'system', content: 'You are a helpful coding assistant.' },
    { role: 'user', content: 'How do I read a file in Node.js?' },
    { role: 'assistant', content: 'You can use fs.readFileSync() or fs.promises.readFile().' },
    { role: 'user', content: 'Show me an async example.' }
  ]
});
```

---

## Streaming

Enable streaming to receive tokens as they're generated:

```typescript
const stream = await client.chat.completions.create({
  model: 'default',
  messages: [{ role: 'user', content: 'Write a haiku about programming' }],
  stream: true
});

for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content;
  if (content) {
    process.stdout.write(content);
  }
}
```

**Streaming Response Format (SSE):**
```
data: {"id":"chatcmpl-xxx","object":"chat.completion.chunk","choices":[{"delta":{"role":"assistant"}}]}

data: {"id":"chatcmpl-xxx","object":"chat.completion.chunk","choices":[{"delta":{"content":"Hello"}}]}

data: {"id":"chatcmpl-xxx","object":"chat.completion.chunk","choices":[{"delta":{"content":"!"}}]}

data: {"id":"chatcmpl-xxx","object":"chat.completion.chunk","choices":[{"finish_reason":"stop"}],"usage":{"prompt_tokens":10,"completion_tokens":5,"total_tokens":15}}

data: [DONE]
```

---

## JSON Mode

Request structured JSON responses:

```typescript
const completion = await client.chat.completions.create({
  model: 'default',
  messages: [
    { role: 'user', content: 'List 3 programming languages with their use cases as JSON' }
  ],
  response_format: { type: 'json_object' }
});

const data = JSON.parse(completion.choices[0].message.content);
console.log(data);
```

---

## Parameter Support

| Parameter | Support | Notes |
|-----------|---------|-------|
| `model` | Yes | Use `"default"` or `"2dai-llm"` |
| `messages` | Yes | Full support for system/user/assistant roles |
| `stream` | Yes | SSE streaming with usage in final chunk |
| `response_format` | Yes | `{ type: 'json_object' }` for JSON mode |
| `temperature` | Accepted | Value accepted but not applied |
| `max_tokens` | Accepted | Value accepted but not applied |
| `top_p` | Accepted | Value accepted but not applied |
| `frequency_penalty` | No | Not supported |
| `presence_penalty` | No | Not supported |

---

## Response Format

### Non-Streaming Response

```json
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "created": 1704067200,
  "model": "2dai-llm",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Paris is the capital of France."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 15,
    "completion_tokens": 8,
    "total_tokens": 23
  }
}
```

### Models Response

```json
{
  "object": "list",
  "data": [
    {
      "id": "2dai-llm",
      "object": "model",
      "created": 1704067200,
      "owned_by": "2dai"
    }
  ]
}
```

---

## Framework Integrations

### LangChain (Python)

```python
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(
    model="2dai-llm",
    openai_api_key="2dai_pk_your_api_key_here",
    openai_api_base="https://api.2dai.io/v1"
)

# Simple completion
response = llm.invoke("What is the capital of France?")
print(response.content)

# With streaming
for chunk in llm.stream("Write a poem about coding"):
    print(chunk.content, end="", flush=True)
```

**With Chat History:**

```python
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage

messages = [
    SystemMessage(content="You are a helpful assistant."),
    HumanMessage(content="What is Python?"),
    AIMessage(content="Python is a programming language."),
    HumanMessage(content="What are its main uses?")
]

response = llm.invoke(messages)
print(response.content)
```

---

### LangChain.js

```typescript
import { ChatOpenAI } from '@langchain/openai';

const llm = new ChatOpenAI({
  modelName: "2dai-llm",
  openAIApiKey: "2dai_pk_your_api_key_here",
  configuration: {
    baseURL: "https://api.2dai.io/v1"
  }
});

// Simple completion
const response = await llm.invoke("What is the capital of France?");
console.log(response.content);

// With streaming
const stream = await llm.stream("Write a haiku");
for await (const chunk of stream) {
  process.stdout.write(chunk.content);
}
```

**Building a Chain:**

```typescript
import { ChatOpenAI } from '@langchain/openai';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate } from '@langchain/core/prompts';

const llm = new ChatOpenAI({
  modelName: "2dai-llm",
  openAIApiKey: "2dai_pk_your_api_key_here",
  configuration: { baseURL: "https://api.2dai.io/v1" }
});

const prompt = ChatPromptTemplate.fromMessages([
  ["system", "You are a helpful assistant that translates {input_language} to {output_language}."],
  ["human", "{input}"]
]);

const chain = prompt.pipe(llm).pipe(new StringOutputParser());

const result = await chain.invoke({
  input_language: "English",
  output_language: "French",
  input: "Hello, how are you?"
});

console.log(result);
```

---

### LlamaIndex

```python
from llama_index.llms.openai_like import OpenAILike

llm = OpenAILike(
    model="2dai-llm",
    api_base="https://api.2dai.io/v1",
    api_key="2dai_pk_your_api_key_here",
    is_chat_model=True,
    is_function_calling_model=False
)

# Simple completion
response = llm.complete("What is the capital of France?")
print(response.text)

# Chat completion
from llama_index.core.llms import ChatMessage

messages = [
    ChatMessage(role="system", content="You are a helpful assistant."),
    ChatMessage(role="user", content="Hello!")
]

response = llm.chat(messages)
print(response.message.content)
```

**With Streaming:**

```python
# Streaming completion
for chunk in llm.stream_complete("Write a short story"):
    print(chunk.delta, end="", flush=True)

# Streaming chat
for chunk in llm.stream_chat(messages):
    print(chunk.delta, end="", flush=True)
```

---

### Vercel AI SDK

```typescript
import { createOpenAI } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';

const openai = createOpenAI({
  apiKey: '2dai_pk_your_api_key_here',
  baseURL: 'https://api.2dai.io/v1'
});

// Non-streaming
const { text } = await generateText({
  model: openai('2dai-llm'),
  prompt: 'What is the capital of France?'
});

console.log(text);
```

**Streaming:**

```typescript
const { textStream } = await streamText({
  model: openai('2dai-llm'),
  prompt: 'Write a haiku about programming'
});

for await (const chunk of textStream) {
  process.stdout.write(chunk);
}
```

**With System Prompt and Messages:**

```typescript
const { text } = await generateText({
  model: openai('2dai-llm'),
  system: 'You are a helpful coding assistant.',
  messages: [
    { role: 'user', content: 'How do I read a file in Node.js?' },
    { role: 'assistant', content: 'Use fs.readFileSync() or fs.promises.readFile()' },
    { role: 'user', content: 'Show me an async example' }
  ]
});
```

**Next.js API Route:**

```typescript
// app/api/chat/route.ts
import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

const openai = createOpenAI({
  apiKey: process.env.TWODAI_API_KEY,
  baseURL: 'https://api.2dai.io/v1'
});

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: openai('2dai-llm'),
    messages
  });

  return result.toDataStreamResponse();
}
```

---

### AutoGen

```python
from autogen import ConversableAgent

config_list = [
    {
        "model": "2dai-llm",
        "api_key": "2dai_pk_your_api_key_here",
        "base_url": "https://api.2dai.io/v1"
    }
]

assistant = ConversableAgent(
    name="assistant",
    llm_config={"config_list": config_list},
    system_message="You are a helpful AI assistant."
)

user_proxy = ConversableAgent(
    name="user_proxy",
    human_input_mode="NEVER",
    llm_config=False
)

# Start a conversation
user_proxy.initiate_chat(
    assistant,
    message="What are the benefits of TypeScript?"
)
```

---

### Haystack

```python
from haystack.components.generators.chat import OpenAIChatGenerator
from haystack.dataclasses import ChatMessage

generator = OpenAIChatGenerator(
    api_key="2dai_pk_your_api_key_here",
    api_base_url="https://api.2dai.io/v1",
    model="2dai-llm"
)

messages = [
    ChatMessage.from_system("You are a helpful assistant."),
    ChatMessage.from_user("What is the capital of France?")
]

response = generator.run(messages=messages)
print(response["replies"][0].content)
```

---

### cURL

**Non-Streaming:**

```bash
curl https://api.2dai.io/v1/chat/completions \
  -H "Authorization: Bearer 2dai_pk_your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "2dai-llm",
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Hello!"}
    ]
  }'
```

**Streaming:**

```bash
curl https://api.2dai.io/v1/chat/completions \
  -H "Authorization: Bearer 2dai_pk_your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "2dai-llm",
    "messages": [{"role": "user", "content": "Hello!"}],
    "stream": true
  }'
```

**List Models:**

```bash
curl https://api.2dai.io/v1/models \
  -H "Authorization: Bearer 2dai_pk_your_api_key_here"
```

**JSON Mode:**

```bash
curl https://api.2dai.io/v1/chat/completions \
  -H "Authorization: Bearer 2dai_pk_your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "2dai-llm",
    "messages": [{"role": "user", "content": "List 3 colors as JSON array"}],
    "response_format": {"type": "json_object"}
  }'
```

---

## Migration Guide

Migrating from OpenAI to 2DAI requires only two changes:

### Before (OpenAI)

```typescript
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: 'sk-...'
  // uses default baseURL: https://api.openai.com/v1
});
```

### After (2DAI)

```typescript
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: '2dai_pk_your_api_key_here',
  baseURL: 'https://api.2dai.io/v1'
});
```

**Environment Variables:**

```bash
# Before
OPENAI_API_KEY=sk-...

# After
OPENAI_API_KEY=2dai_pk_your_api_key_here
OPENAI_BASE_URL=https://api.2dai.io/v1
```

---

## Limitations

| Feature | Status |
|---------|--------|
| Function calling | Not supported |
| Tool use | Not supported |
| Vision (image input) | Not supported (use native SDK) |
| Embeddings | Not supported |
| Fine-tuning | Not supported |
| Temperature control | Accepted but not applied |
| Max tokens control | Accepted but not applied |

> **Note:** For image analysis, use the native 2DAI SDK's `describeImage()` method. See [LLM Text Generation](LLM-Text-Generation#image-description-vision).

---

## Next Steps

- [LLM Text Generation](LLM-Text-Generation) - Native SDK text generation features
- [API Reference](API-Reference) - Complete endpoint documentation
- [Examples](Examples) - More code examples
- [Troubleshooting](Troubleshooting) - Common issues and solutions

---

← [LLM Text Generation](LLM-Text-Generation) | [CDN Operations](CDN-Operations) →
