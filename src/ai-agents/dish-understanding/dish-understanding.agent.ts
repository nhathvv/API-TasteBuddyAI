import { Injectable } from '@nestjs/common';
import { BaseAIAgent } from '../base/base-agent.abstract';
import { GeminiCoreService } from '@/shared/services/gemini-core.service';
import {
    DUIAInput,
    DUIAOutput,
    validateDUIAInput,
    validateDUIAOutput,
    DISH_UNDERSTANDING_SCHEMA,
} from './dish-understanding.schema';
import { IDishItem, IDishUnderstanding } from '@/shared/types';

/**
 * Dish Understanding Ingredient Agent (DUIA)
 *
 * Senior culinary knowledge and dish-understanding agent specialized in Vietnamese cuisine.
 * Analyzes raw menu items to infer canonical dishes, ingredients, cooking methods,
 * dietary profiles, and allergen-related signals.
 *
 * Key Responsibilities:
 * - Ingredient inference from dish names and descriptions
 * - Cooking method identification
 * - Dietary profile analysis (vegetarian, vegan, gluten-free, etc.)
 * - Allergen signal detection for downstream safety agents
 * - Vietnamese cuisine domain knowledge application
 *
 * Safety-First Approach:
 * - Assumes common allergens even if not explicitly mentioned
 * - Marks hidden ingredients as "likely" or "possible"
 * - Uses domain knowledge (e.g., "Bún bò Huế" → fermented shrimp paste)
 *
 * @extends {BaseAIAgent<DUIAInput, DUIAOutput>}
 */
@Injectable()
export class DishUnderstandingAgent extends BaseAIAgent<DUIAInput, DUIAOutput> {
    constructor(geminiService: GeminiCoreService) {
        super(geminiService, {
            name: 'DishUnderstandingAgent',
            modelType: 'pro', // Use Pro for complex reasoning
            timeout: 30000, // 30 seconds for multi-dish analysis
            cacheable: true, // Can cache common dishes
            systemInstruction: `You are DishUnderstandingIngredientAgent (DUIA).

You are a senior culinary knowledge and dish-understanding agent,
specialized in Vietnamese cuisine and restaurant menus.

YOUR JOB:
- Take raw menu items (dishName + description + section) from Visual Extraction Agent
- Infer canonical dish, ingredients, cooking methods, dietary profile, and allergen signals
- Always return STRICT, VALID JSON following the given schema exactly
- Your output will be consumed by downstream Safety (Allergen) and Business agents
- You MUST prioritize food safety over optimism

DOMAIN & SAFETY RULES (VERY IMPORTANT):

1. Vietnamese Restaurant Context:
   - Assume Vietnamese restaurant by default unless stated otherwise
   - Use authentic Vietnamese cuisine knowledge
   - Consider regional variations (North, Central, South Vietnam)

2. Safety-First Allergen Inference:
   - If allergen is common in standard recipe, mark as "likely" or "possible"
   - NEVER be optimistic about allergens - err on side of caution
   - Examples of hidden allergens:
     * "Bún bò Huế" → usually includes fermented shrimp paste (mắm ruốc)
     * "Gỏi", "bún thịt nướng", "gỏi cuốn" → often crushed peanuts as garnish
     * "Sa tế" (chili oil) → frequently contains dried shrimp
     * "Chả", "xíu mại" (processed meat) → may contain wheat/gluten as binder
     * Deep-fried items → shared oil causing cross-contamination
     * "Nước mắm" (fish sauce) → in almost all savory dishes
     * "Hành phi" (fried shallots) → may share oil with shrimp

3. Domain Knowledge Examples:
   - "Phở" → beef/chicken broth, rice noodles, herbs, no peanuts typically
   - "Bún bò Huế" → lemongrass, fermented shrimp paste, beef, pork blood
   - "Cơm tấm" → broken rice, grilled pork, fish sauce, pickled vegetables
   - "Bánh xèo" → rice flour crepe, turmeric, coconut milk, bean sprouts, shrimp/pork
   - "Gỏi cuốn" → rice paper, vermicelli, herbs, shrimp/pork, PEANUT SAUCE
   - "Chả giò" → spring rolls, wheat wrapper possible, pork/shrimp filling

4. Do NOT Hallucinate:
   - Only infer typical, common, plausible ingredients
   - If unsure, lower confidenceScore and explain in reasoningSummary
   - Don't invent exotic ingredients without reason

5. Formatting Rules:
   - Output MUST be valid JSON
   - NO markdown, NO commentary outside JSON
   - Follow schema strictly

INPUT FORMAT:
You receive an ARRAY of dish items, each with:
- dishId: stable id (string)
- dishName: raw name from menu (Vietnamese)
- description: optional description (string | null)
- sectionName: menu section like "Món nước", "Cơm", "Đồ uống" (string | null)
- restaurantRegion: optional region hint like "Hue", "Saigon", "Hanoi" (string | null)
- language: menu language code, default "vi" (string | null)

OUTPUT FORMAT:
For EACH input dish:
1. Copy dishId
2. Set originalName = dishName
3. Infer canonicalName and possibleAliases (include English if applicable)
4. Build ingredients array:
   - name (local language or as seen)
   - canonicalName (normalized English)
   - isPrimary (true for main ingredients)
   - isOptional (true for customizable toppings)
   - estimatedPresence: "mandatory" | "common" | "rare"
5. Infer cookingMethods: ["boiled", "grilled", "deep-fried", "raw", etc.]
6. Set baseDishType: one of the predefined types
7. Set cuisineRegion based on dish characteristics
8. Build dietaryProfile:
   - isLikelyVegetarian: boolean
   - isLikelyVegan: boolean
   - isLikelyGlutenFree: boolean
   - isLikelyDairyFree: boolean
   - notes: short explanation
9. Build inferredAllergenSignals (short signal strings):
   - "possible_shellfish_from_mam_ruoc"
   - "likely_peanut_garnish"
   - "possible_gluten_from_soy_sauce_marinade"
   - "possible_egg_from_mayonnaise"
   - "likely_fish_sauce_in_broth"
10. Set confidenceScore (0.0 - 1.0)
11. Write reasoningSummary (1-3 sentences)

IMPORTANT:
- Do NOT omit dishes from output
- For each input dish, produce ONE output object
- Stay close to typical recipes, don't invent
- Mark uncertainty in confidenceScore and reasoningSummary`,
        });
    }

    /**
     * Validate DUIA input
     */
    public validate(input: DUIAInput): boolean {
        try {
            validateDUIAInput(input);
            return true;
        } catch (error) {
            this.logger.error(`Input validation failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Process dish items and generate understanding
     */
    protected async process(input: DUIAInput): Promise<DUIAOutput> {
        const startTime = Date.now();

        this.logger.log(`Analyzing ${input.dishes.length} dishes`);

        // Build prompt with dish array
        const prompt = this.buildAnalysisPrompt(input);

        // Get Gemini Pro model for complex reasoning
        const model = this.getModel();

        try {
            // Generate content with structured output
            const result = await model.generateContent({
                contents: [
                    {
                        role: 'user',
                        parts: [{ text: prompt }],
                    },
                ],
                generationConfig: {
                    ...this.getGenerationConfig(),
                    responseMimeType: 'application/json',
                    responseSchema: DISH_UNDERSTANDING_SCHEMA as any,
                },
            });

            const response = result.response;
            const text = response.text();

            // Parse JSON response
            const parsedOutput = JSON.parse(text) as DUIAOutput;

            // Calculate average confidence
            const totalConfidence = parsedOutput.dishes.reduce(
                (sum, dish) => sum + dish.confidenceScore,
                0,
            );
            parsedOutput.metadata.averageConfidence =
                totalConfidence / parsedOutput.dishes.length;

            // Add processing time
            parsedOutput.metadata.processingTime = Date.now() - startTime;

            this.logger.log(
                `Analyzed ${parsedOutput.metadata.totalDishes} dishes in ${parsedOutput.metadata.processingTime}ms`,
            );

            return parsedOutput;
        } catch (error) {
            this.logger.error(`Dish analysis failed: ${error.message}`);
            throw new Error(`Failed to analyze dishes: ${error.message}`);
        }
    }

    /**
     * Build analysis prompt with dish data
     */
    private buildAnalysisPrompt(input: DUIAInput): string {
        const dishesJson = JSON.stringify(input.dishes, null, 2);

        let prompt = `Analyze these Vietnamese menu items and provide detailed ingredient understanding.

INPUT DISH ARRAY (JSON):

${dishesJson}

`;

        if (input.context) {
            prompt += `\nADDITIONAL CONTEXT:\n${input.context}\n\n`;
        }

        prompt += `Now respond with a JSON object containing:
- dishes: array of DishUnderstanding objects (one per input dish)
- metadata: { totalDishes, averageConfidence }

Follow the schema exactly. Do not include any text outside of the JSON.
Remember: Safety first! Mark common allergens even if not explicitly mentioned.`;

        return prompt;
    }

    /**
     * Validate output structure
     */
    protected validateOutput(output: DUIAOutput): boolean {
        try {
            validateDUIAOutput(output);

            // Additional validation
            if (output.metadata.averageConfidence < 0 || output.metadata.averageConfidence > 1) {
                this.logger.warn('Average confidence out of range [0, 1]');
            }

            // Warn about low confidence dishes
            const lowConfidenceDishes = output.dishes.filter((d) => d.confidenceScore < 0.5);
            if (lowConfidenceDishes.length > 0) {
                this.logger.warn(
                    `${lowConfidenceDishes.length} dishes with confidence < 0.5: ${lowConfidenceDishes.map((d) => d.originalName).join(', ')}`,
                );
            }

            return true;
        } catch (error) {
            this.logger.error(`Output validation failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Handle DUIA-specific errors
     */
    protected handleError(error: Error): Error {
        if (error.message.includes('dishes must be an array')) {
            return new Error('DUIA_INVALID_INPUT: Input must contain dishes array');
        }

        if (error.message.includes('dishName')) {
            return new Error(
                'DUIA_INVALID_DISH: Each dish must have dishId and dishName',
            );
        }

        if (error.message.includes('timeout')) {
            return new Error(
                'DUIA_TIMEOUT: Dish analysis took too long. Try fewer dishes or simpler menu.',
            );
        }

        // Default error handling
        return new Error(`DUIA_ERROR: ${error.message}`);
    }
}
