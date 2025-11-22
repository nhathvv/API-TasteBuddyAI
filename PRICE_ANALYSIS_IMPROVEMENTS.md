# 💰 Price Analysis Service - Improvements

## 🎯 Current Issues

### **1. Default Location**
- ❌ Current: Default là `south_vietnam` (Sài Gòn)
- ✅ Required: Default là `central_vietnam` (Đà Nẵng)

### **2. Location từ Frontend**
- ❌ Current: Không có field để FE truyền location
- ✅ Required: FE có thể truyền `userLocation` parameter

### **3. Currency**
- ✅ Current: Có hỗ trợ currency từ `language` param
- ✅ Good: Tiền tệ được convert qua `i18nService`

---

## 🔧 Required Changes

### **1. Update ScanMenuDto**

Thêm field `userLocation`:

```typescript
// src/modules/menu/dto/scan-menu.dto.ts

export class ScanMenuDto {
  // ... existing fields

  @IsOptional()
  @IsString()
  @IsIn(['danang', 'hanoi', 'saigon', 'hue', 'central_vietnam', 'north_vietnam', 'south_vietnam'])
  userLocation?: string = 'danang'; // Default: Đà Nẵng
  
  @IsOptional()
  @IsString()
  currency?: string; // Optional: 'VND', 'USD', 'EUR', 'KRW', 'JPY'
}
```

### **2. Update PriceAnalysisService**

```typescript
// src/shared/services/price-analysis.service.ts

/**
 * Determine region from cuisine region or user location
 */
private determineRegion(cuisineRegion?: string, userLocation?: string): string {
  // 1. Prioritize user location if provided
  if (userLocation) {
    return this.mapLocationToRegion(userLocation);
  }

  // 2. Use cuisine region if available
  if (cuisineRegion) {
    return this.mapLocationToRegion(cuisineRegion);
  }

  // 3. Default: Đà Nẵng (Central Vietnam)
  return 'central_vietnam';
}

/**
 * Map location string to region
 */
private mapLocationToRegion(location: string): string {
  const regionMap: Record<string, string> = {
    // Miền Bắc
    'north_vietnam': 'north_vietnam',
    'hanoi': 'north_vietnam',
    'hai-phong': 'north_vietnam',
    
    // Miền Trung (Default)
    'central_vietnam': 'central_vietnam',
    'danang': 'central_vietnam',
    'da-nang': 'central_vietnam',
    'hue': 'central_vietnam',
    'hoi-an': 'central_vietnam',
    'quy-nhon': 'central_vietnam',
    
    // Miền Nam
    'south_vietnam': 'south_vietnam',
    'saigon': 'south_vietnam',
    'ho-chi-minh': 'south_vietnam',
    'can-tho': 'south_vietnam',
    'vung-tau': 'south_vietnam',
    
    // Quốc tế
    'international': 'international',
    'western': 'international',
    'asian': 'international',
  };

  return regionMap[location.toLowerCase()] || 'central_vietnam'; // Default: Đà Nẵng
}

/**
 * Analyze dish price with user location
 */
analyzeDishPrice(
  price: number,
  dish: {
    name: string;
    ingredients?: Array<{ canonicalName?: string; name?: string; isPrimary?: boolean }>;
    cuisineRegion?: string;
    baseDishType?: string;
  },
  language: string = 'vi',
  userLocation?: string, // New parameter
): PriceAnalysis {
  // 1. Determine region (prioritize user location)
  const region = this.determineRegion(dish.cuisineRegion, userLocation);

  // ... rest of the code
}
```

### **3. Update Menu Service**

```typescript
// src/modules/menu/menu.service.ts

// In formatScanResponse or wherever analyzeDishPrice is called:
priceAnalysis = this.priceAnalysisService.analyzeDishPrice(
  item.price,
  {
    name: enrichedDish.canonicalName || enrichedDish.originalName,
    ingredients: enrichedDish.ingredients,
    cuisineRegion: enrichedDish.cuisineRegion,
    baseDishType: enrichedDish.baseDishType,
  },
  language,
  dto.userLocation || 'danang', // Pass user location, default Đà Nẵng
);
```

---

## 📊 Regional Price Ranges

### **Current Configuration**

```typescript
const REGIONAL_PRICE_RANGES = {
  'north_vietnam': {
    cheap: { min: 0, max: 40000 },
    moderate: { min: 40001, max: 80000 },
    expensive: { min: 80001, max: 150000 },
    premium: { min: 150001, max: Infinity },
  },
  'central_vietnam': { // Đà Nẵng default ✅
    cheap: { min: 0, max: 35000 },
    moderate: { min: 35001, max: 70000 },
    expensive: { min: 70001, max: 120000 },
    premium: { min: 120001, max: Infinity },
  },
  'south_vietnam': {
    cheap: { min: 0, max: 45000 },
    moderate: { min: 45001, max: 90000 },
    expensive: { min: 90001, max: 180000 },
    premium: { min: 180001, max: Infinity },
  },
};
```

✅ **Đà Nẵng (Central Vietnam):**
- Cheap: 0 - 35,000₫
- Moderate: 35,001 - 70,000₫
- Expensive: 70,001 - 120,000₫
- Premium: 120,001₫+

---

## 🎨 Frontend Integration

### **Request Example**

```javascript
const formData = new FormData();
formData.append('image', imageFile);
formData.append('language', 'vi');
formData.append('outputLanguage', 'vi');

// Location parameter (new)
formData.append('userLocation', 'danang'); // Default

// Currency (optional)
formData.append('currency', 'VND'); // Default

// User allergens
formData.append('userAllergens', JSON.stringify([
  { type: 'shellfish', severity: 'severe' }
]));

const response = await fetch('/menu/upload/scan-async', {
  method: 'POST',
  body: formData
});
```

### **Response - Price Analysis**

```json
{
  "success": true,
  "data": {
    "extraction": {
      "menuSections": [
        {
          "items": [
            {
              "name": "Phở Bò",
              "price": 50000,
              "priceFormatted": "50.000₫",
              "priceAnalysis": {
                "originalPrice": 50000,
                "convertedPrice": {
                  "value": 50000,
                  "currency": "VND",
                  "symbol": "₫",
                  "formatted": "50.000₫"
                },
                "regional": {
                  "region": "central_vietnam",
                  "priceCategory": "moderate",
                  "percentileInRegion": 45,
                  "evaluation": "Giá trung bình so với khu vực Miền Trung"
                },
                "valueAnalysis": {
                  "estimatedCost": 25000,
                  "markup": 100,
                  "valueForMoney": "good",
                  "explanation": "Giá trị tốt với mức tăng 100% hợp lý"
                },
                "ingredientCostBreakdown": [
                  {
                    "ingredient": "beef",
                    "estimatedCost": 35000,
                    "percentage": 58
                  },
                  {
                    "ingredient": "noodles",
                    "estimatedCost": 8000,
                    "percentage": 13
                  }
                ],
                "comparison": {
                  "cheaperThan": 55,
                  "moreExpensiveThan": 45,
                  "averagePriceForType": 52500
                }
              }
            }
          ]
        }
      ]
    }
  }
}
```

---

## 🌍 Supported Locations

### **Frontend Dropdown Options**

```javascript
const LOCATIONS = [
  // Miền Trung (Default)
  { value: 'danang', label: 'Đà Nẵng' },
  { value: 'hue', label: 'Huế' },
  { value: 'hoi-an', label: 'Hội An' },
  { value: 'quy-nhon', label: 'Quy Nhơn' },
  
  // Miền Bắc
  { value: 'hanoi', label: 'Hà Nội' },
  { value: 'hai-phong', label: 'Hải Phòng' },
  
  // Miền Nam
  { value: 'saigon', label: 'Sài Gòn' },
  { value: 'can-tho', label: 'Cần Thơ' },
  { value: 'vung-tau', label: 'Vũng Tàu' },
];
```

### **UI Component**

```jsx
<div className="location-selector">
  <label>📍 Vị trí của bạn:</label>
  <select 
    value={userLocation} 
    onChange={(e) => setUserLocation(e.target.value)}
    defaultValue="danang"
  >
    <optgroup label="Miền Trung">
      <option value="danang">Đà Nẵng (Default)</option>
      <option value="hue">Huế</option>
      <option value="hoi-an">Hội An</option>
    </optgroup>
    <optgroup label="Miền Bắc">
      <option value="hanoi">Hà Nội</option>
    </optgroup>
    <optgroup label="Miền Nam">
      <option value="saigon">Sài Gòn</option>
    </optgroup>
  </select>
</div>
```

---

## 💱 Currency Support

### **Supported Currencies**

| Currency | Symbol | Name |
|----------|--------|------|
| VND | ₫ | Vietnamese Dong (Default) |
| USD | $ | US Dollar |
| EUR | € | Euro |
| KRW | ₩ | Korean Won |
| JPY | ¥ | Japanese Yen |

### **Currency Conversion**

Handled by `I18nService`:
- `language: 'vi'` → VND (₫)
- `language: 'en'` → USD ($)
- `language: 'ko'` → KRW (₩)
- `language: 'ja'` → JPY (¥)

---

## 📊 Price Analysis Features

### **1. Regional Analysis**
- ✅ So sánh với giá trung bình khu vực
- ✅ Phân loại: cheap/moderate/expensive/premium
- ✅ Percentile ranking (0-100)

### **2. Value Analysis**
- ✅ Estimate ingredient cost
- ✅ Calculate markup percentage
- ✅ Value for money rating
- ✅ Explanation in user language

### **3. Ingredient Breakdown**
- ✅ Top 5 costly ingredients
- ✅ Estimated cost per ingredient
- ✅ Percentage of total cost

### **4. Market Comparison**
- ✅ Cheaper than X% of dishes
- ✅ More expensive than X%
- ✅ Average price for dish type

---

## 🎯 Implementation Steps

### **Step 1: Update DTO**
```bash
# Edit: src/modules/menu/dto/scan-menu.dto.ts
# Add: userLocation field
```

### **Step 2: Update Price Analysis Service**
```bash
# Edit: src/shared/services/price-analysis.service.ts
# Update: determineRegion() method
# Update: analyzeDishPrice() signature
# Change default from 'south_vietnam' to 'central_vietnam'
```

### **Step 3: Update Menu Service**
```bash
# Edit: src/modules/menu/menu.service.ts
# Pass: dto.userLocation to analyzeDishPrice()
```

### **Step 4: Update Frontend**
```bash
# Add: Location selector UI
# Add: userLocation to form data
# Display: Price analysis in results
```

### **Step 5: Test**
```bash
# Test with different locations
# Verify price categories change correctly
# Check currency conversion
```

---

## ✅ Summary

| Feature | Current | After Update |
|---------|---------|--------------|
| **Default Location** | Sài Gòn (South) | Đà Nẵng (Central) ✅ |
| **User Location** | ❌ Not supported | ✅ From FE param |
| **Currency** | ✅ From language | ✅ Keep existing |
| **Regional Prices** | ✅ Configured | ✅ Keep existing |
| **Ingredient Cost** | ✅ Estimated | ✅ Keep existing |
| **Value Analysis** | ✅ Working | ✅ Keep existing |

**Ready to implement! 🚀**
