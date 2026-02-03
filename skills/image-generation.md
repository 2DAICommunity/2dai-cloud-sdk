---
name: 2DAI Image Generation
capability: image_generation
version: 1.11.0
api_base_url: https://apiv2.2dai.io:800
---

# Image Generation Skills

Generate, edit, and upscale images using AI.

## Capabilities

| Mode | Description | Endpoint |
|------|-------------|----------|
| text2img | Generate images from text prompts | `POST /api/v1/generation/image` |
| img2img | Edit/transform existing images | `POST /api/v1/generation/image/edit` |
| imgs2img | Dual-image editing (merge, blend, mix) | `POST /api/v1/generation/image/edit` |
| img2ximg | AI upscale images 2-4x | `POST /api/v1/generation/image/upscale` |

---

## Text-to-Image (text2img)

Generate a new image from a text prompt.

### Endpoint
```
POST https://apiv2.2dai.io:800/api/v1/generation/image
```

### Request
```bash
curl -X POST "https://apiv2.2dai.io:800/api/v1/generation/image" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "a futuristic city at sunset, flying cars, neon lights",
    "style": "cine",
    "format": "landscape"
  }'
```

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `prompt` | string | Yes | - | Text description of the image to generate |
| `style` | string | No | `raw` | Style preset (see styles table below) |
| `format` | string | No | `portrait` | Format preset (see formats table below) |
| `negativePrompt` | string | No | - | What to avoid in the image |
| `seed` | number | No | random | Seed for reproducibility (0-2,000,000,000) |
| `width` | number | No | - | Custom width (320-1344, overrides format) |
| `height` | number | No | - | Custom height (320-1344, overrides format) |
| `watermark` | string | No | - | CDN ID of watermark image |
| `watermarkPosition` | string | No | `southeast` | Position: `northwest`, `north`, `northeast`, `west`, `center`, `east`, `southwest`, `south`, `southeast` |
| `watermarkAsTiles` | boolean | No | false | Tile watermark across image |
| `copyright` | string | No | - | Copyright text to embed |

### Response
```json
{
  "success": true,
  "data": {
    "imageId": "550e8400-e29b-41d4-a716-446655440000",
    "width": 1344,
    "height": 768,
    "seed": 1234567890
  }
}
```

### Typical Response Time
28-37 seconds

---

## Image-to-Image (img2img)

Edit or transform an existing image.

### Endpoint
```
POST https://apiv2.2dai.io:800/api/v1/generation/image/edit
```

### Request
```bash
curl -X POST "https://apiv2.2dai.io:800/api/v1/generation/image/edit" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "imageId": "existing-image-id",
    "prompt": "add flying cars to the scene, make it more futuristic"
  }'
```

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `imageId` | string | Yes | - | CDN ID of the source image |
| `prompt` | string | Yes | - | Description of changes to make |
| `style` | string | No | `raw` | Style preset |
| `negativePrompt` | string | No | - | What to avoid |
| `seed` | number | No | random | Seed for reproducibility |
| `width` | number | No | - | Output width (320-1344) |
| `height` | number | No | - | Output height (320-1344) |
| `resizePad` | boolean | No | false | Pad instead of crop when resizing |

### Response
```json
{
  "success": true,
  "data": {
    "imageId": "new-generated-image-id",
    "width": 1344,
    "height": 768,
    "seed": 9876543210
  }
}
```

### Typical Response Time
45-50 seconds

---

## Dual-Image Editing (imgs2img)

Merge, blend, or mix two images together. Useful for face swaps, character consistency, style transfer.

### Endpoint
```
POST https://apiv2.2dai.io:800/api/v1/generation/image/edit
```

### Request
```bash
curl -X POST "https://apiv2.2dai.io:800/api/v1/generation/image/edit" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "imageId": "primary-image-id",
    "imageId2": "reference-image-id",
    "prompt": "combine both subjects in a fantasy setting"
  }'
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `imageId` | string | Yes | CDN ID of the primary image |
| `imageId2` | string | Yes | CDN ID of the reference/secondary image |
| `prompt` | string | Yes | Description of how to combine/blend |
| `style` | string | No | Style preset |
| `negativePrompt` | string | No | What to avoid |
| `seed` | number | No | Seed for reproducibility |

### Use Cases
- Face swap: Use face from imageId2 on body from imageId
- Character consistency: Same character in different scenes
- Style transfer: Apply style from one image to another
- Composition: Combine elements from both images

### Typical Response Time
45-50 seconds

---

## AI Upscale (img2ximg)

Increase image resolution using AI upscaling.

### Endpoint
```
POST https://apiv2.2dai.io:800/api/v1/generation/image/upscale
```

### Request
```bash
curl -X POST "https://apiv2.2dai.io:800/api/v1/generation/image/upscale" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "imageId": "source-image-id",
    "factor": 2
  }'
```

### Parameters

| Parameter | Type | Required | Default | Range | Description |
|-----------|------|----------|---------|-------|-------------|
| `imageId` | string | Yes | - | - | CDN ID of the source image |
| `factor` | number | No | 2 | 2-4 | Upscale multiplier |
| `seed` | number | No | random | 0-2B | Seed for consistency |

### Response
```json
{
  "success": true,
  "data": {
    "imageId": "upscaled-image-id",
    "width": 2688,
    "height": 1536,
    "seed": 1122334455
  }
}
```

### Typical Response Time
80-85 seconds

---

## Available Styles (14)

| Style ID | Name | Best For |
|----------|------|----------|
| `raw` | Raw | Testing, unprocessed defaults |
| `realistic` | Realistic | Photo-realistic images, product photos |
| `text` | Text & Clarity | Images with text, logos, UI mockups |
| `ciniji` | Ciniji | Vibrant anime with niji style |
| `portrait` | Portrait | Face/headshot photography |
| `cine` | Cinematic | Dramatic scenes, movie stills |
| `sport` | Sport | Sports photography, action shots |
| `fashion` | Fashion | Fashion photography, model shots |
| `niji` | Niji | Japanese anime style |
| `anime` | Anime | General anime/cartoon style |
| `manga` | Manga | Black and white manga panels |
| `watercolor` | Watercolor | Artistic watercolor paintings |
| `comicbook` | Comic | Western comic book style |
| `paint` | Paint | Oil/acrylic painting style |

---

## Available Formats (7)

| Format ID | Dimensions | Aspect Ratio | Use Case |
|-----------|------------|--------------|----------|
| `portrait` | 768x1344 | 9:16 | Mobile wallpapers, stories |
| `landscape` | 1344x768 | 16:9 | Desktop wallpapers, videos |
| `profile` | 1024x1024 | 1:1 | Avatars, thumbnails |
| `story` | 720x1280 | 9:16 | Social media stories |
| `post` | 1152x896 | 9:7 | Social media posts |
| `smartphone` | 640x1344 | ~1:2 | Phone screens, app mockups |
| `banner` | 1472x448 | 3:1 | Headers, website banners |

---

## Agent Decision Guide

| User Request | Use This | Key Parameters |
|--------------|----------|----------------|
| "Create an image of..." | text2img | `prompt`, `style`, `format` |
| "Generate a picture..." | text2img | `prompt`, `style`, `format` |
| "Edit this image to..." | img2img | `imageId`, `prompt` |
| "Modify the image..." | img2img | `imageId`, `prompt` |
| "Combine these two images" | imgs2img | `imageId`, `imageId2`, `prompt` |
| "Face swap" | imgs2img | `imageId`, `imageId2`, `prompt` |
| "Make this image larger" | img2ximg | `imageId`, `factor` |
| "Upscale to higher resolution" | img2ximg | `imageId`, `factor` |
| "Increase image quality" | img2ximg | `imageId`, `factor` |

---

## WebSocket Alternative

For real-time progress updates, use WebSocket:

```json
// Connect to: wss://apiv2.2dai.io:800/ws/generation

// Authenticate
{ "type": "auth", "data": { "apiKey": "2dai_pk_..." } }

// Generate image
{
  "type": "generate_image",
  "requestId": "req_123",
  "data": {
    "prompt": "a sunset over mountains",
    "style": "cine"
  }
}

// Progress updates
{ "type": "progress", "requestId": "req_123", "data": { "progress": 45 } }

// Completion
{
  "type": "generation_complete",
  "requestId": "req_123",
  "data": { "imageId": "...", "width": 1344, "height": 768 }
}
```

---

[Back to Main Skill](../skill.md) | [Video Generation](./video-generation.md) | [LLM Text](./llm-text.md)
