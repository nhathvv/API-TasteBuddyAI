import { Injectable } from '@nestjs/common';
import { BaseAIAgent } from '../base/base-agent.abstract';
import { GeminiCoreService } from '@/shared/services/gemini-core.service';
import {
  CSAAInput,
  CSAAOutput,
  validateCSAAInput,
  ALLERGEN_ANALYSIS_SCHEMA,
} from './allergen-safety.schema';

/**
 * Culinary Safety & Allergen Agent (CSAA)
 *
 * Specialized agent for detecting hidden allergens in Vietnamese cuisine.
 * Uses deep reasoning to identify allergens in sauces, marinades, and cooking
 * methods that are not explicitly listed on menus.
 *
 * Model: Gemini 1.5 Pro (requires complex reasoning and Chain-of-Thought)
 *
 * Vietnamese Cuisine Knowledge Base:
 * - Peanuts: Common in Gỏi (salads), Bún dishes, dipping sauces
 * - Shellfish: Hidden in Mắm Tôm, Sa Tế, Riêu, nước dùng
 * - Gluten: Soy sauce marinades, Chả (sausage), fried items
 * - Cross-contamination: Shared oils, woks, cutting boards
 *
 * Safety Philosophy: NEVER assume safety; default to caution.
 *
 * @extends {BaseAIAgent<CSAAInput, CSAAOutput>}
 */
@Injectable()
export class AllergenSafetyAgent extends BaseAIAgent<CSAAInput, CSAAOutput> {
  constructor(geminiService: GeminiCoreService) {
    super(geminiService, {
      name: 'AllergenSafetyAgent',
      modelType: 'pro', // Use Pro for complex reasoning
      timeout: 20000, // 20 seconds for thorough analysis
      cacheable: false, // User allergen profiles change
      systemInstruction: `You are a specialized Allergen Safety Expert for Vietnamese cuisine.

Your mission is to PROTECT LIVES by detecting hidden allergens that could cause severe reactions.

═══════════════════════════════════════════════════════════════
CRITICAL SAFETY PHILOSOPHY
═══════════════════════════════════════════════════════════════

1. NEVER ASSUME SAFETY
   - If uncertain, classify as MEDIUM_RISK or higher
   - Err on the side of caution ALWAYS
   - Missing information = potential danger

2. CHAIN-OF-THOUGHT REASONING
   - Always explain your reasoning step-by-step
   - Cite specific ingredients that cause risk
   - Explain WHY you assigned each risk level

3. VIETNAMESE CUISINE EXPERTISE REQUIRED
   - Deep knowledge of hidden ingredients
   - Understanding of regional cooking variations
   - Awareness of common substitutions

═══════════════════════════════════════════════════════════════
VIETNAMESE CUISINE ALLERGEN KNOWLEDGE BASE
═══════════════════════════════════════════════════════════════

🥜 PEANUTS & TREE NUTS
──────────────────────
DEFINITE presence in:
  • Gỏi (Vietnamese salads) - topped with crushed peanuts
  • Bún Thịt Nướng - peanut garnish standard
  • Gỏi Cuốn dipping sauce - peanut butter base common
  • Bánh Tráng Trộn - often has peanuts

PROBABLE presence in:
  • Tương sauce (dark dipping sauce) - may be peanut-based
  • Vegetarian dishes - cashews as protein substitute

CROSS-CONTAMINATION risk:
  • Shared preparation surfaces
  • Same oil for frying

🦐 SHELLFISH (CRITICAL - Often Hidden)
────────────────────────────────────────
DEFINITE presence in:
  • Mắm Tôm - fermented shrimp paste (purple sauce)
    Used in: Bún Đậu, Bún Riêu, Bánh Cuốn
  • Riêu - crab/shrimp paste
    Found in: Bún Riêu, Bánh Đa Cua
  • Sa Tế - Vietnamese chili oil
    CRITICAL: Contains dried shrimp extract for umami
  • Nước dùng (broth) - often uses dried shrimp/squid
    Found in: Bún Bò Huế, Hủ Tiếu, Mì Quảng

PROBABLE presence in:
  • Bánh Xèo - may use dried shrimp in batter
  • Cháo (rice porridge) - shrimp/fish stock common
  • Any "nước mắm pha" - may contain shrimp

POSSIBLE presence in:
  • Vegetarian "chay" dishes - may use shrimp paste for flavor
  • Northern vs Southern variations differ

🌾 GLUTEN & WHEAT
──────────────────
DEFINITE presence in:
  • Soy sauce (nước tương/xì dầu) marinades
    Used in: Thịt Nướng, Cơm Tấm protein
  • Chả (Vietnamese sausage) - wheat flour as binder
  • Bánh Mì - obvious bread product
  • Fried items - wheat flour coating

PROBABLE presence in:
  • Dark sauces - soy sauce base
  • Vegetarian mock meats - wheat gluten (mì căn)

CROSS-CONTAMINATION risk:
  • Shared fryer oil with wheat-coated items
  • Shared cutting boards

🥚 EGGS
────────
DEFINITE presence in:
  • Bánh Xèo - egg in batter
  • Cơm Chiên (fried rice)
  • Bánh Flan (dessert)
  • Chả Trứng (egg meatloaf)

🥛 DAIRY
─────────
RARE in traditional Vietnamese, but found in:
  • Cà Phê Sữa - condensed milk
  • Bánh Flan
  • Modern fusion dishes
  • Yogurt-based desserts (Yaourt)

═══════════════════════════════════════════════════════════════
RISK LEVEL CLASSIFICATION RULES
═══════════════════════════════════════════════════════════════

SEVERE_RISK:
  • Allergen is DEFINITE and user severity is "life-threatening"
  • Example: Shellfish allergy + Bún Riêu (contains Riêu)

HIGH_RISK:
  • Allergen is DEFINITE or PROBABLE
  • User severity is "severe" or "life-threatening"
  • Example: Peanut allergy + Gỏi (always has peanuts)

MEDIUM_RISK:
  • Allergen is PROBABLE
  • User severity is "moderate"
  • OR: POSSIBLE allergen with "severe" user severity

LOW_RISK:
  • Allergen is POSSIBLE only
  • User severity is "mild" or "moderate"
  • Cross-contamination risk exists

SAFE:
  • No allergens detected
  • NO cross-contamination risk
  • Confidence must be HIGH (>0.8)

UNKNOWN_RISK:
  • Dish is unfamiliar/unusual
  • Insufficient information to assess
  • ALWAYS recommend asking restaurant staff

═══════════════════════════════════════════════════════════════
OUTPUT REQUIREMENTS
═══════════════════════════════════════════════════════════════

For EACH dish, you MUST provide:

1. REASONING (2-4 sentences):
   ✓ "Dish identification: [dish name] is..."
   ✓ "Ingredient analysis: Standard recipe includes..."
   ✓ "Allergen detection: [specific allergen] found in [specific source]"
   ✓ "Risk assessment: Based on [reasoning], classified as [risk level]"

2. CONFIDENCE SCORE:
   • 0.9-1.0: Dish is well-known, allergen presence is certain
   • 0.7-0.89: Standard recipe, some regional variation
   • 0.5-0.69: Moderate uncertainty, multiple variations exist
   • <0.5: Unfamiliar dish, recommend verification

3. RECOMMENDATIONS (if unsafe):
   • "Ask staff if [specific ingredient] is used"
   • "Request modification: No [allergen]"
   • "Verify cross-contamination prevention"

4. ALTERNATIVES (if unsafe):
   • Suggest similar dishes that ARE safe
   • Must be from the SAME menu if possible

═══════════════════════════════════════════════════════════════
EXAMPLES OF GOOD REASONING
═══════════════════════════════════════════════════════════════

Example 1 - HIGH_RISK:
{
  "dishName": "Bún Riêu",
  "riskLevel": "HIGH_RISK",
  "reasoning": "Bún Riêu is a crab-based noodle soup where 'Riêu' specifically refers to crab and shrimp paste that forms the core of the dish. This paste is definite and unavoidable in the traditional recipe. Additionally, the broth typically contains Mắm Tôm (fermented shrimp paste) for depth of flavor. For a user with severe shellfish allergy, this dish poses immediate danger.",
  "confidenceScore": 0.95,
  "identifiedAllergens": [
    {
      "allergen": "shellfish",
      "source": "Riêu (crab/shrimp paste) - core ingredient",
      "likelihood": "definite",
      "severity": "severe"
    },
    {
      "allergen": "shellfish",
      "source": "Mắm Tôm in broth",
      "likelihood": "probable",
      "severity": "severe"
    }
  ]
}

Example 2 - SAFE:
{
  "dishName": "Cơm Gà",
  "riskLevel": "SAFE",
  "reasoning": "Cơm Gà (chicken rice) is a simple dish consisting of steamed rice and boiled/roasted chicken. The standard preparation does not include any of the user's allergens (peanuts, shellfish). The chicken is typically seasoned with salt, ginger, and garlic only. No cross-contamination risk as chicken is prepared separately from shellfish dishes.",
  "confidenceScore": 0.85
}

REMEMBER: You are protecting lives. Be thorough, be cautious, be clear.`,
    });
  }

  /**
   * Validate CSAA input
   *
   * @param input - Input to validate
   * @returns True if valid
   */
  validate(input: CSAAInput): boolean {
    try {
      validateCSAAInput(input);
      return true;
    } catch (error) {
      this.logger.error(`Input validation failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Process allergen analysis
   *
   * @param input - CSAAInput with menu items and user allergens
   * @returns Promise<CSAAOutput> with safety analysis
   */
  protected async process(input: CSAAInput): Promise<CSAAOutput> {
    const startTime = Date.now();

    // Build analysis prompt
    const prompt = this.buildAnalysisPrompt(input);

    // Get Gemini Pro model (requires deep reasoning)
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
          temperature: 0.3, // Lower temperature for more consistent safety analysis
          responseMimeType: 'application/json',
          responseSchema: ALLERGEN_ANALYSIS_SCHEMA,
        },
      });

      const response = result.response;
      const text = response.text();

      // Parse JSON response
      const parsedOutput = JSON.parse(text) as CSAAOutput;

      const duration = Date.now() - startTime;
      this.logger.log(
        `Analyzed ${parsedOutput.analysis.length} dishes in ${duration}ms`,
      );
      this.logger.log(
        `Summary: ${parsedOutput.summary.safeItems} safe, ${parsedOutput.summary.unsafeItems} unsafe`,
      );

      return parsedOutput;
    } catch (error) {
      this.logger.error(`Allergen analysis failed: ${error.message}`);
      throw new Error(`Failed to analyze allergens: ${error.message}`);
    }
  }

  /**
   * Build analysis prompt based on input
   *
   * @param input - CSAAInput
   * @returns Formatted prompt string
   */
  private buildAnalysisPrompt(input: CSAAInput): string {
    const { menuItems, userAllergens, strictMode, language } = input;

    const allergenList = userAllergens
      .map((a) => `${a.type} (severity: ${a.severity})`)
      .join(', ');

    let prompt = `ALLERGEN SAFETY ANALYSIS REQUEST

User Allergen Profile:
${userAllergens.map((a) => `- ${a.type.toUpperCase()}: ${a.severity} reaction`).join('\n')}

Analysis Mode: ${strictMode !== false ? 'STRICT (flag even trace amounts)' : 'FLEXIBLE (major allergens only)'}
Output Language: ${language || 'en'}

Menu Items to Analyze:
${menuItems
  .map((item, idx) => {
    return `${idx + 1}. ${item.name}${item.description ? ` - ${item.description}` : ''}`;
  })
  .join('\n')}

TASK:
For EACH dish above, perform a thorough allergen safety analysis.

REQUIREMENTS:
1. Identify ALL instances of the user's allergens (${allergenList})
2. Use your Vietnamese cuisine knowledge base to detect HIDDEN allergens
3. Provide step-by-step Chain-of-Thought reasoning
4. Classify risk level appropriately
5. Give actionable recommendations if unsafe
6. Suggest safe alternatives from the same menu

Return the analysis as JSON following the schema exactly.`;

    return prompt;
  }

  /**
   * Validate analysis output
   *
   * @param output - CSAAOutput to validate
   * @returns True if valid
   */
  protected validateOutput(output: CSAAOutput): boolean {
    if (!output || !output.analysis || !output.summary) {
      this.logger.error('Output is missing required fields');
      return false;
    }

    // Check if all dishes were analyzed
    if (output.analysis.length === 0) {
      this.logger.warn('No dishes were analyzed');
      return false;
    }

    // Warn if many UNKNOWN_RISK classifications
    const unknownCount = output.analysis.filter(
      (a) => a.riskLevel === 'UNKNOWN_RISK',
    ).length;

    if (unknownCount > output.analysis.length * 0.5) {
      this.logger.warn(
        `High number of UNKNOWN_RISK dishes: ${unknownCount}/${output.analysis.length}`,
      );
    }

    // Warn about critical risks
    const severeRiskCount = output.analysis.filter(
      (a) => a.riskLevel === 'SEVERE_RISK',
    ).length;

    if (severeRiskCount > 0) {
      this.logger.warn(
        `⚠️ SEVERE RISK detected in ${severeRiskCount} dish(es)`,
      );
    }

    return true;
  }

  /**
   * Handle errors specific to CSAA
   *
   * @param error - Original error
   * @returns Transformed error
   */
  protected handleError(error: Error): Error {
    if (error.message.includes('menuItems cannot be empty')) {
      return new Error(
        'CSAA_EMPTY_MENU: No menu items provided for analysis.',
      );
    }

    if (error.message.includes('userAllergens cannot be empty')) {
      return new Error(
        'CSAA_NO_ALLERGENS: No allergens specified. Cannot perform safety analysis.',
      );
    }

    if (error.message.includes('timeout')) {
      return new Error(
        'CSAA_TIMEOUT: Allergen analysis took too long. Try analyzing fewer items.',
      );
    }

    // Default error handling
    return new Error(`CSAA_ERROR: ${error.message}`);
  }
}
