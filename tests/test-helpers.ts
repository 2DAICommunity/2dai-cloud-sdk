/**
 * Test Helper Functions
 * Utilities for downloading and saving test outputs
 */

import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

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
 * Download and save image from CDN
 */
export async function saveImageFromCDN(
  imageId: string,
  baseUrl: string,
  filename: string,
  apiKey?: string
): Promise<string> {
  ensureTmpDir();

  const url = `${baseUrl}/api/v1/cdn/${imageId}.jpg`;
  const filepath = path.join(TMP_DIR, filename);

  console.log(`  📥 Downloading from: ${url}`);
  console.log(`  🔑 Using API Key: ${apiKey ? 'Yes' : 'No'}`);

  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000,
      headers: apiKey ? {
        'Authorization': `Bearer ${apiKey}`
      } : {}
    });

    fs.writeFileSync(filepath, response.data);
    console.log(`  ✓ Saved image to: tests/tmp/${filename}`);
    return filepath;
  } catch (error: any) {
    console.error(`  ✗ Failed to download image: ${error.message}`);
    console.error(`  ✗ URL was: ${url}`);
    throw error;
  }
}

/**
 * Download and save video from CDN
 */
export async function saveVideoFromCDN(
  videoId: string,
  baseUrl: string,
  filename: string,
  apiKey?: string
): Promise<string> {
  ensureTmpDir();

  const url = `${baseUrl}/api/v1/cdn/${videoId}.mp4`;
  const filepath = path.join(TMP_DIR, filename);

  console.log(`  📥 Downloading from: ${url}`);
  console.log(`  🔑 Using API Key: ${apiKey ? 'Yes' : 'No'}`);

  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 60000,  // Videos can be larger
      headers: apiKey ? {
        'Authorization': `Bearer ${apiKey}`
      } : {}
    });

    fs.writeFileSync(filepath, response.data);
    console.log(`  ✓ Saved video to: tests/tmp/${filename}`);
    return filepath;
  } catch (error: any) {
    console.error(`  ✗ Failed to download video: ${error.message}`);
    console.error(`  ✗ URL was: ${url}`);
    throw error;
  }
}

/**
 * Download and save GIF from CDN (first frame extraction from video)
 * Note: This extracts the first frame as a still GIF, not an animated GIF
 */
export async function saveGifFromCDN(
  videoId: string,
  baseUrl: string,
  filename: string,
  apiKey?: string
): Promise<string> {
  ensureTmpDir();

  const url = `${baseUrl}/api/v1/cdn/${videoId}.gif`;
  const filepath = path.join(TMP_DIR, filename);

  console.log(`  📥 Downloading GIF (first frame) from: ${url}`);
  console.log(`  🔑 Using API Key: ${apiKey ? 'Yes' : 'No'}`);

  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000,
      headers: apiKey ? {
        'Authorization': `Bearer ${apiKey}`
      } : {}
    });

    fs.writeFileSync(filepath, response.data);
    console.log(`  ✓ Saved GIF (still frame) to: tests/tmp/${filename}`);
    return filepath;
  } catch (error: any) {
    console.error(`  ✗ Failed to download GIF: ${error.message}`);
    console.error(`  ✗ URL was: ${url}`);
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
  const bytes = stats.size;

  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

/**
 * Extract and save a video frame at a specific timestamp from CDN
 * Uses the seek query parameter to extract frames at specific timestamps
 *
 * @param videoId - CDN ID of the video
 * @param baseUrl - API base URL
 * @param seekMs - Timestamp in milliseconds to extract frame from
 * @param filename - Output filename
 * @param extension - Output format ('jpg' or 'png')
 * @param apiKey - API key for authentication
 */
export async function saveFrameFromCDN(
  videoId: string,
  baseUrl: string,
  seekMs: number,
  filename: string,
  extension: 'jpg' | 'png' = 'jpg',
  apiKey?: string
): Promise<string> {
  ensureTmpDir();

  const url = `${baseUrl}/api/v1/cdn/${videoId}.${extension}?seek=${seekMs}`;
  const filepath = path.join(TMP_DIR, filename);

  console.log(`  📥 Extracting frame at ${seekMs}ms from: ${url}`);
  console.log(`  🔑 Using API Key: ${apiKey ? 'Yes' : 'No'}`);

  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000,
      headers: apiKey ? {
        'Authorization': `Bearer ${apiKey}`
      } : {}
    });

    fs.writeFileSync(filepath, response.data);
    console.log(`  ✓ Saved frame to: tests/tmp/${filename}`);
    return filepath;
  } catch (error: any) {
    console.error(`  ✗ Failed to extract frame: ${error.message}`);
    console.error(`  ✗ URL was: ${url}`);
    throw error;
  }
}
