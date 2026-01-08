/**
 * Test Helper Functions
 * Utilities for downloading and saving test outputs
 */

import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { TwoDAIClient, CDNDownloadOptions } from '../src';

const TMP_DIR = path.join(__dirname, 'tmp');

/**
 * Ensure tmp directory exists
 */
export function ensureTmpDir(): void {
  if (!fs.existsSync(TMP_DIR)) {
    fs.mkdirSync(TMP_DIR, { recursive: true });
  }
}

/**
 * Download and save image from CDN using client method
 */
export async function saveImageFromCDN(
  imageId: string,
  client: TwoDAIClient,
  filename: string,
  options?: CDNDownloadOptions
): Promise<string> {
  ensureTmpDir();

  const filepath = path.join(TMP_DIR, filename);
  const format = options?.format || 'jpg';

  console.log(`  📥 Downloading image ${imageId} as ${format}`);

  try {
    const { buffer, mimeType, size } = await client.downloadFromCDN(imageId, {
      format: format as 'jpg' | 'png' | 'gif' | 'mp4',
      ...options
    });

    fs.writeFileSync(filepath, new Uint8Array(buffer));
    console.log(`  ✓ Saved image to: tests/tmp/${filename} (${formatBytes(size)}, ${mimeType})`);
    return filepath;
  } catch (error: any) {
    console.error(`  ✗ Failed to download image: ${error.message}`);
    throw error;
  }
}

/**
 * Download and save video from CDN using client method
 */
export async function saveVideoFromCDN(
  videoId: string,
  client: TwoDAIClient,
  filename: string
): Promise<string> {
  ensureTmpDir();

  const filepath = path.join(TMP_DIR, filename);

  console.log(`  📥 Downloading video ${videoId}`);

  try {
    const { buffer, mimeType, size } = await client.downloadFromCDN(videoId, { format: 'mp4' });

    fs.writeFileSync(filepath, new Uint8Array(buffer));
    console.log(`  ✓ Saved video to: tests/tmp/${filename} (${formatBytes(size)}, ${mimeType})`);
    return filepath;
  } catch (error: any) {
    console.error(`  ✗ Failed to download video: ${error.message}`);
    throw error;
  }
}

/**
 * Download and save GIF from CDN (first frame extraction from video)
 * Note: This extracts the first frame as a still GIF, not an animated GIF
 */
export async function saveGifFromCDN(
  videoId: string,
  client: TwoDAIClient,
  filename: string,
  options?: { width?: number; height?: number }
): Promise<string> {
  ensureTmpDir();

  const filepath = path.join(TMP_DIR, filename);

  console.log(`  📥 Downloading GIF (first frame) from video ${videoId}`);

  try {
    const { buffer, mimeType, size } = await client.downloadFromCDN(videoId, {
      format: 'gif',
      ...options
    });

    fs.writeFileSync(filepath, new Uint8Array(buffer));
    console.log(`  ✓ Saved GIF (still frame) to: tests/tmp/${filename} (${formatBytes(size)}, ${mimeType})`);
    return filepath;
  } catch (error: any) {
    console.error(`  ✗ Failed to download GIF: ${error.message}`);
    throw error;
  }
}

/**
 * Extract and save a video frame at a specific timestamp from CDN
 * Uses the seek option to extract frames at specific timestamps
 *
 * @param videoId - CDN ID of the video
 * @param client - TwoDAIClient instance
 * @param seekMs - Timestamp in milliseconds to extract frame from
 * @param filename - Output filename
 * @param format - Output format ('jpg' or 'png')
 */
export async function saveFrameFromCDN(
  videoId: string,
  client: TwoDAIClient,
  seekMs: number,
  filename: string,
  format: 'jpg' | 'png' = 'jpg',
  options?: { width?: number; height?: number; watermark?: string; watermarkPosition?: string }
): Promise<string> {
  ensureTmpDir();

  const filepath = path.join(TMP_DIR, filename);

  console.log(`  📥 Extracting frame at ${seekMs}ms from video ${videoId}`);

  try {
    const { buffer, mimeType, size } = await client.downloadFromCDN(videoId, {
      format,
      seek: seekMs,
      ...options
    } as CDNDownloadOptions);

    fs.writeFileSync(filepath, new Uint8Array(buffer));
    console.log(`  ✓ Saved frame to: tests/tmp/${filename} (${formatBytes(size)}, ${mimeType})`);
    return filepath;
  } catch (error: any) {
    console.error(`  ✗ Failed to extract frame: ${error.message}`);
    throw error;
  }
}

/**
 * Manual download using axios (for testing/documentation purposes)
 * Shows how to download directly without the client method
 */
export async function saveImageManualAxios(
  imageId: string,
  baseUrl: string,
  apiKey: string,
  filename: string,
  queryParams?: string
): Promise<string> {
  ensureTmpDir();

  const url = `${baseUrl}/api/v1/cdn/${imageId}.jpg${queryParams ? '?' + queryParams : ''}`;
  const filepath = path.join(TMP_DIR, filename);

  console.log(`  📥 Manual axios download from: ${url}`);

  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000,
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });

    fs.writeFileSync(filepath, response.data);
    console.log(`  ✓ Saved image to: tests/tmp/${filename}`);
    return filepath;
  } catch (error: any) {
    console.error(`  ✗ Failed to download image: ${error.message}`);
    throw error;
  }
}

// Track test suite start time
let suiteStartTime: number | null = null;
let lastTestTime: number | null = null;

/**
 * Log test start with nice formatting and timestamps
 */
export function logTestStart(testName: string): void {
  const now = Date.now();
  if (!suiteStartTime) {
    suiteStartTime = now;
  }

  const elapsed = suiteStartTime ? ((now - suiteStartTime) / 1000).toFixed(1) : '0.0';
  const sinceLastTest = lastTestTime ? ((now - lastTestTime) / 1000).toFixed(1) : '0.0';
  lastTestTime = now;

  const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });

  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 TEST: ${testName}`);
  console.log(`⏱️  [${timestamp}] Total: ${elapsed}s | Since last: ${sinceLastTest}s`);
  console.log(`${'='.repeat(80)}`);
}

/**
 * Log test result
 */
export function logTestResult(success: boolean, details?: any): void {
  if (success) {
    console.log(`\n✅ Test completed successfully`);
    if (details) {
      console.log('   Details:', details);
    }
  } else {
    console.log(`\n❌ Test failed`);
  }
  console.log(`${'-'.repeat(80)}\n`);
}

/**
 * Get file size in human-readable format
 */
export function getFileSize(filepath: string): string {
  const stats = fs.statSync(filepath);
  return formatBytes(stats.size);
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

/**
 * Display rate limits when a 429 error is encountered
 * Fetches current usage from API and displays comparison with limits
 */
export async function displayRateLimitsOn429(
  client: TwoDAIClient,
  error: Error
): Promise<void> {
  if (!error.message.includes('429')) return;

  console.log('\n⚠️  Rate limit hit (HTTP 429). Fetching current usage...');

  try {
    const settings = await client.getSettings();

    if (settings.currentUsage) {
      console.log('\n📊 Current Usage vs Limits:');

      // Image
      const img = settings.currentUsage.image;
      const imgLim = settings.rateLimits.image;
      console.log(`  Image:  ${img.current.requestsPer15Min}/${imgLim.requestsPer15Min} (15min) | ${img.current.requestsPerDay}/${imgLim.requestsPerDay} (daily)`);

      // Video
      const vid = settings.currentUsage.video;
      const vidLim = settings.rateLimits.video;
      console.log(`  Video:  ${vid.current.requestsPer15Min}/${vidLim.requestsPer15Min} (15min) | ${vid.current.requestsPerDay}/${vidLim.requestsPerDay} (daily)`);

      // LLM
      const llm = settings.currentUsage.llm;
      const llmLim = settings.rateLimits.llm;
      console.log(`  LLM:    ${llm.current.requestsPer15Min}/${llmLim.requestsPer15Min} (15min) | ${llm.current.tokensPerDay}/${llmLim.tokensPerDay} (tokens/day)`);

      // CDN
      const cdn = settings.currentUsage.cdn;
      const cdnLim = settings.rateLimits.cdn;
      console.log(`  CDN:    ${cdn.current.requestsPer15Min}/${cdnLim.requestsPer15Min} (15min) | ${cdn.current.requestsPerDay}/${cdnLim.requestsPerDay} (daily)`);

      // Reset times
      console.log(`\n  Reset at: ${new Date(img.resetAt.window15Min).toLocaleTimeString()}`);
    }
  } catch (e: any) {
    console.log(`  Could not fetch rate limit info: ${e.message}`);
  }
}
