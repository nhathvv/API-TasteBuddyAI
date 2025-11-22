# 📤 File Upload Endpoints Guide

## ✨ Tổng quan

Đã thêm **2 endpoints upload file** để test dễ dàng mà **KHÔNG CẦN frontend** và **KHÔNG CẦN encode base64**!

---

## 🎯 Endpoints mới

### 1. **POST /menu/upload/visual-extraction**
Upload ảnh menu → Extract menu items

### 2. **POST /menu/upload/scan**  
Upload ảnh menu → Full pipeline (Visual Extraction + Allergen Safety + Dietary Compliance)

---

## 🚀 Cách test trên Swagger UI

### Bước 1: Mở Swagger UI
```
http://localhost:3000/api
```

### Bước 2: Tìm endpoint upload
- Expand **POST /menu/upload/visual-extraction** hoặc
- Expand **POST /menu/upload/scan**

### Bước 3: Click "Try it out"

### Bước 4: Upload file
1. Click nút **"Choose File"** ở field `image`
2. Chọn ảnh menu từ máy tính (JPG, PNG, WebP, HEIC)
3. (Optional) Điền các fields khác:
   - `language`: vi hoặc en
   - `extractionMode`: quick hoặc full
4. Click **"Execute"**

### Bước 5: Xem kết quả
Response sẽ hiện ở phía dưới với menu items đã extract!

---

## 📝 Cách test với Postman

### Visual Extraction:
```
POST http://localhost:3000/menu/upload/visual-extraction
```

**Body → form-data:**
- Key: `image` (type: **File**)  
  Value: Select your menu image
- Key: `language` (type: **Text**)  
  Value: vi
- Key: `extractionMode` (type: **Text**)  
  Value: quick

### Full Scan với Allergens:
```
POST http://localhost:3000/menu/upload/scan
```

**Body → form-data:**
- Key: `image` (type: **File**)  
  Value: Select your menu image
- Key: `userAllergens` (type: **Text**)  
  Value: `[{"type":"shellfish","severity":"severe"}]`
- Key: `dietaryRestrictions` (type: **Text**)  
  Value: `["vegan","gluten-free"]`
- Key: `strictAllergenMode` (type: **Text**)  
  Value: `true`

---

## 💻 Cách test với curl

### Upload Visual Extraction:
```bash
curl -X POST http://localhost:3000/menu/upload/visual-extraction \
  -F "image=@/path/to/menu.jpg" \
  -F "language=vi" \
  -F "extractionMode=quick"
```

### Upload Full Scan:
```bash
curl -X POST http://localhost:3000/menu/upload/scan \
  -F "image=@/path/to/menu.jpg" \
  -F "language=vi" \
  -F 'userAllergens=[{"type":"shellfish","severity":"severe"}]' \
  -F 'dietaryRestrictions=["vegan"]' \
  -F "strictAllergenMode=true"
```

---

## 🎨 Response Examples

### Visual Extraction Response:
```json
{
  "agent": "VisualExtractionAgent",
  "result": {
    "restaurantName": "Quán Cơm Tấm Sài Gòn",
    "menuSections": [
      {
        "sectionName": "Cơm Tấm",
        "items": [
          {
            "name": "Cơm Tấm Sườn Bì Chả",
            "description": "Cơm tấm truyền thống với sườn nướng, bì, chả",
            "price": 45000
          },
          {
            "name": "Cơm Tấm Sườn Nướng",
            "price": 40000
          }
        ]
      },
      {
        "sectionName": "Món Nước",
        "items": [
          {
            "name": "Phở Bò",
            "price": 50000
          }
        ]
      }
    ],
    "metadata": {
      "totalItems": 15,
      "extractionQuality": "high",
      "confidenceScore": 0.92
    }
  }
}
```

### Full Scan Response:
```json
{
  "extraction": {
    "menuSections": [...],
    "metadata": {...}
  },
  "allergenAnalysis": {
    "analysis": [
      {
        "dishName": "Bún Đậu Mắm Tôm",
        "riskLevel": "SEVERE_RISK",
        "identifiedAllergens": [
          {
            "allergen": "shellfish",
            "source": "Mắm Tôm",
            "severity": "life-threatening"
          }
        ]
      }
    ],
    "summary": {
      "safeItems": 10,
      "unsafeItems": 2
    }
  },
  "dietaryCompliance": {
    "results": [...],
    "summary": {...}
  }
}
```

---

## ⚙️ Technical Details

### File Processing:
1. **Upload**: Multer receives file as buffer
2. **Convert**: Buffer → Base64 string
3. **Process**: Pass to Visual Extraction Agent
4. **Return**: Structured JSON response

### Supported File Types:
- ✅ JPEG (`.jpg`, `.jpeg`)
- ✅ PNG (`.png`)
- ✅ WebP (`.webp`)
- ✅ HEIC (`.heic`)

### File Size Limit:
- Default: **10MB** (set in main.ts)
- Can adjust if needed for larger images

### Validation:
- ✅ File type validation
- ✅ Required field validation
- ✅ JSON parsing for allergens/restrictions
- ✅ Error messages for invalid inputs

---

## 🔧 Error Handling

### Error: "No image file uploaded"
**Cause**: Forgot to select file  
**Fix**: Select an image file before executing

### Error: "Invalid file type"
**Cause**: Uploaded wrong file format (e.g., PDF, TXT)  
**Fix**: Upload JPEG, PNG, WebP, or HEIC image

### Error: "Invalid userAllergens JSON format"
**Cause**: Malformed JSON in userAllergens field  
**Fix**: Use valid JSON: `[{"type":"shellfish","severity":"severe"}]`

### Error: "PayloadTooLarge"
**Cause**: Image > 10MB  
**Fix**: Compress image or increase limit in main.ts

---

## 💡 Best Practices

### 1. Image Quality
- **Resolution**: 1024x768 or higher for best OCR results
- **Format**: JPEG works best for photos
- **Lighting**: Good lighting, no glare

### 2. Testing Strategy
- Start with **upload/visual-extraction** to test extraction
- Once extraction works, use **upload/scan** for full analysis
- Test with different menu styles (handwritten, printed, etc.)

### 3. Performance
- `quick` mode: 3-5 seconds
- `full` mode: 5-8 seconds
- Full scan: 8-12 seconds (parallel agents)

---

## 📊 Comparison: Upload vs Base64

| Feature | File Upload | Base64 JSON |
|---------|-------------|-------------|
| **Ease of use** | ⭐⭐⭐⭐⭐ Easy | ⭐⭐ Manual encoding |
| **Swagger UI** | ✅ Native support | ❌ Paste large string |
| **Postman** | ✅ File picker | ❌ Encode manually |
| **File size** | Original size | +33% overhead |
| **Speed** | Same | Same |

**Recommendation**: Use **File Upload** for testing, Base64 for production APIs.

---

## 🎯 Use Cases

### 1. Quick Testing (Swagger UI)
- Upload menu photo
- Click Execute
- Get instant results

### 2. API Testing (Postman)
- Import collection
- Use file picker
- Run automated tests

### 3. Development
- Test different menu styles
- Verify extraction accuracy
- Debug allergen detection

### 4. Demo/Presentation
- Show live extraction
- Upload real restaurant menus
- Demonstrate AI capabilities

---

## 🚨 Important Notes

1. **Files are NOT saved**: Images processed in memory only
2. **Base64 in response**: Visual extraction still works with base64
3. **Multer config**: Using memory storage (not disk)
4. **Thread-safe**: Multiple uploads processed independently

---

## ✅ Quick Start Checklist

- [ ] Server running: `bun run start:dev`
- [ ] Swagger UI open: `http://localhost:3000/api`
- [ ] Menu image ready (JPG/PNG)
- [ ] Click endpoint → Try it out
- [ ] Upload image
- [ ] Click Execute
- [ ] ✨ See magic happen!

---

## 📚 Related Files

- **Controller**: [`menu.controller.ts`](file:///Users/admin/API-TasteBuddyAI/src/modules/menu/menu.controller.ts)
- **Swagger Docs**: [`SWAGGER_SETUP.md`](file:///Users/admin/API-TasteBuddyAI/docs/SWAGGER_SETUP.md)
- **API Guide**: [`API_TEST_GUIDE.md`](file:///Users/admin/API-TasteBuddyAI/docs/API_TEST_GUIDE.md)

Happy Testing! 🎉
