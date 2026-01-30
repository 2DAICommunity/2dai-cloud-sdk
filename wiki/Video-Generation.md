# Video Generation

Generate videos from static images using AI.

## Table of Contents

- [Basic Usage](#basic-usage)
- [Prompting for Motion](#prompting-for-motion)
- [From Image ID](#from-image-id)
- [From Buffer](#from-buffer)
- [WebSocket Method](#websocket-method)
- [Options Reference](#options-reference)
- [Response Type](#response-type)

---

## Basic Usage

Create videos from existing images using the `generateVideo()` method.

```typescript
import { createClient } from '2dai-cloud-sdk';

const client = createClient('2dai_pk_your_api_key');

const video = await client.generateVideo({
  imageId: '550e8400-e29b-41d4-a716-446655440000',
  prompt: 'the scene view (the camera) pans left, smooth motion',  // Optional motion prompt
  duration: 5,  // 1-10 seconds
  fps: 16       // 8-60 frames per second
});

console.log(video);
// {
//   success: true,
//   videoId: '660e8400-e29b-41d4-a716-446655440000',
//   duration: 5,
//   fps: 16
// }
```

---

## Prompting for Motion

Use the `prompt` parameter to control video motion and animation. The AI analyzes your source image and applies motion based on your prompt. For best results, understand the two motion styles.

### Motion Styles

#### Dynamic Motion (Progression)
Best for videos that show **change and progression** from start to end.

- **Scene view movement**: pan, zoom, dolly, follow shots
- **Subject motion**: dramatic movement through scene
- **Clear story arc**: beginning → middle → end states
- **Ideal for**: action sequences, transformations, journeys

```typescript
// Dynamic: Action sequence with scene view movement
const action = await client.generateImage({
  prompt: 'warrior mid-leap, sword raised, debris flying, dynamic action pose',
  style: 'cinematic'
});

const video = await client.generateVideo({
  imageId: action.imageId,
  prompt: 'the scene view (the camera) follows action, debris scatters, dramatic slow motion',
  duration: 5,
  fps: 24
});
```

#### Loop-Friendly Motion (Subtle/Cyclic)
Best for videos that **seamlessly repeat** in a perfect cycle.

- **Scene view stays fixed**: no panning, zooming, or movement
- **Subtle movements only**: breathing, blinking, gentle sway
- **Final frame returns** to starting position
- **Ideal for**: profile pictures, ambient backgrounds, subtle animations

```typescript
// Loop-friendly: Subtle repeatable motion
const portrait = await client.generateImage({
  prompt: 'woman with flowing hair, gentle breeze, soft lighting, serene expression',
  style: 'portrait'
});

const video = await client.generateVideo({
  imageId: portrait.imageId,
  prompt: 'subtle hair movement, gentle breathing, soft wind effect, seamless loop',
  duration: 3,
  fps: 16
});
```

### Particle Effects

Adding particle effects in your motion prompt creates more dynamic videos:

| Particles | Motion Prompt Examples |
|-----------|------------------------|
| dust, sand, debris | "debris flying outward, dust swirling" |
| snow, rain, water droplets | "snow falling gently, rain streaming down" |
| sparks, embers, fire | "embers floating upward, flames flickering" |
| leaves, petals, feathers | "leaves drifting in wind, petals scattering" |
| light particles, smoke | "smoke rising slowly, particles floating" |

```typescript
// Environmental motion with particle animation
const campfire = await client.generateImage({
  prompt: 'campfire with floating embers, smoke rising, warm glow, night forest',
  style: 'cinematic'
});

const video = await client.generateVideo({
  imageId: campfire.imageId,
  prompt: 'flames flickering, embers floating upward, smoke drifting, warm ambient glow',
  duration: 5,
  fps: 24
});
```

### Full Examples

```typescript
// Action scene with explosive motion
const sprint = await client.generateImage({
  prompt: 'athlete bursting from starting blocks, explosive power, dust flying',
  style: 'sport'
});
const sprintVideo = await client.generateVideo({
  imageId: sprint.imageId,
  prompt: 'explosive forward motion, dust cloud expanding, dynamic speed blur',
  duration: 3,
  fps: 30
});

// Environmental motion - waves and water
const ocean = await client.generateImage({
  prompt: 'ocean waves crashing on rocks, water splashing, mist rising, dramatic',
  style: 'realistic'
});
const oceanVideo = await client.generateVideo({
  imageId: ocean.imageId,
  prompt: 'waves rolling and crashing, water spray rising, foam churning',
  duration: 5,
  fps: 24
});

// Loop-friendly subtle animation
const candle = await client.generateImage({
  prompt: 'candle flame flickering, soft warm glow, gentle smoke wisps, dark room',
  style: 'cinematic'
});
const candleVideo = await client.generateVideo({
  imageId: candle.imageId,
  prompt: 'flame gently flickering, subtle smoke rising, soft light dancing, seamless loop',
  duration: 3,
  fps: 16
});

// Character animation with graceful motion
const dancer = await client.generateImage({
  prompt: 'ballet dancer mid-pirouette, flowing dress, graceful pose, motion blur',
  style: 'portrait'
});
const dancerVideo = await client.generateVideo({
  imageId: dancer.imageId,
  prompt: 'graceful spinning motion, dress flowing elegantly, smooth rotation',
  duration: 4,
  fps: 24
});
```

### Motion Prompt Tips

| Category | Video Prompt Examples |
|----------|----------------------|
| Scene view movement | "the scene view (the camera) pans left", "slow zoom in", "dolly forward", "tracking shot" |
| Action verbs | "running forward", "flying through", "flowing smoothly", "spinning gracefully" |
| Particles | "dust flying outward", "sparks scattering", "leaves falling", "embers floating up" |
| Energy level | "explosive motion", "gentle movement", "subtle animation", "dramatic action" |
| Loop-friendly | "gentle breathing", "soft swaying", "subtle flickering", "seamless loop" |
| Speed modifiers | "slow motion", "smooth motion", "fast action", "gradual movement" |

---

## From Image ID

Use an existing image from the CDN as the source.

```typescript
const video = await client.generateVideo({
  imageId: 'existing-image-id',
  prompt: 'the scene view (the camera) pans smoothly, gentle motion',
  duration: 5,
  fps: 16
});
```

The `imageId` is typically from a previous `generateImage()` call.

---

## From Buffer

Generate video from an image buffer (useful for uploads).

```typescript
import fs from 'fs';

const imageBuffer = fs.readFileSync('my-image.jpg');

const video = await client.generateVideo({
  imageBuffer: imageBuffer,
  prompt: 'slow zoom in, subtle ambient motion',
  duration: 5
});
```

---

## WebSocket Method

For real-time generation with progress updates.

```typescript
await client.wsConnect();

const result = await client.wsGenerateVideo({
  imageId: 'existing-image-id',
  prompt: 'zoom in slowly, subtle motion',
  duration: 5,
  fps: 16
});

console.log(result.result.videoId);

await client.close();
```

---

## Options Reference

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `imageId` | `string` | - | CDN ID of source image |
| `imageBuffer` | `Buffer` | - | Image buffer (alternative to imageId) |
| `prompt` | `string` | - | Motion/animation prompt (e.g., "the scene view (the camera) pans left", "zoom in slowly") |
| `duration` | `number` | `5` | Video duration in seconds (1-10) |
| `fps` | `number` | `16` | Frames per second (8-60) |
| `watermark` | `string` | - | CDN ID of watermark image |
| `watermarkPosition` | `string` | `'southeast'` | Watermark position |

**Note:** Provide either `imageId` OR `imageBuffer`, not both.

---

## Response Type

### VideoGenerationResult

```typescript
interface VideoGenerationResult {
  success: boolean;
  videoId: string;
  duration: number;
  fps: number;
}
```

---

## Video Limits

```typescript
import { VIDEO_DURATION, VIDEO_FPS } from '2dai-cloud-sdk';

VIDEO_DURATION.MIN     // 1 second
VIDEO_DURATION.MAX     // 10 seconds
VIDEO_DURATION.DEFAULT // 5 seconds

VIDEO_FPS.MIN     // 8 fps
VIDEO_FPS.MAX     // 60 fps
VIDEO_FPS.DEFAULT // 16 fps
```

---

## Working with Generated Videos

After generation, you can:

1. **Download the video** via CDN:
   ```typescript
   const result = await client.downloadFromCDN(video.videoId, { format: 'mp4' });
   ```

2. **Extract frames** from the video:
   ```typescript
   const frame = await client.downloadFromCDN(video.videoId, {
     format: 'jpg',
     seek: 1500  // Extract frame at 1.5 seconds
   });
   ```

See [CDN Operations](CDN-Operations) for more details.

---

## Next Steps

- [CDN Operations](CDN-Operations) - Download and process videos
- [LLM & Streaming](LLM-Text-Generation) - Text generation

---

← [Image Generation](Image-Generation) | [LLM & Streaming](LLM-Text-Generation) →
