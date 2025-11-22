# Hướng Dẫn Thực Hiện API Endpoints - Smart Food Search

## Mục Lục
1. [Cấu Hình Môi Trường](#1-cấu-hình-môi-trường)
2. [API Endpoint 1: Tìm Kiếm Món Ăn](#2-api-endpoint-1-tìm-kiếm-món-ăn)
3. [API Endpoint 2: Sync Nhà Hàng (Admin)](#3-api-endpoint-2-sync-nhà-hàng-admin)
4. [Xử Lý Lỗi & Troubleshooting](#4-xử-lý-lỗi--troubleshooting)
5. [Testing với Postman/cURL](#5-testing-với-postmancurl)

---

## 1. Cấu Hình Môi Trường

### 1.1. Environment Variables

Cập nhật file `.env` với các thông tin sau:

```env
# Server
PORT=3000

# Database
MONGODB_URI=mongodb://localhost:27017/nest-mvp-app

# Google Maps & Places API
GOOGLE_MAPS_API_KEY=AIzaSy...your-actual-key

# Google Gemini API (Optional - for AI features)
GEMINI_API_KEY=AIzaSy...your-gemini-key

# JWT (nếu có authentication)
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRATION=7d
```

### 1.2. Lấy API Keys

#### Google Maps & Places API:
1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project có sẵn
3. Enable APIs:
   - **Places API (New)**
   - **Places API**
   - **Geocoding API**
   - **Maps JavaScript API**
4. Tạo API Key:
   - Navigation menu → APIs & Services → Credentials
   - Click "Create Credentials" → API Key
   - Copy API Key vào `.env`
5. (Optional) Giới hạn API Key:
   - Application restrictions: HTTP referrers hoặc IP addresses
   - API restrictions: Chỉ chọn Places API, Geocoding API

#### Google Gemini API:
1. Truy cập [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Get API Key" → Create API Key
3. Copy API Key vào `.env`

### 1.3. Khởi Động Server

```bash
# Install dependencies
npm install

# Start development server
npm run start:dev

# Server sẽ chạy tại http://localhost:3000
```

### 1.4. Kiểm Tra Swagger Documentation

Sau khi khởi động server, truy cập:
```
http://localhost:3000/api
```

Bạn sẽ thấy Swagger UI với tất cả endpoints.

---

## 2. API Endpoint 1: Tìm Kiếm Món Ăn

### 2.1. Thông Tin Endpoint

```
POST /foods/search
Content-Type: application/json
Authorization: Bearer <token> (optional - depending on your auth setup)
```

### 2.2. Request Body Structure

#### Tối Thiểu (Minimum Required Fields)
```json
{
  "location": {
    "latitude": 10.762622,
    "longitude": 106.660172
  },
  "radius": 1000
}
```

#### Đầy Đủ (Full Example)
```json
{
  "location": {
    "latitude": 10.762622,
    "longitude": 106.660172,
    "placeId": "ChIJN1t_tDeuEmsRUsoyG83frY4",
    "address": "Ho Chi Minh City, Vietnam"
  },
  "radius": 1000,
  "budget": 100000,
  "mealTime": "lunch",
  "dietaryPreferences": ["vegetarian", "low-carb"],
  "useProfilePreferences": true,
  "sortBy": "matchingScore",
  "page": 1,
  "limit": 20,
  "minRating": 3.5,
  "cuisineTypes": ["Vietnamese", "Japanese"]
}
```

### 2.3. Request Parameters Chi Tiết

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `location` | Object | ✅ Yes | Vị trí tìm kiếm | - |
| `location.latitude` | Number | ✅ Yes | Vĩ độ (-90 đến 90) | 10.762622 |
| `location.longitude` | Number | ✅ Yes | Kinh độ (-180 đến 180) | 106.660172 |
| `location.placeId` | String | ❌ No | Google Place ID | "ChIJ..." |
| `location.address` | String | ❌ No | Địa chỉ đọc được | "HCM City" |
| `radius` | Number | ✅ Yes | Bán kính tìm kiếm (meters) | 1000 |
| `budget` | Number | ❌ No | Ngân sách/người (VND) | 100000 |
| `mealTime` | String | ❌ No | Bữa ăn | "breakfast" \| "lunch" \| "dinner" \| "snack" |
| `dietaryPreferences` | Array | ❌ No | Sở thích ăn uống | ["vegetarian", "gluten-free"] |
| `useProfilePreferences` | Boolean | ❌ No | Dùng profile user (default: true) | true |
| `sortBy` | String | ❌ No | Sắp xếp theo | "matchingScore" \| "distance" \| "priceLowToHigh" \| "priceHighToLow" \| "rating" |
| `page` | Number | ❌ No | Số trang (default: 1) | 1 |
| `limit` | Number | ❌ No | Kết quả/trang (default: 20, max: 100) | 20 |
| `minRating` | Number | ❌ No | Rating tối thiểu (0-5) | 3.5 |
| `cuisineTypes` | Array | ❌ No | Loại ẩm thực | ["Vietnamese", "Japanese"] |

### 2.4. Radius Options (Enum)

```typescript
SearchRadius {
  RADIUS_500M = 500,      // 500 meters
  RADIUS_1KM = 1000,      // 1 km
  RADIUS_2KM = 2000,      // 2 km
  RADIUS_5KM = 5000,      // 5 km
  RADIUS_10KM = 10000,    // 10 km
  RADIUS_20KM = 20000,    // 20 km
  RADIUS_50KM = 50000,    // 50 km
  RADIUS_100KM = 100000,  // 100 km
  RADIUS_200KM = 200000,  // 200 km
  RADIUS_500KM = 500000   // 500 km
}
```

### 2.5. Response Structure

#### Success Response (200 OK)

```json
{
  "results": [
    {
      "restaurant": {
        "_id": "6721abc123def456",
        "name": "Phở 2000",
        "placeId": "ChIJ...",
        "address": "1 Phan Chu Trinh, Quận 1, HCM",
        "rating": 4.5,
        "priceLevel": 2,
        "photos": [
          "https://maps.googleapis.com/maps/api/place/photo?..."
        ],
        "isOpen": true,
        "cuisineTypes": ["Vietnamese"]
      },
      "food": {
        "_id": "6722bcd234efa567",
        "name": "Phở Bò Tái",
        "description": "Phở bò tái truyền thống với nước dùng đậm đà",
        "price": 65000,
        "currency": "VND",
        "images": ["https://..."],
        "nutritionInfo": {
          "calories": 450,
          "protein": 28,
          "carbs": 55,
          "fats": 12,
          "fiber": 3,
          "sugar": 4,
          "sodium": 800
        },
        "rating": 4.7,
        "reviewCount": 245,
        "mealTimes": ["breakfast", "lunch"],
        "dietaryPreferences": [],
        "preparationTime": 15
      },
      "distance": 1200,
      "distanceText": "1.2 km",
      "estimatedPrice": 65000,
      "matching": {
        "matchingScore": 85.5,
        "healthGoalScore": 90,
        "nutritionScore": 88,
        "dietaryScore": 100,
        "allergenScore": 100,
        "budgetScore": 75,
        "reasons": [
          "High protein content matches your muscle gain goal",
          "Within your budget range",
          "No allergens detected",
          "Highly rated (4.7⭐)",
          "Low sugar content"
        ],
        "aiRecommendationScore": 88,
        "aiNutritionAnalysis": "This meal provides excellent protein-to-calorie ratio for muscle building with balanced macros.",
        "aiHealthImpact": "Strongly supports your muscle gain goal with balanced macros and essential amino acids.",
        "aiSuggestions": [
          "Consider pairing with a side of steamed vegetables for extra fiber",
          "Add extra beef for more protein if training heavily today"
        ]
      }
    }
  ],
  "total": 45,
  "page": 1,
  "limit": 20,
  "totalPages": 3,
  "hasMore": true,
  "aiSummary": "Great news! These options align well with your muscle gain goal. Most meals are high in protein and within your calorie range. Focus on the top-ranked items for maximum results!"
}
```

### 2.6. Response Fields Giải Thích

#### Results Array
Mỗi item trong `results` chứa:

**Restaurant Object**:
- `_id`: MongoDB ID của nhà hàng
- `name`: Tên nhà hàng
- `placeId`: Google Place ID
- `address`: Địa chỉ đầy đủ
- `rating`: Đánh giá trung bình (0-5)
- `priceLevel`: Mức giá (1-4, $ đến $$$$)
- `photos`: Mảng URL ảnh
- `isOpen`: Nhà hàng đang mở cửa?
- `cuisineTypes`: Loại ẩm thực

**Food Object**:
- `_id`: MongoDB ID của món ăn
- `name`: Tên món ăn
- `description`: Mô tả
- `price`: Giá (VND)
- `nutritionInfo`: Thông tin dinh dưỡng
  - `calories`: Calo
  - `protein`: Protein (g)
  - `carbs`: Carbohydrate (g)
  - `fats`: Chất béo (g)
  - `fiber`: Chất xơ (g)
  - `sugar`: Đường (g)
  - `sodium`: Natri (mg)
- `rating`: Đánh giá món ăn
- `reviewCount`: Số lượt đánh giá
- `mealTimes`: Phù hợp cho bữa nào
- `dietaryPreferences`: Sở thích ăn uống
- `preparationTime`: Thời gian chuẩn bị (phút)

**Distance & Price**:
- `distance`: Khoảng cách (meters)
- `distanceText`: Khoảng cách dạng text
- `estimatedPrice`: Giá ước tính

**Matching Object** (Điểm phù hợp):
- `matchingScore`: Điểm tổng (0-100)
- `healthGoalScore`: Điểm mục tiêu sức khỏe
- `nutritionScore`: Điểm dinh dưỡng
- `dietaryScore`: Điểm sở thích ăn uống
- `allergenScore`: Điểm an toàn dị ứng
- `budgetScore`: Điểm ngân sách
- `reasons`: Mảng lý do khuyến nghị
- `aiRecommendationScore`: Điểm AI (0-100, optional)
- `aiNutritionAnalysis`: Phân tích dinh dưỡng AI (optional)
- `aiHealthImpact`: Tác động sức khỏe AI (optional)
- `aiSuggestions`: Gợi ý từ AI (optional)

#### Pagination Metadata
- `total`: Tổng số kết quả tìm được
- `page`: Trang hiện tại
- `limit`: Số kết quả/trang
- `totalPages`: Tổng số trang
- `hasMore`: Còn kết quả tiếp theo?

#### AI Summary
- `aiSummary`: Tóm tắt AI về kết quả tìm kiếm (optional)

### 2.7. Error Responses

#### 400 Bad Request (Validation Error)
```json
{
  "statusCode": 400,
  "message": [
    "location.latitude must be a latitude string or number",
    "radius must be one of the following values: 500, 1000, 2000, 5000, 10000"
  ],
  "error": "Bad Request"
}
```

#### 404 Not Found (User Profile Not Found)
```json
{
  "statusCode": 404,
  "message": "User onboarding profile not found. Please complete onboarding first.",
  "error": "Not Found"
}
```

#### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

### 2.8. Use Cases & Examples

#### Use Case 1: Tìm kiếm cơ bản (chỉ vị trí + bán kính)
**Scenario**: User muốn tìm món ăn gần đây, không có điều kiện đặc biệt.

```bash
curl -X POST http://localhost:3000/foods/search \
  -H "Content-Type: application/json" \
  -d '{
    "location": {
      "latitude": 10.762622,
      "longitude": 106.660172
    },
    "radius": 2000
  }'
```

**Expected Result**: Tất cả món ăn trong bán kính 2km, sắp xếp theo matching score (dựa trên user profile).

---

#### Use Case 2: Tìm kiếm với ngân sách
**Scenario**: User có ngân sách 50,000 VND/người.

```bash
curl -X POST http://localhost:3000/foods/search \
  -H "Content-Type: application/json" \
  -d '{
    "location": {
      "latitude": 10.762622,
      "longitude": 106.660172
    },
    "radius": 1000,
    "budget": 50000,
    "sortBy": "priceLowToHigh"
  }'
```

**Expected Result**: Món ăn ≤ 60,000 VND (cho phép 20% linh hoạt), sắp xếp từ rẻ đến đắt.

---

#### Use Case 3: Tìm kiếm theo bữa ăn
**Scenario**: User muốn tìm bữa sáng.

```bash
curl -X POST http://localhost:3000/foods/search \
  -H "Content-Type: application/json" \
  -d '{
    "location": {
      "latitude": 10.762622,
      "longitude": 106.660172
    },
    "radius": 5000,
    "mealTime": "breakfast"
  }'
```

**Expected Result**: Chỉ hiển thị món ăn có `mealTimes` chứa "breakfast".

---

#### Use Case 4: Tìm kiếm với sở thích ăn uống
**Scenario**: User ăn chay (vegetarian).

```bash
curl -X POST http://localhost:3000/foods/search \
  -H "Content-Type: application/json" \
  -d '{
    "location": {
      "latitude": 10.762622,
      "longitude": 106.660172
    },
    "radius": 5000,
    "dietaryPreferences": ["vegetarian"],
    "useProfilePreferences": false
  }'
```

**Expected Result**: Chỉ hiển thị món ăn có `dietaryPreferences` chứa "vegetarian".

**Note**: `useProfilePreferences: false` → chỉ dùng `dietaryPreferences` trong request, không dùng profile.

---

#### Use Case 5: Tìm kiếm kết hợp nhiều điều kiện
**Scenario**: User muốn tìm bữa trưa, ngân sách 100k, ăn chay, rating cao.

```bash
curl -X POST http://localhost:3000/foods/search \
  -H "Content-Type: application/json" \
  -d '{
    "location": {
      "latitude": 10.762622,
      "longitude": 106.660172
    },
    "radius": 5000,
    "budget": 100000,
    "mealTime": "lunch",
    "dietaryPreferences": ["vegetarian"],
    "minRating": 4.0,
    "sortBy": "rating",
    "page": 1,
    "limit": 10
  }'
```

**Expected Result**: 10 món ăn chay, bữa trưa, rating ≥ 4.0, giá ≤ 120k, sắp xếp theo rating cao nhất.

---

#### Use Case 6: Tìm kiếm theo loại ẩm thực
**Scenario**: User muốn ăn đồ Nhật hoặc Việt.

```bash
curl -X POST http://localhost:3000/foods/search \
  -H "Content-Type: application/json" \
  -d '{
    "location": {
      "latitude": 10.762622,
      "longitude": 106.660172
    },
    "radius": 10000,
    "cuisineTypes": ["Vietnamese", "Japanese"]
  }'
```

**Expected Result**: Chỉ hiển thị món ăn từ nhà hàng có `cuisineTypes` chứa "Vietnamese" hoặc "Japanese".

---

#### Use Case 7: Phân trang
**Scenario**: User muốn xem trang 2 (kết quả 21-40).

```bash
curl -X POST http://localhost:3000/foods/search \
  -H "Content-Type: application/json" \
  -d '{
    "location": {
      "latitude": 10.762622,
      "longitude": 106.660172
    },
    "radius": 5000,
    "page": 2,
    "limit": 20
  }'
```

**Expected Result**: Kết quả từ index 20-39 (trang 2).

---

#### Use Case 8: Sắp xếp theo khoảng cách
**Scenario**: User muốn tìm món ăn gần nhất.

```bash
curl -X POST http://localhost:3000/foods/search \
  -H "Content-Type: application/json" \
  -d '{
    "location": {
      "latitude": 10.762622,
      "longitude": 106.660172
    },
    "radius": 3000,
    "sortBy": "distance"
  }'
```

**Expected Result**: Món ăn gần nhất hiển thị trước.

---

## 3. API Endpoint 2: Sync Nhà Hàng (Admin)

### 3.1. Thông Tin Endpoint

```
POST /foods/sync-restaurants?latitude={lat}&longitude={lng}&radius={radius}
Content-Type: application/json
Authorization: Bearer <admin-token> (recommended)
```

### 3.2. Purpose (Mục Đích)

Endpoint này dùng để:
1. Lấy danh sách nhà hàng từ **Google Places API**
2. Lưu/Cập nhật vào database (MongoDB)
3. Nên được gọi định kỳ (cron job) để update dữ liệu

### 3.3. Query Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `latitude` | Number | ✅ Yes | Vĩ độ trung tâm | 10.762622 |
| `longitude` | Number | ✅ Yes | Kinh độ trung tâm | 106.660172 |
| `radius` | Number | ✅ Yes | Bán kính tìm kiếm (meters) | 5000 |

### 3.4. Request Example

```bash
curl -X POST 'http://localhost:3000/foods/sync-restaurants?latitude=10.762622&longitude=106.660172&radius=5000' \
  -H "Content-Type: application/json"
```

### 3.5. Success Response (200 OK)

```json
{
  "message": "Restaurants synced successfully"
}
```

### 3.6. Process Flow

1. **Gọi Google Places API**: `placesNearby()` với params (location, radius, type=restaurant)
2. **Lặp qua từng place**:
   - Extract thông tin: name, location, rating, priceLevel, photos, phone, website, opening hours, cuisine types
   - **Upsert** vào `restaurants` collection (dựa trên `placeId` - không duplicate)
3. **Return** success message

### 3.7. Database Upsert Logic

```typescript
await restaurantModel.findOneAndUpdate(
  { placeId: place.placeId },  // Find by placeId
  {
    placeId: place.placeId,
    name: place.name,
    location: {
      type: 'Point',
      coordinates: [place.location.lng, place.location.lat]
    },
    address: { formattedAddress: place.formattedAddress },
    rating: place.rating,
    priceLevel: place.priceLevel,
    photos: place.photos,
    // ... other fields
  },
  { upsert: true, new: true }  // Create if not exists, update if exists
);
```

### 3.8. Scheduling Strategy (Khuyến Nghị)

#### Option 1: Cron Job (Node.js)
Sử dụng `node-cron` hoặc `@nestjs/schedule`:

```typescript
import { Cron, CronExpression } from '@nestjs/schedule';

@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
async handleCron() {
  await this.foodsService.syncRestaurantsFromGooglePlaces(
    10.762622,
    106.660172,
    5000
  );
}
```

#### Option 2: Manual Call
Admin call endpoint thủ công khi cần update data.

#### Option 3: External Cron (Linux)
```bash
# Crontab - Chạy mỗi ngày lúc 2 AM
0 2 * * * curl -X POST 'http://localhost:3000/foods/sync-restaurants?latitude=10.762622&longitude=106.660172&radius=5000'
```

### 3.9. Best Practices

1. **API Key Quota**: Google Places API có giới hạn request. Nên:
   - Sync ít tần suất (1 lần/ngày hoặc 1 lần/tuần)
   - Giới hạn radius hợp lý (< 50km)
   
2. **Authentication**: Nên thêm middleware để chỉ Admin mới gọi được:
   ```typescript
   @UseGuards(AdminGuard)
   @Post('sync-restaurants')
   ```

3. **Logging**: Log số lượng restaurants synced để monitor.

4. **Error Handling**: Retry nếu Google API lỗi.

---

## 4. Xử Lý Lỗi & Troubleshooting

### 4.1. Common Errors

#### Error 1: "User onboarding profile not found"
**Cause**: User chưa hoàn thành onboarding, nhưng `useProfilePreferences = true`.

**Solution**:
- Option 1: User hoàn thành onboarding trước
- Option 2: Set `useProfilePreferences: false` trong request

---

#### Error 2: Empty results (`results: []`)
**Causes**:
- Không có nhà hàng trong bán kính
- Không có món ăn thỏa mãn điều kiện lọc
- Database chưa có dữ liệu

**Solutions**:
1. Tăng `radius` (VD: từ 1km lên 5km)
2. Giảm điều kiện lọc (bỏ `minRating`, `dietaryPreferences`)
3. Gọi `/sync-restaurants` để fetch data từ Google Places
4. Kiểm tra database có restaurants và foods không:
   ```bash
   # MongoDB Shell
   use nest-mvp-app
   db.restaurants.countDocuments()
   db.foods.countDocuments()
   ```

---

#### Error 3: "Google Maps API key not configured"
**Cause**: `GOOGLE_MAPS_API_KEY` không có trong `.env`.

**Solution**:
1. Thêm key vào `.env`
2. Restart server

---

#### Error 4: "Gemini API error"
**Cause**: 
- `GEMINI_API_KEY` không hợp lệ hoặc không có
- API quota exceeded

**Solution**:
- Không ảnh hưởng chức năng chính (AI là optional)
- Kết quả vẫn trả về, nhưng không có `aiRecommendationScore`, `aiSummary`
- Check logs để debug

---

#### Error 5: Slow response time
**Causes**:
- Tìm kiếm trong radius lớn (> 50km)
- Database chưa có index
- AI analysis cho nhiều món (> 10)

**Solutions**:
1. **Thêm indexes**:
   ```javascript
   // MongoDB Shell
   db.restaurants.createIndex({ location: "2dsphere" })
   db.restaurants.createIndex({ rating: 1 })
   db.restaurants.createIndex({ cuisineTypes: 1 })
   db.foods.createIndex({ restaurantId: 1 })
   db.foods.createIndex({ isAvailable: 1 })
   db.foods.createIndex({ price: 1 })
   ```

2. **Giảm radius**: Từ 50km xuống 5-10km

3. **Giảm limit**: Từ 100 xuống 20

4. **Cache**: Implement Redis cache cho user profile

---

### 4.2. Debugging Checklist

```bash
# 1. Check server is running
curl http://localhost:3000/api

# 2. Check MongoDB connection
# In server logs, should see: "MongoDB connected successfully"

# 3. Check environment variables
cat .env | grep GOOGLE_MAPS_API_KEY
cat .env | grep GEMINI_API_KEY

# 4. Check database has data
# MongoDB Shell:
db.restaurants.countDocuments()
db.foods.countDocuments()

# 5. Test basic search
curl -X POST http://localhost:3000/foods/search \
  -H "Content-Type: application/json" \
  -d '{"location":{"latitude":10.762622,"longitude":106.660172},"radius":5000}'
```

---

## 5. Testing với Postman/cURL

### 5.1. Setup Postman Collection

#### Environment Variables
Tạo environment với:
```
base_url: http://localhost:3000
token: <your-jwt-token-if-needed>
```

#### Collection Structure
```
Smart Food Search
├── Search Foods
│   ├── Basic Search
│   ├── Search with Budget
│   ├── Search with Meal Time
│   ├── Search with Dietary Preferences
│   ├── Search with Multiple Filters
│   └── Pagination Test
└── Sync Restaurants (Admin)
```

### 5.2. Postman Request Examples

#### Request 1: Basic Search
```
POST {{base_url}}/foods/search
Content-Type: application/json

Body (JSON):
{
  "location": {
    "latitude": 10.762622,
    "longitude": 106.660172
  },
  "radius": 2000
}
```

#### Request 2: Advanced Search
```
POST {{base_url}}/foods/search
Content-Type: application/json

Body (JSON):
{
  "location": {
    "latitude": 10.762622,
    "longitude": 106.660172
  },
  "radius": 5000,
  "budget": 100000,
  "mealTime": "lunch",
  "dietaryPreferences": ["vegetarian"],
  "sortBy": "matchingScore",
  "page": 1,
  "limit": 10,
  "minRating": 4.0,
  "cuisineTypes": ["Vietnamese"]
}
```

#### Request 3: Sync Restaurants
```
POST {{base_url}}/foods/sync-restaurants?latitude=10.762622&longitude=106.660172&radius=5000
Content-Type: application/json
```

### 5.3. cURL Examples

#### Test 1: Basic Search
```bash
curl -X POST http://localhost:3000/foods/search \
  -H "Content-Type: application/json" \
  -d '{
    "location": {
      "latitude": 10.762622,
      "longitude": 106.660172
    },
    "radius": 2000
  }'
```

#### Test 2: Search with all filters
```bash
curl -X POST http://localhost:3000/foods/search \
  -H "Content-Type: application/json" \
  -d '{
    "location": {
      "latitude": 10.762622,
      "longitude": 106.660172
    },
    "radius": 5000,
    "budget": 100000,
    "mealTime": "lunch",
    "dietaryPreferences": ["vegetarian"],
    "useProfilePreferences": true,
    "sortBy": "matchingScore",
    "page": 1,
    "limit": 20,
    "minRating": 3.5,
    "cuisineTypes": ["Vietnamese", "Japanese"]
  }'
```

#### Test 3: Pagination
```bash
# Page 1
curl -X POST http://localhost:3000/foods/search \
  -H "Content-Type: application/json" \
  -d '{"location":{"latitude":10.762622,"longitude":106.660172},"radius":5000,"page":1,"limit":10}'

# Page 2
curl -X POST http://localhost:3000/foods/search \
  -H "Content-Type: application/json" \
  -d '{"location":{"latitude":10.762622,"longitude":106.660172},"radius":5000,"page":2,"limit":10}'
```

#### Test 4: Sort by distance
```bash
curl -X POST http://localhost:3000/foods/search \
  -H "Content-Type: application/json" \
  -d '{"location":{"latitude":10.762622,"longitude":106.660172},"radius":3000,"sortBy":"distance"}'
```

#### Test 5: Sort by price
```bash
# Low to High
curl -X POST http://localhost:3000/foods/search \
  -H "Content-Type: application/json" \
  -d '{"location":{"latitude":10.762622,"longitude":106.660172},"radius":5000,"sortBy":"priceLowToHigh"}'

# High to Low
curl -X POST http://localhost:3000/foods/search \
  -H "Content-Type: application/json" \
  -d '{"location":{"latitude":10.762622,"longitude":106.660172},"radius":5000,"sortBy":"priceHighToLow"}'
```

#### Test 6: Sync Restaurants
```bash
curl -X POST 'http://localhost:3000/foods/sync-restaurants?latitude=10.762622&longitude=106.660172&radius=5000'
```

### 5.4. Expected Response Validation

#### Validation Checklist
- [ ] Status code là 200
- [ ] `results` là array
- [ ] Mỗi item có đầy đủ: `restaurant`, `food`, `distance`, `matching`
- [ ] `matching.matchingScore` từ 0-100
- [ ] `total`, `page`, `limit`, `totalPages`, `hasMore` đúng logic
- [ ] Nếu có user profile → `aiSummary` xuất hiện (nếu Gemini API configured)
- [ ] Results được sắp xếp theo `sortBy` đã chọn

#### Validation Script (Node.js)
```javascript
const response = await fetch('http://localhost:3000/foods/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    location: { latitude: 10.762622, longitude: 106.660172 },
    radius: 5000
  })
});

const data = await response.json();

// Validate
console.assert(response.status === 200, 'Status should be 200');
console.assert(Array.isArray(data.results), 'Results should be array');
console.assert(data.total >= 0, 'Total should be >= 0');
console.assert(data.page === 1, 'Page should be 1');
console.assert(data.hasMore === (data.total > data.limit), 'hasMore logic correct');

console.log('✅ All validations passed');
```

---

## 6. Performance Optimization Tips

### 6.1. Database Indexes
```javascript
// restaurants collection
db.restaurants.createIndex({ location: "2dsphere" })
db.restaurants.createIndex({ rating: 1, cuisineTypes: 1 })

// foods collection
db.foods.createIndex({ restaurantId: 1, isAvailable: 1 })
db.foods.createIndex({ price: 1 })
db.foods.createIndex({ mealTimes: 1 })
db.foods.createIndex({ dietaryPreferences: 1 })
```

### 6.2. Caching Strategy (Optional)
```typescript
// Cache user profile (Redis)
const cacheKey = `user:${userId}:profile`;
let userProfile = await redis.get(cacheKey);

if (!userProfile) {
  userProfile = await onboardingModel.findOne({ userId });
  await redis.setex(cacheKey, 3600, JSON.stringify(userProfile)); // TTL: 1 hour
}
```

### 6.3. Pagination Best Practices
- Default `limit`: 20
- Max `limit`: 100
- Không load tất cả results cùng lúc

### 6.4. AI Analysis Optimization
- Chỉ analyze top 10 results (đã implement)
- Batch analyze thay vì analyze từng món
- Fallback khi Gemini API lỗi

---

## 7. Security Considerations

### 7.1. Authentication (Khuyến Nghị)
Thêm JWT authentication:

```typescript
// foods.controller.ts
@UseGuards(JwtAuthGuard)
@Post('search')
async searchFoods(@Body() searchDto: SearchFoodsDto, @Request() req: any) {
  const userId = req.user.userId; // From JWT token
  return this.foodsService.searchFoods(searchDto, userId);
}
```

### 7.2. Rate Limiting
Giới hạn số request/user để tránh abuse:

```typescript
// main.ts
import rateLimit from 'express-rate-limit';

app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}));
```

### 7.3. Input Validation
- ✅ Đã implement với `class-validator`
- Validate latitude (-90 to 90)
- Validate longitude (-180 to 180)
- Validate radius (enum values)
- Validate budget (> 0)

### 7.4. API Key Protection
- Không expose API keys trong response
- Không commit `.env` vào Git
- Sử dụng environment-specific configs

---

## 8. Monitoring & Logging

### 8.1. Log Important Events
```typescript
this.logger.log(`Searching foods for user ${userId}`);
this.logger.log(`Found ${foods.length} matching foods`);
this.logger.error(`Error analyzing food with Gemini: ${error.message}`);
```

### 8.2. Metrics to Track
- Average response time
- Number of searches per day
- Most popular search filters
- AI analysis success rate
- Google Places API quota usage

### 8.3. Health Check Endpoint (Khuyến Nghị)
```typescript
@Get('health')
async healthCheck() {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: await this.checkDatabase(),
      googlePlaces: !!this.configService.get('GOOGLE_MAPS_API_KEY'),
      gemini: !!this.configService.get('GEMINI_API_KEY')
    }
  };
}
```

---

## Kết Luận

Tài liệu này cung cấp hướng dẫn chi tiết về:
- ✅ Cấu hình môi trường và API keys
- ✅ Cách sử dụng 2 endpoints: `/foods/search` và `/sync-restaurants`
- ✅ Request/Response structure đầy đủ
- ✅ 8+ use cases thực tế với examples
- ✅ Error handling & troubleshooting
- ✅ Testing với Postman/cURL
- ✅ Performance optimization
- ✅ Security best practices

Frontend/Mobile developers có thể sử dụng tài liệu này để tích hợp API vào ứng dụng.

**Next Steps**:
1. Test tất cả endpoints với Postman
2. Sync restaurants để có dữ liệu
3. Tạo sample foods data để test search
4. Implement authentication nếu cần
5. Setup monitoring và logging
