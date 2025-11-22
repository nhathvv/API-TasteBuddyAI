import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import type {
  AllergenSeverity,
  AllergenType,
} from '@/ai-agents/allergen-safety/allergen-safety.schema';
import type { DietaryRestriction } from '@/ai-agents/dietary-compliance/dietary-compliance.schema';

const ALLERGEN_TYPES: AllergenType[] = [
  'peanuts',
  'tree-nuts',
  'shellfish',
  'fish',
  'eggs',
  'dairy',
  'soy',
  'wheat',
  'gluten',
  'sesame',
  'msg',
  'sulfites',
];

const ALLERGEN_SEVERITIES: AllergenSeverity[] = [
  'mild',
  'moderate',
  'severe',
  'life-threatening',
];

const DIETARY_RESTRICTIONS: DietaryRestriction[] = [
  'vegan',
  'vegetarian',
  'halal',
  'kosher',
  'low-carb',
  'keto',
  'paleo',
  'mediterranean',
  'gluten-free',
  'dairy-free',
  'pescatarian',
];

const ACTIVITY_LEVELS = ['sedentary', 'light', 'moderate', 'active', 'very-active'] as const;
const NUTRITION_GOALS = ['lose-weight', 'maintain', 'gain-muscle', 'health'] as const;
const GENDERS = ['male', 'female'] as const;

/**
 * DTO for allergen information
 */
export class AllergenDto {
  @ApiProperty({
    description: 'Type of allergen',
    enum: ALLERGEN_TYPES,
    example: 'shellfish',
  })
  @IsIn(ALLERGEN_TYPES)
  type: AllergenType;

  @ApiProperty({
    description: 'Severity level',
    enum: ALLERGEN_SEVERITIES,
    example: 'severe',
  })
  @IsIn(ALLERGEN_SEVERITIES)
  severity: AllergenSeverity;
}

/**
 * DTO for nutrition goals
 */
export class NutritionGoalsDto {
  @ApiProperty({ description: 'Gender', enum: GENDERS, example: 'male' })
  @IsIn(GENDERS)
  gender: 'male' | 'female';

  @ApiProperty({ description: 'Age in years', example: 30, minimum: 1, maximum: 120 })
  @IsInt()
  @Min(1)
  @Max(120)
  age: number;

  @ApiProperty({ description: 'Weight in kg', example: 70, minimum: 20, maximum: 300 })
  @IsNumber()
  @Min(20)
  @Max(300)
  weight: number;

  @ApiProperty({ description: 'Height in cm', example: 175, minimum: 50, maximum: 250 })
  @IsInt()
  @Min(50)
  @Max(250)
  height: number;

  @ApiProperty({
    description: 'Activity level',
    enum: ACTIVITY_LEVELS,
    example: 'moderate',
  })
  @IsIn(ACTIVITY_LEVELS)
  activityLevel: typeof ACTIVITY_LEVELS[number];

  @ApiProperty({
    description: 'Nutrition goal',
    enum: NUTRITION_GOALS,
    example: 'maintain',
  })
  @IsIn(NUTRITION_GOALS)
  goal: typeof NUTRITION_GOALS[number];

  @ApiPropertyOptional({
    description: 'Health conditions',
    type: [String],
    example: ['diabetes', 'hypertension'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  healthConditions?: string[];
}

/**
 * DTO for daily nutrition targets
 */
export class DailyTargetsDto {
  @ApiProperty({ description: 'Daily calorie target', example: 2000, minimum: 1000, maximum: 5000 })
  @IsInt()
  @Min(1000)
  @Max(5000)
  calories: number;

  @ApiProperty({ description: 'Daily protein target (g)', example: 150, minimum: 0, maximum: 500 })
  @IsInt()
  @Min(0)
  @Max(500)
  protein: number;

  @ApiProperty({ description: 'Daily carbs target (g)', example: 200, minimum: 0, maximum: 1000 })
  @IsInt()
  @Min(0)
  @Max(1000)
  carbs: number;

  @ApiProperty({ description: 'Daily fats target (g)', example: 65, minimum: 0, maximum: 300 })
  @IsInt()
  @Min(0)
  @Max(300)
  fats: number;
}

/**
 * DTO for upload scan request (multipart/form-data)
 *
 * Handles file upload + user profile data
 */
export class UploadScanDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Menu or food image file (JPEG, PNG, WebP)',
  })
  image: any; // File handled by FileInterceptor

  @ApiPropertyOptional({
    description: 'Language code for OCR and response',
    example: 'vi',
    default: 'vi',
    enum: ['vi', 'en'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['vi', 'en'])
  language?: string;

  // DEPRECATED: useCloudVision removed - now always uses Gemini Vision
  // @ApiPropertyOptional({
  //   description: 'Use Cloud Vision API for OCR (faster, more accurate)',
  //   example: false,
  //   default: false,
  // })
  // @IsOptional()
  // @Transform(({ value }) => value === 'true' || value === true)
  // @IsBoolean()
  // useCloudVision?: boolean;

  @ApiPropertyOptional({
    description: 'Extraction mode for Visual Extraction Agent (Gemini Vision)',
    example: 'quick',
    default: 'quick',
    enum: ['quick', 'full'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['quick', 'full'])
  extractionMode?: 'quick' | 'full';

  @ApiPropertyOptional({
    description: 'User allergens (JSON array)',
    type: 'string',
    example: '[{"type":"shellfish","severity":"severe"},{"type":"peanuts","severity":"moderate"}]',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return [];
    try {
      return typeof value === 'string' ? JSON.parse(value) : value;
    } catch {
      return [];
    }
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AllergenDto)
  allergens?: AllergenDto[];

  @ApiPropertyOptional({
    description: 'Dietary restrictions (JSON array)',
    type: 'string',
    example: '["vegan","gluten-free"]',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return [];
    try {
      return typeof value === 'string' ? JSON.parse(value) : value;
    } catch {
      return [];
    }
  })
  @IsArray()
  @IsIn(DIETARY_RESTRICTIONS, { each: true })
  dietaryPreferences?: DietaryRestriction[];

  @ApiPropertyOptional({
    description: 'Nutrition goals and user profile (JSON object)',
    type: 'string',
    example: '{"gender":"male","age":30,"weight":70,"height":175,"activityLevel":"moderate","goal":"maintain","healthConditions":[]}',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;
    try {
      return typeof value === 'string' ? JSON.parse(value) : value;
    } catch {
      return undefined;
    }
  })
  @ValidateNested()
  @Type(() => NutritionGoalsDto)
  nutritionGoals?: NutritionGoalsDto;

  @ApiPropertyOptional({
    description: 'Daily nutrition targets (JSON object)',
    type: 'string',
    example: '{"calories":2000,"protein":150,"carbs":200,"fats":65}',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;
    try {
      return typeof value === 'string' ? JSON.parse(value) : value;
    } catch {
      return undefined;
    }
  })
  @ValidateNested()
  @Type(() => DailyTargetsDto)
  dailyTargets?: DailyTargetsDto;

  @ApiPropertyOptional({
    description: 'Enable strict allergen checking mode',
    example: true,
    default: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  strictAllergenMode?: boolean;

  @ApiPropertyOptional({
    description: 'Additional context for analysis',
    example: 'Restaurant menu in Ho Chi Minh City',
  })
  @IsOptional()
  @IsString()
  context?: string;
}
