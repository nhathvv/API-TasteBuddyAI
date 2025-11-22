# Chi tiết Response API với Price Analysis & Multi-Language

## Ví dụ Response đầy đủ (Vietnamese)

### Request:
```http
POST /menu/upload/scan
Content-Type: multipart/form-data

image: [menu.jpg]
language: "vi"
allergens: '[{"type":"shellfish","severity":"severe"}]'
```

### Response:
```json
{
  "success": true,
  "message": "Quét thực đơn hoàn tất",
  "language": "vi",
  "data": {
    "extraction": {
      "menuSections": [
        {
          "sectionName": "Món Chính",
          "items": [
            {
              "name": "Phở Bò",
              "description": "Phở bò truyền thống Hà Nội",
              "category": "Món Chính",

              // ===== PRICE INFORMATION =====
              "priceOriginal": {
                "value": 50000,
                "currency": "VND",
                "symbol": "₫",
                "formatted": "50,000₫"
              },
              "price": 50000,
              "priceFormatted": "50,000₫",
              "priceCurrency": "VND",
              "priceSymbol": "₫",

              // ===== PRICE ANALYSIS (NEW!) =====
              "priceAnalysis": {
                "originalPrice": 50000,
                "convertedPrice": {
                  "value": 50000,
                  "currency": "VND",
                  "symbol": "₫",
                  "formatted": "50,000₫"
                },

                // Regional price evaluation
                "regional": {
                  "region": "north_vietnam",
                  "priceCategory": "moderate",  // cheap | moderate | expensive | premium
                  "percentileInRegion": 62,     // 62% = Rẻ hơn 38% món khác, đắt hơn 62% món
                  "evaluation": "Giá trung bình so với khu vực Miền Bắc"
                },

                // Value for money analysis
                "valueAnalysis": {
                  "estimatedCost": 28000,       // Chi phí nguyên liệu ước tính
                  "markup": 78,                 // % lợi nhuận (50k - 28k)/28k = 78%
                  "valueForMoney": "good",      // excellent | good | fair | poor
                  "explanation": "Giá trị tốt với mức tăng 78% hợp lý"
                },

                // Ingredient cost breakdown
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

                // Market comparison
                "comparison": {
                  "cheaperThan": 38,           // Rẻ hơn 38% món tương tự
                  "moreExpensiveThan": 62,     // Đắt hơn 62% món tương tự
                  "averagePriceForType": 60000 // Giá trung bình loại này
                }
              },

              // ===== DISH DETAILS (NEW!) =====
              "dishDetails": {
                "canonicalName": "Pho Bo (Beef Noodle Soup)",
                "cuisineRegion": "north_vietnam",
                "baseDishType": "noodle_soup",

                // Ingredients (top 5)
                "ingredients": [
                  {
                    "name": "beef",
                    "isPrimary": true
                  },
                  {
                    "name": "rice noodles",
                    "isPrimary": true
                  },
                  {
                    "name": "herbs",
                    "isPrimary": false
                  },
                  {
                    "name": "bean sprouts",
                    "isPrimary": false
                  },
                  {
                    "name": "fish sauce",
                    "isPrimary": false
                  }
                ],

                // Allergen signals
                "allergenSignals": [
                  "likely_fish_sauce_in_broth",
                  "possible_gluten_from_soy_sauce"
                ],

                // Dietary profile
                "dietaryProfile": {
                  "isLikelyVegetarian": false,
                  "isLikelyVegan": false,
                  "isLikelyGlutenFree": false,
                  "isLikelyDairyFree": true,
                  "notes": "Contains beef and fish sauce. Not suitable for vegetarians."
                },

                "confidenceScore": 0.95
              }
            },

            {
              "name": "Bún Bò Huế",
              "description": "Bún bò Huế cay nồng",
              "category": "Món Chính",

              "priceOriginal": {
                "value": 55000,
                "currency": "VND",
                "symbol": "₫",
                "formatted": "55,000₫"
              },
              "price": 55000,
              "priceFormatted": "55,000₫",
              "priceCurrency": "VND",
              "priceSymbol": "₫",

              // ===== PRICE ANALYSIS =====
              "priceAnalysis": {
                "originalPrice": 55000,
                "convertedPrice": {
                  "value": 55000,
                  "currency": "VND",
                  "symbol": "₫",
                  "formatted": "55,000₫"
                },

                "regional": {
                  "region": "central_vietnam",  // Bún Bò Huế = Miền Trung
                  "priceCategory": "expensive",  // Đắt hơn mức trung bình Miền Trung
                  "percentileInRegion": 78,      // Đắt hơn 78% món trong khu vực
                  "evaluation": "Giá cao so với mức trung bình khu vực Miền Trung"
                },

                "valueAnalysis": {
                  "estimatedCost": 32000,
                  "markup": 71,
                  "valueForMoney": "good",
                  "explanation": "Giá trị tốt với mức tăng 71% hợp lý"
                },

                "ingredientCostBreakdown": [
                  {
                    "ingredient": "beef",
                    "estimatedCost": 35000,
                    "percentage": 48
                  },
                  {
                    "ingredient": "fermented shrimp paste",
                    "estimatedCost": 15000,
                    "percentage": 21
                  },
                  {
                    "ingredient": "rice vermicelli",
                    "estimatedCost": 6000,
                    "percentage": 8
                  }
                ],

                "comparison": {
                  "cheaperThan": 22,
                  "moreExpensiveThan": 78,
                  "averagePriceForType": 52500
                }
              },

              "dishDetails": {
                "canonicalName": "Bun Bo Hue (Spicy Beef Noodle Soup)",
                "cuisineRegion": "central_vietnam",
                "baseDishType": "noodle_soup",

                "ingredients": [
                  {
                    "name": "beef",
                    "isPrimary": true
                  },
                  {
                    "name": "fermented shrimp paste (mắm ruốc)",
                    "isPrimary": true
                  },
                  {
                    "name": "rice vermicelli",
                    "isPrimary": true
                  },
                  {
                    "name": "lemongrass",
                    "isPrimary": false
                  },
                  {
                    "name": "chili oil",
                    "isPrimary": false
                  }
                ],

                "allergenSignals": [
                  "possible_shellfish_from_mam_ruoc",  // ⚠️ DỊ ỨNG TÔM HÙM!
                  "likely_fish_sauce_in_broth",
                  "possible_dried_shrimp_in_sa_te"
                ],

                "dietaryProfile": {
                  "isLikelyVegetarian": false,
                  "isLikelyVegan": false,
                  "isLikelyGlutenFree": false,
                  "isLikelyDairyFree": true,
                  "notes": "Contains beef, fermented shrimp paste (mắm ruốc), and fish sauce. High shellfish allergen risk."
                },

                "confidenceScore": 0.92
              }
            }
          ]
        }
      ],
      "metadata": {
        "totalItems": 2,
        "extractionQuality": "high",
        "confidenceScore": 0.94,
        "extractionMethod": "cloud-vision",
        "processingTime": 850
      }
    },

    // ===== ALLERGEN ANALYSIS =====
    "allergenAnalysis": {
      "analysis": [
        {
          "dishName": "Phở Bò",
          "riskLevel": "SAFE",
          "identifiedAllergens": [],
          "recommendation": "Món này an toàn với dị ứng tôm hùm của bạn",
          "safetyScore": 1.0,
          "confidenceScore": 0.95
        },
        {
          "dishName": "Bún Bò Huế",
          "riskLevel": "SEVERE_RISK",  // ⚠️ NGUY HIỂM!
          "identifiedAllergens": [
            {
              "allergen": "shellfish",
              "source": "Mắm ruốc (fermented shrimp paste)",
              "likelihood": "definite",
              "severity": "severe",
              "explanation": "Bún bò Huế truyền thống luôn có mắm ruốc, một loại tôm lên men đậm đặc"
            },
            {
              "allergen": "shellfish",
              "source": "Sa tế (chili oil)",
              "likelihood": "possible",
              "severity": "severe",
              "explanation": "Sa tế có thể chứa tôm khô nghiền"
            }
          ],
          "recommendation": "⛔ TRÁNH MÓN NÀY! Chứa mắm ruốc (lên men từ tôm) - nguy hiểm cao với dị ứng shellfish nghiêm trọng của bạn",
          "safetyScore": 0.1,
          "confidenceScore": 0.95
        }
      ],

      "summary": {
        "safeItems": 1,
        "unsafeItems": 1,
        "warningItems": 0,
        "overallRisk": "high",
        "recommendation": "1/2 món an toàn. Tránh Bún Bò Huế."
      },

      "translations": {
        "safe": "An toàn",
        "warning": "Cảnh báo",
        "danger": "Nguy hiểm",
        "contains": "Có chứa",
        "mayContain": "Có thể chứa",
        "free": "Không chứa"
      }
    },

    "dietaryCompliance": null,

    "timeline": {
      "totalTime": 9500,
      "agents": 1
    }
  },

  // ===== METADATA =====
  "meta": {
    "statusMessages": {
      "success": "Quét thực đơn hoàn tất",
      "extractionMethod": "cloud-vision",
      "dishesFound": 2,
      "dishesFoundMessage": "2 món đã tìm thấy"
    },
    "currency": {
      "code": "VND",
      "symbol": "₫",
      "name": "Vietnamese Dong",
      "exchangeRateToVND": 1
    },
    "locale": "vi-VN"
  }
}
```

---

## Ví dụ Response (English với USD)

### Request:
```http
POST /menu/upload/scan
Content-Type: multipart/form-data

image: [menu.jpg]
language: "en"
allergens: '[{"type":"shellfish","severity":"severe"}]'
```

### Response (Snippet - Same structure but translated):
```json
{
  "success": true,
  "message": "Menu scan completed successfully",
  "language": "en",
  "data": {
    "extraction": {
      "menuSections": [
        {
          "items": [
            {
              "name": "Phở Bò",
              "priceOriginal": {
                "value": 50000,
                "currency": "VND",
                "symbol": "₫",
                "formatted": "50,000₫"
              },
              "price": 2,
              "priceFormatted": "$2.00",
              "priceCurrency": "USD",
              "priceSymbol": "$",

              "priceAnalysis": {
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
                }
              }
            }
          ]
        }
      ]
    },
    "allergenAnalysis": {
      "analysis": [
        {
          "dishName": "Bún Bò Huế",
          "riskLevel": "SEVERE_RISK",
          "identifiedAllergens": [
            {
              "allergen": "shellfish",
              "source": "Mắm ruốc (fermented shrimp paste)",
              "likelihood": "definite",
              "severity": "severe",
              "explanation": "Traditional Bún Bò Huế always contains fermented shrimp paste"
            }
          ],
          "recommendation": "⛔ AVOID THIS DISH! Contains fermented shrimp paste - high risk for severe shellfish allergy"
        }
      ],
      "translations": {
        "safe": "Safe",
        "warning": "Warning",
        "danger": "Danger",
        "contains": "Contains",
        "mayContain": "May contain",
        "free": "Free"
      }
    }
  },
  "meta": {
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

## Key Features

### 1. **Price Analysis** (priceAnalysis)
- ✅ Regional pricing evaluation (cheap/moderate/expensive/premium)
- ✅ Percentile ranking (cheaper/more expensive than X%)
- ✅ Value for money assessment
- ✅ Ingredient cost breakdown
- ✅ Market comparison

### 2. **Dish Details** (dishDetails)
- ✅ Canonical name (English translation)
- ✅ Cuisine region (north/central/south Vietnam)
- ✅ Top 5 ingredients
- ✅ Allergen signals (hidden allergens)
- ✅ Dietary profile (vegetarian/vegan/gluten-free...)
- ✅ AI confidence score

### 3. **Multi-Language Support**
- ✅ 6 languages: vi, en, ko, ja, de, fr
- ✅ Automatic price conversion
- ✅ Translated messages
- ✅ Locale-specific formatting

### 4. **Allergen Safety**
- ✅ Risk level: SAFE / LOW_RISK / MEDIUM_RISK / HIGH_RISK / SEVERE_RISK
- ✅ Detected allergens with source
- ✅ Likelihood: definite / likely / possible
- ✅ Personalized recommendations

---

## Price Categories by Region

| Region | Cheap | Moderate | Expensive | Premium |
|--------|-------|----------|-----------|---------|
| **North Vietnam** | 0-40k | 40-80k | 80-150k | 150k+ |
| **Central Vietnam** | 0-35k | 35-70k | 70-120k | 120k+ |
| **South Vietnam** | 0-45k | 45-90k | 90-180k | 180k+ |
| **International** | 0-60k | 60-150k | 150-300k | 300k+ |

---

## Value for Money Categories

| Markup | Value Rating | Description |
|--------|--------------|-------------|
| < 50% | Excellent | Very good value |
| 50-100% | Good | Reasonable markup |
| 100-200% | Fair | Acceptable pricing |
| > 200% | Poor | Expensive |

---

## Example Use Cases

### 1. **Traveler with Shellfish Allergy**
- Gets immediate warning about Bún Bò Huế (hidden mắm ruốc)
- Sees safe alternatives (Phở Bò)
- Understands prices in their currency

### 2. **Budget Conscious Diner**
- Sees price analysis: "Cheaper than 62% of similar dishes"
- Understands value: "Good value with 78% markup"
- Compares with market average

### 3. **Ingredient Conscious Customer**
- Sees full ingredient breakdown
- Understands regional authenticity
- Gets allergen signal warnings

### 4. **International Tourist**
- Gets prices in USD/EUR/KRW/JPY
- Reads translated dish names
- Understands regional context
