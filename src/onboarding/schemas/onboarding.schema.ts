import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type Language = {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
};

export type DietaryPreference =
  | 'halal'
  | 'vegan'
  | 'kosher'
  | 'vegetarian'
  | 'low-carb'
  | 'lactose-intolerant'
  | 'gluten-free'
  | 'pescatarian';

export type AllergenType =
  | 'peanuts'
  | 'shellfish'
  | 'dairy'
  | 'eggs'
  | 'fish'
  | 'soy'
  | 'wheat'
  | 'tree-nuts'
  | 'sesame';

export type AllergenSeverity = 'mild' | 'moderate' | 'severe';

export interface Allergen {
  type: AllergenType;
  severity: AllergenSeverity;
}

export type Gender = 'male' | 'female' | 'other';

export type ActivityLevel =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'active'
  | 'very-active';

export type HealthGoal = 'lose-weight' | 'maintain' | 'gain-muscle';

export type HealthCondition =
  | 'diabetes'
  | 'high-blood-pressure'
  | 'high-cholesterol'
  | 'heart-disease'
  | 'none';

export interface NutritionGoals {
  gender: Gender;
  age: number;
  weight: number;
  height: number;
  activityLevel: ActivityLevel;
  goal: HealthGoal;
  healthConditions: HealthCondition[];
}

export interface DailyTargets {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface SmartFeatures {
  cameraAccess: boolean;
  locationAccess: boolean;
  notifications: boolean;
}

@Schema({ timestamps: true, collection: 'onboarding' })
export class Onboarding extends Document {
  @ApiProperty({ description: 'User ID reference' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: MongooseSchema.Types.ObjectId;

  @ApiProperty({ description: 'Selected language code', example: 'en' })
  @Prop({ required: true })
  language: string;

  @ApiProperty({
    description: 'Dietary preferences',
    example: ['vegetarian', 'gluten-free'],
  })
  @Prop({ type: [String], default: [] })
  dietaryPreferences: DietaryPreference[];

  @ApiProperty({ description: 'Allergens with severity levels' })
  @Prop({
    type: [
      {
        type: { type: String },
        severity: { type: String },
      },
    ],
    default: [],
  })
  allergens: Allergen[];

  @ApiProperty({ description: 'Nutrition goals and health information' })
  @Prop({
    type: {
      gender: { type: String },
      age: { type: Number },
      weight: { type: Number },
      height: { type: Number },
      activityLevel: { type: String },
      goal: { type: String },
      healthConditions: { type: [String] },
    },
    required: true,
  })
  nutritionGoals: NutritionGoals;

  @ApiProperty({ description: 'Daily nutritional targets' })
  @Prop({
    type: {
      calories: { type: Number },
      protein: { type: Number },
      carbs: { type: Number },
      fats: { type: Number },
    },
    required: true,
  })
  dailyTargets: DailyTargets;

  @ApiProperty({ description: 'Smart features permissions' })
  @Prop({
    type: {
      cameraAccess: { type: Boolean },
      locationAccess: { type: Boolean },
      notifications: { type: Boolean },
    },
    required: true,
  })
  smartFeatures: SmartFeatures;

  @ApiProperty({ description: 'Onboarding completion status', example: true })
  @Prop({ default: false })
  completed: boolean;
}

export const OnboardingSchema = SchemaFactory.createForClass(Onboarding);
