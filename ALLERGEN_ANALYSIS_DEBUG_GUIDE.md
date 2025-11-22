# 🔍 Allergen Analysis Debugging Guide

## 📊 Tổng quan Job Stages

Hệ thống có **7 stages** chính trong JobQueue:

1. **VALIDATION** - Xác thực ảnh món ăn
2. **EXTRACTION** - Trích xuất menu  
3. **DISH_UNDERSTANDING** - Hiểu món ăn (ingredients, allergen signals)
4. **ALLERGEN_ANALYSIS** ⚠️ - Phân tích chất gây dị ứng
5. **DIETARY_ANALYSIS** - Phân tích chế độ ăn
6. **NUTRITION_ANALYSIS** - Phân tích dinh dưỡng
7. **PRICE_ANALYSIS** - Phân tích giá

## 🔍 Log Points đã được thêm vào

### 1️⃣ AllergenSafetyAgent (`allergen-safety.agent.ts`)

#### **LOG 1: Input Data** (Line 258-275)
```
═══════════════════════════════════════════
📥 ALLERGEN SAFETY AGENT - INPUT
═══════════════════════════════════════════
User Allergens: [{"type":"shellfish","severity":"severe"}]
Menu Items: 0
Enriched Items: 4
Strict Mode: true
Language: en
```
**Mục đích**: Kiểm tra input data có đúng không
- `User Allergens`: Danh sách allergen của user
- `Enriched Items`: Số món ăn sau khi đi qua Dish Understanding Agent
- Chi tiết từng món: ingredients, allergen signals, cuisine

#### **LOG 2: Prompt gửi đến Gemini** (Line 280-285)
```
═══════════════════════════════════════════
📤 PROMPT SENT TO GEMINI
═══════════════════════════════════════════
[Full prompt text here...]
═══════════════════════════════════════════
```
**Mục đích**: Xem prompt có đầy đủ thông tin không
- Kiểm tra allergen profile
- Kiểm tra menu items và enriched data
- Xác nhận analysis mode (strict/flexible)

#### **LOG 3: Raw Response từ Gemini** (Line 310-315)
```
═══════════════════════════════════════════
📩 RAW RESPONSE FROM GEMINI
═══════════════════════════════════════════
{"analysis":[...],"summary":{...}}
═══════════════════════════════════════════
```
**Mục đích**: Xem JSON response từ AI model
- Kiểm tra format có đúng không
- Tìm lỗi parse JSON nếu có

#### **LOG 4: Parsed Output** (Line 320-350)
```
═══════════════════════════════════════════
✅ PARSED OUTPUT
═══════════════════════════════════════════
Total Dishes Analyzed: 4

1. Bún Riêu
   Risk Level: HIGH_RISK
   Confidence: 0.95
   Reasoning: Bún Riêu contains crab and shrimp paste...
   Identified Allergens:
     - shellfish: Riêu (crab/shrimp paste) (definite, severe)
═══════════════════════════════════════════
⏱️  Analysis Duration: 3245ms
📊 Summary: 1 safe, 1 warning, 2 unsafe
═══════════════════════════════════════════
```
**Mục đích**: Xem kết quả phân tích chi tiết
- Risk level từng món
- Allergen được identify
- Summary statistics

#### **LOG 5: Error Details** (Line 354-360)
```
═══════════════════════════════════════════
❌ ALLERGEN ANALYSIS ERROR
═══════════════════════════════════════════
Error Message: Failed to analyze allergens...
Error Stack: [stack trace]
═══════════════════════════════════════════
```
**Mục đích**: Debug lỗi khi agent fail

---

### 2️⃣ MenuService (`menu.service.ts`)

#### **LOG: Allergen Analysis Flow** (Line 801-876)

**Trước khi gọi Agent:**
```
═══════════════════════════════════════════
[Pipeline Stage 4/5] Running Allergen Safety Agent for 2 allergens...
User allergens: [{"name":"shellfish","severity":"severe"}]
Number of dishes to analyze: 4
Dishes to analyze: Phở Bò, Bún Riêu, Cơm Gà, Gỏi Cuốn

Enriched items details:
  1. Phở Bò (Beef Pho)
     - Ingredients: beef, rice noodles, broth, herbs
     - Allergen Signals: fish sauce
     - Cuisine: Northern Vietnamese
═══════════════════════════════════════════

Agent Input Summary:
  - enrichedItems: 4 dishes
  - userAllergens: [{"type":"shellfish","severity":"severe"}]
  - strictMode: true
  - language: en
```

**Sau khi Agent hoàn thành:**
```
═══════════════════════════════════════════
✅ Allergen Safety Agent completed in 3245ms
📊 Summary: 1 safe, 1 warning, 2 unsafe
Overall Risk: high

Detailed Results:

1. Phở Bò
   ⚠️  Risk: LOW_RISK
   🎯 Confidence: 0.85
   ✅ No allergens identified

2. Bún Riêu
   ⚠️  Risk: HIGH_RISK
   🎯 Confidence: 0.95
   🚨 Allergens Found:
      - shellfish: Riêu (crab/shrimp paste) (definite, severe)
      - shellfish: Mắm Tôm in broth (probable, severe)
═══════════════════════════════════════════
```

**Nếu có lỗi:**
```
═══════════════════════════════════════════
❌ Allergen Safety Agent FAILED
Error Type: Error
Error Message: Failed to analyze allergens: timeout
Error Stack: [stack trace]
═══════════════════════════════════════════
```

---

## 🐛 Cách Debug Lỗi

### **Bước 1: Kiểm tra Input**
Tìm log `📥 ALLERGEN SAFETY AGENT - INPUT`
- ✅ `User Allergens` có đúng không?
- ✅ `Enriched Items` > 0?
- ✅ Từng món có `ingredients` và `allergenSignals`?

**Vấn đề thường gặp:**
- `enrichedItems` = 0 → Dish Understanding Agent failed
- `ingredients` = none → AI không trích xuất được
- `allergenSignals` = none → Không phát hiện signal

### **Bước 2: Kiểm tra Prompt**
Tìm log `📤 PROMPT SENT TO GEMINI`
- ✅ Prompt có chứa allergen list?
- ✅ Menu items có đầy đủ thông tin?
- ✅ Có enriched data (ingredients, signals)?

**Vấn đề thường gặp:**
- Prompt thiếu allergen profile
- Thiếu enriched data → phân tích kém chính xác

### **Bước 3: Kiểm tra Raw Response**
Tìm log `📩 RAW RESPONSE FROM GEMINI`
- ✅ JSON có valid không?
- ✅ Có đủ `analysis` và `summary`?

**Vấn đề thường gặp:**
- JSON parse error → AI trả về format sai
- Empty response → Timeout hoặc model fail

### **Bước 4: Kiểm tra Parsed Output**
Tìm log `✅ PARSED OUTPUT`
- ✅ `Total Dishes Analyzed` = số món input?
- ✅ Risk levels hợp lý?
- ✅ Allergens được identify đúng?

**Vấn đề thường gặp:**
- Risk level = UNKNOWN_RISK → AI không hiểu món
- Confidence < 0.5 → Món lạ, cần verify
- Allergens sai → Prompt hoặc enriched data sai

### **Bước 5: Kiểm tra Error (nếu có)**
Tìm log `❌ ALLERGEN ANALYSIS ERROR`
- ✅ Error type?
- ✅ Error message?
- ✅ Stack trace?

**Các lỗi thường gặp:**
```
1. TIMEOUT Error
   → Tăng timeout trong allergen-safety.agent.ts (line 36)
   → Giảm số món analyze cùng lúc

2. JSON PARSE Error
   → Check raw response
   → Schema không match

3. VALIDATION Error
   → Input không hợp lệ
   → userAllergens = empty
   → menuItems = empty

4. API Error
   → Gemini API quota
   → Network issues
```

---

## 📝 Log Levels

- **`logger.log()`** - INFO level (luôn hiển thị)
- **`logger.debug()`** - DEBUG level (chỉ hiển thị khi enable debug mode)
- **`logger.error()`** - ERROR level (luôn hiển thị)
- **`logger.warn()`** - WARNING level (luôn hiển thị)

### Enable Debug Mode
Trong file `.env`:
```
LOG_LEVEL=debug
```

Hoặc runtime:
```typescript
process.env.LOG_LEVEL = 'debug';
```

---

## 🔧 Công cụ Debug

### 1. Tìm log theo pattern
```bash
# Tìm allergen analysis logs
grep "ALLERGEN SAFETY AGENT" logs/app.log

# Tìm errors
grep "❌" logs/app.log

# Tìm một món cụ thể
grep "Bún Riêu" logs/app.log
```

### 2. Theo dõi real-time
```bash
tail -f logs/app.log | grep "ALLERGEN"
```

### 3. Filter theo level
```bash
# Chỉ xem errors
grep "ERROR" logs/app.log

# Chỉ xem debug
grep "DEBUG" logs/app.log
```

---

## ✅ Checklist Debug

- [ ] Input có đúng? (user allergens, enriched items)
- [ ] Prompt có đầy đủ? (allergen profile, menu items)
- [ ] Raw response có valid JSON?
- [ ] Parsed output có đủ dishes?
- [ ] Risk levels hợp lý?
- [ ] Allergens identify đúng?
- [ ] Có error không? Error type?
- [ ] Duration bao lâu? (normal: 2-5s/dish)

---

## 🚀 Test Flow

```bash
# 1. Call API với allergen profile
POST /menu/test-cloud-vision-pipeline
{
  "imageData": "base64...",
  "mimeType": "image/jpeg",
  "allergens": [
    {"name": "shellfish", "severity": "severe"}
  ]
}

# 2. Check logs
tail -f logs/app.log

# 3. Tìm từng log point
- 📥 INPUT
- 📤 PROMPT
- 📩 RESPONSE
- ✅ OUTPUT
- ❌ ERROR (if any)
```

---

## 📞 Liên hệ

Nếu vẫn gặp lỗi, cung cấp:
1. Full log từ `📥 INPUT` đến `❌ ERROR`
2. Request body
3. Expected vs Actual result
