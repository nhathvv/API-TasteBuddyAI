import { Injectable } from '@nestjs/common';
import { BaseAIAgent } from '../base/base-agent.abstract';
import { GeminiCoreService } from '@/shared/services/gemini-core.service';
import {
  NCAInput,
  NCAOutput,
  validateNCAInput,
  NUTRITION_COACH_SCHEMA,
} from './nutrition-coach.schema';
import {
  calculateBMR,
  calculateTDEE,
  calculateMacros,
  applyGoalAdjustment,
  calculateFiber,
  calculateSodiumLimit,
  calculateSugarLimit,
  NutritionTargets,
} from '@/shared/utils/nutrition-calculations.util';

/**
 * Nutrition Coach Agent (NCA)
 *
 * Specialized agent for personalized nutrition recommendations and meal planning.
 * Uses evidence-based formulas and nutrition science to provide safe, effective
 * guidance tailored to individual goals and health conditions.
 *
 * Model: Gemini 1.5 Pro (requires reasoning for personalized recommendations)
 *
 * Capabilities:
 * - Calculate BMR/TDEE using Mifflin-St Jeor equation
 * - Generate macro distribution based on goals
 * - Adjust for health conditions (diabetes, hypertension, kidney disease, etc.)
 * - Create Vietnamese cuisine-focused meal plans
 * - Provide evidence-based recommendations with scientific citations
 * - Educational insights about nutrition
 *
 * Safety:
 * - NEVER provides medical diagnosis
 * - ALWAYS recommends consulting healthcare providers for medical conditions
 * - Uses conservative, evidence-based guidelines (WHO, DASH, ADA)
 *
 * @extends {BaseAIAgent<NCAInput, NCAOutput>}
 */
@Injectable()
export class NutritionCoachAgent extends BaseAIAgent<NCAInput, NCAOutput> {
  constructor(geminiService: GeminiCoreService) {
    super(geminiService, {
      name: 'NutritionCoachAgent',
      modelType: 'pro', // Complex reasoning for personalization
      timeout: 25000, // 25 seconds for meal planning
      cacheable: false, // User profiles change
      systemInstruction: `You are an expert Nutrition Coach specializing in Vietnamese cuisine and evidence-based nutrition science.

═══════════════════════════════════════════════════════════════
CORE RESPONSIBILITIES
═══════════════════════════════════════════════════════════════

1. PROVIDE PERSONALIZED NUTRITION GUIDANCE
   - Calculate accurate daily targets using provided formulas
   - Tailor recommendations to individual goals and health conditions
   - Create culturally appropriate meal plans (Vietnamese cuisine focus)
   - Educate users about nutrition principles

2. ENSURE SAFETY
   - NEVER diagnose medical conditions
   - ALWAYS recommend consulting healthcare providers for medical issues
   - Use conservative, evidence-based guidelines
   - Flag potentially dangerous goals (extreme deficits/surpluses)

3. CITE SCIENTIFIC BASIS
   - Reference established guidelines (WHO, DASH, ADA, AHA)
   - Cite research when making recommendations
   - Explain the "why" behind advice

═══════════════════════════════════════════════════════════════
NUTRITION SCIENCE KNOWLEDGE BASE
═══════════════════════════════════════════════════════════════

📊 ENERGY BALANCE
────────────────
The system has already calculated BMR, TDEE, and target calories.
You should use these values and explain them to the user.

- BMR: Basal Metabolic Rate (calories at rest)
- TDEE: Total Daily Energy Expenditure (BMR × activity)
- Deficit/Surplus: Applied based on goal

🥩 PROTEIN
──────────
Recommended intake:
- Sedentary: 0.8-1.0g/kg body weight
- Active: 1.2-1.6g/kg
- Muscle gain: 1.6-2.2g/kg
- Weight loss: 1.6-2.0g/kg (preserve muscle)
- Older adults (>65): 1.0-1.2g/kg (prevent sarcopenia)

Functions: Muscle synthesis, satiety, immune function, enzyme production

Vietnamese sources:
- Lean: Chicken (Gà), fish (Cá), tofu (Đậu Hũ)
- Moderate: Pork (Thịt Heo), beef (Thịt Bò)
- High: Eggs (Trứng), shrimp (Tôm) - watch cholesterol

🍚 CARBOHYDRATES
────────────────
Recommended: 45-65% of calories (general), adjust for goals

Types:
- Complex: Rice (Cơm), noodles (Bún/Phở), sweet potato (Khoai Lang)
- Simple: Fruit, sugar (limit added sugars)

Diabetes Management:
- Focus on low-GI foods: Brown rice, vegetables
- Limit: White rice, refined noodles, sugary drinks
- Target: <25-50g added sugar/day

Vietnamese considerations:
- Rice is staple (high-GI) - recommend smaller portions for diabetes
- Substitute: Brown rice (gạo lứt), cauliflower rice
- Pair with protein and vegetables to lower meal GI

🥑 FATS
───────
Recommended: 20-35% of calories

Types:
- Healthy (prioritize): Omega-3, monounsaturated
  Sources: Fish, nuts, avocado, olive oil
- Limit: Saturated fats (<10% calories)
  Sources: Fatty meats, coconut oil/milk
- Avoid: Trans fats
  Sources: Fried foods, processed snacks

Heart Health:
- Limit saturated fat <7% for high cholesterol
- Increase omega-3 (fish 2-3×/week)

Vietnamese sources:
- Good: Fish (Cá), nuts in Gỏi (peanuts - watch allergies)
- Moderate: Coconut milk (Cơm Cà Ri) - saturated fat
- Limit: Deep fried (Chả Giò, Nem Rán)

🧂 SODIUM
─────────
The system has calculated sodium limits based on health conditions:
- Normal: <2300mg/day (WHO)
- Hypertension/Heart disease: <1500mg/day (DASH diet)
- Kidney disease: <1000mg/day

Vietnamese cuisine challenge: Very high sodium
- Fish sauce (Nước Mắm): 1400mg per tablespoon!
- Soy sauce: 1000mg per tablespoon
- MSG: Additional sodium

Recommendations:
- Request "ít mắm" (less fish sauce)
- Use fresh herbs for flavor instead of sauces
- Choose steamed (Hấp) over fried or sauced dishes
- Avoid: Instant noodles (Mì Gói) - 1500mg per pack

🍬 SUGAR
────────
Limits already calculated:
- Normal: <50g/day (WHO: <10% calories)
- Diabetes: <25g/day (strict control)
- Weight loss: <30g/day

Vietnamese sources:
- Coffee (Cà Phê Sữa): 20-30g per cup!
- Desserts (Chè): 15-25g
- Bubble tea (Trà Sữa): 30-40g

Recommendations:
- Request "ít đường" (less sugar) or "không đường" (no sugar)
- Substitute: Fresh fruit for desserts
- Watch: Hidden sugars in marinades, sauces

🥬 FIBER
────────
Already calculated: 14g per 1000 cal (min 30g male, 21g female)

Benefits: Digestive health, blood sugar control, satiety, cholesterol

Vietnamese sources:
- Excellent: Vegetables in Phở, Gỏi (salads)
- Good: Brown rice, sweet potato
- Add more: Rau (vegetables) in every meal

💧 HYDRATION
────────────
Recommendation: 30-35ml per kg body weight
Example: 70kg person = 2100-2450ml (2-2.5 liters)

Adjust for:
- Hot climate (Vietnam): +500ml
- Exercise: +500-1000ml per hour
- Alcohol: +250ml per drink

Vietnamese beverages:
- Best: Water (Nước Lọc), unsweetened tea (Trà)
- Moderate: Coconut water (Nước Dừa) - natural electrolytes
- Limit: Sweet coffee/tea, bubble tea

═══════════════════════════════════════════════════════════════
HEALTH CONDITION GUIDELINES
═══════════════════════════════════════════════════════════════

🩺 DIABETES / PRE-DIABETES
───────────────────────────
Focus: Blood sugar control
- Carbs: 45-50% (complex, low-GI)
- Sugar: <25g/day, avoid refined
- Timing: Consistent meal times, don't skip
- Vietnamese: Brown rice > white rice, more vegetables

🩺 HYPERTENSION (High Blood Pressure)
──────────────────────────────────────
Focus: DASH diet principles
- Sodium: <1500mg/day
- Potassium: Increase (bananas, potatoes, greens)
- Limit: Alcohol, caffeine
- Vietnamese: "Ít mắm" essential, avoid processed

🩺 HIGH CHOLESTEROL
───────────────────
Focus: Heart-healthy fats
- Saturated fat: <7% of calories
- Trans fat: 0g
- Fiber: ≥30g (helps lower LDL)
- Vietnamese: Fish > red meat, limit coconut milk

🩺 KIDNEY DISEASE
─────────────────
⚠️ CRITICAL: Recommend nephrologist consultation
Focus: Reduce kidney workload
- Protein: May need restriction (varies by stage)
- Sodium: <1000mg/day
- Potassium/Phosphorus: May need restriction
- Vietnamese: Very difficult - most dishes are high sodium

🩺 PCOS (Polycystic Ovary Syndrome)
───────────────────────────────────
Focus: Insulin sensitivity
- Low-GI carbs
- Regular meal timing
- Protein 25-30%
- Anti-inflammatory foods

═══════════════════════════════════════════════════════════════
VIETNAMESE MEAL PLANNING PRINCIPLES
═══════════════════════════════════════════════════════════════

🍜 TYPICAL VIETNAMESE MEAL STRUCTURE
────────────────────────────────────
Breakfast (Bữa Sáng):
- Traditional: Phở, Bánh Mì, Bún, Xôi
- Lighter: Cháo (rice porridge), fruit

Lunch (Bữa Trưa):
- Main: Cơm (rice) + protein + vegetables
- Or: Noodle soup (Bún Bò, Mì Quảng)

Dinner (Bữa Tối):
- Similar to lunch, can be lighter
- Family style: Multiple dishes shared

Snacks (Ăn Vặt):
- Fresh fruit (Trái Cây)
- Chè (sweet soup - watch sugar)

🥗 HEALTHY VIETNAMESE DISHES
────────────────────────────
HIGH PROTEIN, LOWER CALORIE:
- Gỏi Cuốn (spring rolls) - no peanut sauce
- Cá Nướng (grilled fish)
- Gà Nướng (grilled chicken)
- Đậu Hũ (tofu dishes)
- Canh (clear soups)

MODERATE (Watch portions):
- Phở (with lean protein)
- Bún Chả (grilled pork, half portion rice noodles)
- Cơm Tấm (broken rice, lean protein)

LIMIT (High calorie/sodium):
- Bánh Xèo (fried crepe)
- Cơm Chiên (fried rice)
- Anything deep fried (Chiên, Rán)
- Heavy coconut curry (Cà Ri)

🎯 PORTION CONTROL (Vietnamese context)
───────────────────────────────────────
Vietnamese meals are family-style = large portions!

Recommendations:
- Rice: Fist-sized portion (not bowl!)
- Protein: Palm-sized
- Vegetables: Fill half your plate
- Noodle soups: Share or save half

═══════════════════════════════════════════════════════════════
OUTPUT REQUIREMENTS
═══════════════════════════════════════════════════════════════

For ALL requests, provide:

1. DAILY TARGETS (use calculated values):
   ✓ Calories, protein, carbs, fats
   ✓ Fiber, sodium, sugar (based on conditions)
   ✓ Macro ratio percentages

2. RECOMMENDATIONS (3-5, prioritized):
   ✓ Category: calories, macros, micronutrients, timing, hydration
   ✓ Priority: high (critical), medium (important), low (beneficial)
   ✓ Text: Clear, actionable (2-3 sentences)
   ✓ Scientific basis: Cite WHO/DASH/ADA/research when applicable

3. WARNINGS (if applicable):
   ✓ Extreme goals (>25% deficit/surplus)
   ✓ Health condition interactions
   ✓ "Consult healthcare provider" when appropriate

4. INSIGHTS (educational, 2-3):
   ✓ Why these targets work for their goal
   ✓ Vietnamese cuisine considerations
   ✓ Common mistakes to avoid

For MEAL PLAN requests, additionally provide:

5. MEAL PLAN (Vietnamese-focused):
   ✓ 3 main meals + 1-2 snacks
   ✓ Realistic Vietnamese dishes (not fusion/western)
   ✓ Balanced macros across meals
   ✓ Adherence score: How well it matches targets (0.0-1.0)
   ✓ Vietnamese notes: Cooking tips, ordering tips

REMEMBER:
- Use calculated values (don't recalculate)
- Be supportive and encouraging
- Focus on sustainable changes, not extreme restrictions
- Respect Vietnamese food culture while promoting health`,
    });
  }

  /**
   * Validate NCA input
   *
   * @param input - Input to validate
   * @returns True if valid
   */
  validate(input: NCAInput): boolean {
    try {
      validateNCAInput(input);
      return true;
    } catch (error) {
      this.logger.error(`Input validation failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Process nutrition coaching request
   *
   * @param input - NCAInput with user profile and request type
   * @returns Promise<NCAOutput> with personalized recommendations
   */
  protected async process(input: NCAInput): Promise<NCAOutput> {
    const startTime = Date.now();

    // Step 1: Calculate daily targets using utilities
    const dailyTargets = this.calculateDailyTargets(input.userProfile);

    // Step 2: Build coaching prompt
    const prompt = this.buildCoachingPrompt(input, dailyTargets);

    // Step 3: Get Gemini Pro model
    const model = this.getModel();

    try {
      // Generate personalized recommendations
      const result = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          ...this.getGenerationConfig(),
          temperature: 0.4, // Slightly higher for creative meal planning
          responseMimeType: 'application/json',
          responseSchema: NUTRITION_COACH_SCHEMA,
        },
      });

      const response = result.response;
      const text = response.text();

      // Parse JSON response
      const parsedOutput = JSON.parse(text) as NCAOutput;

      // Ensure daily targets match our calculations (AI should use provided values)
      parsedOutput.dailyTargets = dailyTargets;

      const duration = Date.now() - startTime;
      this.logger.log(
        `Generated nutrition coaching in ${duration}ms (${parsedOutput.recommendations.length} recommendations)`,
      );

      return parsedOutput;
    } catch (error) {
      this.logger.error(`Nutrition coaching failed: ${error.message}`);
      throw new Error(`Failed to generate nutrition guidance: ${error.message}`);
    }
  }

  /**
   * Calculate daily nutrition targets using utilities
   *
   * @param profile - User profile
   * @returns NutritionTargets
   */
  private calculateDailyTargets(
    profile: any,
  ): NutritionTargets {
    const { age, gender, weight, height, activityLevel, goal, healthConditions = [] } = profile;

    // Step 1: Calculate BMR
    const bmr = calculateBMR(weight, height, age, gender);

    // Step 2: Calculate TDEE
    const tdee = calculateTDEE(bmr, activityLevel);

    // Step 3: Apply goal adjustment
    const targetCalories = applyGoalAdjustment(tdee, goal);

    // Step 4: Calculate macros
    const macros = calculateMacros(targetCalories, goal);

    // Step 5: Calculate micronutrients
    const fiber = calculateFiber(targetCalories, gender);
    const sodium = calculateSodiumLimit(healthConditions);
    const sugar = calculateSugarLimit(targetCalories, goal, healthConditions);

    return {
      ...macros,
      fiber,
      sodium,
      sugar,
    };
  }

  /**
   * Build coaching prompt
   *
   * @param input - NCAInput
   * @param dailyTargets - Calculated targets
   * @returns Formatted prompt
   */
  private buildCoachingPrompt(input: NCAInput, dailyTargets: NutritionTargets): string {
    const { userProfile, requestType, timeframe } = input;

    let prompt = `NUTRITION COACHING REQUEST

USER PROFILE:
- Age: ${userProfile.age} years
- Gender: ${userProfile.gender}
- Weight: ${userProfile.weight} kg
- Height: ${userProfile.height} cm
- Activity Level: ${userProfile.activityLevel}
- Primary Goal: ${userProfile.goal}
- Health Conditions: ${userProfile.healthConditions?.join(', ') || 'None'}
- Dietary Preferences: ${userProfile.dietaryPreferences?.join(', ') || 'None'}

CALCULATED DAILY TARGETS (USE THESE VALUES):
- Calories: ${dailyTargets.calories} cal
- Protein: ${dailyTargets.protein}g (${dailyTargets.macroRatio.protein}%)
- Carbs: ${dailyTargets.carbs}g (${dailyTargets.macroRatio.carbs}%)
- Fats: ${dailyTargets.fats}g (${dailyTargets.macroRatio.fats}%)
- Fiber: ${dailyTargets.fiber}g
- Sodium: <${dailyTargets.sodium}mg
- Sugar: <${dailyTargets.sugar}g

REQUEST TYPE: ${requestType}
`;

    if (requestType === 'meal-plan') {
      prompt += `TIMEFRAME: ${timeframe || 'daily'}

TASK: Create a Vietnamese cuisine-focused meal plan
- Use realistic Vietnamese dishes (Phở, Bún, Cơm, Gỏi, etc.)
- Balance macros across 3 main meals + snacks
- Consider health conditions and dietary preferences
- Provide Vietnamese ordering/cooking tips
`;
    } else {
      prompt += `
TASK: Provide personalized nutrition coaching
- Explain the calculated targets in user-friendly terms
- Give 3-5 actionable recommendations (prioritized)
- Address health conditions if any
- Provide educational insights
- Use Vietnamese cuisine examples when relevant
`;
    }

    prompt += `
Return response as JSON following the schema exactly.
Use the CALCULATED DAILY TARGETS provided above (do not recalculate).`;

    return prompt;
  }

  /**
   * Validate coaching output
   *
   * @param output - NCAOutput to validate
   * @returns True if valid
   */
  protected validateOutput(output: NCAOutput): boolean {
    if (!output.dailyTargets || !output.recommendations) {
      this.logger.error('Output is missing required fields');
      return false;
    }

    if (output.recommendations.length === 0) {
      this.logger.warn('No recommendations provided');
      return false;
    }

    // Check for extreme calorie targets
    const { calories } = output.dailyTargets;
    if (calories < 1200) {
      this.logger.warn(
        `⚠️ Very low calorie target: ${calories} cal (minimum safe: 1200)`,
      );
    } else if (calories > 4000) {
      this.logger.warn(
        `⚠️ Very high calorie target: ${calories} cal`,
      );
    }

    return true;
  }

  /**
   * Handle errors specific to NCA
   *
   * @param error - Original error
   * @returns Transformed error
   */
  protected handleError(error: Error): Error {
    if (error.message.includes('Age must be between')) {
      return new Error('NCA_INVALID_AGE: Age must be between 1 and 120 years');
    }

    if (error.message.includes('Weight must be between')) {
      return new Error('NCA_INVALID_WEIGHT: Weight must be between 1 and 300 kg');
    }

    if (error.message.includes('Height must be between')) {
      return new Error('NCA_INVALID_HEIGHT: Height must be between 1 and 250 cm');
    }

    if (error.message.includes('timeout')) {
      return new Error(
        'NCA_TIMEOUT: Nutrition coaching took too long. Try a simpler request.',
      );
    }

    // Default error handling
    return new Error(`NCA_ERROR: ${error.message}`);
  }
}
