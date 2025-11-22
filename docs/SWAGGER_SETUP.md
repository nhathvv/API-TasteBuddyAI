# ✅ Swagger API Documentation Đã Hoàn Thành

## 📚 Tổng quan

Đã bổ sung **đầy đủ Swagger/OpenAPI decorators** cho tất cả API endpoints để test AI agents.

---

## 🎯 Những gì đã làm

### 1. **Controller Decorators** (`menu.controller.ts`)

✅ **@ApiTags('Menu & AI Agents')**
- Nhóm tất cả endpoints vào một category trong Swagger UI

✅ **@ApiOperation** cho mỗi endpoint
- `summary`: Tiêu đề ngắn gọn
- `description`: Mô tả chi tiết chức năng

✅ **@ApiResponse** với examples
- Status 200: Response thành công với example data
- Status 400/413/500: Error responses

✅ **@ApiBody** với multiple examples
- Mỗi endpoint có 2-3 examples khác nhau
- Cover các use cases phổ biến

### 2. **DTO Decorators** (`test-agents.dto.ts`)

✅ **@ApiProperty** cho required fields
- Description chi tiết
- Examples cụ thể
- Enum values (nếu có)
- Min/max values (cho numbers)

✅ **@ApiPropertyOptional** cho optional fields
- Default values
- Examples
- Enums

---

## 🌐 Truy cập Swagger UI

### URL:
```
http://localhost:3000/api
```

hoặc (tùy config):
```
http://localhost:3000/api-docs
```

### Nếu chưa setup Swagger:

Thêm vào `main.ts`:

```typescript
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('TasteBuddyAI API')
    .setDescription('AI-powered Vietnamese food safety and nutrition API')
    .setVersion('1.0')
    .addTag('Menu & AI Agents', 'Test individual AI agents or full pipeline')
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
bootstrap();
```

---

## 📋 Danh sách Endpoints trong Swagger

### 1. **POST /menu/scan**
**Full Menu Scan Workflow**
- Chạy toàn bộ pipeline
- 1 example có sẵn

### 2. **POST /menu/test/visual-extraction**
**Test Visual Extraction Agent**
- 2 examples:
  - Quick Mode
  - Full Mode

### 3. **POST /menu/test/allergen-safety**
**Test Allergen Safety Agent**
- 2 examples:
  - Shellfish Allergy
  - Multiple Allergies

### 4. **POST /menu/test/dietary-compliance**
**Test Dietary Compliance Agent**
- 2 examples:
  - Vegan Check
  - Halal + Gluten-Free

### 5. **POST /menu/test/nutrition-coach**
**Test Nutrition Coach Agent**
- 3 examples:
  - Daily Targets - Weight Loss
  - Meal Plan - Muscle Gain
  - Dish Analysis

---

## 🎨 Features của Swagger UI

### 1. **Interactive Testing**
- Click "Try it out" button
- Select example từ dropdown
- Modify parameters nếu cần
- Click "Execute" để test

### 2. **Request/Response Examples**
- Xem request body structure
- Xem response examples
- Schema validation tự động

### 3. **Field Documentation**
- Hover vào field để xem description
- Required/Optional được đánh dấu rõ ràng
- Default values hiển thị
- Enum values được list đầy đủ

### 4. **Export Options**
- Download OpenAPI spec (JSON/YAML)
- Generate client code (nhiều languages)
- Import vào Postman

---

## 📖 Examples trong Swagger

### Visual Extraction Agent
```json
{
  "imageData": "base64_encoded_image_data",
  "mimeType": "image/jpeg",
  "language": "vi",
  "extractionMode": "quick"
}
```

### Allergen Safety Agent
```json
{
  "menuItems": [
    {
      "name": "Bún Đậu Mắm Tôm",
      "description": "Bún đậu với mắm tôm",
      "price": 45000
    }
  ],
  "userAllergens": [
    {
      "type": "shellfish",
      "severity": "life-threatening"
    }
  ],
  "strictMode": true,
  "language": "en"
}
```

### Dietary Compliance Agent
```json
{
  "menuItems": [
    {
      "name": "Phở Chay",
      "description": "Phở chay với rau củ",
      "price": 45000
    }
  ],
  "dietaryRestrictions": ["vegan"],
  "context": "Looking for authentic vegan Vietnamese options"
}
```

### Nutrition Coach Agent
```json
{
  "age": 30,
  "gender": "male",
  "weight": 75,
  "height": 175,
  "activityLevel": "moderate",
  "goal": "weight-loss",
  "healthConditions": ["hypertension"],
  "requestType": "daily-targets"
}
```

---

## 🚀 Cách sử dụng

### 1. Start Server
```bash
bun run start:dev
```

### 2. Mở Swagger UI
```
http://localhost:3000/api
```

### 3. Test Endpoints
1. Expand endpoint (click vào)
2. Click **"Try it out"**
3. Select example từ dropdown
4. Click **"Execute"**
5. Xem response bên dưới

### 4. Modify Parameters
- Edit JSON trong request body
- Change values theo nhu cầu
- Execute lại

---

## 📊 DTO Documentation Details

### TestVisualExtractionDto
- `imageData`: Base64 encoded image
- `mimeType`: image/jpeg, image/png, image/webp, image/heic
- `language`: vi (default), en
- `extractionMode`: quick (default), full

### TestAllergenSafetyDto
- `menuItems`: Array of menu items
- `userAllergens`: Array of {type, severity}
- `strictMode`: boolean (default: true)
- `language`: en (default), vi

### TestDietaryComplianceDto
- `menuItems`: Array of menu items
- `dietaryRestrictions`: vegan, halal, kosher, etc.
- `context`: Optional additional info

### TestNutritionCoachDto
- **User Profile**: age, gender, weight, height, activityLevel, goal
- **Health**: healthConditions, dietaryPreferences
- **Request**: requestType, timeframe, menuItems

---

## 💡 Tips

1. **Use Examples**: Swagger có sẵn examples, chỉ cần select và execute
2. **Schema Validation**: Swagger tự động validate theo schema
3. **Error Messages**: Xem error details rõ ràng trong response
4. **Export Spec**: Download OpenAPI spec để share hoặc import Postman
5. **Authorization**: Nếu cần JWT, thêm security scheme vào DocumentBuilder

---

## 🔗 Related Files

- **Controller**: [`menu.controller.ts`](file:///Users/admin/API-TasteBuddyAI/src/modules/menu/menu.controller.ts)
- **DTOs**: [`test-agents.dto.ts`](file:///Users/admin/API-TasteBuddyAI/src/modules/menu/dto/test-agents.dto.ts)
- **Service**: [`menu.service.ts`](file:///Users/admin/API-TasteBuddyAI/src/modules/menu/menu.service.ts)

---

## ✨ Next Steps

1. ✅ Swagger đã được setup xong
2. 🔄 Start server: `bun run start:dev`
3. 🌐 Mở Swagger UI: `http://localhost:3000/api`
4. 🧪 Test endpoints trực tiếp trên UI
5. 📦 Export OpenAPI spec nếu cần

Happy Testing! 🎉
