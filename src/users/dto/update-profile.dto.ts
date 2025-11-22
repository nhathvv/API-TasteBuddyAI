import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsEnum,
    IsNumber,
    IsObject,
    IsOptional,
    IsString,
    ValidateNested,
} from 'class-validator';
import type {
    ActivityLevel,
    Allergen,
    DailyTargets,
    DietaryPreference,
    Gender,
    HealthGoal,
    NutritionGoals,
    SmartFeatures,
} from '../../onboarding/schemas/onboarding.schema';

class UpdateNutritionGoalsDto implements Partial<NutritionGoals> {
    @ApiPropertyOptional({ enum: ['male', 'female', 'other'] })
    @IsOptional()
    @IsEnum(['male', 'female', 'other'])
    gender?: Gender;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    age?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    weight?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    height?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    activityLevel?: ActivityLevel;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    goal?: HealthGoal;

    @ApiPropertyOptional()
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    healthConditions?: any[];
}

class UpdateDailyTargetsDto implements Partial<DailyTargets> {
    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    calories?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    protein?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    carbs?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    fats?: number;
}

class UpdateSmartFeaturesDto implements Partial<SmartFeatures> {
    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    cameraAccess?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    locationAccess?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    notifications?: boolean;
}

class UpdateAllergenDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    type?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    severity?: string;
}

export class UpdateOnboardingDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    language?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    dietaryPreferences?: DietaryPreference[];

    @ApiPropertyOptional({ type: [UpdateAllergenDto] })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdateAllergenDto)
    allergens?: UpdateAllergenDto[];

    @ApiPropertyOptional()
    @IsOptional()
    @ValidateNested()
    @Type(() => UpdateNutritionGoalsDto)
    nutritionGoals?: UpdateNutritionGoalsDto;

    @ApiPropertyOptional()
    @IsOptional()
    @ValidateNested()
    @Type(() => UpdateDailyTargetsDto)
    dailyTargets?: UpdateDailyTargetsDto;

    @ApiPropertyOptional()
    @IsOptional()
    @ValidateNested()
    @Type(() => UpdateSmartFeaturesDto)
    smartFeatures?: UpdateSmartFeaturesDto;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    completed?: boolean;
}

export class UpdateProfileDto {
    @ApiPropertyOptional({ example: 'John Doe' })
    @IsOptional()
    @IsString()
    fullName?: string;

    @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
    @IsOptional()
    @IsString()
    avatar?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @ValidateNested()
    @Type(() => UpdateOnboardingDto)
    onboarding?: UpdateOnboardingDto;
}
