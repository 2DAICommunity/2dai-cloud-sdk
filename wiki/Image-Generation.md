# Image Generation

Generate, edit, and upscale images using AI.

## Table of Contents

- [Text-to-Image](#text-to-image)
- [Available Styles](#available-styles)
- [Available Formats](#available-formats)
- [Image Editing](#image-editing)
- [Dual-Image Editing (imgs2img)](#dual-image-editing-imgs2img)
- [AI Image Upscaling](#ai-image-upscaling)
- [WebSocket Methods](#websocket-methods)

---

## Text-to-Image

Generate images from text prompts.

### Basic Usage

```typescript
import { createClient, STYLES, FORMATS } from '2dai-cloud-sdk';

const client = createClient('2dai_pk_your_api_key');

const result = await client.generateImage({
  prompt: 'a cyberpunk cityscape at night with neon lights',
  style: STYLES.cine.id,
  format: FORMATS.landscape.id
});

console.log(result);
// {
//   success: true,
//   imageId: '550e8400-e29b-41d4-a716-446655440000',
//   width: 1344,
//   height: 768,
//   seed: 12345
// }
```

### With Options

```typescript
const result = await client.generateImage({
  prompt: 'a cyberpunk cityscape at night with neon lights',
  negativePrompt: 'blurry, low quality, distorted',
  style: STYLES.cine.id,
  format: FORMATS.landscape.id,
  seed: 12345,  // For reproducibility
  watermark: 'watermark-image-id',
  watermarkPosition: 'southeast'
});
```

### Options Reference

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `prompt` | `string` | required | Text description of the image |
| `style` | `string` | `'raw'` | Style preset ID |
| `format` | `string` | `'landscape'` | Format preset ID |
| `negativePrompt` | `string` | - | What to avoid in the image |
| `seed` | `number` | random | Seed for reproducibility (0-2000000000) |
| `width` | `number` | from format | Custom width (320-1344) |
| `height` | `number` | from format | Custom height (320-1344) |
| `watermark` | `string` | - | CDN ID of watermark image |
| `watermarkPosition` | `string` | `'southeast'` | Watermark position |

---

## Available Styles

```typescript
import { STYLES } from '2dai-cloud-sdk';

STYLES.raw         // Raw defaults
STYLES.realistic   // Realistic 2DAI generation
STYLES.text        // Text & Clarity - optimized for text rendering
STYLES.ciniji      // Niji anime style with vibrant colors
STYLES.portrait    // Portrait
STYLES.cine        // Cinematic
STYLES.sport       // Sport
STYLES.fashion     // Fashion
STYLES.niji        // Anime Niji
STYLES.anime       // Anime
STYLES.manga       // Manga
STYLES.watercolor  // Watercolor Anime
STYLES.comicbook   // Comic book illustration
STYLES.paint       // Paint
```

**14 styles available** - each optimized for different use cases.

---

## Available Formats

```typescript
import { FORMATS } from '2dai-cloud-sdk';

FORMATS.portrait    // 9:16 vertical (768x1344)
FORMATS.landscape   // 16:9 horizontal (1344x768)
FORMATS.profile     // 1:1 square (1024x1024)
FORMATS.story       // 9:16 story format (720x1280)
FORMATS.post        // 9:7 wide square (1152x896)
FORMATS.smartphone  // Phone screen (640x1344)
FORMATS.banner      // 3:1 wide banner (1472x448)
```

---

## Image Editing

Transform existing images with text prompts.

### Basic Edit

```typescript
const edited = await client.editImage('existing-image-id', {
  prompt: 'make the sky more dramatic with storm clouds'
});
```

### Edit with Resize

```typescript
const resized = await client.editImage('existing-image-id', {
  prompt: 'Seamlessly extend the image, remove the black background',
  width: 768,   // Custom output width (320-1344)
  height: 1344  // Custom output height (320-1344)
});
```

### Resize Padding

```typescript
const padded = await client.editImage('existing-image-id', {
  prompt: 'Seamlessly extend the image',
  width: 768,
  height: 1344,
  resizePad: true  // Fits original in frame, fills extra space with black
});
```

### `resizePad` Behavior

| resizePad | Behavior |
|-----------|----------|
| `false` (default) | Image is cropped/stretched to fill target dimensions |
| `true` | Original fits entirely within frame, extra space is black |

---

## Dual-Image Editing (imgs2img)

Use two images (image 1 + image 2) to merge, blend, or mix elements together.

### Combine Subjects

Combine subjects from both images together:

```typescript
const result = await client.editImage('image-1-id', {
  imageId2: 'image-2-id',
  prompt: 'make an image with both subjects'
});
```

### Blend Characters

Blend a character from image 2 into the scene of image 1:

```typescript
const result = await client.editImage('image-1-id', {
  imageId2: 'image-2-id',
  prompt: 'blend the character from image 2 into the scene of image 1'
});
```

### Mix Elements / Style

Mix elements or apply the style from image 2 to image 1:

```typescript
const result = await client.editImage('image-1-id', {
  imageId2: 'image-2-id',
  prompt: 'apply the style of image 2 to image 1'
});
```

### Combine Images

Combine image 1 and image 2 together:

```typescript
const result = await client.editImage('image-1-id', {
  imageId2: 'image-2-id',
  prompt: 'combine image 1 and image 2 into a seamless scene'
});
```

### With Resize

Combine dual-image editing with custom dimensions:

```typescript
const result = await client.editImage('image-1-id', {
  imageId2: 'image-2-id',
  prompt: 'blend image 1 and image 2 together seamlessly',
  width: 1344,
  height: 768
});
```

### Options Reference

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `imageId` | `string` | yes | Image 1 (primary) - the main image |
| `imageId2` | `string` | no | Image 2 (secondary) - for dual-image mode |
| `prompt` | `string` | yes | Instructions using "image 1" and "image 2" terminology |
| `negativePrompt` | `string` | no | What to avoid |
| `seed` | `number` | no | Seed for reproducibility |
| `width` | `number` | no | Custom output width (320-1344) |
| `height` | `number` | no | Custom output height (320-1344) |
| `resizePad` | `boolean` | no | Enable resize padding |

### Prompt Examples

| Action | Prompt |
|--------|--------|
| Combine subjects | `make an image with both subjects` |
| Blend character | `blend the character from image 2 into the scene of image 1` |
| Apply style | `apply the style of image 2 to image 1` |
| Mix elements | `mix elements from image 2 into image 1` |
| Combine | `combine image 1 and image 2 into a seamless scene` |

---

## AI Image Upscaling

Upscale images 2-4x using AI. No prompt needed.

### Basic Upscale

```typescript
import { UPSCALE_FACTOR } from '2dai-cloud-sdk';

const upscaled = await client.upscaleImage('existing-image-id', {
  factor: 2  // 2x, 3x, or 4x
});

console.log(upscaled);
// {
//   success: true,
//   imageId: 'upscaled-image-id',
//   width: 2048,
//   height: 2048,
//   seed: 12345
// }
```

### Upscale Constants

```typescript
import { UPSCALE_FACTOR } from '2dai-cloud-sdk';

UPSCALE_FACTOR.MIN     // 2
UPSCALE_FACTOR.MAX     // 4
UPSCALE_FACTOR.DEFAULT // 2
```

---

## WebSocket Methods

For real-time generation with progress updates.

### Generate Image

```typescript
await client.wsConnect();

const result = await client.wsGenerateImage({
  prompt: 'a futuristic city at night',
  style: 'cine',
  format: 'landscape'
});

console.log(result.result.imageId);

await client.close();
```

### Edit Image

```typescript
await client.wsConnect();

const result = await client.wsGenerateImage({
  imageId: 'existing-image-id',
  prompt: 'make the image black and white',
  width: 1344,
  height: 768
});

await client.close();
```

### Upscale Image

```typescript
await client.wsConnect();

const result = await client.wsUpscaleImage({
  imageId: 'existing-image-id',
  factor: 2
});

await client.close();
```

---

## Response Types

### ImageGenerationResult

```typescript
interface ImageGenerationResult {
  success: boolean;
  imageId: string;
  width: number;
  height: number;
  seed?: number;
}
```

### UpscaleResult

```typescript
interface UpscaleResult {
  success: boolean;
  imageId: string;
  width: number;
  height: number;
  seed?: number;
}
```

---

## Next Steps

- [Video Generation](Video-Generation) - Create videos from images
- [CDN Operations](CDN-Operations) - Download and transform images
- [Watermarking](CDN-Operations#watermarking) - Add watermarks to images

---

← [Getting Started](Getting-Started) | [Video Generation](Video-Generation) →
