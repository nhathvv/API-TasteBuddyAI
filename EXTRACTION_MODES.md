# 📊 Extraction Modes - Quick vs Full

## 🎯 Overview

API hỗ trợ 2 chế độ extraction cho menu:

| Mode | Speed | Detail Level | Use Case |
|------|-------|--------------|----------|
| **quick** | ⚡ Fast (~2-5s) | Basic | Preview, quick scan |
| **full** | 🐢 Slower (~10-20s) | Comprehensive | Complete analysis |

---

## ⚡ Quick Mode

### **Đặc điểm:**
- ✅ Nhanh, tối ưu cho mobile
- ✅ Chỉ extract tên món + giá
- ✅ Không phân tích ingredients
- ✅ Không tính nutrition
- ✅ Phù hợp cho preview

### **Response Structure:**
```json
{
  "agent": "VisualExtractionAgent",
  "result": {
    "restaurantName": "Quán Cơm Tấm",
    "menuSections": [
      {
        "sectionName": "Món Chính",
        "items": [
          {
            "name": "Cơm Tấm Sườn",
            "price": 45000,
            "description": "",
            "category": "Món Chính"
          }
        ]
      }
    ],
    "metadata": {
      "totalItems": 1,
      "extractionQuality": "medium",
      "processingTime": 2500
    }
  }
}
```

### **API Call:**
```bash
curl -X POST http://localhost:3000/menu/upload/visual-extraction \
  -F "image=@menu.jpg" \
  -F "language=vi" \
  -F "extractionMode=quick"
```

---

## 🔍 Full Mode

### **Đặc điểm:**
- ✅ Phân tích đầy đủ ingredients
- ✅ Tính toán nutrition (protein, carbs, fat)
- ✅ Phát hiện allergen signals
- ✅ Dietary profile (vegetarian, vegan, gluten-free)
- ✅ Cooking methods
- ✅ Popup info formatted
- ✅ Confidence scores

### **Response Structure:**
```json
{
  "success": true,
  "message": "Menu scan completed successfully",
  "language": "vi",
  "data": {
    "extraction": {
      "menuSections": [
        {
          "sectionName": "Món Chính",
          "items": [
            {
              "name": "Cơm Tấm Sườn",
              "price": 45000,
              "nutrition": {
                "calories": 650,
                "protein": 35,
                "carbs": 75,
                "fat": 18,
                "fiber": 3,
                "sodium": 1300,
                "servingSize": "1 serving (~200g)",
                "estimationMethod": "ingredient-based"
              },
              "dishDetails": {
                "canonicalName": "Broken Rice with Grilled Pork Chop",
                "cuisineRegion": "Southern Vietnam",
                "baseDishType": "main-course",
                "ingredients": [
                  {
                    "name": "Pork",
                    "isPrimary": true
                  },
                  {
                    "name": "Rice",
                    "isPrimary": true
                  }
                ],
                "allergenSignals": [
                  "possible_soy",
                  "possible_fish_sauce"
                ],
                "dietaryProfile": {
                  "isLikelyVegetarian": false,
                  "isLikelyVegan": false,
                  "isLikelyGlutenFree": true,
                  "isLikelyDairyFree": true
                },
                "confidenceScore": 0.92
              },
              "popupInfo": {
                "title": "Broken Rice with Grilled Pork Chop",
                "subtitle": "main-course • Southern Vietnam",
                "ingredients": {
                  "primary": [
                    { "name": "Pork", "icon": "🔸", "badge": "Chính" },
                    { "name": "Rice", "icon": "🔸", "badge": "Chính" }
                  ],
                  "formatted": [
                    "🔸 Pork (Chính)",
                    "🔸 Rice (Chính)",
                    "▫️ Fish Sauce",
                    "▫️ Soy Sauce"
                  ]
                },
                "nutrition": {
                  "summary": {
                    "calories": "650 kcal",
                    "protein": "35g",
                    "carbs": "75g",
                    "fat": "18g"
                  },
                  "detailed": [
                    { "label": "🔥 Calories", "value": 650, "unit": "kcal", "color": "#FF6B6B" },
                    { "label": "💪 Protein", "value": 35, "unit": "g", "color": "#4ECDC4" },
                    { "label": "🍚 Carbs", "value": 75, "unit": "g", "color": "#FFE66D" },
                    { "label": "🥑 Fat", "value": 18, "unit": "g", "color": "#95E1D3" }
                  ],
                  "bars": [
                    "💪 Protein: ███████░░░ 35g",
                    "🍚 Carbs: ███████░░░ 75g",
                    "🥑 Fat: ██████░░░░ 18g"
                  ],
                  "method": "✅ Dựa trên thành phần thực tế"
                },
                "allergens": {
                  "signals": [
                    "⚠️ Có khả năng: soy",
                    "⚠️ Có khả năng: fish sauce"
                  ],
                  "count": 2,
                  "formatted": "⚠️ Có khả năng: soy\n⚠️ Có khả năng: fish sauce"
                },
                "cooking": {
                  "methods": ["grilled", "steamed"],
                  "formatted": "🔥 grilled • ♨️ steamed"
                },
                "confidence": {
                  "score": 0.92,
                  "percentage": "92%",
                  "level": "Cao",
                  "icon": "✅"
                },
                "quickSummary": "📊 650 kcal • 💪 35g protein • 🍚 75g carbs • 🥑 18g fat • ⚠️ 2 allergen signals"
              }
            }
          ]
        }
      ]
    },
    "enrichedDishes": [
      {
        "dishId": "dish_1",
        "originalName": "Cơm Tấm Sườn",
        "canonicalName": "Broken Rice with Grilled Pork Chop",
        "ingredients": [
          {
            "name": "Thịt Heo",
            "canonicalName": "Pork",
            "isPrimary": true,
            "isOptional": false,
            "estimatedPresence": "mandatory"
          },
          {
            "name": "Cơm",
            "canonicalName": "Rice",
            "isPrimary": true,
            "isOptional": false,
            "estimatedPresence": "mandatory"
          }
        ],
        "cookingMethods": ["grilled", "steamed"],
        "baseDishType": "main-course",
        "cuisineRegion": "Southern Vietnam",
        "dietaryProfile": {
          "isLikelyVegetarian": false,
          "isLikelyVegan": false,
          "isLikelyGlutenFree": true,
          "isLikelyDairyFree": true,
          "notes": "Contains pork. May contain soy sauce or fish sauce."
        },
        "inferredAllergenSignals": [
          "possible_soy",
          "possible_fish_sauce"
        ],
        "confidenceScore": 0.92
      }
    ]
  }
}
```

### **API Call:**
```bash
curl -X POST http://localhost:3000/menu/upload/visual-extraction \
  -F "image=@menu.jpg" \
  -F "language=vi" \
  -F "extractionMode=full"
```

---

## 📊 Performance Comparison

| Metric | Quick Mode | Full Mode |
|--------|-----------|-----------|
| **Processing Time** | 2-5s | 10-20s |
| **API Calls** | 1 (Vision) | 3+ (Vision + DUIA + Analysis) |
| **Response Size** | ~2KB | ~15KB |
| **Ingredients** | ❌ No | ✅ Yes (detailed) |
| **Nutrition** | ❌ No | ✅ Yes (calculated) |
| **Allergens** | ❌ No | ✅ Yes (detected) |
| **Popup Info** | ❌ No | ✅ Yes (formatted) |
| **Cost** | Low | Higher |

---

## 🎯 When to Use Each Mode

### **Use Quick Mode when:**
- 📱 Mobile app với network chậm
- 👀 User chỉ cần xem menu nhanh
- 💰 Chỉ quan tâm giá
- ⚡ Cần response nhanh
- 🔄 Preview trước khi analyze chi tiết

### **Use Full Mode when:**
- 🏥 User có allergen concerns
- 💪 Cần thông tin nutrition
- 🥗 Theo dõi chế độ ăn (diet tracking)
- 📊 Cần phân tích đầy đủ
- 🎨 Hiển thị popup chi tiết

---

## 🔄 Progressive Enhancement Pattern

Recommend pattern: **Quick first, then Full on demand**

```javascript
// Step 1: Quick scan for preview
const quickResult = await scanMenu(image, { mode: 'quick' });
displayMenuPreview(quickResult);

// Step 2: User clicks on dish → Full analysis
dishCard.onClick = async () => {
  const fullResult = await scanMenu(image, { mode: 'full' });
  showDetailedPopup(fullResult.popupInfo);
};
```

---

## 💡 Best Practices

### **Quick Mode:**
```typescript
// ✅ Good: Fast preview
const result = await menuService.scanMenu({
  imageData: base64,
  mimeType: 'image/jpeg',
  extractionMode: 'quick',
  language: 'vi'
});

// Display basic list
result.data.extraction.menuSections.forEach(section => {
  section.items.forEach(item => {
    console.log(`${item.name}: ${item.price}₫`);
  });
});
```

### **Full Mode:**
```typescript
// ✅ Good: Complete analysis
const result = await menuService.scanMenu({
  imageData: base64,
  mimeType: 'image/jpeg',
  extractionMode: 'full',
  language: 'vi',
  userAllergens: ['peanut', 'shellfish'], // Optional
  dietaryRestrictions: ['vegetarian']      // Optional
});

// Display detailed popup
const dish = result.data.extraction.menuSections[0].items[0];
showPopup({
  title: dish.popupInfo.title,
  ingredients: dish.popupInfo.ingredients.formatted,
  nutrition: dish.popupInfo.nutrition.summary,
  allergens: dish.popupInfo.allergens.formatted,
  confidence: dish.popupInfo.confidence
});
```

---

## 🚀 Migration Guide

### **From Quick to Full:**

If you're currently using quick mode and want to upgrade:

```diff
const result = await menuService.scanMenu({
  imageData: base64,
  mimeType: 'image/jpeg',
- extractionMode: 'quick',
+ extractionMode: 'full',
  language: 'vi',
+ userAllergens: userProfile.allergens,
+ dietaryRestrictions: userProfile.diet
});

// New fields available:
+ result.data.enrichedDishes
+ result.data.extraction.menuSections[0].items[0].nutrition
+ result.data.extraction.menuSections[0].items[0].dishDetails
+ result.data.extraction.menuSections[0].items[0].popupInfo
```

---

## 📈 Pricing Impact

| Mode | Gemini API Calls | Estimated Cost |
|------|------------------|----------------|
| **quick** | 1 call | ~$0.001 |
| **full** | 3-5 calls | ~$0.005 |

**Note:** Full mode costs ~5x more but provides 10x more value for health-conscious users.

---

## 🎉 Summary

- **Quick Mode**: Fast, basic extraction (names + prices)
- **Full Mode**: Complete analysis (ingredients, nutrition, allergens, popup info)
- **Recommendation**: Use quick for preview, full for detailed analysis
- **Best Pattern**: Progressive enhancement (quick → full on demand)

---

**Last Updated:** 2025-11-23  
**Version:** 1.0.0
