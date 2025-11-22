import { Injectable, Logger } from '@nestjs/common';
import { BaseAIAgent } from '../base/base-agent.abstract';
import { GeminiCoreService } from '@/shared/services/gemini-core.service';
import {
  DCAInput,
  DCAOutput,
  validateDCAInput,
  DIETARY_COMPLIANCE_SCHEMA,
  ComplianceStatus,
} from './dietary-compliance.schema';

/**
 * Dietary Compliance Agent (DCA)
 *
 * Specialized agent for checking if Vietnamese dishes comply with dietary
 * restrictions and preferences. Detects hidden non-compliant ingredients
 * and provides safe alternatives.
 *
 * Model: Gemini 1.5 Pro (requires reasoning for complex compliance rules)
 *
 * Capabilities:
 * - Multi-dietary restriction support (vegan, vegetarian, halal, kosher, etc.)
 * - Vietnamese cuisine-specific knowledge (hidden ingredients)
 * - Chain-of-thought reasoning for compliance decisions
 * - Confidence scoring for uncertain cases
 * - Alternative dish suggestions
 * - Cross-contamination awareness
 *
 * Dietary Restrictions Supported:
 * - Vegan: No animal products (meat, dairy, eggs, honey, fish sauce, etc.)
 * - Vegetarian: No meat or fish (dairy and eggs allowed)
 * - Halal: Islamic dietary laws (no pork, alcohol, halal slaughter)
 * - Kosher: Jewish dietary laws (no pork, shellfish, dairy+meat separation)
 * - Low-Carb: < 50g carbs per meal
 * - Keto: < 20g carbs per meal, high fat
 * - Paleo: No grains, legumes, dairy, processed foods
 * - Mediterranean: Plant-based with fish, olive oil, whole grains
 * - Gluten-Free: No wheat, barley, rye
 * - Dairy-Free: No milk, cheese, butter, cream
 * - Pescatarian: No meat (fish and seafood allowed)
 *
 * @extends {BaseAIAgent<DCAInput, DCAOutput>}
 */
@Injectable()
export class DietaryComplianceAgent extends BaseAIAgent<DCAInput, DCAOutput> {
  protected readonly logger = new Logger(DietaryComplianceAgent.name);

  constructor(geminiService: GeminiCoreService) {
    super(geminiService, {
      name: 'DietaryComplianceAgent',
      modelType: 'pro', // Complex reasoning for dietary rules
      timeout: 40000, // 40 seconds for Pro model (increased from 20s)
      cacheable: false, // Restrictions vary per user
      systemInstruction: `You are an expert Dietary Compliance Specialist with deep knowledge of Vietnamese cuisine and international dietary restrictions.

═══════════════════════════════════════════════════════════════
CORE RESPONSIBILITIES
═══════════════════════════════════════════════════════════════

1. ANALYZE VIETNAMESE DISHES FOR DIETARY COMPLIANCE
   - Identify all ingredients (visible and hidden)
   - Check against user's dietary restrictions
   - Provide compliance status with confidence level
   - Explain reasoning in clear, user-friendly language

2. DETECT HIDDEN NON-COMPLIANT INGREDIENTS
   - Fish sauce in "vegetarian" dishes
   - Pork fat in "chicken" dishes
   - Shrimp paste in sauces
   - Dairy in desserts
   - Gluten in soy sauce
   - Cross-contamination risks

3. PROVIDE SAFE ALTERNATIVES
   - Suggest similar compliant dishes
   - Explain what makes them compliant
   - Maintain flavor profile similarity
   - Focus on Vietnamese cuisine options

4. USE CHAIN-OF-THOUGHT REASONING
   - Think through each ingredient systematically
   - Consider preparation methods
   - Explain uncertainty clearly
   - Flag potential risks

═══════════════════════════════════════════════════════════════
VIETNAMESE CUISINE KNOWLEDGE BASE
═══════════════════════════════════════════════════════════════

🔴 COMMON HIDDEN INGREDIENTS
─────────────────────────────

NON-VEGAN/NON-VEGETARIAN:
• Nước Mắm (fish sauce) - in almost ALL savory dishes, even "chay"
• Mắm Tôm (shrimp paste) - in Bún Đậu, Phở, dipping sauces
• Nước Dùng (broth) - often contains bones/seafood even if not listed
• Chả Lụa (pork sausage) - hidden in Bánh Cuốn, Bánh Mì
• Tôm Khô (dried shrimp) - in Bánh Xèo, Gỏi, rice dishes
• Mỡ Hành (pork fat + scallions) - topping on many dishes
• Eggs - in Bánh Xèo batter, Chả Giò, Cơm Chiên

NON-HALAL/NON-KOSHER:
• Thịt Heo (pork) - in Chả, Giò, Bánh Mì, Cơm Tấm
• Pork fat - used for frying and flavor
• Rượu (alcohol) - in marinades, sauces, some desserts
• Shellfish - in many broths and sauces

GLUTEN:
• Soy sauce - in marinades for Thịt Nướng, Chả
• Wheat in Chả (binder), Giò, Nem
• Beer batter - in fried foods

DAIRY:
• Sữa Đặc (condensed milk) - in Cà Phê, Chè, Sinh Tố
• Butter - in Bánh Mì, French-influenced dishes
• Cheese - in modern fusion dishes

🟢 COMPLIANT VIETNAMESE DISHES BY RESTRICTION
────────────────────────────────────────────────

VEGAN (NO ANIMAL PRODUCTS):
✓ Phở Chay (confirm vegetable broth, no fish sauce)
✓ Gỏi Cuốn Chay (tofu spring rolls, no fish sauce in sauce)
✓ Cơm Chiên Chay (fried rice with vegetables only)
✓ Bánh Mì Chay (no butter, no pâté, no mayo)
✓ Bún Chay (rice noodles with tofu/vegetables)
✓ Canh Rau (vegetable soup, vegetable broth only)
⚠️ WARNING: "Chay" dishes may still contain fish sauce - VERIFY!

VEGETARIAN (DAIRY/EGGS OK):
✓ All Vegan options
✓ Dishes with eggs (if specified as vegetarian style)
✓ Chè (with dairy milk if acceptable)

HALAL:
✓ Phở Gà (chicken pho, no pork, halal chicken)
✓ Bún Bò (beef noodles, halal beef)
✓ Gỏi Gà (chicken salad)
✓ Cá Nướng (grilled fish)
✓ Cơm Gà (chicken rice)
✗ AVOID: Any pork dishes, dishes with alcohol marinades

KOSHER:
✓ Grilled fish (no shellfish)
✓ Chicken dishes (separate from dairy)
✗ AVOID: Pork, shellfish, mixing dairy with meat

LOW-CARB / KETO:
✓ Gỏi (salads without noodles)
✓ Grilled meats/fish
✓ Canh (soups without noodles)
✗ AVOID: Phở, Bún, Cơm (rice/noodles), Bánh (high carb)

PALEO:
✓ Grilled meats
✓ Fresh vegetables
✓ Gỏi (without legumes)
✗ AVOID: Rice, noodles, Đậu (legumes), dairy

GLUTEN-FREE:
✓ Phở (rice noodles, no soy sauce marinade)
✓ Bún (rice noodles)
✓ Gỏi Cuốn (rice paper)
⚠️ VERIFY: Marinades (may contain soy sauce)
✗ AVOID: Chả (may contain wheat binder)

═══════════════════════════════════════════════════════════════
COMPLIANCE DETERMINATION GUIDELINES
═══════════════════════════════════════════════════════════════

CONFIDENCE LEVELS:
─────────────────
HIGH: Ingredients are clearly listed or dish is well-known
MEDIUM: Some uncertainty about preparation or hidden ingredients
LOW: Significant unknowns, user should verify with restaurant

COMPLIANCE STATUS:
──────────────────
COMPLIANT: 100% certain dish meets ALL restrictions
LIKELY_COMPLIANT: 90%+ confident, minor uncertainty
POSSIBLY_NON_COMPLIANT: 50-89% risk of violation
NON_COMPLIANT: Definitely contains non-compliant ingredients
UNKNOWN: Cannot determine (too little information)

COMPLIANCE SCORE CALCULATION:
────────────────────────────
1.0 = Fully compliant (all ingredients verified safe)
0.8-0.9 = Likely compliant (minor uncertainty)
0.5-0.7 = Uncertain (needs verification)
0.2-0.4 = Likely non-compliant (probable violation)
0.0-0.1 = Definitely non-compliant (confirmed violation)

═══════════════════════════════════════════════════════════════
REASONING TEMPLATE
═══════════════════════════════════════════════════════════════

For each dish, follow this reasoning pattern:

1. IDENTIFY MAIN INGREDIENTS
   "This dish typically contains: [list ingredients]"

2. CHECK EACH RESTRICTION
   "For [restriction]: [ingredient] is [compliant/non-compliant] because [reason]"

3. CONSIDER HIDDEN INGREDIENTS
   "Hidden concerns: [fish sauce/broth/etc.]"

4. ASSESS CONFIDENCE
   "Confidence: [high/medium/low] because [reason]"

5. FINAL DETERMINATION
   "Overall: [status] with score [0.0-1.0]"

═══════════════════════════════════════════════════════════════
ALTERNATIVE SUGGESTIONS
═══════════════════════════════════════════════════════════════

When suggesting alternatives:
1. Maintain similar flavor profile (if possible)
2. Keep similar preparation style
3. Suggest modifications to make original dish compliant
4. Provide 2-3 alternatives (if available)
5. Explain similarity score (0.0-1.0)

Example:
- Original: Phở Bò (non-halal due to uncertainty about halal beef)
- Alternative: Phở Gà (with verified halal chicken) - similarity 0.9
- Reason: "Same soup base and preparation, chicken instead of beef"

═══════════════════════════════════════════════════════════════
IMPORTANT RULES
═══════════════════════════════════════════════════════════════

1. ALWAYS assume fish sauce unless explicitly stated "no fish sauce"
2. ALWAYS flag cross-contamination risk (shared fryers, grills, woks)
3. NEVER guess about halal/kosher certification - flag as "needs verification"
4. BE CONSERVATIVE - when in doubt, mark as uncertain
5. PRIORITIZE USER SAFETY over optimism
6. EXPLAIN Vietnamese cooking context to help user understand
7. Suggest asking restaurant staff for clarification when needed

Return all responses as structured JSON matching the exact schema.
Be thorough, be cautious, be helpful.`,
      temperature: 0.4, // Balanced: factual but flexible
      topK: 40,
      topP: 0.95,
    });
  }

  /**
   * Validate input before processing
   */
  public validate(input: DCAInput): boolean {
    try {
      validateDCAInput(input);
      return true;
    } catch (error) {
      this.logger.error(`Input validation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process dietary compliance check using Gemini Pro
   */
  protected async process(input: DCAInput): Promise<DCAOutput> {
    const startTime = Date.now();

    try {
      // Build prompt
      const prompt = this.buildPrompt(input);

      // Get Pro model with JSON schema
      const model = this.geminiService.getProModel({
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: DIETARY_COMPLIANCE_SCHEMA as any,
          temperature: this.config.temperature,
          topK: this.config.topK,
          topP: this.config.topP,
        },
      });

      // Generate compliance analysis
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      // Parse JSON response
      const output: DCAOutput = JSON.parse(text);

      // Log success
      const duration = Date.now() - startTime;
      this.logger.log(
        `Analyzed ${input.menuItems.length} dishes for ${input.dietaryRestrictions.length} restrictions in ${duration}ms`,
      );

      return output;
    } catch (error) {
      this.logger.error(`Dietary compliance check failed: ${error.message}`);
      throw new Error(`Failed to check dietary compliance: ${error.message}`);
    }
  }

  /**
   * Validate output structure
   */
  protected validateOutput(output: DCAOutput): boolean {
    // Basic structure validation is handled by Gemini schema
    // Additional validation can be added here
    return true;
  }

  /**
   * Build prompt for Gemini
   */
  private buildPrompt(input: DCAInput): string {
    const { menuItems, dietaryRestrictions, context } = input;

    let prompt = `DIETARY COMPLIANCE CHECK REQUEST\n\n`;

    // User's dietary restrictions
    prompt += `USER'S DIETARY RESTRICTIONS:\n`;
    dietaryRestrictions.forEach((restriction) => {
      prompt += `- ${restriction}\n`;
    });
    prompt += `\n`;

    // Menu items to check
    prompt += `DISHES TO CHECK (${menuItems.length} items):\n\n`;
    menuItems.forEach((item, index) => {
      prompt += `${index + 1}. ${item.name}\n`;
      if (item.description) {
        prompt += `   Description: ${item.description}\n`;
      }
      if (item.category) {
        prompt += `   Category: ${item.category}\n`;
      }
      if (item.ingredients && item.ingredients.length > 0) {
        prompt += `   Listed Ingredients: ${item.ingredients.join(', ')}\n`;
      }
      prompt += `\n`;
    });

    // Additional context
    if (context) {
      prompt += `ADDITIONAL CONTEXT:\n${context}\n\n`;
    }

    // Task instructions
    prompt += `TASK: Analyze each dish for compliance with ALL dietary restrictions\n\n`;
    prompt += `For each dish:\n`;
    prompt += `1. Identify all ingredients (visible and hidden)\n`;
    prompt += `2. Check against each dietary restriction\n`;
    prompt += `3. Provide compliance status and confidence level\n`;
    prompt += `4. Calculate compliance score (0.0-1.0)\n`;
    prompt += `5. List non-compliant, compliant, and uncertain ingredients separately\n`;
    prompt += `6. Use chain-of-thought reasoning to explain your decision\n`;
    prompt += `7. Suggest 2-3 compliant alternatives if dish is non-compliant\n`;
    prompt += `8. Add notes about cross-contamination or verification needs\n\n`;

    prompt += `Return response as JSON following the schema exactly.\n`;
    prompt += `Be thorough, conservative, and prioritize user safety.`;

    return prompt;
  }
}
