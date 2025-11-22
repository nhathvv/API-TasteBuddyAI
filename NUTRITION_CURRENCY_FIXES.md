# 🔧 Nutrition & Currency Fixes

## 🚨 Issues Found

### **1. Nutrition Information Missing ❌**

**Problem:**
- Method `estimatePerDishNutrition()` exists và hoạt động tốt
- **NHƯNG** chỉ được dùng trong `transformToFR06FR07Format()` (test pipeline)
- **KHÔNG** được thêm vào response của `formatScanResponse()` (main API)

**Current Behavior:**
```json
// Response KHÔNG có nutrition info
{
  "name": "Phở Bò",
  "price": 50000,
  "priceFormatted": "50.000₫",
  "dishDetails": {...},
  // ❌ Missing: nutrition info
}
```

**Expected Behavior:**
```json
{
  "name": "Phở Bò",
  "price": 50000,
  "priceFormatted": "50.000₫",
  "dishDetails": {...},
  "nutrition": {  // ✅ Should be here
    "calories": 450,
    "protein": 28,
    "carbs": 51,
    "fat": 15,
    "fiber": 3,
    "sodium": 900,
    "sugar": 5,
    "servingSize": "1 serving (~200g)"
  }
}
```

---

### **2. Currency Conversion Working ✅ BUT...**

**Investigation:**
```typescript
// Line 370: Currency conversion IS working
const convertedPrice = this.i18nService.convertPrice(item.price, language);

// Line 400-403: Converted price IS added
price: convertedPrice.value,
priceFormatted: convertedPrice.formatted,
priceCurrency: convertedPrice.currency,
priceSymbol: convertedPrice.symbol,
```

**Problem Might Be:**
1. Frontend không display `priceFormatted` field?
2. `language` parameter không được truyền đúng?
3. I18n service conversion rates not configured?

---

## ✅ Fix 1: Add Nutrition Info to Response

### **Update formatScanResponse Method**

```typescript
// src/modules/menu/menu.service.ts
// Around line 390-420

return {
  ...item,
  // Original price (always VND)
  priceOriginal: {
    value: item.price,
    currency: 'VND',
    symbol: '₫',
    formatted: `${item.price.toLocaleString('vi-VN')}₫`,
  },
  // Converted price
  price: convertedPrice.value,
  priceFormatted: convertedPrice.formatted,
  priceCurrency: convertedPrice.currency,
  priceSymbol: convertedPrice.symbol,
  // Price analysis
  priceAnalysis,
  
  // ⬇️ ADD NUTRITION INFO HERE
  nutrition: enrichedDish ? this.estimatePerDishNutrition(enrichedDish) : null,
  
  // Enriched dish data
  dishDetails: enrichedDish ? {
    canonicalName: enrichedDish.canonicalName,
    cuisineRegion: enrichedDish.cuisineRegion,
    baseDishType: enrichedDish.baseDishType,
    ingredients: enrichedDish.ingredients?.map(ing => ({
      name: ing.canonicalName || ing.name,
      isPrimary: ing.isPrimary,
    })),
    allergenSignals: enrichedDish.inferredAllergenSignals,
    dietaryProfile: enrichedDish.dietaryProfile,
    confidenceScore: enrichedDish.confidenceScore,
  } : null,
};
```

---

## ✅ Fix 2: Improve Nutrition Estimation

### **Current Method is Good But Can Be Better**

```typescript
// src/modules/menu/menu.service.ts
// Line 1275-1288

private estimatePerDishNutrition(dish: any) {
  const baseCalories = this.estimateCaloriesFromDish(dish);

  // Use standard macro ratios
  // Protein: 4 cal/g, Carbs: 4 cal/g, Fat: 9 cal/g
  
  return {
    calories: baseCalories,
    protein: Math.round((baseCalories * 0.25) / 4),  // 25% from protein
    carbs: Math.round((baseCalories * 0.45) / 4),    // 45% from carbs
    fat: Math.round((baseCalories * 0.30) / 9),      // 30% from fat
    fiber: Math.round(baseCalories / 150),           // ~3g per 450 cal
    sodium: baseCalories * 2,                         // Vietnamese food high sodium
    sugar: Math.round(baseCalories / 100),           // ~5g per 500 cal
    servingSize: '1 serving (~200g)',
  };
}
```

**This is already good! ✅**

---

## ✅ Fix 3: Check Currency Conversion

### **Verify I18nService Configuration**

```typescript
// Check: src/shared/services/i18n.service.ts

convertPrice(priceVND: number, language: string) {
  const rates = {
    'vi': { currency: 'VND', symbol: '₫', rate: 1 },
    'en': { currency: 'USD', symbol: '$', rate: 0.000041 }, // 1 VND = 0.000041 USD
    'ko': { currency: 'KRW', symbol: '₩', rate: 0.054 },    // 1 VND = 0.054 KRW
    'ja': { currency: 'JPY', symbol: '¥', rate: 0.0061 },   // 1 VND = 0.0061 JPY
  };

  const config = rates[language] || rates['vi'];
  const convertedValue = Math.round(priceVND * config.rate);

  return {
    value: convertedValue,
    currency: config.currency,
    symbol: config.symbol,
    formatted: `${convertedValue.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')}${config.symbol}`,
  };
}
```

---

## 📊 Enhanced Nutrition Estimation

### **Option: Use Ingredient-Based Calculation**

```typescript
private estimatePerDishNutrition(dish: any) {
  const ingredients = dish.ingredients || [];
  
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  
  // Nutrition database per 100g
  const nutritionDB: Record<string, any> = {
    // Proteins
    'beef': { cal: 250, protein: 26, carbs: 0, fat: 15 },
    'pork': { cal: 242, protein: 27, carbs: 0, fat: 14 },
    'chicken': { cal: 165, protein: 31, carbs: 0, fat: 3.6 },
    'shrimp': { cal: 99, protein: 24, carbs: 0.2, fat: 0.3 },
    'fish': { cal: 206, protein: 22, carbs: 0, fat: 12 },
    
    // Carbs
    'rice': { cal: 130, protein: 2.7, carbs: 28, fat: 0.3 },
    'noodles': { cal: 138, protein: 4.5, carbs: 25, fat: 2.1 },
    'bread': { cal: 265, protein: 9, carbs: 49, fat: 3.2 },
    
    // Vegetables
    'vegetables': { cal: 25, protein: 1.5, carbs: 5, fat: 0.2 },
    'herbs': { cal: 20, protein: 2, carbs: 4, fat: 0.1 },
  };
  
  // Estimate portion sizes (g)
  const portionSizes: Record<string, number> = {
    primary: 150,   // Main protein
    carbs: 200,     // Rice/noodles
    vegetables: 100, // Vegetables
    herbs: 20,      // Herbs/spices
  };
  
  // Calculate nutrition from ingredients
  for (const ingredient of ingredients) {
    const name = (ingredient.canonicalName || ingredient.name || '').toLowerCase();
    const isPrimary = ingredient.isPrimary;
    
    // Find matching nutrition data
    for (const [key, nutrition] of Object.entries(nutritionDB)) {
      if (name.includes(key) || name.includes(this.getVietnameseName(key))) {
        const portion = isPrimary ? portionSizes.primary : 
                       key === 'rice' || key === 'noodles' ? portionSizes.carbs :
                       portionSizes.vegetables;
        
        const multiplier = portion / 100; // Per 100g to actual portion
        
        totalCalories += nutrition.cal * multiplier;
        totalProtein += nutrition.protein * multiplier;
        totalCarbs += nutrition.carbs * multiplier;
        totalFat += nutrition.fat * multiplier;
        break;
      }
    }
  }
  
  // Add base cooking oils/condiments
  totalCalories += 50;
  totalFat += 5;
  
  // If no ingredients matched, use fallback
  if (totalCalories === 0) {
    totalCalories = 350; // Default
    totalProtein = 20;
    totalCarbs = 45;
    totalFat = 10;
  }
  
  return {
    calories: Math.round(totalCalories),
    protein: Math.round(totalProtein),
    carbs: Math.round(totalCarbs),
    fat: Math.round(totalFat),
    fiber: Math.round(totalCalories / 150),
    sodium: Math.round(totalCalories * 2),
    sugar: Math.round(totalCalories / 100),
    servingSize: '1 serving (~250g)',
    confidence: ingredients.length > 0 ? 'medium' : 'low',
  };
}

private getVietnameseName(english: string): string {
  const mapping: Record<string, string> = {
    'beef': 'bò',
    'pork': 'heo',
    'chicken': 'gà',
    'shrimp': 'tôm',
    'fish': 'cá',
    'rice': 'cơm',
    'noodles': 'bún',
  };
  return mapping[english] || english;
}
```

---

## 🎨 Frontend Display Examples

### **Display Nutrition Info**

```jsx
// React Component
const DishNutrition = ({ nutrition }) => {
  if (!nutrition) return null;
  
  return (
    <div className="nutrition-info">
      <h4>📊 Thông tin dinh dưỡng</h4>
      
      <div className="nutrition-grid">
        <div className="nutrient">
          <span className="label">Calories</span>
          <span className="value">{nutrition.calories} kcal</span>
        </div>
        
        <div className="nutrient">
          <span className="label">Protein</span>
          <span className="value">{nutrition.protein}g</span>
        </div>
        
        <div className="nutrient">
          <span className="label">Carbs</span>
          <span className="value">{nutrition.carbs}g</span>
        </div>
        
        <div className="nutrient">
          <span className="label">Fat</span>
          <span className="value">{nutrition.fat}g</span>
        </div>
        
        <div className="nutrient">
          <span className="label">Fiber</span>
          <span className="value">{nutrition.fiber}g</span>
        </div>
        
        <div className="nutrient">
          <span className="label">Sodium</span>
          <span className="value">{nutrition.sodium}mg</span>
        </div>
      </div>
      
      <div className="serving-size">
        Khẩu phần: {nutrition.servingSize}
      </div>
    </div>
  );
};
```

### **Display Price with Currency**

```jsx
const DishPrice = ({ item }) => {
  return (
    <div className="price-display">
      {/* Original Price (VND) */}
      <div className="price-original">
        <span className="label">Giá gốc:</span>
        <span className="value">{item.priceOriginal.formatted}</span>
      </div>
      
      {/* Converted Price (if different) */}
      {item.priceCurrency !== 'VND' && (
        <div className="price-converted">
          <span className="label">≈</span>
          <span className="value">
            {item.priceSymbol}{item.price.toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
};
```

---

## 🧪 Testing

### **Test Nutrition Info**

```bash
# Test with enriched dishes
curl -X POST http://localhost:3000/menu/upload/scan-async \
  -F "image=@menu.jpg" \
  -F "language=vi"

# Check response has nutrition field
# Expected: item.nutrition = { calories, protein, carbs, fat, ... }
```

### **Test Currency Conversion**

```bash
# Test Vietnamese (VND)
curl -X POST /menu/upload/scan-async \
  -F "image=@menu.jpg" \
  -F "language=vi" \
  -F "outputLanguage=vi"

# Test English (USD)
curl -X POST /menu/upload/scan-async \
  -F "image=@menu.jpg" \
  -F "language=en" \
  -F "outputLanguage=en"

# Test Korean (KRW)
curl -X POST /menu/upload/scan-async \
  -F "image=@menu.jpg" \
  -F "language=ko" \
  -F "outputLanguage=ko"
```

---

## ✅ Summary

| Issue | Status | Fix |
|-------|--------|-----|
| **Nutrition Missing** | ❌ Not in response | ✅ Add to formatScanResponse |
| **Currency Conversion** | ✅ Code exists | 🔍 Check FE display |
| **Estimation Method** | ✅ Working | 💡 Can be improved |

### **Priority Fixes:**

1. **HIGH:** Add nutrition to formatScanResponse ✅
2. **MEDIUM:** Verify currency display on FE 🔍
3. **LOW:** Enhance nutrition estimation (optional) 💡

**Next Steps:**
1. Implement Fix #1 (add nutrition field)
2. Test with real menu images
3. Update Frontend to display nutrition info
4. Verify currency conversion working

🚀 **Ready to implement!**
