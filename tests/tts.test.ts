/// <reference path="./matchers.d.ts" />
/// <reference types="jest" />

/**
 * TTS (Text-to-Speech) Tests
 * Tests for speech synthesis via REST and WebSocket
 */

import { TwoDAIClient, createClient, TTS_VOICES } from '../src';
import { loadTestEnv } from './test-env';
import { logTestStart, ensureTmpDir } from './test-helpers';
import * as fs from 'fs';
import * as path from 'path';

describe('TTS (Text-to-Speech) Tests', () => {
  let client: TwoDAIClient;
  let config: ReturnType<typeof loadTestEnv>;
  const TMP_DIR = path.join(__dirname, 'tmp');

  beforeAll(() => {
    config = loadTestEnv();
    client = createClient(config.apiKey, {
      baseUrl: config.baseUrl,
      debug: true
    });
    ensureTmpDir();
  });

  // ============================================================================
  // REST API Tests
  // ============================================================================

  describe('1. Basic Speech Generation (REST)', () => {
    test('should generate speech with paul voice', async () => {
      logTestStart('TTS - Paul Voice');

      const result = await client.generateSpeech({
        text: 'Hello, this is a test of the text to speech system.',
        voice: TTS_VOICES.PAUL
      });

      expect(result.success).toBe(true);
      expect(result.audio || result.cdnFileId).toBeTruthy();
      expect(result.characterCount).toBeGreaterThan(0);

      console.log(`\nTTS generation successful!`);
      console.log(`   Format: ${result.format}`);
      console.log(`   Duration: ${result.duration}s`);
      console.log(`   Sample rate: ${result.sampleRate} Hz`);
      console.log(`   Characters: ${result.characterCount}`);
      console.log(`   Language: ${result.language}`);

      // Save audio if base64 available
      if (result.audio) {
        const audioBuffer = Buffer.from(result.audio, 'base64');
        const ext = result.format || 'wav';
        fs.writeFileSync(path.join(TMP_DIR, `tts-01-paul.${ext}`), new Uint8Array(audioBuffer));
        console.log(`   Saved: tests/tmp/tts-01-paul.${ext} (${(audioBuffer.length / 1024).toFixed(1)} KB)`);
      }
    }, 120000);

    test('should generate speech with alice voice', async () => {
      logTestStart('TTS - Alice Voice');

      const result = await client.generateSpeech({
        text: 'Welcome to the two D A I platform. This is Alice speaking.',
        voice: TTS_VOICES.ALICE
      });

      expect(result.success).toBe(true);
      expect(result.audio || result.cdnFileId).toBeTruthy();

      console.log(`\nAlice voice generation successful!`);
      console.log(`   Duration: ${result.duration}s`);
      console.log(`   Language: ${result.language}`);

      if (result.audio) {
        const audioBuffer = Buffer.from(result.audio, 'base64');
        const ext = result.format || 'wav';
        fs.writeFileSync(path.join(TMP_DIR, `tts-02-alice.${ext}`), new Uint8Array(audioBuffer));
        console.log(`   Saved: tests/tmp/tts-02-alice.${ext}`);
      }
    }, 120000);
  });

  describe('2. Custom Options (REST)', () => {
    test('should generate with custom language and speed', async () => {
      logTestStart('TTS - Custom Language + Speed');

      const result = await client.generateSpeech({
        text: 'Bonjour, ceci est un test de synthese vocale.',
        voice: TTS_VOICES.PAUL,
        language: 'fr',
        speed: 0.8
      });

      expect(result.success).toBe(true);
      expect(result.audio || result.cdnFileId).toBeTruthy();

      console.log(`\nCustom language/speed generation successful!`);
      console.log(`   Language: ${result.language}`);
      console.log(`   Duration: ${result.duration}s`);

      if (result.audio) {
        const audioBuffer = Buffer.from(result.audio, 'base64');
        const ext = result.format || 'wav';
        fs.writeFileSync(path.join(TMP_DIR, `tts-03-french-slow.${ext}`), new Uint8Array(audioBuffer));
        console.log(`   Saved: tests/tmp/tts-03-french-slow.${ext}`);
      }
    }, 120000);

    test('should generate with mp3 output format', async () => {
      logTestStart('TTS - MP3 Output');

      const result = await client.generateSpeech({
        text: 'Testing mp3 output format.',
        voice: TTS_VOICES.PAUL,
        outputFormat: 'mp3'
      });

      expect(result.success).toBe(true);
      expect(result.format).toBe('mp3');

      console.log(`\nMP3 output generation successful!`);
      console.log(`   Format: ${result.format}`);
      console.log(`   Duration: ${result.duration}s`);

      if (result.audio) {
        const audioBuffer = Buffer.from(result.audio, 'base64');
        fs.writeFileSync(path.join(TMP_DIR, 'tts-04-mp3-output.mp3'), new Uint8Array(audioBuffer));
        console.log(`   Saved: tests/tmp/tts-04-mp3-output.mp3 (${(audioBuffer.length / 1024).toFixed(1)} KB)`);
      }
    }, 120000);

    test('should generate with fast speed (2x)', async () => {
      logTestStart('TTS - Fast Speed (2x)');

      const result = await client.generateSpeech({
        text: 'This is a speed test at two times normal speed.',
        voice: TTS_VOICES.PAUL,
        speed: 2.0
      });

      expect(result.success).toBe(true);

      console.log(`\nFast speed generation successful!`);
      console.log(`   Duration: ${result.duration}s`);
    }, 120000);
  });

  describe('3. Realtime Mode (REST)', () => {
    test('should generate speech with realtime mode', async () => {
      logTestStart('TTS - Realtime Mode');

      const result = await client.generateSpeech({
        text: 'Hello, this is a test of the realtime text to speech engine.',
        voice: TTS_VOICES.PAUL,
        realtime: true
      });

      expect(result.success).toBe(true);
      expect(result.audio || result.cdnFileId).toBeTruthy();
      expect(result.characterCount).toBeGreaterThan(0);

      console.log(`\nRealtime TTS generation successful!`);
      console.log(`   Format: ${result.format}`);
      console.log(`   Duration: ${result.duration}s`);
      console.log(`   Sample rate: ${result.sampleRate} Hz`);
      console.log(`   Characters: ${result.characterCount}`);
      console.log(`   Language: ${result.language}`);

      if (result.audio) {
        const audioBuffer = Buffer.from(result.audio, 'base64');
        const ext = result.format || 'wav';
        fs.writeFileSync(path.join(TMP_DIR, `tts-05-realtime-paul.${ext}`), new Uint8Array(audioBuffer));
        console.log(`   Saved: tests/tmp/tts-05-realtime-paul.${ext} (${(audioBuffer.length / 1024).toFixed(1)} KB)`);
      }
    }, 120000);

    test('should generate realtime speech with custom speed', async () => {
      logTestStart('TTS - Realtime + Speed');

      const result = await client.generateSpeech({
        text: 'Fast realtime generation at one point five times speed.',
        voice: TTS_VOICES.ALICE,
        realtime: true,
        speed: 1.5
      });

      expect(result.success).toBe(true);

      console.log(`\nRealtime + speed generation successful!`);
      console.log(`   Duration: ${result.duration}s`);
      console.log(`   Language: ${result.language}`);
    }, 120000);
  });

  describe('4. Voice Cloning (REST)', () => {
    test('should generate with voice cloning (reference audio)', async () => {
      logTestStart('TTS - Voice Cloning');

      // Load reference audio from test assets
      const assetsDir = path.join(__dirname, 'assets');
      const refPath = path.join(assetsDir, 'test.wav');

      if (!fs.existsSync(refPath)) {
        console.warn('Skipping: no reference audio file (test.wav) in tests/assets/');
        return;
      }

      const referenceAudio = fs.readFileSync(refPath).toString('base64');

      const result = await client.generateSpeech({
        text: 'This speech should mimic the reference voice.',
        referenceAudio,
        referenceTranscript: 'Long ago, in a kindom far far away'
      });

      expect(result.success).toBe(true);
      expect(result.audio || result.cdnFileId).toBeTruthy();

      console.log(`\nVoice cloning generation successful!`);
      console.log(`   Duration: ${result.duration}s`);
      console.log(`   Language: ${result.language}`);

      if (result.audio) {
        const audioBuffer = Buffer.from(result.audio, 'base64');
        const ext = result.format || 'wav';
        fs.writeFileSync(path.join(TMP_DIR, `tts-06-voice-clone.${ext}`), new Uint8Array(audioBuffer));
        console.log(`   Saved: tests/tmp/tts-06-voice-clone.${ext}`);
      }
    }, 120000);
  });

  describe('5. Streaming Speech Generation (REST SSE)', () => {
    test('should stream audio chunks', async () => {
      logTestStart('TTS Stream - Basic Streaming');

      const audioChunks: string[] = [];

      const controller = client.generateSpeechStream({
        text: 'Hello world. This is a streaming test of the text to speech system. We want to generate enough audio to produce multiple chunks and validate the streaming pipeline end to end.',
        voice: TTS_VOICES.PAUL,
        onChunk: (audio, text, _language) => {
          audioChunks.push(audio);
          console.log(`   Chunk ${audioChunks.length}: ${text} (${(audio.length * 3 / 4 / 1024).toFixed(1)} KB)`);
        }
      });

      const result = await controller.done;

      expect(result.success).toBe(true);
      expect(audioChunks.length).toBeGreaterThan(0);

      console.log(`\nTTS streaming completed!`);
      console.log(`   Total chunks: ${audioChunks.length}`);
      console.log(`   Format: ${result.format}`);
      console.log(`   Duration: ${result.duration}s`);
      console.log(`   Characters: ${result.characterCount}`);
    }, 120000);

    test('should handle stream abort', async () => {
      logTestStart('TTS Stream - Abort');

      const audioChunks: string[] = [];

      const controller = client.generateSpeechStream({
        text: 'This is a longer text that should produce multiple audio chunks for testing the abort functionality.',
        voice: TTS_VOICES.ALICE,
        onChunk: (audio) => {
          audioChunks.push(audio);
          if (audioChunks.length >= 2) {
            controller.abort();
          }
        }
      });

      const result = await controller.done;

      // Aborted stream should resolve (not reject)
      expect(typeof result.success).toBe('boolean');

      console.log(`\nTTS stream abort handled gracefully`);
      console.log(`   Chunks before abort: ${audioChunks.length}`);
    }, 120000);
  });

  describe('6. Error Handling (REST)', () => {
    test('should reject empty text', async () => {
      logTestStart('TTS Error - Empty Text');

      await expect(
        client.generateSpeech({
          text: '',
          voice: TTS_VOICES.PAUL
        })
      ).rejects.toThrow();

      console.log('Empty text correctly rejected');
    }, 30000);

    test('should reject text exceeding max length', async () => {
      logTestStart('TTS Error - Text Too Long');

      const longText = 'a'.repeat(501);

      await expect(
        client.generateSpeech({
          text: longText,
          voice: TTS_VOICES.PAUL
        })
      ).rejects.toThrow();

      console.log('Long text correctly rejected');
    }, 30000);

    test('should reject missing voice and reference audio', async () => {
      logTestStart('TTS Error - Missing Voice');

      await expect(
        client.generateSpeech({
          text: 'Hello world'
        })
      ).rejects.toThrow();

      console.log('Missing voice correctly rejected');
    }, 30000);

    test('should reject invalid speed', async () => {
      logTestStart('TTS Error - Invalid Speed');

      await expect(
        client.generateSpeech({
          text: 'Hello world',
          voice: TTS_VOICES.PAUL,
          speed: 5.0 // max is 4.0
        })
      ).rejects.toThrow();

      console.log('Invalid speed correctly rejected');
    }, 30000);
  });

  // ============================================================================
  // WebSocket Tests
  // ============================================================================

  describe('7. WebSocket Speech Generation', () => {
    beforeAll(async () => {
      await client.wsConnect();
    }, 30000);

    afterAll(async () => {
      await client.close();
    });

    test('should generate speech via WebSocket', async () => {
      logTestStart('TTS WS - Basic Generation');

      const result = await client.wsGenerateSpeech({
        text: 'Hello from WebSocket text to speech.',
        voice: TTS_VOICES.PAUL
      });

      expect(result.result).toBeDefined();
      expect(result.result.audio || result.result.cdnFileId).toBeTruthy();

      console.log(`\nWS TTS generation successful!`);
      console.log(`   Format: ${result.result.format}`);
      console.log(`   Duration: ${result.result.duration}s`);
      console.log(`   Characters: ${result.result.characterCount}`);

      if (result.result.audio) {
        const audioBuffer = Buffer.from(result.result.audio, 'base64');
        const ext = result.result.format || 'wav';
        fs.writeFileSync(path.join(TMP_DIR, `tts-ws-01-paul.${ext}`), new Uint8Array(audioBuffer));
        console.log(`   Saved: tests/tmp/tts-ws-01-paul.${ext}`);
      }
    }, 120000);

    test('should generate speech with realtime mode via WebSocket', async () => {
      logTestStart('TTS WS - Realtime Mode');

      const result = await client.wsGenerateSpeech({
        text: 'Hello from WebSocket realtime text to speech.',
        voice: TTS_VOICES.ALICE,
        realtime: true
      });

      expect(result.result).toBeDefined();
      expect(result.result.audio || result.result.cdnFileId).toBeTruthy();
      expect(result.result.characterCount).toBeGreaterThan(0);

      console.log(`\nWS Realtime TTS generation successful!`);
      console.log(`   Format: ${result.result.format}`);
      console.log(`   Duration: ${result.result.duration}s`);
      console.log(`   Sample rate: ${result.result.sampleRate} Hz`);
      console.log(`   Characters: ${result.result.characterCount}`);
      console.log(`   Language: ${result.result.language}`);

      if (result.result.audio) {
        const audioBuffer = Buffer.from(result.result.audio, 'base64');
        const ext = result.result.format || 'wav';
        fs.writeFileSync(path.join(TMP_DIR, `tts-ws-02-realtime-alice.${ext}`), new Uint8Array(audioBuffer));
        console.log(`   Saved: tests/tmp/tts-ws-02-realtime-alice.${ext} (${(audioBuffer.length / 1024).toFixed(1)} KB)`);
      }
    }, 120000);

    test('should stream speech via WebSocket', async () => {
      logTestStart('TTS WS - Streaming');

      const audioChunks: string[] = [];

      await new Promise<void>((resolve, reject) => {
        client.wsGenerateSpeechStream(
          {
            text: 'This is a WebSocket streaming test for text to speech. We are generating a longer sentence to ensure the stream produces multiple audio chunks during synthesis.',
            voice: TTS_VOICES.ALICE
          },
          {
            onChunk: (audio, text, _language) => {
              audioChunks.push(audio);
              console.log(`   WS Chunk ${audioChunks.length}: ${text}`);
            },
            onComplete: (response) => {
              console.log(`\nWS TTS streaming completed!`);
              console.log(`   Chunks: ${audioChunks.length}`);
              console.log(`   Duration: ${response.result.duration}s`);
              resolve();
            },
            onError: (err) => {
              reject(err);
            }
          }
        );
      });

      expect(audioChunks.length).toBeGreaterThan(0);

      if (audioChunks.length > 0) {
        const combined = Buffer.concat(audioChunks.map(c => Buffer.from(c, 'base64')) as Uint8Array[]);
        fs.writeFileSync(path.join(TMP_DIR, 'tts-ws-03-alice-stream.mp3'), new Uint8Array(combined));
        console.log(`   Saved: tests/tmp/tts-ws-03-alice-stream.mp3 (${(combined.length / 1024).toFixed(1)} KB)`);
      }
    }, 120000);

    test('should handle WS stream cancellation', async () => {
      logTestStart('TTS WS - Cancellation');

      const audioChunks: string[] = [];

      const controller = client.wsGenerateSpeechStream(
        {
          text: 'This text should be cancelled before it finishes generating all audio.',
          voice: TTS_VOICES.PAUL
        },
        {
          onChunk: (audio) => {
            audioChunks.push(audio);
            if (audioChunks.length >= 1) {
              controller.abort();
            }
          },
          onComplete: () => {},
          onError: () => {}
        }
      );

      // Give time for cancellation
      await new Promise(r => setTimeout(r, 2000));

      console.log(`\nWS TTS cancellation sent`);
      console.log(`   Chunks before cancel: ${audioChunks.length}`);
    }, 30000);
  });
});
