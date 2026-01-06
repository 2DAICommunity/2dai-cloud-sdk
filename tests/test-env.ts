/**
 * Test Environment Loader
 * Loads test configuration from environment variables or test.env file
 */

import fs from 'fs';
import path from 'path';

export interface TestConfig {
  apiKey: string;
  baseUrl: string;
  imagePrompt: string;
  videoImageId?: string;
  llmPrompt: string;
  editImageId?: string;
  watermarkId?: string;
  videoId?: string;
}

/**
 * Load test environment from test.env file or environment variables
 */
export function loadTestEnv(): TestConfig {
  const envPath = path.join(__dirname, 'test.env');

  // Try to load from test.env file
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=').trim();
        if (key && value && !process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }

  // Validate required env vars
  const apiKey = process.env.TEST_API_KEY;
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';

  if (!apiKey) {
    throw new Error(
      'TEST_API_KEY is required. Create tests/test.env from tests/test.env.example'
    );
  }

  return {
    apiKey,
    baseUrl,
    imagePrompt: process.env.TEST_IMAGE_PROMPT || 'a serene landscape with mountains and a lake',
    videoImageId: process.env.TEST_VIDEO_IMAGE_ID,
    llmPrompt: process.env.TEST_LLM_PROMPT || 'Write a haiku about artificial intelligence',
    editImageId: process.env.TEST_EDIT_IMAGE_ID,
    watermarkId: process.env.TEST_WATERMARK_ID,
    videoId: process.env.TEST_VIDEO_ID
  };
}
