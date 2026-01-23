/// <reference path="./matchers.d.ts" />
/// <reference types="jest" />

/**
 * REST API Tests
 * Core feature tests with CDN operations
 */

import { TwoDAIClient, createClient, STYLES, FORMATS, UPSCALE_FACTOR, WatermarkPosition } from '../src';
import { loadTestEnv } from './test-env';
import {
  logTestStart,
  saveImageFromCDN,
  saveVideoFromCDN,
  saveGifFromCDN,
  saveFrameFromCDN,
  saveImageManualAxios,
  ensureTmpDir
} from './test-helpers';
import * as fs from 'fs';
import * as path from 'path';
import imageSize from 'image-size';

describe('REST API Tests', () => {
  let client: TwoDAIClient;
  let config: ReturnType<typeof loadTestEnv>;
  let generatedImageId: string | undefined;
  let generatedVideoId: string | undefined;

  beforeAll(() => {
    config = loadTestEnv();
    client = createClient(config.apiKey, {
      baseUrl: config.baseUrl,
      debug: true
    });
  });

  describe('1. Image Generation (text2img)', () => {
    test('should generate image with default settings', async () => {
      logTestStart('Generate Image - Default Settings');
      console.log(`📝 Prompt: "${config.imagePrompt}"`);

      const result = await client.generateImage({
        prompt: config.imagePrompt
      });

      expect(result.success).toBe(true);
      expect(result.imageId).toBeValidCdnId();
      expect(result.width).toBeGreaterThan(0);
      expect(result.height).toBeGreaterThan(0);
      expect(typeof result.seed).toBe('number');

      // Store for later tests
      generatedImageId = result.imageId;

      console.log(`\n✅ Generation successful!`);
      console.log(`   Image ID: ${result.imageId}`);
      console.log(`   Dimensions: ${result.width}×${result.height}`);
      console.log(`   Seed: ${result.seed}`);

      await saveImageFromCDN(result.imageId, client, '01-default-settings.jpg');
    }, 200000);

    test('should generate image with style and format', async () => {
      logTestStart('Generate Image - Style + Format');
      console.log(`📝 Prompt: "${config.imagePrompt}"`);
      console.log(`🎨 Style: realistic`);
      console.log(`📐 Format: landscape (1344×768)`);

      const result = await client.generateImage({
        prompt: config.imagePrompt,
        style: STYLES.realistic.id,
        format: FORMATS.landscape.id
      });

      expect(result.success).toBe(true);
      expect(result.imageId).toBeValidCdnId();
      expect(result.width).toBe(1344);
      expect(result.height).toBe(768);

      // Fallback: set generatedImageId if first test failed/timed out
      if (!generatedImageId) {
        generatedImageId = result.imageId;
      }

      console.log(`\n✅ Generation successful!`);
      console.log(`   Image ID: ${result.imageId}`);
      console.log(`   Dimensions: ${result.width}×${result.height}`);

      await saveImageFromCDN(result.imageId, client, '02-styled-landscape.jpg');
    }, 200000);
  });

  describe('2. Image Editing (img2img)', () => {
    test('should edit existing image', async () => {
      logTestStart('Edit Image - Basic Edit');
      const imageId = generatedImageId || config.editImageId;

      if (!imageId) {
        console.warn('⚠️  Skipping img2img test: no image available');
        return;
      }

      console.log(`🖼️  Source Image ID: ${imageId}`);
      console.log(`📝 Edit Prompt: "make the image black and white"`);

      const result = await client.editImage(imageId, {
        prompt: 'make the image black and white'
      });

      expect(result.success).toBe(true);
      expect(result.imageId).toBeValidCdnId();
      expect(typeof result.seed).toBe('number');

      console.log(`\n✅ Edit successful!`);
      console.log(`   Original ID: ${imageId}`);
      console.log(`   New ID: ${result.imageId}`);
      await saveImageFromCDN(result.imageId, client, '03-edited-bw.jpg');
    }, 200000);

    test('should edit with resize dimensions', async () => {
      logTestStart('Edit Image - With Resize');
      const imageId = generatedImageId || config.editImageId;

      if (!imageId) {
        console.warn('⚠️  Skipping img2img resize test: no image available');
        return;
      }

      console.log(`🖼️  Source Image ID: ${imageId}`);
      console.log(`📝 Edit Prompt: "Seamlessly extend the image"`);
      console.log(`📐 Target size: 768×1344 (Portrait)`);

      const result = await client.editImage(imageId, {
        prompt: 'Seamlessly extend the image, remove the black background',
        width: 768,
        height: 1344
      });

      expect(result.success).toBe(true);
      expect(result.imageId).toBeValidCdnId();
      if (result.width > 0 && result.height > 0) {
        expect(result.width).toBe(768);
        expect(result.height).toBe(1344);
      }

      console.log(`\n✅ Edit with resize successful!`);
      console.log(`   New ID: ${result.imageId}`);
      console.log(`   Dimensions: ${result.width}×${result.height}`);
      await saveImageFromCDN(result.imageId, client, '04-edited-resize.jpg');
    }, 200000);
  });

  describe('3. Image Upscale (img2ximg)', () => {
    test('should upscale image with default factor', async () => {
      logTestStart('AI Upscale - Default Factor (2x)');
      const imageId = generatedImageId || config.editImageId;

      if (!imageId) {
        console.warn('⚠️  Skipping img2ximg test: no image available');
        return;
      }

      console.log(`🖼️  Source Image ID: ${imageId}`);
      console.log(`🔍 Upscale Factor: ${UPSCALE_FACTOR.DEFAULT}x`);

      const result = await client.upscaleImage(imageId);

      expect(result.success).toBe(true);
      expect(result.imageId).toBeValidCdnId();
      expect(result.width).toBeGreaterThan(0);
      expect(result.height).toBeGreaterThan(0);

      console.log(`\n✅ Upscale successful!`);
      console.log(`   New Image ID: ${result.imageId}`);
      console.log(`   Upscaled Dimensions: ${result.width}×${result.height}`);
      console.log(`   Seed: ${result.seed}`);

      await saveImageFromCDN(result.imageId, client, '05-upscaled-2x.jpg');
    }, 200000);
  });

  describe('4. Video Generation (img2vid)', () => {
    test('should generate video from image', async () => {
      logTestStart('Generate Video from Image');
      const imageId = generatedImageId || config.videoImageId;

      if (!imageId) {
        console.warn('⚠️  Skipping video test: no image available');
        return;
      }

      console.log(`🖼️  Source Image ID: ${imageId}`);
      console.log(`⏱️  Duration: 5 seconds`);
      console.log(`🎬 FPS: 16`);

      const result = await client.generateVideo({
        imageId,
        duration: 5,
        fps: 16
      });

      expect(result.success).toBe(true);
      expect(result.videoId).toBeValidCdnId();
      expect(result.duration).toBe(5);
      expect(result.fps).toBe(16);

      generatedVideoId = result.videoId;

      console.log(`\n✅ Video generation successful!`);
      console.log(`   Video ID: ${result.videoId}`);
      console.log(`   Duration: ${result.duration}s @ ${result.fps} FPS`);
      await saveVideoFromCDN(result.videoId, client, '06-video-5s.mp4');
    }, 200000);

    test('should convert MP4 to GIF (first frame)', async () => {
      logTestStart('MP4 to GIF - First Frame Extraction');
      const videoId = generatedVideoId;

      if (!videoId) {
        console.warn('⚠️  Skipping MP4 to GIF test: no video available from previous tests');
        return;
      }

      console.log(`🎬 Source Video ID: ${videoId}`);
      await saveGifFromCDN(videoId, client, '07-mp4-to-gif.gif');

      console.log(`\n✅ MP4 to GIF conversion successful!`);
    }, 120000);

    test('should resize GIF via downloadFromCDN', async () => {
      logTestStart('GIF Resize - 256x256');
      const videoId = generatedVideoId;

      if (!videoId) {
        console.warn('⚠️  Skipping GIF resize test: no video available from previous tests');
        return;
      }

      console.log(`🎬 Source Video ID: ${videoId}`);
      console.log(`📐 Target size: 256x256`);

      // Use client.downloadFromCDN() for resize
      const { buffer, mimeType, size } = await client.downloadFromCDN(videoId, {
        format: 'gif',
        width: 256,
        height: 256
      });

      expect(buffer).toBeInstanceOf(Buffer);
      expect(size).toBeGreaterThan(0);
      expect(mimeType).toContain('gif');

      // Verify actual dimensions match requested size
      const dimensions = imageSize(new Uint8Array(buffer));
      expect(dimensions.width).toBe(256);
      expect(dimensions.height).toBe(256);
      console.log(`   ✓ Verified dimensions: ${dimensions.width}×${dimensions.height}`);

      ensureTmpDir();
      const filepath = path.join(__dirname, 'tmp', '08-gif-resized-256x256.gif');
      fs.writeFileSync(filepath, new Uint8Array(buffer));

      console.log(`\n✅ GIF resize successful! (${size} bytes)`);
    }, 120000);
  });

  describe('5. Text Generation (LLM)', () => {
    test('should generate text with simple prompt and count tokens', async () => {
      logTestStart('Generate Text - Simple Prompt + Token Counting');
      console.log(`📝 Prompt: "${config.llmPrompt}"`);

      const result = await client.generateText({
        prompt: config.llmPrompt,
        useRandomSeed: true
      });

      expect(result.success).toBe(true);
      expect(result.response).toBeTruthy();
      expect(typeof result.response).toBe('string');
      expect(result.response.length).toBeGreaterThan(0);
      expect(typeof result.totalTokens).toBe('number');
      expect(result.totalTokens).toBeGreaterThan(0);

      console.log(`\n✅ Text generation successful!`);
      console.log(`   Response: ${result.response}`);
      console.log(`   Input tokens: ${result.inputTokens}`);
      console.log(`   Output tokens: ${result.outputTokens}`);
      console.log(`   Total tokens: ${result.totalTokens}`);
    }, 120000);

    test('should generate text with system prompt and memory context', async () => {
      logTestStart('Generate Text - System Prompt + Memory');
      const memory = [
        'User: What is TypeScript?',
        'Assistant: TypeScript is a typed superset of JavaScript.'
      ];
      console.log(`📝 Prompt: "Can you give me an example?"`);
      console.log(`⚙️  System: "You are a helpful coding assistant. Be concise."`);
      console.log(`🧠 Memory: ${memory.length} previous messages`);

      const result = await client.generateText({
        prompt: 'Can you give me an example?',
        system: 'You are a helpful coding assistant. Be concise.',
        memory
      });

      expect(result.success).toBe(true);
      expect(result.response).toBeTruthy();
      expect(result.totalTokens).toBeGreaterThan(0);

      console.log(`\n✅ System prompt + memory handled!`);
      console.log(`   Response: ${result.response.substring(0, 150)}...`);
    }, 120000);

    test('should generate JSON output (simple and complex)', async () => {
      logTestStart('Generate Text - JSON Format (Simple + Complex)');

      // Test complex JSON structure
      const jsonTemplate = {
        name: 'string - developer name',
        skills: 'array of programming language strings',
        level: 'string - junior/mid/senior',
        years_experience: 'number'
      };
      console.log(`📝 Prompt: "Generate a developer profile"`);
      console.log(`📋 JSON Template:`, JSON.stringify(jsonTemplate));

      const result = await client.generateText({
        prompt: 'Generate a fictional software developer profile with name, skills array, experience level, and years of experience',
        jsonFormat: true,
        jsonTemplate,
        useRandomSeed: true
      });

      expect(result.success).toBe(true);
      expect(result.json).toBeDefined();
      expect(result.json).toHaveProperty('name');
      expect(result.json).toHaveProperty('skills');
      expect(Array.isArray(result.json.skills)).toBe(true);
      expect(result.response).toBeTruthy(); // Backward compatibility

      console.log(`\n✅ JSON generation successful!`);
      console.log(`   Response:`, JSON.stringify(result.json, null, 2));
    }, 120000);

    test('should describe image with vision', async () => {
      logTestStart('Generate Text - Image Description (Vision)');
      const imageId = generatedImageId || config.editImageId;

      if (!imageId) {
        console.warn('⚠️  Skipping vision test: no image available');
        return;
      }

      console.log(`🖼️  Image ID: ${imageId}`);
      const jsonTemplate = {
        main_subject: 'string',
        colors: 'array of strings',
        mood: 'string'
      };

      const result = await client.generateText({
        prompt: 'Analyze this image and extract structured data',
        system: 'Extract information from images into structured JSON format.',
        imageId,
        jsonFormat: true,
        jsonTemplate
      });

      expect(result.success).toBe(true);
      if (result.json) {
        expect(result.json).toHaveProperty('main_subject');
        expect(result.json).toHaveProperty('colors');
        console.log(`\n✅ Vision analysis successful!`);
        console.log(`   Main Subject: ${result.json.main_subject}`);
        console.log(`   Colors: ${Array.isArray(result.json.colors) ? result.json.colors.join(', ') : result.json.colors}`);
      }
    }, 120000);

    test('should handle markdown and edge cases', async () => {
      logTestStart('Generate Text - Markdown + Edge Cases');

      // Test markdown with special characters and multi-line
      const prompt = `Explain this code with markdown formatting:

function add(a, b) {
  return a + b;
}

Use headers, bullet points, and handle "quotes" and <brackets>.`;

      const result = await client.generateText({
        prompt,
        useMarkdown: true
      });

      expect(result.success).toBe(true);
      expect(result.response).toBeTruthy();
      expect(result.response.length).toBeGreaterThan(0);

      console.log(`\n✅ Markdown + edge cases handled!`);
      console.log(`   Response length: ${result.response.length} chars`);
      console.log(`   Contains markdown: ${result.response.includes('#') || result.response.includes('-') || result.response.includes('`')}`);
    }, 120000);
  });

  describe('6. Text Streaming (SSE)', () => {
    test('should stream text with callbacks', async () => {
      logTestStart('REST Stream - Basic Callbacks');

      const chunks: string[] = [];
      console.log(`📝 Prompt: "${config.llmPrompt}"`);

      const controller = client.generateTextStream({
        prompt: config.llmPrompt,
        onChunk: (chunk) => {
          chunks.push(chunk);
          process.stdout.write(chunk);
        }
      });

      const finalResult = await controller.done;

      expect(chunks.length).toBeGreaterThan(0);
      expect(finalResult.success).toBe(true);
      expect(finalResult.response).toBeTruthy();
      expect(finalResult.response.length).toBeGreaterThan(0);

      console.log(`\n\n✅ Received ${chunks.length} chunks`);
      console.log(`   Total response: ${finalResult.response.length} chars`);
      if (finalResult.totalTokens) {
        console.log(`   Tokens used: ${finalResult.totalTokens}`);
      }
    }, 120000);

    test('should accumulate and verify full response', async () => {
      logTestStart('REST Stream - Full Accumulation');

      let accumulatedByCallback = '';
      console.log(`📝 Prompt: "Say 'Hello World' and nothing else"`);

      const controller = client.generateTextStream({
        prompt: "Say 'Hello World' and nothing else",
        onChunk: (chunk) => {
          accumulatedByCallback += chunk;
        }
      });

      const result = await controller.done;

      expect(accumulatedByCallback).toBe(result.response);
      expect(result.response.toLowerCase()).toContain('hello');

      console.log(`\n✅ Accumulation verified`);
      console.log(`   Response: "${result.response}"`);
    }, 120000);

    test('should handle stream abort', async () => {
      logTestStart('REST Stream - Abort');

      const chunks: string[] = [];
      console.log(`📝 Testing abort functionality...`);

      const controller = client.generateTextStream({
        prompt: 'Write a very long story about a journey across the world, describing every detail of every location visited.',
        onChunk: (chunk) => {
          chunks.push(chunk);
          process.stdout.write(chunk);
          if (chunks.length >= 5) {
            console.log('\n\n🛑 Aborting stream...');
            controller.abort();
          }
        },
        onError: (err) => {
          console.log(`   Note: ${err.message}`);
        }
      });

      const result = await controller.done;

      expect(result.success).toBe(false);
      expect(chunks.length).toBeGreaterThanOrEqual(5);

      console.log(`\n✅ Abort handled gracefully`);
      console.log(`   Chunks received before abort: ${chunks.length}`);
    }, 120000);

    test('should stream with system prompt and memory', async () => {
      logTestStart('REST Stream - System + Memory');

      const chunks: string[] = [];
      console.log(`📝 Testing memory/conversation context with streaming...`);

      const controller = client.generateTextStream({
        prompt: 'What was my favorite color?',
        system: 'You are a helpful assistant. Be concise.',
        memory: [
          'User: My favorite color is blue.',
          'Assistant: That\'s a great choice! Blue is often associated with calm and tranquility.'
        ],
        onChunk: (chunk) => {
          chunks.push(chunk);
          process.stdout.write(chunk);
        }
      });

      const result = await controller.done;

      expect(result.success).toBe(true);
      expect(result.response.toLowerCase()).toContain('blue');

      console.log(`\n\n✅ Memory context preserved in stream`);
      console.log(`   Response: "${result.response}"`);
    }, 120000);
  });

  describe('7. Error Handling', () => {
    test('should handle invalid API key', () => {
      expect(() => {
        new TwoDAIClient({
          apiKey: 'invalid_key',
          baseUrl: config.baseUrl
        });
      }).toThrow('Invalid API key format');
    });

    test('should handle invalid image generation params', async () => {
      // Missing prompt
      await expect(
        client.generateImage({ prompt: '' } as any)
      ).rejects.toThrow();

      // Invalid dimensions
      await expect(
        client.generateImage({ prompt: 'test', width: 100, height: 100 })
      ).rejects.toThrow();

      // Invalid seed
      await expect(
        client.generateImage({ prompt: 'test', seed: -1 })
      ).rejects.toThrow();

      console.log(`✅ Invalid params correctly rejected`);
    }, 30000);

    test('should handle invalid IDs for edit/video', async () => {
      // Invalid imageId for edit
      await expect(
        client.editImage('nonexistent_id', { prompt: 'test' })
      ).rejects.toThrow();

      // Invalid imageId for video
      await expect(
        client.generateVideo({ imageId: 'nonexistent_id' })
      ).rejects.toThrow();

      console.log(`✅ Invalid IDs correctly rejected`);
    }, 150000);
  });

  describe('8. Settings & Info', () => {
    test('should get API key settings with current usage', async () => {
      logTestStart('Get API Key Settings');

      try {
        const settings = await client.getSettings();

        console.log('\nSettings received (JSON):');
        console.log(JSON.stringify(settings, null, 2));

        expect(settings).toBeDefined();
        expect(settings.status).toBe('active');
        expect(settings.rateLimits).toBeDefined();

        // Verify currentUsage is present
        expect(settings.currentUsage).toBeDefined();
        expect(settings.currentUsage?.image).toBeDefined();
        expect(settings.currentUsage?.video).toBeDefined();
        expect(settings.currentUsage?.llm).toBeDefined();
        expect(settings.currentUsage?.cdn).toBeDefined();

        // Verify structure of currentUsage
        const imageUsage = settings.currentUsage?.image;
        expect(imageUsage?.current).toBeDefined();
        expect(imageUsage?.remaining).toBeDefined();
        expect(imageUsage?.resetAt).toBeDefined();
        expect(typeof imageUsage?.current.requestsPer15Min).toBe('number');
        expect(typeof imageUsage?.current.requestsPerDay).toBe('number');

        console.log('✅ API Key settings retrieved successfully');
        console.log('\n📊 Current Usage Summary:');
        console.log(`   Image: ${imageUsage?.current.requestsPer15Min}/${settings.rateLimits.image.requestsPer15Min} (15min)`);
        console.log(`   Video: ${settings.currentUsage?.video.current.requestsPer15Min}/${settings.rateLimits.video.requestsPer15Min} (15min)`);
        console.log(`   LLM: ${settings.currentUsage?.llm.current.requestsPer15Min}/${settings.rateLimits.llm.requestsPer15Min} (15min)`);
        console.log(`   CDN: ${settings.currentUsage?.cdn.current.requestsPer15Min}/${settings.rateLimits.cdn.requestsPer15Min} (15min)`);
      } catch (error: any) {
        console.error('\n❌ Error getting settings:', error.message);
        throw error;
      }
    }, 30000);
  });

  describe('9. Video Frame Extraction (CDN)', () => {
    let testVideoId: string | undefined;

    beforeAll(async () => {
      testVideoId = generatedVideoId || config.videoId;
    });

    test('should extract frames at different times and formats (JPG/PNG)', async () => {
      logTestStart('Frame Extraction - Multiple Times + Formats');

      if (!testVideoId) {
        console.warn('⚠️  Skipping test: no video available');
        return;
      }

      console.log(`🎬 Video ID: ${testVideoId}`);

      // Test JPG at 0ms using client method
      const { buffer: jpgBuffer, mimeType: jpgMime } = await client.downloadFromCDN(testVideoId, {
        format: 'jpg',
        seek: 0
      });
      expect(jpgBuffer).toBeInstanceOf(Buffer);
      expect(jpgMime).toContain('image/jpeg');
      console.log(`   ✓ JPG at 0ms`);

      // Test PNG at 1500ms using client method
      const { buffer: pngBuffer, mimeType: pngMime } = await client.downloadFromCDN(testVideoId, {
        format: 'png',
        seek: 1500
      });
      expect(pngBuffer).toBeInstanceOf(Buffer);
      expect(pngMime).toContain('image/png');
      console.log(`   ✓ PNG at 1500ms`);

      await saveFrameFromCDN(testVideoId, client, 0, '09-frame-0ms.jpg', 'jpg');
      console.log(`\n✅ Frame extraction with multiple formats successful!`);
    }, 90000);

    test('should extract frame with resize and watermark', async () => {
      logTestStart('Frame Extraction - Resize + Watermark');

      if (!testVideoId) {
        console.warn('⚠️  Skipping test: no video available');
        return;
      }

      console.log(`🎬 Video ID: ${testVideoId}`);

      // Test resize using client method
      const { buffer: resizeBuffer, mimeType } = await client.downloadFromCDN(testVideoId, {
        format: 'jpg',
        seek: 1000,
        width: 256,
        height: 256
      });
      expect(resizeBuffer).toBeInstanceOf(Buffer);
      expect(mimeType).toContain('image/jpeg');

      // Verify actual dimensions match requested size
      const dimensions = imageSize(new Uint8Array(resizeBuffer));
      expect(dimensions.width).toBe(256);
      expect(dimensions.height).toBe(256);
      console.log(`   ✓ Resize to 256x256 (verified: ${dimensions.width}×${dimensions.height})`);

      ensureTmpDir();
      fs.writeFileSync(path.join(__dirname, 'tmp', '12-frame-resized-256x256.jpg'), new Uint8Array(resizeBuffer));

      // Test watermark if configured
      if (config.watermarkId) {
        const { buffer: wmBuffer } = await client.downloadFromCDN(testVideoId, {
          format: 'jpg',
          seek: 1000,
          watermark: config.watermarkId,
          watermarkPosition: 'center'
        });
        expect(wmBuffer).toBeInstanceOf(Buffer);
        fs.writeFileSync(path.join(__dirname, 'tmp', '13-frame-with-watermark.jpg'), new Uint8Array(wmBuffer));
        console.log(`   ✓ Watermark applied`);
      } else {
        console.log(`   ⚠️  Watermark skipped (TEST_WATERMARK_ID not set)`);
      }

      console.log(`\n✅ Frame extraction with resize/watermark successful!`);
    }, 90000);
  });

  describe('10. Watermark Position Constants (CDN)', () => {
    test('should apply watermark at different positions', async () => {
      logTestStart('Watermark Positions Test');

      if (!generatedImageId && !config.editImageId) {
        console.warn('⚠️  Skipping test: no image available');
        return;
      }

      if (!config.watermarkId) {
        console.warn('⚠️  Skipping test: TEST_WATERMARK_ID not configured');
        return;
      }

      const imageId = generatedImageId || config.editImageId;
      const positions: WatermarkPosition[] = ['southeast', 'center', 'northwest'];

      console.log(`🖼️  Image ID: ${imageId}`);
      console.log(`💧 Watermark ID: ${config.watermarkId}`);
      console.log(`📍 Testing ${positions.length} positions: ${positions.join(', ')}`);

      for (let i = 0; i < positions.length; i++) {
        const position = positions[i];
        console.log(`\n🔄 [${i + 1}/${positions.length}] Testing position: ${position}...`);

        const { buffer, mimeType } = await client.downloadFromCDN(imageId!, {
          format: 'jpg',
          watermark: config.watermarkId,
          watermarkPosition: position
        });

        expect(buffer).toBeInstanceOf(Buffer);
        expect(mimeType).toContain('image/jpeg');

        ensureTmpDir();
        const filepath = path.join(__dirname, 'tmp', `14-watermark-${position}.jpg`);
        fs.writeFileSync(filepath, new Uint8Array(buffer));
        console.log(`   ✅ Position ${position}: saved`);
      }

      console.log(`\n✅ All ${positions.length} watermark position tests completed!`);
    }, 200000);
  });

  describe('11. CDN Download - Manual Axios (Documentation)', () => {
    test('should download using manual axios call', async () => {
      logTestStart('Manual Axios Download - For Documentation');
      const imageId = generatedImageId || config.editImageId;

      if (!imageId) {
        console.warn('⚠️  Skipping test: no image available');
        return;
      }

      console.log(`🖼️  Image ID: ${imageId}`);
      console.log(`📝 This test demonstrates manual axios download with Authorization header`);

      // Use the manual axios helper to show direct download pattern
      const filepath = await saveImageManualAxios(
        imageId,
        config.baseUrl,
        config.apiKey,
        '15-manual-axios-download.jpg'
      );

      expect(fs.existsSync(filepath)).toBe(true);
      const stats = fs.statSync(filepath);
      expect(stats.size).toBeGreaterThan(0);

      console.log(`\n✅ Manual axios download successful!`);
      console.log(`   File size: ${stats.size} bytes`);
    }, 120000);
  });
});
