import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { AgentOrchestratorService } from '@/ai-agents/orchestrator/agent-orchestrator.service';
import { VisualExtractionAgent } from '@/ai-agents/visual-extraction/visual-extraction.agent';
import { AllergenSafetyAgent } from '@/ai-agents/allergen-safety/allergen-safety.agent';
import { DietaryComplianceAgent } from '@/ai-agents/dietary-compliance/dietary-compliance.agent';
import { NutritionCoachAgent } from '@/ai-agents/nutrition-coach/nutrition-coach.agent';
import { DishUnderstandingAgent } from '@/ai-agents/dish-understanding/dish-understanding.agent';
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
  ) { }

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

  private flattenMenuItems(sections: { items: MenuItem[]; sectionName?: string }[]) {
    return (sections ?? []).flatMap((section) =>
      (section.items ?? []).map((item) => ({
        ...item,
        category: item.category ?? section.sectionName,
      })),
    );
  }
}
