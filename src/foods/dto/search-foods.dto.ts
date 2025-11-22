import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  Min,
  Max,
  IsLatitude,
  IsLongitude,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DietaryPreference } from '../../onboarding/schemas/onboarding.schema';

export enum SearchRadius {
  RADIUS_500M = 500,
  RADIUS_1KM = 1000,
  RADIUS_2KM = 2000,
  RADIUS_5KM = 5000,
  RADIUS_10KM = 10000,
}

export enum MealTime {
  BREAKFAST = 'breakfast',
  LUNCH = 'lunch',
  DINNER = 'dinner',
  SNACK = 'snack',
}

export enum SortBy {
  MATCHING_SCORE = 'matchingScore',
  DISTANCE = 'distance',
  PRICE_LOW_TO_HIGH = 'priceLowToHigh',
  PRICE_HIGH_TO_LOW = 'priceHighToLow',
  RATING = 'rating',
}

export class LocationDto {
  @ApiProperty({
    description: 'Latitude coordinate',
    example: 10.762622,
  })
  @IsNotEmpty()
  @IsLatitude()
  latitude: number;

  @ApiProperty({
    description: 'Longitude coordinate',
    example: 106.660172,
  })
  @IsNotEmpty()
  @IsLongitude()
  longitude: number;

  @ApiPropertyOptional({
    description: 'Google Place ID (if location selected via Google Places)',
    example: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
  })
  @IsOptional()
  @IsString()
  placeId?: string;

  @ApiPropertyOptional({
    description: 'Location name/address',
    example: 'Ho Chi Minh City, Vietnam',
  })
  @IsOptional()
  @IsString()
  address?: string;
}

export class SearchFoodsDto {
  @ApiProperty({
    description: 'Search location coordinates',
    type: LocationDto,
  })
  @ValidateNested()
  @Type(() => LocationDto)
  @IsNotEmpty()
  location: LocationDto;

  @ApiProperty({
    description: 'Search radius in meters',
    enum: SearchRadius,
    example: SearchRadius.RADIUS_1KM,
  })
  @IsNotEmpty()
  @IsEnum(SearchRadius)
  radius: SearchRadius;

  @ApiPropertyOptional({
    description: 'Budget per person in VND',
    example: 100000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  budget?: number;

  @ApiPropertyOptional({
    description: 'Meal time preference',
    enum: MealTime,
    example: MealTime.LUNCH,
  })
  @IsOptional()
  @IsEnum(MealTime)
  mealTime?: MealTime;

  @ApiPropertyOptional({
    description: 'Dietary preferences to filter by',
    type: [String],
    example: ['vegetarian', 'gluten-free'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dietaryPreferences?: DietaryPreference[];

  @ApiPropertyOptional({
    description: 'Use user profile preferences (from onboarding)',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  useProfilePreferences?: boolean;

  @ApiPropertyOptional({
    description: 'Sort results by',
    enum: SortBy,
    example: SortBy.MATCHING_SCORE,
    default: SortBy.MATCHING_SCORE,
  })
  @IsOptional()
  @IsEnum(SortBy)
  sortBy?: SortBy;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of results per page',
    example: 20,
    default: 20,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Minimum rating filter (0-5)',
    example: 3.5,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  minRating?: number;

  @ApiPropertyOptional({
    description: 'Cuisine types to filter by',
    type: [String],
    example: ['Vietnamese', 'Japanese'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  cuisineTypes?: string[];
}
