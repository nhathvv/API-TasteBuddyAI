import { SchemaType } from '@google/generative-ai';
import {
  Gender,
  ActivityLevel,
  NutritionGoal,
  NutritionTargets,
} from '@/shared/utils/nutrition-calculations.util';

/**
 * Health Conditions that affect nutrition
 */
export type HealthCondition =
  | 'diabetes'
  | 'type-2-diabetes'
  | 'pre-diabetes'
  | 'hypertension'
  | 'high-blood-pressure'
  | 'high-cholesterol'
  | 'kidney-disease'
  | 'chronic-kidney-disease'
  | 'heart-disease'
  | 'pcos'
  | 'thyroid'
  | 'none';

/**
 * Dietary Preferences
 */
export type DietaryPreference =
  | 'vegan'
  | 'vegetarian'
  | 'halal'
  | 'kosher'
  | 'low-carb'
  | 'keto'
  | 'paleo'
  | 'mediterranean'
  | 'none';

/**
 * User Profile for Nutrition Analysis
 */
export interface UserProfile {
  /** Age in years */
  age: number;

  /** Biological gender */
  gender: Gender;

  /** Weight in kilograms */
  weight: number;

  /** Height in centimeters */
  height: number;

  /** Activity level */
  activityLevel: ActivityLevel;

  /** Primary nutrition goal */
  goal: NutritionGoal;

  /** Health conditions (affects recommendations) */
  healthConditions?: HealthCondition[];

  /** Dietary preferences (affects meal suggestions) */
  dietaryPreferences?: DietaryPreference[];
}

/**
 * Request Type for NCA
 */
export type RequestType =
  | 'daily-targets' // Calculate BMR/TDEE/macros
  | 'meal-plan' // Generate meal plan
  | 'dish-analysis' // Analyze specific dishes
  | 'macro-balance'; // Balance macros across meals

/**
 * Timeframe for meal planning
 */
export type Timeframe = 'daily' | 'weekly' | 'monthly';

/**
 * NCA Input Schema
 */
export interface NCAInput {
  /** User profile data */
  userProfile: UserProfile;

  /** Type of request */
  requestType: RequestType;

  /** Timeframe for meal planning (if applicable) */
  timeframe?: Timeframe;

  /** Optional: Menu items to analyze (for dish-analysis) */
  menuItems?: Array<{
    name: string;
    description?: string;
    estimatedCalories?: number;
    estimatedProtein?: number;
    estimatedCarbs?: number;
    estimatedFats?: number;
  }>;
}

/**
 * Recommendation Priority
 */
export type RecommendationPriority = 'high' | 'medium' | 'low';

/**
 * Recommendation Category
 */
export type RecommendationCategory =
  | 'calories'
  | 'macros'
  | 'micronutrients'
  | 'timing'
  | 'hydration'
  | 'supplements';

/**
 * Nutrition Recommendation
 */
export interface Recommendation {
  /** Category of recommendation */
  category: RecommendationCategory;

  /** Priority level */
  priority: RecommendationPriority;

  /** Recommendation text */
  text: string;

  /** Scientific basis/reference (optional) */
  scientificBasis?: string;
}

/**
 * Meal Type
 */
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

/**
 * Individual Meal
 */
export interface Meal {
  /** Type of meal */
  mealType: MealType;

  /** Dishes/items in this meal */
  dishes: string[];

  /** Nutrition breakdown for this meal */
  nutrition: NutritionTargets;

  /** Suggested timing (optional) */
  timing?: string;

  /** Vietnamese cuisine notes (optional) */
  vietnameseNotes?: string;
}

/**
 * Meal Plan
 */
export interface MealPlan {
  /** Array of meals */
  meals: Meal[];

  /** Total nutrition across all meals */
  totalNutrition: NutritionTargets;

  /** How well the plan matches user goals (0.0 - 1.0) */
  adherenceScore: number;

  /** Notes about the meal plan */
  notes?: string[];
}

/**
 * NCA Output Schema
 */
export interface NCAOutput {
  /** Calculated daily targets (always included) */
  dailyTargets: NutritionTargets;

  /** Personalized recommendations */
  recommendations: Recommendation[];

  /** Meal plan (if requested) */
  mealPlan?: MealPlan;

  /** Health warnings (if applicable) */
  warnings?: string[];

  /** Educational insights */
  insights?: string[];
}

/**
 * Gemini JSON Schema for Nutrition Coach Output
 */
export const NUTRITION_COACH_SCHEMA = {
  description: 'Personalized nutrition coaching response',
  type: SchemaType.OBJECT,
  properties: {
    dailyTargets: {
      type: SchemaType.OBJECT,
      description: 'Calculated daily nutrition targets',
      properties: {
        calories: {
          type: SchemaType.NUMBER,
          description: 'Daily calorie target',
        },
        protein: {
          type: SchemaType.NUMBER,
          description: 'Daily protein in grams',
        },
        carbs: {
          type: SchemaType.NUMBER,
          description: 'Daily carbs in grams',
        },
        fats: {
          type: SchemaType.NUMBER,
          description: 'Daily fats in grams',
        },
        fiber: {
          type: SchemaType.NUMBER,
          description: 'Daily fiber in grams',
          nullable: true,
        },
        sodium: {
          type: SchemaType.NUMBER,
          description: 'Daily sodium limit in mg',
          nullable: true,
        },
        sugar: {
          type: SchemaType.NUMBER,
          description: 'Daily sugar limit in grams',
          nullable: true,
        },
        macroRatio: {
          type: SchemaType.OBJECT,
          properties: {
            protein: { type: SchemaType.NUMBER },
            carbs: { type: SchemaType.NUMBER },
            fats: { type: SchemaType.NUMBER },
          },
          required: ['protein', 'carbs', 'fats'],
        },
      },
      required: ['calories', 'protein', 'carbs', 'fats', 'macroRatio'],
    },
    recommendations: {
      type: SchemaType.ARRAY,
      description: 'Personalized nutrition recommendations',
      items: {
        type: SchemaType.OBJECT,
        properties: {
          category: {
            type: SchemaType.STRING,
            enum: [
              'calories',
              'macros',
              'micronutrients',
              'timing',
              'hydration',
              'supplements',
            ],
          },
          priority: {
            type: SchemaType.STRING,
            enum: ['high', 'medium', 'low'],
          },
          text: {
            type: SchemaType.STRING,
            description: 'Recommendation text (2-3 sentences)',
          },
          scientificBasis: {
            type: SchemaType.STRING,
            description: 'Scientific reference (optional)',
            nullable: true,
          },
        },
        required: ['category', 'priority', 'text'],
      },
    },
    mealPlan: {
      type: SchemaType.OBJECT,
      description: 'Meal plan (if requested)',
      nullable: true,
      properties: {
        meals: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              mealType: {
                type: SchemaType.STRING,
                enum: ['breakfast', 'lunch', 'dinner', 'snack'],
              },
              dishes: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: 'Vietnamese dish names',
              },
              nutrition: {
                type: SchemaType.OBJECT,
                properties: {
                  calories: { type: SchemaType.NUMBER },
                  protein: { type: SchemaType.NUMBER },
                  carbs: { type: SchemaType.NUMBER },
                  fats: { type: SchemaType.NUMBER },
                },
              },
              timing: {
                type: SchemaType.STRING,
                nullable: true,
              },
              vietnameseNotes: {
                type: SchemaType.STRING,
                nullable: true,
              },
            },
            required: ['mealType', 'dishes', 'nutrition'],
          },
        },
        totalNutrition: {
          type: SchemaType.OBJECT,
          properties: {
            calories: { type: SchemaType.NUMBER },
            protein: { type: SchemaType.NUMBER },
            carbs: { type: SchemaType.NUMBER },
            fats: { type: SchemaType.NUMBER },
          },
        },
        adherenceScore: {
          type: SchemaType.NUMBER,
          description: 'How well plan matches goals (0.0-1.0)',
        },
        notes: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          nullable: true,
        },
      },
      required: ['meals', 'totalNutrition', 'adherenceScore'],
    },
    warnings: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: 'Health warnings if applicable',
      nullable: true,
    },
    insights: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: 'Educational insights',
      nullable: true,
    },
  },
  required: ['dailyTargets', 'recommendations'],
};

/**
 * Validation functions
 */

export function validateNCAInput(input: NCAInput): boolean {
  if (!input.userProfile) {
    throw new Error('userProfile is required');
  }

  const { age, weight, height } = input.userProfile;

  if (age <= 0 || age > 120) {
    throw new Error('Age must be between 1 and 120 years');
  }

  if (weight <= 0 || weight > 300) {
    throw new Error('Weight must be between 1 and 300 kg');
  }

  if (height <= 0 || height > 250) {
    throw new Error('Height must be between 1 and 250 cm');
  }

  if (!input.requestType) {
    throw new Error('requestType is required');
  }

  return true;
}

export function validateNCAOutput(output: NCAOutput): boolean {
  if (!output.dailyTargets) {
    throw new Error('dailyTargets is required');
  }

  if (!output.recommendations || output.recommendations.length === 0) {
    throw new Error('At least one recommendation is required');
  }

  const { calories, protein, carbs, fats } = output.dailyTargets;

  if (calories <= 0 || protein <= 0 || carbs <= 0 || fats <= 0) {
    throw new Error('All daily targets must be positive numbers');
  }

  return true;
}
