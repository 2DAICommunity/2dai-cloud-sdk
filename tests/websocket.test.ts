/// <reference path="./matchers.d.ts" />

/**
 * WebSocket API Tests (Optimized)
 * Core feature tests with CDN operations
 */

import WebSocket from 'ws';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { TwoDAIClient, createClient, STYLES, FORMATS, UPSCALE_FACTOR, WatermarkPosition, WS_DEFAULTS } from '../src';
import { loadTestEnv } from './test-env';
import { logTestStart, saveImageFromCDN, saveVideoFromCDN, saveGifFromCDN, ensureTmpDir } from './test-helpers';

describe('WebSocket API Tests', () => {
  let config: ReturnType<typeof loadTestEnv>;
  let client: TwoDAIClient | null = null;
  let generatedImageId: string | undefined;
  let generatedVideoId: string | undefined;

  beforeAll(() => {
    config = loadTestEnv();
  });

  afterEach(async () => {
    if (client) {
      await client.close();
      client = null;
    }
  });

  afterAll(async () => {
    // Ensure cleanup and allow time for connections to close
    if (client) {
      await client.close();
      client = null;
    }
    // Small delay to allow any pending async operations to complete
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  describe('1. Connection & Authentication', () => {
    test('should connect to WebSocket server', async () => {
      logTestStart('WebSocket - Connect to Server');
      const wsUrl = config.baseUrl.replace('http://', 'ws://').replace('https://', 'wss://');
      console.log(`🔌 WebSocket URL: ${wsUrl}/ws/generation`);

      const ws = new WebSocket(`${wsUrl}/ws/generation`);

      await new Promise((resolve, reject) => {
        ws.on('open', resolve);
        ws.on('error', reject);
        setTimeout(() => reject(new Error('Connection timeout')), 10000);
      });

      expect(ws.readyState).toBe(WebSocket.OPEN);
      console.log(`\n✅ WebSocket connection established!`);
      ws.close();
    }, 15000);

    test('should authenticate with valid API key', async () => {
      logTestStart('WebSocket - Authenticate');
      console.log(`🔑 Authenticating with API key...`);

      client = createClient(config.apiKey, { baseUrl: config.baseUrl, debug: true, wsAutoReconnect: false });
      await client.wsConnect();

      expect(client.wsIsConnected()).toBe(true);
      console.log(`\n✅ Authentication successful!`);
    }, 15000);

    test('should reject invalid API key', async () => {
      logTestStart('WebSocket - Reject Invalid Auth');
      console.log(`🔑 Testing authentication with invalid key...`);

      const wsUrl = config.baseUrl.replace('http://', 'ws://').replace('https://', 'wss://');
      const socket = new WebSocket(`${wsUrl}/ws/generation`);

      const authFailed = await new Promise((resolve) => {
        socket.on('open', () => {
          socket.send(JSON.stringify({
            type: 'auth',
            data: { apiKey: 'invalid_key' }
          }));
        });

        socket.on('message', (data) => {
          const message = JSON.parse(data.toString());
          if (message.type === 'error') {
            resolve(true);
          }
        });

        setTimeout(() => resolve(false), 5000);
      });

      expect(authFailed).toBe(true);
      console.log(`\n✅ Invalid authentication correctly rejected!`);
      socket.close();
    }, 15000);

    test('should handle ping/pong', async () => {
      logTestStart('WebSocket - Ping/Pong');
      client = createClient(config.apiKey, { baseUrl: config.baseUrl, debug: true, wsAutoReconnect: false });
      await client.wsConnect();
      console.log(`🏓 Testing application-level ping...`);

      const wsUrl = config.baseUrl.replace('http://', 'ws://').replace('https://', 'wss://');
      const ws = new WebSocket(`${wsUrl}/ws/generation`);

      const pongReceived = await new Promise((resolve) => {
        ws.on('open', () => {
          ws.send(JSON.stringify({ type: 'auth', data: { apiKey: config.apiKey } }));
        });

        ws.on('message', (data) => {
          const message = JSON.parse(data.toString());
          if (message.type === 'auth_success') {
            ws.send(JSON.stringify({ type: 'ping' }));
          } else if (message.type === 'pong') {
            resolve(true);
          }
        });

        setTimeout(() => resolve(false), 5000);
      });

      expect(pongReceived).toBe(true);
      console.log(`\n✅ Pong received!`);
      ws.close();
    }, 15000);
  });

  describe('2. Image Generation via WebSocket', () => {
    test('should generate image with default settings', async () => {
      logTestStart('WS Generate Image - Default Settings');
      client = createClient(config.apiKey, { baseUrl: config.baseUrl, debug: true, wsAutoReconnect: false });
      await client.wsConnect();
      console.log(`📝 Prompt: "${config.imagePrompt}"`);

      const result = await client.wsGenerateImage({
        prompt: config.imagePrompt
      });

      expect(result.result).toBeDefined();
      expect(result.result.imageId).toBeTruthy();
      expect(result.result.width).toBeGreaterThan(0);
      expect(result.result.height).toBeGreaterThan(0);
      expect(typeof result.result.seed).toBe('number');

      generatedImageId = result.result.imageId;

      console.log(`\n✅ WS image generation successful!`);
      console.log(`   Image ID: ${result.result.imageId}`);
      console.log(`   Dimensions: ${result.result.width}×${result.result.height}`);
      console.log(`   Seed: ${result.result.seed}`);

      await saveImageFromCDN(result.result.imageId, config.baseUrl, 'ws-01-default.jpg', config.apiKey);
    }, 300000);

    test('should generate image with style and format', async () => {
      logTestStart('WS Generate Image - Style + Format');
      client = createClient(config.apiKey, { baseUrl: config.baseUrl, debug: true, wsAutoReconnect: false });
      await client.wsConnect();
      console.log(`📝 Prompt: "${config.imagePrompt}"`);
      console.log(`🎨 Style: realistic`);
      console.log(`📐 Format: landscape (1344×768)`);

      const result = await client.wsGenerateImage({
        prompt: config.imagePrompt,
        style: STYLES.realistic.id,
        format: FORMATS.landscape.id
      });

      expect(result.result.imageId).toBeTruthy();
      expect(result.result.width).toBe(1344);
      expect(result.result.height).toBe(768);

      // Fallback: set generatedImageId if first test failed/timed out
      if (!generatedImageId) {
        generatedImageId = result.result.imageId;
      }

      console.log(`\n✅ WS image with style+format generated!`);
      console.log(`   Image ID: ${result.result.imageId}`);
      console.log(`   Dimensions: ${result.result.width}×${result.result.height}`);
      await saveImageFromCDN(result.result.imageId, config.baseUrl, 'ws-02-styled-landscape.jpg', config.apiKey);
    }, 200000);
  });

  describe('3. Image Editing via WebSocket', () => {
    test('should edit existing image', async () => {
      logTestStart('WS Edit Image - Basic Edit');
      if (!generatedImageId && !config.editImageId) {
        console.warn('⚠️  Skipping WS img2img test: no image available');
        return;
      }

      const imageId = generatedImageId || config.editImageId;
      client = createClient(config.apiKey, { baseUrl: config.baseUrl, debug: true, wsAutoReconnect: false });
      await client.wsConnect();
      console.log(`🖼️  Source Image ID: ${imageId}`);
      console.log(`📝 Edit Prompt: "make the image black and white"`);

      const result = await client.wsGenerateImage({
        imageId,
        prompt: 'make the image black and white'
      });

      expect(result.result.imageId).toBeTruthy();

      console.log(`\n✅ WS image edit successful! New ID: ${result.result.imageId}`);
      await saveImageFromCDN(result.result.imageId, config.baseUrl, 'ws-03-edited-bw.jpg', config.apiKey);
    }, 200000);

    test('should edit with resize dimensions', async () => {
      logTestStart('WS Edit Image - With Resize');
      if (!generatedImageId && !config.editImageId) {
        console.warn('⚠️  Skipping WS img2img resize test: no image available');
        return;
      }

      const imageId = generatedImageId || config.editImageId;
      client = createClient(config.apiKey, { baseUrl: config.baseUrl, debug: true, wsAutoReconnect: false });
      await client.wsConnect();
      console.log(`🖼️  Source Image ID: ${imageId}`);
      console.log(`📝 Edit Prompt: "Seamlessly extend the image"`);
      console.log(`📐 Target dimensions: 768×1344 (portrait)`);

      const result = await client.wsGenerateImage({
        imageId,
        prompt: 'Seamlessly extend the image, remove the black background',
        width: 768,
        height: 1344
      });

      expect(result.result.imageId).toBeTruthy();
      expect(result.result.width).toBe(768);
      expect(result.result.height).toBe(1344);

      console.log(`\n✅ WS img2img resize successful!`);
      console.log(`   New ID: ${result.result.imageId}`);
      console.log(`   Dimensions: ${result.result.width}×${result.result.height}`);
      await saveImageFromCDN(result.result.imageId, config.baseUrl, 'ws-04-edited-resize.jpg', config.apiKey);
    }, 200000);
  });

  describe('4. Image Upscale via WebSocket (img2ximg)', () => {
    test('should upscale image with default factor', async () => {
      logTestStart('WS AI Upscale - Default Factor (2x)');
      if (!generatedImageId && !config.editImageId) {
        console.warn('⚠️  Skipping WS img2ximg test: no image available');
        return;
      }

      const imageId = generatedImageId || config.editImageId;
      client = createClient(config.apiKey, { baseUrl: config.baseUrl, debug: true, wsAutoReconnect: false });
      await client.wsConnect();
      console.log(`🖼️  Source Image ID: ${imageId}`);
      console.log(`🔍 Upscale Factor: ${UPSCALE_FACTOR.DEFAULT}x`);

        const result = await client.wsUpscaleImage({
          imageId: imageId!
      });

        expect(result.result).toBeDefined();
        expect(result.result.imageId).toBeTruthy();
        expect(result.result.width).toBeGreaterThan(0);
        expect(result.result.height).toBeGreaterThan(0);

        console.log(`\n✅ WS upscale successful!`);
        console.log(`   New Image ID: ${result.result.imageId}`);
        console.log(`   Upscaled Dimensions: ${result.result.width}×${result.result.height}`);
        console.log(`   Seed: ${result.result.seed}`);

        await saveImageFromCDN(result.result.imageId, config.baseUrl, 'ws-05-upscaled-2x.jpg', config.apiKey);
    }, 200000);
  });

  describe('5. Video Generation via WebSocket', () => {
    test('should generate video from image', async () => {
      logTestStart('WS Generate Video - 5 seconds');
      if (!generatedImageId && !config.videoImageId) {
        console.warn('⚠️  Skipping WS video test: no image available');
        return;
      }

      const imageId = generatedImageId || config.videoImageId;
      client = createClient(config.apiKey, { baseUrl: config.baseUrl, debug: true, wsAutoReconnect: false });
      await client.wsConnect();
      console.log(`🖼️  Source Image ID: ${imageId}`);
      console.log(`⏱️  Duration: 5 seconds`);
      console.log(`🎬 FPS: 16`);

      const result = await client.wsGenerateVideo({
        imageId: imageId!,
        duration: 5,
        fps: 16
      });

      expect(result.result.videoId).toBeTruthy();
      expect(result.result.duration).toBe(5);
      expect(result.result.fps).toBe(16);

      generatedVideoId = result.result.videoId;

      console.log(`\n✅ WS video generation successful!`);
      console.log(`   Video ID: ${result.result.videoId}`);
      console.log(`   Duration: ${result.result.duration}s @ ${result.result.fps} FPS`);

      await saveVideoFromCDN(result.result.videoId, config.baseUrl, 'ws-06-video-5s.mp4', config.apiKey);
    }, 190000);
  });

  describe('6. GIF Operations (CDN)', () => {
    test('should convert MP4 to GIF (first frame)', async () => {
      logTestStart('WS MP4 to GIF - First Frame');
      const videoId = generatedVideoId;

      if (!videoId) {
        console.warn('⚠️  Skipping MP4 to GIF test: no video available from previous tests');
        return;
      }

      console.log(`🎬 Source Video ID: ${videoId}`);
      await saveGifFromCDN(videoId, config.baseUrl, 'ws-07-mp4-to-gif.gif', config.apiKey);

      console.log(`\n✅ WS MP4 to GIF conversion successful!`);
    }, 60000);

    test('should resize GIF via CDN query params', async () => {
      logTestStart('WS GIF Resize - 256x256');
      const videoId = generatedVideoId;

      if (!videoId) {
        console.warn('⚠️  Skipping GIF resize test: no video available from previous tests');
        return;
      }

      console.log(`🎬 Source Video ID: ${videoId}`);
      console.log(`📐 Target size: 256x256`);

      const url = `${config.baseUrl}/api/v1/cdn/${videoId}.gif?w=256&h=256`;
      ensureTmpDir();

      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000,
        headers: config.apiKey ? { 'Authorization': `Bearer ${config.apiKey}` } : {}
      });

      const filepath = path.join(__dirname, 'tmp', 'ws-08-gif-resized-256x256.gif');
      fs.writeFileSync(filepath, response.data);

      console.log(`\n✅ WS GIF resize successful!`);
    }, 60000);

    test('should apply position to GIF', async () => {
      logTestStart('WS GIF Position');
      const videoId = generatedVideoId;

      if (!videoId) {
        console.warn('⚠️  Skipping GIF position test: no video available from previous tests');
        return;
      }

      const position: WatermarkPosition = 'center';
      console.log(`🎬 Source Video ID: ${videoId}`);
      console.log(`📍 Position: ${position}`);

      const url = `${config.baseUrl}/api/v1/cdn/${videoId}.gif?position=${position}`;
      ensureTmpDir();

      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000,
        headers: config.apiKey ? { 'Authorization': `Bearer ${config.apiKey}` } : {}
      });

      const filepath = path.join(__dirname, 'tmp', 'ws-09-gif-with-position.gif');
      fs.writeFileSync(filepath, response.data);

      console.log(`\n✅ WS GIF with position param successful!`);
    }, 60000);
  });

  describe('7. LLM Generation via WebSocket', () => {
    test('should generate text with simple prompt', async () => {
      logTestStart('WS Generate Text - Simple Prompt');
      client = createClient(config.apiKey, { baseUrl: config.baseUrl, debug: true, wsAutoReconnect: false });
      await client.wsConnect();
      console.log(`📝 Prompt: "${config.llmPrompt}"`);

      const result = await client.wsGenerateLlm({
        prompt: config.llmPrompt,
        useRandomSeed: true
      }, 60000);

      expect(result.result).toBeDefined();
      expect(result.result.text).toBeTruthy();
      expect(typeof result.result.text).toBe('string');
      expect(result.result.tokensUsed).toBeGreaterThan(0);

      console.log(`\n✅ WS text generation successful!`);
      console.log(`   Response: ${result.result.text}`);
      console.log(`   Tokens used: ${result.result.tokensUsed}`);
    }, 70000);

    test('should generate text with system prompt, memory and JSON', async () => {
      logTestStart('WS Generate Text - System + Memory + JSON');
      client = createClient(config.apiKey, { baseUrl: config.baseUrl, debug: true, wsAutoReconnect: false });
      await client.wsConnect();

      const memory = [
        'User: What programming languages do you know?',
        'Assistant: I know many languages including Python, JavaScript, and TypeScript.'
      ];
      const jsonTemplate = {
        topic: 'string',
        languages: 'array of strings',
        recommendation: 'string'
      };

      console.log(`📝 Prompt: "Based on our conversation, recommend one language for web dev"`);
      console.log(`⚙️  System: "You are a helpful coding assistant."`);
      console.log(`🧠 Memory: ${memory.length} previous messages`);

      const result = await client.wsGenerateLlm({
        prompt: 'Based on our conversation, recommend one language for web development and explain why',
        system: 'You are a helpful coding assistant. Be concise.',
        memory,
        jsonFormat: true,
        jsonTemplate
      }, 60000);

      expect(result.result).toBeDefined();
      if (result.result.json) {
        expect(result.result.json).toHaveProperty('topic');
        expect(result.result.json).toHaveProperty('languages');
        console.log(`\n✅ WS system + memory + JSON successful!`);
        console.log(`   Response:`, JSON.stringify(result.result.json, null, 2));
      } else if (result.result.text) {
        console.log(`\n✅ WS generation successful (text mode)!`);
        console.log(`   Response: ${result.result.text.substring(0, 150)}...`);
      }
    }, 70000);

    test('should describe image with vision', async () => {
      logTestStart('WS Generate Text - Image Description (Vision)');
      const imageId = generatedImageId || config.editImageId;

      if (!imageId) {
        console.warn('⚠️  Skipping WS vision test: no image available');
        return;
      }

      client = createClient(config.apiKey, { baseUrl: config.baseUrl, debug: true, wsAutoReconnect: false });
      await client.wsConnect();

      console.log(`🖼️  Image ID: ${imageId}`);
      const jsonTemplate = {
        main_subject: 'string',
        colors: 'array of strings',
        mood: 'string'
      };

      const result = await client.wsGenerateLlm({
        prompt: 'Analyze this image and extract structured data',
        system: 'Extract information from images into structured JSON format.',
        imageId,
        jsonFormat: true,
        jsonTemplate
      }, 120000);

      expect(result.result).toBeDefined();
      if (result.result.json) {
        expect(result.result.json).toHaveProperty('main_subject');
        console.log(`\n✅ WS vision analysis successful!`);
        console.log(`   Main Subject: ${result.result.json.main_subject}`);
      }
    }, 130000);

    test('should handle markdown and edge cases', async () => {
      logTestStart('WS Generate Text - Markdown + Edge Cases');
      client = createClient(config.apiKey, { baseUrl: config.baseUrl, debug: true, wsAutoReconnect: false });
      await client.wsConnect();

      // Test markdown with special characters and multi-line
      const prompt = `Explain this code with markdown:

function greet(name) {
  return "Hello, " + name;
}

Use headers and handle "quotes" and <brackets>.`;

      const result = await client.wsGenerateLlm({
        prompt,
        useMarkdown: true
      }, 60000);

      expect(result.result).toBeDefined();
      expect(result.result.text).toBeTruthy();
      expect(result.result.text.length).toBeGreaterThan(0);

      console.log(`\n✅ WS Markdown + edge cases handled!`);
      console.log(`   Response length: ${result.result.text.length} chars`);
    }, 70000);
  });

  describe('8. Error Handling via WebSocket', () => {
    test('should handle missing prompt', async () => {
      logTestStart('WS Error - Missing Prompt');
      client = createClient(config.apiKey, { baseUrl: config.baseUrl, debug: true, wsAutoReconnect: false });
      await client.wsConnect();

      await expect(
        client.wsGenerateImage({} as any)
      ).rejects.toThrow();
    }, 30000);

    test('should handle invalid imageId', async () => {
      logTestStart('WS Error - Invalid ImageId');
      client = createClient(config.apiKey, { baseUrl: config.baseUrl, debug: true, wsAutoReconnect: false });
      await client.wsConnect();

      await expect(
        client.wsGenerateVideo({
          imageId: 'nonexistent_id'
        })
      ).rejects.toThrow();
    }, 30000);

    test('should handle invalid dimensions', async () => {
      logTestStart('WS Error - Invalid Dimensions');
      client = createClient(config.apiKey, { baseUrl: config.baseUrl, debug: true, wsAutoReconnect: false });
      await client.wsConnect();

      await expect(
        client.wsGenerateImage({
          prompt: 'test',
          width: 100,
          height: 100
        })
      ).rejects.toThrow();
    }, 30000);
  });

  describe('9. Connection Resilience', () => {
    test('should handle connection close gracefully', async () => {
      logTestStart('WS Resilience - Graceful Close');
      client = createClient(config.apiKey, { baseUrl: config.baseUrl, debug: true, wsAutoReconnect: false });
      await client.wsConnect();

      expect(client.wsIsConnected()).toBe(true);
      await client.close();
      expect(client.wsIsConnected()).toBe(false);
    }, 10000);

    test('should allow reconnection after disconnect', async () => {
      logTestStart('WS Resilience - Reconnection');
      // First connection
      client = createClient(config.apiKey, { baseUrl: config.baseUrl, debug: true, wsAutoReconnect: false });
      await client.wsConnect();
      expect(client.wsIsConnected()).toBe(true);
      await client.close();

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Second connection
      client = createClient(config.apiKey, { baseUrl: config.baseUrl, debug: true, wsAutoReconnect: false });
      await client.wsConnect();
      expect(client.wsIsConnected()).toBe(true);
    }, 30000);
  });

  describe('10. Client SDK Options & Behavior', () => {
    test('should report not connected before wsConnect and handle multiple connects', async () => {
      logTestStart('Client WS - Connection State');

      // Not connected initially
      client = createClient(config.apiKey, { baseUrl: config.baseUrl });
      expect(client.wsIsConnected()).toBe(false);
      console.log(`   ✓ wsIsConnected() returns false before connect`);

      // First connect
      await client.wsConnect();
      expect(client.wsIsConnected()).toBe(true);
      console.log(`   ✓ First connect successful`);

      // Multiple connects should be handled gracefully
      await client.wsConnect();
      expect(client.wsIsConnected()).toBe(true);
      console.log(`   ✓ Multiple wsConnect() calls handled`);

      console.log(`\n✅ Connection state management works correctly!`);
    }, 15000);

    test('should use default and custom WebSocket options', async () => {
      logTestStart('Client WS - Options');

      // Verify defaults are exported
      expect(WS_DEFAULTS.PING_INTERVAL_MS).toBe(30000);
      expect(WS_DEFAULTS.RECONNECT_INTERVAL_MS).toBe(1000);
      expect(WS_DEFAULTS.MAX_RECONNECT_DELAY_MS).toBe(30000);
      expect(WS_DEFAULTS.AUTO_RECONNECT).toBe(true);
      console.log(`   ✓ Default WS options verified`);

      // Create client with custom options
      client = createClient(config.apiKey, {
        baseUrl: config.baseUrl,
        debug: true,
        wsAutoReconnect: false,
        wsPingIntervalMs: 15000,
        wsReconnectIntervalMs: 2000
      });

      await client.wsConnect();
      expect(client.wsIsConnected()).toBe(true);
      console.log(`   ✓ Custom WS options accepted`);

      console.log(`\n✅ WS options work correctly!`);
    }, 15000);

    test('should handle request timeout and send without connection', async () => {
      logTestStart('Client WS - Timeout & Error Handling');

      // Test send without connection
      const disconnectedClient = createClient(config.apiKey, { baseUrl: config.baseUrl });
      await expect(
        disconnectedClient.wsGenerateImage({ prompt: 'test' })
      ).rejects.toThrow('WebSocket not connected');
      console.log(`   ✓ Throws error when not connected`);

      // Test timeout
      client = createClient(config.apiKey, { baseUrl: config.baseUrl, debug: true });
      await client.wsConnect();

      await expect(
        client.wsGenerateImage({ prompt: config.imagePrompt }, 100)
      ).rejects.toThrow('timeout');
      console.log(`   ✓ Request timeout handled`);

      console.log(`\n✅ Timeout and error handling work correctly!`);
    }, 20000);

    test('should work alongside REST methods', async () => {
      logTestStart('Client WS - REST Integration');

      client = createClient(config.apiKey, { baseUrl: config.baseUrl, debug: true });

      // REST before WS
      const health1 = await client.health();
      expect(health1).toBeDefined();
      console.log(`   ✓ REST health check before WS: OK`);

      // Connect WS
      await client.wsConnect();
      expect(client.wsIsConnected()).toBe(true);
      console.log(`   ✓ WebSocket connected`);

      // REST after WS connect
      const health2 = await client.health();
      expect(health2).toBeDefined();
      console.log(`   ✓ REST health check after WS: OK`);

      console.log(`\n✅ REST and WebSocket work together!`);
    }, 15000);
  });
});
