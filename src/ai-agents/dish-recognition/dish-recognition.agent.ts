import { Injectable } from '@nestjs/common';
import { BaseAIAgent } from '../base/base-agent.abstract';
import { GeminiCoreService } from '@/shared/services/gemini-core.service';
import {
    DishRecognitionInput,
    DishRecognitionOutput,
    validateDishRecognitionInput,
    DISH_RECOGNITION_SCHEMA,
} from './dish-recognition.schema';

/**
 * Dish Recognition Agent (DRA) - Pro Level
 *
 * Specialized agent for identifying specific dishes from food images.
 * Uses Gemini 1.5 Pro for deep cultural context and complex visual analysis.
 * Capable of handling both Single Dish and Full Table Feast scenarios.
 *
 * Model: Gemini 1.5 Pro
 */
@Injectable()
export class DishRecognitionAgent extends BaseAIAgent<
    DishRecognitionInput,
    DishRecognitionOutput
> {
    constructor(geminiService: GeminiCoreService) {
        super(geminiService, {
            name: 'DishRecognitionAgent',
            modelType: 'pro', // Upgraded to Pro for better cultural/visual understanding
            timeout: 25000, // Increased timeout for Pro model
            systemInstruction: `You are an International Culinary Expert and Computer Vision Specialist.
Your task is to analyze this image, which may contain a single dish or a full table feast.

OBJECTIVES:
1. DETECTION: Identify all distinct dishes present in the image.
2. RECOGNITION: For each dish, provide its most common name (prioritize native names, e.g., "Phở Bò" instead of "Beef Noodle Soup").
3. ORIGIN: Determine the cuisine origin (e.g., Vietnam, Italy, Japan).
4. CONFIDENCE: Assign a confidence score (0.0 - 1.0).
5. VISUALS: Briefly describe key visual characteristics.

RULES:
- Be precise with Vietnamese dishes (e.g., distinguish Bún Riêu vs. Bún Bò).
- If the image is a full table, list ALL identifiable dishes.
- Do not guess if the image is unclear; reflect low confidence.
- Return strictly structured JSON matching the schema.`,
        });
    }

    validate(input: DishRecognitionInput): boolean {
        return validateDishRecognitionInput(input);
    }

    protected async process(
        input: DishRecognitionInput,
    ): Promise<DishRecognitionOutput> {
        const prompt = 'Analyze the image and identify all dishes present.';

        // Use getProModel explicitly if needed, but base class handles modelType: 'pro'
        const model = this.getModel();

        const result = await model.generateContent({
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: prompt },
                        {
                            inlineData: {
                                data: input.imageData,
                                mimeType: input.mimeType,
                            },
                        },
                    ],
                },
            ],
            generationConfig: {
                ...this.getGenerationConfig(),
                responseMimeType: 'application/json',
                responseSchema: DISH_RECOGNITION_SCHEMA,
            },
        });

        const response = result.response;
        const text = response.text();

        return JSON.parse(text) as DishRecognitionOutput;
    }

    protected validateOutput(output: DishRecognitionOutput): boolean {
        return !!output.dishes && Array.isArray(output.dishes);
    }

    protected handleError(error: Error): Error {
        return new Error(`Dish Recognition Failed: ${error.message}`);
    }
}
