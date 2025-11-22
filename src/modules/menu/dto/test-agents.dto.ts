import { Type } from 'class-transformer';
import {
    ArrayMinSize,
    IsArray,
    IsBoolean,
    IsIn,
    IsNumber,
    IsOptional,
    IsString,
    ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
    AllergenSeverity,
    AllergenType,
} from '@/ai-agents/allergen-safety/allergen-safety.schema';
import type { DietaryRestriction } from '@/ai-agents/dietary-compliance/dietary-compliance.schema';
import type { MenuItem } from '@/ai-agents/visual-extraction/visual-extraction.schema';

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

class UserAllergenDto {
    @ApiProperty({
        description: 'Type of allergen',
        enum: ALLERGEN_TYPES,
        example: 'shellfish',
    })
    @IsIn(ALLERGEN_TYPES)
    type: AllergenType;

    @ApiProperty({
        description: 'Severity of allergic reaction',
        enum: ALLERGEN_SEVERITIES,
        example: 'severe',
    })
    @IsIn(ALLERGEN_SEVERITIES)
    severity: AllergenSeverity;
}

/**
 * DTO for testing Visual Extraction Agent
 * Extracts menu items from an image
 */
export class TestVisualExtractionDto {
    @ApiProperty({
        description: 'Base64 encoded image data (without data URI prefix)',
        example: 'iVBORw0KGgoAAAANSUhEUgAAAAUA...',
    })
    @IsString()
    imageData: string;

    @ApiProperty({
        description: 'MIME type of the image',
        enum: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
        example: 'image/jpeg',
    })
    @IsString()
    mimeType: string;

    @ApiPropertyOptional({
        description: 'Language for extraction',
        default: 'vi',
        example: 'vi',
    })
    @IsOptional()
    @IsString()
    language?: string = 'vi';

    @ApiPropertyOptional({
        description: 'Extraction mode: quick (faster) or full (more accurate)',
        enum: ['quick', 'full'],
        default: 'quick',
        example: 'quick',
    })
    @IsOptional()
    @IsString()
    extractionMode?: 'quick' | 'full' = 'quick';
}

/**
 * DTO for testing Allergen Safety Agent
 * Analyzes menu items for allergen risks
 */
export class TestAllergenSafetyDto {
    @ApiProperty({
        description: 'Array of menu items to analyze',
        type: 'array',
        example: [
            {
                name: 'Bún Đậu Mắm Tôm',
                description: 'Bún đậu với mắm tôm',
                price: 45000,
            },
        ],
    })
    @IsArray()
    @ArrayMinSize(1)
    menuItems: MenuItem[];

    @ApiProperty({
        description: "User's allergens with severity levels",
        type: [UserAllergenDto],
        example: [{ type: 'shellfish', severity: 'severe' }],
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UserAllergenDto)
    @ArrayMinSize(1)
    userAllergens: UserAllergenDto[];

    @ApiPropertyOptional({
        description: 'Strict mode: flag even trace amounts',
        default: true,
        example: true,
    })
    @IsOptional()
    @IsBoolean()
    strictMode?: boolean = true;

    @ApiPropertyOptional({
        description: 'Output language',
        default: 'en',
        example: 'en',
    })
    @IsOptional()
    @IsString()
    language?: string = 'en';
}

/**
 * DTO for testing Dietary Compliance Agent
 * Checks menu items against dietary restrictions
 */
export class TestDietaryComplianceDto {
    @ApiProperty({
        description: 'Array of menu items to check',
        type: 'array',
        example: [
            {
                name: 'Phở Chay',
                description: 'Phở chay với rau củ',
                price: 45000,
            },
        ],
    })
    @IsArray()
    @ArrayMinSize(1)
    menuItems: MenuItem[];

    @ApiProperty({
        description: "User's dietary restrictions",
        enum: DIETARY_RESTRICTIONS,
        isArray: true,
        example: ['vegan', 'gluten-free'],
    })
    @IsArray()
    @IsIn(DIETARY_RESTRICTIONS, { each: true })
    @ArrayMinSize(1)
    dietaryRestrictions: DietaryRestriction[];

    @ApiPropertyOptional({
        description: 'Additional context for analysis',
        example: 'Looking for authentic vegan Vietnamese options',
    })
    @IsOptional()
    @IsString()
    context?: string;
}

/**
 * DTO for testing Nutrition Coach Agent
 * Get nutrition analysis and recommendations
 */
export class TestNutritionCoachDto {
    // User Profile
    @ApiPropertyOptional({
        description: 'Age in years',
        minimum: 1,
        maximum: 120,
        default: 30,
        example: 30,
    })
    @IsOptional()
    @IsNumber()
    age?: number = 30;

    @ApiPropertyOptional({
        description: 'Biological gender',
        enum: ['male', 'female'],
        default: 'male',
        example: 'male',
    })
    @IsOptional()
    @IsIn(['male', 'female'])
    gender?: 'male' | 'female' = 'male';

    @ApiPropertyOptional({
        description: 'Weight in kilograms',
        minimum: 1,
        maximum: 300,
        default: 70,
        example: 70,
    })
    @IsOptional()
    @IsNumber()
    weight?: number = 70; // kg

    @ApiPropertyOptional({
        description: 'Height in centimeters',
        minimum: 1,
        maximum: 250,
        default: 170,
        example: 170,
    })
    @IsOptional()
    @IsNumber()
    height?: number = 170; // cm

    @ApiPropertyOptional({
        description: 'Activity level',
        enum: ['sedentary', 'light', 'moderate', 'active', 'very-active'],
        default: 'moderate',
        example: 'moderate',
    })
    @IsOptional()
    @IsIn(['sedentary', 'light', 'moderate', 'active', 'very-active'])
    activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very-active' = 'moderate';

    @ApiPropertyOptional({
        description: 'Nutrition goal',
        enum: ['weight-loss', 'weight-gain', 'maintain', 'muscle-gain', 'general-health'],
        default: 'maintain',
        example: 'weight-loss',
    })
    @IsOptional()
    @IsIn(['weight-loss', 'weight-gain', 'maintain', 'muscle-gain', 'general-health'])
    goal?: 'weight-loss' | 'weight-gain' | 'maintain' | 'muscle-gain' | 'general-health' = 'maintain';

    @ApiPropertyOptional({
        description: 'Health conditions affecting nutrition',
        type: [String],
        example: ['hypertension', 'diabetes'],
    })
    @IsOptional()
    @IsArray()
    healthConditions?: string[];

    @ApiPropertyOptional({
        description: 'Dietary preferences',
        type: [String],
        example: ['mediterranean', 'pescatarian'],
    })
    @IsOptional()
    @IsArray()
    dietaryPreferences?: string[];

    // Request Type
    @ApiPropertyOptional({
        description: 'Type of nutrition request',
        enum: ['daily-targets', 'meal-plan', 'dish-analysis', 'macro-balance'],
        default: 'daily-targets',
        example: 'daily-targets',
    })
    @IsOptional()
    @IsIn(['daily-targets', 'meal-plan', 'dish-analysis', 'macro-balance'])
    requestType?: 'daily-targets' | 'meal-plan' | 'dish-analysis' | 'macro-balance' = 'daily-targets';

    @ApiPropertyOptional({
        description: 'Timeframe for meal planning',
        enum: ['daily', 'weekly', 'monthly'],
        example: 'daily',
    })
    @IsOptional()
    @IsIn(['daily', 'weekly', 'monthly'])
    timeframe?: 'daily' | 'weekly' | 'monthly';

    @ApiPropertyOptional({
        description: 'Menu items for dish analysis',
        type: 'array',
        example: [
            { name: 'Phở Bò', estimatedCalories: 450 },
            { name: 'Cơm Gà', estimatedCalories: 650 },
        ],
    })
    @IsOptional()
    @IsArray()
    menuItems?: MenuItem[];
}
