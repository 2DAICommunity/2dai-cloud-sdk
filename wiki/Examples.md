# Examples

Complete code examples for common use cases.

## Table of Contents

- [Image Generation with Watermark](#image-generation-with-watermark)
- [Advanced Watermarking](#advanced-watermarking)
- [Video Generation and Frame Extraction](#video-generation-and-frame-extraction)
- [LLM with Memory and JSON](#llm-with-memory-and-json)
- [Batch Processing with Rate Limits](#batch-processing-with-rate-limits)
- [Streaming Text Generation](#streaming-text-generation)
- [WebSocket Real-Time Generation](#websocket-real-time-generation)
- [OpenAI-Compatible Client](#openai-compatible-client)
- [Image Vision Analysis](#image-vision-analysis)
- [OCR Text Extraction](#ocr-text-extraction)
- [Full Workflow Example](#full-workflow-example)

---

## Image Generation with Watermark

Generate an image with a watermark and download it.

```typescript
import { createClient, STYLES, FORMATS } from '2dai-cloud-sdk';
import fs from 'fs';

const client = createClient('2dai_pk_your_api_key_here');

async function generateAndDownload() {
  try {
    // Generate image
    const result = await client.generateImage({
      prompt: 'a futuristic city at sunset with flying cars',
      style: STYLES.cine.id,
      format: FORMATS.landscape.id,
      watermark: 'your-watermark-id',
      watermarkPosition: 'southeast'
    });

    console.log('Image generated:', result.imageId);

    // Download the image
    const { buffer } = await client.downloadFromCDN(result.imageId);
    fs.writeFileSync('generated-image.jpg', buffer);
    console.log('Image saved to generated-image.jpg');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

generateAndDownload();
```

---

## Advanced Watermarking

Tiled watermarks, copyright text, and watermark positions.

### Tiled Watermark (Full Coverage)

```typescript
import { createClient } from '2dai-cloud-sdk';
import fs from 'fs';

const client = createClient('2dai_pk_your_api_key_here');

async function tiledWatermark() {
  // Generate image with tiled watermark (repeats across entire image)
  const result = await client.generateImage({
    prompt: 'product photography of a luxury watch',
    watermark: 'your-watermark-id',
    watermarkAsTiles: true  // Tiles watermark across the image
  });

  const { buffer } = await client.downloadFromCDN(result.imageId);
  fs.writeFileSync('tiled-watermark.jpg', buffer);
  console.log('Image with tiled watermark saved');
}

tiledWatermark();
```

### Copyright Text Overlay

```typescript
import { createClient } from '2dai-cloud-sdk';
import fs from 'fs';

const client = createClient('2dai_pk_your_api_key_here');

async function copyrightOverlay() {
  // Generate image with copyright text
  const result = await client.generateImage({
    prompt: 'beautiful mountain landscape at sunrise',
    copyright: '© 2026 My Company - All Rights Reserved'
  });

  const { buffer } = await client.downloadFromCDN(result.imageId);
  fs.writeFileSync('copyright-image.jpg', buffer);
  console.log('Image with copyright saved');
}

copyrightOverlay();
```

### Combined Watermark + Copyright

```typescript
import { createClient } from '2dai-cloud-sdk';
import fs from 'fs';

const client = createClient('2dai_pk_your_api_key_here');

async function combinedProtection() {
  const result = await client.generateImage({
    prompt: 'professional headshot portrait',
    watermark: 'your-watermark-id',
    watermarkPosition: 'southeast',
    copyright: '© 2026 Photo Studio'
  });

  console.log('Protected image:', result.imageId);

  // Download with additional watermark on the fly
  const { buffer } = await client.downloadFromCDN(result.imageId, {
    watermark: 'another-watermark-id',
    watermarkPosition: 'northwest'
  });
  fs.writeFileSync('double-protected.jpg', buffer);
}

combinedProtection();
```

### All Watermark Positions

```typescript
const positions = [
  'northwest', 'north', 'northeast',
  'west', 'center', 'east',
  'southwest', 'south', 'southeast'
];

for (const position of positions) {
  const { buffer } = await client.downloadFromCDN(imageId, {
    watermark: 'your-watermark-id',
    watermarkPosition: position as WatermarkPosition
  });
  fs.writeFileSync(`watermark-${position}.jpg`, buffer);
}
```

---

## Video Generation and Frame Extraction

Generate a video from an image and extract a GIF frame.

```typescript
import { createClient, STYLES, FORMATS } from '2dai-cloud-sdk';
import fs from 'fs';

const client = createClient('2dai_pk_your_api_key_here');

async function generateVideoAndExtractFrame() {
  try {
    // First generate an image
    const image = await client.generateImage({
      prompt: 'a dancing robot in a disco',
      style: STYLES.anime.id,
      format: FORMATS.profile.id
    });
    console.log('Image generated:', image.imageId);

    // Generate video from image with motion prompt
    const video = await client.generateVideo({
      imageId: image.imageId,
      prompt: 'dancing motion, disco lights flashing',
      duration: 3,
      fps: 16
    });
    console.log('Video generated:', video.videoId);

    // Download video as MP4
    const { buffer: mp4Buffer } = await client.downloadFromCDN(video.videoId, {
      format: 'mp4'
    });
    fs.writeFileSync('video.mp4', mp4Buffer);
    console.log('Video saved to video.mp4');

    // Extract frame at 1.5 seconds as JPEG
    const { buffer: frameBuffer } = await client.downloadFromCDN(video.videoId, {
      format: 'jpg',
      seek: 1500
    });
    fs.writeFileSync('frame.jpg', frameBuffer);
    console.log('Frame saved to frame.jpg');

    // Extract first frame as GIF
    const { buffer: gifBuffer } = await client.downloadFromCDN(video.videoId, {
      format: 'gif'
    });
    fs.writeFileSync('thumbnail.gif', gifBuffer);
    console.log('GIF thumbnail saved to thumbnail.gif');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

generateVideoAndExtractFrame();
```

---

## LLM with Memory and JSON

Build a conversational AI with memory and structured JSON output.

```typescript
import { createClient } from '2dai-cloud-sdk';

const client = createClient('2dai_pk_your_api_key_here');

async function chatWithMemory() {
  const memory: string[] = [];

  // First message
  const response1 = await client.generateText({
    prompt: 'My name is Alice and I love painting',
    system: 'You are a friendly art assistant'
  });
  console.log('Response 1:', response1.response);
  memory.push('User: My name is Alice and I love painting');
  memory.push(`Assistant: ${response1.response}`);

  // Second message with memory
  const response2 = await client.generateText({
    prompt: 'What art supplies would you recommend for me?',
    system: 'You are a friendly art assistant',
    memory
  });
  console.log('Response 2:', response2.response);

  // Get structured JSON output
  const analysis = await client.generateText({
    prompt: 'Analyze the conversation we just had',
    system: 'Analyze conversations and return structured data',
    memory,
    jsonFormat: true,
    jsonTemplate: {
      userName: 'the user name mentioned',
      interests: 'array of user interests',
      recommendationsGiven: 'number of recommendations',
      sentiment: 'positive/neutral/negative'
    }
  });
  console.log('Analysis:', JSON.parse(analysis.response));
}

chatWithMemory();
```

---

## Batch Processing with Rate Limits

Process multiple prompts while respecting rate limits.

```typescript
import { createClient, STYLES } from '2dai-cloud-sdk';

const client = createClient('2dai_pk_your_api_key_here');

async function batchGenerate(prompts: string[]) {
  const results = [];

  for (const prompt of prompts) {
    // Check rate limits before each request
    const limits = await client.checkLimits();
    const imageLimit = limits.find(l => l.operation === 'image');

    if (imageLimit && imageLimit.remaining.requestsPer15Min <= 0) {
      console.log('Rate limit reached, waiting for reset...');
      const resetTime = new Date(imageLimit.resetAt.window15Min);
      const waitMs = resetTime.getTime() - Date.now();
      await new Promise(resolve => setTimeout(resolve, waitMs + 1000));
    }

    try {
      const result = await client.generateImage({
        prompt,
        style: STYLES.realistic.id
      });
      results.push({ prompt, imageId: result.imageId, success: true });
      console.log(`Generated: ${prompt.substring(0, 30)}... -> ${result.imageId}`);
    } catch (error: any) {
      results.push({ prompt, error: error.message, success: false });
      console.error(`Failed: ${prompt.substring(0, 30)}... -> ${error.message}`);
    }
  }

  return results;
}

// Usage
const prompts = [
  'a red apple on a wooden table',
  'a blue ocean with waves',
  'a green forest with sunlight'
];

batchGenerate(prompts).then(results => {
  console.log('Batch complete:', results);
});
```

---

## Streaming Text Generation

Stream text responses in real-time using REST SSE.

```typescript
import { createClient } from '2dai-cloud-sdk';

const client = createClient('2dai_pk_your_api_key_here');

async function streamText() {
  console.log('Starting stream...\n');

  const controller = client.generateTextStream({
    prompt: 'Write a short story about a robot learning to paint',
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
  await controller.done;
}

streamText();
```

### Abort a Stream

```typescript
const controller = client.generateTextStream({
  prompt: 'Write a very long essay...',
  onChunk: (chunk) => {
    process.stdout.write(chunk);
  }
});

// Abort after 5 seconds
setTimeout(() => {
  console.log('\n\nAborting stream...');
  controller.abort();
}, 5000);

// Handle result (will resolve with partial content)
const result = await controller.done;
console.log('Partial response length:', result.response.length);
```

---

## WebSocket Real-Time Generation

Use WebSocket for real-time generation with progress updates.

```typescript
import { createClient } from '2dai-cloud-sdk';
import fs from 'fs';

const client = createClient('2dai_pk_your_api_key_here');

async function realtimeGeneration() {
  // Connect to WebSocket
  await client.wsConnect();
  console.log('Connected to WebSocket');

  try {
    // Generate image via WebSocket
    const imageResult = await client.wsGenerateImage({
      prompt: 'a majestic mountain landscape',
      style: 'realistic',
      format: 'landscape'
    });
    console.log('Image generated:', imageResult.result.imageId);

    // Stream LLM response via WebSocket
    console.log('\nStreaming text...\n');

    await new Promise<void>((resolve, reject) => {
      client.wsGenerateLlmStream(
        {
          prompt: 'Describe the feeling of standing on top of a mountain',
          system: 'You are a poetic writer'
        },
        {
          onChunk: (chunk) => process.stdout.write(chunk),
          onComplete: (response) => {
            console.log(`\n\nTokens: ${response.result.tokensUsed}`);
            console.log(`Prompt tokens: ${response.result.promptTokens}`);
            console.log(`Completion tokens: ${response.result.completionTokens}`);
            resolve();
          },
          onError: reject
        }
      );
    });

    // Generate video via WebSocket with motion prompt
    const videoResult = await client.wsGenerateVideo({
      imageId: imageResult.result.imageId,
      prompt: 'the scene view (the camera) slowly zooms in',
      duration: 3,
      fps: 16
    });
    console.log('\nVideo generated:', videoResult.result.videoId);

    // Download results
    const { buffer: imageBuffer } = await client.downloadFromCDN(
      imageResult.result.imageId,
      { format: 'jpg' }
    );
    fs.writeFileSync('mountain.jpg', imageBuffer);

    const { buffer: videoBuffer } = await client.downloadFromCDN(
      videoResult.result.videoId,
      { format: 'mp4' }
    );
    fs.writeFileSync('mountain.mp4', videoBuffer);

    console.log('Files saved!');

  } finally {
    await client.close();
    console.log('WebSocket closed');
  }
}

realtimeGeneration();
```

---

## OpenAI-Compatible Client

Use the OpenAI SDK with 2DAI API.

```typescript
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: '2dai_pk_your_api_key_here',
  baseURL: 'https://api.2dai.io/v1'
});

// Non-streaming
async function chat() {
  const completion = await client.chat.completions.create({
    model: 'default',
    messages: [
      { role: 'system', content: 'You are a helpful assistant' },
      { role: 'user', content: 'What is the capital of France?' }
    ]
  });

  console.log(completion.choices[0].message.content);
  console.log('Tokens used:', completion.usage?.total_tokens);
}

// Streaming
async function streamChat() {
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
}

chat();
streamChat();
```

---

## Image Vision Analysis

Analyze images using the LLM's vision capabilities.

```typescript
import { createClient } from '2dai-cloud-sdk';

const client = createClient('2dai_pk_your_api_key_here');

async function analyzeImage() {
  // First generate an image
  const image = await client.generateImage({
    prompt: 'a futuristic city at night with neon lights'
  });
  console.log('Image generated:', image.imageId);

  // Analyze the image with LLM vision
  const description = await client.generateText({
    prompt: 'Analyze this image and extract structured data',
    system: 'Extract information from images into structured JSON format.',
    imageId: image.imageId,
    jsonFormat: true,
    jsonTemplate: {
      main_subject: 'string - primary subject of the image',
      objects: 'array of strings - objects visible in the image',
      colors: 'array of strings - dominant colors',
      mood: 'string - overall mood/atmosphere',
      style: 'string - artistic style'
    }
  });

  console.log('Analysis:', description.json);
}

analyzeImage();
```

---

## OCR Text Extraction

Extract text from images using LLM vision capabilities.

```typescript
import { createClient } from '2dai-cloud-sdk';
import fs from 'fs';

const client = createClient('2dai_pk_your_api_key_here');

async function extractText() {
  // Assuming you have an imageId from a previous generation or upload
  const imageId = 'your-image-id';

  // Simple text extraction
  const result = await client.generateText({
    prompt: 'Extract all visible text from this image. Return only the extracted text, nothing else.',
    system: 'You are an OCR assistant. Extract text accurately from images.',
    imageId: imageId
  });

  console.log('Extracted text:', result.response);
}

extractText();
```

### Structured OCR with JSON

```typescript
import { createClient } from '2dai-cloud-sdk';

const client = createClient('2dai_pk_your_api_key_here');

async function structuredOCR() {
  const imageId = 'document-image-id';

  const result = await client.generateText({
    prompt: 'Extract text from this document image',
    system: 'Extract document information into structured format.',
    imageId: imageId,
    jsonFormat: true,
    jsonTemplate: {
      title: 'document title if visible',
      body_text: 'main body text',
      dates: 'array of dates found',
      numbers: 'array of numbers/amounts found',
      signatures: 'boolean - whether signatures are present'
    }
  });

  console.log('Document data:', result.json);
}

structuredOCR();
```

### Reading Signs and Labels

```typescript
import { createClient } from '2dai-cloud-sdk';

const client = createClient('2dai_pk_your_api_key_here');

async function readSigns() {
  const imageId = 'street-photo-id';

  const result = await client.generateText({
    prompt: 'What text is visible on signs, labels, or displays in this image?',
    system: 'List all readable text from signs and labels.',
    imageId: imageId,
    jsonFormat: true,
    jsonTemplate: {
      signs: 'array of objects with text and location description',
      languages_detected: 'array of languages found'
    }
  });

  console.log('Signs found:', result.json);
}

readSigns();
```

---

## Full Workflow Example

A complete workflow combining multiple features.

```typescript
import { createClient, STYLES, FORMATS } from '2dai-cloud-sdk';
import fs from 'fs';

const client = createClient('2dai_pk_your_api_key_here', {
  debug: true  // Enable debug logging
});

async function fullWorkflow() {
  console.log('=== Starting Full Workflow ===\n');

  // Step 1: Generate creative prompt with LLM
  console.log('Step 1: Generating creative prompt...');
  const promptResult = await client.generateText({
    prompt: 'Create a detailed image prompt for a fantasy landscape',
    system: 'You are a creative director who writes detailed image prompts',
    jsonFormat: true,
    jsonTemplate: {
      prompt: 'detailed image prompt',
      style: 'suggested art style',
      mood: 'mood of the scene'
    }
  });
  const creative = promptResult.json;
  console.log('Generated prompt:', creative.prompt);

  // Step 2: Generate image
  console.log('\nStep 2: Generating image...');
  const image = await client.generateImage({
    prompt: creative.prompt,
    style: STYLES.paint.id,
    format: FORMATS.landscape.id
  });
  console.log('Image ID:', image.imageId);

  // Step 3: Upscale image
  console.log('\nStep 3: Upscaling image...');
  const upscaled = await client.upscaleImage(image.imageId, { factor: 2 });
  console.log('Upscaled ID:', upscaled.imageId);
  console.log(`Size: ${image.width}x${image.height} -> ${upscaled.width}x${upscaled.height}`);

  // Step 4: Generate video with motion prompt
  console.log('\nStep 4: Generating video...');
  const video = await client.generateVideo({
    imageId: image.imageId,
    prompt: 'the scene view (the camera) pans gently, ambient motion, magical atmosphere',
    duration: 5,
    fps: 16
  });
  console.log('Video ID:', video.videoId);

  // Step 5: Analyze generated image
  console.log('\nStep 5: Analyzing image...');
  const analysis = await client.generateText({
    prompt: 'Describe what you see in this image in detail',
    imageId: image.imageId
  });
  console.log('Analysis:', analysis.response);

  // Step 6: Download all files
  console.log('\nStep 6: Downloading files...');

  const { buffer: originalBuffer } = await client.downloadFromCDN(image.imageId);
  fs.writeFileSync('workflow-original.jpg', originalBuffer);

  const { buffer: upscaledBuffer } = await client.downloadFromCDN(upscaled.imageId);
  fs.writeFileSync('workflow-upscaled.jpg', upscaledBuffer);

  const { buffer: videoBuffer } = await client.downloadFromCDN(video.videoId, {
    format: 'mp4'
  });
  fs.writeFileSync('workflow-video.mp4', videoBuffer);

  console.log('\n=== Workflow Complete ===');
  console.log('Files saved:');
  console.log('  - workflow-original.jpg');
  console.log('  - workflow-upscaled.jpg');
  console.log('  - workflow-video.mp4');
}

fullWorkflow().catch(console.error);
```

---

## Next Steps

- [Troubleshooting](Troubleshooting) - Common issues and solutions
- [API Reference](API-Reference) - Complete endpoint documentation
- [Getting Started](Getting-Started) - Back to basics

---

← [API Reference](API-Reference) | [Troubleshooting](Troubleshooting) →
