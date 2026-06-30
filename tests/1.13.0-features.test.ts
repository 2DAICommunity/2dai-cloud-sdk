/**
 * Feature Test Suite — public-API fields layered on the internal SDK:
 *   - `priority` on every generation call (REST + WS)
 *   - `enhancedVision` on LLM (REST + WS)
 *   - `POST /api/v1/cdn/batch-delete` (idempotent, deduped, max 1000)
 *   - `?s=<N>` maxSide on the CDN GET proxy (cap 4096)
 *
 * Runs against TEST_BASE_URL with TEST_API_KEY from tests/test.env (or
 * shell env vars, which take precedence). Most tests are cheap 4xx
 * validation paths; only a handful trigger real generations.
 */

import axios, { AxiosInstance } from 'axios';
import WebSocket from 'ws';
import { loadTestEnv, TestConfig } from './test-env';

const config: TestConfig = loadTestEnv();
const TIMEOUT_GEN_MS = 90_000;
const TIMEOUT_LLM_MS = 60_000;
const TIMEOUT_VALIDATION_MS = 10_000;

let api: AxiosInstance;

// Resources we create during the suite that need cleanup at the end.
const createdImageIds: string[] = [];

beforeAll(() => {
  api = axios.create({
    baseURL: config.baseUrl,
    timeout: TIMEOUT_GEN_MS,
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json'
    },
    validateStatus: () => true // capture 4xx/5xx for assertion
  });
});

afterAll(async () => {
  if (createdImageIds.length === 0) return;
  // Use the new endpoint to clean up everything we created — this also
  // exercises the happy path one more time.
  try {
    await api.post('/api/v1/cdn/batch-delete', { ids: createdImageIds });
  } catch {
    // best-effort; non-fatal
  }
});

// ============================================================================
// 1. Priority validation
// ============================================================================

describe('1. priority validation (cheap)', () => {
  test('rejects invalid priority string on POST /image', async () => {
    const res = await api.post('/api/v1/generation/image', {
      prompt: config.imagePrompt,
      priority: 'super-urgent'
    });
    expect(res.status).toBe(400);
    expect(res.data?.error?.message || '').toMatch(/priority/i);
  }, TIMEOUT_VALIDATION_MS);

  test('accepts priority="normal" on POST /image (returns 200/202)', async () => {
    // Real generation — costs a slot. Keep dimensions small.
    const res = await api.post('/api/v1/generation/image', {
      prompt: config.imagePrompt,
      width: 512,
      height: 512,
      priority: 'normal'
    });
    expect(res.status).toBeLessThan(300);
    if (res.data?.data?.imageId) createdImageIds.push(res.data.data.imageId);
  }, TIMEOUT_GEN_MS);

  test('rejects invalid priority via WebSocket generate_image', async () => {
    const wsUrl = config.baseUrl.replace(/^http/, 'ws') + '/ws/generation';
    const errorMsg = await new Promise<string>((resolve, reject) => {
      const ws = new WebSocket(wsUrl);
      const requestId = `req_${Math.random().toString(36).slice(2, 10)}`;
      ws.on('open', () => {
        ws.send(JSON.stringify({ type: 'auth', data: { apiKey: config.apiKey } }));
      });
      ws.on('message', (raw) => {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'auth_success') {
          ws.send(JSON.stringify({
            type: 'generate_image',
            data: { prompt: 'test', priority: 'bogus' },
            requestId
          }));
        } else if (msg.type === 'error' && msg.requestId === requestId) {
          ws.close();
          resolve(msg.data?.message || '');
        }
      });
      ws.on('error', reject);
      setTimeout(() => { ws.close(); reject(new Error('timeout')); }, 8000);
    });
    expect(errorMsg).toMatch(/priority/i);
  }, TIMEOUT_VALIDATION_MS);
});

// ============================================================================
// 2. enhancedVision (LLM) — light coverage; validation only
// ============================================================================

describe('2. enhancedVision validation', () => {
  test('rejects enhancedVision when not a boolean', async () => {
    const res = await api.post('/api/v1/llm/generate', {
      prompt: 'ping',
      enhancedVision: 'yes-please'
    });
    expect(res.status).toBe(400);
    expect(res.data?.error?.message || '').toMatch(/enhancedVision/i);
  }, TIMEOUT_VALIDATION_MS);

  test('accepts enhancedVision=false on text-only request', async () => {
    const res = await api.post('/api/v1/llm/generate', {
      prompt: 'Respond with the single word: pong',
      enhancedVision: false
    });
    expect(res.status).toBeLessThan(300);
    expect(typeof res.data?.data?.text).toBe('string');
  }, TIMEOUT_LLM_MS);
});

// ============================================================================
// 4. batch-delete (cheap validation + happy path on synthetic ids)
// ============================================================================

describe('3. batchDeleteFiles', () => {
  test('rejects non-array body', async () => {
    const res = await api.post('/api/v1/cdn/batch-delete', { ids: 'not-an-array' });
    expect(res.status).toBe(400);
  }, TIMEOUT_VALIDATION_MS);

  test('rejects empty array', async () => {
    const res = await api.post('/api/v1/cdn/batch-delete', { ids: [] });
    expect(res.status).toBe(400);
  }, TIMEOUT_VALIDATION_MS);

  test('rejects > 1000 ids', async () => {
    const tooMany = Array.from({ length: 1001 }, (_, i) => `id-${i}`);
    const res = await api.post('/api/v1/cdn/batch-delete', { ids: tooMany });
    expect(res.status).toBe(400);
    expect(res.data?.error?.message || '').toMatch(/1000/);
  }, TIMEOUT_VALIDATION_MS);

  test('rejects non-string entry and points to its index', async () => {
    const res = await api.post('/api/v1/cdn/batch-delete', { ids: ['a', 42, 'c'] });
    expect(res.status).toBe(400);
    expect(res.data?.error?.message || '').toMatch(/ids\[1\]/);
  }, TIMEOUT_VALIDATION_MS);

  test('idempotent: deleting non-existent ids returns success + alreadyDeleted', async () => {
    const fakeIds = [
      '00000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000002'
    ];
    const res = await api.post('/api/v1/cdn/batch-delete', { ids: fakeIds });
    expect(res.status).toBeLessThan(300);
    expect(res.data?.success).toBe(true);
    expect(Array.isArray(res.data?.results)).toBe(true);
    expect(res.data.results.length).toBe(2);
    for (const r of res.data.results) {
      expect(r.success).toBe(true);
      expect(r.alreadyDeleted).toBe(true);
    }
  }, TIMEOUT_VALIDATION_MS);

  test('deduplicates: ["a","a","b"] reports total=2', async () => {
    const res = await api.post('/api/v1/cdn/batch-delete', {
      ids: [
        '00000000-0000-0000-0000-000000000003',
        '00000000-0000-0000-0000-000000000003',
        '00000000-0000-0000-0000-000000000004'
      ]
    });
    expect(res.status).toBeLessThan(300);
    expect(res.data?.total).toBe(2);
    expect(res.data?.succeeded).toBe(2);
  }, TIMEOUT_VALIDATION_MS);
});

// ============================================================================
// 5. CDN proxy ?s= (maxSide)
// ============================================================================

describe('4. CDN ?s= maxSide validation', () => {
  test('rejects ?s=0', async () => {
    const res = await api.get('/api/v1/cdn/00000000-0000-0000-0000-000000000099?s=0');
    expect(res.status).toBe(400);
  }, TIMEOUT_VALIDATION_MS);

  test('rejects negative ?s=', async () => {
    const res = await api.get('/api/v1/cdn/00000000-0000-0000-0000-000000000099?s=-100');
    expect(res.status).toBe(400);
  }, TIMEOUT_VALIDATION_MS);

  test('rejects ?s= above cap (4096)', async () => {
    const res = await api.get('/api/v1/cdn/00000000-0000-0000-0000-000000000099?s=99999');
    expect(res.status).toBe(400);
    expect(res.data?.error?.message || '').toMatch(/4096/);
  }, TIMEOUT_VALIDATION_MS);

  test('accepts ?s= at the cap (404 because file does not exist, not 400)', async () => {
    // At-the-cap is the boundary case. We don't have a real id to fetch
    // against, but the validator should pass and the lookup should 4xx for
    // "not found" (5xx if upstream, 200 if it actually returns an image).
    const res = await api.get('/api/v1/cdn/00000000-0000-0000-0000-000000000099?s=4096');
    expect(res.status).not.toBe(400);
  }, TIMEOUT_VALIDATION_MS);
});
