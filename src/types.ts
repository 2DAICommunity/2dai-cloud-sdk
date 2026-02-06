/**
 * Type definitions for 2DAI SDK
 * @version 1.12.0
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
  /** Image 2 (secondary) for dual-image mode - merge, blend, or mix two images together */
  imageId2?: string;
}

/**
 * Options for video generation
 */
export interface VideoGenerationOptions {
  imageId?: string;
  imageBuffer?: Buffer;
  prompt?: string;
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
 *
 * **Note on Limits:**
 * - **Image/Video/LLM**: `requestsPer15Min` = max simultaneous operations allowed
 * - **CDN**: `requestsPer15Min` = requests per 15-minute window
 *
 * For image, video, and LLM operations, limits are based on how many
 * operations can run at the same time. The count decreases as operations complete.
 */
export interface RateLimitInfo {
  operation: 'image' | 'video' | 'llm' | 'cdn' | 'stt' | 'tts';
  current: {
    /** For image/video/llm: currently running operations. For cdn: requests in current window */
    requestsPer15Min: number;
    requestsPerDay: number;
    tokensPer15Min?: number;
    tokensPerDay?: number;
  };
  limit: {
    /** For image/video/llm: max concurrent operations. For cdn: max requests per 15min */
    requestsPer15Min: number;
    requestsPerDay: number;
    tokensPer15Min?: number;
    tokensPerDay?: number;
  };
  resetAt: {
    /** Reset time (mainly relevant for CDN rate-based limits) */
    window15Min: string;
    daily: string;
  };
}

/**
 * Current usage for a single operation
 *
 * For image/video/llm operations:
 * - `current.requestsPer15Min` = currently running operations
 * - `remaining.requestsPer15Min` = available capacity
 *
 * For CDN operations:
 * - Standard rate limiting with 15-minute and daily windows
 */
export interface OperationUsage {
  current: {
    /** For image/video/llm: active operations. For cdn: requests in window */
    requestsPer15Min: number;
    requestsPerDay: number;
    tokensPer15Min?: number;
    tokensPerDay?: number;
  };
  remaining: {
    /** For image/video/llm: available capacity. For cdn: remaining in window */
    requestsPer15Min: number;
    requestsPerDay: number;
  };
  resetAt: {
    /** Reset time (mainly relevant for CDN rate-based limits) */
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
    stt: {
      requestsPer15Min: number;
      requestsPerDay: number;
    };
    tts: {
      requestsPer15Min: number;
      requestsPerDay: number;
    };
  };
  currentUsage?: {
    image: OperationUsage;
    video: OperationUsage;
    llm: OperationUsage;
    cdn: OperationUsage;
    stt: OperationUsage;
    tts: OperationUsage;
  };
  llmSettings?: any;
  ttsSettings?: any;
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
  /** Style preset: 'raw' | 'realistic' | 'text' | 'ciniji' | 'portrait' | 'cine' | 'sport' | 'fashion' | 'niji' | 'anime' | 'manga' | 'watercolor' | 'comicbook' | 'paint' */
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
 * // Single image edit (img2img)
 * await client.wsGenerateImage({
 *   imageId: 'existing-image-id',
 *   prompt: 'add dramatic lighting'
 * });
 *
 * // Dual-image edit (imgs2img) - merge, blend, mix two images
 * await client.wsGenerateImage({
 *   imageId: 'image-1-id',
 *   imageId2: 'image-2-id',
 *   prompt: 'make an image with both subjects'
 * });
 * ```
 */
export interface WsImg2ImgRequest {
  /** Image 1 (primary) - CDN ID of the main image to edit */
  imageId: string;
  /** Image 2 (secondary) for dual-image mode - merge, blend, or mix two images together */
  imageId2?: string;
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
  /** Motion/animation prompt describing the video movement */
  prompt?: string;
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
    /** Number of prompt/input tokens (from vLLM) */
    promptTokens?: number;
    /** Number of completion/output tokens (from vLLM) */
    completionTokens?: number;
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
export type WsRequestData = WsImageRequest | WsImg2ImgRequest | WsVideoRequest | WsLlmRequest | WsUpscaleRequest | WsSttRequest | WsTtsRequest;

/**
 * Union type for all WebSocket response data
 */
export type WsResponseData = WsImageResponse | WsVideoResponse | WsLlmResponse | WsUpscaleResponse | WsSttResponse | WsTtsResponse;

// ============================================================================
// Streaming Types (REST SSE & WebSocket)
// ============================================================================

/**
 * Options for streaming text generation (REST SSE)
 *
 * @example
 * ```typescript
 * client.generateTextStream({
 *   prompt: 'Write a story',
 *   onChunk: (chunk) => process.stdout.write(chunk),
 *   onComplete: (result) => console.log('Done!', result.totalTokens),
 *   onError: (err) => console.error(err)
 * });
 * ```
 */
export interface TextStreamOptions extends Omit<TextGenerationOptions, 'jsonFormat' | 'jsonTemplate'> {
  /** Callback invoked for each text chunk as it arrives */
  onChunk?: (chunk: string) => void;
  /** Callback invoked when stream completes successfully */
  onComplete?: (result: TextStreamResult) => void;
  /** Callback invoked on error */
  onError?: (error: Error) => void;
}

/**
 * Text streaming chunk from SSE
 */
export interface TextStreamChunk {
  /** Text content of this chunk */
  chunk?: string;
  /** Whether this is the final chunk */
  done?: boolean;
  /** Token count (only in final chunk) */
  tokensUsed?: number;
  /** Error message if stream failed */
  error?: string;
}

/**
 * Result from text stream completion
 */
export interface TextStreamResult {
  /** Whether the stream completed successfully */
  success: boolean;
  /** Full accumulated text response */
  response: string;
  /** Total tokens used (if available) */
  totalTokens?: number;
}

/**
 * Stream controller returned by generateTextStream
 * Allows aborting the stream and waiting for completion
 */
export interface TextStreamController {
  /** Abort the stream */
  abort: () => void;
  /** Promise that resolves when stream completes */
  done: Promise<TextStreamResult>;
}

/**
 * WebSocket streaming request - extends WsLlmRequest with stream flag
 */
export interface WsLlmStreamRequest extends WsLlmRequest {
  /** Always true for streaming requests */
  stream: true;
}

/**
 * WebSocket streaming callbacks
 */
export interface WsStreamCallbacks {
  /** Called for each text chunk received */
  onChunk: (chunk: string) => void;
  /** Called when stream completes with full response */
  onComplete: (response: WsLlmResponse) => void;
  /** Called on error */
  onError: (error: Error) => void;
}

/**
 * WebSocket streaming controller
 */
export interface WsStreamController {
  /** Request ID for this stream */
  requestId: string;
  /** Abort the stream (sends cancel message to server) */
  abort: () => void;
}

// ============================================================================
// WebSocket Settings Types
// ============================================================================

/**
 * WebSocket request for usage statistics
 */
export interface WsUsageRequest {
  /** Number of days to get usage for (1-365, default: 30) */
  days?: number;
}

/**
 * WebSocket response for settings
 */
export interface WsSettingsResponse {
  settings: {
    status: string;
    rateLimits: {
      image: { requestsPer15Min: number; requestsPerDay: number };
      video: { requestsPer15Min: number; requestsPerDay: number };
      llm: { requestsPer15Min: number; requestsPerDay: number; tokensPer15Min?: number; tokensPerDay?: number };
      cdn: { requestsPer15Min: number; requestsPerDay: number };
      stt: { requestsPer15Min: number; requestsPerDay: number };
      tts: { requestsPer15Min: number; requestsPerDay: number };
    };
    currentUsage: {
      image: { current: any; remaining: { requestsPer15Min: number; requestsPerDay: number }; resetAt: any };
      video: { current: any; remaining: { requestsPer15Min: number; requestsPerDay: number }; resetAt: any };
      llm: { current: any; remaining: { requestsPer15Min: number; requestsPerDay: number }; resetAt: any };
      cdn: { current: any; remaining: { requestsPer15Min: number; requestsPerDay: number }; resetAt: any };
      stt: { current: any; remaining: { requestsPer15Min: number; requestsPerDay: number }; resetAt: any };
      tts: { current: any; remaining: { requestsPer15Min: number; requestsPerDay: number }; resetAt: any };
    };
    lastUsedAt?: string;
  };
}

/**
 * WebSocket response for usage statistics
 */
export interface WsUsageResponse {
  usage: {
    period: {
      start: string;
      end: string;
      days: number;
    };
    summary: {
      total: number;
      byOperation: { [key: string]: number };
      totalTokens: number;
      successRate: number;
    };
    daily: Array<{
      date: string;
      total: number;
      byOperation: { [key: string]: number };
      tokens: number;
    }>;
  };
}

/**
 * WebSocket response for rate limits
 */
export interface WsRateLimitsResponse {
  rateLimits: RateLimitInfo[];
}

// ============================================================================
// STT (Speech-to-Text) Types
// ============================================================================

/**
 * Supported audio formats for STT
 */
export type STTAudioFormat = 'wav' | 'mp3' | 'aac' | 'webm' | 'ogg' | 'm4a' | 'flac';

/**
 * Options for speech-to-text transcription
 */
export interface STTOptions {
  /** Base64 encoded audio data */
  audio: string;
  /** Audio format */
  audioFormat: STTAudioFormat;
  /** Language code (ISO 639-1) or 'auto' for detection */
  language?: string;
  /** Context hint to improve transcription accuracy */
  prompt?: string;
}

/**
 * Result from speech-to-text transcription
 */
export interface STTResult {
  success: boolean;
  /** Transcribed text */
  text: string;
  /** Detected language code */
  language?: string;
}

/**
 * Options for streaming speech-to-text (REST SSE)
 *
 * @example
 * ```typescript
 * const controller = client.transcribeAudioStream({
 *   audio: audioBase64,
 *   audioFormat: 'wav',
 *   onChunk: (chunk, lang) => process.stdout.write(chunk),
 *   onComplete: (result) => console.log('Done:', result.text),
 *   onError: (err) => console.error(err)
 * });
 * ```
 */
export interface STTStreamOptions extends STTOptions {
  /** Callback for each transcription chunk */
  onChunk?: (chunk: string, language?: string) => void;
  /** Callback when stream completes */
  onComplete?: (result: STTStreamResult) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
}

/**
 * STT streaming chunk from SSE
 */
export interface STTStreamChunk {
  /** Transcribed text chunk */
  chunk?: string;
  /** Detected language */
  language?: string;
  /** Whether this is the final chunk */
  done?: boolean;
  /** Full transcribed text (only in final chunk) */
  text?: string;
  /** Error message if stream failed */
  error?: string;
}

/**
 * Result from STT stream completion
 */
export interface STTStreamResult {
  success: boolean;
  /** Full transcribed text */
  text: string;
  /** Detected language */
  language?: string;
}

/**
 * Stream controller for STT streaming
 */
export interface STTStreamController {
  /** Abort the stream */
  abort: () => void;
  /** Promise that resolves when stream completes */
  done: Promise<STTStreamResult>;
}

/**
 * WebSocket request for STT transcription
 *
 * @example
 * ```typescript
 * const result = await client.wsTranscribeAudio({
 *   audio: audioBase64,
 *   audioFormat: 'wav'
 * });
 * console.log(result.result.text);
 * ```
 */
export interface WsSttRequest {
  /** Base64 encoded audio data */
  audio: string;
  /** Audio format */
  audioFormat: STTAudioFormat;
  /** Language code or 'auto' */
  language?: string;
  /** Context hint */
  prompt?: string;
}

/**
 * WebSocket response for STT transcription
 */
export interface WsSttResponse {
  result: {
    /** Transcribed text */
    text: string;
    /** Detected language */
    language?: string;
  };
}

/**
 * WebSocket STT streaming callbacks
 */
export interface WsSttStreamCallbacks {
  /** Called for each transcription chunk */
  onChunk: (chunk: string, language?: string) => void;
  /** Called when stream completes */
  onComplete: (response: WsSttResponse) => void;
  /** Called on error */
  onError: (error: Error) => void;
}

// ============================================================================
// TTS (Text-to-Speech) Types
// ============================================================================

/**
 * Supported output formats for TTS
 */
export type TTSOutputFormat = 'mp3' | 'opus' | 'aac' | 'flac' | 'wav' | 'pcm';

/**
 * Supported TTS languages
 */
export type TTSLanguage = 'auto' | 'en' | 'zh' | 'ja' | 'ko' | 'de' | 'fr' | 'es' | 'ru' | 'pt' | 'it';

/**
 * Options for text-to-speech generation
 *
 * Supports two modes:
 * 1. Voice Model: use a pre-configured voice (e.g., 'paul', 'alice')
 * 2. Voice Cloning: provide referenceAudio + referenceTranscript
 */
export interface TTSOptions {
  /** Text to synthesize (max 500 characters) */
  text: string;
  /** Voice model name (e.g., 'paul', 'alice') */
  voice?: string;
  /** Base64 encoded reference audio for voice cloning (3+ seconds) */
  referenceAudio?: string;
  /** Exact transcript of the reference audio (required with referenceAudio) */
  referenceTranscript?: string;
  /** Output language (default: 'auto') */
  language?: TTSLanguage;
  /** Speech speed multiplier (0.25 - 4.0, default: 1.0) */
  speed?: number;
  /** Output audio format (default: 'wav') */
  outputFormat?: TTSOutputFormat;
  /** Output sample rate in Hz (default: 12000) */
  sampleRate?: number;
  /** Use realtime mode for low-latency generation. Not compatible with voice cloning (referenceAudio). */
  realtime?: boolean;
}

/**
 * Result from text-to-speech generation
 */
export interface TTSResult {
  success: boolean;
  /** Base64 encoded audio data */
  audio?: string;
  /** CDN file ID (if audio exceeds threshold) */
  cdnFileId?: string;
  /** Output format used */
  format?: string;
  /** Audio duration in seconds */
  duration?: number;
  /** Output sample rate */
  sampleRate?: number;
  /** Number of characters processed */
  characterCount?: number;
  /** Language used */
  language?: string;
}

/**
 * Options for streaming TTS (REST SSE)
 *
 * @example
 * ```typescript
 * const controller = client.generateSpeechStream({
 *   text: 'Hello world',
 *   voice: 'paul',
 *   onChunk: (audio, text, lang) => playAudioChunk(audio),
 *   onComplete: (result) => console.log('Done:', result.duration, 'seconds'),
 *   onError: (err) => console.error(err)
 * });
 * ```
 */
export interface TTSStreamOptions extends TTSOptions {
  /** Callback for each audio chunk */
  onChunk?: (audio: string, text: string, language?: string) => void;
  /** Callback when stream completes */
  onComplete?: (result: TTSStreamResult) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
}

/**
 * TTS streaming chunk from SSE
 */
export interface TTSStreamChunk {
  /** Base64 encoded audio chunk */
  audio?: string;
  /** Text fragment synthesized */
  text?: string;
  /** Language used */
  language?: string;
  /** Whether this is the final summary chunk */
  done?: boolean;
  /** Output format (only in final chunk) */
  format?: string;
  /** Audio duration in seconds (only in final chunk) */
  duration?: number;
  /** Sample rate (only in final chunk) */
  sampleRate?: number;
  /** Character count (only in final chunk) */
  characterCount?: number;
  /** CDN file ID (only in final chunk) */
  cdnFileId?: string;
  /** Error message if stream failed */
  error?: string;
}

/**
 * Result from TTS stream completion
 */
export interface TTSStreamResult {
  success: boolean;
  /** Output format */
  format?: string;
  /** Audio duration in seconds */
  duration?: number;
  /** Sample rate */
  sampleRate?: number;
  /** Number of characters processed */
  characterCount?: number;
  /** Language used */
  language?: string;
  /** CDN file ID */
  cdnFileId?: string;
}

/**
 * Stream controller for TTS streaming
 */
export interface TTSStreamController {
  /** Abort the stream */
  abort: () => void;
  /** Promise that resolves when stream completes */
  done: Promise<TTSStreamResult>;
}

/**
 * WebSocket request for TTS generation
 *
 * @example
 * ```typescript
 * const result = await client.wsGenerateSpeech({
 *   text: 'Hello world',
 *   voice: 'paul'
 * });
 * console.log(result.result.duration, 'seconds');
 * ```
 */
export interface WsTtsRequest {
  /** Text to synthesize */
  text: string;
  /** Voice model name */
  voice?: string;
  /** Base64 reference audio for voice cloning */
  referenceAudio?: string;
  /** Transcript of reference audio */
  referenceTranscript?: string;
  /** Output language */
  language?: TTSLanguage;
  /** Speech speed (0.25 - 4.0) */
  speed?: number;
  /** Output format */
  outputFormat?: TTSOutputFormat;
  /** Sample rate in Hz */
  sampleRate?: number;
  /** Use realtime mode for low-latency generation. Not compatible with voice cloning (referenceAudio). */
  realtime?: boolean;
}

/**
 * WebSocket response for TTS generation
 */
export interface WsTtsResponse {
  result: {
    /** Base64 encoded audio */
    audio?: string;
    /** CDN file ID */
    cdnFileId?: string;
    /** Output format */
    format?: string;
    /** Audio duration in seconds */
    duration?: number;
    /** Sample rate */
    sampleRate?: number;
    /** Characters processed */
    characterCount?: number;
    /** Language used */
    language?: string;
  };
}

/**
 * WebSocket TTS streaming callbacks
 */
export interface WsTtsStreamCallbacks {
  /** Called for each audio chunk */
  onChunk: (audio: string, text: string, language?: string) => void;
  /** Called when stream completes */
  onComplete: (response: WsTtsResponse) => void;
  /** Called on error */
  onError: (error: Error) => void;
}
