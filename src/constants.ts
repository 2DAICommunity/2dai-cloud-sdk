/**
 * Constants and Enums for 2DAI SDK
 * @version 1.12.0
 */

import { StylePreset, FormatPreset } from './types';

/**
 * Style presets for image generation
 */
export const STYLES = {
  /**
   * ⚡ Raw defaults
   */
  raw: {
    id: 'raw',
    name: 'Raw',
    description: 'Raw defaults'
  } as StylePreset,

  /**
   * ⚡⚡ Realistic 2DAI generation (formerly "raw+")
   */
  realistic: {
    id: 'realistic',
    name: 'Realistic',
    description: 'Realistic 2DAI generation'
  } as StylePreset,

  /**
   * 📝 Text & Clarity - Optimized for text rendering
   */
  text: {
    id: 'text',
    name: 'Text & Clarity',
    description: 'Text & Clarity 2DAI generation'
  } as StylePreset,

  /**
   * 🎌 Niji anime style with vibrant colors
   */
  ciniji: {
    id: 'ciniji',
    name: 'Ciniji',
    description: 'Niji anime style with vibrant colors'
  } as StylePreset,

  /**
   * 📸 Portrait
   */
  portrait: {
    id: 'portrait',
    name: 'Portrait',
    description: 'Portrait'
  } as StylePreset,

  /**
   * 🎥 Cinematic
   */
  cine: {
    id: 'cine',
    name: 'Cinematic',
    description: 'Cinematic'
  } as StylePreset,

  /**
   * ⚽ Sport
   */
  sport: {
    id: 'sport',
    name: 'Sport',
    description: 'Sport'
  } as StylePreset,

  /**
   * 👕 Fashion
   */
  fashion: {
    id: 'fashion',
    name: 'Fashion',
    description: 'Fashion'
  } as StylePreset,

  /**
   * 🌸 Anime Niji
   */
  niji: {
    id: 'niji',
    name: 'Niji',
    description: 'Anime Niji'
  } as StylePreset,

  /**
   * 🎎 Anime
   */
  anime: {
    id: 'anime',
    name: 'Anime',
    description: 'Anime'
  } as StylePreset,

  /**
   * 📚 Manga
   */
  manga: {
    id: 'manga',
    name: 'Manga',
    description: 'Manga'
  } as StylePreset,

  /**
   * 🎨 Watercolor Anime
   */
  watercolor: {
    id: 'watercolor',
    name: 'Watercolor',
    description: 'Watercolor Anime'
  } as StylePreset,

  /**
   * 💥 Comic book illustration
   */
  comicbook: {
    id: 'comicbook',
    name: 'Comic',
    description: 'Comic book illustration'
  } as StylePreset,

  /**
   * 🖌️ Paint
   */
  paint: {
    id: 'paint',
    name: 'Paint',
    description: 'Paint'
  } as StylePreset
} as const;

/**
 * Format presets for image generation
 */
export const FORMATS = {
  /**
   * 9:16 vertical (768×1344)
   */
  portrait: {
    id: 'portrait',
    name: 'Portrait',
    width: 768,
    height: 1344
  } as FormatPreset,

  /**
   * 16:9 horizontal (1344×768)
   */
  landscape: {
    id: 'landscape',
    name: 'Landscape',
    width: 1344,
    height: 768
  } as FormatPreset,

  /**
   * 1:1 profile picture (1024×1024)
   */
  profile: {
    id: 'profile',
    name: 'Profile',
    width: 1024,
    height: 1024
  } as FormatPreset,

  /**
   * 9:16 story format (720×1280)
   */
  story: {
    id: 'story',
    name: 'Story',
    width: 720,
    height: 1280
  } as FormatPreset,

  /**
   * 9:7 wide square (1152×896)
   */
  post: {
    id: 'post',
    name: 'Post',
    width: 1152,
    height: 896
  } as FormatPreset,

  /**
   * Phone screen (640×1344)
   */
  smartphone: {
    id: 'smartphone',
    name: 'Smartphone',
    width: 640,
    height: 1344
  } as FormatPreset,

  /**
   * 3:1 wide screen (1472×448)
   */
  banner: {
    id: 'banner',
    name: 'Banner',
    width: 1472,
    height: 448
  } as FormatPreset
} as const;

/**
 * Valid style IDs (derived from STYLES)
 */
export const VALID_STYLE_IDS = Object.keys(STYLES) as ReadonlyArray<keyof typeof STYLES>;

/**
 * Valid format IDs (derived from FORMATS)
 */
export const VALID_FORMAT_IDS = Object.keys(FORMATS) as ReadonlyArray<keyof typeof FORMATS>;

/**
 * Default API base URL
 */
export const DEFAULT_BASE_URL = 'https://apiv2.2dai.io:800';

/**
 * Default request timeout (milliseconds)
 */
export const DEFAULT_TIMEOUT = 300000; // 5 minutes

/**
 * Default retry count
 */
export const DEFAULT_RETRIES = 3;

/**
 * Video FPS constraints
 */
export const VIDEO_FPS = {
  MIN: 8,
  MAX: 60,
  DEFAULT: 16
} as const;

/**
 * Video duration constraints (seconds)
 */
export const VIDEO_DURATION = {
  MIN: 1,
  MAX: 10,
  DEFAULT: 5
} as const;

/**
 * Image dimension constraints
 */
export const IMAGE_DIMENSIONS = {
  MIN: 320,
  MAX: 1344
} as const;

/**
 * Seed constraints
 */
export const SEED = {
  MIN: 0,
  MAX: 2000000000
} as const;

/**
 * Upscale factor constraints (for AI upscaling)
 */
export const UPSCALE_FACTOR = {
  MIN: 2,
  MAX: 4,
  DEFAULT: 2
} as const;

/**
 * WebSocket defaults
 */
export const WS_DEFAULTS = {
  /** Ping interval to keep connection alive (30 seconds) */
  PING_INTERVAL_MS: 30000,
  /** Initial reconnect delay (1 second) */
  RECONNECT_INTERVAL_MS: 1000,
  /** Maximum reconnect delay (30 seconds) */
  MAX_RECONNECT_DELAY_MS: 30000,
  /** Auto-reconnect enabled by default */
  AUTO_RECONNECT: true
} as const;

/**
 * WebSocket request types for wsSend()
 */
export const WS_TYPES = {
  /** Generate an image from a text prompt */
  IMAGE: 'generate_image',
  /** Generate a video from an image */
  VIDEO: 'generate_video',
  /** Generate text using LLM */
  LLM: 'generate_llm',
  /** AI upscale an image */
  UPSCALE: 'generate_upscale',
  /** Transcribe audio using STT */
  STT: 'generate_stt',
  /** Generate speech using TTS */
  TTS: 'generate_tts'
} as const;

/**
 * Streaming defaults
 */
export const STREAM_DEFAULTS = {
  /** Default timeout for streaming requests (5 minutes) */
  TIMEOUT_MS: 300000,
  /** SSE retry interval on connection drop */
  RETRY_MS: 3000
} as const;

/**
 * WebSocket streaming message types
 */
export const WS_STREAM_TYPES = {
  /** LLM generation with streaming (same as regular, stream flag in data) */
  LLM_STREAM: 'generate_llm',
  /** Streaming chunk from server */
  LLM_CHUNK: 'llm_chunk',
  /** STT generation with streaming */
  STT_STREAM: 'generate_stt',
  /** STT streaming chunk from server */
  STT_CHUNK: 'stt_chunk',
  /** TTS generation with streaming */
  TTS_STREAM: 'generate_tts',
  /** TTS streaming chunk from server */
  TTS_CHUNK: 'tts_chunk'
} as const;

/**
 * Supported STT audio formats
 */
export const STT_FORMATS = ['wav', 'mp3', 'aac', 'webm', 'ogg', 'm4a', 'flac'] as const;

/**
 * Maximum STT audio size in bytes (5 MB)
 */
export const STT_MAX_AUDIO_SIZE_BYTES = 5 * 1024 * 1024;

/**
 * TTS voice models
 */
export const TTS_VOICES = {
  PAUL: 'paul',
  ALICE: 'alice'
} as const;

/**
 * Supported TTS languages
 */
export const TTS_LANGUAGES = ['auto', 'en', 'zh', 'ja', 'ko', 'de', 'fr', 'es', 'ru', 'pt', 'it'] as const;

/**
 * Supported TTS output formats
 */
export const TTS_OUTPUT_FORMATS = ['mp3', 'opus', 'aac', 'flac', 'wav', 'pcm'] as const;

/**
 * TTS speech speed constraints
 */
export const TTS_SPEED = {
  MIN: 0.25,
  MAX: 4.0,
  DEFAULT: 1.0
} as const;

/**
 * Maximum TTS text length (characters)
 */
export const TTS_MAX_TEXT_LENGTH = 500;
