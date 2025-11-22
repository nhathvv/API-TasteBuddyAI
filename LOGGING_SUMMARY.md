# 📊 Logging Summary - Complete System

**Generated:** Nov 23, 2025 at 2:26am UTC+07:00

## 🎯 Tổng quan

Hệ thống đã được bổ sung **logging chi tiết** ở tất cả các điểm quan trọng để dễ dàng debug và monitor.

---

## 📝 Logging Levels

| Level | Usage | Output |
|-------|-------|--------|
| `logger.log()` | INFO | Luôn hiển thị |
| `logger.debug()` | DEBUG | Chỉ khi `LOG_LEVEL=debug` |
| `logger.warn()` | WARNING | Luôn hiển thị |
| `logger.error()` | ERROR | Luôn hiển thị |

### Enable Debug Mode
```env
# In .env file
LOG_LEVEL=debug
```

---

## 🔍 Logging Architecture

```
REQUEST → MenuService → Agents → RESPONSE
   ↓          ↓           ↓         ↓
 [LOG]     [LOG]       [LOG]     [LOG]
```

---

## 📦 1. VisualExtractionAgent

**File:** `/src/ai-agents/visual-extraction/visual-extraction.agent.ts`

### 5 Log Points:

#### **LOG 1: Input** (Line 109-120)
```typescript
📥 VISUAL EXTRACTION AGENT - INPUT
Language: vi
Extraction Mode: quick
MIME Type: image/jpeg
Image Data Length: 123456 chars
Clean Base64 Length: 120000 chars
```

#### **LOG 2: Prompt** (Line 130-135)
```typescript
📤 PROMPT SENT TO GEMINI
Extract menu data from this Vietnamese restaurant menu image...
Mode: quick
```

#### **LOG 3: Raw Response** (Line 167-172)
```typescript
📩 RAW RESPONSE FROM GEMINI
{"menuSections":[...],"metadata":{...}}
```

#### **LOG 4: Parsed Output** (Line 180-198)
```typescript
✅ PARSED OUTPUT
Total Items Extracted: 4
Extraction Quality: medium
Confidence Score: 0.75
Processing Time: 5000ms

Menu Sections:
  1. Món Chính (4 items)
     1. Phở Bò - 50000₫
     2. Bún Riêu - 45000₫
```

#### **LOG 5: Error** (Line 206-213)
```typescript
❌ VISUAL EXTRACTION ERROR
Error Type: Error
Error Message: Timeout
Error Stack: [stack trace]
```

---

## 🚨 2. AllergenSafetyAgent

**File:** `/src/ai-agents/allergen-safety/allergen-safety.agent.ts`

### 5 Log Points:

#### **LOG 1: Input** (Line 258-275)
```typescript
📥 ALLERGEN SAFETY AGENT - INPUT
User Allergens: [{"type":"shellfish","severity":"severe"}]
Menu Items: 0
Enriched Items: 4
Strict Mode: true
Language: en

Enriched Dishes:
  1. Phở Bò (Beef Pho)
     - Ingredients: beef, rice noodles, broth
     - Allergen Signals: fish sauce
```

#### **LOG 2: Prompt** (Line 280-285)
```typescript
📤 PROMPT SENT TO GEMINI
ALLERGEN SAFETY ANALYSIS REQUEST
User Allergen Profile: shellfish (severe)
Menu Items to Analyze: [4 dishes]
```

#### **LOG 3: Raw Response** (Line 310-315)
```typescript
📩 RAW RESPONSE FROM GEMINI
{"analysis":[...],"summary":{...}}
```

#### **LOG 4: Parsed Output** (Line 320-350)
```typescript
✅ PARSED OUTPUT
Total Dishes Analyzed: 4

1. Phở Bò
   Risk Level: LOW_RISK
   Confidence: 0.85
   Reasoning: [detailed reasoning]
   ✅ No allergens identified

2. Bún Riêu
   Risk Level: HIGH_RISK
   Confidence: 0.95
   🚨 Allergens Found:
      - shellfish: Riêu paste (definite, severe)

⏱️  Analysis Duration: 3245ms
📊 Summary: 1 safe, 1 warning, 2 unsafe
```

#### **LOG 5: Error** (Line 354-360)
```typescript
❌ ALLERGEN ANALYSIS ERROR
Error Message: Failed to analyze
Error Stack: [stack trace]
```

---

## 🍽️ 3. MenuService - Allergen Analysis Flow

**File:** `/src/modules/menu/menu.service.ts`

### Pipeline Stage 4/5 Logs (Line 801-876):

#### **Before Agent Call:**
```typescript
═══════════════════════════════════════════
[Pipeline Stage 4/5] Running Allergen Safety Agent for 2 allergens...
User allergens: [{"name":"shellfish","severity":"severe"}]
Number of dishes to analyze: 4
Dishes to analyze: Phở Bò, Bún Riêu, Cơm Gà, Gỏi Cuốn

Enriched items details:
  1. Phở Bò (Beef Pho)
     - Ingredients: beef, rice noodles, broth
     - Allergen Signals: fish sauce
     - Cuisine: Northern Vietnamese

Agent Input Summary:
  - enrichedItems: 4 dishes
  - userAllergens: [{"type":"shellfish","severity":"severe"}]
  - strictMode: true
  - language: en
═══════════════════════════════════════════
```

#### **After Success:**
```typescript
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
      - shellfish: Riêu paste (definite, severe)
═══════════════════════════════════════════
```

#### **On Error:**
```typescript
═══════════════════════════════════════════
❌ Allergen Safety Agent FAILED
Error Type: Error
Error Message: Timeout
Error Stack: [stack trace]
═══════════════════════════════════════════
```

---

## 📦 4. MenuService - Final Response Logs

### A. Cloud Vision Pipeline (testCloudVisionPipeline) - Line 938-965

```typescript
═══════════════════════════════════════════
📦 FINAL JOB RESPONSE
═══════════════════════════════════════════
⏱️  Total Pipeline Time: 12450ms
📊 Stages Completed: 4/5
🍽️  Dishes Analyzed: 4
🚨 Allergen Analysis: 1 safe, 2 unsafe
💪 Nutrition Analysis: Completed
📄 Response Size: 45632 chars
═══════════════════════════════════════════

[DEBUG] Full Response Structure:
{
  "cloudVision": {...},
  "dishUnderstanding": {...},
  "allergenAnalysis": {...},
  "nutritionAnalysis": {...},
  "pipeline": {...}
}
```

### B. Scan Menu (scanMenu) - Line 470-503

```typescript
═══════════════════════════════════════════
📦 FINAL SCAN RESPONSE
═══════════════════════════════════════════
✅ Success: true
🌐 Language: vi
🍽️  Dishes Found: 4
📊 Extraction Quality: medium
🚨 Allergen Analysis: 1 safe, 2 unsafe
🥗 Dietary Compliance: Checked
⏱️  Total Time: 15000ms
💰 Currency: VND
📄 Response Size: 38456 chars
═══════════════════════════════════════════

[DEBUG] Full Scan Response:
{
  "success": true,
  "message": "Scan completed",
  "language": "vi",
  "data": {...},
  "meta": {...}
}
```

---

## 🎨 Log Format Standards

### Separators
```typescript
'═══════════════════════════════════════════'  // Main sections
'───────────────────────────────────────────'  // Sub-sections
```

### Icons
```typescript
📥  Input
📤  Output to API
📩  Response from API
✅  Success / Completed
❌  Error / Failed
⚠️   Warning / Risk
🔍  Debug / Detail
📊  Summary / Statistics
⏱️   Time / Duration
🍽️   Dishes / Food
🚨  Allergen
🥗  Dietary
💪  Nutrition
💰  Price / Currency
🌐  Language / Locale
📦  Package / Response
🎯  Confidence / Target
```

---

## 🔍 How to Use Logs for Debugging

### 1. **Tìm lỗi ở Visual Extraction**
```bash
# Tìm tất cả logs của Visual Extraction
grep "VISUAL EXTRACTION" logs/app.log

# Check input
grep "📥 VISUAL EXTRACTION" logs/app.log

# Check errors
grep "❌ VISUAL EXTRACTION ERROR" logs/app.log
```

### 2. **Tìm lỗi ở Allergen Analysis**
```bash
# Tìm tất cả logs của Allergen
grep "ALLERGEN" logs/app.log

# Check input
grep "📥 ALLERGEN SAFETY AGENT" logs/app.log

# Check parsed output
grep "✅ PARSED OUTPUT" logs/app.log | grep -A 20 "ALLERGEN"
```

### 3. **Check Final Response**
```bash
# Tìm final responses
grep "📦 FINAL" logs/app.log

# Check success rate
grep "✅ Success" logs/app.log | wc -l

# Check response sizes
grep "📄 Response Size" logs/app.log
```

### 4. **Monitor Real-time**
```bash
# All structured logs
tail -f logs/app.log | grep "═══"

# Only errors
tail -f logs/app.log | grep "❌"

# Only final responses
tail -f logs/app.log | grep "📦 FINAL"
```

### 5. **Performance Analysis**
```bash
# Extract all durations
grep "⏱️" logs/app.log

# Agent durations
grep "Analysis Duration:" logs/app.log

# Total pipeline time
grep "Total Pipeline Time:" logs/app.log
```

---

## 📈 Log Analysis Examples

### Example 1: Successful Flow
```
[LOG] 📥 VISUAL EXTRACTION AGENT - INPUT
[LOG] Total Items Extracted: 4
[LOG] 📥 ALLERGEN SAFETY AGENT - INPUT
[LOG] Total Dishes Analyzed: 4
[LOG] 📦 FINAL JOB RESPONSE
[LOG] ✅ Success: true
```

### Example 2: Visual Extraction Failed
```
[LOG] 📥 VISUAL EXTRACTION AGENT - INPUT
[LOG] Total Items Extracted: 0
[WARN] Low extraction quality detected
[LOG] 📦 FINAL SCAN RESPONSE
[LOG] 🍽️  Dishes Found: 0
```

### Example 3: Allergen Analysis Error
```
[LOG] 📥 ALLERGEN SAFETY AGENT - INPUT
[LOG] Enriched Items: 4
[ERROR] ❌ ALLERGEN ANALYSIS ERROR
[ERROR] Error Message: Timeout after 60000ms
[LOG] 🚨 Allergen Analysis: Skipped (error)
```

---

## 🎯 Log Points Summary

| Component | Log Points | Location |
|-----------|-----------|----------|
| **VisualExtractionAgent** | 5 | visual-extraction.agent.ts |
| **AllergenSafetyAgent** | 5 | allergen-safety.agent.ts |
| **MenuService (Allergen Flow)** | 3 | menu.service.ts:801-876 |
| **MenuService (Final Response)** | 2 | menu.service.ts:938-965, 470-503 |
| **Total** | **15 log points** | - |

---

## 🚀 Benefits

### ✅ **Before Logging:**
```
[Nest] MenuService - Processing menu scan
[Nest] AllergenSafetyAgent - Processing
[Nest] MenuService - Scan completed
```
**Problem:** Không biết gì đang xảy ra!

### ✅ **After Logging:**
```
═══════════════════════════════════════════
📥 VISUAL EXTRACTION AGENT - INPUT
Language: vi, Mode: quick
Image Data Length: 123456 chars
═══════════════════════════════════════════
📩 RAW RESPONSE FROM GEMINI
{"menuSections":[...],"totalItems":4}
═══════════════════════════════════════════
✅ PARSED OUTPUT
Total Items Extracted: 4
Extraction Quality: medium
...
```
**Result:** Biết rõ từng bước! 🎯

---

## 📚 Related Documentation

- **`ALLERGEN_ANALYSIS_DEBUG_GUIDE.md`** - Allergen debug guide
- **`AGENTS_AUDIT.md`** - Agent configurations
- **`RECOMMENDATIONS.md`** - System improvements

---

## ✅ Summary

| Metric | Value |
|--------|-------|
| Total Log Points | 15 |
| Agents with Logging | 2 (Visual, Allergen) |
| Service Methods Logged | 3 (scanMenu, testCloudVisionPipeline, formatScanResponse) |
| Log Levels | 4 (log, debug, warn, error) |
| Icons Used | 15+ emoji icons |

**Status:** ✅ Complete logging coverage for debugging & monitoring
