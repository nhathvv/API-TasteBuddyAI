import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
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

class UserAllergenDto {
  @IsIn(ALLERGEN_TYPES)
  type: AllergenType;

  @IsIn(ALLERGEN_SEVERITIES)
  severity: AllergenSeverity;
}

export class ScanMenuDto {
  @IsString()
  imageData: string;

  @IsString()
  mimeType: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  context?: string;

  @IsOptional()
  @IsBoolean()
  strictAllergenMode?: boolean = true;

  @IsOptional()
  @IsString()
  outputLanguage?: string;

  @IsOptional()
  @IsString()
  extractionMode?: 'quick' | 'full';

  @IsOptional()
  @IsBoolean()
  useCloudVision?: boolean = false;

  @IsOptional()
  @IsArray()
  @IsIn(DIETARY_RESTRICTIONS, { each: true })
  dietaryRestrictions?: DietaryRestriction[] = [];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserAllergenDto)
  @ArrayMinSize(0)
  userAllergens?: UserAllergenDto[] = [];
}
