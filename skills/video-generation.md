---
name: 2DAI Video Generation
capability: video_generation
version: 1.10.0
api_base_url: https://apiv2.2dai.io:800
recommended_settings:
  duration: 6.5
  fps: 16
---

# Video Generation Skills

Generate videos from static images with AI-powered motion.

## Capability

| Mode | Description | Endpoint |
|------|-------------|----------|
| img2vid | Convert static image to video with motion | `POST /api/v1/generation/video` |

---

## Recommended Settings

For optimal results, use these recommended settings:

| Setting | Recommended Value | Notes |
|---------|-------------------|-------|
| **Duration** | **6.5 seconds** | Best balance of quality and length |
| **FPS** | **16 fps** | Smooth motion without excessive file size |

---

## Image-to-Video (img2vid)

Generate a video from a static image with motion and animation.

### Endpoint
```
POST https://apiv2.2dai.io:800/api/v1/generation/video
```

### Request (Recommended Settings)
```bash
curl -X POST "https://apiv2.2dai.io:800/api/v1/generation/video" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "imageId": "source-image-id",
    "prompt": "the camera slowly pans left, smooth cinematic motion",
    "duration": 6.5,
    "fps": 16
  }'
```

### Parameters

| Parameter | Type | Required | Default | Range | Description |
|-----------|------|----------|---------|-------|-------------|
| `imageId` | string | Yes | - | - | CDN ID of source image |
| `prompt` | string | No | - | - | Motion/camera movement description |
| `duration` | number | No | 5 | 1-10 | Video length in seconds (**recommended: 6.5**) |
| `fps` | number | No | 16 | 8-60 | Frames per second (**recommended: 16**) |
| `seed` | number | No | random | 0-2B | Seed for reproducibility |
| `nsfwLora` | boolean | No | false | - | Enable NSFW LoRA support |
| `watermark` | string | No | - | - | CDN ID of watermark image |
| `watermarkPosition` | string | No | `southeast` | - | Watermark position |

### Response
```json
{
  "success": true,
  "data": {
    "videoId": "4c14085e-02da-4186-a928-9c1e931383fe",
    "duration": 6.5,
    "fps": 16,
    "seed": 1638417043
  }
}
```

### Typical Response Time
~100 seconds

---

## Motion Prompt Examples

The `prompt` parameter describes how the image should animate. Here are effective motion prompts:

### Camera Movements

| Desired Effect | Prompt Example |
|----------------|----------------|
| Pan left | `"the camera slowly pans left, smooth motion"` |
| Pan right | `"the scene view pans right slowly"` |
| Zoom in | `"slow zoom in on the subject, focusing on details"` |
| Zoom out | `"gradual zoom out revealing the full scene"` |
| Tilt up | `"camera tilts upward revealing the sky"` |
| Tilt down | `"camera tilts down toward the ground"` |
| Orbit | `"camera orbits around the subject smoothly"` |

### Subject Animation

| Desired Effect | Prompt Example |
|----------------|----------------|
| Subtle movement | `"gentle breathing, hair moving slightly in the wind"` |
| Walking | `"character walks forward naturally"` |
| Talking | `"person speaking, subtle facial movements"` |
| Nature | `"leaves rustling, water flowing gently"` |
| Action | `"character moves with explosive energy"` |
| Ambient | `"clouds drifting, sun rays moving slowly"` |

### Combined Effects

```
"the camera slowly zooms in while the character turns their head,
hair flowing in the breeze, cinematic lighting"
```

---

## FPS Recommendations

| Motion Type | Recommended FPS | Notes |
|-------------|-----------------|-------|
| Slow, subtle | 8-12 | Dreamy, artistic feel |
| Normal motion | **16** (recommended) | Natural movement, good balance |
| Smooth motion | 24 | Film-like quality |
| Fast action | 30-60 | Sports, rapid movement |

---

## Duration Guidelines

| Duration | Use Case |
|----------|----------|
| 1-3 sec | Quick loops, GIF-style |
| 4-5 sec | Short clips, social media |
| **6.5 sec** (recommended) | Optimal quality and length |
| 7-10 sec | Longer narratives, full scenes |

---

## Agent Decision Guide

| User Request | Action |
|--------------|--------|
| "Make this image a video" | Use img2vid with recommended settings (6.5s, 16fps) |
| "Animate this picture" | Use img2vid with appropriate motion prompt |
| "Add motion to the image" | Use img2vid with motion prompt |
| "Create a short video clip" | Use img2vid with duration 3-5s |
| "Make a longer video" | Use img2vid with duration 7-10s |
| "Smooth camera pan" | Use img2vid with pan prompt, 16-24fps |
| "Cinematic video" | Use img2vid with `cine` style source, 6.5s at 16fps |

---

## Workflow Example

### Step 1: Generate Source Image
```bash
curl -X POST "https://apiv2.2dai.io:800/api/v1/generation/image" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "a serene mountain landscape at golden hour",
    "style": "cine",
    "format": "landscape"
  }'
# Response: { "data": { "imageId": "abc123..." } }
```

### Step 2: Generate Video from Image
```bash
curl -X POST "https://apiv2.2dai.io:800/api/v1/generation/video" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "imageId": "abc123...",
    "prompt": "slow zoom in, clouds drifting, golden light rays moving",
    "duration": 6.5,
    "fps": 16
  }'
# Response: { "data": { "videoId": "def456..." } }
```

### Step 3: Download Video
```bash
curl -H "Authorization: Bearer $API_KEY" \
  "https://apiv2.2dai.io:800/api/v1/cdn/def456....mp4" -o video.mp4
```

---

## WebSocket Alternative

For real-time progress updates during video generation:

```json
// Connect to: wss://apiv2.2dai.io:800/ws/generation

// Authenticate
{ "type": "auth", "data": { "apiKey": "2dai_pk_..." } }

// Generate video
{
  "type": "generate_video",
  "requestId": "vid_123",
  "data": {
    "imageId": "source-image-id",
    "prompt": "camera pans left smoothly",
    "duration": 6.5,
    "fps": 16
  }
}

// Progress updates (video generation takes ~100 seconds)
{ "type": "progress", "requestId": "vid_123", "data": { "progress": 25 } }
{ "type": "progress", "requestId": "vid_123", "data": { "progress": 50 } }
{ "type": "progress", "requestId": "vid_123", "data": { "progress": 75 } }

// Completion
{
  "type": "generation_complete",
  "requestId": "vid_123",
  "data": { "videoId": "...", "duration": 6.5, "fps": 16 }
}
```

---

## Rate Limits

| Per 15 Minutes | Per Day |
|----------------|---------|
| 5 requests | 30 requests |

Check current limits:
```bash
curl -H "Authorization: Bearer $API_KEY" \
  "https://apiv2.2dai.io:800/api/v1/settings/rate-limits"
```

---

[Back to Main Skill](../skill.md) | [Image Generation](./image-generation.md) | [LLM Text](./llm-text.md)
