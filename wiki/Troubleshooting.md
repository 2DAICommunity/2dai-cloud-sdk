# Troubleshooting

Common issues, solutions, and best practices.

## Table of Contents

- [Common Errors](#common-errors)
- [Debug Mode](#debug-mode)
- [Best Practices](#best-practices)
- [Performance Tips](#performance-tips)
- [Testing](#testing)
- [Support](#support)

---

## Common Errors

### "RATE_LIMIT_EXCEEDED" Error

**Problem:** You've exceeded your rate limit for the current time window.

**Solution:**
```typescript
const settings = await client.getSettings();
const resetTime = settings.currentUsage?.image.resetAt.window15Min;
console.log(`Rate limit resets at: ${resetTime}`);

// Wait for reset
const waitMs = new Date(resetTime).getTime() - Date.now();
await new Promise(r => setTimeout(r, waitMs + 1000));
```

**Prevention:**
```typescript
// Check limits before batch operations
const limits = await client.checkLimits();
const remaining = limits.find(l => l.operation === 'image')?.remaining.requestsPer15Min;

if (remaining && remaining < batchSize) {
  console.log(`Only ${remaining} requests available, reducing batch size`);
}
```

---

### "INVALID_API_KEY" Error

**Problem:** Your API key is invalid or expired.

**Solution:**
- Verify your API key starts with `2dai_pk_`
- Check that the key hasn't been revoked
- Ensure you're using the correct environment (production vs staging)

```typescript
// Validate API key format before use
if (!apiKey.startsWith('2dai_pk_')) {
  throw new Error('Invalid API key format');
}
```

---

### Timeout Errors

**Problem:** Requests are timing out.

**Solution:**
```typescript
const client = createClient('2dai_pk_...', {
  timeout: 600000  // Increase to 10 minutes for long operations
});
```

**Expected Operation Times:**
| Operation | Typical Duration |
|-----------|-----------------|
| Image Generation | 28-37 seconds |
| Image Editing | 45-50 seconds |
| Image Upscale | 80-85 seconds |
| Video Generation | ~100 seconds |
| LLM Text | 2-11 seconds |
| CDN Download | < 1 second |

---

### Image Quality Issues

**Problem:** Generated images don't match expectations.

**Solutions:**

1. **Use detailed prompts**
   ```typescript
   // Instead of: "a cat"
   // Use: "a fluffy orange tabby cat sitting on a windowsill, soft morning light, bokeh background, professional photography"
   ```

2. **Add negative prompts** (when supported)
   ```typescript
   const result = await client.generateImage({
     prompt: 'a beautiful portrait of a woman',
     negativePrompt: 'blurry, distorted, low quality, bad anatomy, extra limbs'
   });
   ```

3. **Try different styles**
   ```typescript
   import { STYLES } from '2dai-cloud-sdk';

   // For realistic photos
   STYLES.realistic.id

   // For artistic content
   STYLES.paint.id

   // For anime/manga
   STYLES.anime.id
   STYLES.manga.id

   // For cinematic shots
   STYLES.cine.id
   ```

4. **Use seeds for variations**
   ```typescript
   // Generate multiple variations
   for (let seed = 1; seed <= 5; seed++) {
     const result = await client.generateImage({
       prompt: 'a mountain landscape',
       seed
     });
   }
   ```

---

### Video Quality Issues

**Problem:** Generated videos have poor motion, jittery movement, or don't animate as expected.

**Solutions:**

1. **Source image should imply motion**
   ```typescript
   // Bad: Static image with no motion cues
   'a person standing still'

   // Good: Image with implied movement
   'a person mid-stride, walking forward, clothes flowing with movement'
   ```

2. **Include particle elements for dynamic scenes**
   ```typescript
   const image = await client.generateImage({
     prompt: 'warrior in combat stance, dust flying, sparks scattering, dynamic action',
     style: 'cinematic'
   });
   ```

3. **For loop-friendly videos, use subtle motion prompts**
   ```typescript
   // Good for seamless loops
   'woman with flowing hair, gentle breeze, soft breathing, serene expression'

   // Bad for loops (too dramatic)
   'woman jumping through air, explosive movement'
   ```

4. **Match FPS to motion type**
   | Motion Type | Recommended FPS |
   |-------------|-----------------|
   | Slow, subtle | 8-12 fps |
   | Normal motion | 16-24 fps |
   | Fast action | 30-60 fps |

5. **Use appropriate duration**
   ```typescript
   // Short clips for subtle motion
   const subtle = await client.generateVideo({
     imageId: portraitId,
     duration: 3,  // 3 seconds is enough for breathing/blinking
     fps: 16
   });

   // Longer clips for action sequences
   const action = await client.generateVideo({
     imageId: actionId,
     duration: 8,  // More time for progression
     fps: 24
   });
   ```

**Particle ideas for better videos:**
- Action scenes: dust, debris, sparks
- Nature scenes: leaves, petals, snowflakes
- Water scenes: droplets, mist, splashes
- Fire/magic: embers, smoke, light particles

---

### CDN Download Failures

**Problem:** Cannot download files from CDN.

**Solution:**
```typescript
// Ensure Authorization header is included
const response = await axios.get(cdnUrl, {
  headers: { 'Authorization': `Bearer ${apiKey}` },
  responseType: 'arraybuffer',
  timeout: 30000
});
```

**Note:** CDN URLs require authentication. You cannot use them directly in browsers or `<img>` tags. Use `client.downloadFromCDN()` instead.

---

### WebSocket Connection Issues

**Problem:** WebSocket fails to connect or disconnects frequently.

**Solution:**
```typescript
const client = createClient('2dai_pk_...', {
  // Enable auto-reconnect (default)
  wsAutoReconnect: true,

  // Adjust reconnect timing
  wsReconnectIntervalMs: 1000,
  wsMaxReconnectDelayMs: 30000,

  // Keep connection alive
  wsPingIntervalMs: 30000
});
```

**Check connection state:**
```typescript
try {
  await client.wsConnect();
  console.log('Connected successfully');
} catch (error) {
  console.error('Connection failed:', error.message);
}
```

---

### Streaming Errors

**Problem:** Stream stops unexpectedly or doesn't receive all chunks.

**Solution:**
```typescript
const controller = client.generateTextStream({
  prompt: 'Write a story',
  onChunk: (chunk) => {
    process.stdout.write(chunk);
  },
  onComplete: (result) => {
    console.log(`\nComplete: ${result.response.length} chars`);
    console.log(`Tokens: ${result.totalTokens}`);
  },
  onError: (error) => {
    // Handle errors gracefully
    console.error('Stream error:', error.message);
  }
});

// Always wait for completion
await controller.done;
```

---

## Debug Mode

Enable debug mode to see detailed request/response logs:

```typescript
const client = createClient('2dai_pk_...', {
  debug: true
});
```

Debug output includes:
- Request URLs and payloads
- Response status and timing
- WebSocket message types
- Error details

---

## Best Practices

### 1. Check Rate Limits Before Batch Operations

```typescript
const limits = await client.checkLimits();
const remaining = limits.find(l => l.operation === 'image')?.remaining.requestsPer15Min;

if (remaining && remaining < batchSize) {
  console.log(`Only ${remaining} requests available, reducing batch size`);
}
```

### 2. Use Appropriate Styles

```typescript
import { STYLES } from '2dai-cloud-sdk';

// Match style to use case
const productPhoto = STYLES.realistic.id;
const artisticRender = STYLES.paint.id;
const animeCharacter = STYLES.anime.id;
const cinematicScene = STYLES.cine.id;
```

### 3. Handle Errors Gracefully

```typescript
try {
  const result = await client.generateImage({ prompt: 'test' });
} catch (error: any) {
  if (error.message.includes('RATE_LIMIT_EXCEEDED')) {
    // Wait and retry
    await new Promise(r => setTimeout(r, 60000));
  } else if (error.message.includes('INVALID_API_KEY')) {
    // Check API key configuration
  } else {
    // Log and handle other errors
    console.error('Generation failed:', error.message);
  }
}
```

### 4. Cache Generated Content

```typescript
// Store image IDs for reuse
const cache = new Map<string, string>();

async function getOrGenerate(prompt: string): Promise<string> {
  if (cache.has(prompt)) {
    return cache.get(prompt)!;
  }

  const result = await client.generateImage({ prompt });
  cache.set(prompt, result.imageId);
  return result.imageId;
}
```

### 5. Use Seeds for Reproducibility

```typescript
// Same seed = same result (with same prompt and settings)
const result1 = await client.generateImage({
  prompt: 'a red car',
  seed: 12345
});

const result2 = await client.generateImage({
  prompt: 'a red car',
  seed: 12345
});

// result1.imageId content will be identical to result2.imageId
```

### 6. Close WebSocket When Done

```typescript
try {
  await client.wsConnect();
  // ... use WebSocket methods
} finally {
  await client.close();  // Always close when done
}
```

---

## Performance Tips

### Optimize Request Patterns

- **Batch similar operations** to avoid context switching
- **Use WebSocket** for multiple sequential operations
- **Pre-fetch limits** before batch processing
- **Cache results** when regeneration isn't needed

### Reduce Wait Times

- **Use appropriate timeouts** for different operations
- **Abort streams** when user cancels (saves GPU resources)
- **Use parallel requests** when rate limits allow

### Memory Management

- **Stream large responses** instead of loading into memory
- **Process downloads incrementally** for large files
- **Clear caches** when no longer needed

---

## Testing

Run SDK tests to verify your setup:

```bash
# Run all tests
npm test

# Run REST API tests only
npm run test:rest

# Run WebSocket tests only
npm run test:ws

# Run tests with coverage
npm run test:coverage
```

### Test Performance

| Test Suite | Tests | Expected Time |
|------------|-------|---------------|
| REST API | 25 | ~7 min |
| WebSocket | 33 | ~6 min |
| OpenAI | 15 | ~2 min |
| Full Suite | 73 | ~15 min |

---

## Support

Need help? Here are your options:

1. **Documentation**: Check this Wiki for detailed guides
2. **GitHub Issues**: Report bugs or request features
3. **Email Support**: Contact [support@2dai.io](mailto:support@2dai.io)

### Enterprise Support

For enterprise customers:
- Custom fine-tuned models for your brand/style
- Higher rate limits and dedicated infrastructure
- Priority support and SLA guarantees

Contact [enterprise@2dai.io](mailto:enterprise@2dai.io) for more information.

---

## Next Steps

- [Getting Started](Getting-Started) - Initial setup
- [API Reference](API-Reference) - Complete documentation
- [Examples](Examples) - Code samples

---

← [Examples](Examples) | [Home](Home) →
