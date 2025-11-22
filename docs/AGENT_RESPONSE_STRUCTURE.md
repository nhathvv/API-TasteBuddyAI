# Agent Response Structure - Detailed Documentation

## Complete Response Flow

```
User Request → Image Validation → Text Extraction → Dish Understanding → Safety Analysis → Price Analysis → Formatted Response
```

---

## 1. FoodImageValidationService

### Input:
```typescript
{
  imageBuffer: Buffer,
  mimeType: "image/jpeg"
}
```

### Output:
```json
{
  "isFoodImage": true,
  "category": "menu_photo",
  "confidence": 0.95,
  "reason": "Image shows a printed menu with multiple Vietnamese dishes and prices clearly visible",
  "metadata": {
    "detectedLabels": ["Food", "Menu", "Vietnamese Cuisine", "Text"],
    "hasText": true,
    "hasPrices": true
  }
}
```

### Possible Categories:
- `menu_photo` - Printed or digital menu
- `food_photo` - Photo of actual food/dishes
- `single_dish` - Close-up of one dish
- `table_spread` - Multiple dishes on table
- `not_food` - Rejected image

---

## 2. CloudVisionAgent (OCR Mode)

### Input:
```typescript
{
  imageData: "base64_string...",
  mimeType: "image/jpeg",
  features: ["TEXT_DETECTION", "LABEL_DETECTION"],
  maxResults: 20,
  languageHints: ["vi"]
}
```

### Output:
```json
{
  "fullText": "PHỞ BÒ 50,000đ\nBÚN CHẢ 45,000đ\nBÚN BÒ HUẾ 55,000đ\nCƠM TẤM SƯỜN 40,000đ",

  "textAnnotations": [
    {
      "description": "PHỞ",
      "confidence": 0.98,
      "boundingPoly": {
        "vertices": [
          { "x": 120, "y": 45 },
          { "x": 180, "y": 45 },
          { "x": 180, "y": 75 },
          { "x": 120, "y": 75 }
        ]
      },
      "locale": "vi"
    },
    {
      "description": "BÒ",
      "confidence": 0.99,
      "boundingPoly": { "vertices": [...] },
      "locale": "vi"
    },
    {
      "description": "50,000đ",
      "confidence": 0.97,
      "boundingPoly": { "vertices": [...] }
    }
  ],

  "labelAnnotations": [
    { "description": "Food", "score": 0.96 },
    { "description": "Vietnamese cuisine", "score": 0.89 },
    { "description": "Menu", "score": 0.94 },
    { "description": "Text", "score": 0.98 }
  ],

  "metadata": {
    "processingTime": 850,
    "confidenceScore": 0.94,
    "featuresRequested": 2,
    "featuresCompleted": ["TEXT_DETECTION", "LABEL_DETECTION"]
  }
}
```

### Then: extractDishNamesFromOCR()
```json
["Phở Bò", "Bún Chả", "Bún Bò Huế", "Cơm Tấm Sườn"]
```

---

## 3. DishUnderstandingAgent (DUIA)

### Input:
```typescript
{
  dishes: [
    {
      dishId: "dish_1732298753421_0",
      dishName: "Bún Bò Huế",
      description: "",
      sectionName: "Menu Items",
      language: "vi"
    },
    {
      dishId: "dish_1732298753421_1",
      dishName: "Chả Giò",
      description: "",
      sectionName: "Menu Items",
      language: "vi"
    }
  ],
  context: "Analyzing single dish from menu image via Cloud Vision OCR"
}
```

### Output:
```json
{
  "dishes": [
    {
      "dishId": "dish_1732298753421_0",
      "originalName": "Bún Bò Huế",
      "canonicalName": "Bun Bo Hue (Spicy Beef Noodle Soup)",
      "possibleAliases": ["Bún bò", "Hue-style beef noodle soup"],

      "ingredients": [
        {
          "name": "rice vermicelli",
          "canonicalName": "rice vermicelli",
          "isPrimary": true,
          "isOptional": false,
          "estimatedPresence": "mandatory"
        },
        {
          "name": "beef",
          "canonicalName": "beef",
          "isPrimary": true,
          "isOptional": false,
          "estimatedPresence": "mandatory"
        },
        {
          "name": "mắm ruốc",
          "canonicalName": "fermented shrimp paste",
          "isPrimary": true,
          "isOptional": false,
          "estimatedPresence": "mandatory"
        },
        {
          "name": "lemongrass",
          "canonicalName": "lemongrass",
          "isPrimary": false,
          "isOptional": false,
          "estimatedPresence": "common"
        },
        {
          "name": "chili oil (sa tế)",
          "canonicalName": "chili oil",
          "isPrimary": false,
          "isOptional": true,
          "estimatedPresence": "common"
        },
        {
          "name": "nước mắm",
          "canonicalName": "fish sauce",
          "isPrimary": false,
          "isOptional": false,
          "estimatedPresence": "common"
        }
      ],

      "cookingMethods": ["boiled", "braised"],
      "baseDishType": "noodle_soup",
      "cuisineRegion": "central_vietnam",

      "dietaryProfile": {
        "isLikelyVegetarian": false,
        "isLikelyVegan": false,
        "isLikelyGlutenFree": false,
        "isLikelyDairyFree": true,
        "notes": "Contains beef, fermented shrimp paste (mắm ruốc), and fish sauce. High shellfish allergen risk. Not suitable for vegetarians or those avoiding shellfish."
      },

      "inferredAllergenSignals": [
        "possible_shellfish_from_mam_ruoc",
        "likely_fish_sauce_in_broth",
        "possible_dried_shrimp_in_sa_te",
        "possible_gluten_in_soy_sauce_marinade"
      ],

      "confidenceScore": 0.95,
      "reasoningSummary": "Bún Bò Huế is a signature Central Vietnamese dish from Hue. It traditionally contains beef, rice vermicelli, and crucially, mắm ruốc (fermented shrimp paste) which gives it the distinctive flavor and color. The dish poses high shellfish allergy risk due to the shrimp paste being mandatory in authentic recipes."
    },

    {
      "dishId": "dish_1732298753421_1",
      "originalName": "Chả Giò",
      "canonicalName": "Vietnamese Fried Spring Rolls",
      "possibleAliases": ["Nem Rán", "Imperial Rolls", "Cha Gio"],

      "ingredients": [
        {
          "name": "rice paper wrapper",
          "canonicalName": "rice paper wrapper",
          "isPrimary": true,
          "isOptional": false,
          "estimatedPresence": "mandatory"
        },
        {
          "name": "ground pork",
          "canonicalName": "pork",
          "isPrimary": true,
          "isOptional": false,
          "estimatedPresence": "mandatory"
        },
        {
          "name": "shrimp",
          "canonicalName": "shrimp",
          "isPrimary": true,
          "isOptional": false,
          "estimatedPresence": "common"
        },
        {
          "name": "glass noodles",
          "canonicalName": "glass noodles (vermicelli)",
          "isPrimary": false,
          "isOptional": false,
          "estimatedPresence": "common"
        },
        {
          "name": "carrot",
          "canonicalName": "carrot",
          "isPrimary": false,
          "isOptional": false,
          "estimatedPresence": "common"
        },
        {
          "name": "egg",
          "canonicalName": "egg",
          "isPrimary": false,
          "isOptional": false,
          "estimatedPresence": "common"
        },
        {
          "name": "nước mắm",
          "canonicalName": "fish sauce",
          "isPrimary": false,
          "isOptional": false,
          "estimatedPresence": "common"
        }
      ],

      "cookingMethods": ["deep-fried"],
      "baseDishType": "spring_rolls",
      "cuisineRegion": "south_vietnam",

      "dietaryProfile": {
        "isLikelyVegetarian": false,
        "isLikelyVegan": false,
        "isLikelyGlutenFree": false,
        "isLikelyDairyFree": true,
        "notes": "Contains pork, shrimp, and egg. Not guaranteed gluten-free due to potential wheat binders in the filling or wrapper, and cross-contamination from frying oil."
      },

      "inferredAllergenSignals": [
        "likely_pork",
        "likely_shellfish_in_filling",
        "likely_fish_sauce_in_filling_and_sauce",
        "likely_egg_in_filling",
        "possible_gluten_in_wrapper_or_binder",
        "possible_cross_contamination_from_shared_oil"
      ],

      "confidenceScore": 0.92,
      "reasoningSummary": "Chả Giò are deep-fried spring rolls, typically containing pork, shrimp, glass noodles, and shredded vegetables, served with fish sauce dipping sauce. The dish is highly likely to contain shellfish (shrimp), fish (fish sauce), and egg, and gluten is a possibility from commercial wrappers or shared frying oil."
    }
  ],

  "metadata": {
    "totalDishes": 2,
    "averageConfidence": 0.935,
    "processingTime": 2850
  }
}
```

---

## 4. AllergenSafetyAgent (CSAA)

### Input:
```typescript
{
  menuItems: [
    {
      name: "Chả Giò",
      description: "Origin: Vietnam. Six crispy spring rolls...",
      price: 0,
      category: "Detected Dish"
    }
  ],
  enrichedItems: [
    // Full DishUnderstandingAgent output here
    {
      originalName: "Chả Giò",
      ingredients: [...],
      inferredAllergenSignals: [...]
    }
  ],
  userAllergens: [
    { type: "shellfish", severity: "severe" },
    { type: "peanuts", severity: "moderate" }
  ],
  strictMode: true,
  language: "en"
}
```

### Output:
```json
{
  "analysis": [
    {
      "dishName": "Chả Giò",
      "riskLevel": "HIGH_RISK",

      "identifiedAllergens": [
        {
          "allergen": "shellfish",
          "source": "Shrimp in filling",
          "likelihood": "likely",
          "severity": "severe",
          "explanation": "Vietnamese spring rolls (Chả Giò) traditionally contain shrimp in the filling along with pork. The enriched dish data confirms 'likely_shellfish_in_filling' signal."
        },
        {
          "allergen": "shellfish",
          "source": "Fish sauce (nước mắm)",
          "likelihood": "definite",
          "severity": "severe",
          "explanation": "Fish sauce is used both in the filling and as a dipping sauce base. While technically fish-based, it can trigger shellfish allergies due to cross-processing in some brands."
        }
      ],

      "crossContaminationRisks": [
        {
          "source": "Deep frying oil",
          "allergen": "shellfish",
          "likelihood": "possible",
          "explanation": "The same oil may be used for frying other seafood items, creating cross-contamination risk."
        }
      ],

      "hiddenIngredients": [
        "Fish sauce in filling",
        "Possible egg wash on wrapper",
        "Shrimp in standard recipe"
      ],

      "recommendation": "⚠️ HIGH RISK - This dish likely contains shrimp in the filling, which poses severe risk for your shellfish allergy. Additionally, fish sauce is used extensively. We recommend AVOIDING this dish or verifying with restaurant staff that a shrimp-free version can be made.",

      "safetyScore": 0.25,
      "confidenceScore": 0.88
    },

    {
      "dishName": "Bún Bò Huế",
      "riskLevel": "SEVERE_RISK",

      "identifiedAllergens": [
        {
          "allergen": "shellfish",
          "source": "Mắm ruốc (fermented shrimp paste)",
          "likelihood": "definite",
          "severity": "severe",
          "explanation": "Bún Bò Huế ALWAYS contains mắm ruốc (fermented shrimp paste) as a core ingredient. This is non-negotiable in authentic recipes and gives the dish its signature purple-red color and umami flavor. This is a CRITICAL allergen for you."
        },
        {
          "allergen": "shellfish",
          "source": "Sa tế (chili oil)",
          "likelihood": "likely",
          "severity": "severe",
          "explanation": "Sa tế (Vietnamese chili oil) commonly contains dried shrimp extract for umami depth. This is often overlooked but poses additional shellfish risk."
        },
        {
          "allergen": "fish",
          "source": "Fish sauce in broth",
          "likelihood": "definite",
          "severity": "severe",
          "explanation": "Nước mắm (fish sauce) is used in the broth for seasoning."
        }
      ],

      "crossContaminationRisks": [
        {
          "source": "Shared broth pot",
          "allergen": "shellfish",
          "likelihood": "definite",
          "explanation": "All Bún Bò Huế servings come from the same pot containing mắm ruốc."
        }
      ],

      "hiddenIngredients": [
        "Mắm ruốc (MANDATORY in authentic recipes)",
        "Sa tế with dried shrimp",
        "Fish sauce throughout",
        "Possible pork blood (huyết)"
      ],

      "recommendation": "⛔ SEVERE RISK - AVOID THIS DISH COMPLETELY! Bún Bò Huế contains mắm ruốc (fermented shrimp paste) as a fundamental ingredient that cannot be removed. This poses extreme danger for your severe shellfish allergy. There is NO safe way to eat this dish with your allergen profile.",

      "safetyScore": 0.05,
      "confidenceScore": 0.98
    }
  ],

  "summary": {
    "totalItems": 2,
    "safeItems": 0,
    "warningItems": 0,
    "unsafeItems": 2,
    "overallRisk": "severe",
    "recommendation": "CRITICAL: 0/2 dishes are safe for your allergen profile. Both dishes contain shellfish allergens. Recommend choosing different items or consulting with restaurant staff about allergen-free alternatives."
  },

  "metadata": {
    "processingTime": 8500,
    "strictModeEnabled": true,
    "averageConfidence": 0.93,
    "allergenTypes": ["shellfish", "peanuts"],
    "language": "en"
  }
}
```

### Risk Levels:
- `SAFE` - No allergens detected
- `LOW_RISK` - Trace amounts possible
- `MEDIUM_RISK` - Likely contains allergen
- `HIGH_RISK` - Probably contains allergen
- `SEVERE_RISK` - Definitely contains allergen

---

## 5. PriceAnalysisService

### Input:
```typescript
{
  price: 50000,
  dish: {
    name: "Phở Bò",
    ingredients: [
      { canonicalName: "beef", isPrimary: true },
      { canonicalName: "rice noodles", isPrimary: true }
    ],
    cuisineRegion: "north_vietnam",
    baseDishType: "noodle_soup"
  },
  language: "en"
}
```

### Output:
```json
{
  "originalPrice": 50000,

  "convertedPrice": {
    "value": 2,
    "currency": "USD",
    "symbol": "$",
    "formatted": "$2.00"
  },

  "regional": {
    "region": "north_vietnam",
    "priceCategory": "moderate",
    "percentileInRegion": 62,
    "evaluation": "Moderately priced for Northern Vietnam"
  },

  "valueAnalysis": {
    "estimatedCost": 28000,
    "markup": 78,
    "valueForMoney": "good",
    "explanation": "Good value with 78% reasonable markup"
  },

  "ingredientCostBreakdown": [
    {
      "ingredient": "beef",
      "estimatedCost": 35000,
      "percentage": 50
    },
    {
      "ingredient": "rice noodles",
      "estimatedCost": 8000,
      "percentage": 11
    },
    {
      "ingredient": "herbs",
      "estimatedCost": 5000,
      "percentage": 7
    }
  ],

  "comparison": {
    "cheaperThan": 38,
    "moreExpensiveThan": 62,
    "averagePriceForType": 60000
  }
}
```

---

## 6. Final Formatted Response

### Complete Response Structure:
```json
{
  "success": true,
  "message": "Menu scan completed successfully",
  "language": "en",

  "data": {
    "extraction": {
      "menuSections": [
        {
          "sectionName": "Cloud Vision Extracted Items",
          "items": [
            {
              "name": "Chả Giò",
              "description": "Origin: Vietnam. Six crispy spring rolls...",
              "category": "Detected Dish",

              // Price info
              "priceOriginal": {
                "value": 0,
                "currency": "VND",
                "symbol": "₫",
                "formatted": "0₫"
              },
              "price": 0,
              "priceFormatted": "$0.00",
              "priceCurrency": "USD",
              "priceSymbol": "$",

              // Price analysis
              "priceAnalysis": null,

              // Dish details
              "dishDetails": {
                "canonicalName": "Vietnamese Fried Spring Rolls",
                "cuisineRegion": "south_vietnam",
                "baseDishType": "spring_rolls",
                "ingredients": [
                  { "name": "pork", "isPrimary": true },
                  { "name": "shrimp", "isPrimary": true },
                  { "name": "egg", "isPrimary": false }
                ],
                "allergenSignals": [
                  "likely_shellfish_in_filling",
                  "likely_fish_sauce_in_filling_and_sauce",
                  "likely_egg_in_filling"
                ],
                "dietaryProfile": {
                  "isLikelyVegetarian": false,
                  "isLikelyVegan": false,
                  "isLikelyGlutenFree": false,
                  "isLikelyDairyFree": true
                },
                "confidenceScore": 0.92
              }
            }
          ]
        }
      ],
      "metadata": {
        "totalItems": 1,
        "extractionQuality": "high",
        "confidenceScore": 0.94,
        "extractionMethod": "cloud-vision",
        "processingTime": 850
      }
    },

    "allergenAnalysis": {
      "analysis": [
        {
          "dishName": "Chả Giò",
          "riskLevel": "HIGH_RISK",
          "identifiedAllergens": [...],
          "recommendation": "⚠️ HIGH RISK - This dish likely contains shrimp...",
          "safetyScore": 0.25,
          "confidenceScore": 0.88
        }
      ],
      "summary": {
        "safeItems": 0,
        "unsafeItems": 1,
        "overallRisk": "high"
      },
      "translations": {
        "safe": "Safe",
        "warning": "Warning",
        "danger": "Danger",
        "contains": "Contains",
        "mayContain": "May contain",
        "free": "Free"
      }
    },

    "dietaryCompliance": null,

    "timeline": {
      "totalTime": 12500,
      "agents": 1
    }
  },

  "meta": {
    "statusMessages": {
      "success": "Menu scan completed successfully",
      "extractionMethod": "cloud-vision",
      "dishesFound": 1,
      "dishesFoundMessage": "1 dish(es) found"
    },
    "currency": {
      "code": "USD",
      "symbol": "$",
      "name": "US Dollar",
      "exchangeRateToVND": 25000
    },
    "locale": "en-US"
  }
}
```

---

## Performance Metrics

### Typical Response Times:

| Stage | Agent | Model | Time |
|-------|-------|-------|------|
| 0 | FoodImageValidation | Flash | 1-2s |
| 1 | CloudVision | Google Cloud Vision | 0.8-1.5s |
| 2 | DishUnderstanding | Flash | 2-3s (per dish, parallel) |
| 3 | AllergenSafety | Flash | 3-8s ✅ (was 8-15s with Pro) |
| 4 | DietaryCompliance | Flash | 3-5s |
| 5 | PriceAnalysis | Logic | 0.05s |
| 6 | Formatting | Logic | 0.1s |

**Total: 8-15s** (optimized from 15-25s)

---

## Error Handling

### Timeout Error (Fixed):
```json
{
  "statusCode": 500,
  "message": "CSAA_TIMEOUT: Allergen analysis took too long. Try analyzing fewer items.",
  "error": "Internal Server Error"
}
```

**Solution Applied:**
- ✅ Changed from Gemini Pro to Flash (5x faster)
- ✅ Increased timeout from 20s to 45s
- ✅ Now completes in 3-8s instead of timeout

### Validation Error:
```json
{
  "statusCode": 400,
  "message": [
    "userAllergens.0.type must be one of: peanuts, tree-nuts, shellfish..."
  ],
  "error": "Bad Request"
}
```

### Image Rejection:
```json
{
  "statusCode": 400,
  "code": "ERR_NOT_FOOD_IMAGE",
  "message": "Image rejected: Not a valid food image or low confidence.",
  "details": "Image appears to be a landscape photo with no food items visible"
}
```
