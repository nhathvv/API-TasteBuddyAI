import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';

export interface FoodAnalysisInput {
  foodName: string;
  description?: string;
  nutritionInfo: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    fiber?: number;
    sugar?: number;
  };
  price: number;
  restaurantName: string;
  userProfile: {
    healthGoal?: string;
    dailyTargets?: {
      calories: number;
      protein: number;
      carbs: number;
      fats: number;
    };
    dietaryPreferences?: string[];
    allergens?: Array<{ type: string; severity: string }>;
  };
  mealTime?: string;
}

export interface AIRecommendation {
  isRecommended: boolean;
  recommendationScore: number; // 0-100
  reasons: string[];
  nutritionAnalysis: string;
  healthImpact: string;
  suggestions?: string[];
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');

    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY not configured. AI features will be disabled.');
      return;
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    this.logger.log('Gemini AI initialized successfully');
  }

  /**
   * Analyze a single food item and generate AI-powered recommendations
   */
  async analyzeFoodItem(input: FoodAnalysisInput): Promise<AIRecommendation> {
    if (!this.model) {
      // Fallback when Gemini is not configured
      return this.getFallbackRecommendation(input);
    }

    try {
      const prompt = this.buildAnalysisPrompt(input);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return this.parseAIResponse(text);
    } catch (error) {
      this.logger.error(`Error analyzing food with Gemini: ${error.message}`);
      return this.getFallbackRecommendation(input);
    }
  }

  /**
   * Batch analyze multiple food items
   */
  async analyzeFoodBatch(inputs: FoodAnalysisInput[]): Promise<AIRecommendation[]> {
    if (!this.model) {
      this.logger.warn('⚠️  Gemini model not initialized - returning fallback recommendations');
      return inputs.map(input => this.getFallbackRecommendation(input));
    }

    try {
      this.logger.log(`🤖 Analyzing ${inputs.length} foods with Gemini AI...`);
      const prompt = this.buildBatchAnalysisPrompt(inputs);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      this.logger.log(`✅ Gemini API response received (${text.length} chars)`);
      this.logger.debug(`Gemini response: ${text.substring(0, 200)}...`);

      const recommendations = this.parseBatchAIResponse(text, inputs.length);
      this.logger.log(`✅ Successfully parsed ${recommendations.length} AI recommendations`);

      return recommendations;
    } catch (error) {
      this.logger.error(`❌ Error batch analyzing foods with Gemini: ${error.message}`);
      this.logger.error(`Error stack: ${error.stack}`);
      return inputs.map(input => this.getFallbackRecommendation(input));
    }
  }

  /**
   * Generate personalized food recommendations summary
   */
  async generateRecommendationSummary(
    foods: FoodAnalysisInput[],
    userProfile: any,
  ): Promise<string> {
    if (!this.model) {
      this.logger.warn('⚠️  Gemini model not initialized - skipping AI summary');
      return 'AI-powered recommendations are currently unavailable.';
    }

    try {
      this.logger.log('🤖 Generating AI summary...');
      const prompt = `
You are a professional nutritionist AI assistant. Generate a personalized summary for the user.

User Profile:
- Health Goal: ${userProfile.healthGoal || 'Not specified'}
- Daily Targets: ${JSON.stringify(userProfile.dailyTargets || {})}
- Dietary Preferences: ${userProfile.dietaryPreferences?.join(', ') || 'None'}

Available Foods: ${foods.length} options

Provide a brief, encouraging summary (2-3 sentences) about:
1. How well these foods align with their health goal
2. Key nutritional highlights
3. Quick tip for making the best choice

Keep it friendly, concise, and actionable.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const summary = response.text().trim();

      this.logger.log(`✅ AI summary generated (${summary.length} chars)`);
      return summary;
    } catch (error) {
      this.logger.error(`❌ Error generating summary with Gemini: ${error.message}`);
      return 'We found several food options that match your preferences!';
    }
  }

  private buildAnalysisPrompt(input: FoodAnalysisInput): string {
    return `
You are a professional nutritionist AI assistant. Analyze this food item and provide recommendations.

Food Details:
- Name: ${input.foodName}
- Restaurant: ${input.restaurantName}
- Description: ${input.description || 'N/A'}
- Price: ${input.price.toLocaleString()} VND
- Meal Time: ${input.mealTime || 'Any time'}

Nutrition Info (per serving):
- Calories: ${input.nutritionInfo.calories} kcal
- Protein: ${input.nutritionInfo.protein}g
- Carbs: ${input.nutritionInfo.carbs}g
- Fats: ${input.nutritionInfo.fats}g
- Fiber: ${input.nutritionInfo.fiber || 'N/A'}g
- Sugar: ${input.nutritionInfo.sugar || 'N/A'}g

User Profile:
- Health Goal: ${input.userProfile.healthGoal || 'Not specified'}
- Daily Calorie Target: ${input.userProfile.dailyTargets?.calories || 'N/A'} kcal
- Daily Protein Target: ${input.userProfile.dailyTargets?.protein || 'N/A'}g
- Dietary Preferences: ${input.userProfile.dietaryPreferences?.join(', ') || 'None'}
- Allergens: ${input.userProfile.allergens?.map(a => `${a.type} (${a.severity})`).join(', ') || 'None'}

Provide your analysis in this EXACT JSON format:
{
  "isRecommended": true/false,
  "recommendationScore": 0-100,
  "reasons": ["reason 1", "reason 2", "reason 3"],
  "nutritionAnalysis": "brief nutrition analysis",
  "healthImpact": "how this aligns with user's health goal",
  "suggestions": ["optional suggestion 1", "optional suggestion 2"]
}

Focus on:
1. Whether this food aligns with the user's health goal
2. Nutritional balance and quality
3. Portion size appropriateness
4. Any concerns or benefits
5. Practical eating tips

Be concise, helpful, and evidence-based.
`;
  }

  private buildBatchAnalysisPrompt(inputs: FoodAnalysisInput[]): string {
    const foodsList = inputs
      .map(
        (input, idx) => `
${idx + 1}. ${input.foodName} at ${input.restaurantName}
   - Calories: ${input.nutritionInfo.calories} kcal, Protein: ${input.nutritionInfo.protein}g
   - Price: ${input.price.toLocaleString()} VND
`,
      )
      .join('\n');

    const userProfile = inputs[0]?.userProfile;

    return `
You are a professional nutritionist AI assistant. Analyze these ${inputs.length} food items and rank them for the user.

User Profile:
- Health Goal: ${userProfile?.healthGoal || 'Not specified'}
- Daily Targets: Calories ${userProfile?.dailyTargets?.calories || 'N/A'}, Protein ${userProfile?.dailyTargets?.protein || 'N/A'}g
- Preferences: ${userProfile?.dietaryPreferences?.join(', ') || 'None'}

Foods to analyze:
${foodsList}

For each food, provide analysis in this EXACT JSON format (one JSON object per line):
{"index": 0, "isRecommended": true/false, "recommendationScore": 0-100, "reasons": ["reason1", "reason2"], "nutritionAnalysis": "brief analysis", "healthImpact": "health impact", "suggestions": ["suggestion1"]}

Provide ${inputs.length} lines of JSON, one for each food item.
`;
  }

  private parseAIResponse(text: string): AIRecommendation {
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          isRecommended: parsed.isRecommended ?? true,
          recommendationScore: parsed.recommendationScore ?? 50,
          reasons: parsed.reasons || ['AI-generated recommendation'],
          nutritionAnalysis: parsed.nutritionAnalysis || '',
          healthImpact: parsed.healthImpact || '',
          suggestions: parsed.suggestions || [],
        };
      }
    } catch (error) {
      this.logger.warn('Failed to parse AI response as JSON');
    }

    // Fallback: parse text response
    return {
      isRecommended: true,
      recommendationScore: 70,
      reasons: [text.substring(0, 200)],
      nutritionAnalysis: 'AI analysis available',
      healthImpact: 'Moderate impact on health goals',
      suggestions: [],
    };
  }

  private parseBatchAIResponse(text: string, expectedCount: number): AIRecommendation[] {
    const results: AIRecommendation[] = [];
    const lines = text.split('\n').filter(line => line.trim().startsWith('{'));

    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        results.push({
          isRecommended: parsed.isRecommended ?? true,
          recommendationScore: parsed.recommendationScore ?? 50,
          reasons: parsed.reasons || [],
          nutritionAnalysis: parsed.nutritionAnalysis || '',
          healthImpact: parsed.healthImpact || '',
          suggestions: parsed.suggestions || [],
        });
      } catch (error) {
        this.logger.warn('Failed to parse batch response line');
      }
    }

    // Fill missing results with fallbacks
    while (results.length < expectedCount) {
      results.push(this.getFallbackRecommendation({} as any));
    }

    return results.slice(0, expectedCount);
  }

  private getFallbackRecommendation(input: FoodAnalysisInput): AIRecommendation {
    return {
      isRecommended: true,
      recommendationScore: 50,
      reasons: ['Based on nutritional data and user preferences'],
      nutritionAnalysis: 'Standard nutritional profile',
      healthImpact: 'Moderate alignment with health goals',
      suggestions: [],
    };
  }
}
