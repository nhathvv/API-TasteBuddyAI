# 🔍 Debug: Zero Items Extracted

## 🚨 Current Issue

```
[Nest] 25122 - LOG [VisualExtractionAgent] Extracted 0 items in 4606ms
{
  menuSections: [],
  metadata: {
    totalItems: 0,
    extractionQuality: 'low',
    confidenceScore: 0
  }
}
```

**Problem:** Visual Extraction Agent không extract được món ăn nào từ ảnh.

---

## 🔍 Diagnostic Steps

### **Step 1: Enable Debug Logs**

```bash
# Set environment variable
export LOG_LEVEL=debug

# Or in .env file
LOG_LEVEL=debug

# Restart server
npm run start:dev
```

**Expected logs với debug:**
```
═══════════════════════════════════════════
📩 RAW RESPONSE FROM GEMINI
═══════════════════════════════════════════
{"menuSections":[],"metadata":{...}}
═══════════════════════════════════════════
```

---

### **Step 2: Check Image Quality**

**Validation Passed:** ✅ (51ms)
- Image IS a food/menu photo
- Image passed validation

**BUT Extraction Failed:** ❌ (0 items)
- Gemini could not read text
- Or no clear menu text in image

**Possible Causes:**
1. ❌ Image is blurry/low resolution
2. ❌ Text is too small
3. ❌ Image is a food photo, not menu
4. ❌ Handwritten menu (hard to read)
5. ❌ Non-Vietnamese text
6. ❌ Image rotated/sideways

---

### **Step 3: Check Image Data**

```typescript
// Add logging in menu.service.ts
this.logger.log(`Image Data Length: ${dto.imageData.length} chars`);
this.logger.log(`MIME Type: ${dto.mimeType}`);
this.logger.log(`Language: ${dto.language}`);

// Check if image data is valid base64
const isValidBase64 = /^[A-Za-z0-9+/=]+$/.test(dto.imageData);
this.logger.log(`Valid Base64: ${isValidBase64}`);
```

---

## 🔧 Quick Fixes

### **Fix 1: Try Different Image**

```bash
# Test with known good menu image
curl -X POST http://localhost:3000/menu/upload/scan-async \
  -F "image=@clear_menu.jpg" \
  -F "language=vi"
```

**Good test images:**
- Clear printed menu
- High resolution (> 1024px width)
- Good lighting
- Text-focused (not food photo)

---

### **Fix 2: Add Fallback to Cloud Vision**

```typescript
// In menu.service.ts scanMenuAsync

if (extractionResult.metadata.totalItems === 0) {
  this.logger.warn('Visual Extraction got 0 items, trying Cloud Vision...');
  
  try {
    const cloudResult = await this.cloudVisionAgent.execute({
      imageData: dto.imageData,
      mimeType: dto.mimeType,
      features: [VisionFeature.TEXT_DETECTION],
    });
    
    this.logger.log(`Cloud Vision detected text: ${cloudResult.fullText?.substring(0, 200)}`);
    
    // Extract dish names from OCR text
    const dishNames = this.extractDishNamesFromOCR(
      cloudResult.fullText || '',
      cloudResult.textAnnotations || []
    );
    
    this.logger.log(`Extracted ${dishNames.length} dish names from Cloud Vision`);
    
    // Use these dishes instead
    if (dishNames.length > 0) {
      // Continue with dish understanding...
    }
  } catch (error) {
    this.logger.error(`Cloud Vision fallback failed: ${error.message}`);
  }
}
```

---

### **Fix 3: Improve Visual Extraction Prompt**

```typescript
// In visual-extraction.agent.ts
// Add more emphasis on extraction

const enhancedSystemInstruction = `You are a specialized Visual Extraction Agent for Vietnamese restaurant menus.

CRITICAL INSTRUCTIONS:
1. ALWAYS extract ANY visible text that looks like food/dish names
2. NEVER return empty results unless image is completely blank
3. If text is unclear, extract with low confidence but STILL INCLUDE IT
4. Look for patterns: dish name + price, numbered lists, categories
5. Even partial extraction is better than nothing

WHAT TO EXTRACT:
- Dish names (even if blurry)
- Prices (look for numbers with ₫ or "đ")
- Section headers (Món chính, Món phụ, etc.)
- Descriptions (even partial)

CONFIDENCE LEVELS:
- High (0.8-1.0): Clear, readable text
- Medium (0.5-0.8): Somewhat blurry but readable
- Low (0.2-0.5): Very blurry but identifiable
- Minimal (0.1-0.2): Barely visible but present

REMEMBER: Extract everything you can see, even with low confidence.
Empty results should ONLY happen if image contains NO menu-like text at all.`;
```

---

### **Fix 4: Add Image Preprocessing**

```typescript
// Optional: Add image enhancement before sending to Gemini
import sharp from 'sharp';

async preprocessImage(imageData: string, mimeType: string): Promise<string> {
  try {
    const buffer = Buffer.from(imageData, 'base64');
    
    // Enhance image for better OCR
    const enhanced = await sharp(buffer)
      .resize(2048, null, { // Resize to optimal width
        fit: 'inside',
        withoutEnlargement: true
      })
      .normalize() // Normalize levels
      .sharpen() // Sharpen text
      .toBuffer();
    
    return enhanced.toString('base64');
  } catch (error) {
    this.logger.warn(`Image preprocessing failed: ${error.message}`);
    return imageData; // Return original if fails
  }
}
```

---

## 📊 Diagnostic Checklist

Run this checklist to debug:

```bash
# 1. Check logs with DEBUG level
export LOG_LEVEL=debug
npm run start:dev

# 2. Test with simple menu
# Upload a clear, simple menu photo

# 3. Check if Cloud Vision works
curl -X POST http://localhost:3000/menu/test/cloud-vision \
  -H "Content-Type: application/json" \
  -d '{
    "imageData": "base64_image_data",
    "mimeType": "image/jpeg"
  }'

# 4. Test Visual Extraction directly
curl -X POST http://localhost:3000/menu/test/visual-extraction \
  -H "Content-Type: application/json" \
  -d '{
    "imageData": "base64_image_data",
    "mimeType": "image/jpeg",
    "language": "vi"
  }'
```

---

## 🎯 Root Cause Analysis

Based on logs, likely causes (in order):

### **1. Image Quality Issues (Most Likely)**
```
✅ Validation passed (image is food/menu)
❌ Extraction got 0 items
→ Image passed validation but Gemini couldn't read text
```

**Solutions:**
- Use clearer image
- Better lighting
- Higher resolution
- Text-focused (not food photo)

### **2. Gemini Model Issue**
```
Model: gemini-flash-latest
Timeout: 30000ms (completed in 4606ms)
```

**Solutions:**
- Try gemini-pro-vision instead
- Increase timeout (already sufficient)
- Add retry logic

### **3. Prompt Not Effective**
```
Current prompt emphasizes extraction
But still gets 0 items
```

**Solutions:**
- Make prompt more aggressive
- Add examples in prompt
- Use few-shot learning

---

## 🔧 Immediate Action Items

### **Priority 1: Add Debug Logging**

```typescript
// Add to visual-extraction.agent.ts before Gemini call

this.logger.debug('═══════════════════════════════════════════');
this.logger.debug('🖼️  IMAGE INFO');
this.logger.debug('═══════════════════════════════════════════');
this.logger.debug(`MIME Type: ${input.mimeType}`);
this.logger.debug(`Data Length: ${input.imageData.length} chars`);
this.logger.debug(`First 100 chars: ${input.imageData.substring(0, 100)}...`);
this.logger.debug(`Language: ${language}`);
this.logger.debug(`Mode: ${extractionMode}`);
this.logger.debug('═══════════════════════════════════════════');
```

### **Priority 2: Add Fallback Logic**

```typescript
// In scanMenuAsync, after extraction
if (extractionResult.metadata.totalItems === 0) {
  this.logger.warn('⚠️  Zero items extracted - triggering fallback');
  
  // Try Cloud Vision as fallback
  // (implement fallback logic)
}
```

### **Priority 3: Improve Error Messages**

```typescript
// More helpful error messages
if (parsedOutput.metadata.totalItems === 0) {
  this.logger.warn('═══════════════════════════════════════════');
  this.logger.warn('⚠️  ZERO ITEMS EXTRACTED');
  this.logger.warn('═══════════════════════════════════════════');
  this.logger.warn('Possible causes:');
  this.logger.warn('  1. Image is blurry or low quality');
  this.logger.warn('  2. Text is too small to read');
  this.logger.warn('  3. Image is food photo, not menu');
  this.logger.warn('  4. Handwritten menu');
  this.logger.warn('  5. Non-Vietnamese text');
  this.logger.warn('Suggestions:');
  this.logger.warn('  - Upload clearer menu photo');
  this.logger.warn('  - Ensure text is readable');
  this.logger.warn('  - Try Cloud Vision fallback');
  this.logger.warn('═══════════════════════════════════════════');
}
```

---

## 🧪 Testing

```bash
# Test 1: Good menu (should work)
curl -X POST /menu/upload/scan-async \
  -F "image=@test_images/clear_menu.jpg" \
  -F "language=vi"

# Test 2: Blurry menu (might fail)
curl -X POST /menu/upload/scan-async \
  -F "image=@test_images/blurry_menu.jpg" \
  -F "language=vi"

# Test 3: Food photo (will fail)
curl -X POST /menu/upload/scan-async \
  -F "image=@test_images/food_photo.jpg" \
  -F "language=vi"
```

---

## ✅ Next Steps

1. **Enable DEBUG logs** - See raw Gemini response
2. **Test with clear menu** - Verify system works
3. **Add fallback logic** - Use Cloud Vision if VEA fails
4. **Improve prompts** - Make extraction more aggressive
5. **Add image preprocessing** - Enhance image quality

**Most Important:** Enable `LOG_LEVEL=debug` to see what Gemini actually returns!

```bash
# Add to .env
LOG_LEVEL=debug

# Restart
npm run start:dev

# Try again and check logs for:
# "📩 RAW RESPONSE FROM GEMINI"
```
