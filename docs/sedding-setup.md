# Database Seeding Setup

## Overview
Automatic database seeding has been configured for the onboarding system. The seeding runs automatically when the NestJS application starts.

## Structure Created

### 1. Schemas
- **`src/onboarding/schemas/language.schema.ts`** - Language model (code, name, nativeName, flag)
- **`src/onboarding/schemas/onboarding.schema.ts`** - Onboarding data model with all types

### 2. Seeding Infrastructure
- **`src/database/seeds/seed.service.ts`** - Service that handles seeding logic
- **`src/database/seeds/seed.module.ts`** - Module that provides seed service
- **`seeding-data.json`** - JSON file with 10 languages and 5 sample users

### 3. Integration
- Imported `SeedModule` in `app.module.ts`
- Configured `main.ts` to run seeding on application startup

## How It Works

1. When you run `npm run start:dev` or `npm run start`, the seeding automatically executes
2. The `SeedService` checks if data already exists to prevent duplicates
3. If collections are empty, it seeds:
   - 10 languages from `seeding-data.json`
   - 5 users with complete onboarding data

## Seeded Data

### Languages (10)
- English, Spanish, French, German, Japanese, Chinese, Arabic, Portuguese, Russian, Hindi

### Users (5)
Each user includes:
- Email: `user1@example.com` through `user5@example.com`
- Full name: `User 1` through `User 5`
- Complete onboarding data with:
  - Dietary preferences (vegetarian, halal, vegan, pescatarian, etc.)
  - Allergens with severity levels
  - Nutrition goals (gender, age, weight, height, activity level, health goals)
  - Daily nutritional targets (calories, protein, carbs, fats)
  - Smart features permissions

## Customization

### Modify Seeding Data
Edit `seeding-data.json` to change the default data.

### Disable Auto-Seeding
Remove these lines from `src/main.ts`:
```typescript
const seedService = app.get(SeedService);
await seedService.seed();
```

### Manual Seeding
You can also create a separate CLI command for manual seeding if needed.

## Collections Created
- `languages` - Available languages for the app
- `onboarding` - User onboarding data
- `users` - User accounts (linked to onboarding via userId)
