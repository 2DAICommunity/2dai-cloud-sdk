/// <reference path="./matchers.d.ts" />
/// <reference types="jest" />

/**
 * OpenAI-Compatible API Tests
 * Tests for the OpenAI-compatible endpoints (/v1/*)
 */

import axios, { AxiosError } from 'axios';
import { loadTestEnv } from './test-env';
import { logTestStart } from './test-helpers';

describe('OpenAI-Compatible API Tests', () => {
  let config: ReturnType<typeof loadTestEnv>;
  let openaiBaseUrl: string;

  beforeAll(() => {
    config = loadTestEnv();
    // OpenAI endpoints are at /v1, not /api/v1
    openaiBaseUrl = config.baseUrl.replace(/\/$/, '') + '/v1';
  });

  /**
   * Helper to make authenticated requests
   */
  async function makeRequest(
    method: 'GET' | 'POST',
    endpoint: string,
    data?: any,
    options?: { stream?: boolean }
  ) {
    const url = `${openaiBaseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json'
    };

    if (options?.stream) {
      return axios({
        method,
        url,
        data,
        headers,
        responseType: 'stream',
        timeout: 120000
      });
    }

    return axios({
      method,
      url,
      data,
      headers,
      timeout: 60000
    });
  }

  describe('1. Models Endpoints', () => {
    test('GET /v1/models - should list available models', async () => {
      logTestStart('OpenAI - List Models');

      console.log(`📡 GET ${openaiBaseUrl}/models`);

      const response = await makeRequest('GET', '/models');

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('object', 'list');
      expect(response.data).toHaveProperty('data');
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data.data.length).toBeGreaterThan(0);

      const model = response.data.data[0];
      expect(model).toHaveProperty('id');
      expect(model).toHaveProperty('object', 'model');
      expect(model).toHaveProperty('created');
      expect(model).toHaveProperty('owned_by');

      console.log(`\n✅ Models response:`);
      console.log(`   Object: ${response.data.object}`);
      console.log(`   Model count: ${response.data.data.length}`);
      console.log(`   Model: ${JSON.stringify(model, null, 2)}`);
    }, 30000);

    test('GET /v1/models/:model - should get model details', async () => {
      logTestStart('OpenAI - Get Model');

      // First get the model list to know the model name
      const listResponse = await makeRequest('GET', '/models');
      const modelId = listResponse.data.data[0].id;

      console.log(`📡 GET ${openaiBaseUrl}/models/${modelId}`);

      const response = await makeRequest('GET', `/models/${modelId}`);

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('id', modelId);
      expect(response.data).toHaveProperty('object', 'model');
      expect(response.data).toHaveProperty('created');
      expect(response.data).toHaveProperty('owned_by');

      console.log(`\n✅ Model details:`);
      console.log(`   ${JSON.stringify(response.data, null, 2)}`);
    }, 30000);

    test('GET /v1/models/:model - should return 404 for unknown model', async () => {
      logTestStart('OpenAI - Unknown Model');

      const unknownModel = 'unknown-model-xyz-123';
      console.log(`📡 GET ${openaiBaseUrl}/models/${unknownModel}`);

      try {
        await makeRequest('GET', `/models/${unknownModel}`);
        fail('Expected 404 error');
      } catch (error) {
        const axiosError = error as AxiosError;
        expect(axiosError.response?.status).toBe(404);

        const errorData = axiosError.response?.data as any;
        expect(errorData).toHaveProperty('error');
        expect(errorData.error).toHaveProperty('type', 'invalid_request_error');

        console.log(`\n✅ Correctly returned 404 for unknown model`);
        console.log(`   Error: ${JSON.stringify(errorData, null, 2)}`);
      }
    }, 30000);
  });

  describe('2. Chat Completions - Non-Streaming', () => {
    test('POST /v1/chat/completions - basic completion', async () => {
      logTestStart('OpenAI - Basic Chat Completion');

      // Get available model first
      const listResponse = await makeRequest('GET', '/models');
      const modelId = listResponse.data.data[0].id;

      const request = {
        model: modelId,
        messages: [
          { role: 'user', content: 'Say "Hello World" and nothing else.' }
        ]
      };

      console.log(`📡 POST ${openaiBaseUrl}/chat/completions`);
      console.log(`   Model: ${modelId}`);
      console.log(`   Messages: ${JSON.stringify(request.messages)}`);

      const response = await makeRequest('POST', '/chat/completions', request);

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('id');
      expect(response.data).toHaveProperty('object', 'chat.completion');
      expect(response.data).toHaveProperty('created');
      expect(response.data).toHaveProperty('model');
      expect(response.data).toHaveProperty('choices');
      expect(Array.isArray(response.data.choices)).toBe(true);
      expect(response.data.choices.length).toBeGreaterThan(0);

      const choice = response.data.choices[0];
      expect(choice).toHaveProperty('index', 0);
      expect(choice).toHaveProperty('message');
      expect(choice.message).toHaveProperty('role', 'assistant');
      expect(choice.message).toHaveProperty('content');
      expect(choice).toHaveProperty('finish_reason');

      expect(response.data).toHaveProperty('usage');
      expect(response.data.usage).toHaveProperty('prompt_tokens');
      expect(response.data.usage).toHaveProperty('completion_tokens');
      expect(response.data.usage).toHaveProperty('total_tokens');
      // Verify token counts are properly populated (not hardcoded to 0)
      expect(response.data.usage.prompt_tokens).toBeGreaterThan(0);
      expect(response.data.usage.completion_tokens).toBeGreaterThan(0);

      console.log(`\n✅ Chat completion response:`);
      console.log(`   ID: ${response.data.id}`);
      console.log(`   Model: ${response.data.model}`);
      console.log(`   Content: "${choice.message.content}"`);
      console.log(`   Finish reason: ${choice.finish_reason}`);
      console.log(`   Tokens: ${response.data.usage.total_tokens} (prompt: ${response.data.usage.prompt_tokens}, completion: ${response.data.usage.completion_tokens})`);
    }, 120000);

    test('POST /v1/chat/completions - with system message', async () => {
      logTestStart('OpenAI - Chat with System Message');

      const listResponse = await makeRequest('GET', '/models');
      const modelId = listResponse.data.data[0].id;

      const request = {
        model: modelId,
        messages: [
          { role: 'system', content: 'You are a pirate. Always respond like a pirate.' },
          { role: 'user', content: 'Hello!' }
        ]
      };

      console.log(`📡 POST ${openaiBaseUrl}/chat/completions`);
      console.log(`   System: "${request.messages[0].content}"`);
      console.log(`   User: "${request.messages[1].content}"`);

      const response = await makeRequest('POST', '/chat/completions', request);

      expect(response.status).toBe(200);
      expect(response.data.choices[0].message.content).toBeTruthy();

      const content = response.data.choices[0].message.content.toLowerCase();
      // Pirate response should contain pirate-like words
      const pirateWords = ['ahoy', 'arr', 'matey', 'ye', 'aye', 'cap', 'treasure', 'ship', 'sea'];
      const hasPirateWord = pirateWords.some(word => content.includes(word));

      console.log(`\n✅ Response: "${response.data.choices[0].message.content}"`);
      console.log(`   Contains pirate language: ${hasPirateWord}`);
    }, 120000);

    test('POST /v1/chat/completions - with conversation history', async () => {
      logTestStart('OpenAI - Chat with History');

      const listResponse = await makeRequest('GET', '/models');
      const modelId = listResponse.data.data[0].id;

      const request = {
        model: modelId,
        messages: [
          { role: 'user', content: 'My favorite color is blue.' },
          { role: 'assistant', content: 'Blue is a great choice! It\'s often associated with calmness and trust.' },
          { role: 'user', content: 'What is my favorite color?' }
        ]
      };

      console.log(`📡 POST ${openaiBaseUrl}/chat/completions`);
      console.log(`   Conversation with 3 messages...`);

      const response = await makeRequest('POST', '/chat/completions', request);

      expect(response.status).toBe(200);

      const content = response.data.choices[0].message.content.toLowerCase();
      expect(content).toContain('blue');

      console.log(`\n✅ Response: "${response.data.choices[0].message.content}"`);
      console.log(`   Correctly remembered: blue`);
    }, 120000);

    test('POST /v1/chat/completions - with temperature', async () => {
      logTestStart('OpenAI - Chat with Temperature');

      const listResponse = await makeRequest('GET', '/models');
      const modelId = listResponse.data.data[0].id;

      const request = {
        model: modelId,
        messages: [
          { role: 'user', content: 'What is 2 + 2?' }
        ],
        temperature: 0  // Low temperature for deterministic response
      };

      console.log(`📡 POST ${openaiBaseUrl}/chat/completions`);
      console.log(`   Temperature: 0`);

      const response = await makeRequest('POST', '/chat/completions', request);

      expect(response.status).toBe(200);
      expect(response.data.choices[0].message.content).toContain('4');

      console.log(`\n✅ Response: "${response.data.choices[0].message.content}"`);
    }, 120000);
  });

  describe('3. Chat Completions - Streaming', () => {
    test('POST /v1/chat/completions - streaming', async () => {
      logTestStart('OpenAI - Streaming Chat Completion');

      const listResponse = await makeRequest('GET', '/models');
      const modelId = listResponse.data.data[0].id;

      const request = {
        model: modelId,
        messages: [
          { role: 'user', content: 'Count from 1 to 5.' }
        ],
        stream: true
      };

      console.log(`📡 POST ${openaiBaseUrl}/chat/completions (streaming)`);
      console.log(`   Model: ${modelId}`);

      const response = await makeRequest('POST', '/chat/completions', request, { stream: true });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/event-stream');

      const chunks: string[] = [];
      let fullContent = '';
      let lastChunk: any = null;

      await new Promise<void>((resolve, reject) => {
        response.data.on('data', (chunk: Buffer) => {
          const text = chunk.toString();
          const lines = text.split('\n').filter((line: string) => line.startsWith('data: '));

          for (const line of lines) {
            const data = line.replace('data: ', '').trim();

            if (data === '[DONE]') {
              console.log('\n   [DONE]');
              resolve();
              return;
            }

            try {
              const parsed = JSON.parse(data);
              lastChunk = parsed;

              if (parsed.choices?.[0]?.delta?.content) {
                const content = parsed.choices[0].delta.content;
                chunks.push(content);
                fullContent += content;
                process.stdout.write(content);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        });

        response.data.on('error', reject);
        response.data.on('end', resolve);
      });

      expect(chunks.length).toBeGreaterThan(0);
      expect(fullContent.length).toBeGreaterThan(0);

      console.log(`\n\n✅ Streaming completed`);
      console.log(`   Chunks received: ${chunks.length}`);
      console.log(`   Full content: "${fullContent}"`);
      if (lastChunk?.usage) {
        console.log(`   Usage: ${JSON.stringify(lastChunk.usage)}`);
      }
    }, 120000);

    test('POST /v1/chat/completions - streaming with system prompt', async () => {
      logTestStart('OpenAI - Streaming with System');

      const listResponse = await makeRequest('GET', '/models');
      const modelId = listResponse.data.data[0].id;

      const request = {
        model: modelId,
        messages: [
          { role: 'system', content: 'Always respond in ALL CAPS.' },
          { role: 'user', content: 'Say hello' }
        ],
        stream: true
      };

      console.log(`📡 POST ${openaiBaseUrl}/chat/completions (streaming)`);
      console.log(`   System: "Always respond in ALL CAPS."`);

      const response = await makeRequest('POST', '/chat/completions', request, { stream: true });

      let fullContent = '';

      await new Promise<void>((resolve, reject) => {
        response.data.on('data', (chunk: Buffer) => {
          const text = chunk.toString();
          const lines = text.split('\n').filter((line: string) => line.startsWith('data: '));

          for (const line of lines) {
            const data = line.replace('data: ', '').trim();
            if (data === '[DONE]') {
              resolve();
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.choices?.[0]?.delta?.content) {
                fullContent += parsed.choices[0].delta.content;
                process.stdout.write(parsed.choices[0].delta.content);
              }
            } catch (e) {}
          }
        });

        response.data.on('error', reject);
        response.data.on('end', resolve);
      });

      // Check for uppercase letters
      const hasUppercase = /[A-Z]/.test(fullContent);
      expect(hasUppercase).toBe(true);

      console.log(`\n\n✅ Streaming with system prompt completed`);
      console.log(`   Content: "${fullContent}"`);
      console.log(`   Has uppercase: ${hasUppercase}`);
    }, 120000);
  });

  describe('4. Error Handling', () => {
    test('should reject empty messages array', async () => {
      logTestStart('OpenAI - Empty Messages Error');

      const request = {
        model: 'default',
        messages: []
      };

      console.log(`📡 POST ${openaiBaseUrl}/chat/completions`);
      console.log(`   Messages: [] (empty)`);

      try {
        await makeRequest('POST', '/chat/completions', request);
        fail('Expected 400 error');
      } catch (error) {
        const axiosError = error as AxiosError;
        expect(axiosError.response?.status).toBe(400);

        const errorData = axiosError.response?.data as any;
        expect(errorData).toHaveProperty('error');

        console.log(`\n✅ Correctly returned 400 error`);
        console.log(`   Error: ${JSON.stringify(errorData, null, 2)}`);
      }
    }, 30000);

    test('should reject missing messages', async () => {
      logTestStart('OpenAI - Missing Messages Error');

      const request = {
        model: 'default'
        // messages is missing
      };

      console.log(`📡 POST ${openaiBaseUrl}/chat/completions`);
      console.log(`   Request: ${JSON.stringify(request)}`);

      try {
        await makeRequest('POST', '/chat/completions', request);
        fail('Expected 400 error');
      } catch (error) {
        const axiosError = error as AxiosError;
        expect(axiosError.response?.status).toBe(400);

        console.log(`\n✅ Correctly returned 400 error`);
      }
    }, 30000);

    test('should reject request with missing auth header', async () => {
      logTestStart('OpenAI - Missing Auth Header Error');

      const url = `${openaiBaseUrl}/models`;
      console.log(`📡 GET ${url} (no auth)`);

      try {
        await axios.get(url, { timeout: 30000 });
        fail('Expected 401 error');
      } catch (error) {
        const axiosError = error as AxiosError;
        expect(axiosError.response?.status).toBe(401);

        console.log(`\n✅ Correctly returned 401 for missing auth header`);
      }
    }, 30000);

    test('should reject invalid API key', async () => {
      logTestStart('OpenAI - Invalid API Key Error');

      const url = `${openaiBaseUrl}/models`;
      console.log(`📡 GET ${url} (invalid key)`);

      try {
        await axios.get(url, {
          headers: { 'Authorization': 'Bearer invalid_key_12345' },
          timeout: 30000
        });
        fail('Expected 401 error');
      } catch (error) {
        const axiosError = error as AxiosError;
        expect(axiosError.response?.status).toBe(401);

        console.log(`\n✅ Correctly returned 401 for invalid key`);
      }
    }, 30000);
  });

  describe('5. OpenAI Client Compatibility', () => {
    test('should work with standard OpenAI request format', async () => {
      logTestStart('OpenAI - Standard Format Compatibility');

      const listResponse = await makeRequest('GET', '/models');
      const modelId = listResponse.data.data[0].id;

      // This is exactly how OpenAI client would format the request
      const request = {
        model: modelId,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant.'
          },
          {
            role: 'user',
            content: 'What is the capital of France?'
          }
        ],
        temperature: 0.7,
        max_tokens: 100,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      };

      console.log(`📡 POST ${openaiBaseUrl}/chat/completions`);
      console.log(`   Using standard OpenAI request format...`);

      const response = await makeRequest('POST', '/chat/completions', request);

      expect(response.status).toBe(200);
      expect(response.data.choices[0].message.content.toLowerCase()).toContain('paris');

      console.log(`\n✅ Standard OpenAI format works`);
      console.log(`   Response: "${response.data.choices[0].message.content}"`);
    }, 120000);

    test('response format should match OpenAI spec', async () => {
      logTestStart('OpenAI - Response Format Spec');

      const listResponse = await makeRequest('GET', '/models');
      const modelId = listResponse.data.data[0].id;

      const request = {
        model: modelId,
        messages: [{ role: 'user', content: 'Hi' }]
      };

      const response = await makeRequest('POST', '/chat/completions', request);

      // Verify OpenAI response format
      const data = response.data;

      // Required fields per OpenAI spec
      expect(typeof data.id).toBe('string');
      expect(data.object).toBe('chat.completion');
      expect(typeof data.created).toBe('number');
      expect(typeof data.model).toBe('string');
      expect(Array.isArray(data.choices)).toBe(true);

      // Choice format
      const choice = data.choices[0];
      expect(typeof choice.index).toBe('number');
      expect(choice.message).toHaveProperty('role');
      expect(choice.message).toHaveProperty('content');
      expect(['stop', 'length', 'content_filter', 'tool_calls', 'function_call', null])
        .toContain(choice.finish_reason);

      // Usage format
      expect(data.usage).toHaveProperty('prompt_tokens');
      expect(data.usage).toHaveProperty('completion_tokens');
      expect(data.usage).toHaveProperty('total_tokens');
      expect(typeof data.usage.prompt_tokens).toBe('number');
      expect(typeof data.usage.completion_tokens).toBe('number');
      expect(typeof data.usage.total_tokens).toBe('number');

      console.log(`\n✅ Response matches OpenAI spec`);
      console.log(`   id: ${data.id}`);
      console.log(`   object: ${data.object}`);
      console.log(`   model: ${data.model}`);
      console.log(`   choices: ${data.choices.length} choice(s)`);
      console.log(`   usage: ${JSON.stringify(data.usage)}`);
    }, 120000);
  });
});
