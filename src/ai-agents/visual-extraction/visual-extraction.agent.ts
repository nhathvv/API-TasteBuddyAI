import { Injectable } from '@nestjs/common';
import { BaseAIAgent } from '../base/base-agent.abstract';
import { GeminiCoreService } from '@/shared/services/gemini-core.service';
import {
  VEAInput,
  VEAOutput,
  validateVEAInput,
  MENU_EXTRACTION_SCHEMA,
} from './visual-extraction.schema';

/**
 * Visual Extraction Agent (VEA)
 *
 * Specialized agent for extracting structured menu data from images using OCR.
 * Optimized for Vietnamese cuisine menus with diacritic preservation and
 * spatial layout awareness.
 *
 * Model: Gemini 1.5 Flash (optimized for speed and OCR tasks)
 *
 * Capabilities:
 * - OCR with Vietnamese diacritic preservation (ă, â, đ, ê, ô, ơ, ư)
 * - Section header detection and hierarchy
 * - Price normalization (50k → 50000)
 * - Visual indicator detection (spicy icons, vegetarian symbols)
 * - Spatial position mapping for menu engineering
 *
 * @extends {BaseAIAgent<VEAInput, VEAOutput>}
 */
@Injectable()
export class VisualExtractionAgent extends BaseAIAgent<VEAInput, VEAOutput> {
  constructor(geminiService: GeminiCoreService) {
    super(geminiService, {
      name: 'VisualExtractionAgent',
      modelType: 'flash', // Use Flash for fast OCR
      timeout: 30000, // 30 seconds for image processing (increased from 15s)
      cacheable: false, // Images change, don't cache
      systemInstruction: `You are a specialized Visual Extraction Agent for Vietnamese restaurant menus.

Your task is to perform high-accuracy OCR and extract structured menu data.

CRITICAL REQUIREMENTS:

1. VIETNAMESE DIACRITICS:
   - MUST preserve all Vietnamese diacritics: ă, â, đ, ê, ô, ơ, ư, ă, ĕ
   - Use UTF-8 encoding
   - Examples: "Phở Bò", "Bún Riêu", "Cơm Tấm"

2. SECTION DETECTION:
   - Identify section headers (larger text, different formatting)
   - Common sections: "Món Nước", "Món Khô", "Khai Vị", "Tráng Miệng", "Đồ Uống"
   - Group items under appropriate sections

3. PRICE NORMALIZATION:
   - Convert all price formats to integers in VND
   - "50k" → 50000
   - "100.000đ" → 100000
   - "2tr" → 2000000
   - Remove currency symbols and formatting

4. LAYOUT AWARENESS:
   - Preserve spatial relationships (dish name on left, price on right)
   - Match descriptions to their dishes
   - Don't confuse column headers with dish names

5. VISUAL INDICATORS:
   - Detect spicy indicators (🌶️, chili icon)
   - Detect vegetarian symbols (🥬, leaf icon)
   - Tag items accordingly

6. QUALITY ASSESSMENT:
   - Set extractionQuality based on image clarity
   - High: Clear, well-lit, high resolution
   - Medium: Slightly blurry or poor lighting
   - Low: Very blurry, poor quality, partial visibility
   - Set confidenceScore accordingly (0.0 - 1.0)

7. IMPORTANT - ALWAYS EXTRACT:
   - Even if image quality is poor, EXTRACT what you can see
   - Even partial/unclear text should be included with lower confidence
   - NEVER return empty results unless image is completely unreadable
   - If you see ANY text that looks like a dish name, include it

OUTPUT FORMAT:
- Strictly follow the JSON schema provided
- If unclear, mark as low confidence but STILL include the item
- Preserve original Vietnamese text exactly as written
- Better to extract with uncertainty than to return nothing`,
    });
  }

  /**
   * Validate VEA input
   *
   * @param input - Input to validate
   * @returns True if valid, false otherwise
   */
  validate(input: VEAInput): boolean {
    try {
      validateVEAInput(input);
      return true;
    } catch (error) {
      this.logger.error(`Input validation failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Process menu image and extract structured data
   *
   * @param input - VEAInput with image data
   * @returns Promise<VEAOutput> with extracted menu structure
   */
  protected async process(input: VEAInput): Promise<VEAOutput> {
    const startTime = Date.now();

    // 🔍 LOG 1: Input data
    this.logger.debug('═══════════════════════════════════════════');
    this.logger.debug('📥 VISUAL EXTRACTION AGENT - INPUT');
    this.logger.debug('═══════════════════════════════════════════');
    this.logger.log(`Language: ${input.language || 'vi'}`);
    this.logger.log(`Extraction Mode: ${input.extractionMode || 'quick'}`);
    this.logger.log(`MIME Type: ${input.mimeType}`);
    this.logger.log(`Image Data Length: ${input.imageData.length} chars`);

    // Sanitize Base64 (remove data URI prefix if present)
    const cleanBase64 = this.geminiService.sanitizeBase64(input.imageData);
    this.logger.debug(`Clean Base64 Length: ${cleanBase64.length} chars`);

    // Validate MIME type
    if (!this.geminiService.isValidImageMimeType(input.mimeType)) {
      throw new Error(`Invalid MIME type: ${input.mimeType}`);
    }

    // Create prompt for menu extraction
    const prompt = this.buildExtractionPrompt(input);
    
    // 🔍 LOG 2: Prompt being sent
    this.logger.debug('═══════════════════════════════════════════');
    this.logger.debug('📤 PROMPT SENT TO GEMINI');
    this.logger.debug('═══════════════════════════════════════════');
    this.logger.debug(prompt);
    this.logger.debug('═══════════════════════════════════════════');

    // Get Gemini Flash model (optimized for vision tasks)
    const model = this.getModel();

    // Prepare image part
    const imagePart = {
      inlineData: {
        data: cleanBase64,
        mimeType: input.mimeType,
      },
    };

    try {
      // Generate content with structured output
      const result = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }, imagePart],
          },
        ],
        generationConfig: {
          ...this.getGenerationConfig(),
          responseMimeType: 'application/json',
          responseSchema: MENU_EXTRACTION_SCHEMA,
        },
      });

      const response = result.response;
      const text = response.text();

      // 🔍 LOG 3: Raw response from Gemini
      this.logger.debug('═══════════════════════════════════════════');
      this.logger.debug('📩 RAW RESPONSE FROM GEMINI');
      this.logger.debug('═══════════════════════════════════════════');
      this.logger.debug(text);
      this.logger.debug('═══════════════════════════════════════════');

      // Parse JSON response
      const parsedOutput = JSON.parse(text) as VEAOutput;

      // Add processing time to metadata
      parsedOutput.metadata.processingTime = Date.now() - startTime;

      // 🔍 LOG 4: Parsed output
      this.logger.debug('═══════════════════════════════════════════');
      this.logger.debug('✅ PARSED OUTPUT');
      this.logger.debug('═══════════════════════════════════════════');
      this.logger.log(`Total Items Extracted: ${parsedOutput.metadata.totalItems}`);
      this.logger.log(`Extraction Quality: ${parsedOutput.metadata.extractionQuality}`);
      this.logger.log(`Confidence Score: ${parsedOutput.metadata.confidenceScore}`);
      this.logger.log(`Processing Time: ${parsedOutput.metadata.processingTime}ms`);
      
      if (parsedOutput.menuSections && parsedOutput.menuSections.length > 0) {
        this.logger.log(`\nMenu Sections:`);
        parsedOutput.menuSections.forEach((section, idx) => {
          this.logger.log(`  ${idx + 1}. ${section.sectionName} (${section.items.length} items)`);
          section.items.forEach((item, itemIdx) => {
            this.logger.log(`     ${itemIdx + 1}. ${item.name} - ${item.price || 0}₫`);
          });
        });
      }
      this.logger.log('═══════════════════════════════════════════');
      
      this.logger.log(
        `Extracted ${parsedOutput.metadata.totalItems} items in ${parsedOutput.metadata.processingTime}ms`,
      );

      return parsedOutput;
    } catch (error) {
      // 🔍 LOG 5: Error details
      this.logger.error('═══════════════════════════════════════════');
      this.logger.error('❌ VISUAL EXTRACTION ERROR');
      this.logger.error('═══════════════════════════════════════════');
      this.logger.error(`Error Type: ${error.constructor.name}`);
      this.logger.error(`Error Message: ${error.message}`);
      this.logger.error(`Error Stack: ${error.stack}`);
      this.logger.error('═══════════════════════════════════════════');
      throw new Error(`Failed to extract menu: ${error.message}`);
    }
  }

  /**
   * Build extraction prompt based on input configuration
   *
   * @param input - VEAInput
   * @returns Formatted prompt string
   */
  private buildExtractionPrompt(input: VEAInput): string {
    const language = input.language || 'vi';
    const mode = input.extractionMode || 'full';

    let prompt = `Extract menu data from this Vietnamese restaurant menu image.

Language: ${language}
Mode: ${mode}

`;

    if (mode === 'full') {
      prompt += `Perform FULL extraction:
- Extract ALL menu items with complete details
- Include descriptions, visual tags, and position data
- Provide accurate quality assessment

`;
    } else {
      prompt += `Perform QUICK extraction:
- Extract only dish names and prices
- Skip optional fields (descriptions, tags, positions)
- Faster processing

`;
    }

    prompt += `Return the result as JSON following the schema exactly.`;

    return prompt;
  }

  /**
   * Validate extracted output
   *
   * @param output - VEAOutput to validate
   * @returns True if valid
   */
  protected validateOutput(output: VEAOutput): boolean {
    if (!output || !output.menuSections) {
      this.logger.error('Output is missing menuSections');
      return false;
    }

    // Check if at least some items were extracted
    if (output.metadata.totalItems === 0) {
      this.logger.warn('No items were extracted from the image');
      // Still return true - empty menu is valid
    }

    // Warn if quality is low
    if (output.metadata.extractionQuality === 'low') {
      this.logger.warn(
        `Low extraction quality detected (confidence: ${output.metadata.confidenceScore})`,
      );
    }

    return true;
  }

  /**
   * Handle errors specific to VEA
   *
   * @param error - Original error
   * @returns Transformed error
   */
  protected handleError(error: Error): Error {
    if (error.message.includes('Invalid MIME type')) {
      return new Error(
        `VEA_INVALID_IMAGE: ${error.message}. Supported formats: JPEG, PNG, WebP, HEIC`,
      );
    }

    if (error.message.includes('Base64')) {
      return new Error(
        `VEA_INVALID_BASE64: ${error.message}. Ensure image is properly encoded.`,
      );
    }

    if (error.message.includes('timeout')) {
      return new Error(
        'VEA_TIMEOUT: Image processing took too long. Try a smaller image or quick mode.',
      );
    }

    // Default error handling
    return new Error(`VEA_ERROR: ${error.message}`);
  }
}
