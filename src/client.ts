/**
 * 2DAI SDK Client
 * Official TypeScript/JavaScript client for 2DAI API
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
  WsUpscaleResponse
} from './types';
import {
  DEFAULT_BASE_URL,
  DEFAULT_TIMEOUT,
  WS_DEFAULTS
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
   * Edit an existing image (img2img)
   * Supports optional width/height for resizing the output image
   * Note: The API does not support strength parameter - it uses fixed settings
   */
  async editImage(imageId: string, options: Omit<ImageGenerationOptions, 'format' | 'style'>): Promise<ImageGenerationResult> {
    this.log('Editing image', {
      imageId,
      prompt: options.prompt,
      ...(options.width !== undefined && { width: options.width }),
      ...(options.height !== undefined && { height: options.height }),
      ...(options.resizePad !== undefined && { resizePad: options.resizePad })
    });

    try {
      const response = await this.axios.post('/api/v1/generation/image/edit', {
        imageId,
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
    this.log('Generating video', { imageId: options.imageId, duration: options.duration });

    if (!options.imageId) {
      throw new Error('imageId is required for video generation');
    }

    try {
      const response = await this.axios.post('/api/v1/generation/video', {
        imageId: options.imageId,
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
          this.wsHandleResult(message);
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
