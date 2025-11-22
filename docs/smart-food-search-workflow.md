# Workflow Phân Hệ Tìm Kiếm Món Ăn (Smart Food Search)

## Tổng Quan

Tài liệu này mô tả luồng tương tác giữa Frontend (FE) và Backend (BE) cho tính năng Smart Food Search, bao gồm các chức năng:
- **FR-12**: Bộ lọc tìm kiếm (Filter Input)
- **FR-13**: Kết quả tìm kiếm & Gợi ý với AI Agent

---

## 1. Sơ Đồ Tổng Quan

```
[Frontend] ---(1) Gửi Request Tìm Kiếm---> [Backend]
                                              |
                                              v
                                    (2) Validate & Xác thực
                                              |
                                              v
                                    (3) Lấy Profile User
                                              |
                                              v
                                    (4) Tìm Nhà Hàng Gần
                                              |
                                              v
                                    (5) Lọc Món Ăn
                                              |
                                              v
                                    (6) Tính Điểm Matching
                                              |
                                              v
                                    (7) AI Analysis (Gemini)
                                              |
                                              v
                                    (8) Sắp Xếp & Phân Trang
                                              |
                                              v
[Frontend] <---(9) Trả về Kết Quả--- [Backend]
```

---

## 2. Luồng Chi Tiết FE → BE

### Bước 1: Frontend Gửi Request Tìm Kiếm

**Endpoint**: `POST /foods/search`

**Request Body** (SearchFoodsDto):

```typescript
{
  // Vị trí (FR-12: Vị trí)
  location: {
    latitude: 10.762622,        // Kinh độ (GPS hoặc chọn từ Google Places)
    longitude: 106.660172,      // Vĩ độ
    placeId?: "ChIJ...",        // (Optional) Google Place ID nếu chọn vị trí tùy chỉnh
    address?: "HCM City"        // (Optional) Địa chỉ
  },
  
  // Bán kính (FR-12: Bán kính)
  radius: 1000,                 // Enum: 500, 1000, 2000, 5000, 10000 (mét)
  
  // Ngân sách (FR-12: Budget)
  budget?: 100000,              // VND/người (Optional)
  
  // Thời gian (FR-12: Meal Time)
  mealTime?: "lunch",           // Enum: breakfast, lunch, dinner, snack (Optional)
  
  // Sở thích (FR-12: Sở thích)
  dietaryPreferences?: [        // (Optional) Danh sách sở thích ăn uống
    "vegetarian",
    "gluten-free"
  ],
  
  useProfilePreferences?: true, // true = sử dụng sở thích từ Profile
                                // false = chỉ dùng dietaryPreferences được chọn
  
  // Các bộ lọc bổ sung (FR-13)
  sortBy?: "matchingScore",     // Enum: matchingScore, distance, priceLowToHigh, 
                                //       priceHighToLow, rating
  page?: 1,                     // Trang hiện tại (pagination)
  limit?: 20,                   // Số kết quả/trang
  minRating?: 3.5,              // Đánh giá tối thiểu (0-5)
  cuisineTypes?: ["Vietnamese", "Japanese"]  // Lọc theo loại ẩm thực
}
```

**Headers**:
```
Authorization: Bearer <access_token>  // JWT token (nếu cần auth)
Content-Type: application/json
```

---

### Bước 2-3: Backend Validate và Lấy User Profile

**Service**: `FoodsService.searchFoods()`

1. **Validate request**: Kiểm tra các trường bắt buộc (location, radius)
2. **Lấy User Profile**: 
   - Nếu `useProfilePreferences = true` → Query `Onboarding` collection
   - Lấy thông tin: `healthGoal`, `dailyTargets`, `dietaryPreferences`, `allergens`
   - Throw error nếu user chưa hoàn thành onboarding

```typescript
// Pseudocode
const userProfile = await onboardingModel.findOne({
  userId: req.user.userId,
  completed: true
});

if (!userProfile && useProfilePreferences) {
  throw new NotFoundException('User onboarding profile not found');
}
```

---

### Bước 4: Tìm Nhà Hàng Gần (Google Places Integration)

**Service**: `FoodsService.findNearbyRestaurants()`

1. **Geospatial Query**: Sử dụng MongoDB `$near` để tìm nhà hàng trong bán kính
   - Index: `location` (2dsphere)
   - Điều kiện: `$maxDistance = radius`
2. **Bộ lọc bổ sung**:
   - `cuisineTypes`: Lọc theo loại ẩm thực
   - `minRating`: Lọc nhà hàng có rating >= minRating
3. **Giới hạn**: Tối đa 50 nhà hàng

```typescript
// Pseudocode
const restaurants = await restaurantModel.find({
  location: {
    $near: {
      $geometry: { type: 'Point', coordinates: [longitude, latitude] },
      $maxDistance: radius
    }
  },
  cuisineTypes: { $in: cuisineTypes },  // Nếu có
  rating: { $gte: minRating }           // Nếu có
}).limit(50);
```

**Kết quả**: Danh sách các `Restaurant` (ID, vị trí, tên, rating...)

---

### Bước 5: Lọc Món Ăn Theo Điều Kiện

**Service**: `FoodsService.searchFoods()`

1. **Query Food Collection**:
   - `restaurantId`: IN danh sách restaurant IDs từ Bước 4
   - `isAvailable = true`
   - `mealTimes`: Chứa `mealTime` nếu được chọn
   - `dietaryPreferences`: Chứa TẤT CẢ sở thích (`$all` operator)
   - `allergens`: KHÔNG chứa allergen severe của user (`$nin`)
   - `price`: ≤ budget × 1.2 (cho phép linh hoạt 20%)

```typescript
// Pseudocode
const foodQuery = {
  restaurantId: { $in: restaurantIds },
  isAvailable: true,
  mealTimes: mealTime,                        // Nếu có
  dietaryPreferences: { $all: dietaryPrefs }, // Nếu có
  allergens: { $nin: severeAllergens },       // Nếu user có allergens
  price: { $lte: budget * 1.2 }               // Nếu có budget
};

const foods = await foodModel.find(foodQuery).populate('restaurantId');
```

2. **Tính khoảng cách**: Với mỗi món ăn, tính khoảng cách từ vị trí tìm kiếm đến nhà hàng
   - Sử dụng Haversine formula
   - Loại bỏ món ăn có khoảng cách > radius

---

### Bước 6: Tính Điểm Matching Score

**Service**: `MatchingScoreService.calculateMatchingScore()`

Với mỗi món ăn, tính điểm phù hợp dựa trên 5 tiêu chí:

#### 6.1. Health Goal Score (Trọng số: 30%)
- So sánh nutrition info của món ăn với `healthGoal` và `dailyTargets` của user
- Logic:
  - **Lose Weight**: Ưu tiên thấp calorie, cao protein, cao fiber, ít sugar
  - **Gain Muscle**: Ưu tiên cao protein, calorie và carbs vừa phải
  - **Maintain**: Ưu tiên cân bằng dinh dưỡng (gần với 1/3 daily targets)

#### 6.2. Nutrition Score (Trọng số: 25%)
- Đánh giá chất lượng dinh dưỡng:
  - Protein ≥ 20g: +15 điểm
  - Fiber ≥ 5g: +10 điểm
  - Sugar < 5g: +10 điểm
  - Sodium < 500mg: +10 điểm
  - Calories trong khoảng 300-700: +15 điểm

#### 6.3. Dietary Score (Trọng số: 20%)
- Tỷ lệ sở thích khớp: `matchedPreferences / totalPreferences * 100`
- Nếu không có sở thích → 100 điểm

#### 6.4. Allergen Score (Trọng số: 15%)
- Không chứa allergen: 100 điểm
- Chứa allergen severe: 0 điểm
- Chứa allergen moderate: 50 điểm
- Chứa allergen mild: 75 điểm

#### 6.5. Budget Score (Trọng số: 10%)
- Trong ngân sách: 100 - (price/budget × 20)
- Vượt ngân sách: max(0, 100 - (price-budget)/budget × 100)

**Công thức tổng hợp**:
```
matchingScore = healthGoalScore × 0.3 
              + nutritionScore × 0.25
              + dietaryScore × 0.2
              + allergenScore × 0.15
              + budgetScore × 0.1
```

**Kết quả**: Mỗi món ăn có object `FoodMatchingDetails` với:
- `matchingScore` (0-100)
- Các sub-scores
- `reasons`: Mảng lý do (VD: "High protein matches your muscle gain goal")

---

### Bước 7: AI Analysis với Gemini (FR-13: AI Agent)

**Service**: `GeminiService.analyzeFoodBatch()`

1. **Batch Analysis**: Lấy top 10 món ăn (theo matching score) để phân tích AI
2. **Input cho AI**:
   - Food info: name, description, nutrition, price
   - Restaurant info
   - User profile: health goal, daily targets, preferences, allergens
   - Meal time

3. **AI Tasks**:
   - Đánh giá mức độ phù hợp với health goal
   - Phân tích dinh dưỡng chi tiết
   - Đưa ra health impact
   - Gợi ý thực tế (VD: "Kết hợp với cơm gạo lứt để tăng năng lượng bền vững")

4. **AI Response**:
```typescript
{
  recommendationScore: 88,      // 0-100
  nutritionAnalysis: "This meal provides excellent protein-to-calorie ratio...",
  healthImpact: "Strongly supports your muscle gain goal...",
  suggestions: ["Consider pairing with brown rice..."]
}
```

5. **Merge vào results**: Thêm `aiRecommendationScore`, `aiNutritionAnalysis`, `aiHealthImpact`, `aiSuggestions` vào `matching` object

---

### Bước 8: Sắp Xếp và Phân Trang (FR-13)

**Service**: `FoodsService.sortResults()`

1. **Sắp xếp** theo `sortBy`:
   - `matchingScore`: Giảm dần (mặc định)
   - `distance`: Tăng dần
   - `priceLowToHigh`: Tăng dần theo giá
   - `priceHighToLow`: Giảm dần theo giá
   - `rating`: Giảm dần theo rating

2. **Phân trang**:
   - `startIndex = (page - 1) * limit`
   - `endIndex = startIndex + limit`
   - Lấy slice: `results[startIndex:endIndex]`

3. **AI Summary** (nếu có kết quả):
   - Gọi `GeminiService.generateRecommendationSummary()`
   - Input: Danh sách món ăn (đã phân trang) + user profile
   - Output: Tóm tắt 2-3 câu khuyến khích và hướng dẫn

**Ví dụ AI Summary**:
> "Tin tốt! Các lựa chọn này phù hợp với mục tiêu tăng cơ của bạn. Hầu hết món ăn giàu protein và nằm trong ngưỡng calorie. Hãy ưu tiên các món được xếp hạng cao nhất để đạt hiệu quả tối đa!"

---

### Bước 9: Trả Về Response

**Response Structure** (FoodSearchResultDto):

```typescript
{
  // Danh sách kết quả (đã phân trang)
  results: [
    {
      // Thông tin nhà hàng
      restaurant: {
        _id: "6721...",
        name: "Phở 2000",
        address: "1 Phan Chu Trinh, Quận 1",
        rating: 4.5,
        priceLevel: 2,
        photos: ["https://..."],
        isOpen: true,
        cuisineTypes: ["Vietnamese"]
      },
      
      // Thông tin món ăn
      food: {
        _id: "6722...",
        name: "Phở Bò Tái",
        description: "Phở bò tái truyền thống",
        price: 65000,
        currency: "VND",
        images: ["https://..."],
        nutritionInfo: {
          calories: 450,
          protein: 28,
          carbs: 55,
          fats: 12,
          fiber: 3,
          sugar: 4,
          sodium: 800
        },
        rating: 4.7,
        reviewCount: 245,
        mealTimes: ["breakfast", "lunch"],
        dietaryPreferences: [],
        preparationTime: 15
      },
      
      // Thông tin vị trí
      distance: 1200,           // meters
      distanceText: "1.2 km",
      
      // Giá ước tính
      estimatedPrice: 65000,
      
      // Điểm matching (FR-13)
      matching: {
        matchingScore: 85.5,
        healthGoalScore: 90,
        nutritionScore: 88,
        dietaryScore: 100,
        allergenScore: 100,
        budgetScore: 75,
        reasons: [
          "High protein content matches your muscle gain goal",
          "Within your budget range",
          "No allergens detected",
          "Highly rated (4.7⭐)",
          "Low sugar content"
        ],
        
        // AI Agent Analysis (nếu có)
        aiRecommendationScore: 88,
        aiNutritionAnalysis: "This meal provides excellent protein-to-calorie ratio for muscle building with balanced macros.",
        aiHealthImpact: "Strongly supports your muscle gain goal with balanced macros and essential amino acids.",
        aiSuggestions: [
          "Consider pairing with a side of steamed vegetables for extra fiber",
          "Add extra beef for more protein if training heavily today"
        ]
      }
    },
    // ... more results
  ],
  
  // Metadata phân trang
  total: 45,          // Tổng số kết quả tìm được
  page: 1,            // Trang hiện tại
  limit: 20,          // Số kết quả/trang
  totalPages: 3,      // Tổng số trang
  hasMore: true,      // Còn kết quả tiếp theo?
  
  // AI Summary (FR-13: Gợi ý tổng quan)
  aiSummary: "Great news! These options align well with your muscle gain goal. Most meals are high in protein and within your calorie range. Focus on the top-ranked items for maximum results!"
}
```

**HTTP Status Codes**:
- `200 OK`: Tìm kiếm thành công
- `404 Not Found`: User profile không tồn tại (nếu `useProfilePreferences = true`)
- `400 Bad Request`: Dữ liệu request không hợp lệ
- `500 Internal Server Error`: Lỗi server (Google Places API, Gemini API...)

---

## 3. Luồng Xử Lý Error

### 3.1. User Chưa Hoàn Thành Onboarding
```json
{
  "statusCode": 404,
  "message": "User onboarding profile not found. Please complete onboarding first.",
  "error": "Not Found"
}
```

**Xử lý FE**: Redirect user đến trang onboarding

### 3.2. Không Tìm Thấy Kết Quả
```json
{
  "results": [],
  "total": 0,
  "page": 1,
  "limit": 20,
  "totalPages": 0,
  "hasMore": false
}
```

**Xử lý FE**: Hiển thị "No results found. Try adjusting your filters."

### 3.3. Google Places API Lỗi
- Fallback: Sử dụng dữ liệu nhà hàng đã sync trong database
- Log error để admin biết

### 3.4. Gemini AI Lỗi
- Fallback: Trả về kết quả không có AI analysis
- `aiSummary`, `aiRecommendationScore`, etc. sẽ là `undefined`

---

## 4. Tối Ưu Performance

### 4.1. Database Indexes
```javascript
// Restaurant Collection
location: '2dsphere'      // Geospatial index cho $near query
cuisineTypes: 1           // Index cho filter
rating: 1                 // Index cho filter

// Food Collection
restaurantId: 1           // Index cho lookup
isAvailable: 1            // Index cho filter
mealTimes: 1              // Index cho filter
dietaryPreferences: 1     // Index cho filter
price: 1                  // Index cho filter và sort
```

### 4.2. Caching Strategy (Optional)
- Cache user profile (Redis, TTL: 1 hour)
- Cache nearby restaurants (Redis, TTL: 30 minutes)
- Key: `user:{userId}:location:{lat}:{lng}:radius:{radius}`

### 4.3. Batch Processing
- AI analysis: Chỉ phân tích top 10 results (không phân tích tất cả)
- Pagination: Tính tất cả matching scores trước, sau đó paginate

---

## 5. Luồng Chọn Vị Trí Tùy Chỉnh (Optional Feature)

### 5.1. FE: Autocomplete Địa Chỉ
**Endpoint**: Google Places Autocomplete API (gọi trực tiếp từ FE)

```javascript
// FE call Google Places Autocomplete
const autocompleteService = new google.maps.places.AutocompleteService();
autocompleteService.getPlacePredictions(
  { input: userInput },
  (predictions) => {
    // Display predictions
  }
);
```

### 5.2. FE: Lấy Chi Tiết Place
```javascript
const placesService = new google.maps.places.PlacesService(map);
placesService.getDetails(
  { placeId: selectedPlaceId },
  (place) => {
    const location = {
      latitude: place.geometry.location.lat(),
      longitude: place.geometry.location.lng(),
      placeId: place.place_id,
      address: place.formatted_address
    };
    // Send to BE
  }
);
```

---

## 6. Luồng Sync Nhà Hàng (Admin)

**Endpoint**: `POST /foods/sync-restaurants?latitude={lat}&longitude={lng}&radius={radius}`

**Flow**:
1. Admin gọi endpoint
2. BE gọi Google Places API: `placesNearby()`
3. Với mỗi place:
   - Upsert vào `Restaurant` collection (dựa trên `placeId`)
   - Map dữ liệu: name, location, rating, priceLevel, photos, opening hours...
4. Return: `{ message: "Restaurants synced successfully" }`

**Lưu ý**: Nên chạy định kỳ (cron job) để cập nhật dữ liệu nhà hàng

---

## 7. State Diagram (Frontend)

```
[Loading] ---> [Nhập Filters] ---> [Submitting] ---> [Results Loaded]
                    |                                       |
                    |                                       v
                    |                              [No Results / Error]
                    |                                       |
                    +---------------------------------------+
                                    (Retry)
```

---

## 8. API Error Codes Summary

| Status Code | Message | Xử Lý FE |
|-------------|---------|----------|
| 200 | Success | Hiển thị kết quả |
| 400 | Invalid request body | Hiển thị validation errors |
| 404 | User profile not found | Redirect to onboarding |
| 500 | Internal server error | Retry hoặc thông báo lỗi |

---

## 9. Testing Scenarios

### Test Case 1: Tìm kiếm cơ bản
- Input: Location + Radius
- Expected: Danh sách món ăn trong bán kính, sorted by matching score

### Test Case 2: Tìm kiếm với Budget
- Input: Location + Radius + Budget = 50,000 VND
- Expected: Chỉ hiển thị món ≤ 60,000 VND (cho phép 20% linh hoạt)

### Test Case 3: Tìm kiếm với Meal Time
- Input: Location + Radius + MealTime = breakfast
- Expected: Chỉ hiển thị món có `mealTimes` chứa "breakfast"

### Test Case 4: Tìm kiếm với Dietary Preferences
- Input: Location + Radius + Dietary = ["vegetarian"]
- Expected: Chỉ hiển thị món có `dietaryPreferences` chứa "vegetarian"

### Test Case 5: User Có Allergen Severe
- Input: Location + Radius + User có allergen "peanuts" (severe)
- Expected: KHÔNG hiển thị món chứa peanuts

### Test Case 6: Không Tìm Thấy Kết Quả
- Input: Location xa, Radius nhỏ
- Expected: `{ results: [], total: 0 }`

### Test Case 7: Pagination
- Input: Page = 2, Limit = 10
- Expected: Kết quả từ index 10-19

### Test Case 8: Sort by Distance
- Input: sortBy = "distance"
- Expected: Món ăn gần nhất hiển thị trước

---

## 10. Dependencies

### Backend Services
- `FoodsService`: Main service
- `GooglePlacesService`: Tìm kiếm nhà hàng, tính khoảng cách
- `MatchingScoreService`: Tính điểm matching
- `GeminiService`: AI analysis

### External APIs
- **Google Places API**: Tìm kiếm nhà hàng (sync restaurants)
- **Google Gemini API**: AI-powered food recommendations

### Database Collections
- `restaurants`: Lưu thông tin nhà hàng
- `foods`: Lưu thông tin món ăn
- `onboarding`: Lưu profile user (health goals, preferences, allergens)

---

## 11. Environment Variables

```env
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
GEMINI_API_KEY=your_gemini_api_key
MONGODB_URI=mongodb://localhost:27017/nest-mvp-app
```

---

## Kết Luận

Workflow này mô tả đầy đủ luồng xử lý từ Frontend đến Backend cho tính năng Smart Food Search, bao gồm:
- ✅ Bộ lọc tìm kiếm đa dạng (vị trí, bán kính, budget, meal time, sở thích)
- ✅ Thuật toán matching score 5 chiều (health goal, nutrition, dietary, allergen, budget)
- ✅ Tích hợp AI Agent (Gemini) để phân tích dinh dưỡng và gợi ý
- ✅ Sắp xếp kết quả linh hoạt (matching score, distance, price, rating)
- ✅ Phân trang và xử lý lỗi

Frontend có thể sử dụng tài liệu này để implement giao diện và xử lý API calls.
