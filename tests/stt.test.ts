/// <reference path="./matchers.d.ts" />
/// <reference types="jest" />

/**
 * STT (Speech-to-Text) Tests
 * Tests for audio transcription via REST and WebSocket
 */

import { TwoDAIClient, createClient } from '../src';
import { loadTestEnv } from './test-env';
import { logTestStart } from './test-helpers';
import * as fs from 'fs';
import * as path from 'path';

describe('STT (Speech-to-Text) Tests', () => {
  let client: TwoDAIClient;
  let config: ReturnType<typeof loadTestEnv>;
  let testAudioBase64: string;
  let testAudioFormat: string;

  beforeAll(() => {
    config = loadTestEnv();
    client = createClient(config.apiKey, {
      baseUrl: config.baseUrl,
      debug: true
    });

    // Load test audio file
    const assetsDir = path.join(__dirname, 'assets');
    const wavPath = path.join(assetsDir, 'test.wav');
    const mp3Path = path.join(assetsDir, 'test.mp3');

    if (fs.existsSync(wavPath)) {
      testAudioBase64 = fs.readFileSync(wavPath).toString('base64');
      testAudioFormat = 'wav';
    } else if (fs.existsSync(mp3Path)) {
      testAudioBase64 = fs.readFileSync(mp3Path).toString('base64');
      testAudioFormat = 'mp3';
    } else {
      console.warn('No test audio files found in tests/assets/. Some tests will be skipped.');
      testAudioBase64 = '';
      testAudioFormat = 'wav';
    }
  });

  // ============================================================================
  // REST API Tests
  // ============================================================================

  describe('1. Basic Transcription (REST)', () => {
    test('should transcribe audio with default settings', async () => {
      logTestStart('STT - Basic Transcription');

      if (!testAudioBase64) {
        console.warn('Skipping: no test audio file available');
        return;
      }

      console.log(`Audio format: ${testAudioFormat}`);
      console.log(`Audio size: ${(testAudioBase64.length * 3 / 4 / 1024).toFixed(1)} KB`);

      const result = await client.transcribeAudio({
        audio: testAudioBase64,
        audioFormat: testAudioFormat as any
      });

      expect(result.success).toBe(true);
      expect(result.text).toBeTruthy();
      expect(typeof result.text).toBe('string');
      expect(result.text.length).toBeGreaterThan(0);

      console.log(`\nTranscription successful!`);
      console.log(`   Text: "${result.text}"`);
      console.log(`   Language: ${result.language || 'not detected'}`);
    }, 120000);

    test('should transcribe with language hint', async () => {
      logTestStart('STT - With Language Hint');

      if (!testAudioBase64) {
        console.warn('Skipping: no test audio file available');
        return;
      }

      const result = await client.transcribeAudio({
        audio: testAudioBase64,
        audioFormat: testAudioFormat as any,
        language: 'en'
      });

      expect(result.success).toBe(true);
      expect(result.text).toBeTruthy();

      console.log(`\nTranscription with language hint successful!`);
      console.log(`   Text: "${result.text}"`);
      console.log(`   Language: ${result.language || 'en'}`);
    }, 120000);

    test('should transcribe with context prompt', async () => {
      logTestStart('STT - With Context Prompt');

      if (!testAudioBase64) {
        console.warn('Skipping: no test audio file available');
        return;
      }

      const result = await client.transcribeAudio({
        audio: testAudioBase64,
        audioFormat: testAudioFormat as any,
        prompt: 'This is a test recording about technology'
      });

      expect(result.success).toBe(true);
      expect(result.text).toBeTruthy();

      console.log(`\nTranscription with context prompt successful!`);
      console.log(`   Text: "${result.text}"`);
    }, 120000);
  });

  describe('2. Streaming Transcription (REST SSE)', () => {
    test('should stream transcription chunks', async () => {
      logTestStart('STT Stream - Basic Streaming');

      if (!testAudioBase64) {
        console.warn('Skipping: no test audio file available');
        return;
      }

      const chunks: string[] = [];

      const controller = client.transcribeAudioStream({
        audio: testAudioBase64,
        audioFormat: testAudioFormat as any,
        onChunk: (chunk, _language) => {
          chunks.push(chunk);
          process.stdout.write(chunk);
        }
      });

      const result = await controller.done;

      expect(result.success).toBe(true);
      expect(result.text).toBeTruthy();
      expect(result.text.length).toBeGreaterThan(0);

      console.log(`\n\nStreaming transcription completed!`);
      console.log(`   Chunks received: ${chunks.length}`);
      console.log(`   Full text: "${result.text}"`);
      console.log(`   Language: ${result.language || 'not detected'}`);
    }, 120000);

    test('should handle stream abort', async () => {
      logTestStart('STT Stream - Abort');

      if (!testAudioBase64) {
        console.warn('Skipping: no test audio file available');
        return;
      }

      const chunks: string[] = [];

      const controller = client.transcribeAudioStream({
        audio: testAudioBase64,
        audioFormat: testAudioFormat as any,
        onChunk: (chunk) => {
          chunks.push(chunk);
          if (chunks.length >= 2) {
            controller.abort();
          }
        }
      });

      const result = await controller.done;

      // Aborted stream should resolve (not reject)
      expect(typeof result.text).toBe('string');

      console.log(`\nSTT stream abort handled gracefully`);
      console.log(`   Chunks before abort: ${chunks.length}`);
    }, 120000);
  });

  describe('3. Error Handling (REST)', () => {
    test('should reject missing audio', async () => {
      logTestStart('STT Error - Missing Audio');

      await expect(
        client.transcribeAudio({
          audio: '',
          audioFormat: 'wav'
        })
      ).rejects.toThrow();

      console.log('Missing audio correctly rejected');
    }, 30000);

    test('should reject invalid audio format', async () => {
      logTestStart('STT Error - Invalid Format');

      await expect(
        client.transcribeAudio({
          audio: 'dGVzdA==', // "test" in base64
          audioFormat: 'xyz' as any
        })
      ).rejects.toThrow();

      console.log('Invalid audio format correctly rejected');
    }, 30000);
  });

  // ============================================================================
  // WebSocket Tests
  // ============================================================================

  describe('4. WebSocket Transcription', () => {
    beforeAll(async () => {
      await client.wsConnect();
    }, 30000);

    afterAll(async () => {
      await client.close();
    });

    test('should transcribe audio via WebSocket', async () => {
      logTestStart('STT WS - Basic Transcription');

      if (!testAudioBase64) {
        console.warn('Skipping: no test audio file available');
        return;
      }

      const result = await client.wsTranscribeAudio({
        audio: testAudioBase64,
        audioFormat: testAudioFormat as any
      });

      expect(result.result).toBeDefined();
      expect(result.result.text).toBeTruthy();

      console.log(`\nWS transcription successful!`);
      console.log(`   Text: "${result.result.text}"`);
      console.log(`   Language: ${result.result.language || 'not detected'}`);
    }, 120000);

    test('should stream transcription via WebSocket', async () => {
      logTestStart('STT WS - Streaming');

      if (!testAudioBase64) {
        console.warn('Skipping: no test audio file available');
        return;
      }

      const chunks: string[] = [];

      await new Promise<void>((resolve, reject) => {
        client.wsTranscribeAudioStream(
          {
            audio: testAudioBase64,
            audioFormat: testAudioFormat as any
          },
          {
            onChunk: (chunk, _language) => {
              chunks.push(chunk);
              process.stdout.write(chunk);
            },
            onComplete: (response) => {
              console.log(`\n\nWS STT streaming completed!`);
              console.log(`   Chunks: ${chunks.length}`);
              console.log(`   Text: "${response.result.text}"`);
              resolve();
            },
            onError: (err) => {
              reject(err);
            }
          }
        );
      });

      expect(chunks.length).toBeGreaterThan(0);
    }, 120000);

    test('should handle WS stream cancellation', async () => {
      logTestStart('STT WS - Cancellation');

      if (!testAudioBase64) {
        console.warn('Skipping: no test audio file available');
        return;
      }

      const chunks: string[] = [];

      const controller = client.wsTranscribeAudioStream(
        {
          audio: testAudioBase64,
          audioFormat: testAudioFormat as any
        },
        {
          onChunk: (chunk) => {
            chunks.push(chunk);
            if (chunks.length >= 1) {
              controller.abort();
            }
          },
          onComplete: () => {},
          onError: () => {}
        }
      );

      // Give time for cancellation
      await new Promise(r => setTimeout(r, 2000));

      console.log(`\nWS STT cancellation sent`);
      console.log(`   Chunks before cancel: ${chunks.length}`);
    }, 30000);
  });
});
