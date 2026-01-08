/**
 * Type definitions for 2DAI SDK
 */

/**
 * Watermark position options
 */
export type WatermarkPosition =
  // Sharp gravity constants (recommended)
  | 'center'
  | 'northwest' | 'north' | 'northeast'
  | 'west' | 'east'
  | 'southwest' | 'south' | 'southeast'
  // Human-readable alternatives
  | 'top-left' | 'top-center' | 'top-right'
  | 'middle-left' | 'middle-center' | 'middle-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right';

/**
 * Watermark options for images and videos
 */
export interface WatermarkOptions {
  watermark?: string;                    // CDN ID of watermark image
  watermarkPosition?: WatermarkPosition; // Position (default: 'southeast')
  watermarkAsTiles?: boolean;            // Tile watermark (images only, default: false)
  copyright?: string;                    // Copyright text overlay
}

/**
 * Style preset for image generation
 */
export interface StylePreset {
  id: string;
  name: string;
  description?: string;
}

/**
 * Format preset for image generation
 */
export interface FormatPreset {
  id: string;
  name: string;
  width: number;
  height: number;
}

/**
 * Options for image generation
 */
export interface ImageGenerationOptions {
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
  /** Enable resize padding (default: false) */
  resizePad?: boolean;
}

/**
 * Options for video generation
 */
export interface VideoGenerationOptions {
  imageId?: string;
  imageBuffer?: Buffer;
  duration?: number;
  fps?: number;
  watermark?: string;
  watermarkPosition?: WatermarkPosition;
}

/**
 * Options for text generation
 */
export interface TextGenerationOptions {
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
  useMarkdown?: boolean;
  /** Image ID from CDN for vision/image analysis */
  imageId?: string;
}

/**
 * Options for AI image upscaling (img2ximg)
 */
export interface UpscaleOptions {
  /** Upscale factor: 2, 3, or 4 (default: 2) */
  factor?: number;
  /** Seed for reproducible results */
  seed?: number;
}

/**
 * Result from image generation
 */
export interface ImageGenerationResult {
  success: boolean;
  imageId: string;
  width: number;
  height: number;
  seed?: number;
}

/**
 * Result from video generation
 */
export interface VideoGenerationResult {
  success: boolean;
  videoId: string;
  duration: number;
  fps: number;
}

/**
 * Result from text generation
 */
export interface TextGenerationResult {
  success: boolean;
  response: string;
  json?: any;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}

/**
 * Result from AI image upscaling
 */
export interface UpscaleResult {
  success: boolean;
  imageId: string;
  width: number;
  height: number;
  seed?: number;
}

/**
 * CDN file metadata
 */
export interface CDNFileMetadata {
  fileId: string;
  url: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number;
  fps?: number;
}

/**
 * Options for downloading content from CDN
 */
export interface CDNDownloadOptions {
  /** Output format: 'jpg' | 'png' | 'gif' | 'mp4' (default: 'jpg' for images) */
  format?: 'jpg' | 'png' | 'gif' | 'mp4';
  /** Width for resize (optional) */
  width?: number;
  /** Height for resize (optional) */
  height?: number;
  /** Watermark CDN ID (optional) */
  watermark?: string;
  /** Watermark position (optional) */
  watermarkPosition?: WatermarkPosition;
  /** Seek timestamp in ms for video frame extraction (optional) */
  seek?: number;
}

/**
 * Result from CDN download
 */
export interface CDNDownloadResult {
  /** File content as Buffer */
  buffer: Buffer;
  /** MIME type of the content */
  mimeType: string;
  /** Content length in bytes */
  size: number;
}

/**
 * API error response
 */
export interface APIError {
  code: string;
  message: string;
  details?: any;
}

/**
 * Rate limit information
 */
export interface RateLimitInfo {
  operation: 'image' | 'video' | 'llm' | 'cdn';
  current: {
    requestsPer15Min: number;
    requestsPerDay: number;
    tokensPer15Min?: number;
    tokensPerDay?: number;
  };
  limit: {
    requestsPer15Min: number;
    requestsPerDay: number;
    tokensPer15Min?: number;
    tokensPerDay?: number;
  };
  resetAt: {
    window15Min: string;
    daily: string;
  };
}

/**
 * Current usage for a single operation
 */
export interface OperationUsage {
  current: {
    requestsPer15Min: number;
    requestsPerDay: number;
    tokensPer15Min?: number;
    tokensPerDay?: number;
  };
  remaining: {
    requestsPer15Min: number;
    requestsPerDay: number;
  };
  resetAt: {
    window15Min: string;
    daily: string;
  };
}

/**
 * API key settings
 */
export interface APIKeySettings {
  key: string;
  name: string;
  status: string;
  rateLimits: {
    image: {
      requestsPer15Min: number;
      requestsPerDay: number;
    };
    video: {
      requestsPer15Min: number;
      requestsPerDay: number;
    };
    llm: {
      requestsPer15Min: number;
      requestsPerDay: number;
      tokensPer15Min: number;
      tokensPerDay: number;
      maxPromptLength: number;
    };
    cdn: {
      requestsPer15Min: number;
      requestsPerDay: number;
    };
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

/**
 * Client configuration options
 */
export interface ClientOptions {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  retries?: number;
  debug?: boolean;
  // WebSocket options
  wsAutoReconnect?: boolean;           // Auto-reconnect on disconnect (default: true)
  wsReconnectIntervalMs?: number;      // Start delay for reconnect (default: 1000ms)
  wsMaxReconnectDelayMs?: number;      // Max delay for reconnect backoff (default: 30000ms)
  wsPingIntervalMs?: number;           // Ping interval to keep connection alive (default: 30000ms)
}

// ============================================================================
// WebSocket Request/Response Types
// ============================================================================

/**
 * WebSocket request for text-to-image generation
 *
 * @example
 * ```typescript
 * await client.wsGenerateImage({
 *   prompt: 'A beautiful sunset over mountains',
 *   style: 'realistic',
 *   format: 'landscape'
 * });
 * ```
 */
export interface WsImageRequest {
  /** Text description of the image to generate */
  prompt: string;
  /** Style preset: 'raw' | 'realistic' | 'text' | 'ciniji' | 'portrait' | 'cine' | 'sport' | 'fashion' | 'niji' | 'anime' | 'manga' | 'paint' */
  style?: string;
  /** Format preset: 'portrait' | 'landscape' | 'profile' | 'story' | 'post' | 'smartphone' | 'banner' */
  format?: string;
  /** Negative prompt - what to avoid in the image */
  negativePrompt?: string;
  /** Seed for reproducible results (0-2000000000) */
  seed?: number;
  /** Custom width (320-1344) - overrides format */
  width?: number;
  /** Custom height (320-1344) - overrides format */
  height?: number;
}

/**
 * WebSocket request for image-to-image editing
 *
 * @example
 * ```typescript
 * await client.wsGenerateImage({
 *   imageId: 'existing-image-id',
 *   prompt: 'add dramatic lighting'
 * });
 * ```
 */
export interface WsImg2ImgRequest {
  /** Source image ID from CDN to edit */
  imageId: string;
  /** Edit instructions describing the changes */
  prompt: string;
  /** Negative prompt - what to avoid in the image */
  negativePrompt?: string;
  /** Seed for reproducible results */
  seed?: number;
  /** Custom output width (320-1344) for resizing */
  width?: number;
  /** Custom output height (320-1344) for resizing */
  height?: number;
  /** Enable resize padding (default: false) */
  resizePad?: boolean;
}

/**
 * WebSocket request for image-to-video generation
 *
 * @example
 * ```typescript
 * await client.wsGenerateVideo({
 *   imageId: 'source-image-id',
 *   duration: 5,
 *   fps: 16
 * });
 * ```
 */
export interface WsVideoRequest {
  /** Source image ID from CDN */
  imageId: string;
  /** Video duration in seconds (1-10, default: 5) */
  duration?: number;
  /** Frames per second (8-60, default: 16) */
  fps?: number;
}

/**
 * WebSocket request for LLM text generation
 *
 * @example Basic text generation
 * ```typescript
 * await client.wsGenerateLlm({
 *   prompt: 'Explain quantum computing in simple terms'
 * });
 * ```
 *
 * @example With system prompt and memory
 * ```typescript
 * await client.wsGenerateLlm({
 *   prompt: 'What was my previous question?',
 *   system: 'You are a helpful coding assistant',
 *   memory: ['User: How do I use TypeScript?', 'Assistant: TypeScript is...']
 * });
 * ```
 *
 * @example JSON output
 * ```typescript
 * await client.wsGenerateLlm({
 *   prompt: 'List 3 programming languages',
 *   jsonFormat: true,
 *   jsonTemplate: { languages: 'array of language names' }
 * });
 * ```
 */
export interface WsLlmRequest {
  /** The prompt/question to send to the LLM */
  prompt: string;
  /** System prompt to set the LLM's behavior/persona */
  system?: string;
  /** Conversation history for context */
  memory?: string[];
  /** Enable JSON output mode */
  jsonFormat?: boolean;
  /** Template describing expected JSON structure */
  jsonTemplate?: { [key: string]: string };
  /** Use random seed for varied responses */
  useRandomSeed?: boolean;
  /** Enable markdown formatting in response */
  useMarkdown?: boolean;
  /** Image ID from CDN for vision/image analysis */
  imageId?: string;
}

/**
 * WebSocket request for AI image upscaling (img2ximg)
 *
 * @example
 * ```typescript
 * await client.wsUpscaleImage({
 *   imageId: 'source-image-id',
 *   factor: 2
 * });
 * ```
 */
export interface WsUpscaleRequest {
  /** Source image ID from CDN to upscale */
  imageId: string;
  /** Upscale factor: 2, 3, or 4 (default: 2) */
  factor?: number;
  /** Seed for reproducible results */
  seed?: number;
}

/**
 * WebSocket response for image generation
 */
export interface WsImageResponse {
  result: {
    imageId: string;
    width: number;
    height: number;
    seed: number;
  };
}

/**
 * WebSocket response for video generation
 */
export interface WsVideoResponse {
  result: {
    videoId: string;
    duration: number;
    fps: number;
  };
}

/**
 * WebSocket response for LLM generation
 */
export interface WsLlmResponse {
  result: {
    text: string;
    json?: any;
    tokensUsed: number;
  };
}

/**
 * WebSocket response for image upscaling
 */
export interface WsUpscaleResponse {
  result: {
    imageId: string;
    width: number;
    height: number;
    seed: number;
  };
}

/**
 * Union type for all WebSocket request data
 */
export type WsRequestData = WsImageRequest | WsImg2ImgRequest | WsVideoRequest | WsLlmRequest | WsUpscaleRequest;

/**
 * Union type for all WebSocket response data
 */
export type WsResponseData = WsImageResponse | WsVideoResponse | WsLlmResponse | WsUpscaleResponse;
