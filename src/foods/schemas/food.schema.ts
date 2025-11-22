import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import {
  DietaryPreference,
  AllergenType,
  HealthGoal,
} from '../../onboarding/schemas/onboarding.schema';

export type MealTime = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  sugar: number;
  sodium: number;
  servingSize: string;
}

export interface HealthScore {
  overall: number; // 0-100
  nutritionScore: number; // Based on nutrition balance
  allergenSafety: number; // Based on allergen compatibility
  dietaryCompliance: number; // Based on dietary preferences
}

@Schema({ timestamps: true, collection: 'foods' })
export class Food extends Document {
  @ApiProperty({ description: 'Restaurant reference' })
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Restaurant',
    required: true,
  })
  restaurantId: MongooseSchema.Types.ObjectId;

  @ApiProperty({ description: 'Food name', example: 'Grilled Salmon Salad' })
  @Prop({ required: true })
  name: string;

  @ApiProperty({ description: 'Food description' })
  @Prop()
  description: string;

  @ApiProperty({ description: 'Food category', example: 'Main Course' })
  @Prop()
  category: string;

  @ApiProperty({ description: 'Price in VND', example: 150000 })
  @Prop({ required: true })
  price: number;

  @ApiProperty({ description: 'Currency code', example: 'VND' })
  @Prop({ default: 'VND' })
  currency: string;

  @ApiProperty({ description: 'Food images URLs' })
  @Prop({ type: [String], default: [] })
  images: string[];

  @ApiProperty({ description: 'Nutrition information' })
  @Prop({
    type: {
      calories: Number,
      protein: Number,
      carbs: Number,
      fats: Number,
      fiber: Number,
      sugar: Number,
      sodium: Number,
      servingSize: String,
    },
    required: true,
  })
  nutritionInfo: NutritionInfo;

  @ApiProperty({ description: 'Ingredients list' })
  @Prop({ type: [String], default: [] })
  ingredients: string[];

  @ApiProperty({ description: 'Allergens present in the food' })
  @Prop({ type: [String], default: [] })
  allergens: AllergenType[];

  @ApiProperty({ description: 'Dietary preferences this food satisfies' })
  @Prop({ type: [String], default: [] })
  dietaryPreferences: DietaryPreference[];

  @ApiProperty({ description: 'Suitable meal times' })
  @Prop({ type: [String], default: [] })
  mealTimes: MealTime[];

  @ApiProperty({ description: 'Best suited health goals' })
  @Prop({ type: [String], default: [] })
  suitableForGoals: HealthGoal[];

  @ApiProperty({ description: 'Health and compatibility scores' })
  @Prop({
    type: {
      overall: Number,
      nutritionScore: Number,
      allergenSafety: Number,
      dietaryCompliance: Number,
    },
  })
  healthScore: HealthScore;

  @ApiProperty({ description: 'Average rating (0-5)', example: 4.5 })
  @Prop({ min: 0, max: 5, default: 0 })
  rating: number;

  @ApiProperty({ description: 'Total number of reviews', example: 45 })
  @Prop({ default: 0 })
  reviewCount: number;

  @ApiProperty({ description: 'Whether food is currently available' })
  @Prop({ default: true })
  isAvailable: boolean;

  @ApiProperty({ description: 'Preparation time in minutes', example: 15 })
  @Prop()
  preparationTime: number;

  @ApiProperty({ description: 'Spice level (0-5)', example: 2 })
  @Prop({ min: 0, max: 5, default: 0 })
  spiceLevel: number;

  @ApiProperty({ description: 'Whether this is a popular/featured item' })
  @Prop({ default: false })
  isFeatured: boolean;
}

export const FoodSchema = SchemaFactory.createForClass(Food);

// Create indexes for common queries
FoodSchema.index({ restaurantId: 1 });
FoodSchema.index({ mealTimes: 1 });
FoodSchema.index({ suitableForGoals: 1 });
FoodSchema.index({ dietaryPreferences: 1 });
FoodSchema.index({ price: 1 });
FoodSchema.index({ 'healthScore.overall': -1 });
