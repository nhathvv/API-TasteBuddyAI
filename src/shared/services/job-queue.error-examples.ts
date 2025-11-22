/**
 * Job Queue Error Handling Examples
 *
 * Examples covering error cases and validation failures
 * Updated: Nov 23, 2025
 */

import { Logger } from '@nestjs/common';
import { JobQueueService, JobStage } from './job-queue.service';
import { JobMetadata } from './job-queue.types';

const logger = new Logger('JobQueueErrorExamples');

/**
 * Example 1: Handle Zero Extraction Error
 *
 * When Visual Extraction returns 0 items, job should fail early
 * with clear error message
 */
export async function exampleHandleZeroExtraction(
  jobQueue: JobQueueService,
  imageData: string,
  mimeType: string,
) {
  const jobId = jobQueue.createJob();

  try {
    // Stage 1: Validation
    jobQueue.updateStage(jobId, JobStage.VALIDATION, null, 'processing');
    const isValid = await validateImage(imageData, mimeType);
    jobQueue.updateStage(jobId, JobStage.VALIDATION, { isValid }, 'completed');

    // Stage 2: Extraction
    jobQueue.updateStage(jobId, JobStage.EXTRACTION, null, 'processing');
    const extractionResult = await extractMenu(imageData);

    // ⚠️ Check for zero extraction
    if (!extractionResult || extractionResult.items.length === 0) {
      logger.error('═══════════════════════════════════════════');
      logger.error('❌ ZERO ITEMS EXTRACTED');
      logger.error('═══════════════════════════════════════════');
      logger.error('Visual Extraction Agent (Gemini Vision) returned 0 items');
      logger.error('Possible causes:');
      logger.error('  1. Image quality too low (blurry, dark, small text)');
      logger.error('  2. Image is food photo, not a menu');
      logger.error('  3. Gemini OCR failed to detect text');
      logger.error('  4. Handwritten or artistic menu');
      logger.error('Recommendations:');
      logger.error('  - Upload a clearer menu photo');
      logger.error('  - Ensure good lighting and focus');
      logger.error('  - Try a different image');
      logger.error('═══════════════════════════════════════════');

      jobQueue.failStage(
        jobId,
        JobStage.EXTRACTION,
        'ERR_ZERO_EXTRACTION: No menu items could be extracted from the image',
      );

      jobQueue.failJob(
        jobId,
        'ERR_ZERO_EXTRACTION: No menu items could be extracted from the image',
      );

      return { success: false, jobId, error: 'ERR_ZERO_EXTRACTION' };
    }

    jobQueue.updateStage(
      jobId,
      JobStage.EXTRACTION,
      { totalItems: extractionResult.items.length },
      'completed',
    );

    return { success: true, jobId };

  } catch (error) {
    logger.error(`Job ${jobId} failed:`, error);
    jobQueue.failJob(jobId, error.message);
    return { success: false, jobId, error: error.message };
  }
}

/**
 * Example 2: Handle Zero Enriched Dishes
 *
 * When Dish Understanding returns 0 enriched dishes,
 * log warning but continue with reduced accuracy
 */
export async function exampleHandleZeroEnrichedDishes(
  jobQueue: JobQueueService,
  menuItems: any[],
) {
  const jobId = jobQueue.createJob();

  try {
    // Extraction completed
    jobQueue.updateStage(
      jobId,
      JobStage.EXTRACTION,
      { totalItems: menuItems.length },
      'completed',
    );

    // Dish Understanding
    jobQueue.updateStage(jobId, JobStage.DISH_UNDERSTANDING, null, 'processing');
    const enrichedDishes = await enrichDishes(menuItems);

    // ⚠️ Check for zero enriched dishes
    if (enrichedDishes.length === 0) {
      logger.warn('═══════════════════════════════════════════');
      logger.warn('⚠️  ZERO ENRICHED DISHES');
      logger.warn('═══════════════════════════════════════════');
      logger.warn(`Dish Understanding Agent returned 0 dishes`);
      logger.warn(`Input dishes: ${menuItems.length}`);
      logger.warn('WARNING: Allergen/Dietary analysis will be less accurate');
      logger.warn('═══════════════════════════════════════════');
    }

    // Fix NaN in averageConfidence
    const avgConfidence = enrichedDishes.length > 0
      ? enrichedDishes.reduce((sum, d) => sum + (d.confidence || 0), 0) / enrichedDishes.length
      : 0;

    jobQueue.updateStage(
      jobId,
      JobStage.DISH_UNDERSTANDING,
      {
        totalDishes: enrichedDishes.length,
        averageConfidence: avgConfidence, // ✅ No NaN
      },
      'completed',
    );

    logger.log(`✅ Dish Understanding completed: ${enrichedDishes.length} dishes enriched`);

    return { success: true, jobId, enrichedDishes };

  } catch (error) {
    logger.error(`Job ${jobId} failed:`, error);
    jobQueue.failJob(jobId, error.message);
    return { success: false, jobId, error: error.message };
  }
}

/**
 * Example 3: Run Allergen Analysis Without Enriched Data
 *
 * When enrichedDishes is empty, allergen analysis runs
 * with reduced accuracy. Log clear warning.
 */
export async function exampleAllergenWithoutEnrichedData(
  jobQueue: JobQueueService,
  menuItems: any[],
  enrichedDishes: any[],
  userAllergens: any[],
) {
  const jobId = jobQueue.createJob();

  try {
    // Allergen Analysis
    jobQueue.updateStage(jobId, JobStage.ALLERGEN_ANALYSIS, null, 'processing');

    // ⚠️ Warn if running without enriched data
    if (enrichedDishes.length === 0 && menuItems.length > 0) {
      logger.warn('⚠️  Running Allergen Analysis WITHOUT enriched data');
      logger.warn('Analysis will rely on dish names only - less accurate');
    }

    const allergenResult = await analyzeAllergens({
      menuItems,
      enrichedItems: enrichedDishes,
      userAllergens,
    });

    logger.debug('Allergen analysis result:');
    logger.debug(JSON.stringify(allergenResult, null, 2));

    jobQueue.updateStage(
      jobId,
      JobStage.ALLERGEN_ANALYSIS,
      {
        safeItems: allergenResult.summary.safeItems,
        unsafeItems: allergenResult.summary.unsafeItems,
      },
      'completed',
    );

    return { success: true, jobId, allergenResult };

  } catch (error) {
    logger.error(`Allergen analysis failed:`, error);
    jobQueue.failStage(jobId, JobStage.ALLERGEN_ANALYSIS, error.message);
    return { success: false, jobId, error: error.message };
  }
}

/**
 * Example 4: Validate Job Metadata Before Completion
 *
 * Ensure job metadata is valid before completing
 */
export async function exampleValidateJobMetadata(
  jobQueue: JobQueueService,
  jobId: string,
  result: any,
  metadata: JobMetadata,
) {
  // ⚠️ Validate metadata before completion
  if (!metadata.dishes || metadata.dishes.length === 0) {
    logger.error('═══════════════════════════════════════════');
    logger.error('❌ JOB METADATA VALIDATION FAILED');
    logger.error('═══════════════════════════════════════════');
    logger.error('No dishes in job metadata');
    logger.error('Cannot complete job with empty data');
    logger.error('═══════════════════════════════════════════');

    jobQueue.failJob(
      jobId,
      'ERR_EMPTY_RESULT: No dishes extracted, job failed'
    );
    return { success: false, error: 'ERR_EMPTY_RESULT' };
  }

  // Proceed with validation
  const validation = jobQueue.validateAndCompleteJob(
    jobId,
    result,
    metadata,
    false,
  );

  if (!validation.success) {
    logger.error('Job validation failed:', validation.error);
    return { success: false, error: validation.error };
  }

  logger.log('✅ Job completed with valid metadata');
  return { success: true };
}

/**
 * Example 5: Complete Error Handling Flow
 *
 * Shows full flow with all error checks
 */
export async function exampleCompleteErrorHandling(
  jobQueue: JobQueueService,
  imageData: string,
  mimeType: string,
  userAllergens: any[],
) {
  const jobId = jobQueue.createJob();

  try {
    // 1. Validation
    logger.log(`🚀 Starting job ${jobId}`);
    jobQueue.updateStage(jobId, JobStage.VALIDATION, null, 'processing');
    const isValid = await validateImage(imageData, mimeType);

    if (!isValid) {
      throw new Error('ERR_INVALID_IMAGE: Image validation failed');
    }

    jobQueue.updateStage(jobId, JobStage.VALIDATION, { isValid }, 'completed');

    // 2. Extraction (with zero check)
    jobQueue.updateStage(jobId, JobStage.EXTRACTION, null, 'processing');
    const extractionResult = await extractMenu(imageData);

    if (!extractionResult || extractionResult.items.length === 0) {
      logger.error('❌ ZERO ITEMS EXTRACTED');
      throw new Error('ERR_ZERO_EXTRACTION: No menu items extracted');
    }

    jobQueue.updateStage(
      jobId,
      JobStage.EXTRACTION,
      { totalItems: extractionResult.items.length },
      'completed',
    );
    logger.log(`✅ Extracted ${extractionResult.items.length} items`);

    // 3. Dish Understanding (with zero enriched check)
    jobQueue.updateStage(jobId, JobStage.DISH_UNDERSTANDING, null, 'processing');
    const enrichedDishes = await enrichDishes(extractionResult.items);

    if (enrichedDishes.length === 0) {
      logger.warn('⚠️  ZERO ENRICHED DISHES');
      logger.warn(`Input: ${extractionResult.items.length}, Output: 0`);
      logger.warn('Continuing with reduced accuracy...');
    }

    const avgConfidence = enrichedDishes.length > 0
      ? enrichedDishes.reduce((sum, d) => sum + (d.confidence || 0), 0) / enrichedDishes.length
      : 0;

    jobQueue.updateStage(
      jobId,
      JobStage.DISH_UNDERSTANDING,
      {
        totalDishes: enrichedDishes.length,
        averageConfidence: avgConfidence,
      },
      'completed',
    );
    logger.log(`✅ Enriched ${enrichedDishes.length} dishes`);

    // 4. Allergen Analysis (with enriched data warning)
    if (userAllergens && userAllergens.length > 0) {
      jobQueue.updateStage(jobId, JobStage.ALLERGEN_ANALYSIS, null, 'processing');

      if (enrichedDishes.length === 0 && extractionResult.items.length > 0) {
        logger.warn('⚠️  Running Allergen Analysis WITHOUT enriched data');
      }

      const allergenResult = await analyzeAllergens({
        menuItems: extractionResult.items,
        enrichedItems: enrichedDishes,
        userAllergens,
      });

      jobQueue.updateStage(
        jobId,
        JobStage.ALLERGEN_ANALYSIS,
        {
          safeItems: allergenResult.summary.safeItems,
          unsafeItems: allergenResult.summary.unsafeItems,
        },
        'completed',
      );
      logger.log(`✅ Allergen analysis: ${allergenResult.summary.safeItems} safe, ${allergenResult.summary.unsafeItems} unsafe`);
    }

    // 5. Validate metadata before completion
    const metadata: JobMetadata = {
      dishes: enrichedDishes.map(d => ({
        name: d.name,
        canonicalName: d.canonicalName,
        ingredients: d.ingredients || 'N/A',
        price: 0,
      })),
      allergenSummary: userAllergens ? {
        safeItems: 0,
        unsafeItems: 0,
        overallRisk: 'low',
        details: [],
      } : undefined,
    };

    if (!metadata.dishes || metadata.dishes.length === 0) {
      logger.error('❌ JOB METADATA VALIDATION FAILED');
      throw new Error('ERR_EMPTY_RESULT: No dishes in metadata');
    }

    // 6. Complete job
    const validation = jobQueue.validateAndCompleteJob(
      jobId,
      { success: true, data: extractionResult },
      metadata,
      false,
    );

    if (!validation.success) {
      throw new Error(`Validation failed: ${validation.error}`);
    }

    logger.log('✅ Job completed successfully');
    return { success: true, jobId };

  } catch (error) {
    logger.error('❌ Job failed:', error.message);
    jobQueue.failJob(jobId, error.message);
    return { success: false, jobId, error: error.message };
  }
}

// Mock implementations
async function validateImage(imageData: string, mimeType: string): Promise<boolean> {
  return true;
}

async function extractMenu(imageData: string): Promise<any> {
  return { items: [] };
}

async function enrichDishes(menuItems: any[]): Promise<any[]> {
  return [];
}

async function analyzeAllergens(input: any): Promise<any> {
  return {
    summary: {
      safeItems: 0,
      unsafeItems: 0,
      overallRisk: 'low',
    },
  };
}
