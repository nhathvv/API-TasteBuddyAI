import { ApiProperty } from '@nestjs/swagger';
import { Restaurant } from '../schemas/restaurant.schema';
import { Food } from '../schemas/food.schema';

export class FoodMatchingDetails {
  @ApiProperty({
    description: 'Overall matching score (0-100)',
    example: 85.5,
  })
  matchingScore: number;

  @ApiProperty({
    description: 'Health goal compatibility score (0-100)',
    example: 90,
  })
  healthGoalScore: number;

  @ApiProperty({
    description: 'Nutrition alignment score (0-100)',
    example: 88,
  })
  nutritionScore: number;

  @ApiProperty({
    description: 'Dietary preference compatibility score (0-100)',
    example: 100,
  })
  dietaryScore: number;

  @ApiProperty({
    description: 'Allergen safety score (0-100)',
    example: 100,
  })
  allergenScore: number;

  @ApiProperty({
    description: 'Budget compatibility score (0-100)',
    example: 75,
  })
  budgetScore: number;

  @ApiProperty({
    description: 'Reasons for the score',
    type: [String],
    example: [
      'High protein content matches your muscle gain goal',
      'Within your budget range',
      'No allergens detected',
    ],
  })
  reasons: string[];
}

export class FoodSearchResultItem {
  @ApiProperty({ description: 'Restaurant information' })
  restaurant: Partial<Restaurant>;

  @ApiProperty({ description: 'Recommended food item' })
  food: Partial<Food>;

  @ApiProperty({ description: 'Distance from search location in meters' })
  distance: number;

  @ApiProperty({ description: 'Distance in human-readable format', example: '1.2 km' })
  distanceText: string;

  @ApiProperty({ description: 'Estimated price in VND' })
  estimatedPrice: number;

  @ApiProperty({ description: 'Matching details and scores' })
  matching: FoodMatchingDetails;
}

export class FoodSearchResultDto {
  @ApiProperty({
    description: 'Search results',
    type: [FoodSearchResultItem],
  })
  results: FoodSearchResultItem[];

  @ApiProperty({
    description: 'Total number of results found',
    example: 45,
  })
  total: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Number of results per page',
    example: 20,
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 3,
  })
  totalPages: number;

  @ApiProperty({
    description: 'Whether there are more results',
    example: true,
  })
  hasMore: boolean;
}
