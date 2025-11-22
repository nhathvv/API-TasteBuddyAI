import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GeminiCoreService } from '@/shared/services/gemini-core.service';
import { VisualExtractionAgent } from './visual-extraction/visual-extraction.agent';
import { AllergenSafetyAgent } from './allergen-safety/allergen-safety.agent';

/**
 * AI Agents Module
 *
 * Central module for all AI agents in the TasteBuddyAI system.
 * Provides:
 * - Visual Extraction Agent (VEA) ✅
 * - Allergen Safety Agent (CSAA) ✅
 * - Nutrition Coach Agent (NCA) - Coming soon
 * - Dietary Compliance Agent (DCA) - Coming soon
 * - Food Recognition Agent (FRA) - Coming soon
 * - Recipe Rewriter Agent (RRA) - Coming soon
 *
 * All agents are exported for use in feature modules.
 */
@Module({
  imports: [ConfigModule],
  providers: [
    GeminiCoreService,
    VisualExtractionAgent,
    AllergenSafetyAgent,
    // Future agents will be added here
  ],
  exports: [
    GeminiCoreService,
    VisualExtractionAgent,
    AllergenSafetyAgent,
    // Future agents will be exported here
  ],
})
export class AIAgentsModule {}
