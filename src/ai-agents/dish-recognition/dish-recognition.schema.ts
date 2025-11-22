import { SchemaType } from '@google/generative-ai';

/**
 * Input for Dish Recognition Agent
 */
export interface DishRecognitionInput {
    imageData: string;
    mimeType: string;
}

/**
 * Recognized Dish Item (Pro Level)
 */
export interface RecognizedDish {
    detectedDishName: string;
    cuisineOrigin: string;
    confidenceScore: number;
    visualCharacteristics?: string;
}

/**
 * Output for Dish Recognition Agent
 */
export interface DishRecognitionOutput {
    dishes: RecognizedDish[];
}

/**
 * Gemini JSON Schema for Dish Recognition (Strict)
 */
export const DISH_RECOGNITION_SCHEMA = {
    description: 'List of recognized dishes from the image',
    type: SchemaType.OBJECT,
    properties: {
        dishes: {
            type: SchemaType.ARRAY,
            description: 'List of detected dishes',
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    detectedDishName: {
                        type: SchemaType.STRING,
                        description: 'Name of the dish (e.g., Bún Chả, Pizza Margherita)',
                    },
                    cuisineOrigin: {
                        type: SchemaType.STRING,
                        description: 'Origin of the cuisine (e.g., Vietnam, Italy, Japan)',
                    },
                    confidenceScore: {
                        type: SchemaType.NUMBER,
                        description: 'Confidence score from 0.0 to 1.0',
                    },
                    visualCharacteristics: {
                        type: SchemaType.STRING,
                        description: 'Brief visual description (e.g., "Grilled pork with vermicelli")',
                        nullable: true,
                    },
                },
                required: ['detectedDishName', 'cuisineOrigin', 'confidenceScore'],
            },
        },
    },
    required: ['dishes'],
};

/**
 * Validation Function
 */
export function validateDishRecognitionInput(input: DishRecognitionInput): boolean {
    if (!input.imageData || !input.mimeType) {
        throw new Error('imageData and mimeType are required');
    }
    return true;
}
