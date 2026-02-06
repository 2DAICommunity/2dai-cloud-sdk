# Changelog

All notable changes to the 2DAI SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.12.0] - 2026-02-06

### Added
- **STT Speech-to-Text** - Audio transcription via REST, WebSocket, and SSE streaming
  - `transcribeAudio()` - REST transcription
  - `transcribeAudioStream()` - REST SSE streaming with `onChunk` callback
  - `wsTranscribeAudio()` - WebSocket transcription
  - `wsTranscribeAudioStream()` - WebSocket streaming with `onChunk`/`onComplete`/`onError`
  - Formats: wav, mp3, aac, webm, ogg, m4a, flac (max 5MB)
  - Multi-language with auto-detection
- **TTS Text-to-Speech** - Voice synthesis via REST, WebSocket, and SSE streaming
  - `generateSpeech()` - REST voice generation
  - `generateSpeechStream()` - REST SSE streaming with `onChunk` callback
  - `wsGenerateSpeech()` - WebSocket voice generation
  - `wsGenerateSpeechStream()` - WebSocket streaming with `onChunk`/`onComplete`/`onError`
  - Voice models (`TTS_VOICES.PAUL`, `TTS_VOICES.ALICE`) and voice cloning via reference audio
  - Realtime mode (`realtime: true`) for low-latency via realtime engine (not compatible with voice cloning)
  - Speed control (0.25x - 4.0x), 6 output formats (mp3, opus, aac, flac, wav, pcm), 10 languages
  - Response includes duration, language, characterCount
- **STT/TTS Tests** - Comprehensive test suites
  - `npm run test:stt` - STT tests (REST + WS + streaming)
  - `npm run test:tts` - TTS tests (REST + WS + streaming + realtime)

## [1.11.0] - 2026-02-03

### Added
- **AI Agent Integration** - New skill files for AI agent discovery and usage
  - `skill.md` - Root entry point for AI agents with YAML frontmatter
  - `skills/image-generation.md` - Image generation skill documentation
  - `skills/video-generation.md` - Video generation skill documentation
  - `skills/llm-text.md` - LLM text generation skill documentation
  - `skills/cdn-operations.md` - CDN operations skill documentation
  - `skills/openai-compatible.md` - OpenAI-compatible API skill documentation
  - Enables any AI agent (Claude, GPT, open-source) to discover and use the SDK
  - YAML frontmatter for machine-readable capability metadata
  - Comprehensive curl examples and parameter tables

- **Wiki Documentation** - New AI Agent Integration wiki page
  - Human-readable documentation for agent integration
  - Framework integrations (LangChain, Vercel AI, OpenAI SDK)
  - Decision trees for operations
  - Best practices for agents

### Changed
- Updated recommended video settings to 6.5s at 16fps throughout documentation
- Updated official rate limits across all documentation

## [1.10.0] - 2026-02-02

### Added
- **Dual-Image Editing (imgs2img)** - New `imageId2` parameter for dual-image workflows
  - Combine subjects: `make an image with both subjects`
  - Blend characters: `blend the character from image 2 into the scene of image 1`
  - Mix elements: `mix elements from image 2 into image 1`
  - Available via REST `editImage()` and WebSocket `wsGenerateImage()`
  - `imageId` = image 1 (primary), `imageId2` = image 2 (secondary)

### Example
```typescript
// Combine subjects from both images
const result = await client.editImage('image-1-id', {
  imageId2: 'image-2-id',
  prompt: 'make an image with both subjects'
});
```

## [1.9.0] - 2026-02-02

### Added
- **Vision/Multimodal Support** - `imageId` parameter now works for LLM image analysis
  - Pass `imageId` to `generateText()` or `wsGenerateLlm()` for image understanding
  - Images are automatically fetched from CDN and converted to base64
  - Supports JPEG, PNG, GIF, and WebP formats
  - Works with both REST API and WebSocket connections

### Fixed
- **Client Disconnect Handling** - Generation requests are now cancelled when clients disconnect
  - REST endpoints cancel upstream GPU processing on client disconnect
  - Rate limit slots are properly released on disconnect
  - Prevents wasted compute resources for abandoned requests

- **Error Logging** - Error objects now properly serialize in logs
  - Previously showed `{}` for Error objects due to non-enumerable properties
  - Now correctly displays `name`, `message`, and `stack` properties

## [1.8.0] - 2026-01-30

### Added
- **Video Motion Prompt** - New `prompt` parameter for video generation
  - Control video motion/animation with text descriptions
  - Examples: "the scene view (the camera) pans left", "zoom in slowly", "smooth motion"
  - Available in both REST `generateVideo()` and WebSocket `wsGenerateVideo()`
  - Optional parameter, defaults to automatic motion detection

### Changed
- Updated internal workflow to Gen6 v6.7.0 compatibility
- Improved video generation quality with new motion control system

## [1.7.0] - 2026-01-22

### Added
- **Upstream Request Cancellation** - `abort()` now stops GPU processing server-side
  - Calling `controller.abort()` on REST streams cancels upstream generation
  - Calling `wsController.abort()` on WebSocket streams sends cancel to server
  - Client disconnects during streaming automatically cancel upstream requests
  - Saves compute resources when users cancel mid-generation

- **WebSocket Settings API** - Real-time settings access via WebSocket
  - `wsGetSettings()` - Get API key info and current settings with usage
  - `wsGetUsage(days?)` - Get usage statistics with daily breakdown (1-365 days)
  - `wsGetRateLimits()` - Get current rate limit status for all operations
  - New types: `WsUsageRequest`, `WsSettingsResponse`, `WsUsageResponse`, `WsRateLimitsResponse`

### Fixed
- **Accurate Token Breakdown** - `prompt_tokens` and `completion_tokens` now properly populated
  - Previously hardcoded to `0` for `prompt_tokens`
  - Affects both OpenAI-compatible endpoint and native LLM endpoints
  - WebSocket responses now include `promptTokens` and `completionTokens`

- **Rate Limits Response** - Added `operation` field to rate-limits response
  - Now includes `operation` name (`image`, `video`, `llm`, `cdn`) for each limit
  - Applies to both REST (`GET /settings/rate-limits`) and WebSocket (`get_rate_limits`)

### Changed
- `WsLlmResponse.result` now includes optional `promptTokens` and `completionTokens` fields
- `WsUsageResponse.usage.summary` now uses `total`, `successRate`, `totalTokens` instead of `totalRequests`, `successfulRequests`, `failedRequests`

## [1.6.0] - 2026-01-21

### Added
- **REST SSE Streaming** - `generateTextStream()` method for real-time text streaming
  - Returns `TextStreamController` with `abort()` and `done` promise
  - Callbacks: `onChunk(chunk)`, `onComplete(result)`, `onError(error)`
  - Proper SSE event parsing with `[DONE]` signal handling
  - Accumulates text chunks and returns full response on completion

- **WebSocket Streaming** - `wsGenerateLlmStream()` method for WebSocket-based streaming
  - Lower latency than SSE for applications already using WebSocket
  - Supports concurrent streams with request ID tracking
  - Returns `WsStreamController` with `requestId` and `abort()` method
  - Handles `llm_chunk` messages for real-time chunk delivery

- **Streaming Types** - New TypeScript interfaces for streaming
  - `TextStreamOptions` - Options with onChunk/onComplete/onError callbacks
  - `TextStreamChunk` - Chunk data from SSE stream
  - `TextStreamResult` - Final result with accumulated text and token count
  - `TextStreamController` - Controller with abort() and done promise
  - `WsLlmStreamRequest` - WebSocket streaming request type
  - `WsStreamCallbacks` - WebSocket streaming callbacks
  - `WsStreamController` - WebSocket stream controller

- **Streaming Constants** - New configuration constants
  - `STREAM_DEFAULTS.TIMEOUT_MS` - Default streaming timeout (5 minutes)
  - `STREAM_DEFAULTS.RETRY_MS` - SSE retry interval
  - `WS_STREAM_TYPES.LLM_CHUNK` - WebSocket chunk message type

- **Streaming Tests** - Comprehensive test coverage
  - REST SSE tests: basic, accumulation, abort, system prompt, memory
  - WebSocket streaming tests: basic, concurrent, abort, system prompt
  - Error handling tests for empty prompt and connection errors

### Changed
- JSON format (`jsonFormat: true`) is not supported with streaming - use non-streaming for JSON
- Rate limiting applies to streaming requests (slot acquired at start, released at completion)

## [1.5.3] - 2026-01-15

### Added
- **Comic Book Style** - New `comicbook` style preset for Comic book illustration
- Now 14 style presets available

## [1.5.2] - 2026-01-15

### Added
- **Watercolor Style** - New `watercolor` style preset for Watercolor Anime generation
- Now 13 style presets available

### Changed
- Updated `manga` style with improved parameters

## [1.5.1] - 2026-01-09

### Documentation
- **Rate Limit Clarification** - Improved documentation for rate limits
  - Clarified that Image/Video/LLM use concurrent operation limits (max simultaneous operations)
  - Clarified that CDN uses traditional rate-based limits (requests per 15-minute window)
  - Added "Understanding Rate Limits" section to README with explanatory table
  - Updated code examples to use clearer terminology (active/available vs used)
  - Added JSDoc comments to TypeScript types explaining the difference

## [1.5.0] - 2026-01-07

### Added
- **CDN Download Method** - New `downloadFromCDN()` method for downloading images and videos
  - Downloads content with automatic Bearer token authentication
  - Supports format conversion (jpg, png, gif, mp4)
  - Supports resize with `width` and `height` options
  - Supports watermarking with `watermark` and `watermarkPosition` options
  - Supports video frame extraction with `seek` option (milliseconds)
  - Returns `{ buffer, mimeType, size }`
- New types: `CDNDownloadOptions`, `CDNDownloadResult`

### Changed
- Updated CDN documentation to clarify that CDN URLs require Bearer token authentication
- Added "Downloading Content" section with `downloadFromCDN()` examples
- Renamed "Downloading Files" to "Manual Download with Axios" for manual axios usage

## [1.4.2] - 2026-01-06

### Changed
- Set up GitHub Actions for automated npm publishing with provenance
- Updated npm package links and badges in README
- Removed rate limits section from documentation

## [1.4.0] - 2025-12-22

### Added
- **AI Image Upscale** - New methods for AI-powered image upscaling
  - `upscaleImage(imageId, options)` - REST API upscaling with factor 2-4x
  - `wsUpscaleImage(data)` - WebSocket upscaling for real-time operations
  - New types: `UpscaleOptions`, `UpscaleResult`, `WsUpscaleRequest`, `WsUpscaleResponse`
  - New constants: `UPSCALE_FACTOR` (MIN: 2, MAX: 4, DEFAULT: 2)

- **Image Description (Vision)** - Analyze images with LLM
  - Added `imageId` parameter to `TextGenerationOptions` for image analysis
  - Added `imageId` parameter to `WsLlmRequest` for WebSocket image analysis
  - Supports structured JSON output for image data extraction

### Changed
- Updated `WsRequestData` union type to include `WsUpscaleRequest`
- Updated `WsResponseData` union type to include `WsUpscaleResponse`
- Added `wsSend()` overload for `'generate_upscale'` type
- Added `WS_TYPES.UPSCALE` constant for WebSocket message type

## [1.3.0] - 2025-12-18

### Added
- **Full WebSocket Client** - Complete WebSocket implementation with all features
  - `wsConnect()` - Connect to WebSocket server with authentication
  - `wsGenerateImage()` - Generate images (text2img or img2img) via WebSocket
  - `wsGenerateVideo()` - Generate videos from images via WebSocket
  - `wsGenerateLlm()` - Generate text via LLM over WebSocket
  - `wsIsConnected()` - Check WebSocket connection status
  - `wsSend()` - Low-level WebSocket request method with request tracking

- **WebSocket Auto-Reconnect** - Automatic reconnection with exponential backoff
  - Configurable via `wsAutoReconnect`, `wsReconnectIntervalMs`, `wsMaxReconnectDelayMs` options
  - Automatic retry of pending requests after reconnection

- **WebSocket Keepalive** - Ping/pong mechanism to prevent connection timeouts
  - Configurable via `wsPingIntervalMs` option (default: 30000ms)
  - Prevents ALB/proxy idle timeout disconnections

- **WebSocket Request Tracking** - Request/response correlation via `requestId`
  - Each request gets unique ID for tracking
  - Timeout handling for pending requests

- **Image Resize for img2img** - New `width` and `height` parameters for image editing
  - `editImage()` now accepts `width` (320-1344) and `height` (320-1344)
  - `WsImg2ImgRequest` updated with `width`, `height`, and `negativePrompt`
  - Response includes actual dimensions when custom size is used

- **JSON Output in TextGenerationResult** - Added `json` field for parsed JSON
  - When `jsonFormat: true`, response now includes both `response` (string) and `json` (parsed object)

- **WebSocket Type Definitions** - New exported types
  - `WsImageRequest`, `WsImg2ImgRequest`, `WsVideoRequest`, `WsLlmRequest`
  - `WsImageResponse`, `WsVideoResponse`, `WsLlmResponse`
  - `WsRequestData`, `WsResponseData` union types

- **WebSocket Constants** - New constants for WebSocket configuration
  - `WS_DEFAULTS` - Default values for WebSocket options
  - `WS_TYPES` - WebSocket message type constants

### Changed
- `editImage()` signature changed from `Omit<..., 'format' | 'width' | 'height'>` to `Omit<..., 'format' | 'style'>` to allow width/height
- `VALID_STYLE_IDS` and `VALID_FORMAT_IDS` now derived from STYLES/FORMATS objects
- Removed `client.gen` property (use imported `STYLES` and `FORMATS` directly)

### Testing
- Added img2img resize tests (REST and WebSocket)
- Added new test script: `npm run test:ws:client` for WebSocket client tests
- Added `websocket.client.test.ts` for client-specific WebSocket tests

## [1.2.0] - 2025-12-17

### Added
- **Video Frame Extraction** - Extract frames from videos at specific timestamps
  - Use `?seek=<ms>` query parameter on CDN URLs to extract frames
  - Supports JPG and PNG output formats
  - Can be combined with resize (`?w=256&h=256`) and watermark options
  - Example: `/cdn/{videoId}.jpg?seek=1500` extracts frame at 1.5 seconds
- **WatermarkPosition Constants** - Type-safe watermark positioning
  - Sharp gravity constants: `center`, `northwest`, `north`, `northeast`, `west`, `east`, `southwest`, `south`, `southeast`
  - Human-readable alternatives: `top-left`, `top-center`, `top-right`, `middle-left`, `middle-center`, `middle-right`, `bottom-left`, `bottom-center`, `bottom-right`
- **Video Metadata** - Enhanced video generation response
  - `duration` - Video duration in seconds (matches requested)
  - `fps` - Video frame rate (matches requested)

### Testing
- Added Video Frame Extraction test suite (5 tests)
- Added Watermark Position Constants test suite
- Added Video Metadata verification tests
- New test helper: `saveFrameFromCDN()` for saving extracted frames
- New test config options: `TEST_VIDEO_ID`, `TEST_WATERMARK_ID`

## [1.1.0] - 2024-12-14

### Changed
- **Style Update**: Replaced `legacy` style with new `text` style
  - New style: `STYLES.text` - "Text & Clarity" optimized for text rendering
  - Removed style: `STYLES.legacy` - Legacy 2DAI generation (deprecated)
- Updated style presets to match bot improvements

### Fixed
- Fixed typo in style name: `fashon` → `fashion`

### Migration
- Replace `STYLES.legacy` with `STYLES.text` or another style of your choice
- The `text` style is optimized for images containing text with improved clarity

## [1.0.3] - 2025-12-12

### Added
- **Markdown Formatting Support** - New `useMarkdown` option for LLM text generation
  - When enabled, responses include markdown formatting (headers, bullet points, code blocks)
  - Works with both REST API and WebSocket connections
  - Default: `false` (plain text responses)

### Testing
- Added markdown formatting tests to REST LLM test suite
- Added markdown formatting tests to WebSocket LLM test suite

## [1.0.2] - 2025-12-11

### Fixed
- Fixed JSON format responses returning empty string when `jsonFormat: true` is used
- LLM responses now correctly return stringified JSON when the `json` field is present in the API response

## [1.0.1] - 2024-12-09

### Added
- GIF file format support (`.gif`) for CDN operations
- Enhanced watermark debug logging for troubleshooting

### Documentation
- Added supported file formats list to README (`.jpg`, `.jpeg`, `.png`, `.gif`, `.mp4`)

## [1.0.0] - 2024-01-15

### Added
- Initial public release of 2dai-cloud-sdk
- Text-to-image generation with 12 style presets
- Image-to-image editing with strength control
- Image-to-video generation
- LLM text generation with memory and JSON format support
- 7 format presets for different aspect ratios
- WebSocket and REST API support
- Built-in rate limiting
- Watermarking support
- TypeScript type definitions
- Comprehensive test suite

### Changed
- Responses now only include `imageId` and `videoId`
- Users must construct CDN URLs manually: `https://api.2dai.io:800/api/v1/cdn/${id}.jpg`
- This change improves security and flexibility

### Security
- API keys are now validated server-side
- Removed internal CDN structure from client responses
- Added proper error handling for authentication failures
