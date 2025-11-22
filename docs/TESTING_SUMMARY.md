# API Endpoints đã được tạo thành công! ✅

## 📋 Tóm tắt những gì đã làm

Đã tạo **5 API endpoints** để test các AI agents:

### 1. **POST /menu/scan** - Full Workflow
Chạy toàn bộ pipeline: Visual Extraction → Allergen Safety + Dietary Compliance (parallel)

### 2. **POST /menu/test/visual-extraction** - Test Visual Extraction Agent
Trích xuất menu items từ ảnh

### 3. **POST /menu/test/allergen-safety** - Test Allergen Safety Agent  
Phân tích rủi ro dị ứng

### 4. **POST /menu/test/dietary-compliance** - Test Dietary Compliance Agent
Kiểm tra tuân thủ chế độ ăn (vegan, halal, etc.)

### 5. **POST /menu/test/nutrition-coach** - Test Nutrition Coach Agent
Tư vấn dinh dưỡng cá nhân hóa

---

## 📁 Files đã tạo

### Code Files:
1. ✅ `src/modules/menu/menu.controller.ts` - Đã thêm 4 endpoints mới
2. ✅ `src/modules/menu/menu.service.ts` - Đã thêm 4 methods mới
3. ✅ `src/modules/menu/dto/test-agents.dto.ts` - DTOs cho test endpoints

### Documentation:
4. ✅ `docs/API_TEST_GUIDE.md` - Hướng dẫn chi tiết + examples
5. ✅ `docs/postman_collection.json` - Postman collection import được luôn
6. ✅ `scripts/test-agents.sh` - Bash script test nhanh

---

## 🚀 Cách sử dụng

### Option 1: Dùng curl (nhanh nhất)
```bash
# Run test script
./scripts/test-agents.sh
```

### Option 2: Dùng Postman
1. Import `docs/postman_collection.json`
2. Set biến `BASE_URL` = `http://localhost:3000`
3. Click Send để test

### Option 3: Dùng curl trực tiếp

**Test Allergen Safety:**
```bash
curl -X POST http://localhost:3000/menu/test/allergen-safety \
  -H "Content-Type: application/json" \
  -d '{
    "menuItems": [
      {
        "name": "Bún Đậu Mắm Tôm",
        "description": "Bún đậu với mắm tôm",
        "price": 45000
      }
    ],
    "userAllergens": [
      {
        "type": "shellfish",
        "severity": "severe"
      }
    ],
    "strictMode": true,
    "language": "en"
  }'
```

**Test Dietary Compliance:**
```bash
curl -X POST http://localhost:3000/menu/test/dietary-compliance \
  -H "Content-Type: application/json" \
  -d '{
    "menuItems": [
      {
        "name": "Phở Chay",
        "description": "Phở chay với rau củ",
        "price": 45000
      }
    ],
    "dietaryRestrictions": ["vegan"],
    "context": "Looking for vegan options"
  }'
```

**Test Nutrition Coach:**
```bash
curl -X POST http://localhost:3000/menu/test/nutrition-coach \
  -H "Content-Type: application/json" \
  -d '{
    "age": 30,
    "gender": "male",
    "weight": 70,
    "height": 175,
    "activityLevel": "moderate",
    "goal": "weight-loss",
    "healthConditions": ["hypertension"],
    "requestType": "daily-targets"
  }'
```

---

## 🎯 Test Cases đề xuất

### 1. Allergen Safety - High Risk Case
```json
{
  "menuItems": [
    {"name": "Bún Đậu Mắm Tôm", "price": 45000},
    {"name": "Gỏi Cuốn Tôm", "price": 35000},
    {"name": "Phở Bò", "price": 50000}
  ],
  "userAllergens": [
    {"type": "shellfish", "severity": "life-threatening"}
  ]
}
```
**Expected:** Detect shellfish in first 2 dishes, mark Phở as SAFE

### 2. Dietary Compliance - Vegan Challenge
```json
{
  "menuItems": [
    {"name": "Phở Chay", "description": "Vegetarian pho"},
    {"name": "Gỏi Cuốn Chay", "description": "Veggie spring rolls"}
  ],
  "dietaryRestrictions": ["vegan"]
}
```
**Expected:** Flag fish sauce risk in "Phở Chay", recommend verification

### 3. Nutrition Coach - Weight Loss + Health Condition
```json
{
  "age": 35,
  "weight": 85,
  "height": 170,
  "goal": "weight-loss",
  "healthConditions": ["diabetes", "hypertension"]
}
```
**Expected:** Strict sodium/sugar limits, balanced macros, medical disclaimer

---

## 📊 Expected Response Times

| Agent | Time | Complexity |
|-------|------|------------|
| Visual Extraction | 3-5s | High (image processing) |
| Allergen Safety | 2-4s | Medium (reasoning) |
| Dietary Compliance | 3-5s | High (chain-of-thought) |
| Nutrition Coach | 2-3s | Medium (calculations) |
| **Full Scan** | **5-8s** | **Parallel execution** |

---

## ⚠️ Important Notes

1. **API Key Required**: Cần set `GOOGLE_API_KEY` trong `.env`
2. **Image Size Limit**: Visual Extraction giới hạn 4MB
3. **Rate Limiting**: Gemini API có rate limit, test từ từ
4. **Vietnamese Context**: Agents được train đặc biệt cho Vietnamese cuisine

---

## 🔧 Troubleshooting

**Lỗi: "Cannot find module './dto/test-agents.dto'"**
- TypeScript chưa compile xong, chờ vài giây

**Lỗi: "GOOGLE_API_KEY is not defined"**
- Check file `.env` có `GOOGLE_API_KEY=...` chưa

**Response quá lâu:**
- Gemini API có thể chậm khi load cao
- Kiểm tra internet connection

**500 Internal Server Error:**
- Check logs: `bun run start:dev`
- Có thể agent validation failed

---

## 📚 Đọc thêm

- **Full API Documentation**: `docs/API_TEST_GUIDE.md`
- **Architecture**: `docs/config.angle.MD`
- **Postman Collection**: `docs/postman_collection.json`

---

## ✨ Next Steps

1. **Test các endpoints** với real data
2. **Monitor logs** để debug
3. **Adjust prompts** nếu cần improve quality
4. **Add more test cases** based on findings

Happy Testing! 🎉
