# Complete Workflow & Agent Architecture

## Overview Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER UPLOADS IMAGE                           │
│              POST /menu/upload/scan                             │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  STAGE 0: Image Validation (Gatekeeper)                        │
│  Agent: FoodImageValidationService                              │
│  Purpose: Validate image is food/menu                           │
│  Model: Gemini Flash                                            │
│  Time: ~1-2s                                                    │
│                                                                  │
│  Input:  Image buffer                                           │
│  Output: {                                                      │
│    isFoodImage: true,                                           │
│    category: "menu_photo" | "food_photo",                       │
│    confidence: 0.95,                                            │
│    reason: "High confidence menu detection"                     │
│  }                                                              │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │  Is menu_photo?        │
        └───────┬────────────────┘
                │
      ┌─────────┴─────────┐
      │ YES              │ NO
      ▼                   ▼
┌──────────────┐    ┌──────────────────┐
│ BRANCH A:    │    │ BRANCH B:        │
│ Menu Photo   │    │ Food Photo       │
└──────┬───────┘    └────────┬─────────┘
       │                     │
       ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  STAGE 1A: Text Extraction (Menu Photo)                        │
│  Agents: CloudVisionAgent OR VisualExtractionAgent             │
│  Purpose: Extract dish names from menu                          │
│  Model: Cloud Vision API OR Gemini Pro                         │
│  Time: ~1-3s                                                    │
│                                                                  │
│  Option 1 - Cloud Vision (if useCloudVision: true):            │
│  Input:  Image base64                                           │
│  Output: {                                                      │
│    fullText: "PHỞ BÒ 50,000đ\nBÚN CHẢ 45,000đ...",            │
│    textAnnotations: [...],                                      │
│    labelAnnotations: [...],                                     │
│    metadata: { processingTime: 850, confidence: 0.94 }          │
│  }                                                              │
│  → Then: extractDishNamesFromOCR() → ["PHỞ BÒ", "BÚN CHẢ"]   │
│                                                                  │
│  Option 2 - Visual Extraction (Gemini):                        │
│  Input:  Image base64 + language                                │
│  Output: {                                                      │
│    menuSections: [                                              │
│      {                                                          │
│        sectionName: "Món Chính",                               │
│        items: [                                                 │
│          { name: "Phở Bò", price: 50000, description: "..." }  │
│        ]                                                        │
│      }                                                          │
│    ],                                                           │
│    metadata: { totalItems: 15, confidence: 0.92 }              │
│  }                                                              │
└────────────────────┬────────────────────────────────────────────┘
                     │                     │
                     │           ┌─────────────────────────────────┐
                     │           │ STAGE 1B: Dish Recognition      │
                     │           │ Agent: DishRecognitionAgent     │
                     │           │ Purpose: Identify dishes in     │
                     │           │          food photo             │
                     │           │ Model: Gemini Pro               │
                     │           │ Time: ~2-4s                     │
                     │           │                                 │
                     │           │ Input:  Image base64            │
                     │           │ Output: {                       │
                     │           │   dishes: [                     │
                     │           │     {                           │
                     │           │       detectedDishName: "Chả   │
                     │           │       Giò",                     │
                     │           │       cuisineOrigin: "Vietnam", │
                     │           │       confidenceScore: 0.95     │
                     │           │     }                           │
                     │           │   ]                             │
                     │           │ }                               │
                     └───────────┴─────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│  STAGE 2: Dish Understanding (AI Culinary Knowledge)           │
│  Agent: DishUnderstandingAgent (DUIA)                          │
│  Purpose: Understand ingredients, allergens, cooking methods    │
│  Model: Gemini Flash (Fast & Accurate)                         │
│  Time: ~2-3s per dish (parallel processing)                    │
│  Caching: Yes (24h TTL)                                        │
│                                                                  │
│  Input:  {                                                      │
│    dishes: [                                                    │
│      {                                                          │
│        dishId: "dish_001",                                      │
│        dishName: "Phở Bò",                                     │
│        description: "...",                                      │
│        language: "vi"                                           │
│      }                                                          │
│    ]                                                            │
│  }                                                              │
│                                                                  │
│  Output: {                                                      │
│    dishes: [                                                    │
│      {                                                          │
│        dishId: "dish_001",                                      │
│        originalName: "Phở Bò",                                 │
│        canonicalName: "Pho Bo (Beef Noodle Soup)",            │
│        ingredients: [                                           │
│          {                                                      │
│            name: "beef",                                        │
│            canonicalName: "beef",                              │
│            isPrimary: true,                                     │
│            estimatedPresence: "mandatory"                       │
│          },                                                     │
│          {                                                      │
│            name: "nước mắm",                                   │
│            canonicalName: "fish sauce",                        │
│            isPrimary: false,                                    │
│            estimatedPresence: "common"                          │
│          }                                                      │
│        ],                                                       │
│        cookingMethods: ["boiled", "simmered"],                 │
│        baseDishType: "noodle_soup",                            │
│        cuisineRegion: "north_vietnam",                         │
│        dietaryProfile: {                                        │
│          isLikelyVegetarian: false,                            │
│          isLikelyVegan: false,                                 │
│          isLikelyGlutenFree: false,                            │
│          isLikelyDairyFree: true,                              │
│          notes: "Contains beef and fish sauce"                 │
│        },                                                       │
│        inferredAllergenSignals: [                              │
│          "likely_fish_sauce_in_broth",                         │
│          "possible_gluten_from_soy_sauce"                      │
│        ],                                                       │
│        confidenceScore: 0.95,                                  │
│        reasoningSummary: "Traditional Hanoi beef pho..."       │
│      }                                                          │
│    ],                                                           │
│    metadata: {                                                  │
│      totalDishes: 1,                                            │
│      averageConfidence: 0.95,                                  │
│      processingTime: 2850                                       │
│    }                                                            │
│  }                                                              │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  STAGE 3: Safety & Compliance Analysis (PARALLEL)              │
│  Orchestrator: AgentOrchestratorService                        │
│  Purpose: Run multiple agents in parallel                       │
│  Time: Max of all agents (~8-15s)                              │
└─────────────────────┬───────────────────────────────────────────┘
                      │
        ┌─────────────┴──────────────┐
        │                            │
        ▼                            ▼
┌──────────────────────┐   ┌─────────────────────────┐
│ AGENT 1:             │   │ AGENT 2:                │
│ AllergenSafetyAgent  │   │ DietaryComplianceAgent  │
│ (if allergens exist) │   │ (if restrictions exist) │
└──────────┬───────────┘   └────────┬────────────────┘
           │                        │
           ▼                        ▼

┌─────────────────────────────────────────────────────────────────┐
│  AGENT 1: AllergenSafetyAgent                                   │
│  Purpose: Detect allergens and assess risk                      │
│  Model: Gemini Pro                                              │
│  Time: ~8-15s (CURRENT BOTTLENECK!)                            │
│  Timeout: 20s (default)                                         │
│                                                                  │
│  Input:  {                                                      │
│    menuItems: [...],                                            │
│    enrichedItems: [...], // From DishUnderstandingAgent        │
│    userAllergens: [                                             │
│      { type: "shellfish", severity: "severe" },                │
│      { type: "peanuts", severity: "moderate" }                 │
│    ],                                                           │
│    strictMode: true,                                            │
│    language: "en"                                               │
│  }                                                              │
│                                                                  │
│  Process:                                                       │
│  1. Build detailed prompt with user allergens                   │
│  2. Include enriched dish data (ingredients, allergen signals)  │
│  3. Call Gemini Pro with structured JSON schema                │
│  4. Parse response                                              │
│  5. Validate output                                             │
│                                                                  │
│  Output: {                                                      │
│    analysis: [                                                  │
│      {                                                          │
│        dishName: "Chả Giò",                                    │
│        riskLevel: "MEDIUM_RISK",                               │
│        identifiedAllergens: [                                   │
│          {                                                      │
│            allergen: "shellfish",                              │
│            source: "Shrimp filling",                           │
│            likelihood: "likely",                               │
│            severity: "severe",                                 │
│            explanation: "Spring rolls often contain shrimp"    │
│          }                                                      │
│        ],                                                       │
│        crossContaminationRisks: [                              │
│          {                                                      │
│            source: "Deep frying oil",                          │
│            allergen: "shellfish",                              │
│            likelihood: "possible"                              │
│          }                                                      │
│        ],                                                       │
│        recommendation: "⚠️ ASK STAFF - Likely contains        │
│                         shrimp, verify ingredients",            │
│        safetyScore: 0.4,                                       │
│        confidenceScore: 0.85                                   │
│      }                                                          │
│    ],                                                           │
│    summary: {                                                   │
│      safeItems: 3,                                              │
│      warningItems: 2,                                           │
│      unsafeItems: 1,                                            │
│      overallRisk: "medium",                                    │
│      recommendation: "3/6 items safe. Avoid Bún Bò Huế"       │
│    },                                                           │
│    metadata: {                                                  │
│      processingTime: 12500,                                    │
│      averageConfidence: 0.88,                                  │
│      strictModeEnabled: true                                   │
│    }                                                            │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  AGENT 2: DietaryComplianceAgent                               │
│  Purpose: Check dietary restrictions compliance                 │
│  Model: Gemini Flash                                            │
│  Time: ~3-5s                                                    │
│  Timeout: 30s                                                   │
│                                                                  │
│  Input:  {                                                      │
│    menuItems: [...],                                            │
│    dietaryRestrictions: ["vegan", "gluten-free"],              │
│    context: "Strict vegan diet"                                │
│  }                                                              │
│                                                                  │
│  Output: {                                                      │
│    results: [                                                   │
│      {                                                          │
│        dishName: "Phở Chay",                                   │
│        status: "POSSIBLY_NON_COMPLIANT",                       │
│        confidence: "medium",                                    │
│        complianceScore: 0.6,                                   │
│        nonCompliantIngredients: [                              │
│          {                                                      │
│            ingredient: "Fish sauce (possible)",                │
│            reason: "Many chay dishes use fish sauce",          │
│            violates: "vegan"                                   │
│          }                                                      │
│        ],                                                       │
│        reasoning: "Verify fish sauce usage",                   │
│        alternatives: [                                          │
│          { dishName: "Gỏi Cuốn Chay", similarity: 0.7 }       │
│        ]                                                        │
│      }                                                          │
│    ],                                                           │
│    summary: {                                                   │
│      compliantCount: 2,                                         │
│      nonCompliantCount: 4,                                     │
│      uncertainCount: 1                                          │
│    }                                                            │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘

                     ┌────────────────┐
                     │ Wait for both  │
                     │ agents to      │
                     │ complete       │
                     └────────┬───────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STAGE 4: Response Formatting                                   │
│  Service: MenuService.formatScanResponse()                      │
│  Purpose: Format with i18n, price analysis, translations        │
│  Time: ~100-200ms                                               │
│                                                                  │
│  Process:                                                       │
│  1. Set language (i18nService.setLanguage())                   │
│  2. Convert prices to target currency                           │
│  3. Perform price analysis for each dish                        │
│  4. Add allergen translations                                   │
│  5. Add dietary compliance translations                         │
│  6. Build final response                                        │
│                                                                  │
│  Output: {                                                      │
│    success: true,                                               │
│    message: "Menu scan completed successfully",                │
│    language: "en",                                              │
│    data: {                                                      │
│      extraction: { ... },                                       │
│      allergenAnalysis: { ... },                                │
│      dietaryCompliance: { ... },                               │
│      timeline: { totalTime: 15200, agents: 2 }                 │
│    },                                                           │
│    meta: {                                                      │
│      statusMessages: { ... },                                  │
│      currency: { code: "USD", symbol: "$", ... },              │
│      locale: "en-US"                                            │
│    }                                                            │
│  }                                                              │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
            ┌────────────────┐
            │ Return to User │
            └────────────────┘
```

---

## Agent Details & Responsibilities

### **0. FoodImageValidationService** (Gatekeeper)
- **Model**: Gemini Flash
- **Purpose**: Validate image is food/menu
- **Input**: Image buffer
- **Output**: `{ isFoodImage, category, confidence, reason }`
- **Time**: ~1-2s
- **Decision**: Route to menu/food pipeline

---

### **1. CloudVisionAgent** (OCR Specialist)
- **Model**: Google Cloud Vision API
- **Purpose**: Fast, accurate OCR for menu text
- **Input**: Image base64
- **Output**: `{ fullText, textAnnotations, labelAnnotations }`
- **Time**: ~1s
- **Advantage**: 5x faster than Gemini for pure OCR

---

### **2. VisualExtractionAgent** (Gemini Menu Parser)
- **Model**: Gemini Pro
- **Purpose**: Extract structured menu with prices
- **Input**: Image base64 + language
- **Output**: `{ menuSections: [...], metadata }`
- **Time**: ~2-3s
- **Advantage**: Understands context, prices, sections

---

### **3. DishRecognitionAgent** (Food Photo Specialist)
- **Model**: Gemini Pro
- **Purpose**: Identify dishes in food photos
- **Input**: Image base64
- **Output**: `{ dishes: [{ detectedDishName, cuisineOrigin, confidence }] }`
- **Time**: ~2-4s
- **Use case**: When user uploads food photo, not menu

---

### **4. DishUnderstandingAgent** (Culinary Expert) ⭐
- **Model**: Gemini Flash
- **Purpose**: Deep ingredient & allergen knowledge
- **Input**: Dish names
- **Output**: Full ingredient list, allergen signals, dietary profile
- **Time**: ~2-3s per dish (parallel)
- **Caching**: 24h TTL
- **Special**: Vietnamese cuisine domain knowledge

**Output Structure:**
```json
{
  "originalName": "Bún Bò Huế",
  "canonicalName": "Bun Bo Hue (Spicy Beef Noodle Soup)",
  "ingredients": [
    { "name": "beef", "isPrimary": true, "estimatedPresence": "mandatory" },
    { "name": "fermented shrimp paste", "isPrimary": true, "estimatedPresence": "mandatory" }
  ],
  "cookingMethods": ["boiled", "braised"],
  "baseDishType": "noodle_soup",
  "cuisineRegion": "central_vietnam",
  "dietaryProfile": {
    "isLikelyVegetarian": false,
    "isLikelyVegan": false,
    "isLikelyGlutenFree": false,
    "isLikelyDairyFree": true
  },
  "inferredAllergenSignals": [
    "possible_shellfish_from_mam_ruoc",
    "likely_fish_sauce_in_broth"
  ],
  "confidenceScore": 0.95
}
```

---

### **5. AllergenSafetyAgent** (Safety Guardian) ⚠️ SLOW
- **Model**: Gemini Pro
- **Purpose**: Detect allergens & assess risk
- **Input**: Menu items + enriched dishes + user allergens
- **Output**: Risk analysis per dish
- **Time**: ~8-15s (BOTTLENECK!)
- **Timeout**: 20s (need to increase to 60s)
- **Issue**: Complex prompt + large response

**Output Structure:**
```json
{
  "analysis": [
    {
      "dishName": "Bún Bò Huế",
      "riskLevel": "SEVERE_RISK",
      "identifiedAllergens": [
        {
          "allergen": "shellfish",
          "source": "Mắm ruốc (fermented shrimp paste)",
          "likelihood": "definite",
          "severity": "severe"
        }
      ],
      "crossContaminationRisks": [...],
      "recommendation": "⛔ AVOID THIS DISH!",
      "safetyScore": 0.1,
      "confidenceScore": 0.95
    }
  ],
  "summary": {
    "safeItems": 3,
    "unsafeItems": 2,
    "overallRisk": "high"
  }
}
```

---

### **6. DietaryComplianceAgent** (Diet Police)
- **Model**: Gemini Flash
- **Purpose**: Check dietary restrictions
- **Input**: Menu items + restrictions
- **Output**: Compliance status per dish
- **Time**: ~3-5s
- **Timeout**: 30s

**Output Structure:**
```json
{
  "results": [
    {
      "dishName": "Phở Chay",
      "status": "POSSIBLY_NON_COMPLIANT",
      "confidence": "medium",
      "complianceScore": 0.6,
      "nonCompliantIngredients": [
        {
          "ingredient": "Fish sauce (possible)",
          "reason": "Many chay dishes use fish sauce",
          "violates": "vegan"
        }
      ],
      "alternatives": [...]
    }
  ],
  "summary": {
    "compliantCount": 2,
    "nonCompliantCount": 4
  }
}
```

---

### **7. NutritionCoachAgent** (Health Advisor)
- **Model**: Gemini Pro
- **Purpose**: Personalized nutrition recommendations
- **Input**: User profile + menu items
- **Output**: Daily targets, recommendations
- **Time**: ~5-8s
- **Use case**: Optional, when user provides profile

---

### **8. PriceAnalysisService** (Price Expert)
- **Model**: None (Pure logic)
- **Purpose**: Regional price evaluation & value analysis
- **Input**: Price + dish ingredients + region
- **Output**: Price category, value for money, comparison
- **Time**: ~50ms per dish

---

## Performance Breakdown

| Stage | Agent | Model | Time | Cacheable |
|-------|-------|-------|------|-----------|
| 0 | Image Validation | Gemini Flash | 1-2s | No |
| 1 | Cloud Vision / Visual Extraction | Cloud Vision / Gemini Pro | 1-3s | No |
| 2 | Dish Understanding | Gemini Flash | 2-3s × N dishes (parallel) | ✅ Yes (24h) |
| 3a | Allergen Safety | Gemini Pro | 8-15s ⚠️ | No |
| 3b | Dietary Compliance | Gemini Flash | 3-5s | No |
| 4 | Price Analysis | Logic | 50ms | No |
| 5 | Response Formatting | Logic | 100ms | No |

**Total Time:**
- **Best case** (cache hit): ~5-8s
- **Average case**: ~12-18s
- **Worst case** (timeout): 20s+

---

## Current Issues

### ⚠️ **Issue 1: AllergenSafetyAgent Timeout**
```
Error: Agent timeout after 20000ms
```

**Root Cause:**
1. Using Gemini Pro (slower than Flash)
2. Complex prompt with enriched data
3. Analyzing multiple dishes at once
4. 20s timeout too short

**Solution:**
1. ✅ Increase timeout to 60s
2. ✅ Switch to Gemini Flash for speed
3. ✅ Simplify prompt
4. ✅ Analyze fewer dishes at a time

---

## Next Steps

1. **Fix AllergenSafetyAgent timeout**
2. **Optimize prompt length**
3. **Consider batching dishes**
4. **Add retry mechanism**
