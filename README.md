# 2dai-cloud-sdk

Official TypeScript/JavaScript SDK for 2DAI.io Cloud AI Generation API

Generate images, videos, and text using state-of-the-art AI models through a simple and intuitive API.

[![npm version](https://img.shields.io/npm/v/2dai-cloud-sdk.svg)](https://www.npmjs.com/package/2dai-cloud-sdk)
[![npm downloads](https://img.shields.io/npm/dm/2dai-cloud-sdk.svg)](https://www.npmjs.com/package/2dai-cloud-sdk)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Table of Contents

- [Features](#features)
- [What's New](#whats-new)
- [Installation](#installation)
- [Getting an API Key](#getting-an-api-key)
- [Quick Start](#quick-start)
- [Documentation](#documentation)
  - [Initialization](#initialization)
  - [Image Generation](#image-generation)
  - [Image Editing](#image-editing)
  - [Image Upscaling](#image-upscaling)
  - [Video Generation](#video-generation)
  - [Text Generation (LLM)](#text-generation-llm)
  - [CDN Operations](#cdn-operations)
  - [Watermarking](#watermarking)
  - [Settings & Usage Tracking](#settings--usage-tracking)
- [Advanced Usage](#advanced-usage)
- [Complete Examples](#complete-examples)
- [API Reference](#api-reference)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Features

- **Text-to-Image**: Generate stunning images from text prompts
- **Image-to-Image**: Edit and transform existing images
- **AI Image Upscale**: Upscale images 2-4x using AI
- **Image-to-Video**: Create videos from static images
- **LLM Text Generation**: Generate text with context, memory, and JSON support
- **Image Description (Vision)**: Analyze images with LLM for structured data extraction
- **13 Style Presets**: Realistic, anime, manga, watercolor, cinematic, and more
- **7 Format Presets**: Portrait, landscape, profile, story, post, smartphone, banner
- **Type-Safe**: Full TypeScript support with comprehensive type definitions
- **Built-in Watermarking**: Apply custom watermarks to generated content
- **WebSocket Support**: Real-time generation with progress updates
- **Usage Tracking**: Real-time usage monitoring with remaining quota and reset times
- **Rate Limiting**: Built-in rate limit tracking for requests and tokens (LLM)
- **CDN Format Conversion**: Convert between image formats (JPG, PNG, GIF) and extract frames from videos
- **Comprehensive Tests**: Full test coverage for all API endpoints and WebSocket operations

---

## What's New

### v1.5.2 (Latest)

- **Watercolor Style** - New `watercolor` style preset for Gen6 Watercolor Anime generation
- **Manga Style Update** - Improved parameters for better results

### v1.5.1

- **Rate Limit Documentation** - Clarified that Image/Video/LLM use concurrent operation limits while CDN uses rate-based limits

### v1.5.0

- **CDN Download Method** - New `downloadFromCDN()` method for downloading images and videos with automatic authentication
- **CDN Auth Documentation** - Updated documentation to clarify that CDN URLs require Bearer token authentication

### v1.4.2

- **npm Publishing** - Set up GitHub Actions for automated npm publishing with provenance
- **Documentation** - Updated package links and badges

### v1.4.0

- **AI Image Upscale** - New upscale methods for AI-powered image upscaling
  - `upscaleImage()` - REST API upscaling with factor 2-4x
  - `wsUpscaleImage()` - WebSocket upscaling for real-time operations
- **Image Description (Vision)** - Analyze images with LLM
  - Pass `imageId` to `generateText()` or `wsGenerateLlm()` for image analysis
  - Extract structured JSON data from images
- **New Types** - `UpscaleOptions`, `UpscaleResult`, `WsUpscaleRequest`, `WsUpscaleResponse`
- **New Constants** - `UPSCALE_FACTOR` (MIN: 2, MAX: 4, DEFAULT: 2)

### v1.3.0

- **Full WebSocket Client** - Complete WebSocket implementation
  - `wsConnect()`, `wsGenerateImage()`, `wsGenerateVideo()`, `wsGenerateLlm()`
  - Auto-reconnect with exponential backoff
  - Ping/pong keepalive to prevent timeouts
  - Request tracking with `requestId`
- **Image Resize for img2img** - New `width` and `height` parameters for `editImage()`
  - Resize output to custom dimensions (320-1344) during image editing
- **JSON Output Enhancement** - `TextGenerationResult.json` field for parsed JSON output
- **WebSocket Types** - New exported types for WebSocket requests/responses

### v1.2.0

- **Video Frame Extraction** - Extract frames from videos with `?seek=<ms>` CDN parameter
- **Video Metadata** - `duration` and `fps` in video generation responses
- **WatermarkPosition Constants** - Type-safe watermark positioning

### v1.1.0

- **Style Update** - Replaced `legacy` style with new `text` style
- Updated style presets to match Gen6 improvements

### v1.0.3

- **Markdown Formatting** - New `useMarkdown` option for LLM text generation
- When enabled, responses include markdown formatting (headers, bullet points, code blocks)
- Works with both REST API and WebSocket connections

### v1.0.2

- **JSON Format Fix** - Fixed `jsonFormat: true` responses returning empty strings
- LLM text generation now correctly returns JSON responses when using `jsonFormat` and `jsonTemplate` options

### v1.0.1

- **GIF File Format Support** - Full GIF upload, download, and processing via CDN
- **Format Conversion** - Convert between image formats (PNG, JPG, GIF) and extract video frames as GIF
- **GIF Watermarking** - Apply watermarks to GIF files with position control
- **Enhanced Debug Logging** - Improved watermark operation debugging

### v1.0.0

- Initial public release
- Text-to-image generation with 12 style presets
- Image-to-image editing with strength control
- Image-to-video generation
- LLM text generation with memory and JSON format support
- 7 format presets for different aspect ratios
- WebSocket and REST API support
- Built-in rate limiting and watermarking support

---

## Installation

```bash
npm install 2dai-cloud-sdk
```

or

```bash
yarn add 2dai-cloud-sdk
```

---

## Getting an API Key

To use this SDK, you need an API key.

**Request Access:**
1. Fill out the [API Access Request Form](https://forms.gle/TdQ8Wu3zpegvAwVg9)
2. We'll review your request within 24-48 hours
3. Once approved, you'll receive your API key via email

**Contact:**
- Twitter/X: [@2DAICommunity](https://x.com/2DAICommunity)
- Telegram: [Token2dAI](https://t.me/Token2dAI)

---

## Quick Start

```typescript
import { createClient, STYLES, FORMATS } from '2dai-cloud-sdk';

// Initialize the client
const client = createClient('2dai_pk_your_api_key_here');

// Generate an image (REST API)
const image = await client.generateImage({
  prompt: 'a majestic lion in the savanna at sunset',
  style: STYLES.cine.id,
  format: FORMATS.landscape.id
});

console.log(`Generated image ID: ${image.imageId}`);

// Or use WebSocket for real-time generation
await client.wsConnect();
const wsImage = await client.wsGenerateImage({
  prompt: 'a futuristic city at night',
  style: STYLES.cine.id,
  format: FORMATS.landscape.id
});
console.log(`WebSocket Image ID: ${wsImage.result.imageId}`);
await client.close();
```

---

## Documentation

### Initialization

```typescript
import { createClient } from '2dai-cloud-sdk';

const client = createClient('2dai_pk_your_api_key_here', {
  timeout: 300000,  // Optional, 5 minutes default
  debug: false      // Optional, enable debug logging
});
```

### Image Generation

#### Generate from Text Prompt

```typescript
import { STYLES, FORMATS } from '2dai-cloud-sdk';

const result = await client.generateImage({
  prompt: 'a cyberpunk cityscape at night with neon lights',
  negativePrompt: 'blurry, low quality, distorted',
  style: STYLES.cine.id,
  format: FORMATS.landscape.id,
  seed: 12345  // Optional, for reproducibility
});

console.log(result);
// {
//   success: true,
//   imageId: '550e8400-e29b-41d4-a716-446655440000',
//   width: 1344,
//   height: 768,
//   seed: 12345
// }
```

#### Available Styles

```typescript
import { STYLES } from '2dai-cloud-sdk';

STYLES.raw         // Raw Gen6 defaults
STYLES.realistic   // Realistic 2DAI generation
STYLES.text        // Text & Clarity
STYLES.ciniji      // Niji anime style with vibrant colors
STYLES.portrait    // Gen6 Portrait
STYLES.cine        // Gen6 Cinematic
STYLES.sport       // Gen6 Sport
STYLES.fashion     // Gen6 Fashion
STYLES.niji        // Gen6 Anime Niji
STYLES.anime       // Gen6 Anime
STYLES.manga       // Gen6 Manga
STYLES.watercolor  // Gen6 Watercolor Anime
STYLES.paint       // Gen6 Paint
```

#### Available Formats

```typescript
import { FORMATS } from '2dai-cloud-sdk';

FORMATS.portrait    // 9:16 vertical (768x1344)
FORMATS.landscape   // 16:9 horizontal (1344x768)
FORMATS.profile     // 1:1 profile picture (1024x1024)
FORMATS.story       // 9:16 story format (720x1280)
FORMATS.post        // 9:7 wide square (1152x896)
FORMATS.smartphone  // Phone screen (640x1344)
FORMATS.banner      // 3:1 wide screen (1472x448)
```

### Image Editing

```typescript
// Edit using image ID
const edited = await client.editImage('550e8400-e29b-41d4-a716-446655440000', {
  prompt: 'make the sky more dramatic with storm clouds'
});

// Edit with resize - output to custom dimensions
const resized = await client.editImage('550e8400-e29b-41d4-a716-446655440000', {
  prompt: 'Seamlessly extend the image, remove the black background',
  width: 768,   // Custom output width (320-1344)
  height: 1344  // Custom output height (320-1344)
});

console.log(resized);
// {
//   success: true,
//   imageId: 'new-image-id',
//   width: 768,
//   height: 1344,
//   seed: 12345
// }

// Edit with resizePad - fit original in frame with black padding
const padded = await client.editImage('550e8400-e29b-41d4-a716-446655440000', {
  prompt: 'Seamlessly extend the image',
  width: 768,
  height: 1344,
  resizePad: true  // Fits original image in resized frame, fills extra space with black
});

// Edit via WebSocket
await client.wsConnect();
const wsEdited = await client.wsGenerateImage({
  imageId: '550e8400-e29b-41d4-a716-446655440000',
  prompt: 'make the image black and white',
  width: 1344,
  height: 768
});
console.log(wsEdited.result.imageId);
```

#### Resize Padding (`resizePad`)

When resizing images to different dimensions, the `resizePad` option controls how the original image is fitted:

| resizePad | Behavior |
|-----------|----------|
| `false` (default) | Image is cropped/stretched to fill the target dimensions |
| `true` | Original image fits entirely within the frame, extra space is filled with black |

### Image Upscaling

AI-powered image upscaling. No user prompt needed.

```typescript
import { UPSCALE_FACTOR } from '2dai-cloud-sdk';

// Upscale an image (REST API)
const upscaled = await client.upscaleImage('550e8400-e29b-41d4-a716-446655440000', {
  factor: 2  // 2x, 3x, or 4x (default: 2)
});

console.log(upscaled);
// {
//   success: true,
//   imageId: 'upscaled-image-id',
//   width: 2048,
//   height: 2048,
//   seed: 12345
// }

// Upscale via WebSocket
await client.wsConnect();
const wsUpscaled = await client.wsUpscaleImage({
  imageId: '550e8400-e29b-41d4-a716-446655440000',
  factor: 2
});
console.log(wsUpscaled.result.imageId);
await client.close();
```

#### Upscale Factor Limits

```typescript
import { UPSCALE_FACTOR } from '2dai-cloud-sdk';

UPSCALE_FACTOR.MIN     // 2
UPSCALE_FACTOR.MAX     // 4
UPSCALE_FACTOR.DEFAULT // 2
```

### Video Generation

```typescript
// Generate video from image ID
const video = await client.generateVideo({
  imageId: '550e8400-e29b-41d4-a716-446655440000',
  duration: 5,  // 1-10 seconds
  fps: 16       // 8-32 fps
});

// Generate video from buffer
const video = await client.generateVideo({
  imageBuffer,
  duration: 5
});

console.log(video);
// {
//   success: true,
//   videoId: '660e8400-e29b-41d4-a716-446655440000',
//   duration: 5,
//   fps: 16
// }
```

### Text Generation (LLM)

```typescript
// Simple text generation
const result = await client.generateText({
  prompt: 'Write a short poem about AI and creativity'
});

console.log(result.response);

// With markdown formatting
const formatted = await client.generateText({
  prompt: 'Explain what TypeScript is. Use headers and code examples.',
  useMarkdown: true  // Response includes markdown formatting
});

console.log(formatted.response); // Contains # headers, ```code blocks```, bullet points, etc.

// With system message and memory
const result = await client.generateText({
  prompt: 'What were we discussing?',
  system: 'You are a helpful assistant',
  memory: [
    'User asked about AI capabilities',
    'Discussed image generation features'
  ]
});

// JSON format response
const result = await client.generateText({
  prompt: 'Analyze this product review',
  jsonFormat: true,
  jsonTemplate: {
    sentiment: 'positive/negative/neutral',
    score: '1-10',
    summary: 'brief summary'
  }
});

console.log(result.response); // Returns structured JSON

// With knowledge base
const result = await client.generateText({
  prompt: 'What is our refund policy?',
  askKnowledge: {
    sources: ['docs', 'policies'],
    query: 'refund policy'
  }
});

// Image description (Vision)
const imageResult = await client.generateImage({
  prompt: 'a futuristic city at night'
});

const description = await client.generateText({
  prompt: 'Analyze this image and extract structured data',
  system: 'Extract information from images into structured JSON format.',
  imageId: imageResult.imageId,  // Pass image for analysis
  jsonFormat: true,
  jsonTemplate: {
    main_subject: 'string - primary subject of the image',
    objects: 'array of strings - objects visible in the image',
    colors: 'array of strings - dominant colors',
    mood: 'string - overall mood/atmosphere'
  }
});

console.log(description.json);
// Output: { main_subject: "futuristic cityscape", objects: ["buildings", "lights", ...], ... }
```

### CDN Operations

The CDN supports multiple file formats and operations including format conversion, resizing, and watermarking.

#### Supported File Formats

| Format | Extension | Description |
|--------|-----------|-------------|
| JPEG | `.jpg`, `.jpeg` | Standard image format |
| PNG | `.png` | Lossless image format with transparency |
| GIF | `.gif` | Static or animated image format |
| MP4 | `.mp4` | Video format |

#### CDN URL Pattern

For advanced use cases, the CDN URL pattern is:
```
GET /api/v1/cdn/{id}.{format}?{queryParams}
```

> **Authentication Required**: CDN URLs require Bearer token authentication.
> You cannot use these URLs directly in browsers or `<img>` tags.
> Use `client.downloadFromCDN()` (recommended) or include the `Authorization: Bearer {apiKey}` header.

#### Format Conversion Matrix

| From \ To | PNG | JPG | JPEG | GIF |
|-----------|-----|-----|------|-----|
| PNG       | -   | Yes | Yes  | Yes |
| JPG       | Yes | -   | Yes  | Yes |
| JPEG      | Yes | Yes | -    | Yes |
| GIF       | Yes | Yes | Yes  | -   |
| MP4       | Yes | Yes | Yes  | Yes |

**Notes:**
- Converting animated GIF to other formats extracts the first frame
- MP4 to image formats extracts a single frame as still image
- Watermarking supported on all image formats including GIF

#### CDN Query Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `w` | Target width in pixels | `?w=1024` |
| `h` | Target height in pixels | `?h=768` |
| `watermark` | Watermark file ID | `?watermark=abc123` |
| `position` | Watermark position | `?position=southeast` |

**Watermark Positions:**
- Sharp gravity: `northwest`, `north`, `northeast`, `west`, `center`, `east`, `southwest`, `south`, `southeast`
- Human-readable: `top-left`, `top-center`, `top-right`, `middle-left`, `middle-center`, `middle-right`, `bottom-left`, `bottom-center`, `bottom-right`

#### Downloading Content

Use `downloadFromCDN()` to download images or videos with automatic authentication:

```typescript
import fs from 'fs';

// Download image as buffer
const { buffer, mimeType, size } = await client.downloadFromCDN(imageId);
fs.writeFileSync('image.jpg', buffer);
console.log(`Downloaded ${size} bytes (${mimeType})`);

// Download with format conversion (PNG)
const { buffer: pngBuffer } = await client.downloadFromCDN(imageId, { format: 'png' });
fs.writeFileSync('image.png', pngBuffer);

// Download with resize
const { buffer: thumbBuffer } = await client.downloadFromCDN(imageId, {
  format: 'jpg',
  width: 256,
  height: 256
});
fs.writeFileSync('thumbnail.jpg', thumbBuffer);

// Download video
const { buffer: videoBuffer } = await client.downloadFromCDN(videoId, { format: 'mp4' });
fs.writeFileSync('video.mp4', videoBuffer);

// Extract frame from video at 5 seconds
const { buffer: frameBuffer } = await client.downloadFromCDN(videoId, {
  format: 'jpg',
  seek: 5000  // milliseconds
});
fs.writeFileSync('frame-5s.jpg', frameBuffer);

// Download with watermark
const { buffer: wmBuffer } = await client.downloadFromCDN(imageId, {
  format: 'jpg',
  watermark: 'watermark-cdn-id',
  watermarkPosition: 'southeast'
});
fs.writeFileSync('watermarked.jpg', wmBuffer);
```

#### Manual Download with Axios

For advanced use cases, you can download directly using axios with the Authorization header:

```typescript
import axios from 'axios';
import fs from 'fs';

// Build CDN URL: baseUrl + /api/v1/cdn/{id}.{format}
const baseUrl = 'your-api-base-url';  // Use client's baseUrl or default

// Download image
const imageResponse = await axios.get(
  `${baseUrl}/api/v1/cdn/${imageId}.jpg`,
  {
    responseType: 'arraybuffer',
    headers: { 'Authorization': `Bearer ${apiKey}` }
  }
);
fs.writeFileSync('output.jpg', imageResponse.data);

// Download video
const videoResponse = await axios.get(
  `${baseUrl}/api/v1/cdn/${videoId}.mp4`,
  {
    responseType: 'arraybuffer',
    headers: { 'Authorization': `Bearer ${apiKey}` }
  }
);
fs.writeFileSync('output.mp4', videoResponse.data);
```

### Watermarking

```typescript
// Upload watermark and set as default
const settings = await client.getSettings();
await client.updateWatermark('watermark-cdn-id');

// Apply watermark to generation
const image = await client.generateImage({
  prompt: 'a beautiful landscape',
  watermark: 'watermark-cdn-id',
  watermarkPosition: 'southeast',  // bottom-right
  copyright: '2024 My Company'
});

// Tiled watermark (images only)
const image = await client.generateImage({
  prompt: 'product photography',
  watermark: 'watermark-cdn-id',
  watermarkAsTiles: true
});

// Apply watermark via CDN download
const { buffer } = await client.downloadFromCDN(imageId, {
  watermark: watermarkId,
  watermarkPosition: 'center'
});
```

### Settings & Usage Tracking

#### Understanding Rate Limits

Rate limits work differently depending on the operation type:

| Operation | Limit Type | What `requestsPer15Min` Means |
|-----------|------------|-------------------------------|
| Image | Concurrent | Max simultaneous image generations |
| Video | Concurrent | Max simultaneous video generations |
| LLM | Concurrent | Max simultaneous text generations |
| CDN | Rate-based | Requests per 15-minute window |

**For Image/Video/LLM:** You can have up to N operations running at once. When one completes, you can start another immediately.

**For CDN:** Traditional rate limiting - counter resets every 15 minutes.

```typescript
// Get API key settings with current usage
const settings = await client.getSettings();

console.log('API Key:', settings.name);
console.log('Status:', settings.status);
console.log('\nRate Limits:');
console.log('Image:', settings.rateLimits.image);
console.log('Video:', settings.rateLimits.video);
console.log('LLM:', settings.rateLimits.llm);
console.log('CDN:', settings.rateLimits.cdn);

// Current usage - note: image/video/llm show concurrent operations, cdn shows rate
console.log('\nCurrent Usage:');
console.log('Image (concurrent):', {
  active: settings.currentUsage.image.current.requestsPer15Min,      // Currently running
  limit: settings.rateLimits.image.requestsPer15Min,                  // Max concurrent
  available: settings.currentUsage.image.remaining.requestsPer15Min   // Capacity left
});

// LLM usage includes token tracking
console.log('LLM (concurrent):', {
  active: settings.currentUsage.llm.current.requestsPer15Min,
  limit: settings.rateLimits.llm.requestsPer15Min,
  tokensToday: settings.currentUsage.llm.current.tokensPerDay,
  tokenLimit: settings.rateLimits.llm.tokensPerDay
});

// CDN uses traditional rate limiting
console.log('CDN (rate-based):', {
  used15min: settings.currentUsage.cdn.current.requestsPer15Min,
  limit15min: settings.rateLimits.cdn.requestsPer15Min,
  resetAt: settings.currentUsage.cdn.resetAt.window15Min
});
```

### Rate Limit Checking

```typescript
// Check current rate limits for all operations
const limits = await client.checkLimits();

limits.forEach(limit => {
  console.log(`${limit.operation}:`);

  // For image/video/llm: shows concurrent operations (active/max)
  // For cdn: shows rate limit usage (used/limit per window)
  console.log(`  Active: ${limit.current.requestsPer15Min}/${limit.limit.requestsPer15Min}`);

  if (limit.operation === 'cdn') {
    console.log(`  Daily: ${limit.current.requestsPerDay}/${limit.limit.requestsPerDay}`);
  }

  if (limit.operation === 'llm') {
    console.log(`  Tokens today: ${limit.current.tokensPerDay}/${limit.limit.tokensPerDay}`);
  }
});
```

### Health Check

```typescript
const health = await client.health();
console.log(health);
// {
//   status: 'ok',
//   timestamp: '2024-01-15T10:30:00.000Z'
// }
```

---

## Advanced Usage

### Custom Dimensions

```typescript
const image = await client.generateImage({
  prompt: 'a mountain landscape',
  width: 1280,
  height: 720
  // Note: width/height must be between 320-1344
});
```

### Debug Mode

```typescript
const client = createClient('2dai_pk_your_api_key_here', {
  debug: true  // Enable detailed logging
});
```

---

## Complete Examples

### Example 1: Generate Image with Watermark and Download

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

### Example 2: Generate Video and Extract GIF Frame

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

    // Generate video from image
    const video = await client.generateVideo({
      imageId: image.imageId,
      duration: 3,
      fps: 16
    });
    console.log('Video generated:', video.videoId);

    // Download video as MP4
    const { buffer: mp4Buffer } = await client.downloadFromCDN(video.videoId, { format: 'mp4' });
    fs.writeFileSync('video.mp4', mp4Buffer);
    console.log('Video saved to video.mp4');

    // Extract first frame as GIF
    const { buffer: gifBuffer } = await client.downloadFromCDN(video.videoId, { format: 'gif' });
    fs.writeFileSync('thumbnail.gif', gifBuffer);
    console.log('GIF thumbnail saved to thumbnail.gif');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

generateVideoAndExtractFrame();
```

### Example 3: LLM with Memory and JSON Output

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

### Example 4: Batch Image Generation with Rate Limit Checking

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

## API Reference

### Types

```typescript
interface ImageGenerationOptions {
  prompt: string;
  style?: StylePreset | string;
  format?: FormatPreset | string;
  negativePrompt?: string;
  seed?: number;
  width?: number;
  height?: number;
  watermark?: string;
  watermarkPosition?: WatermarkPosition;
  watermarkAsTiles?: boolean;
  copyright?: string;
}

interface VideoGenerationOptions {
  imageId?: string;
  imageBuffer?: Buffer;
  duration?: number;  // 1-10 seconds
  fps?: number;       // 8-32 fps
  watermark?: string;
  watermarkPosition?: WatermarkPosition;
}

interface TextGenerationOptions {
  prompt: string;
  system?: string;
  memory?: string[];
  jsonFormat?: boolean;
  jsonTemplate?: { [key: string]: string };
  useRandomSeed?: boolean;
  askKnowledge?: {
    sources?: string[];
    query?: string;
  };
  useMarkdown?: boolean;  // Enable markdown formatting in response (default: false)
  imageId?: string;       // Image ID from CDN for vision/image analysis
}

interface UpscaleOptions {
  factor?: number;  // 2, 3, or 4 (default: 2)
  seed?: number;    // Optional seed for reproducibility
}

interface UpscaleResult {
  success: boolean;
  imageId: string;
  width: number;
  height: number;
  seed?: number;
}

interface OperationUsage {
  current: {
    requestsPer15Min: number;
    requestsPerDay: number;
    tokensPer15Min?: number;    // Only for LLM operations
    tokensPerDay?: number;       // Only for LLM operations
  };
  remaining: {
    requestsPer15Min: number;
    requestsPerDay: number;
  };
  resetAt: {
    window15Min: string;         // ISO timestamp
    daily: string;               // ISO timestamp
  };
}

interface APIKeySettings {
  key: string;
  name: string;
  status: 'active' | 'suspended';
  rateLimits: {
    image: RateLimitConfig;
    video: RateLimitConfig;
    llm: LLMRateLimitConfig;
    cdn: RateLimitConfig;
  };
  currentUsage?: {
    image: OperationUsage;
    video: OperationUsage;
    llm: OperationUsage;
    cdn: OperationUsage;
  };
  llmSettings?: any;
  createdAt?: string;
  lastUsedAt?: string;
}

type WatermarkPosition =
  // Sharp gravity constants (recommended)
  | 'center'
  | 'northwest' | 'north' | 'northeast'
  | 'west' | 'east'
  | 'southwest' | 'south' | 'southeast'
  // Human-readable alternatives
  | 'top-left' | 'top-center' | 'top-right'
  | 'middle-left' | 'middle-center' | 'middle-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right';
```

---

## Best Practices

### 1. Check Rate Limits Before Batch Operations

```typescript
const limits = await client.checkLimits();
const remaining = limits.find(l => l.operation === 'image')?.remaining.requestsPer15Min;

if (remaining && remaining < batchSize) {
  console.log(`Only ${remaining} requests available, reducing batch size`);
}
```

### 2. Use Appropriate Styles for Your Use Case

```typescript
import { STYLES } from '2dai-cloud-sdk';

// For realistic photos
STYLES.realistic.id

// For artistic/creative content
STYLES.paint.id

// For anime/manga content
STYLES.anime.id
STYLES.manga.id

// For cinematic shots
STYLES.cine.id
```

### 3. Handle Errors Gracefully

```typescript
try {
  const result = await client.generateImage({ prompt: 'test' });
} catch (error: any) {
  if (error.message.includes('RATE_LIMIT_EXCEEDED')) {
    // Wait and retry
    await new Promise(r => setTimeout(r, 60000));
  } else if (error.message.includes('INVALID_API_KEY')) {
    // Check API key configuration
  } else {
    // Log and handle other errors
    console.error('Generation failed:', error.message);
  }
}
```

### 4. Use Negative Prompts for Better Results (not fully supported yet)

```typescript
const result = await client.generateImage({
  prompt: 'a beautiful portrait of a woman',
  negativePrompt: 'blurry, distorted, low quality, bad anatomy, extra limbs'
});
```

### 5. Cache Generated Content

```typescript
// Store image IDs for reuse
const cache = new Map<string, string>();

async function getOrGenerate(prompt: string): Promise<string> {
  if (cache.has(prompt)) {
    return cache.get(prompt)!;
  }

  const result = await client.generateImage({ prompt });
  cache.set(prompt, result.imageId);
  return result.imageId;
}
```

### 6. Use Seeds for Reproducibility

```typescript
// Same seed = same result (with same prompt and settings)
const result1 = await client.generateImage({
  prompt: 'a red car',
  seed: 12345
});

const result2 = await client.generateImage({
  prompt: 'a red car',
  seed: 12345
});

// result1.imageId content will be identical to result2.imageId
```

---

## Troubleshooting

### Common Issues

#### "RATE_LIMIT_EXCEEDED" Error

**Problem:** You've exceeded your rate limit for the current time window.

**Solution:**
```typescript
const settings = await client.getSettings();
const resetTime = settings.currentUsage?.image.resetAt.window15Min;
console.log(`Rate limit resets at: ${resetTime}`);

// Wait for reset
const waitMs = new Date(resetTime).getTime() - Date.now();
await new Promise(r => setTimeout(r, waitMs + 1000));
```

#### "INVALID_API_KEY" Error

**Problem:** Your API key is invalid or expired.

**Solution:**
- Verify your API key starts with `2dai_pk_`
- Check that the key hasn't been revoked
- Ensure you're using the correct environment (production vs staging)

#### Timeout Errors

**Problem:** Requests are timing out.

**Solution:**
```typescript
const client = createClient('2dai_pk_...', {
  timeout: 600000  // Increase to 10 minutes for long operations
});
```

#### Image Quality Issues

**Problem:** Generated images don't match expectations.

**Solution:**
- Use more detailed, descriptive prompts (include lighting, style, mood, composition)
- Add negative prompts to exclude unwanted elements (requires style support)
- Try different styles for your use case (see [Available Styles](#available-styles))
- Use specific dimensions with the `format` parameter
- Experiment with different seeds for variations

**Need custom models or advanced features?** Contact us at [support@2dai.io](mailto:support@2dai.io) for:
- Custom fine-tuned models for your brand/style
- Higher rate limits and enterprise plans
- Priority support and dedicated infrastructure

#### CDN Download Failures

**Problem:** Cannot download files from CDN.

**Solution:**
```typescript
// Ensure Authorization header is included
const response = await axios.get(cdnUrl, {
  headers: { 'Authorization': `Bearer ${apiKey}` },
  responseType: 'arraybuffer',
  timeout: 30000
});
```

### Debug Mode

Enable debug mode to see detailed request/response logs:

```typescript
const client = createClient('2dai_pk_...', {
  debug: true
});
```

---

## Testing

This SDK includes comprehensive test suites covering all API functionality:

```bash
# Run all tests (REST + WebSocket)
npm test

# Run REST API tests only
npm run test:rest

# Run WebSocket tests only
npm run test:ws

# Run tests with coverage report
npm run test:coverage
```

### Test Performance

| Test Suite | Tests | Expected Time | Notes |
|------------|-------|---------------|-------|
| REST API (`test:rest`) | 20 | ~6-7 min | Image/video generation dominates |
| WebSocket (`test:ws`) | 26 | ~6 min | Similar generation overhead |
| Full Suite (`test`) | 46 | ~12-13 min | Both suites combined |

**Time breakdown by operation type:**
- Image Generation: ~28-37s per test (AI processing)
- Image Editing: ~45-50s per test (includes resize)
- Video Generation: ~100s per test (longest operation)
- Image Upscale: ~80-85s per test
- LLM Text Generation: ~2-11s per test (fast)
- CDN/GIF Operations: <1s per test (instant)
- Error Handling: <1s per test (validation only)

### Test Coverage

**REST API Tests (20 tests):**
- Image Generation (2): Default settings, style + format
- Image Editing (2): Basic edit, resize with dimensions
- Image Upscale (1): AI upscale 2x
- Video + CDN (4): Generation, MP4-to-GIF, resize
- LLM Text (5): Simple prompt, system + memory, JSON, vision, markdown
- Error Handling (3): Invalid API key, params, IDs
- Settings (1): API key settings with usage
- Frame Extraction (2): Multiple formats, resize + watermark
- Watermarks (1): Position constants

**WebSocket Tests (26 tests):**
- Connection & Auth (4): Connect, authenticate, reject invalid, ping/pong
- Image Generation (2): Default, style + format
- Image Editing (2): Basic edit, resize
- Image Upscale (1): AI upscale via WS
- Video Generation (1): 5-second video
- GIF/CDN (3): MP4-to-GIF, resize, position
- LLM Generation (4): Simple, system + memory + JSON, vision, markdown
- Error Handling (3): Missing prompt, invalid ID, invalid dimensions
- Connection Resilience (2): Graceful close, reconnection
- Client SDK Options (4): Connection state, WS options, timeout, REST integration

### Test Output

All tests display timestamps for performance monitoring:
```
================================================================================
🧪 TEST: Generate Image - Default Settings
⏱️  [20:23:05] Total: 0.0s | Since last: 0.0s
================================================================================
```

Generated files are saved to `tests/tmp/` for manual verification.

---

## Requirements

- Node.js 18 or higher
- TypeScript 5.0+ (for TypeScript projects)

---

## License

MIT
