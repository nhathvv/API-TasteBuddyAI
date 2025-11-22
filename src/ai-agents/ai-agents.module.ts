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

/**
 * AI Agents Module
 *
 * Central module for all AI agents in the TasteBuddyAI system.
 * Provides:
 * - Visual Extraction Agent (VEA) ✅ - Gemini Flash for OCR & menu extraction
 * - Dish Understanding Agent (DUIA) ✅ - Gemini Pro for ingredient analysis
 * - Dish Recognition Agent (DRA) ✅ - Gemini Pro for dish identification
 * - Allergen Safety Agent (CSAA) ✅ - Gemini Pro for allergen detection
 * - Nutrition Coach Agent (NCA) ✅ - Gemini Pro for nutrition recommendations
 * - Dietary Compliance Agent (DCA) ✅ - Gemini Pro for dietary checks
 * - Food Image Validation (Gatekeeper) ✅ - Gemini Flash for image validation
 *
 * All agents use Gemini API (Flash for speed, Pro for reasoning).
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
  ],
})
export class AIAgentsModule { }
