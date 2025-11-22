import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { AgentOrchestratorService } from '@/ai-agents/orchestrator/agent-orchestrator.service';
import { VisualExtractionAgent } from '@/ai-agents/visual-extraction/visual-extraction.agent';
import { AllergenSafetyAgent } from '@/ai-agents/allergen-safety/allergen-safety.agent';
import { DietaryComplianceAgent } from '@/ai-agents/dietary-compliance/dietary-compliance.agent';
import { NutritionCoachAgent } from '@/ai-agents/nutrition-coach/nutrition-coach.agent';
import { DishUnderstandingAgent } from '@/ai-agents/dish-understanding/dish-understanding.agent';
import { CloudVisionAgent } from '@/ai-agents/cloud-vision/cloud-vision.agent';
import { VisionFeature } from '@/ai-agents/cloud-vision/cloud-vision.schema';
import { ScanMenuDto } from './dto/scan-menu.dto';
import {
  TestVisualExtractionDto,
  TestAllergenSafetyDto,
  TestDietaryComplianceDto,
  TestNutritionCoachDto,
} from './dto/test-agents.dto';
import { TestDishUnderstandingDto } from './dto/test-dish-understanding.dto';
import { TestDishRecognitionDto } from './dto/test-dish-recognition.dto';
import { MenuItem } from '@/ai-agents/visual-extraction/visual-extraction.schema';
import { IDishUnderstanding } from '@/shared/types';

import { FoodImageValidationService } from '@/ai-agents/food-image-validation/food-image-validation.service';
import { GeminiCoreService } from '@/shared/services/gemini-core.service';

import { DishRecognitionAgent } from '@/ai-agents/dish-recognition/dish-recognition.agent';

@Injectable()
export class MenuService {
  private readonly logger = new Logger(MenuService.name);

  constructor(
    private readonly geminiService: GeminiCoreService,
    private readonly visualExtractionAgent: VisualExtractionAgent,
    private readonly dishUnderstandingAgent: DishUnderstandingAgent,
    private readonly dishRecognitionAgent: DishRecognitionAgent,
    private readonly allergenSafetyAgent: AllergenSafetyAgent,
    private readonly nutritionCoachAgent: NutritionCoachAgent,
    private readonly dietaryComplianceAgent: DietaryComplianceAgent,
    private readonly orchestrator: AgentOrchestratorService,
    private readonly foodImageValidationService: FoodImageValidationService,
    private readonly cloudVisionAgent: CloudVisionAgent,
  ) { }

  // Cache for dish analysis results (in-memory, 24h TTL)
  private dishAnalysisCache = new Map<string, { result: any; timestamp: number }>();
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Generate cache key for dish
   */
  private getDishCacheKey(dishName: string, language: string = 'vi'): string {
    return `${language}:${dishName.toLowerCase().trim()}`;
  }

  /**
   * Get cached dish analysis
   */
  private getCachedDishAnalysis(dishName: string, language: string = 'vi') {
    const key = this.getDishCacheKey(dishName, language);
    const cached = this.dishAnalysisCache.get(key);

    if (!cached) return null;

    // Check if expired
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.dishAnalysisCache.delete(key);
      return null;
    }

    return cached.result;
  }

  /**
   * Cache dish analysis result
   */
  private cacheDishAnalysis(dishName: string, result: any, language: string = 'vi') {
    const key = this.getDishCacheKey(dishName, language);
    this.dishAnalysisCache.set(key, {
      result,
      timestamp: Date.now(),
    });
    
    this.logger.debug(`Cached: ${dishName} (total: ${this.dishAnalysisCache.size} dishes)`);
  }

  // Mock user data for testing (no need to pass from body)
  private readonly MOCK_USER_DATA = {
    userProfile: {
      age: 30,
      gender: 'male',
      weight: 75,
      height: 175,
      activityLevel: 'moderate',
      goal: 'weight-loss',
    },
    allergens: [],
    healthConditions: ['hypertension', 'diabetes'],
  };

  /**
   * Scan a menu image and run safety/compliance agents in parallel.
   */
  async scanMenu(dto: ScanMenuDto) {
    this.logger.log('Starting menu scan workflow');



    // 0. Food Image Validation Gatekeeper
    this.logger.log('Validating food image...');
    const imageBuffer = Buffer.from(dto.imageData, 'base64');
    const validationResult = await this.foodImageValidationService.validateImage(
      imageBuffer,
      dto.mimeType,
    );
    this.logger.log(`Image validated: ${validationResult.category} (${validationResult.confidence})`);

    if (!validationResult.isFoodImage || validationResult.confidence < 0.75) {
      throw new BadRequestException({
        code: 'ERR_NOT_FOOD_IMAGE',
        message: 'Image rejected: Not a valid food image or low confidence.',
        details: validationResult.reason,
      });
    }

    this.logger.log(`Image validated: ${validationResult.category} (${validationResult.confidence})`);

    let menuItems: MenuItem[] = [];
    let extractionResult: any = null;

    if (validationResult.category === 'menu_photo') {
      // Case A: It's a Menu -> Run Visual Extraction (OCR + Structure)
      this.logger.log('Processing as MENU PHOTO...');
      const extraction = await this.visualExtractionAgent.execute({
        imageData: dto.imageData,
        mimeType: dto.mimeType,
        language: dto.language ?? 'vi',
        extractionMode: dto.extractionMode ?? 'quick',
      });
      extractionResult = extraction;
      menuItems = this.flattenMenuItems(extraction.menuSections);
    } else {
      // Case B: It's a Food Photo -> Run Dish Recognition (Vision)
      this.logger.log(`Processing as FOOD PHOTO (${validationResult.category})...`);
      const recognition = await this.dishRecognitionAgent.execute({
        imageData: dto.imageData,
        mimeType: dto.mimeType,
      });

      // Normalize to MenuItem structure for downstream agents
      menuItems = recognition.dishes.map((dish) => ({
        name: dish.detectedDishName,
        description: `Origin: ${dish.cuisineOrigin}. ${dish.visualCharacteristics || ''}`,
        price: 0, // Price is unknown from a food photo
        category: 'Detected Dish',
        visualTags: [], // Visual tags not explicitly returned by new schema, can be inferred later
      }));

      extractionResult = {
        menuSections: [
          {
            sectionName: 'Detected Dishes',
            items: menuItems,
          },
        ],
        metadata: {
          totalItems: menuItems.length,
          extractionQuality: 'high',
          confidenceScore: recognition.dishes.reduce((acc, d) => acc + d.confidenceScore, 0) / (recognition.dishes.length || 1),
          processingTime: 0, // Not tracked here
        },
      };
    }

    // 1. Run Dish Understanding Agent to get enriched data
    let enrichedDishes: IDishUnderstanding[] = [];
    try {
      this.logger.log('Running Dish Understanding Agent...');
      const duiaResult = await this.dishUnderstandingAgent.execute({
        dishes: menuItems.map((item, index) => ({
          dishId: `dish_${Date.now()}_${index}`,
          dishName: item.name,
          description: item.description,
          sectionName: item.category,
          language: dto.language ?? 'vi',
        })),
        context: dto.context,
      });
      enrichedDishes = duiaResult.dishes;
      this.logger.log(`DUIA enriched ${enrichedDishes.length} dishes`);
    } catch (error) {
      this.logger.warn(`DUIA failed, proceeding with raw menu items: ${error.message}`);
    }

    // 2. Run Safety & Compliance Agents in parallel
    const { results, summary } = await this.orchestrator.runParallel([
      {
        agent: this.allergenSafetyAgent,
        label: 'allergen-safety',
        input: {
          menuItems,
          enrichedItems: enrichedDishes.length > 0 ? enrichedDishes : undefined,
          userAllergens: dto.userAllergens ?? [],
          strictMode: dto.strictAllergenMode ?? true,
          language: dto.outputLanguage ?? 'en',
        },
      },
      {
        agent: this.dietaryComplianceAgent,
        label: 'dietary-compliance',
        input: {
          menuItems,
          dietaryRestrictions: dto.dietaryRestrictions ?? [],
          context: dto.context,
        },
      },
    ]);

    const allergenResult = results.find((result) => result.label === 'allergen-safety');
    const complianceResult = results.find(
      (result) => result.label === 'dietary-compliance',
    );

    return {
      extraction: extractionResult,
      allergenAnalysis: allergenResult?.output ?? null,
      dietaryCompliance: complianceResult?.output ?? null,
      timeline: summary,
    };
  }

  /**
   * Test Visual Extraction Agent
   * Extract menu items from an image
   */
  async testVisualExtraction(dto: TestVisualExtractionDto) {
    this.logger.log('Testing Visual Extraction Agent');

    const result = await this.visualExtractionAgent.execute({
      imageData: dto.imageData,
      mimeType: dto.mimeType,
      language: dto.language ?? 'vi',
      extractionMode: dto.extractionMode ?? 'quick',
    });

    return {
      agent: 'VisualExtractionAgent',
      result,
    };
  }

  /**
   * Test Allergen Safety Agent
   * Analyze menu items for allergen risks
   */
  async testAllergenSafety(dto: TestAllergenSafetyDto) {
    this.logger.log('Testing Allergen Safety Agent');

    const result = await this.allergenSafetyAgent.execute({
      menuItems: dto.menuItems,
      userAllergens: dto.userAllergens,
      strictMode: dto.strictMode ?? true,
      language: dto.language ?? 'en',
    });

    return {
      agent: 'AllergenSafetyAgent',
      result,
    };
  }

  /**
   * Test Dietary Compliance Agent
   * Check menu items against dietary restrictions
   */
  async testDietaryCompliance(dto: TestDietaryComplianceDto) {
    this.logger.log('Testing Dietary Compliance Agent');

    const result = await this.dietaryComplianceAgent.execute({
      menuItems: dto.menuItems,
      dietaryRestrictions: dto.dietaryRestrictions,
      context: dto.context,
    });

    return {
      agent: 'DietaryComplianceAgent',
      result,
    };
  }

  /**
   * Test Nutrition Coach Agent
   * Get personalized nutrition recommendations
   */
  async testNutritionCoach(dto: TestNutritionCoachDto) {
    this.logger.log('Testing Nutrition Coach Agent');

    // Map goal from DTO format to NutritionGoal format
    const goalMapping = {
      'weight-loss': 'lose-weight',
      'weight-gain': 'gain-muscle',
      'maintain': 'maintain',
      'muscle-gain': 'gain-muscle',
      'general-health': 'health',
    } as const;

    const mappedGoal = dto.goal ? goalMapping[dto.goal] : 'maintain';

    const result = await this.nutritionCoachAgent.execute({
      userProfile: {
        age: dto.age ?? 30,
        gender: dto.gender ?? 'male',
        weight: dto.weight ?? 70,
        height: dto.height ?? 170,
        activityLevel: dto.activityLevel ?? 'moderate',
        goal: mappedGoal,
        healthConditions: dto.healthConditions as any,
        dietaryPreferences: dto.dietaryPreferences as any,
      },
      requestType: dto.requestType ?? 'daily-targets',
      timeframe: dto.timeframe,
      menuItems: dto.menuItems,
    });

    return {
      agent: 'NutritionCoachAgent',
      result,
    };
  }

  /**
   * Test Dish Understanding Agent
   */
  async testDishUnderstanding(dto: TestDishUnderstandingDto) {
    this.logger.log('Testing Dish Understanding Agent...');

    const result = await this.dishUnderstandingAgent.execute({
      dishes: dto.dishes,
      context: dto.context,
    });

    return {
      agent: 'DishUnderstandingAgent',
      result,
    };
  }

  async testDishRecognition(dto: TestDishRecognitionDto) {
    this.logger.log('Testing Dish Recognition Agent...');
    const result = await this.dishRecognitionAgent.execute({
      imageData: dto.imageData,
      mimeType: dto.mimeType,
    });

    return {
      agent: 'DishRecognitionAgent',
      result,
    };
  }

  /**
   * Test Cloud Vision Agent with Multi-Agent Pipeline
   * 
   * Pipeline: Cloud Vision (OCR) → Dish Understanding → Allergen Safety → Nutrition Coach
   * 
   * @param input - Image data, user profile, and allergen profile
   * @returns Combined results from all agents in standardized FR-06/FR-07 format
   */
  async testCloudVisionPipeline(input: {
    imageData: string;
    mimeType: string;
    features?: string[];
    maxResults?: number;
    languageHints?: string[];
    userProfile?: {
      age: number;
      gender: string;
      weight: number;
      height: number;
      activityLevel: string;
      goal: string;
    };
    allergens?: Array<{
      name: string;        // e.g., 'peanut', 'shellfish', 'gluten'
      severity: string;    // 'mild', 'moderate', 'severe'
    }>;
    healthConditions?: string[];  // e.g., ['hypertension', 'diabetes']
  }) {
    const pipelineStartTime = Date.now();
    this.logger.log('Starting Cloud Vision multi-agent pipeline...');

    // Use mock user data if not provided (for easy testing)
    const userProfile = input.userProfile || this.MOCK_USER_DATA.userProfile;
    const allergens = input.allergens || this.MOCK_USER_DATA.allergens;
    const healthConditions = input.healthConditions || this.MOCK_USER_DATA.healthConditions;

    const usingMockData = !input.userProfile || !input.allergens;
    if (usingMockData) {
      this.logger.log('🧪 Using MOCK user data (no params provided):');
      this.logger.log(`   - Profile: ${userProfile.age}y ${userProfile.gender}, ${userProfile.goal}`);
      this.logger.log(`   - Allergens: ${allergens.map(a => `${a.name}(${a.severity})`).join(', ')}`);
      this.logger.log(`   - Health: ${healthConditions.join(', ')}`);
    } else {
      this.logger.log('✅ Using USER-PROVIDED data');
    }

    // Stage 1: Cloud Vision Analysis
    this.logger.log('[Pipeline Stage 1/3] Running Cloud Vision Agent...');
    
    // Parse features if provided as strings
    let parsedFeatures: any[] | undefined;
    if (input.features && input.features.length > 0) {
      parsedFeatures = input.features.map(
        (f) => VisionFeature[f as keyof typeof VisionFeature],
      );
    }
    
    const visionResult = await this.cloudVisionAgent.execute({
      imageData: input.imageData,
      mimeType: input.mimeType,
      features: parsedFeatures,
      maxResults: input.maxResults,
      languageHints: input.languageHints,
    });

    // Stage 2: Extract dish names from OCR text
    this.logger.log('[Pipeline Stage 2/3] Extracting dish names from OCR...');
    const dishNames = this.extractDishNamesFromOCR(
      visionResult.fullText || '',
      visionResult.textAnnotations || [],
    );

    if (dishNames.length === 0) {
      this.logger.warn('No dish names extracted from OCR, skipping further analysis');
      return {
        cloudVision: visionResult,
        dishUnderstanding: null,
        nutritionAnalysis: null,
        pipeline: {
          totalProcessingTime: Date.now() - pipelineStartTime,
          stagesCompleted: 1,
          dishesFound: 0,
          message: 'No dish names detected in image',
        },
      };
    }

    this.logger.log(`Extracted ${dishNames.length} dish names: ${dishNames.join(', ')}`);

    // Limit dishes for optimal performance (max 4 dishes)
    // Flash model: ~2-3s per dish, so 4 dishes = ~12s total (parallel)
    // NutritionCoach needs headroom, so keeping it at 4 is safer
    const MAX_DISHES = 4;
    const limitedDishNames = dishNames.slice(0, MAX_DISHES);
    
    if (dishNames.length > MAX_DISHES) {
      this.logger.warn(
        `Limiting analysis to first ${MAX_DISHES} dishes (found ${dishNames.length} total)`,
      );
    }

    // Stage 3: Dish Understanding Analysis (Parallel processing with caching)
    this.logger.log(
      `[Pipeline Stage 3/5] Running Dish Understanding Agent for ${limitedDishNames.length} dishes (parallel + cache)...`,
    );

    const language = input.languageHints?.[0] || 'vi';
    let cacheHits = 0;

    // Analyze all dishes in parallel (with cache check)
    const dishPromises = limitedDishNames.map(async (dishName, i) => {
      // Check cache first
      const cached = this.getCachedDishAnalysis(dishName, language);
      if (cached) {
        this.logger.log(`Cache HIT: ${dishName}`);
        cacheHits++;
        return { dishes: [cached] };
      }

      // Cache miss - analyze with AI
      this.logger.log(`Cache MISS: ${dishName} - analyzing...`);
      try {
        const result = await this.dishUnderstandingAgent.execute({
          dishes: [
            {
              dishId: `dish_${Date.now()}_${i}`,
              dishName: dishName,
              language,
            },
          ],
          context: 'Analyzing single dish from menu image via Cloud Vision OCR',
        });

        // Cache the result
        if (result.dishes && result.dishes.length > 0) {
          this.cacheDishAnalysis(dishName, result.dishes[0], language);
        }

        return result;
      } catch (error) {
        this.logger.error(`Failed to analyze "${dishName}": ${error.message}`);
        return null;
      }
    });

    // Wait for all parallel requests
    const dishResults = await Promise.all(dishPromises);

    this.logger.log(
      `Cache performance: ${cacheHits}/${limitedDishNames.length} hits (${Math.round((cacheHits / limitedDishNames.length) * 100)}%)`,
    );

    // Extract successful results
    const dishAnalysisResults = dishResults
      .filter((result): result is Exclude<typeof result, null> => 
        result !== null && result.dishes && result.dishes.length > 0
      )
      .map((result) => result.dishes[0]);

    const failedDishes = limitedDishNames.length - dishAnalysisResults.length;

    // If all dishes failed, return error
    if (dishAnalysisResults.length === 0) {
      this.logger.error('All dishes failed to analyze');
      return {
        cloudVision: visionResult,
        dishUnderstanding: null,
        nutritionAnalysis: null,
        pipeline: {
          totalProcessingTime: Date.now() - pipelineStartTime,
          stagesCompleted: 2,
          dishesFound: limitedDishNames.length,
          dishNames: limitedDishNames,
          error: 'Dish Understanding stage failed',
          errorMessage: 'All dishes failed to analyze',
        },
      };
    }

    // Build combined result
    const dishAnalysis = {
      dishes: dishAnalysisResults,
      metadata: {
        totalDishes: dishAnalysisResults.length,
        failedDishes,
        averageConfidence:
          dishAnalysisResults.reduce((sum, d) => sum + (d.confidenceScore || 0), 0) /
          dishAnalysisResults.length,
        processingTime: Date.now() - pipelineStartTime,
      },
    };

    this.logger.log(
      `Successfully analyzed ${dishAnalysisResults.length}/${limitedDishNames.length} dishes`,
    );

    // Stage 4: Allergen Safety Analysis (if allergen profile provided)
    let allergenAnalysis: any = null;
    if (allergens && allergens.length > 0) {
      this.logger.log(
        `[Pipeline Stage 4/5] Running Allergen Safety Agent for ${allergens.length} allergens...`,
      );
      this.logger.log(`User allergens: ${JSON.stringify(allergens)}`);
      this.logger.log(`Dishes to analyze: ${dishAnalysis.dishes.map((d: any) => d.originalName).join(', ')}`);

      try {
        allergenAnalysis = await this.allergenSafetyAgent.execute({
          menuItems: [],  // Not used when enrichedItems is provided
          enrichedItems: dishAnalysis.dishes,
          userAllergens: allergens.map((a) => ({
            type: a.name as any,  // Will be validated by agent
            severity: a.severity as any,
          })),
          strictMode: true,
          language: input.languageHints?.[0] || 'en',
        });

        this.logger.log(
          `✅ Allergen safety: ${allergenAnalysis.summary.safeItems} safe, ${allergenAnalysis.summary.unsafeItems} unsafe`,
        );
        this.logger.debug(`Allergen analysis result: ${JSON.stringify(allergenAnalysis.analysis.map((a: any) => ({ dish: a.dishName, risk: a.riskLevel })))}`);
      } catch (error) {
        this.logger.error(`❌ Allergen Safety Agent FAILED: ${error.message}`);
        this.logger.error(`Error stack: ${error.stack}`);
        allergenAnalysis = null; // Explicitly set to null on error
      }
    } else {
      this.logger.warn(`⚠️ Skipping Allergen Safety stage - no allergen profile`);
    }

    // Stage 5: Nutrition Analysis (if user profile provided)
    let nutritionAnalysis: any = null;
    if (userProfile) {
      this.logger.log('[Pipeline Stage 5/5] Running Nutrition Coach Agent...');

      // Map goal
      const goalMapping = {
        'weight-loss': 'lose-weight',
        'weight-gain': 'gain-muscle',
        maintain: 'maintain',
        'muscle-gain': 'gain-muscle',
        'general-health': 'health',
      } as const;

      const mappedGoal =
        goalMapping[userProfile.goal as keyof typeof goalMapping] || 'maintain';

      // Estimate calories based on dish understanding
      const menuItems = dishAnalysis.dishes.map((dish) => ({
        name: dish.canonicalName || dish.originalName,
        estimatedCalories: this.estimateCaloriesFromDish(dish),
      }));

      nutritionAnalysis = await this.nutritionCoachAgent.execute({
        userProfile: {
          age: userProfile.age,
          gender: userProfile.gender as 'male' | 'female',
          weight: userProfile.weight,
          height: userProfile.height,
          activityLevel: userProfile.activityLevel as any,
          goal: mappedGoal,
        },
        requestType: 'dish-analysis',
        menuItems,
      });
    }

    const totalTime = Date.now() - pipelineStartTime;
    const stagesCompleted = 2 + (allergenAnalysis ? 1 : 0) + (nutritionAnalysis ? 1 : 0);
    this.logger.log(
      `Pipeline completed in ${totalTime}ms with ${stagesCompleted} stages`,
    );

    //  Transform to FR-06/FR-07 format
    return this.transformToFR06FR07Format(
      visionResult,
      dishAnalysis,
      allergenAnalysis,
      nutritionAnalysis,
      allergens,
      userProfile,
      healthConditions,
      totalTime,
      limitedDishNames,
    );
  }

  /**
   * Extract dish names from Cloud Vision OCR results
   * 
   * @param fullText - Full OCR text
   * @param annotations - Individual text annotations
   * @returns Array of dish names
   */
  private extractDishNamesFromOCR(
    fullText: string,
    annotations: any[],
  ): string[] {
    if (!fullText) return [];

    const dishNames: string[] = [];
    const lines = fullText.split('\n').filter((line) => line.trim().length > 0);

    // Common Vietnamese menu headers/footers to skip
    const skipPatterns = [
      /^(menu|thực đơn|danh sách|món|price|giá|total|tổng|cộng|address|địa chỉ|phone|tel|hotline)/i,
      /^(thank|cảm ơn|welcome|chào|open|close|mở|đóng|cửa)/i,
      /^(www\.|http|\.com|\.vn|facebook|zalo)/i,
      /^\d+[\s-]*\d+[\s-]*\d+/, // Phone numbers
    ];

    for (const line of lines) {
      // Remove price patterns (numbers with currency symbols)
      let cleaned = line
        .replace(/[\d,\.]+\s*(đ|VND|vnđ|k|₫)/gi, '') // Remove prices
        .replace(/\d{2,}/g, '') // Remove standalone numbers
        .replace(/[•\-\*→]/g, '') // Remove bullets and arrows
        .replace(/\([^)]*\)/g, '') // Remove parentheses content
        .trim();

      // Skip if line is too short
      if (cleaned.length < 3 || cleaned.length > 100) continue;

      // Skip common headers/footers
      if (skipPatterns.some((pattern) => pattern.test(cleaned))) continue;

      // Skip if line is mostly numbers or symbols
      const alphaRatio = (cleaned.match(/[a-zA-ZàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđĐ]/g) || []).length / cleaned.length;
      if (alphaRatio < 0.5) continue;

      // Only add if it looks like a dish name
      dishNames.push(cleaned);
    }

    // Deduplicate and limit to reasonable count
    const uniqueDishes = [...new Set(dishNames)];
    
    // Sort by length (longer names are more likely to be actual dishes)
    const sortedDishes = uniqueDishes.sort((a, b) => b.length - a.length);
    
    // Return top 15 most likely dishes
    return sortedDishes.slice(0, 15);
  }

  /**
   * Estimate calories from dish understanding analysis
   * 
   * @param dish - Dish understanding result
   * @returns Estimated calories
   */
  private estimateCaloriesFromDish(dish: any): number {
    // Simple estimation based on ingredients
    // This is a rough estimate, can be improved with more sophisticated logic

    const ingredients = dish.ingredients || [];
    let baseCalories = 200; // Base estimate

    // Adjust based on primary ingredients
    for (const ingredient of ingredients) {
      const name = (ingredient.canonicalName || ingredient.name || '').toLowerCase();

      // Protein sources
      if (name.includes('beef') || name.includes('pork') || name.includes('bò') || name.includes('heo')) {
        baseCalories += 150;
      }
      if (name.includes('chicken') || name.includes('gà')) {
        baseCalories += 100;
      }
      if (name.includes('shrimp') || name.includes('tôm') || name.includes('fish') || name.includes('cá')) {
        baseCalories += 80;
      }

      // Carbs
      if (name.includes('rice') || name.includes('cơm') || name.includes('noodle') || name.includes('bún') || name.includes('phở')) {
        baseCalories += 200;
      }

      // Fats
      if (name.includes('oil') || name.includes('dầu') || name.includes('coconut') || name.includes('dừa')) {
        baseCalories += 50;
      }
    }

    // Cap at reasonable limits
    return Math.min(Math.max(baseCalories, 100), 1000);
  }

  /**
   * Test Cloud Vision Agent
   * Analyze image using Google Cloud Vision API
   */
  async testCloudVision(input: {
    imageData: string;
    mimeType: string;
    features?: string[];
    maxResults?: number;
    languageHints?: string[];
  }) {
    this.logger.log('Testing Cloud Vision Agent...');

    // Parse features if provided as strings
    let parsedFeatures: any[] | undefined;
    if (input.features && input.features.length > 0) {
      parsedFeatures = input.features.map(
        (f) => VisionFeature[f as keyof typeof VisionFeature],
      );
    }

    const result = await this.cloudVisionAgent.execute({
      imageData: input.imageData,
      mimeType: input.mimeType,
      features: parsedFeatures,
      maxResults: input.maxResults,
      languageHints: input.languageHints,
    });

    return {
      agent: 'CloudVisionAgent',
      result,
    };
  }

  /**
   * Transform pipeline results to FR-06/FR-07 format
   */
  private transformToFR06FR07Format(
    visionResult: any,
    dishAnalysis: any,
    allergenAnalysis: any,
    nutritionAnalysis: any,
    allergens: any[],
    userProfile: any,
    healthConditions: string[],
    processingTime: number,
    dishNames: string[],
  ) {
    // Create a map of allergen results by dish name for efficient lookup
    const allergenMap = new Map<string, any>();
    if (allergenAnalysis && allergenAnalysis.analysis) {
      allergenAnalysis.analysis.forEach((analysis: any) => {
        const dishName = analysis.dishName.toLowerCase().trim();
        allergenMap.set(dishName, analysis);
      });
      this.logger.log(`✅ Allergen map created with ${allergenMap.size} entries`);
      this.logger.debug(`Allergen map keys: ${Array.from(allergenMap.keys()).join(', ')}`);
    } else {
      this.logger.warn(`⚠️ No allergen analysis available (allergenAnalysis: ${!!allergenAnalysis})`);
    }

    const dishes = dishAnalysis.dishes.map((dish: any, index: number) => {
      // Try matching by both originalName and canonicalName
      const originalNameKey = dish.originalName.toLowerCase().trim();
      const canonicalNameKey = dish.canonicalName.toLowerCase().trim();
      
      let allergenCheck = allergenMap.get(originalNameKey);
      if (!allergenCheck) {
        allergenCheck = allergenMap.get(canonicalNameKey);
        if (allergenCheck) {
          this.logger.debug(`Matched "${dish.originalName}" via canonical name "${dish.canonicalName}"`);
        }
      } else {
        this.logger.debug(`Matched "${dish.originalName}" via original name`);
      }
      
      if (!allergenCheck) {
        this.logger.warn(`❌ No allergen check found for "${dish.originalName}" (tried: "${originalNameKey}", "${canonicalNameKey}")`);
      } else {
        this.logger.log(`✅ Found allergen check for "${dish.originalName}": ${allergenCheck.riskLevel}`);
      }
      
      return {
        dishId: dish.dishId,
        dishName: dish.originalName,
        dishNameEnglish: dish.canonicalName,
        imageAnalysis: {
          confidence: visionResult.metadata.confidenceScore,
          detectedLabels: visionResult.labelAnnotations?.map((l: any) => l.description) || [],
        },
        ingredients: dish.ingredients.map((ing: any) => ({
          name: ing.name,
          nameEnglish: ing.canonicalName,
          isPrimary: ing.isPrimary,
          allergenTags: this.extractAllergenTags(ing, dish.inferredAllergenSignals),
        })),
        nutrition: this.estimatePerDishNutrition(dish),
        safetyCheck: this.buildSafetyCheck(allergenCheck, allergens, healthConditions),
      };
    });

    const safeCount = dishes.filter((d: any) => d.safetyCheck.status === 'safe').length;
    const warningCount = dishes.filter((d: any) => d.safetyCheck.status === 'warning').length;
    const dangerCount = dishes.filter((d: any) => d.safetyCheck.status === 'danger').length;

    return {
      success: true,
      message: 'Dish analysis completed successfully',
      data: {
        dishes,
        summary: {
          totalDishes: dishes.length,
          safeCount,
          warningCount,
          dangerCount,
          totalCalories: dishes.reduce((sum: number, d: any) => sum + d.nutrition.calories, 0),
          averageProtein: dishes.reduce((sum: number, d: any) => sum + d.nutrition.protein, 0) / dishes.length,
          processingTime,
        },
        userProfile: allergens || healthConditions ? {
          allergens: allergens?.map((a: any) => ({
            name: a.name,
            severity: a.severity,
          })) || [],
          healthConditions: healthConditions || [],
          dietaryGoal: userProfile?.goal,
          dailyCalorieTarget: nutritionAnalysis?.dailyTargets?.calories,
        } : undefined,
      },
    };
  }

  /**
   * Extract allergen tags from ingredient
   */
  private extractAllergenTags(ingredient: any, allergenSignals: string[]): string[] {
    const tags: string[] = [];
    const name = ingredient.canonicalName.toLowerCase();

    // Common allergen mappings
    if (name.includes('gluten') || name.includes('wheat') || name.includes('baguette') || name.includes('bread')) {
      tags.push('gluten', 'wheat');
    }
    if (name.includes('peanut') || name.includes('nut')) {
      tags.push('peanut');
    }
    if (name.includes('shrimp') || name.includes('shellfish') || name.includes('crab')) {
      tags.push('shellfish');
    }
    if (name.includes('egg')) {
      tags.push('egg');
    }
    if (name.includes('dairy') || name.includes('milk') || name.includes('cheese')) {
      tags.push('dairy');
    }
    if (name.includes('soy')) {
      tags.push('soy');
    }
    if (name.includes('fish')) {
      tags.push('fish');
    }

    return [...new Set(tags)];
  }

  /**
   * Estimate nutrition per dish
   */
  private estimatePerDishNutrition(dish: any) {
    const baseCalories = this.estimateCaloriesFromDish(dish);

    return {
      calories: baseCalories,
      protein: Math.round((baseCalories * 0.25) / 4),  // 25% from protein, 4 cal/g
      carbs: Math.round((baseCalories * 0.45) / 4),    // 45% from carbs, 4 cal/g
      fat: Math.round((baseCalories * 0.30) / 9),      // 30% from fat, 9 cal/g
      fiber: Math.round(baseCalories / 150),           // Rough estimate
      sodium: baseCalories * 2,                         // Vietnamese food is high sodium
      sugar: Math.round(baseCalories / 100),           // Rough estimate
      servingSize: '1 serving (~200g)',
    };
  }

  /**
   * Build safety check object from allergen analysis
   */
  private buildSafetyCheck(
    allergenCheck: any,
    userAllergens: any[],
    healthConditions: string[],
  ) {
    // Case 1: No allergen profile provided
    if (!userAllergens || userAllergens.length === 0) {
      return {
        status: 'safe',
        overallRisk: 'low',
        detectedAllergens: [],
        healthConditionWarnings: [],
        warnings: [],
        safeTags: ['✅ No allergen profile provided - unable to check'],
        recommendation: 'Provide allergen profile for safety analysis',
      };
    }

    // Case 2: Allergen profile provided, but analysis failed (e.g. matching error)
    if (!allergenCheck) {
      return {
        status: 'warning',
        overallRisk: 'unknown',
        detectedAllergens: [],
        healthConditionWarnings: [],
        warnings: ['⚠️ Safety analysis failed for this dish (matching error)'],
        safeTags: [],
        recommendation: 'Please verify ingredients manually',
      };
    }

    const status = this.mapRiskLevelToStatus(allergenCheck.riskLevel);
    const warnings: string[] = [];
    const safeTags: string[] = [];

    // Generate warnings from allergen check
    if (allergenCheck.identifiedAllergens && allergenCheck.identifiedAllergens.length > 0) {
      allergenCheck.identifiedAllergens.forEach((allergen: any) => {
        const emoji = status === 'danger' ? '⛔' : '⚠️';
        warnings.push(`${emoji} Contains ${allergen.allergen} from ${allergen.source}`);
      });
    }

    // Generate safe tags
    const commonAllergens = ['peanut', 'shellfish', 'egg', 'dairy', 'soy', 'gluten'];
    const detectedTypes = allergenCheck.identifiedAllergens?.map((a: any) => a.allergen.toLowerCase()) || [];
    
    commonAllergens.forEach(allergen => {
      if (!detectedTypes.includes(allergen)) {
        safeTags.push(`✅ ${allergen.charAt(0).toUpperCase() + allergen.slice(1)}-free`);
      }
    });

    return {
      status,
      overallRisk: allergenCheck.riskLevel?.toLowerCase() || 'unknown',
      detectedAllergens: allergenCheck.identifiedAllergens || [],
      healthConditionWarnings: [],  // TODO: Implement health condition warnings
      warnings,
      safeTags,
      recommendation: allergenCheck.recommendation || '',
    };
  }

  /**
   * Map risk level to status
   */
  private mapRiskLevelToStatus(riskLevel: string): 'safe' | 'warning' | 'danger' {
    if (!riskLevel) return 'safe';

    const level = riskLevel.toUpperCase();
    
    if (level === 'SAFE' || level === 'LOW_RISK') {
      return 'safe';
    }
    
    if (level === 'MEDIUM_RISK' || level === 'HIGH_RISK') {
      return 'warning';
    }
    
    if (level === 'SEVERE_RISK' || level === 'UNKNOWN_RISK') {
      return 'danger';
    }

    return 'warning';  // Default to warning for unknown
  }

  private flattenMenuItems(sections: { items: MenuItem[]; sectionName?: string }[]) {
    return (sections ?? []).flatMap((section) =>
      (section.items ?? []).map((item) => ({
        ...item,
        category: item.category ?? section.sectionName,
      })),
    );
  }
}
