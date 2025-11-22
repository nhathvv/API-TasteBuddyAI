import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { GeminiCoreService } from '@/shared/services/gemini-core.service';
import { HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import {
    FOOD_IMAGE_VALIDATION_SCHEMA,
    FoodImageValidationOutput,
} from './food-image-validation.schema';
import sharp from 'sharp';
import * as crypto from 'crypto';

@Injectable()
export class FoodImageValidationService {
    private readonly logger = new Logger(FoodImageValidationService.name);

    // Simple in-memory cache: Hash -> { result, timestamp }
    // In production, replace this with Redis
    private readonly cache = new Map<string, { data: FoodImageValidationOutput; timestamp: number }>();
    private readonly CACHE_TTL_MS = 3600 * 1000; // 1 hour

    // Configuration
    private readonly MAX_DIMENSION = 1024;
    private readonly FOOD_CONFIDENCE_THRESHOLD = 0.75;

    constructor(private readonly geminiService: GeminiCoreService) { }

    /**
     * Main Entry Point: Validate and Classify Food Image
     * Flow: Resize -> Hash -> Cache Check -> AI Validation
     */
    async validateImage(
        imageBuffer: Buffer,
        mimeType: string,
    ): Promise<FoodImageValidationOutput> {
        const startTime = Date.now();

        // Layer 0: Technical Pre-check & Optimization
        const resizedBuffer = await this.resizeImage(imageBuffer);
        const resizeTime = Date.now() - startTime;
        this.logger.log(`Image resized in ${resizeTime}ms`);

        // Layer 2: Caching (Check before AI)
        const imageHash = this.computeHash(resizedBuffer);
        const cachedResult = this.getFromCache(imageHash);
        this.logger.log(`Image hashed in ${Date.now() - startTime}ms`);

        if (cachedResult) {
            this.logger.log(`Cache HIT for image hash: ${imageHash.substring(0, 8)}`);
            return cachedResult;
        }

        // Layer 1: AI Gatekeeper (Gemini Flash)
        this.logger.log(`Cache MISS. Calling Gemini Flash...`);
        const aiResult = await this.callGeminiFlash(resizedBuffer, mimeType);
        console.log(aiResult);
        this.logger.log(`Gemini Flash completed in ${Date.now() - startTime}ms`);
        const totalTime = Date.now() - startTime;

        this.logger.log(
            `Validation complete. Resize: ${resizeTime}ms, Total: ${totalTime}ms. IsFood: ${aiResult.isFoodImage} (${aiResult.confidence})`,
        );

        // Strict Rejection Logic
        if (!aiResult.isFoodImage || aiResult.confidence < this.FOOD_CONFIDENCE_THRESHOLD) {
            this.logger.warn(`Image rejected: Not food or low confidence (${aiResult.confidence})`);
            // We return the result, caller will throw exception
        } else {
            this.saveToCache(imageHash, aiResult);
        }

        return aiResult;
    }

    /**
     * Layer 0: Resize image to reduce payload and latency
     */
    private async resizeImage(buffer: Buffer): Promise<Buffer> {
        try {
            return await sharp(buffer)
                .resize({
                    width: this.MAX_DIMENSION,
                    height: this.MAX_DIMENSION,
                    fit: 'inside',
                    withoutEnlargement: true,
                })
                .jpeg({ quality: 80 }) // Standardize to JPEG
                .toBuffer();
        } catch (error) {
            this.logger.error(`Resize failed: ${error.message}`);
            throw new BadRequestException('Invalid image file or format');
        }
    }

    /**
     * Layer 2: Compute SHA-256 hash for caching
     */
    private computeHash(buffer: Buffer): string {
        return crypto.createHash('sha256').update(buffer).digest('hex');
    }

    /**
     * Cache Helpers
     */
    private getFromCache(hash: string): FoodImageValidationOutput | null {
        const entry = this.cache.get(hash);
        if (!entry) return null;

        if (Date.now() - entry.timestamp > this.CACHE_TTL_MS) {
            this.cache.delete(hash);
            return null;
        }

        return entry.data;
    }

    private saveToCache(hash: string, data: FoodImageValidationOutput): void {
        this.cache.set(hash, { data, timestamp: Date.now() });
        // Simple cleanup if cache gets too big
        if (this.cache.size > 1000) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
    }

    private async callGeminiFlash(
        buffer: Buffer,
        mimeType: string,
    ): Promise<FoodImageValidationOutput> {
        // Use 'gemini-flash-latest' for speed
        const model = this.geminiService.getGenerativeModel({
            model: 'gemini-flash-latest',
            generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 1024, // Increased to prevent truncation
            },
            safetySettings: [
                {
                    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                    threshold: HarmBlockThreshold.BLOCK_NONE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                    threshold: HarmBlockThreshold.BLOCK_NONE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                    threshold: HarmBlockThreshold.BLOCK_NONE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                    threshold: HarmBlockThreshold.BLOCK_NONE,
                },
            ],
        });

        const prompt = `You are FoodImageValidator.
Task: Validate if this image is clearly FOOD or DRINK.
Rules:
1. If clearly food/drink -> isFoodImage: true.
2. If selfie, document, receipt, random object, blurry -> isFoodImage: false.
3. Classify category: 'single_dish', 'multi_dish_table', 'menu_photo', 'non_food'.
4. If single_dish, try to guess canonicalDishName (Vietnamese priority).
5. Be strict. If unsure, set isFoodImage: false.

Return ONLY valid JSON matching this structure:
{
  "isFoodImage": boolean,
  "category": "single_dish" | "multi_dish_table" | "menu_photo" | "non_food",
  "confidence": number (0.0-1.0),
  "reason": "string"
}`;

        try {
            const result = await model.generateContent([
                prompt,
                {
                    inlineData: {
                        data: buffer.toString('base64'),
                        mimeType: 'image/jpeg', // Always JPEG after resize
                    },
                },
            ]);

            const response = result.response;

            // Check for safety blocks
            if (response.promptFeedback?.blockReason) {
                this.logger.error(`Response blocked: ${response.promptFeedback.blockReason}`);
                throw new Error(`Content blocked by safety filters: ${response.promptFeedback.blockReason}`);
            }

            // Check finishReason for truncation
            const candidate = response.candidates?.[0];
            if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
                this.logger.warn(`Response may be truncated. FinishReason: ${candidate.finishReason}`);
            }

            const responseText = response.text();
            this.logger.debug(`Raw Gemini response (${responseText.length} chars): ${responseText.substring(0, 500)}`);

            if (!responseText || responseText.trim() === '') {
                this.logger.error('Empty response from Gemini. Candidates:', JSON.stringify(response.candidates));
                throw new Error('Empty response from Gemini');
            }

            // Clean JSON from markdown code blocks if present
            let cleanedText = responseText.trim();
            if (cleanedText.startsWith('```json')) {
                cleanedText = cleanedText.replace(/```json\n?/, '').replace(/\n?```$/, '');
            } else if (cleanedText.startsWith('```')) {
                cleanedText = cleanedText.replace(/```\n?/, '').replace(/\n?```$/, '');
            }

            // Try to fix incomplete JSON by completing it
            if (!cleanedText.endsWith('}')) {
                this.logger.warn('JSON appears incomplete, attempting to fix...');
                // Add missing closing braces and default values
                const openBraces = (cleanedText.match(/{/g) || []).length;
                const closeBraces = (cleanedText.match(/}/g) || []).length;
                const missing = openBraces - closeBraces;

                // Add minimal required fields if truncated
                if (!cleanedText.includes('"confidence"')) {
                    cleanedText += ',\n  "confidence": 0.5,\n  "reason": "Response truncated"';
                }
                if (!cleanedText.includes('"reason"')) {
                    cleanedText += ',\n  "reason": "Response truncated"';
                }

                // Close JSON
                cleanedText += '\n' + '}'.repeat(missing);
            }

            try {
                return JSON.parse(cleanedText) as FoodImageValidationOutput;
            } catch (parseError) {
                this.logger.error(`JSON parse error. Cleaned text: ${cleanedText}`);
                throw new Error(`Invalid JSON response: ${parseError.message}`);
            }
        } catch (error) {
            this.logger.error(`Gemini Flash validation failed: ${error.message}`);
            throw new BadRequestException('Failed to validate image content');
        }
    }
}
