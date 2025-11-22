# API Test Endpoints cho AI Agents

API endpoints để test từng AI agent riêng lẻ hoặc toàn bộ workflow.

## Base URL
```
http://localhost:3000/menu
```

## 1. Full Menu Scan (Tất cả Agents)

**Endpoint:** `POST /menu/scan`

Quét menu image và chạy tất cả agents song song (Visual Extraction + Allergen Safety + Dietary Compliance).

**Request Body:**
```json
{
  "imageData": "base64_encoded_image_data",
  "mimeType": "image/jpeg",
  "language": "vi",
  "extractionMode": "quick",
  "strictAllergenMode": true,
  "outputLanguage": "en",
  "userAllergens": [
    {
      "type": "peanuts",
      "severity": "severe"
    }
  ],
  "dietaryRestrictions": ["vegan", "gluten-free"]
}
```

---

## 2. Test Visual Extraction Agent

**Endpoint:** `POST /menu/test/visual-extraction`

Chỉ test agent trích xuất menu từ ảnh.

**Request Body:**
```json
{
  "imageData": "base64_encoded_image_data",
  "mimeType": "image/jpeg",
  "language": "vi",
  "extractionMode": "quick"
}
```

**Response Example:**
```json
{
  "agent": "VisualExtractionAgent",
  "result": {
    "restaurantName": "Phở Hà Nội",
    "menuSections": [
      {
        "sectionName": "Món Nước",
        "items": [
          {
            "name": "Phở Bò",
            "description": "Phở bò truyền thống",
            "price": 50000,
            "category": "Món Nước"
          }
        ]
      }
    ],
    "metadata": {
      "totalItems": 15,
      "extractionQuality": "high",
      "confidenceScore": 0.95
    }
  }
}
```

---

## 3. Test Allergen Safety Agent

**Endpoint:** `POST /menu/test/allergen-safety`

Test agent phân tích rủi ro dị ứng từ danh sách món ăn.

**Request Body:**
```json
{
  "menuItems": [
    {
      "name": "Phở Bò",
      "description": "Phở bò truyền thống với nước dùng xương",
      "price": 50000
    },
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
}
```

**Response Example:**
```json
{
  "agent": "AllergenSafetyAgent",
  "result": {
    "analysis": [
      {
        "dishName": "Phở Bò",
        "riskLevel": "SAFE",
        "identifiedAllergens": [],
        "reasoning": "Dish contains beef broth and rice noodles. No shellfish detected.",
        "confidenceScore": 0.9
      },
      {
        "dishName": "Bún Đậu Mắm Tôm",
        "riskLevel": "SEVERE_RISK",
        "identifiedAllergens": [
          {
            "allergen": "shellfish",
            "source": "Mắm Tôm (shrimp paste)",
            "likelihood": "definite",
            "severity": "severe"
          }
        ],
        "reasoning": "Mắm Tôm contains concentrated shrimp paste which is extremely dangerous for shellfish allergies.",
        "confidenceScore": 1.0,
        "recommendations": ["Avoid this dish completely", "Ask for no Mắm Tôm"],
        "alternativeDishes": ["Bún Chả (with fish sauce instead)"]
      }
    ],
    "summary": {
      "safeItems": 1,
      "warningItems": 0,
      "unsafeItems": 1,
      "overallRisk": "high"
    }
  }
}
```

---

## 4. Test Dietary Compliance Agent

**Endpoint:** `POST /menu/test/dietary-compliance`

Test agent kiểm tra tuân thủ chế độ ăn uống.

**Request Body:**
```json
{
  "menuItems": [
    {
      "name": "Phở Chay",
      "description": "Phở chay với nước dùng rau củ",
      "price": 45000
    },
    {
      "name": "Cơm Gà",
      "description": "Cơm gà Hải Nam",
      "price": 55000
    }
  ],
  "dietaryRestrictions": ["vegan", "halal"],
  "context": "User wants authentic Vietnamese food but needs vegan options"
}
```

**Response Example:**
```json
{
  "agent": "DietaryComplianceAgent",
  "result": {
    "results": [
      {
        "dishName": "Phở Chay",
        "status": "POSSIBLY_NON_COMPLIANT",
        "confidence": "medium",
        "complianceScore": 0.6,
        "nonCompliantIngredients": [
          {
            "ingredient": "Fish sauce (possible)",
            "reason": "Many 'chay' dishes still use fish sauce for flavor",
            "violates": "vegan",
            "confidence": "medium"
          }
        ],
        "compliantIngredients": ["Rice noodles", "Vegetables", "Tofu"],
        "uncertainIngredients": ["Broth seasonings"],
        "reasoning": "Phở Chay is labeled vegetarian but may contain fish sauce. Verify with restaurant that no fish sauce or animal products are used.",
        "alternatives": [
          {
            "dishName": "Gỏi Cuốn Chay",
            "reason": "Fresh spring rolls with tofu - easier to verify ingredients",
            "similarityScore": 0.7
          }
        ],
        "notes": ["Ask restaurant to confirm no fish sauce", "Request vegetable broth only"]
      },
      {
        "dishName": "Cơm Gà",
        "status": "NON_COMPLIANT",
        "confidence": "high",
        "complianceScore": 0.0,
        "nonCompliantIngredients": [
          {
            "ingredient": "Chicken",
            "reason": "Contains meat",
            "violates": "vegan",
            "confidence": "high"
          }
        ],
        "compliantIngredients": ["Rice"],
        "uncertainIngredients": [],
        "reasoning": "Contains chicken which violates vegan diet. Halal compliance depends on slaughter method.",
        "alternatives": [
          {
            "dishName": "Cơm Chiên Chay",
            "reason": "Vegan fried rice option",
            "similarityScore": 0.8
          }
        ]
      }
    ],
    "summary": {
      "totalDishes": 2,
      "compliantCount": 0,
      "nonCompliantCount": 1,
      "uncertainCount": 1,
      "complianceRate": 0.0
    },
    "recommendations": [
      "Always verify 'chay' dishes don't contain fish sauce",
      "Look for restaurants specializing in vegetarian/vegan cuisine",
      "Ask about cooking oil (avoid animal fats)"
    ],
    "warnings": [
      "Vietnamese cuisine heavily uses fish sauce - always verify with staff"
    ]
  }
}
```

---

## 5. Test Nutrition Coach Agent

**Endpoint:** `POST /menu/test/nutrition-coach`

Test agent tư vấn dinh dưỡng cá nhân hóa.

**Request Body (Daily Targets):**
```json
{
  "age": 30,
  "gender": "male",
  "weight": 70,
  "height": 175,
  "activityLevel": "moderate",
  "goal": "weight-loss",
  "healthConditions": ["hypertension"],
  "dietaryPreferences": ["mediterranean"],
  "requestType": "daily-targets"
}
```

**Request Body (Meal Plan):**
```json
{
  "age": 25,
  "gender": "female",
  "weight": 60,
  "height": 165,
  "activityLevel": "active",
  "goal": "muscle-gain",
  "requestType": "meal-plan",
  "timeframe": "daily"
}
```

**Response Example:**
```json
{
  "agent": "NutritionCoachAgent",
  "result": {
    "dailyTargets": {
      "calories": 2000,
      "protein": 150,
      "carbs": 200,
      "fats": 67,
      "fiber": 30,
      "sodium": 1500,
      "sugar": 30,
      "macroRatio": {
        "protein": 30,
        "carbs": 40,
        "fats": 30
      }
    },
    "recommendations": [
      {
        "category": "calories",
        "priority": "high",
        "text": "Your daily calorie target is 2000. This represents a 20% deficit for safe weight loss of 0.5-1kg per week.",
        "scientificBasis": "Based on Mifflin-St Jeor equation for BMR calculation"
      },
      {
        "category": "macros",
        "priority": "high",
        "text": "High protein (30%) helps preserve muscle mass during weight loss and increases satiety.",
        "scientificBasis": "Studies show 1.6-2.2g protein per kg bodyweight optimal for fat loss"
      },
      {
        "category": "micronutrients",
        "priority": "medium",
        "text": "Limit sodium to 1500mg/day due to hypertension. Avoid salty Vietnamese sauces like fish sauce and soy sauce.",
        "scientificBasis": "DASH diet recommendation for blood pressure control"
      }
    ],
    "warnings": [
      "Consult your doctor before making major dietary changes due to hypertension",
      "Monitor blood pressure regularly while adjusting diet"
    ],
    "insights": [
      "Vietnamese cuisine can be adapted for weight loss - focus on Phở, Gỏi, grilled meats",
      "Avoid fried foods like Chả Giò, Bánh Xèo during weight loss phase",
      "Use lemon/lime instead of salt for flavoring to reduce sodium"
    ]
  }
}
```

---

## Field Descriptions

### Allergen Types
- `peanuts`, `tree-nuts`, `shellfish`, `fish`, `eggs`, `dairy`, `soy`, `wheat`, `gluten`, `sesame`, `msg`, `sulfites`

### Allergen Severity
- `mild`: Minor discomfort
- `moderate`: Noticeable symptoms
- `severe`: Significant health impact
- `life-threatening`: Anaphylaxis risk

### Dietary Restrictions
- `vegan`, `vegetarian`, `halal`, `kosher`, `low-carb`, `keto`, `paleo`, `mediterranean`, `gluten-free`, `dairy-free`, `pescatarian`

### Activity Levels
- `sedentary`: Little/no exercise
- `light`: Exercise 1-3 days/week
- `moderate`: Exercise 3-5 days/week
- `active`: Exercise 6-7 days/week
- `very-active`: Hard exercise daily + physical job

### Nutrition Goals
- `weight-loss`: Lose fat
- `weight-gain`: Gain weight
- `maintain`: Maintain current weight
- `muscle-gain`: Build muscle
- `general-health`: Overall health

---

## Testing Tips

1. **Để test với ảnh menu thật:**
   - Chụp ảnh menu hoặc download sample
   - Convert sang base64: `base64 -i menu.jpg`
   - Paste base64 string vào `imageData`

2. **Test từng agent riêng:**
   - Visual Extraction trước để lấy `menuItems`
   - Dùng `menuItems` để test Allergen Safety và Dietary Compliance
   - Nutrition Coach không cần `menuItems` cho `daily-targets`

3. **Các trường hợp test quan trọng:**
   - Món có dị ứng ẩn (fish sauce trong món chay)
   - Món vi phạm nhiều dietary restrictions
   - User với nhiều health conditions
   - Menu image chất lượng thấp

4. **Expected Response Times:**
   - Visual Extraction: 3-5 giây
   - Allergen Safety: 2-4 giây  
   - Dietary Compliance: 3-5 giây
   - Nutrition Coach: 2-3 giây
   - Full Scan: 5-8 giây (parallel execution)

---

## Error Handling

Tất cả endpoints sẽ return error trong format:
```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Bad Request"
}
```

Common errors:
- `400`: Invalid input (missing fields, wrong types)
- `500`: Agent execution failed (Gemini API error)
- `413`: Image too large (limit: 4MB)
