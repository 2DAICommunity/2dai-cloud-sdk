/**
 * 2DAI SDK - Official TypeScript/JavaScript SDK
 * @version 1.12.0
 * @packageDocumentation
 */

// Export main client
export { TwoDAIClient, createClient } from './client';
export { default } from './client';

// Export types
export {
  ClientOptions,
  ImageGenerationOptions,
  VideoGenerationOptions,
  TextGenerationOptions,
  UpscaleOptions,
  ImageGenerationResult,
  VideoGenerationResult,
  TextGenerationResult,
  UpscaleResult,
  StylePreset,
  FormatPreset,
  WatermarkOptions,
  WatermarkPosition,
  CDNFileMetadata,
  CDNDownloadOptions,
  CDNDownloadResult,
  APIError,
  RateLimitInfo,
  APIKeySettings,
  // WebSocket request/response types
  WsImageRequest,
  WsImg2ImgRequest,
  WsVideoRequest,
  WsLlmRequest,
  WsUpscaleRequest,
  WsImageResponse,
  WsVideoResponse,
  WsLlmResponse,
  WsUpscaleResponse,
  WsRequestData,
  WsResponseData,
  // Streaming types
  TextStreamOptions,
  TextStreamChunk,
  TextStreamResult,
  TextStreamController,
  WsLlmStreamRequest,
  WsStreamCallbacks,
  WsStreamController,
  // Settings types
  WsUsageRequest,
  WsSettingsResponse,
  WsUsageResponse,
  WsRateLimitsResponse,
  // STT types
  STTAudioFormat,
  STTOptions,
  STTResult,
  STTStreamOptions,
  STTStreamChunk,
  STTStreamResult,
  STTStreamController,
  WsSttRequest,
  WsSttResponse,
  WsSttStreamCallbacks,
  // TTS types
  TTSOutputFormat,
  TTSLanguage,
  TTSOptions,
  TTSResult,
  TTSStreamOptions,
  TTSStreamChunk,
  TTSStreamResult,
  TTSStreamController,
  WsTtsRequest,
  WsTtsResponse,
  WsTtsStreamCallbacks
} from './types';

// Export constants
export {
  STYLES,
  FORMATS,
  VALID_STYLE_IDS,
  VALID_FORMAT_IDS,
  VIDEO_FPS,
  VIDEO_DURATION,
  IMAGE_DIMENSIONS,
  SEED,
  UPSCALE_FACTOR,
  WS_DEFAULTS,
  WS_TYPES,
  // Streaming constants
  STREAM_DEFAULTS,
  WS_STREAM_TYPES,
  // STT constants
  STT_FORMATS,
  STT_MAX_AUDIO_SIZE_BYTES,
  // TTS constants
  TTS_VOICES,
  TTS_LANGUAGES,
  TTS_OUTPUT_FORMATS,
  TTS_SPEED,
  TTS_MAX_TEXT_LENGTH
} from './constants';
