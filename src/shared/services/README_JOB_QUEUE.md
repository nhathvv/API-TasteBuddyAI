# 📊 Job Queue Service - Complete Guide

Hướng dẫn sử dụng JobQueueService với validation và error handling

---

## 🎯 Quick Start

### **Basic Usage:**

```typescript
import { JobQueueService, JobStage } from './job-queue.service';

// 1. Create job
const jobId = jobQueue.createJob();

// 2. Process stages
jobQueue.updateStage(jobId, JobStage.EXTRACTION, null, 'processing');
const result = await extractMenu(image);
jobQueue.updateStage(jobId, JobStage.EXTRACTION, result, 'completed');

// 3. Complete job
jobQueue.completeJob(jobId, finalResult);
```

---

## 🔧 Error Handling (IMPORTANT)

### **✅ Check for Zero Extraction**

```typescript
const extractionResult = await extractMenu(imageData);

// ⚠️ ALWAYS check for zero items
if (!extractionResult || extractionResult.items.length === 0) {
  logger.error('❌ ZERO ITEMS EXTRACTED');
  logger.error('Possible causes: blurry image, not a menu, OCR failed');

  jobQueue.failStage(jobId, JobStage.EXTRACTION, 'ERR_ZERO_EXTRACTION');
  jobQueue.failJob(jobId, 'ERR_ZERO_EXTRACTION: No items extracted');

  throw new Error('ERR_ZERO_EXTRACTION');
}

jobQueue.updateStage(jobId, JobStage.EXTRACTION, {
  totalItems: extractionResult.items.length
}, 'completed');
```

### **✅ Check for Zero Enriched Dishes**

```typescript
const enrichedDishes = await enrichDishes(menuItems);

// ⚠️ ALWAYS check if enrichment returned results
if (enrichedDishes.length === 0) {
  logger.warn('⚠️  ZERO ENRICHED DISHES');
  logger.warn(`Input: ${menuItems.length}, Output: 0`);
  logger.warn('WARNING: Downstream analysis will be less accurate');
}

// ✅ Fix NaN in averageConfidence
const avgConfidence = enrichedDishes.length > 0
  ? enrichedDishes.reduce((sum, d) => sum + d.confidence, 0) / enrichedDishes.length
  : 0; // Prevent NaN

jobQueue.updateStage(jobId, JobStage.DISH_UNDERSTANDING, {
  totalDishes: enrichedDishes.length,
  averageConfidence: avgConfidence, // ✅ Never NaN
}, 'completed');
```

### **✅ Warn When Missing Enriched Data**

```typescript
if (enrichedDishes.length === 0 && menuItems.length > 0) {
  logger.warn('⚠️  Running Allergen Analysis WITHOUT enriched data');
  logger.warn('Analysis will rely on dish names only - less accurate');
}

const allergenResult = await analyzeAllergens({
  menuItems,
  enrichedItems: enrichedDishes, // May be empty
  userAllergens,
});
```

### **✅ Validate Metadata Before Completion**

```typescript
const metadata: JobMetadata = {
  dishes: enrichedDishes.map(d => ({
    name: d.name,
    canonicalName: d.canonicalName,
    ingredients: d.ingredients || 'N/A',
    price: d.price || 0,
  })),
};

// ⚠️ ALWAYS validate before completion
if (metadata.dishes.length === 0) {
  logger.error('❌ JOB METADATA VALIDATION FAILED');
  logger.error('Cannot complete job with empty data');

  jobQueue.failJob(jobId, 'ERR_EMPTY_RESULT: No dishes in metadata');
  throw new Error('ERR_EMPTY_RESULT');
}

// Proceed with completion
const validation = jobQueue.validateAndCompleteJob(
  jobId,
  result,
  metadata,
  false,
);
```

---

## 📝 Logging Best Practices

### **❌ DON'T USE console.log**

```typescript
// ❌ Bad
console.log('Dish understanding result:', result);
console.log('Allergen analysis:', analysis);
```

### **✅ USE Logger**

```typescript
// ✅ Good
import { Logger } from '@nestjs/common';

const logger = new Logger('MenuService');

logger.log(`✅ Extracted ${items.length} items`);
logger.debug('Dish understanding result:');
logger.debug(JSON.stringify(result, null, 2));
logger.warn('⚠️  ZERO ENRICHED DISHES');
logger.error('❌ ZERO ITEMS EXTRACTED');
```

---

## 🎯 Complete Example

See `job-queue.error-examples.ts` for detailed examples:

1. ✅ **exampleHandleZeroExtraction** - Handle extraction failures
2. ✅ **exampleHandleZeroEnrichedDishes** - Handle enrichment failures
3. ✅ **exampleAllergenWithoutEnrichedData** - Run with missing data
4. ✅ **exampleValidateJobMetadata** - Validate before completion
5. ✅ **exampleCompleteErrorHandling** - Full flow with all checks

---

## 📊 Job Stages

| Stage | Description | Validation |
|-------|-------------|------------|
| VALIDATION | Validate input image | Check isValid |
| EXTRACTION | Extract menu items | ⚠️ Check items.length > 0 |
| DISH_UNDERSTANDING | Enrich with ingredients | ⚠️ Check enrichedDishes.length |
| ALLERGEN_ANALYSIS | Check allergens | Warn if missing enriched |
| DIETARY_ANALYSIS | Check dietary restrictions | Optional |
| NUTRITION_ANALYSIS | Nutrition advice | Optional |
| PRICE_ANALYSIS | Analyze prices | Optional |
| FORMATTING | Format final response | Check metadata.dishes.length |

---

## ⚠️ Common Pitfalls

### **1. Not checking for zero extraction**
```typescript
// ❌ Bad - no validation
const items = await extract(image);
jobQueue.updateStage(jobId, JobStage.EXTRACTION, { totalItems: items.length }, 'completed');
// Problem: If items.length = 0, job continues with empty data

// ✅ Good - with validation
const items = await extract(image);
if (items.length === 0) {
  throw new Error('ERR_ZERO_EXTRACTION');
}
jobQueue.updateStage(jobId, JobStage.EXTRACTION, { totalItems: items.length }, 'completed');
```

### **2. NaN in calculations**
```typescript
// ❌ Bad - can produce NaN
const avg = dishes.reduce((sum, d) => sum + d.score, 0) / dishes.length;
// If dishes.length = 0 → avg = NaN

// ✅ Good - safe calculation
const avg = dishes.length > 0
  ? dishes.reduce((sum, d) => sum + d.score, 0) / dishes.length
  : 0;
```

### **3. Using console.log**
```typescript
// ❌ Bad - not tracked
console.log('Result:', result);

// ✅ Good - properly logged
logger.debug('Result:');
logger.debug(JSON.stringify(result, null, 2));
```

### **4. Not warning about missing data**
```typescript
// ❌ Bad - silent failure
const allergenResult = await analyze({
  enrichedItems: [], // Empty!
  userAllergens,
});

// ✅ Good - clear warning
if (enrichedItems.length === 0) {
  logger.warn('⚠️  Running WITHOUT enriched data - less accurate');
}
const allergenResult = await analyze({
  enrichedItems,
  userAllergens,
});
```

---

## 🧪 Testing

See `TEST_DATA_FLOW.md` for complete testing guide.

**Quick test:**
```bash
./scripts/test-data-flow.sh
./scripts/check-logs.sh
```

---

## 📚 Related Files

- `job-queue.service.ts` - Core service
- `job-queue.types.ts` - Type definitions
- `job-queue.validators.ts` - Validation functions
- `job-queue.examples.ts` - Basic examples
- `job-queue.error-examples.ts` - Error handling examples
- `TEST_DATA_FLOW.md` - Testing documentation

---

## ✅ Checklist

Before deploying, ensure:

- [ ] All console.log replaced with logger
- [ ] Zero extraction check added
- [ ] Zero enriched dishes warning added
- [ ] NaN calculations fixed
- [ ] Metadata validation before completion
- [ ] Warnings when missing enriched data
- [ ] Tests pass
- [ ] Logs are clear and actionable

---

**Updated:** Nov 23, 2025
**Status:** Production Ready ✅
