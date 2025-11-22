import { SchemaType } from '@google/generative-ai';

/**
 * Food Image Validation Output Schema
 */
export interface FoodImageValidationOutput {
    /** Is this clearly a food/drink image? */
    isFoodImage: boolean;

    /** Coarse category of the image */
    category: 'single_dish' | 'multi_dish_table' | 'menu_photo' | 'non_food';

    /** Confidence score (0.0 - 1.0) */
    confidence: number;

    /** Short reasoning for the classification */
    reason: string;

    /** Preliminary dish recognition (optional) */
    dishRecognition?: {
        canonicalDishName: string | null;
        possibleAliases: string[];
        dishConfidence: number;
    };
}

/**
 * Gemini JSON Schema for Food Image Validation
 */
export const FOOD_IMAGE_VALIDATION_SCHEMA = {
    description: 'Food image validation and coarse classification',
    type: SchemaType.OBJECT,
    properties: {
        isFoodImage: {
            type: SchemaType.BOOLEAN,
            description: 'True if the image clearly shows food, drink, or a menu',
        },
        category: {
            type: SchemaType.STRING,
            description: 'Coarse category of the image',
            enum: ['single_dish', 'multi_dish_table', 'menu_photo', 'non_food'],
        },
        confidence: {
            type: SchemaType.NUMBER,
            description: 'Confidence score for the classification (0.0 - 1.0)',
        },
        reason: {
            type: SchemaType.STRING,
            description: 'Short explanation for the decision',
        },
        dishRecognition: {
            type: SchemaType.OBJECT,
            description: 'Preliminary dish recognition if applicable',
            properties: {
                canonicalDishName: {
                    type: SchemaType.STRING,
                    description: 'Best guess for the dish name (if single_dish)',
                    nullable: true,
                },
                possibleAliases: {
                    type: SchemaType.ARRAY,
                    items: { type: SchemaType.STRING },
                    description: 'Alternative names or English translations',
                    nullable: true,
                },
                dishConfidence: {
                    type: SchemaType.NUMBER,
                    description: 'Confidence in the specific dish recognition',
                    nullable: true,
                },
            },
            nullable: true,
        },
    },
    required: ['isFoodImage', 'category', 'confidence', 'reason'],
};
