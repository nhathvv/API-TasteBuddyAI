# Cloud Vision AI Agent - Usage Guide

## Overview

Cloud Vision Agent là một AI Agent mới được tích hợp sử dụng **Google Cloud Vision API** để phân tích ảnh menu với các tính năng nâng cao:

- **TEXT_DETECTION**: OCR chính xác cao với phát hiện ngôn ngữ
- **LABEL_DETECTION**: Gắn thẻ tự động (Food, Menu, Restaurant, etc.)
- **OBJECT_LOCALIZATION**: Phát hiện đối tượng với bounding boxes
- **LOGO_DETECTION**: Nhận diện logo thương hiệu

## Architecture

Cloud Vision Agent kế thừa từ `BaseAIAgent` và tuân theo cùng pattern với các agents khác trong hệ thống:

```
BaseAIAgent<CloudVisionInput, CloudVisionOutput>
    ↓
CloudVisionAgent
```

### Files Created

- `src/ai-agents/cloud-vision/cloud-vision.schema.ts` - Types và validation
- `src/ai-agents/cloud-vision/cloud-vision.agent.ts` - Agent service
- Updated `src/ai-agents/ai-agents.module.ts` - Module configuration
- Updated `src/modules/menu/menu.service.ts` - Service integration
- Updated `src/modules/menu/menu.controller.ts` - Test endpoint

## Setup

### 1. Environment Variables

Thêm API key vào `.env`:

```bash
GOOGLE_CLOUD_VISION_API_KEY=your-api-key-here
```

### 2. Enable Cloud Vision API

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo hoặc chọn project
3. Enable **Cloud Vision API**
4. Tạo API key (Credentials > Create Credentials > API Key)
5. Copy API key vào `.env`

## Test Endpoint

### Endpoint URL

```
POST /menu/upload/vision-test
```

### Request (multipart/form-data)

```bash
curl -X POST http://localhost:3000/menu/upload/vision-test \
  -F "image=@menu-photo.jpg" \
  -F "features=TEXT_DETECTION,LABEL_DETECTION" \
  -F "maxResults=10" \
  -F "languageHints=vi,en"
```

### Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `image` | File | ✅ | Image file (JPEG, PNG, GIF, BMP, WebP) |
| `features` | String | ❌ | Comma-separated features (default: TEXT_DETECTION,LABEL_DETECTION) |
| `maxResults` | Number | ❌ | Max results per feature (default: 10) |
| `languageHints` | String | ❌ | Comma-separated language codes (e.g., "vi,en") |

### Available Features

- `TEXT_DETECTION` - Phát hiện văn bản (OCR)
- `DOCUMENT_TEXT_DETECTION` - OCR cho tài liệu dày đặc văn bản
- `LABEL_DETECTION` - Gắn thẻ/phân loại ảnh
- `OBJECT_LOCALIZATION` - Phát hiện đối tượng với vị trí
- `LOGO_DETECTION` - Nhận diện logo
- `LANDMARK_DETECTION` - Nhận diện địa danh
- `FACE_DETECTION` - Phát hiện khuôn mặt
- `IMAGE_PROPERTIES` - Thuộc tính ảnh (màu sắc)
- `SAFE_SEARCH_DETECTION` - Phát hiện nội dung nhạy cảm

### Response Example

```json
{
  "agent": "CloudVisionAgent",
  "result": {
    "fullText": "Phở Bò 50,000đ\nBún Riêu 45,000đ\nCơm Tấm 40,000đ",
    "textAnnotations": [
      {
        "description": "Phở Bò",
        "confidence": 0.98,
        "boundingPoly": {
          "vertices": [
            { "x": 10, "y": 20 },
            { "x": 100, "y": 20 },
            { "x": 100, "y": 40 },
            { "x": 10, "y": 40 }
          ]
        },
        "locale": "vi"
      }
    ],
    "labelAnnotations": [
      {
        "description": "Food",
        "score": 0.95,
        "topicality": 0.92
      },
      {
        "description": "Menu",
        "score": 0.88,
        "topicality": 0.85
      },
      {
        "description": "Restaurant",
        "score": 0.82
      }
    ],
    "metadata": {
      "processingTime": 1234,
      "confidenceScore": 0.91,
      "featuresRequested": 2,
      "featuresCompleted": ["TEXT_DETECTION", "LABEL_DETECTION"]
    }
  }
}
```

## Testing in Swagger UI

1. Start server: `npm run start:dev`
2. Open Swagger UI: http://localhost:3000/api
3. Navigate to **Menu & AI Agents** section
4. Find **POST /menu/upload/vision-test**
5. Click "Try it out"
6. Upload an image file
7. Optionally specify features, maxResults, languageHints
8. Click "Execute"

## Use Cases

### 1. Menu OCR (Text Extraction)

```bash
curl -X POST http://localhost:3000/menu/upload/vision-test \
  -F "image=@vietnamese-menu.jpg" \
  -F "features=TEXT_DETECTION" \
  -F "languageHints=vi"
```

**Use case**: Extract menu text with Vietnamese language support

### 2. Image Classification

```bash
curl -X POST http://localhost:3000/menu/upload/vision-test \
  -F "image=@food-photo.jpg" \
  -F "features=LABEL_DETECTION,OBJECT_LOCALIZATION"
```

**Use case**: Identify food items and their locations in the image

### 3. Logo Detection

```bash
curl -X POST http://localhost:3000/menu/upload/vision-test \
  -F "image=@restaurant-sign.jpg" \
  -F "features=LOGO_DETECTION,TEXT_DETECTION"
```

**Use case**: Detect restaurant brand logos and signage

### 4. Comprehensive Analysis

```bash
curl -X POST http://localhost:3000/menu/upload/vision-test \
  -F "image=@menu.jpg" \
  -F "features=TEXT_DETECTION,LABEL_DETECTION,OBJECT_LOCALIZATION,LOGO_DETECTION"
```

**Use case**: Full menu analysis with all available features

## Comparison: Cloud Vision vs Visual Extraction Agent

| Feature | Cloud Vision Agent | Visual Extraction Agent |
|---------|-------------------|------------------------|
| Technology | Google Cloud Vision API | Gemini 1.5 Flash |
| OCR Accuracy | ⭐⭐⭐⭐⭐ Very High | ⭐⭐⭐⭐ High |
| Speed | Fast (1-2s) | Fast (1-3s) |
| Bounding Boxes | ✅ Yes | ❌ No |
| Label Detection | ✅ Yes | ❌ No |
| Object Detection | ✅ Yes | ❌ No |
| Structured Output | Basic | Advanced (Menu sections) |
| Vietnamese Support | ✅ Excellent | ✅ Excellent |
| Cost | Per request | Per request |
| Best For | OCR, Classification | Menu Extraction, Structure |

## Integration with Orchestrator

Cloud Vision Agent có thể được tích hợp vào `AgentOrchestratorService` để chạy song song với các agents khác:

```typescript
const { results } = await orchestrator.runParallel([
  {
    agent: cloudVisionAgent,
    label: 'vision-analysis',
    input: { imageData, mimeType, features: ['TEXT_DETECTION', 'LABEL_DETECTION'] }
  },
  {
    agent: visualExtractionAgent,
    label: 'menu-extraction',
    input: { imageData, mimeType, language: 'vi' }
  }
]);
```

## Error Handling

### Common Errors

**1. Missing API Key**
```
CLOUD_VISION_AUTH_ERROR: Check GOOGLE_CLOUD_VISION_API_KEY in .env
```
**Solution**: Add API key to `.env` file

**2. API Not Enabled**
```
CLOUD_VISION_ERROR: Cloud Vision API has not been enabled
```
**Solution**: Enable Cloud Vision API in Google Cloud Console

**3. Quota Exceeded**
```
CLOUD_VISION_QUOTA_ERROR: API quota exceeded. Try again later.
```
**Solution**: Wait or upgrade quota in Google Cloud Console

**4. Invalid Image**
```
VEA_INVALID_IMAGE: Invalid MIME type
```
**Solution**: Use supported formats (JPEG, PNG, GIF, BMP, WebP)

## Deployment Considerations

1. **API Key Security**: Store API key in environment variables, never commit to git
2. **Rate Limiting**: Cloud Vision has usage quotas, implement retry logic if needed
3. **Cost**: Monitor usage in Google Cloud Console
4. **Caching**: Consider caching results for frequently analyzed images

## Next Steps

1. ✅ Test endpoint đã sẵn sàng sử dụng
2. 🔧 Configure API key trong `.env`
3. 🧪 Test với ảnh menu thực tế
4. 📊 Monitor usage và costs
5. 🔄 Tích hợp vào orchestrator nếu cần

## Support

For issues or questions:
- Check logs in console
- Verify API key is correct
- Ensure Cloud Vision API is enabled
- Check Google Cloud Console for quota limits
