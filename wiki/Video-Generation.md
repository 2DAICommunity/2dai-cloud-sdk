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

The AI video generator analyzes your source image and generates motion. For best results, understand the two motion styles and how to optimize your source images.

### Motion Styles

#### Dynamic Motion (Progression)
Best for videos that show **change and progression** from start to end.

- **Camera movement allowed**: pan, zoom, dolly, follow shots
- **Subject can move** through scene dramatically
- **Clear story arc**: beginning → middle → end states
- **Ideal for**: action sequences, transformations, journeys

```typescript
// Dynamic: Action sequence with progression
const action = await client.generateImage({
  prompt: 'warrior mid-leap, sword raised, debris flying, dynamic action pose',
  style: 'cinematic'
});
```

#### Loop-Friendly Motion (Subtle/Cyclic)
Best for videos that **seamlessly repeat** in a perfect cycle.

- **Camera stays fixed**: no panning, zooming, or movement
- **Final frame returns** to exact starting position
- **Subtle movements only**: breathing, blinking, gentle sway, hair/clothes movement
- **Ideal for**: profile pictures, ambient backgrounds, subtle animations

```typescript
// Loop-friendly: Subtle repeatable motion
const portrait = await client.generateImage({
  prompt: 'woman with flowing hair, gentle breeze, soft lighting, serene expression',
  style: 'portrait'
});
```

### Particle Effects

Adding particle elements creates more dynamic and engaging videos:

| Particles | Best For |
|-----------|----------|
| dust, sand, debris | Action scenes, impacts, explosions |
| snow, rain, water droplets | Weather, atmosphere, mood |
| sparks, embers, fire | Energy, magic, warmth |
| leaves, petals, feathers | Nature, wind effects, gentle motion |
| light particles, smoke | Ethereal, mystical, dreamy scenes |

```typescript
// Environmental motion with particles
const campfire = await client.generateImage({
  prompt: 'campfire with floating embers, smoke rising, warm glow, night forest',
  style: 'cinematic'
});

const video = await client.generateVideo({
  imageId: campfire.imageId,
  duration: 5,
  fps: 24
});
```

### Source Image Examples

```typescript
// Good: Implies clear motion direction
const sprint = await client.generateImage({
  prompt: 'athlete bursting from starting blocks, explosive power, dust flying',
  style: 'sport'
});

// Good: Environmental motion cues
const ocean = await client.generateImage({
  prompt: 'ocean waves crashing on rocks, water splashing, mist rising, dramatic',
  style: 'realistic'
});

// Good: Loop-friendly subtle motion
const candle = await client.generateImage({
  prompt: 'candle flame flickering, soft warm glow, gentle smoke wisps, dark room',
  style: 'cinematic'
});

// Good: Character with implied movement
const dancer = await client.generateImage({
  prompt: 'ballet dancer mid-pirouette, flowing dress, graceful pose, motion blur',
  style: 'portrait'
});
```

### Tips for Better Videos

| Tip | Example |
|-----|---------|
| Use action verbs | "running", "flying", "flowing", "dancing", "leaping" |
| Add motion descriptors | "in motion", "mid-action", "dynamic", "explosive" |
| Include particles | "dust flying", "sparks scattering", "leaves falling", "embers floating" |
| Describe energy level | "explosive", "gentle", "subtle", "dramatic", "serene" |
| For loops, keep it subtle | "breathing", "blinking", "swaying", "flickering", "rippling" |
| Suggest camera (dynamic only) | "camera follows", "zooming in", "panning shot" |

---

## From Image ID

Use an existing image from the CDN as the source.

```typescript
const video = await client.generateVideo({
  imageId: 'existing-image-id',
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
