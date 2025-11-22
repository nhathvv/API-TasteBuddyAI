/**
 * Job Queue Usage Examples
 * 
 * Ví dụ cách sử dụng JobQueueService với retry mechanism và validation
 */

import { JobQueueService, JobStage } from './job-queue.service';
import { JobMetadata } from './job-queue.types';

/**
 * Example 1: Xử lý job với retry khi stage thất bại
 */
export async function exampleRetryFailedStage(
  jobQueue: JobQueueService,
  jobId: string,
) {
  // Giả sử stage ALLERGEN_ANALYSIS thất bại
  // Sử dụng retryStage để thử lại
  
  const result = await jobQueue.retryStage(
    jobId,
    JobStage.ALLERGEN_ANALYSIS,
    async () => {
      // Logic phân tích allergen
      // Ví dụ: gọi AI service
      const allergenData = await analyzeAllergensWithAI();
      return allergenData;
    },
  );

  if (result.success) {
    console.log('✅ Retry thành công:', result.data);
  } else {
    console.error('❌ Retry thất bại sau nhiều lần thử:', result.error);
  }
}

/**
 * Example 2: Tạo job với cấu hình retry tùy chỉnh
 */
export function exampleCreateJobWithRetryConfig(
  jobQueue: JobQueueService,
): string {
  const jobId = jobQueue.createJob({
    timeout: 300000, // 5 phút
    enableDetailedLogging: true,
    stageConfigs: {
      [JobStage.ALLERGEN_ANALYSIS]: {
        maxRetries: 5, // Thử tối đa 5 lần
        retryDelay: 2000, // Đợi 2 giây giữa các lần retry
        timeout: 60000, // Timeout 1 phút cho stage này
        required: true, // Stage bắt buộc phải thành công
      },
      [JobStage.EXTRACTION]: {
        maxRetries: 3,
        retryDelay: 1000,
        timeout: 30000,
        required: true,
      },
      [JobStage.PRICE_ANALYSIS]: {
        maxRetries: 2,
        retryDelay: 500,
        required: false, // Stage không bắt buộc
      },
    },
  });

  console.log(`✅ Job created with custom retry config: ${jobId}`);
  return jobId;
}

/**
 * Example 3: Validate metadata trước khi complete job
 */
export function exampleValidateAndComplete(
  jobQueue: JobQueueService,
  jobId: string,
  result: any,
  metadata: JobMetadata,
) {
  // Sử dụng validateAndCompleteJob thay vì completeJob
  const validationResult = jobQueue.validateAndCompleteJob(
    jobId,
    result,
    metadata,
    true, // autoRetryOnValidationError = true
  );

  if (validationResult.success) {
    console.log('✅ Job completed with valid data');
    
    // Kiểm tra warnings
    if (validationResult.validationResult?.warnings.length > 0) {
      console.warn('⚠️  Có warnings:', validationResult.validationResult.warnings);
    }
  } else {
    console.error('❌ Validation failed:', validationResult.error);
    console.error('Errors:', validationResult.validationResult?.errors);
    
    // Có thể retry toàn bộ job hoặc chỉ retry stage cụ thể
  }
}

/**
 * Example 4: Xử lý job hoàn chỉnh với error handling và retry
 */
export async function exampleCompleteJobProcessing(
  jobQueue: JobQueueService,
  imageUrl: string,
  userAllergens: string[],
) {
  // 1. Tạo job với config
  const jobId = jobQueue.createJob({
    stageConfigs: {
      [JobStage.ALLERGEN_ANALYSIS]: {
        maxRetries: 3,
        retryDelay: 2000,
      },
    },
  });

  try {
    // 2. Stage: Validation
    jobQueue.updateStage(jobId, JobStage.VALIDATION, undefined, 'processing');
    const inputValidation = await validateInput(imageUrl);
    jobQueue.updateStage(jobId, JobStage.VALIDATION, inputValidation, 'completed');

    // 3. Stage: Extraction (với retry nếu thất bại)
    const extractionResult = await jobQueue.retryStage(
      jobId,
      JobStage.EXTRACTION,
      async () => {
        return await extractMenuFromImage(imageUrl);
      },
    );

    if (!extractionResult.success) {
      throw new Error(`Extraction failed: ${extractionResult.error}`);
    }

    // 4. Stage: Allergen Analysis (với retry)
    const allergenResult = await jobQueue.retryStage(
      jobId,
      JobStage.ALLERGEN_ANALYSIS,
      async () => {
        return await analyzeAllergens(
          extractionResult.data.dishes,
          userAllergens,
        );
      },
    );

    if (!allergenResult.success) {
      throw new Error(`Allergen analysis failed: ${allergenResult.error}`);
    }

    // 5. Các stage khác...
    jobQueue.updateStage(jobId, JobStage.PRICE_ANALYSIS, { /* data */ }, 'completed');
    jobQueue.updateStage(jobId, JobStage.FORMATTING, { /* data */ }, 'completed');

    // 6. Complete job với validation
    const metadata: JobMetadata = {
      dishes: extractionResult.data.dishes,
      allergenSummary: allergenResult.data.summary,
      priceAnalysis: {
        averagePrice: 50000,
        minPrice: 20000,
        maxPrice: 100000,
        dishCount: extractionResult.data.dishes.length,
      },
    };

    const finalValidation = jobQueue.validateAndCompleteJob(
      jobId,
      { success: true, data: extractionResult.data },
      metadata,
      false, // Không auto-retry vì đã xử lý retry ở từng stage
    );

    if (!finalValidation.success) {
      console.error('❌ Final validation failed:', finalValidation.error);
      jobQueue.failJob(jobId, 'Validation failed after processing');
    }

    return { jobId, success: true };

  } catch (error) {
    console.error('❌ Job processing failed:', error);
    jobQueue.failJob(jobId, error.message);
    return { jobId, success: false, error: error.message };
  }
}

/**
 * Example 5: Xử lý kết quả không chính xác bằng cách retry với prompt cải tiến
 */
export async function exampleRetryWithImprovedPrompt(
  jobQueue: JobQueueService,
  jobId: string,
  previousResult: any,
  validationErrors: string[],
) {
  console.log('🔄 Retrying with improved prompt based on validation errors...');

  // Tạo prompt cải tiến dựa trên lỗi validation
  const improvedPrompt = buildImprovedPrompt(validationErrors);

  const result = await jobQueue.retryStage(
    jobId,
    JobStage.ALLERGEN_ANALYSIS,
    async () => {
      // Gọi AI với prompt cải tiến
      return await analyzeAllergensWithImprovedPrompt(
        previousResult.dishes,
        improvedPrompt,
      );
    },
  );

  return result;
}

/**
 * Example 6: Monitor job progress với validation
 */
export function exampleMonitorJobWithValidation(
  jobQueue: JobQueueService,
  jobId: string,
) {
  jobQueue.on(jobId, (event) => {
    console.log(`📡 Event: ${event.type}`);

    switch (event.type) {
      case 'stage_update':
        console.log(`  Stage ${event.stage}: ${event.status}`);
        break;

      case 'stage_failed':
        console.error(`  ❌ Stage ${event.stage} failed: ${event.error}`);
        // Có thể trigger retry tự động ở đây
        break;

      case 'validation_failed':
        console.warn('  ⚠️  Validation failed:', event.validationResult);
        // Xử lý validation failure
        break;

      case 'job_completed':
        console.log('  ✅ Job completed successfully');
        console.log('  Summary:', event.summary);
        break;

      case 'job_failed':
        console.error('  ❌ Job failed:', event.error);
        break;
    }
  });
}

// Helper functions (mock implementations)
async function analyzeAllergensWithAI(): Promise<any> {
  // Mock implementation
  return { allergens: [] };
}

async function validateInput(imageUrl: string): Promise<any> {
  return { valid: true };
}

async function extractMenuFromImage(imageUrl: string): Promise<any> {
  return { dishes: [] };
}

async function analyzeAllergens(dishes: any[], userAllergens: string[]): Promise<any> {
  return { summary: { safeItems: 0, unsafeItems: 0, overallRisk: 'low' } };
}

function buildImprovedPrompt(validationErrors: string[]): string {
  return `Please analyze again with focus on: ${validationErrors.join(', ')}`;
}

async function analyzeAllergensWithImprovedPrompt(
  dishes: any[],
  prompt: string,
): Promise<any> {
  return { summary: { safeItems: 0, unsafeItems: 0, overallRisk: 'low' } };
}
