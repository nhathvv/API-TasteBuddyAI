import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GoogleGenerativeAI,
  GenerativeModel,
  ModelParams,
  GenerationConfig,
} from '@google/generative-ai';

/**
 * Gemini Core Service
 *
 * Centralized service for managing Google Generative AI (Gemini) interactions.
 * Handles API key management, model initialization, and provides factory methods
 * for different Gemini model variants.
 *
 * @implements {OnModuleInit}
 */
@Injectable()
export class GeminiCoreService implements OnModuleInit {
  private readonly logger = new Logger(GeminiCoreService.name);
  private genAI: GoogleGenerativeAI;
  private readonly apiKey: string;

  // Model name constants - Using latest stable aliases
  private readonly GEMINI_PRO = 'gemini-pro-latest';
  private readonly GEMINI_FLASH = 'gemini-flash-latest';

  constructor(private readonly configService: ConfigService) {
    // Get API key from environment variables
    const apiKey = this.configService.get<string>('GOOGLE_API_KEY');

    if (!apiKey) {
      this.logger.error(
        'GOOGLE_API_KEY is not defined in environment variables',
      );
      throw new Error(
        'Missing GOOGLE_API_KEY. Please set it in your .env file.',
      );
    }

    this.apiKey = apiKey;
  }

  /**
   * Initialize GoogleGenerativeAI client on module initialization
   */
  onModuleInit() {
    this.genAI = new GoogleGenerativeAI(this.apiKey);
    this.logger.log('GeminiCoreService initialized successfully');
  }

  /**
   * Get a Gemini model instance with custom configuration
   *
   * @param modelName - The Gemini model name (default: gemini-1.5-pro)
   * @param params - Optional model parameters (systemInstruction, etc.)
   * @returns {GenerativeModel} Configured Gemini model instance
   *
   * @example
   * const model = geminiService.getModel('gemini-1.5-flash', {
   *   systemInstruction: 'You are a food safety expert...'
   * });
   */
  getModel(
    modelName: string = this.GEMINI_PRO,
    params?: Partial<ModelParams>,
  ): GenerativeModel {
    this.logger.debug(`Creating model instance: ${modelName}`);

    return this.genAI.getGenerativeModel({
      model: modelName,
      ...params,
    });
  }

  /**
   * Get a raw GenerativeModel instance (wrapper for genAI.getGenerativeModel)
   */
  getGenerativeModel(params: ModelParams): GenerativeModel {
    return this.genAI.getGenerativeModel(params);
  }

  /**
   * Get Gemini 1.5 Pro model (for complex reasoning tasks)
   *
   * Best for:
   * - Complex reasoning (allergen detection, nutrition coaching)
   * - Chain-of-thought prompting
   * - Large context windows (up to 2M tokens)
   *
   * @param params - Optional model parameters
   * @returns {GenerativeModel} Gemini Pro model instance
   */
  getProModel(params?: Partial<ModelParams>): GenerativeModel {
    return this.getModel(this.GEMINI_PRO, params);
  }

  /**
   * Get Gemini 1.5 Flash model (for fast, high-throughput tasks)
   *
   * Best for:
   * - Visual extraction (OCR)
   * - Quick classifications
   * - Real-time food recognition
   * - Cost-effective operations
   *
   * @param params - Optional model parameters
   * @returns {GenerativeModel} Gemini Flash model instance
   */
  getFlashModel(params?: Partial<ModelParams>): GenerativeModel {
    return this.getModel(this.GEMINI_FLASH, params);
  }

  /**
   * Generate content with automatic retry logic
   *
   * @param model - The Gemini model to use
   * @param prompt - The prompt text or parts
   * @param generationConfig - Optional generation configuration
   * @param retries - Number of retries on failure (default: 3)
   * @returns {Promise<string>} Generated text response
   *
   * @throws {Error} If all retries fail
   */
  async generateContent(
    model: GenerativeModel,
    prompt: string | any[],
    generationConfig?: GenerationConfig,
    retries: number = 3,
  ): Promise<string> {
    let lastError: Error = new Error('Unknown error occurred');

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        this.logger.debug(`Generate content attempt ${attempt}/${retries}`);

        const contents = Array.isArray(prompt)
          ? prompt
          : [{ role: 'user', parts: [{ text: prompt }] }];

        const result = await model.generateContent({
          contents,
          generationConfig,
        });

        const response = result.response;
        const text = response.text();

        this.logger.debug(
          `Content generated successfully (${text.length} chars)`,
        );

        return text;
      } catch (error: any) {
        lastError = error;
        this.logger.warn(
          `Generate content attempt ${attempt} failed: ${error.message}`,
        );

        if (attempt < retries) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, attempt - 1) * 1000;
          await this.sleep(delay);
        }
      }
    }

    this.logger.error(`All ${retries} attempts failed`, lastError.stack);
    throw new Error(
      `Failed to generate content after ${retries} attempts: ${lastError.message}`,
    );
  }

  /**
   * Validate Base64 image data
   *
   * Removes Data URI prefix if present (e.g., "data:image/jpeg;base64,")
   *
   * @param base64Data - Base64 string (with or without Data URI prefix)
   * @returns {string} Clean Base64 string
   */
  sanitizeBase64(base64Data: string): string {
    // Remove data URI prefix if present
    const dataUriRegex = /^data:image\/[a-z]+;base64,/;

    if (dataUriRegex.test(base64Data)) {
      return base64Data.replace(dataUriRegex, '');
    }

    return base64Data;
  }

  /**
   * Validate MIME type for images
   *
   * @param mimeType - MIME type string
   * @returns {boolean} True if valid image MIME type
   */
  isValidImageMimeType(mimeType: string): boolean {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
    return validTypes.includes(mimeType.toLowerCase());
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get the GoogleGenerativeAI instance (for advanced usage)
   *
   * @returns {GoogleGenerativeAI} The underlying Google Generative AI client
   */
  getClient(): GoogleGenerativeAI {
    return this.genAI;
  }
}
