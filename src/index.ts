/**
 * 2DAI SDK - Official TypeScript/JavaScript SDK
 *
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
  WsResponseData
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
  WS_TYPES
} from './constants';
