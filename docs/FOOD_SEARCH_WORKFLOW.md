# Food Search Feature - Workflow Documentation

## Overview

The Food Search feature allows users to find personalized food recommendations based on their location, health goals, dietary preferences, budget, and meal time. The system integrates with Google Places API to fetch restaurant data and uses a sophisticated matching algorithm to score and rank foods according to user preferences.

## Architecture

### Module Structure

```
src/foods/
├── schemas/
│   ├── restaurant.schema.ts    # Restaurant data model with geospatial indexing
│   └── food.schema.ts          # Food items with nutrition and health info
├── dto/
│   ├── search-foods.dto.ts     # Search request validation
│   └── food-search-result.dto.ts # Search response structure
├── services/
│   ├── google-places.service.ts    # Google Places API integration
│   ├── matching-score.service.ts   # Matching algorithm
│   └── foods.service.ts            # Main business logic
├── foods.controller.ts         # API endpoints
└── foods.module.ts            # Module configuration
```

## Feature Requirements

### FR-12: Search Filter Input

#### 1. Location
- **Default**: Current Location (GPS - Latitude/Longitude)
- **Custom**: Select location via Google Place API
- **Implementation**: `LocationDto` with latitude, longitude, optional placeId and address

```typescript
location: {
  latitude: 10.762622,
  longitude: 106.660172,
  placeId: "ChIJ...",  // Optional
  address: "Ho Chi Minh City, Vietnam"  // Optional
}
```

#### 2. Search Radius
- **Options**: 500m, 1km, 2km, 5km, 10km
- **Implementation**: `SearchRadius` enum
- **Usage**: Geospatial query with `$maxDistance`

#### 3. Budget
- **Input**: Budget per person in VND
- **Implementation**: Optional number field
- **Flexibility**: System allows up to 20% over budget with penalty in score

#### 4. Meal Time
- **Options**: Breakfast, Lunch, Dinner, Snack
- **Implementation**: `MealTime` enum
- **Usage**: Filters foods by `mealTimes` field

#### 5. Preferences
- **Profile-based**: Automatically loads from user's onboarding data
- **Quick select**: Override or supplement with instant preferences
- **Implementation**:
  - `useProfilePreferences` (default: true)
  - `dietaryPreferences` array (supplements profile)

### FR-13: Search Results & Recommendations

#### 1. Display
- Restaurant name and details
- Recommended food item
- Distance from location
- Estimated price
- Matching score breakdown
- Reasons for recommendation

#### 2. Sorting Options
- **Matching Score** (default): Best fit for user's health goals
- **Distance**: Nearest first
- **Price Low to High**: Budget-friendly options
- **Price High to Low**: Premium options
- **Rating**: Highest rated first

#### 3. Pagination
- Default: 20 results per page
- Maximum: 100 results per page
- Includes: page, limit, total, totalPages, hasMore

## Workflow

### 1. User Initiates Search

```
POST /foods/search
```

**Request Body**:
```json
{
  "location": {
    "latitude": 10.762622,
    "longitude": 106.660172
  },
  "radius": 1000,
  "budget": 100000,
  "mealTime": "lunch",
  "useProfilePreferences": true,
  "sortBy": "matchingScore",
  "page": 1,
  "limit": 20
}
```

### 2. System Retrieves User Profile

```typescript
// If useProfilePreferences = true
const userProfile = await onboardingModel.findOne({
  userId,
  completed: true
});
```

Retrieves:
- Health goals (lose-weight, maintain, gain-muscle)
- Daily nutrition targets (calories, protein, carbs, fats)
- Dietary preferences (vegan, vegetarian, halal, etc.)
- Allergens with severity levels
- Activity level and health conditions

### 3. Find Nearby Restaurants

Uses MongoDB geospatial query with 2dsphere index:

```typescript
{
  location: {
    $near: {
      $geometry: {
        type: 'Point',
        coordinates: [longitude, latitude]
      },
      $maxDistance: radius
    }
  }
}
```

Additional filters:
- Cuisine types (if specified)
- Minimum rating (if specified)

### 4. Filter Foods

Build query with multiple criteria:

```typescript
{
  restaurantId: { $in: restaurantIds },
  isAvailable: true,
  mealTimes: mealTime,  // if specified
  dietaryPreferences: { $all: userPreferences },
  allergens: { $nin: severeAllergens },
  price: { $lte: budget * 1.2 }  // 20% flexibility
}
```

### 5. Calculate Matching Scores

For each food item, calculate:

#### A. Health Goal Score (30% weight)
Based on user's health goal:

**Lose Weight**:
- Low calories: +20 points (< 25% of daily target)
- High protein: +15 points (> 25% of daily target)
- High fiber: +10 points (> 5g)
- Low sugar: +5 points (< 10g)

**Gain Muscle**:
- High protein: +25 points (> 33% of daily target)
- Moderate calories: +10 points
- Good carbs: +10 points
- Adequate fats: +5 points

**Maintain**:
- Balanced nutrition ratios
- Score based on how close to target ratios

#### B. Nutrition Score (25% weight)
- Protein content: Up to +15 points
- Fiber content: Up to +10 points
- Sugar content: Up to +10 points (lower is better)
- Sodium content: Up to +10 points (lower is better)
- Calorie appropriateness: Up to +15 points

#### C. Dietary Score (20% weight)
```
score = (matchedPreferences / totalPreferences) * 100
```

#### D. Allergen Score (15% weight)
- No allergens: 100 points
- Mild allergen present: -25 points
- Moderate allergen: -50 points
- Severe allergen: -100 points (should be filtered out)

#### E. Budget Score (10% weight)
```
if (price <= budget) {
  score = 100 - (price/budget) * 20
} else {
  score = max(0, 100 - ((price-budget)/budget) * 100)
}
```

#### Final Matching Score
```
matchingScore =
  healthGoalScore * 0.30 +
  nutritionScore * 0.25 +
  dietaryScore * 0.20 +
  allergenScore * 0.15 +
  budgetScore * 0.10
```

### 6. Generate Reasons

System generates human-readable reasons for each score:

```typescript
reasons: [
  "High protein content matches your muscle gain goal",
  "Within your budget range",
  "No allergens detected",
  "Highly rated (4.5⭐)",
  "Low sodium content"
]
```

### 7. Sort and Paginate

Apply sorting based on `sortBy` parameter:
- `matchingScore`: Descending by matching score
- `distance`: Ascending by distance
- `priceLowToHigh`: Ascending by price
- `priceHighToLow`: Descending by price
- `rating`: Descending by rating

Apply pagination:
```typescript
const startIndex = (page - 1) * limit;
const endIndex = startIndex + limit;
const paginatedResults = results.slice(startIndex, endIndex);
```

### 8. Return Results

**Response**:
```json
{
  "results": [
    {
      "restaurant": {
        "name": "Healthy Bowl",
        "address": {...},
        "rating": 4.5,
        "photos": [...]
      },
      "food": {
        "name": "Grilled Salmon Salad",
        "price": 150000,
        "nutritionInfo": {...}
      },
      "distance": 850,
      "distanceText": "850 m",
      "estimatedPrice": 150000,
      "matching": {
        "matchingScore": 88.5,
        "healthGoalScore": 90,
        "nutritionScore": 95,
        "dietaryScore": 100,
        "allergenScore": 100,
        "budgetScore": 75,
        "reasons": [...]
      }
    }
  ],
  "total": 45,
  "page": 1,
  "limit": 20,
  "totalPages": 3,
  "hasMore": true
}
```

## Google Places API Integration

### Configuration

Add to `.env`:
```
GOOGLE_MAPS_API_KEY=your-api-key-here
```

### Usage

#### 1. Search Nearby Places
```typescript
googlePlacesService.searchNearbyPlaces({
  latitude: 10.762622,
  longitude: 106.660172,
  radius: 1000,
  type: 'restaurant',
  keyword: 'healthy food'
})
```

#### 2. Get Place Details
```typescript
googlePlacesService.getPlaceDetails(placeId)
```

#### 3. Sync Restaurants (Admin)
```
POST /foods/sync-restaurants?latitude=10.762622&longitude=106.660172&radius=5000
```

This endpoint:
1. Fetches restaurants from Google Places API
2. Stores/updates them in database
3. Should be called periodically to keep data fresh

### Rate Limiting

Google Places API has usage limits:
- 1,000 requests per day (free tier)
- Consider caching and periodic syncing
- Store data in database to reduce API calls

## Database Indexes

### Restaurant Collection
```typescript
// Geospatial index for location queries
{ location: '2dsphere' }
```

### Food Collection
```typescript
{ restaurantId: 1 }
{ mealTimes: 1 }
{ suitableForGoals: 1 }
{ dietaryPreferences: 1 }
{ price: 1 }
{ 'healthScore.overall': -1 }
```

## Best Practices

### 1. Avoid Code Duplication (DRY)
- Shared DTOs for common fields (Location, Nutrition)
- Reusable services (GooglePlacesService, MatchingScoreService)
- Common utilities in services (distance calculation, formatting)

### 2. Performance Optimization
- Geospatial indexes for fast location queries
- Compound indexes for common query patterns
- Pagination to limit result size
- Limit nearby restaurants to 50 before food search

### 3. Code Quality
- Strong typing with TypeScript interfaces
- Validation with class-validator decorators
- Comprehensive error handling
- Logging for debugging and monitoring

### 4. Scalability
- Modular architecture (separate concerns)
- Service-based design (easy to test and extend)
- Database indexing for query performance
- API pagination for large datasets

### 5. Security
- Input validation on all endpoints
- Allergen filtering for user safety
- Environment variables for sensitive config
- Rate limiting consideration for external APIs

## Testing Strategy

### Unit Tests
- MatchingScoreService: Test score calculations
- GooglePlacesService: Mock API responses
- FoodsService: Mock database queries

### Integration Tests
- Full search workflow
- Sorting and pagination
- Filter combinations

### E2E Tests
- Complete user journey
- Edge cases (no results, errors)
- Performance benchmarks

## Future Enhancements

1. **Caching**
   - Redis cache for frequent searches
   - Cache invalidation strategy

2. **Real-time Updates**
   - WebSocket notifications for new restaurants
   - Live location updates

3. **Machine Learning**
   - Learn from user choices
   - Improve matching algorithm over time
   - Personalized weight adjustments

4. **Social Features**
   - User reviews and ratings
   - Friend recommendations
   - Sharing functionality

5. **Advanced Filters**
   - Opening hours
   - Delivery options
   - Reservation availability
   - Parking availability

## Troubleshooting

### Common Issues

1. **No results found**
   - Check if restaurants exist in database
   - Verify search radius is appropriate
   - Run sync-restaurants endpoint

2. **Low matching scores**
   - Review user profile completeness
   - Check food nutrition data quality
   - Verify allergen/preference matching

3. **Google Places API errors**
   - Verify API key is configured
   - Check API quota limits
   - Review API key restrictions

4. **Performance issues**
   - Verify indexes are created
   - Check query complexity
   - Monitor database query time
   - Consider pagination limits

## API Documentation

Full API documentation available via Swagger:
```
http://localhost:3000/api
```

Endpoints:
- `POST /foods/search` - Search for foods
- `POST /foods/sync-restaurants` - Sync restaurants (Admin)

## Monitoring

Key metrics to track:
- Search response time
- Matching score distribution
- User satisfaction (click-through rate)
- API usage and errors
- Database query performance

## Conclusion

The Food Search feature provides a comprehensive, personalized food discovery experience. By combining location-based search, health-conscious matching, and user preferences, it delivers relevant, actionable recommendations that help users make better food choices aligned with their health goals.
