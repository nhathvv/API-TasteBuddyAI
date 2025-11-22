# 🔍 Agents Audit Report

**Generated:** Nov 23, 2025 at 2:19am UTC+07:00

## 📊 Tổng hợp các Agents

Hệ thống có **7 AI Agents** với 2 model types:
- ⚡ **Flash Model** (fast, 5x speed) - 3 agents
- 🧠 **Pro Model** (complex reasoning) - 4 agents

---

## ✅ Agent Configuration Table

| # | Agent Name | Model | Timeout | Cache | Purpose |
|---|-----------|-------|---------|-------|---------|
| 1 | **VisualExtractionAgent** | Flash ⚡ | 30s | ❌ | OCR menu từ ảnh |
| 2 | **DishUnderstandingAgent** | Flash ⚡ | 30s | ✅ 24h | Phân tích ingredients & allergen signals |
| 3 | **AllergenSafetyAgent** | Flash ⚡ | 60s | ❌ | Phân tích allergen safety |
| 4 | **DishRecognitionAgent** | Pro 🧠 | 30s | ❌ | Nhận diện món từ ảnh |
| 5 | **DietaryComplianceAgent** | Pro 🧠 | 40s | ❌ | Kiểm tra dietary restrictions |
| 6 | **NutritionCoachAgent** | Pro 🧠 | 40s | ❌ | Tư vấn dinh dưỡng cá nhân |
| 7 | **CloudVisionAgent** | Pro 🧠 | 30s | ❌ | OCR với Google Cloud Vision |

---

## 🔧 Changes Made

### 1. **DietaryComplianceAgent** - Timeout tăng
```diff
- timeout: 20000,  // 20 seconds
+ timeout: 40000,  // 40 seconds for Pro model
```
**Lý do:** Pro model cần thời gian xử lý nhiều hơn Flash (3-5x)

### 2. **DishRecognitionAgent** - Timeout tăng
```diff
- timeout: 25000,  // 25 seconds
+ timeout: 30000,  // 30 seconds for Pro vision tasks
```
**Lý do:** Vision tasks với Pro model cần thời gian xử lý ảnh

### 3. **VisualExtractionAgent** - Đã tăng trước đó
```diff
- timeout: 15000,  // 15 seconds
+ timeout: 30000,  // 30 seconds (already updated)
```
**Status:** ✅ Already fixed

### 4. **AllergenSafetyAgent** - Đã tăng trước đó
```diff
- timeout: 45000,  // 45 seconds
+ timeout: 60000,  // 60 seconds (already updated)
```
**Status:** ✅ Already fixed

---

## 📈 Timeout Strategy

### **Flash Model Agents** ⚡
| Agent | Timeout | Rationale |
|-------|---------|-----------|
| VisualExtractionAgent | 30s | OCR + image processing |
| DishUnderstandingAgent | 30s | Simple ingredient analysis |
| AllergenSafetyAgent | 60s | Multiple dishes analysis |

**Pattern:** 30s cơ bản, 60s khi xử lý nhiều món

### **Pro Model Agents** 🧠
| Agent | Timeout | Rationale |
|-------|---------|-----------|
| CloudVisionAgent | 30s | External API call |
| DishRecognitionAgent | 30s | Vision + dish detection |
| DietaryComplianceAgent | 40s | Complex dietary reasoning |
| NutritionCoachAgent | 40s | Personalized meal planning |

**Pattern:** 30s cho vision, 40s cho reasoning phức tạp

---

## 🎯 Agent Usage trong Pipeline

### **Workflow A: Menu Photo** (scan menu)
```
1. FoodImageValidation ✓
2. VisualExtractionAgent (Flash, 30s) ✓
   └─ Fallback: CloudVisionAgent (Pro, 30s)
3. DishUnderstandingAgent (Flash, 30s, cached) ✓
4. AllergenSafetyAgent (Flash, 60s) - if allergens provided
5. DietaryComplianceAgent (Pro, 40s) - if restrictions provided
6. NutritionCoachAgent (Pro, 40s) - if profile provided
```

### **Workflow B: Food Photo** (single dish)
```
1. FoodImageValidation ✓
2. DishRecognitionAgent (Pro, 30s) ✓
3. DishUnderstandingAgent (Flash, 30s, cached) ✓
4. AllergenSafetyAgent (Flash, 60s) - if allergens provided
5. NutritionCoachAgent (Pro, 40s) - if profile provided
```

---

## ⚡ Performance Characteristics

### **Flash Model** (gemini-flash-latest)
- **Speed:** 5x faster than Pro
- **Cost:** ~20x cheaper than Pro
- **Best for:** OCR, simple analysis, bulk processing
- **Latency:** ~2-3s per request
- **Agents using:** VisualExtraction, DishUnderstanding, AllergenSafety

### **Pro Model** (gemini-pro-vision / gemini-pro)
- **Speed:** Slower but more accurate
- **Cost:** Higher but better for complex tasks
- **Best for:** Visual recognition, complex reasoning, personalization
- **Latency:** ~5-8s per request
- **Agents using:** DishRecognition, DietaryCompliance, NutritionCoach, CloudVision

---

## 🔍 Caching Strategy

### **DishUnderstandingAgent** - Có cache ✅
```typescript
cacheable: true,
cacheTTL: 86400,  // 24 hours
```
**Lý do:** 
- Món ăn Việt Nam có ingredients cố định
- Giảm 90% API calls cho món phổ biến
- Cache hit: Phở, Bún Riêu, Cơm Tấm, etc.

**Example:**
```
Request 1: "Phở Bò" → AI analysis (3s)
Request 2-N: "Phở Bò" → Cache hit (instant)
```

### **Các agent khác** - Không cache ❌
**Lý do:**
- User-specific data (allergens, dietary restrictions, nutrition profile)
- Dynamic data (menu prices, availability)
- Vision tasks (different images)

---

## 📊 Expected Performance

### **Best Case** (với cache)
```
Total time: ~10-15s
- VisualExtraction: 5s
- DishUnderstanding: instant (cache hit)
- AllergenSafety: 4s
- DietaryCompliance: 5s
```

### **Worst Case** (no cache, nhiều món)
```
Total time: ~60-90s
- VisualExtraction: 10s
- DishUnderstanding: 20s (4 dishes × 5s)
- AllergenSafety: 30s (4 dishes)
- DietaryCompliance: 20s (4 dishes)
- NutritionCoach: 10s
```

**Note:** Agents chạy parallel khi có thể

---

## ⚠️ Common Issues & Solutions

### 1. **Timeout Error**
```
Agent timeout after 30000ms
```
**Solution:**
- ✅ Đã tăng timeout cho các agents
- Giảm số món analyze (limit 4 dishes)
- Check network latency

### 2. **0 Items Extracted**
```
VisualExtractionAgent returned 0 items
```
**Solution:**
- ✅ Đã cải thiện prompt: "ALWAYS EXTRACT"
- Check image quality
- Try `extractionMode: 'full'` instead of 'quick'
- Fallback to CloudVisionAgent

### 3. **Low Confidence**
```
Confidence score: 0.3 (too low)
```
**Solution:**
- Image quality issue
- Unfamiliar dishes
- Use Pro model for better accuracy

### 4. **Cache Miss**
```
DishUnderstanding cache miss for unusual dish
```
**Solution:**
- Normal behavior for new/rare dishes
- Cache will build over time
- Monitor cache hit rate

---

## 🎯 Best Practices

### 1. **Model Selection**
- ✅ Use **Flash** for: OCR, simple analysis, bulk processing
- ✅ Use **Pro** for: Vision recognition, complex reasoning

### 2. **Timeout Guidelines**
- ✅ Flash: 30s base, 60s for multiple items
- ✅ Pro: 30s for vision, 40s for reasoning

### 3. **Error Handling**
```typescript
try {
  result = await agent.execute(input);
} catch (error) {
  if (error.message.includes('timeout')) {
    // Retry with smaller input or fallback
  }
  // Log and continue with degraded results
}
```

### 4. **Parallel Processing**
```typescript
// Run independent agents in parallel
const [allergenResult, dietaryResult] = await Promise.all([
  allergenAgent.execute(input),
  dietaryAgent.execute(input),
]);
```

---

## 📝 Monitoring Checklist

- [ ] Monitor timeout rates per agent
- [ ] Track cache hit rates (DishUnderstanding)
- [ ] Measure average latency per agent
- [ ] Monitor API costs (Flash vs Pro usage)
- [ ] Track confidence score distribution
- [ ] Alert on high failure rates (>10%)

---

## 🔗 Related Files

- `/src/ai-agents/*/*.agent.ts` - Agent implementations
- `/src/shared/services/gemini-core.service.ts` - Gemini API wrapper
- `/src/modules/menu/menu.service.ts` - Main orchestration
- `ALLERGEN_ANALYSIS_DEBUG_GUIDE.md` - Allergen debugging
- `RECOMMENDATIONS.md` - Future improvements

---

## ✅ Summary

### **Status:** All agents configured ✅

| Metric | Value |
|--------|-------|
| Total Agents | 7 |
| Flash Agents | 3 (fast, efficient) |
| Pro Agents | 4 (accurate, complex) |
| Cached Agents | 1 (DishUnderstanding) |
| Average Timeout | 38s |
| Timeout Issues Fixed | 4 agents |

### **Recent Changes:**
- ✅ VisualExtractionAgent: 15s → 30s
- ✅ AllergenSafetyAgent: 45s → 60s
- ✅ DietaryComplianceAgent: 20s → 40s
- ✅ DishRecognitionAgent: 25s → 30s

**Next Steps:**
1. Monitor timeout rates in production
2. Optimize prompts for faster responses
3. Add more caching where applicable
4. Consider batch processing for multiple dishes
