/**
 * 2DAI SDK Client
 * Official TypeScript/JavaScript client for 2DAI API
 * @version 1.11.0
 */

import WebSocket from 'ws';
import axios, { AxiosInstance } from 'axios';
import {
  ClientOptions,
  ImageGenerationOptions,
  VideoGenerationOptions,
  TextGenerationOptions,
  ImageGenerationResult,
  VideoGenerationResult,
  TextGenerationResult,
  UpscaleOptions,
  UpscaleResult,
  CDNDownloadOptions,
  CDNDownloadResult,
  APIKeySettings,
  RateLimitInfo,
  APIError,
  WsRequestData,
  WsResponseData,
  WsImageRequest,
  WsImg2ImgRequest,
  WsVideoRequest,
  WsLlmRequest,
  WsUpscaleRequest,
  WsImageResponse,
  WsVideoResponse,
  WsLlmResponse,
  WsUpscaleResponse,
  // Streaming types
  TextStreamOptions,
  TextStreamChunk,
  TextStreamResult,
  TextStreamController,
  WsStreamCallbacks,
  WsStreamController,
  // Settings types
  WsUsageRequest,
  WsSettingsResponse,
  WsUsageResponse,
  WsRateLimitsResponse
} from './types';
import {
  DEFAULT_BASE_URL,
  DEFAULT_TIMEOUT,
  WS_DEFAULTS,
  STREAM_DEFAULTS
} from './constants';

/**
 * WebSocket pending request
 */
interface WsPendingRequest {
  request: any;
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}

/**
 * Main 2DAI SDK Client
 */
export class TwoDAIClient {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;
  private debug: boolean;
  private axios: AxiosInstance;

  // WebSocket properties
  private ws: WebSocket | null = null;
  private wsPingInterval: NodeJS.Timeout | null = null;
  private wsReconnectAttempts = 0;
  private wsPendingRequests = new Map<string, WsPendingRequest>();
  private wsShouldReconnect = true;
  private wsAuthenticated = false;
  private wsConnecting = false;
  private wsClosingIntentionally = false;
  // Streaming callbacks for WebSocket
  private wsStreamCallbacks = new Map<string, WsStreamCallbacks>();
  private wsOptions: {
    autoReconnect: boolean;
    reconnectIntervalMs: number;
    maxReconnectDelayMs: number;
    pingIntervalMs: number;
  };

  /**
   * Create a new 2DAI SDK client
   *
   * @param options Client configuration options
   */
  constructor(options: ClientOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl || DEFAULT_BASE_URL;
    this.timeout = options.timeout || DEFAULT_TIMEOUT;
    this.debug = options.debug || false;

    // Initialize WebSocket options
    this.wsOptions = {
      autoReconnect: options.wsAutoReconnect ?? WS_DEFAULTS.AUTO_RECONNECT,
      reconnectIntervalMs: options.wsReconnectIntervalMs ?? WS_DEFAULTS.RECONNECT_INTERVAL_MS,
      maxReconnectDelayMs: options.wsMaxReconnectDelayMs ?? WS_DEFAULTS.MAX_RECONNECT_DELAY_MS,
      pingIntervalMs: options.wsPingIntervalMs ?? WS_DEFAULTS.PING_INTERVAL_MS
    };

    // Validate API key format
    if (!this.apiKey || !this.apiKey.startsWith('2dai_pk_')) {
      throw new Error('Invalid API key format. Must start with "2dai_pk_"');
    }

    // Create axios instance with default config
    this.axios = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    // Add response interceptor for error handling
    this.axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response) {
          const apiError: APIError = error.response.data.error || {
            code: 'UNKNOWN_ERROR',
            message: error.message
          };
          throw new Error(`[${apiError.code}] ${apiError.message}`);
        }
        throw error;
      }
    );

    this.log('Client initialized', { baseUrl: this.baseUrl });
  }

  /**
   * Log debug messages
   */
  private log(message: string, data?: any): void {
    if (this.debug) {
      console.log(`[2DAI SDK] ${message}`, data || '');
    }
  }

  /**
   * Generate an image from a text prompt
   */
  async generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
    this.log('Generating image', { prompt: options.prompt });

    try {
      const response = await this.axios.post('/api/v1/generation/image', {
        prompt: options.prompt,
        negativePrompt: options.negativePrompt,
        style: typeof options.style === 'string' ? options.style : options.style?.id,
        format: typeof options.format === 'string' ? options.format : options.format?.id,
        width: options.width,
        height: options.height,
        seed: options.seed
      });

      return {
        success: response.data.success,
        imageId: response.data.data.imageId,
        width: response.data.data.width,
        height: response.data.data.height,
        seed: response.data.data.seed
      };
    } catch (error: any) {
      this.log('Image generation error', error.message);
      throw error;
    }
  }

  /**
   * Edit an existing image (img2img) or merge two images (imgs2img)
   *
   * Single-image mode: Edit an existing image with a prompt
   * Dual-image mode: Use imageId2 to merge, blend, or mix two images
   *
   * @param imageId Image 1 (primary image) - CDN ID
   * @param options Edit options including optional imageId2 (image 2) for dual-image mode
   *
   * @example
   * // Single image edit
   * await client.editImage('image-id', { prompt: 'make it black and white' });
   *
   * // Dual-image edit (combine subjects)
   * await client.editImage('image-1-id', {
   *   imageId2: 'image-2-id',
   *   prompt: 'make an image with both subjects'
   * });
   */
  async editImage(imageId: string, options: Omit<ImageGenerationOptions, 'format' | 'style'>): Promise<ImageGenerationResult> {
    this.log(options.imageId2 ? 'Dual-image edit (imgs2img)' : 'Editing image', {
      imageId,
      ...(options.imageId2 && { imageId2: options.imageId2 }),
      prompt: options.prompt,
      ...(options.width !== undefined && { width: options.width }),
      ...(options.height !== undefined && { height: options.height }),
      ...(options.resizePad !== undefined && { resizePad: options.resizePad })
    });

    try {
      const response = await this.axios.post('/api/v1/generation/image/edit', {
        imageId,
        imageId2: options.imageId2,
        prompt: options.prompt,
        negativePrompt: options.negativePrompt,
        seed: options.seed,
        width: options.width,
        height: options.height,
        resizePad: options.resizePad
      });

      return {
        success: response.data.success,
        imageId: response.data.data.imageId,
        width: response.data.data.width || 0,
        height: response.data.data.height || 0,
        seed: response.data.data.seed
      };
    } catch (error: any) {
      this.log('Image edit error', error.message);
      throw error;
    }
  }

  /**
   * AI upscale an image (img2ximg)
   * Uses AI to generate prompt automatically - no user prompt needed
   *
   * @param imageId Source image ID from CDN
   * @param options Upscale options (factor: 2-4, default: 2)
   */
  async upscaleImage(imageId: string, options: UpscaleOptions = {}): Promise<UpscaleResult> {
    this.log('Upscaling image', { imageId, factor: options.factor ?? 2 });

    if (!imageId) {
      throw new Error('imageId is required for upscaling');
    }

    try {
      const response = await this.axios.post('/api/v1/generation/image/upscale', {
        imageId,
        factor: options.factor ?? 2,
        seed: options.seed
      });

      return {
        success: response.data.success,
        imageId: response.data.data.imageId,
        width: response.data.data.width || 0,
        height: response.data.data.height || 0,
        seed: response.data.data.seed
      };
    } catch (error: any) {
      this.log('Upscale error', error.message);
      throw error;
    }
  }

  /**
   * Generate a video from an image
   */
  async generateVideo(options: VideoGenerationOptions): Promise<VideoGenerationResult> {
    this.log('Generating video', { imageId: options.imageId, prompt: options.prompt, duration: options.duration });

    if (!options.imageId) {
      throw new Error('imageId is required for video generation');
    }

    try {
      const response = await this.axios.post('/api/v1/generation/video', {
        imageId: options.imageId,
        prompt: options.prompt,
        duration: options.duration ?? 5,
        fps: options.fps ?? 16
      });

      return {
        success: response.data.success,
        videoId: response.data.data.videoId,
        duration: response.data.data.duration,
        fps: response.data.data.fps
      };
    } catch (error: any) {
      this.log('Video generation error', error.message);
      throw error;
    }
  }

  /**
   * Generate text using LLM
   */
  async generateText(options: TextGenerationOptions): Promise<TextGenerationResult> {
    this.log('Generating text', {
      prompt: options.prompt,
      ...(options.imageId && { imageId: options.imageId })
    });

    try {
      const response = await this.axios.post('/api/v1/llm/generate', {
        prompt: options.prompt,
        system: options.system,
        memory: options.memory,
        jsonFormat: options.jsonFormat,
        jsonTemplate: options.jsonTemplate,
        useRandomSeed: options.useRandomSeed,
        askKnowledge: options.askKnowledge,
        useMarkdown: options.useMarkdown,
        imageId: options.imageId
      });

      const llmData = response.data.data || {};

      // Build response
      const result: TextGenerationResult = {
        success: response.data.success,
        response: llmData.json
          ? JSON.stringify(llmData.json)
          : (llmData.text || ''),
        inputTokens: llmData.inputTokens,
        outputTokens: llmData.outputTokens,
        totalTokens: llmData.tokensUsed
      };

      // Add parsed JSON if jsonFormat was requested
      if (options.jsonFormat && llmData.json) {
        result.json = llmData.json;
      }

      return result;
    } catch (error: any) {
      this.log('Text generation error', error.message);
      throw error;
    }
  }

  /**
   * Generate text using LLM with streaming (Server-Sent Events)
   *
   * Streams text token-by-token for real-time display.
   * Returns a controller that can be used to abort the stream.
   *
   * Note: JSON format is not supported with streaming.
   *
   * @example Basic streaming
   * ```typescript
   * const controller = client.generateTextStream({
   *   prompt: 'Write a story',
   *   onChunk: (chunk) => process.stdout.write(chunk),
   *   onComplete: (result) => console.log('\nDone!', result.totalTokens, 'tokens'),
   *   onError: (err) => console.error('Error:', err.message)
   * });
   *
   * // Wait for completion
   * const result = await controller.done;
   * ```
   *
   * @example Abort stream
   * ```typescript
   * const controller = client.generateTextStream({
   *   prompt: 'Write a very long story',
   *   onChunk: (chunk) => console.log(chunk)
   * });
   *
   * // Abort after 5 seconds
   * setTimeout(() => controller.abort(), 5000);
   * ```
   */
  generateTextStream(options: TextStreamOptions): TextStreamController {
    this.log('Starting text stream', { prompt: options.prompt.substring(0, 50) });

    const abortController = new AbortController();
    let accumulatedText = '';
    let totalTokens = 0;

    const done = new Promise<TextStreamResult>(async (resolve, reject) => {
      try {
        const response = await this.axios.post(
          '/api/v1/llm/generate/stream',
          {
            prompt: options.prompt,
            system: options.system,
            memory: options.memory,
            useRandomSeed: options.useRandomSeed,
            useMarkdown: options.useMarkdown,
            imageId: options.imageId
            // Note: jsonFormat not supported for streaming
          },
          {
            responseType: 'stream',
            signal: abortController.signal,
            timeout: STREAM_DEFAULTS.TIMEOUT_MS,
            headers: {
              'Accept': 'text/event-stream',
              'Cache-Control': 'no-cache'
            }
          }
        );

        const stream = response.data;
        let buffer = '';

        stream.on('data', (chunk: Buffer) => {
          buffer += chunk.toString();

          // Process complete SSE events
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);

              if (data === '[DONE]') {
                // Stream complete
                const result: TextStreamResult = {
                  success: true,
                  response: accumulatedText,
                  totalTokens: totalTokens || undefined
                };

                if (options.onComplete) {
                  options.onComplete(result);
                }

                resolve(result);
                return;
              }

              try {
                const parsed: TextStreamChunk = JSON.parse(data);

                if (parsed.error) {
                  const error = new Error(parsed.error);
                  if (options.onError) options.onError(error);
                  reject(error);
                  return;
                }

                if (parsed.chunk) {
                  accumulatedText += parsed.chunk;
                  if (options.onChunk) {
                    options.onChunk(parsed.chunk);
                  }
                }

                if (parsed.done && parsed.tokensUsed) {
                  totalTokens = parsed.tokensUsed;
                }
              } catch (e: any) {
                // Handle abort/cancel errors from onChunk callback
                if (e.name === 'AbortError' || e.name === 'CanceledError' ||
                    e.code === 'ERR_CANCELED' || e.message === 'canceled') {
                  const result: TextStreamResult = {
                    success: false,
                    response: accumulatedText
                  };
                  resolve(result);
                  return;
                }
                this.log('Failed to parse SSE data', data);
              }
            }
          }
        });

        stream.on('error', (error: any) => {
          // Handle abort/cancel errors gracefully
          if (error.name === 'AbortError' || error.name === 'CanceledError' ||
              error.code === 'ERR_CANCELED' || error.message === 'canceled') {
            const result: TextStreamResult = {
              success: false,
              response: accumulatedText
            };
            resolve(result);
            return;
          }
          this.log('Stream error', error.message);
          if (options.onError) options.onError(error);
          reject(error);
        });

        stream.on('end', () => {
          // If we get here without [DONE], resolve with what we have
          if (accumulatedText) {
            const result: TextStreamResult = {
              success: true,
              response: accumulatedText,
              totalTokens: totalTokens || undefined
            };

            if (options.onComplete) {
              options.onComplete(result);
            }

            resolve(result);
          }
        });

      } catch (error: any) {
        // Handle abort/cancel errors gracefully
        if (error.name === 'AbortError' || error.name === 'CanceledError' ||
            error.code === 'ERR_CANCELED' || error.message === 'canceled') {
          const result: TextStreamResult = {
            success: false,
            response: accumulatedText
          };
          resolve(result);
          return;
        }

        this.log('Stream request error', error.message);
        if (options.onError) options.onError(error);
        reject(error);
      }
    });

    return {
      abort: () => abortController.abort(),
      done
    };
  }

  /**
   * Get API key settings
   */
  async getSettings(): Promise<APIKeySettings> {
    this.log('Getting API key settings');

    try {
      const response = await this.axios.get('/api/v1/settings');
      return response.data.data;
    } catch (error: any) {
      throw new Error(`Failed to get settings: ${error.message}`);
    }
  }

  /**
   * Update API key watermark
   */
  async updateWatermark(watermarkCdnId: string | undefined): Promise<boolean> {
    this.log('Updating watermark', { watermarkCdnId });

    try {
      const response = await this.axios.put('/api/v1/settings', {
        watermarkCdnId
      });
      return response.data.success;
    } catch (error: any) {
      throw new Error(`Failed to update watermark: ${error.message}`);
    }
  }

  /**
   * Check rate limits for all operations
   */
  async checkLimits(): Promise<RateLimitInfo[]> {
    this.log('Checking rate limits');

    try {
      const response = await this.axios.get('/api/v1/settings/rate-limits');
      return response.data.data;
    } catch (error: any) {
      throw new Error(`Failed to check limits: ${error.message}`);
    }
  }

  /**
   * Get health status of the API
   */
  async health(): Promise<{ status: string; timestamp: string }> {
    this.log('Checking health');

    try {
      const response = await this.axios.get('/health');
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to check health: ${error.message}`);
    }
  }

  /**
   * Download content from CDN
   * Works with both images and videos
   *
   * @param id - CDN file ID (imageId or videoId)
   * @param options - Optional download options (format, resize, watermark, seek)
   * @returns CDNDownloadResult with buffer, mimeType, and size
   *
   * @example
   * ```typescript
   * // Download image as buffer
   * const { buffer } = await client.downloadFromCDN(imageId);
   * fs.writeFileSync('image.jpg', buffer);
   *
   * // Download with format conversion
   * const { buffer } = await client.downloadFromCDN(imageId, { format: 'png' });
   *
   * // Download with resize
   * const { buffer } = await client.downloadFromCDN(imageId, { width: 256, height: 256 });
   *
   * // Download video
   * const { buffer } = await client.downloadFromCDN(videoId, { format: 'mp4' });
   *
   * // Extract frame from video at 5 seconds
   * const { buffer } = await client.downloadFromCDN(videoId, { format: 'jpg', seek: 5000 });
   * ```
   */
  async downloadFromCDN(id: string, options?: CDNDownloadOptions): Promise<CDNDownloadResult> {
    const format = options?.format || 'jpg';
    this.log('Downloading from CDN', { id, format, options });

    // Build URL with query parameters
    let url = `/api/v1/cdn/${id}.${format}`;
    const params: string[] = [];

    if (options?.width) params.push(`w=${options.width}`);
    if (options?.height) params.push(`h=${options.height}`);
    if (options?.watermark) params.push(`watermark=${options.watermark}`);
    if (options?.watermarkPosition) params.push(`position=${options.watermarkPosition}`);
    if (options?.seek !== undefined) params.push(`seek=${options.seek}`);

    if (params.length > 0) {
      url += '?' + params.join('&');
    }

    try {
      const response = await this.axios.get(url, {
        responseType: 'arraybuffer',
        timeout: format === 'mp4' ? 120000 : 60000  // Longer timeout for videos
      });

      const buffer = Buffer.from(response.data);
      const mimeType = response.headers['content-type'] || this.getMimeType(format);
      const size = buffer.length;

      this.log('CDN download complete', { size, mimeType });

      return { buffer, mimeType, size };
    } catch (error: any) {
      this.log('CDN download error', error.message);
      throw new Error(`Failed to download from CDN: ${error.message}`);
    }
  }

  /**
   * Get MIME type from format extension
   */
  private getMimeType(format: string): string {
    const mimeTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'mp4': 'video/mp4'
    };
    return mimeTypes[format] || 'application/octet-stream';
  }

  // ============================================================================
  // WebSocket Methods
  // ============================================================================

  /**
   * Connect to WebSocket server with auto-reconnect support
   */
  async wsConnect(): Promise<void> {
    if (this.wsConnecting) {
      this.log('WebSocket connection already in progress');
      return;
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.log('WebSocket already connected');
      return;
    }

    this.wsConnecting = true;
    this.wsShouldReconnect = true;

    const wsUrl = this.baseUrl.replace('http://', 'ws://').replace('https://', 'wss://') + '/ws/generation';
    this.log('Connecting to WebSocket', { url: wsUrl });

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(wsUrl);

      this.ws.on('open', () => {
        this.log('WebSocket connected, authenticating...');
        this.wsAuthenticate();
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        this.wsHandleMessage(data, resolve);
      });

      this.ws.on('close', (code: number) => {
        this.wsConnecting = false;
        this.wsHandleClose(code);
      });

      this.ws.on('error', (error: Error) => {
        this.wsConnecting = false;
        this.log('WebSocket error', error.message);
        if (!this.wsAuthenticated) {
          reject(error);
        }
      });

      this.ws.on('pong', () => {
        this.log('Pong received from server');
      });
    });
  }

  /**
   * Authenticate with the WebSocket server
   */
  private wsAuthenticate(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'auth',
        data: { apiKey: this.apiKey }
      }));
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private wsHandleMessage(data: WebSocket.Data, connectResolve?: (value: void) => void): void {
    try {
      const message = JSON.parse(data.toString());
      this.log('WebSocket message', { type: message.type });

      switch (message.type) {
        case 'auth_success':
          this.wsAuthenticated = true;
          this.wsConnecting = false;
          this.wsReconnectAttempts = 0;
          this.wsStartPing();
          this.log('WebSocket authenticated');
          if (connectResolve) {
            connectResolve();
          }
          break;

        case 'error':
          if (message.data?.code === 'AUTH_ERROR') {
            this.log('WebSocket auth failed', message.data);
          }
          // Handle pending request errors
          this.wsHandleError(message);
          break;

        case 'generation_complete':
        case 'settings_response':
          this.wsHandleResult(message);
          break;

        case 'llm_chunk':
          // Handle streaming chunk
          if (message.requestId) {
            const callbacks = this.wsStreamCallbacks.get(message.requestId);
            if (callbacks && message.data?.chunk) {
              try {
                callbacks.onChunk(message.data.chunk);
              } catch (err) {
                this.log('onChunk callback error', err);
              }
            }
          }
          break;

        case 'pong':
          // Application-level pong (in addition to WebSocket pong)
          break;

        default:
          this.log('Unhandled WebSocket message type', message.type);
      }
    } catch (error) {
      this.log('Failed to parse WebSocket message', error);
    }
  }

  /**
   * Handle generation result
   */
  private wsHandleResult(message: any): void {
    const requestId = message.requestId;
    if (requestId && this.wsPendingRequests.has(requestId)) {
      const pending = this.wsPendingRequests.get(requestId)!;
      this.wsPendingRequests.delete(requestId);
      // Also clean up streaming callbacks if present
      this.wsStreamCallbacks.delete(requestId);
      pending.resolve(message.data);
    }
  }

  /**
   * Handle error response
   */
  private wsHandleError(message: any): void {
    const requestId = message.requestId;
    if (requestId && this.wsPendingRequests.has(requestId)) {
      const pending = this.wsPendingRequests.get(requestId)!;
      this.wsPendingRequests.delete(requestId);
      pending.reject(new Error(message.data?.message || 'Unknown error'));
    }
  }

  /**
   * Start ping interval to keep connection alive
   */
  private wsStartPing(): void {
    this.wsStopPing(); // Clear any existing interval

    this.wsPingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.ping();
        this.log('Ping sent to server');
      }
    }, this.wsOptions.pingIntervalMs);
  }

  /**
   * Stop ping interval
   */
  private wsStopPing(): void {
    if (this.wsPingInterval) {
      clearInterval(this.wsPingInterval);
      this.wsPingInterval = null;
    }
  }

  /**
   * Handle WebSocket close
   */
  private async wsHandleClose(code: number): Promise<void> {
    this.wsStopPing();
    this.wsAuthenticated = false;

    if (!this.wsClosingIntentionally) {
      this.log('WebSocket closed', { code });
    } else {
      this.wsClosingIntentionally = false; // Reset for next use
    }

    // Reconnect if not intentional close and auto-reconnect is enabled
    if (code !== 1000 && this.wsShouldReconnect && this.wsOptions.autoReconnect) {
      await this.wsReconnectWithBackoff();
    }
  }

  /**
   * Reconnect with exponential backoff
   */
  private async wsReconnectWithBackoff(): Promise<void> {
    const delay = Math.min(
      this.wsOptions.reconnectIntervalMs * Math.pow(2, this.wsReconnectAttempts),
      this.wsOptions.maxReconnectDelayMs
    );
    this.wsReconnectAttempts++;

    this.log(`Reconnecting in ${delay}ms (attempt ${this.wsReconnectAttempts})`);
    await new Promise(r => setTimeout(r, delay));

    try {
      await this.wsConnect();
      this.wsRetryPending();
    } catch (error) {
      this.log('Reconnection failed', error);
      // Will trigger another reconnect via close handler
    }
  }

  /**
   * Retry pending requests after reconnection
   */
  private wsRetryPending(): void {
    for (const [id, { request }] of this.wsPendingRequests) {
      this.log(`Retrying request ${id}`);
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(request));
      }
    }
  }

  /**
   * Reject all pending requests
   */
  private wsRejectPending(reason: string): void {
    for (const [, { reject }] of this.wsPendingRequests) {
      reject(new Error(reason));
    }
    this.wsPendingRequests.clear();
  }

  /**
   * Low-level WebSocket send. Prefer helper methods: wsGenerateImage, wsGenerateVideo, wsGenerateLlm, wsUpscaleImage
   * @internal
   */
  async wsSend(type: 'generate_image', data: WsImageRequest | WsImg2ImgRequest, timeout?: number): Promise<WsImageResponse>;
  async wsSend(type: 'generate_video', data: WsVideoRequest, timeout?: number): Promise<WsVideoResponse>;
  async wsSend(type: 'generate_llm', data: WsLlmRequest, timeout?: number): Promise<WsLlmResponse>;
  async wsSend(type: 'generate_upscale', data: WsUpscaleRequest, timeout?: number): Promise<WsUpscaleResponse>;
  async wsSend(type: string, data: WsRequestData, timeout?: number): Promise<WsResponseData>;
  // Implementation
  async wsSend(type: string, data: WsRequestData, timeout = 180000): Promise<WsResponseData> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected. Call wsConnect() first.');
    }

    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const request = { type, data, requestId };

    return new Promise((resolve, reject) => {
      // Set timeout
      const timer = setTimeout(() => {
        this.wsPendingRequests.delete(requestId);
        reject(new Error('Request timeout'));
      }, timeout);

      // Track pending request
      this.wsPendingRequests.set(requestId, {
        request,
        resolve: (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        reject: (reason) => {
          clearTimeout(timer);
          reject(reason);
        }
      });

      // Send request
      this.ws!.send(JSON.stringify(request));
      this.log('WebSocket request sent', { type, requestId });
    });
  }

  /**
   * Generate an image via WebSocket (text2img or img2img)
   *
   * @example Text-to-Image
   * ```typescript
   * const result = await client.wsGenerateImage({
   *   prompt: 'A sunset over mountains',
   *   style: 'realistic',
   *   format: 'landscape'
   * });
   * console.log(result.result.imageId);
   * ```
   *
   * @example Image-to-Image (edit)
   * ```typescript
   * const result = await client.wsGenerateImage({
   *   imageId: 'existing-image-id',
   *   prompt: 'add dramatic lighting'
   * });
   * ```
   */
  async wsGenerateImage(data: WsImageRequest | WsImg2ImgRequest, timeout?: number): Promise<WsImageResponse> {
    return this.wsSend('generate_image', data, timeout);
  }

  /**
   * Generate a video from an image via WebSocket
   *
   * @example
   * ```typescript
   * const result = await client.wsGenerateVideo({
   *   imageId: 'source-image-id',
   *   prompt: 'the scene view (the camera) pans left, smooth motion',
   *   duration: 5,
   *   fps: 16
   * });
   * console.log(result.result.videoId);
   * ```
   */
  async wsGenerateVideo(data: WsVideoRequest, timeout?: number): Promise<WsVideoResponse> {
    return this.wsSend('generate_video', data, timeout);
  }

  /**
   * Generate text via LLM over WebSocket
   *
   * @example Basic
   * ```typescript
   * const result = await client.wsGenerateLlm({
   *   prompt: 'Explain TypeScript'
   * });
   * console.log(result.result.text);
   * ```
   *
   * @example With system prompt and JSON output
   * ```typescript
   * const result = await client.wsGenerateLlm({
   *   prompt: 'List 3 programming languages',
   *   system: 'You are a helpful assistant',
   *   jsonFormat: true,
   *   jsonTemplate: { languages: 'array' }
   * });
   * console.log(result.result.json);
   * ```
   */
  async wsGenerateLlm(data: WsLlmRequest, timeout?: number): Promise<WsLlmResponse> {
    return this.wsSend('generate_llm', data, timeout);
  }

  /**
   * AI upscale an image via WebSocket (img2ximg)
   * Uses AI to generate prompt automatically - no user prompt needed
   *
   * @example
   * ```typescript
   * const result = await client.wsUpscaleImage({
   *   imageId: 'source-image-id',
   *   factor: 2
   * });
   * console.log(result.result.imageId, result.result.width, result.result.height);
   * ```
   */
  async wsUpscaleImage(data: WsUpscaleRequest, timeout?: number): Promise<WsUpscaleResponse> {
    return this.wsSend('generate_upscale', data, timeout);
  }

  /**
   * Generate text via LLM over WebSocket with streaming
   *
   * Streams text chunks in real-time via WebSocket connection.
   * More efficient than SSE for applications already using WebSocket.
   *
   * Note: JSON format is not supported with streaming.
   *
   * @example
   * ```typescript
   * await client.wsConnect();
   *
   * const controller = client.wsGenerateLlmStream(
   *   { prompt: 'Write a haiku about coding' },
   *   {
   *     onChunk: (chunk) => process.stdout.write(chunk),
   *     onComplete: (response) => console.log('\nTokens:', response.result.tokensUsed),
   *     onError: (err) => console.error('Error:', err)
   *   }
   * );
   *
   * // Optionally abort the stream
   * // controller.abort();
   * ```
   */
  wsGenerateLlmStream(
    data: Omit<WsLlmRequest, 'jsonFormat' | 'jsonTemplate'>,
    callbacks: WsStreamCallbacks,
    timeout?: number
  ): WsStreamController {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected. Call wsConnect() first.');
    }

    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const request = {
      type: 'generate_llm',
      data: { ...data, stream: true },
      requestId
    };

    // Store callbacks for this request
    this.wsStreamCallbacks.set(requestId, callbacks);

    // Set timeout
    const timer = setTimeout(() => {
      this.wsStreamCallbacks.delete(requestId);
      this.wsPendingRequests.delete(requestId);
      callbacks.onError(new Error('Stream timeout'));
    }, timeout || STREAM_DEFAULTS.TIMEOUT_MS);

    // Track for cleanup and completion
    this.wsPendingRequests.set(requestId, {
      request,
      resolve: (value) => {
        clearTimeout(timer);
        this.wsStreamCallbacks.delete(requestId);
        callbacks.onComplete(value);
      },
      reject: (reason) => {
        clearTimeout(timer);
        this.wsStreamCallbacks.delete(requestId);
        callbacks.onError(reason);
      }
    });

    // Send request
    this.ws.send(JSON.stringify(request));
    this.log('WebSocket stream request sent', { requestId });

    return {
      requestId,
      abort: () => {
        this.wsStreamCallbacks.delete(requestId);
        this.wsPendingRequests.delete(requestId);
        clearTimeout(timer);
        // Send cancel message to server
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({
            type: 'cancel',
            requestId
          }));
        }
        this.log('WebSocket stream aborted', { requestId });
      }
    };
  }

  // ============================================================================
  // WebSocket Settings Methods
  // ============================================================================

  /**
   * Get API key settings via WebSocket
   *
   * Returns current settings including rate limits and usage.
   * More efficient than REST for applications already using WebSocket.
   *
   * @example
   * ```typescript
   * await client.wsConnect();
   * const response = await client.wsGetSettings();
   * console.log('Status:', response.settings.status);
   * console.log('Image limit:', response.settings.rateLimits.image.requestsPer15Min);
   * ```
   */
  async wsGetSettings(timeout?: number): Promise<WsSettingsResponse> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected. Call wsConnect() first.');
    }

    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const request = { type: 'get_settings', requestId };

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.wsPendingRequests.delete(requestId);
        reject(new Error('Request timeout'));
      }, timeout || 30000);

      this.wsPendingRequests.set(requestId, {
        request,
        resolve: (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        reject: (reason) => {
          clearTimeout(timer);
          reject(reason);
        }
      });

      this.ws!.send(JSON.stringify(request));
      this.log('WebSocket get_settings sent', { requestId });
    });
  }

  /**
   * Get usage statistics via WebSocket
   *
   * Returns usage summary and daily breakdown for the specified period.
   *
   * @example
   * ```typescript
   * await client.wsConnect();
   * const response = await client.wsGetUsage({ days: 7 });
   * console.log('Total requests:', response.usage.summary.total);
   * console.log('Success rate:', response.usage.summary.successRate);
   * console.log('Period:', response.usage.period.start, '-', response.usage.period.end);
   * ```
   */
  async wsGetUsage(data?: WsUsageRequest, timeout?: number): Promise<WsUsageResponse> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected. Call wsConnect() first.');
    }

    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const request = { type: 'get_usage', data: data || {}, requestId };

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.wsPendingRequests.delete(requestId);
        reject(new Error('Request timeout'));
      }, timeout || 30000);

      this.wsPendingRequests.set(requestId, {
        request,
        resolve: (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        reject: (reason) => {
          clearTimeout(timer);
          reject(reason);
        }
      });

      this.ws!.send(JSON.stringify(request));
      this.log('WebSocket get_usage sent', { requestId, days: data?.days || 30 });
    });
  }

  /**
   * Get rate limit status via WebSocket
   *
   * Returns current rate limit status for all operations.
   *
   * @example
   * ```typescript
   * await client.wsConnect();
   * const response = await client.wsGetRateLimits();
   * for (const limit of response.rateLimits) {
   *   console.log(`${limit.operation}: ${limit.current.requestsPer15Min}/${limit.limit.requestsPer15Min}`);
   * }
   * ```
   */
  async wsGetRateLimits(timeout?: number): Promise<WsRateLimitsResponse> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected. Call wsConnect() first.');
    }

    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const request = { type: 'get_rate_limits', requestId };

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.wsPendingRequests.delete(requestId);
        reject(new Error('Request timeout'));
      }, timeout || 30000);

      this.wsPendingRequests.set(requestId, {
        request,
        resolve: (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        reject: (reason) => {
          clearTimeout(timer);
          reject(reason);
        }
      });

      this.ws!.send(JSON.stringify(request));
      this.log('WebSocket get_rate_limits sent', { requestId });
    });
  }

  /**
   * Check if WebSocket is connected
   */
  wsIsConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN && this.wsAuthenticated;
  }

  /**
   * Close WebSocket connection and cleanup
   */
  async close(): Promise<void> {
    this.log('Closing client');

    this.wsShouldReconnect = false;
    this.wsStopPing();
    this.wsRejectPending('Client closed');

    // Mark as intentional close to suppress logging
    this.wsClosingIntentionally = true;

    if (this.ws) {
      this.ws.close(1000, 'Client closed');
      this.ws = null;
    }

    this.wsAuthenticated = false;
    this.wsConnecting = false;
    this.wsReconnectAttempts = 0;
  }
}

/**
 * Create a new 2DAI SDK client
 *
 * @param apiKey Your 2DAI API key
 * @param options Optional client configuration
 */
export function createClient(apiKey: string, options?: Partial<ClientOptions>): TwoDAIClient {
  return new TwoDAIClient({
    apiKey,
    ...options
  });
}

export default TwoDAIClient;
