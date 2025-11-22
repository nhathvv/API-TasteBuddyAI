import { SchemaType } from '@google/generative-ai';
import {
    BaseDishType,
    CuisineRegion,
    EstimatedPresence,
    IIngredientDetail,
    IDietaryProfile,
    IDishItem,
    IDishUnderstanding,
} from '@/shared/types';

/**
 * DUIA Input Schema
 */
export interface DUIAInput {
    /** Array of dish items from Visual Extraction Agent */
    dishes: IDishItem[];

    /** Additional context (optional) */
    context?: string;
}

/**
 * DUIA Output Schema
 */
export interface DUIAOutput {
    /** Array of dish understanding results */
    dishes: IDishUnderstanding[];

    /** Summary metadata */
    metadata: {
        totalDishes: number;
        averageConfidence: number;
        processingTime?: number;
    };
}

/**
 * Gemini JSON Schema for Dish Understanding
 */
export const DISH_UNDERSTANDING_SCHEMA = {
    description: 'Dish understanding and ingredient inference',
    type: SchemaType.OBJECT,
    properties: {
        dishes: {
            type: SchemaType.ARRAY,
            description: 'Array of dish analysis results',
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    dishId: {
                        type: SchemaType.STRING,
                        description: 'Unique dish identifier',
                    },
                    originalName: {
                        type: SchemaType.STRING,
                        description: 'Original menu name',
                    },
                    canonicalName: {
                        type: SchemaType.STRING,
                        description: 'Normalized dish name',
                    },
                    possibleAliases: {
                        type: SchemaType.ARRAY,
                        items: { type: SchemaType.STRING },
                        description: 'Alternative names/spellings',
                    },
                    ingredients: {
                        type: SchemaType.ARRAY,
                        description: 'Ingredient breakdown',
                        items: {
                            type: SchemaType.OBJECT,
                            properties: {
                                name: { type: SchemaType.STRING },
                                canonicalName: { type: SchemaType.STRING },
                                isPrimary: { type: SchemaType.BOOLEAN },
                                isOptional: { type: SchemaType.BOOLEAN },
                                estimatedPresence: {
                                    type: SchemaType.STRING,
                                    enum: ['mandatory', 'common', 'rare'],
                                },
                            },
                            required: [
                                'name',
                                'canonicalName',
                                'isPrimary',
                                'isOptional',
                                'estimatedPresence',
                            ],
                        },
                    },
                    cookingMethods: {
                        type: SchemaType.ARRAY,
                        items: { type: SchemaType.STRING },
                        description: 'Cooking methods used',
                    },
                    baseDishType: {
                        type: SchemaType.STRING,
                        description: 'Base dish category',
                        enum: [
                            'noodle_soup',
                            'rice_plate',
                            'salad',
                            'spring_rolls',
                            'grilled_meat',
                            'stir_fry',
                            'dessert',
                            'beverage',
                            'appetizer',
                            'other',
                        ],
                    },
                    cuisineRegion: {
                        type: SchemaType.STRING,
                        description: 'Vietnamese cuisine region',
                        enum: [
                            'north_vietnam',
                            'central_vietnam',
                            'south_vietnam',
                            'fusion',
                            'unknown',
                        ],
                    },
                    dietaryProfile: {
                        type: SchemaType.OBJECT,
                        description: 'Dietary profile analysis',
                        properties: {
                            isLikelyVegetarian: { type: SchemaType.BOOLEAN },
                            isLikelyVegan: { type: SchemaType.BOOLEAN },
                            isLikelyGlutenFree: { type: SchemaType.BOOLEAN },
                            isLikelyDairyFree: { type: SchemaType.BOOLEAN },
                            notes: { type: SchemaType.STRING },
                        },
                        required: [
                            'isLikelyVegetarian',
                            'isLikelyVegan',
                            'isLikelyGlutenFree',
                            'isLikelyDairyFree',
                            'notes',
                        ],
                    },
                    inferredAllergenSignals: {
                        type: SchemaType.ARRAY,
                        items: { type: SchemaType.STRING },
                        description: 'Allergen signals for downstream agents',
                    },
                    confidenceScore: {
                        type: SchemaType.NUMBER,
                        description: 'Confidence in analysis (0.0-1.0)',
                    },
                    reasoningSummary: {
                        type: SchemaType.STRING,
                        description: 'Short reasoning summary (1-3 sentences)',
                    },
                },
                required: [
                    'dishId',
                    'originalName',
                    'canonicalName',
                    'possibleAliases',
                    'ingredients',
                    'cookingMethods',
                    'baseDishType',
                    'cuisineRegion',
                    'dietaryProfile',
                    'inferredAllergenSignals',
                    'confidenceScore',
                    'reasoningSummary',
                ],
            },
        },
        metadata: {
            type: SchemaType.OBJECT,
            description: 'Summary metadata',
            properties: {
                totalDishes: {
                    type: SchemaType.NUMBER,
                    description: 'Total dishes analyzed',
                },
                averageConfidence: {
                    type: SchemaType.NUMBER,
                    description: 'Average confidence score',
                },
            },
            required: ['totalDishes', 'averageConfidence'],
        },
    },
    required: ['dishes', 'metadata'],
};

/**
 * Validation functions
 */
export function validateDUIAInput(input: DUIAInput): boolean {
    if (!input.dishes || !Array.isArray(input.dishes)) {
        throw new Error('dishes must be an array');
    }

    if (input.dishes.length === 0) {
        throw new Error('dishes cannot be empty');
    }

    for (const item of input.dishes) {
        if (!item.dishName || typeof item.dishName !== 'string') {
            throw new Error('Each dish item must have a dishName');
        }
        if (!item.dishId || typeof item.dishId !== 'string') {
            throw new Error('Each dish item must have a dishId');
        }
    }

    return true;
}

export function validateDUIAOutput(output: DUIAOutput): boolean {
    if (!output.dishes || !Array.isArray(output.dishes)) {
        throw new Error('dishes must be an array');
    }

    if (!output.metadata) {
        throw new Error('metadata is required');
    }

    if (output.metadata.totalDishes !== output.dishes.length) {
        throw new Error('metadata.totalDishes must match dishes.length');
    }

    return true;
}
