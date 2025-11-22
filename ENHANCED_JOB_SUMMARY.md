# 📋 Enhanced Job Summary

**Updated:** Nov 23, 2025 at 2:36am UTC+07:00

## 🎯 Overview

Job summary giờ đã bao gồm **thông tin chi tiết** về món ăn, thành phần, dị ứng, và giá cả.

---

## 📊 Enhanced Summary Format

### **Complete Log Output**

```
═══════════════════════════════════════════
✅ JOB COMPLETED: job_1763838581864_v3qlk4cyx
═══════════════════════════════════════════
⏱️  Total Duration: 15234ms
📊 Stages: 6/8 completed

Stage Breakdown:
  ✅ validation: completed (150ms)
  ✅ extraction: completed (5000ms)
  ✅ dish_understanding: completed (3500ms)
  ✅ allergen_analysis: completed (4000ms)
  ⏳ dietary_analysis: pending (0ms)
  ⏳ nutrition_analysis: pending (0ms)
  ✅ price_analysis: completed (584ms)
  ✅ formatting: completed (2000ms)
═══════════════════════════════════════════
📋 DETAILED ANALYSIS RESULTS
═══════════════════════════════════════════

🍽️  Món ăn (4 món):

1. Phở Bò (Beef Noodle Soup)
   📝 Thành phần: beef, rice noodles, broth, herbs, spices
   💰 Giá: 50,000₫

2. Bún Riêu (Crab Noodle Soup)
   📝 Thành phần: crab paste, shrimp paste, rice noodles, tomato
   💰 Giá: 45,000₫

3. Cơm Gà (Chicken Rice)
   📝 Thành phần: chicken, rice, ginger, garlic
   💰 Giá: 40,000₫

4. Gỏi Cuốn (Spring Rolls)
   📝 Thành phần: rice paper, shrimp, pork, vegetables, peanuts
   💰 Giá: 30,000₫

🚨 Phân tích dị ứng:
   ✅ An toàn: 2 món
   ⚠️  Không an toàn: 2 món
   📊 Mức độ rủi ro tổng thể: MEDIUM

   Chi tiết từng món:
   ✅ Phở Bò: SAFE
   🔴 Bún Riêu: HIGH_RISK
      - shellfish: Riêu (crab/shrimp paste)
        Khả năng: definite, Mức độ: severe
      - shellfish: Mắm Tôm in broth
        Khả năng: probable, Mức độ: severe
   ✅ Cơm Gà: SAFE
   🟡 Gỏi Cuốn: MEDIUM_RISK
      - peanuts: Crushed peanuts in sauce
        Khả năng: definite, Mức độ: moderate
      - shellfish: Shrimp filling
        Khả năng: definite, Mức độ: severe

💰 Phân tích giá:
   📊 Giá trung bình: 41,250₫
   📉 Giá thấp nhất: 30,000₫
   📈 Giá cao nhất: 50,000₫
═══════════════════════════════════════════
```

---

## 🔍 Metadata Structure

### **JobMetadata Interface**

```typescript
interface JobMetadata {
  // Dishes with ingredients & prices
  dishes: Array<{
    name: string;              // Original dish name
    canonicalName: string;     // Standardized name
    ingredients: string;       // Comma-separated ingredients
    price: number;            // Price in VND
  }>;

  // Allergen analysis summary
  allergenSummary: {
    totalDishes: number;
    safeItems: number;
    unsafeItems: number;
    overallRisk: 'low' | 'medium' | 'high' | 'critical';
    details: Array<{
      dishName: string;
      riskLevel: 'SAFE' | 'LOW_RISK' | 'MEDIUM_RISK' | 'HIGH_RISK' | 'SEVERE_RISK';
      allergens: Array<{
        type: string;           // e.g., 'shellfish', 'peanuts'
        source: string;         // e.g., 'Riêu paste', 'Crushed peanuts'
        likelihood: 'definite' | 'probable' | 'possible';
        severity: 'mild' | 'moderate' | 'severe' | 'life-threatening';
      }>;
    }>;
  } | null;

  // Price analysis
  priceAnalysis: {
    averagePrice: number;     // Average price in VND
    minPrice: number;         // Minimum price
    maxPrice: number;         // Maximum price
  };
}
```

---

## 📝 Information Provided

### **1. Món ăn (Dishes)**
- ✅ Tên món (Original & Canonical)
- ✅ Thành phần (Ingredients)
- ✅ Giá tiền (Price in VND)

### **2. Dị ứng (Allergens)**
- ✅ Tổng số món an toàn/không an toàn
- ✅ Mức độ rủi ro tổng thể
- ✅ Chi tiết từng món:
  - Tên món
  - Mức độ rủi ro (SAFE, LOW, MEDIUM, HIGH, SEVERE)
  - Các chất gây dị ứng:
    - Loại dị ứng (type)
    - Nguồn gốc (source)
    - Khả năng có mặt (likelihood)
    - Mức độ nghiêm trọng (severity)

### **3. Giá cả (Prices)**
- ✅ Giá trung bình
- ✅ Giá thấp nhất
- ✅ Giá cao nhất

---

## 🎨 Risk Level Icons

| Risk Level | Icon | Meaning |
|-----------|------|---------|
| **SAFE** | ✅ | An toàn hoàn toàn |
| **LOW_RISK** | 🟢 | Rủi ro thấp |
| **MEDIUM_RISK** | 🟡 | Rủi ro trung bình |
| **HIGH_RISK** | 🔴 | Rủi ro cao |
| **SEVERE_RISK** | 🔴 | Rủi ro nghiêm trọng |

---

## 🔧 Implementation Details

### **Menu Service - Build Metadata**

```typescript
// In menu.service.ts (Line 1586-1633)
const jobMetadata = {
  // Map dishes with ingredients & prices
  dishes: enrichedDishes.map(dish => ({
    name: dish.originalName,
    canonicalName: dish.canonicalName,
    ingredients: dish.ingredients?.map(i => i.canonicalName).join(', ') || 'N/A',
    price: extractionResult?.menuSections
      ?.flatMap(s => s.items)
      ?.find(item => item.name.toLowerCase() === dish.originalName.toLowerCase())
      ?.price || 0,
  })),

  // Allergen summary with details
  allergenSummary: allergenAnalysis ? {
    totalDishes: allergenAnalysis.analysis.length,
    safeItems: allergenAnalysis.summary.safeItems,
    unsafeItems: allergenAnalysis.summary.unsafeItems,
    overallRisk: allergenAnalysis.summary.overallRisk,
    details: allergenAnalysis.analysis.map(a => ({
      dishName: a.dishName,
      riskLevel: a.riskLevel,
      allergens: a.identifiedAllergens?.map(allergen => ({
        type: allergen.allergen,
        source: allergen.source,
        likelihood: allergen.likelihood,
        severity: allergen.severity,
      })) || [],
    })),
  } : null,

  // Price statistics
  priceAnalysis: {
    averagePrice: Math.round(avgPrice),
    minPrice: Math.min(...prices),
    maxPrice: Math.max(...prices),
  },
};

// Pass to completeJob
this.jobQueue.completeJob(jobId, formattedResult, jobMetadata);
```

### **Job Queue Service - Log Metadata**

```typescript
// In job-queue.service.ts (Line 250-300)
if (metadata) {
  // Log dishes
  if (metadata.dishes) {
    metadata.dishes.forEach((dish, idx) => {
      this.logger.log(`${idx + 1}. ${dish.name}`);
      this.logger.log(`   📝 Thành phần: ${dish.ingredients}`);
      this.logger.log(`   💰 Giá: ${dish.price.toLocaleString('vi-VN')}₫`);
    });
  }

  // Log allergen summary
  if (metadata.allergenSummary) {
    this.logger.log(`🚨 Phân tích dị ứng:`);
    this.logger.log(`   ✅ An toàn: ${metadata.allergenSummary.safeItems} món`);
    this.logger.log(`   ⚠️  Không an toàn: ${metadata.allergenSummary.unsafeItems} món`);
    
    // Details per dish
    metadata.allergenSummary.details.forEach(detail => {
      const icon = getRiskIcon(detail.riskLevel);
      this.logger.log(`   ${icon} ${detail.dishName}: ${detail.riskLevel}`);
      
      detail.allergens.forEach(allergen => {
        this.logger.log(`      - ${allergen.type}: ${allergen.source}`);
        this.logger.log(`        Khả năng: ${allergen.likelihood}, Mức độ: ${allergen.severity}`);
      });
    });
  }

  // Log price analysis
  if (metadata.priceAnalysis) {
    this.logger.log(`💰 Phân tích giá:`);
    this.logger.log(`   📊 Giá trung bình: ${metadata.priceAnalysis.averagePrice}₫`);
    this.logger.log(`   📉 Giá thấp nhất: ${metadata.priceAnalysis.minPrice}₫`);
    this.logger.log(`   📈 Giá cao nhất: ${metadata.priceAnalysis.maxPrice}₫`);
  }
}
```

---

## 🎯 Use Cases

### **1. Debug Allergen Analysis**
```bash
# Check which dishes are unsafe
grep "🔴" logs/app.log

# Find specific allergen
grep "shellfish:" logs/app.log

# Check severity levels
grep "Mức độ: severe" logs/app.log
```

### **2. Price Analysis**
```bash
# Check average prices
grep "Giá trung bình:" logs/app.log

# Find expensive dishes
grep "💰 Giá:" logs/app.log | awk '{if($3 > 50000) print}'
```

### **3. Ingredients Tracking**
```bash
# Find dishes with specific ingredient
grep "Thành phần:" logs/app.log | grep "peanuts"

# Check all ingredients
grep "📝 Thành phần:" logs/app.log
```

---

## 📊 Example Scenarios

### **Scenario 1: User with Shellfish Allergy**

**Input:**
- 4 món ăn extracted
- User allergens: `[{type: "shellfish", severity: "severe"}]`

**Output Log:**
```
🚨 Phân tích dị ứng:
   ✅ An toàn: 2 món
   ⚠️  Không an toàn: 2 món
   📊 Mức độ rủi ro tổng thể: HIGH

   Chi tiết từng món:
   ✅ Phở Bò: SAFE
   🔴 Bún Riêu: HIGH_RISK
      - shellfish: Riêu (crab/shrimp paste)
        Khả năng: definite, Mức độ: severe
   ✅ Cơm Gà: SAFE
   🔴 Gỏi Cuốn: MEDIUM_RISK
      - shellfish: Shrimp filling
        Khả năng: definite, Mức độ: severe
```

### **Scenario 2: Price Range Analysis**

**Input:**
- 4 món: 30k, 40k, 45k, 50k

**Output Log:**
```
💰 Phân tích giá:
   📊 Giá trung bình: 41,250₫
   📉 Giá thấp nhất: 30,000₫
   📈 Giá cao nhất: 50,000₫
```

---

## ✅ Benefits

### **Before:**
```
[LOG] Job completed: job_123
```
❌ Không biết gì về kết quả!

### **After:**
```
✅ JOB COMPLETED
⏱️  15234ms, 6/8 stages

🍽️  Món ăn (4 món):
1. Phở Bò (Beef Noodle Soup)
   📝 beef, noodles, broth
   💰 50,000₫

🚨 Dị ứng:
   🔴 Bún Riêu: HIGH_RISK
      - shellfish: Riêu paste (definite, severe)

💰 Giá: 41,250₫ trung bình
```
✅ Biết rõ tất cả!

---

## 🔗 Related Files

- `/src/modules/menu/menu.service.ts` - Build metadata
- `/src/shared/services/job-queue.service.ts` - Log metadata
- `JOB_SYSTEM_SUMMARY.md` - Job system overview
- `LOGGING_SUMMARY.md` - All logging points

---

## 📝 Summary

| Feature | Status |
|---------|--------|
| **Dish Details** | ✅ Name, ingredients, price |
| **Allergen Analysis** | ✅ Risk levels, sources, severity |
| **Price Analysis** | ✅ Average, min, max |
| **Detailed Logging** | ✅ Full breakdown |
| **Vietnamese Support** | ✅ All labels in Vietnamese |

**Total Information Points:** 12+
- Dish name (original & canonical)
- Ingredients
- Price
- Allergen type
- Allergen source
- Likelihood
- Severity
- Risk level
- Safe/unsafe count
- Average/min/max price
- Stage durations
- Overall metrics
