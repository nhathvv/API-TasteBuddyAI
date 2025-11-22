import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GeminiCoreService } from '@/shared/services/gemini-core.service';
import { I18nService } from '@/shared/services/i18n.service';
import { PriceAnalysisService } from '@/shared/services/price-analysis.service';
import { JobQueueService } from '@/shared/services/job-queue.service';
import { VisualExtractionAgent } from './visual-extraction/visual-extraction.agent';
import { AllergenSafetyAgent } from './allergen-safety/allergen-safety.agent';
import { NutritionCoachAgent } from './nutrition-coach/nutrition-coach.agent';
import { DietaryComplianceAgent } from './dietary-compliance/dietary-compliance.agent';
import { DishUnderstandingAgent } from './dish-understanding/dish-understanding.agent';
import { DishRecognitionAgent } from './dish-recognition/dish-recognition.agent';
import { AgentOrchestratorService } from './orchestrator/agent-orchestrator.service';
import { FoodImageValidationModule } from './food-image-validation/food-image-validation.module';
import { CloudVisionAgent } from './cloud-vision/cloud-vision.agent';

/**
 * AI Agents Module
 *
 * Central module for all AI agents in the TasteBuddyAI system.
 * Provides:
 * - Visual Extraction Agent (VEA) ✅
 * - Dish Understanding Agent (DUIA) ✅
 * - Dish Recognition Agent (DRA) ✅
 * - Allergen Safety Agent (CSAA) ✅
 * - Nutrition Coach Agent (NCA) ✅
 * - Dietary Compliance Agent (DCA) ✅
 * - Food Image Validation (Gatekeeper) ✅
 * - Cloud Vision Agent (CVA) ✅ NEW
 *
 * All agents are exported for use in feature modules.
 */
@Module({
  imports: [ConfigModule, FoodImageValidationModule],
  providers: [
    GeminiCoreService,
    I18nService,
    PriceAnalysisService,
    JobQueueService,
    VisualExtractionAgent,
    DishUnderstandingAgent,
    DishRecognitionAgent,
    AllergenSafetyAgent,
    NutritionCoachAgent,
    DietaryComplianceAgent,
    AgentOrchestratorService,
    CloudVisionAgent,
  ],
  exports: [
    GeminiCoreService,
    I18nService,
    PriceAnalysisService,
    JobQueueService,
    VisualExtractionAgent,
    DishUnderstandingAgent,
    DishRecognitionAgent,
    AllergenSafetyAgent,
    NutritionCoachAgent,
    DietaryComplianceAgent,
    AgentOrchestratorService,
    FoodImageValidationModule,
    CloudVisionAgent,
  ],
})
export class AIAgentsModule { }
