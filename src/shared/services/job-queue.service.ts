import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter } from 'events';
import {
  JobMetadata,
  JobErrorType,
  JobError,
  StageConfig,
  JobConfig,
} from './job-queue.types';
import {
  validateJobMetadata,
  shouldRetryBasedOnValidation,
  formatValidationResult,
} from './job-queue.validators';

/**
 * Job status enum
 */
export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * Job stage enum for progressive updates
 */
export enum JobStage {
  VALIDATION = 'validation',
  EXTRACTION = 'extraction',
  DISH_UNDERSTANDING = 'dish_understanding',
  ALLERGEN_ANALYSIS = 'allergen_analysis',
  DIETARY_ANALYSIS = 'dietary_analysis',
  NUTRITION_ANALYSIS = 'nutrition_analysis',
  PRICE_ANALYSIS = 'price_analysis',
  FORMATTING = 'formatting',
}

/**
 * Job interface
 */
export interface Job {
  id: string;
  status: JobStatus;
  currentStage: JobStage | null;
  stages: {
    [key in JobStage]?: {
      status: 'pending' | 'processing' | 'completed' | 'failed';
      startTime?: number;
      endTime?: number;
      duration?: number;
      data?: any;
      error?: string;
      retryCount?: number;
    };
  };
  result: any;
  error?: JobError | string;
  config?: JobConfig;
  createdAt: number;
  updatedAt: number;
}

/**
 * JobQueueService
 *
 * Manages async job processing with progressive updates.
 * Supports Server-Sent Events (SSE) for real-time streaming.
 *
 * Usage:
 * 1. Create job: const jobId = jobQueue.createJob();
 * 2. Update stages: jobQueue.updateStage(jobId, JobStage.EXTRACTION, data);
 * 3. Listen to events: jobQueue.on(jobId, (update) => { ... });
 * 4. Complete job: jobQueue.completeJob(jobId, result);
 */
@Injectable()
export class JobQueueService {
  private readonly logger = new Logger(JobQueueService.name);
  private jobs: Map<string, Job> = new Map();
  private eventEmitters: Map<string, EventEmitter> = new Map();
  private stageConfigs: Map<string, StageConfig> = new Map();

  // Auto-cleanup jobs after 1 hour
  private readonly JOB_TTL = 60 * 60 * 1000; // 1 hour
  
  // Default retry configuration
  private readonly DEFAULT_MAX_RETRIES = 3;
  private readonly DEFAULT_RETRY_DELAY = 1000; // 1 second

  constructor() {
    // Cleanup old jobs every 10 minutes
    setInterval(() => this.cleanupOldJobs(), 10 * 60 * 1000);
  }

  /**
   * Create a new job
   *
   * @param config - Optional job configuration
   * @returns Job ID
   */
  createJob(config?: JobConfig): string {
    const jobId = this.generateJobId();
    const now = Date.now();

    const job: Job = {
      id: jobId,
      status: JobStatus.PENDING,
      currentStage: null,
      stages: {},
      result: null,
      config,
      createdAt: now,
      updatedAt: now,
    };

    this.jobs.set(jobId, job);
    this.eventEmitters.set(jobId, new EventEmitter());

    this.logger.log(`Job created: ${jobId}`);
    return jobId;
  }

  /**
   * Get job by ID
   *
   * @param jobId - Job ID
   * @returns Job or null
   */
  getJob(jobId: string): Job | null {
    return this.jobs.get(jobId) || null;
  }

  /**
   * Update job stage
   *
   * @param jobId - Job ID
   * @param stage - Stage name
   * @param data - Stage result data
   * @param status - Stage status
   */
  updateStage(
    jobId: string,
    stage: JobStage,
    data?: any,
    status: 'pending' | 'processing' | 'completed' | 'failed' = 'completed',
  ): void {
    const job = this.jobs.get(jobId);
    if (!job) {
      this.logger.warn(`Job not found: ${jobId}`);
      return;
    }

    const now = Date.now();

    // Initialize stage if not exists
    if (!job.stages[stage]) {
      job.stages[stage] = { status: 'pending' };
    }

    // Update stage
    const stageInfo = job.stages[stage];
    stageInfo.status = status;

    if (status === 'processing') {
      stageInfo.startTime = now;
    }

    if (status === 'completed' || status === 'failed') {
      stageInfo.endTime = now;
      if (stageInfo.startTime) {
        stageInfo.duration = now - stageInfo.startTime;
      }
      if (data) {
        stageInfo.data = data;
      }
    }

    job.currentStage = stage;
    job.updatedAt = now;

    if (job.status === JobStatus.PENDING) {
      job.status = JobStatus.PROCESSING;
    }

    this.jobs.set(jobId, job);

    // Emit event
    this.emit(jobId, {
      type: 'stage_update',
      stage,
      status,
      data,
      timestamp: now,
    });

    this.logger.log(`Job ${jobId} - Stage ${stage}: ${status}`);
  }

  /**
   * Mark stage as failed
   *
   * @param jobId - Job ID
   * @param stage - Stage name
   * @param error - Error message
   */
  failStage(jobId: string, stage: JobStage, error: string): void {
    const job = this.jobs.get(jobId);
    if (!job) return;

    if (!job.stages[stage]) {
      job.stages[stage] = { status: 'failed' };
    }

    job.stages[stage].status = 'failed';
    job.stages[stage].error = error;
    job.stages[stage].endTime = Date.now();

    this.emit(jobId, {
      type: 'stage_failed',
      stage,
      error,
      timestamp: Date.now(),
    });

    this.logger.error(`Job ${jobId} - Stage ${stage} failed: ${error}`);
  }

  /**
   * Complete job
   *
   * @param jobId - Job ID
   * @param result - Final result
   * @param metadata - Optional enriched metadata for detailed logging
   */
  completeJob(jobId: string, result: any, metadata?: JobMetadata): void {
    const job = this.jobs.get(jobId);
    if (!job) {
      this.logger.warn(`Job not found: ${jobId}`);
      return;
    }

    job.status = JobStatus.COMPLETED;
    job.result = result;
    job.updatedAt = Date.now();

    this.jobs.set(jobId, job);

    // Get job summary for logging
    const summary = this.getJobSummary(jobId);
    
    // 🔍 LOG: Job completion summary
    this.logger.log('═══════════════════════════════════════════');
    this.logger.log(`✅ JOB COMPLETED: ${jobId}`);
    this.logger.log('═══════════════════════════════════════════');
    if (summary) {
      this.logger.log(`⏱️  Total Duration: ${summary.totalDuration}ms`);
      this.logger.log(`📊 Stages: ${summary.completedStages}/${summary.totalStages} completed`);
      
      this.logger.log('\nStage Breakdown:');
      summary.stageDetails.forEach(stage => {
        const icon = stage.status === 'completed' ? '✅' : stage.status === 'failed' ? '❌' : '⏳';
        this.logger.log(`  ${icon} ${stage.name}: ${stage.status} (${stage.duration || 0}ms)`);
      });
      
      if (summary.failedStages > 0) {
        this.logger.warn(`⚠️  ${summary.failedStages} stage(s) failed`);
      }
    }

    // 🔍 LOG: Enriched metadata (dishes, allergens, prices)
    if (metadata) {
      this.logger.log('═══════════════════════════════════════════');
      this.logger.log('📋 DETAILED ANALYSIS RESULTS');
      this.logger.log('═══════════════════════════════════════════');
      
      // Dishes & Ingredients
      if (metadata.dishes && metadata.dishes.length > 0) {
        this.logger.log(`\n🍽️  Món ăn (${metadata.dishes.length} món):`);
        metadata.dishes.forEach((dish: any, idx: number) => {
          this.logger.log(`\n${idx + 1}. ${dish.name} ${dish.canonicalName !== dish.name ? `(${dish.canonicalName})` : ''}`);
          this.logger.log(`   📝 Thành phần: ${dish.ingredients}`);
          if (dish.price > 0) {
            this.logger.log(`   💰 Giá: ${dish.price.toLocaleString('vi-VN')}₫`);
          }
        });
      }

      // Allergen Summary
      if (metadata.allergenSummary) {
        this.logger.log(`\n🚨 Phân tích dị ứng:`);
        this.logger.log(`   ✅ An toàn: ${metadata.allergenSummary.safeItems} món`);
        this.logger.log(`   ⚠️  Không an toàn: ${metadata.allergenSummary.unsafeItems} món`);
        this.logger.log(`   📊 Mức độ rủi ro tổng thể: ${metadata.allergenSummary.overallRisk.toUpperCase()}`);
        
        // Details per dish
        if (metadata.allergenSummary.details && metadata.allergenSummary.details.length > 0) {
          this.logger.log(`\n   Chi tiết từng món:`);
          metadata.allergenSummary.details.forEach((detail: any) => {
            const riskIcon = detail.riskLevel === 'SAFE' ? '✅' : 
                           detail.riskLevel === 'HIGH_RISK' || detail.riskLevel === 'SEVERE_RISK' ? '🔴' : '🟡';
            this.logger.log(`   ${riskIcon} ${detail.dishName}: ${detail.riskLevel}`);
            
            if (detail.allergens && detail.allergens.length > 0) {
              detail.allergens.forEach((allergen: any) => {
                this.logger.log(`      - ${allergen.type}: ${allergen.source}`);
                this.logger.log(`        Khả năng: ${allergen.likelihood}, Mức độ: ${allergen.severity}`);
              });
            }
          });
        }
      }

      // Price Analysis
      if (metadata.priceAnalysis) {
        this.logger.log(`\n💰 Phân tích giá:`);
        this.logger.log(`   📊 Giá trung bình: ${metadata.priceAnalysis.averagePrice.toLocaleString('vi-VN')}₫`);
        this.logger.log(`   📉 Giá thấp nhất: ${metadata.priceAnalysis.minPrice.toLocaleString('vi-VN')}₫`);
        this.logger.log(`   📈 Giá cao nhất: ${metadata.priceAnalysis.maxPrice.toLocaleString('vi-VN')}₫`);
      }
    }
    
    this.logger.log('═══════════════════════════════════════════');

    // Emit completion event
    this.emit(jobId, {
      type: 'job_completed',
      result,
      summary,
      timestamp: Date.now(),
    });
  }

  /**
   * Validate and complete job with metadata validation
   *
   * @param jobId - Job ID
   * @param result - Final result
   * @param metadata - Job metadata to validate
   * @param autoRetryOnValidationError - Whether to automatically retry on validation errors
   * @returns Validation result
   */
  validateAndCompleteJob(
    jobId: string,
    result: any,
    metadata: JobMetadata,
    autoRetryOnValidationError: boolean = false,
  ): { success: boolean; validationResult?: any; error?: string } {
    const job = this.jobs.get(jobId);
    if (!job) {
      this.logger.warn(`Job not found: ${jobId}`);
      return { success: false, error: 'Job not found' };
    }

    // Validate metadata
    const validationResult = validateJobMetadata(metadata);

    // Log validation result
    this.logger.log('═══════════════════════════════════════════');
    this.logger.log(`🔍 VALIDATION RESULT FOR JOB: ${jobId}`);
    this.logger.log('═══════════════════════════════════════════');
    this.logger.log(formatValidationResult(validationResult));
    this.logger.log('═══════════════════════════════════════════');

    // Check if should retry based on validation
    if (!validationResult.isValid && autoRetryOnValidationError) {
      const shouldRetry = shouldRetryBasedOnValidation(validationResult);
      
      if (shouldRetry) {
        this.logger.warn(
          `Job ${jobId} has validation errors that require retry. Marking for retry...`
        );
        
        // Emit validation failed event
        this.emit(jobId, {
          type: 'validation_failed',
          validationResult,
          timestamp: Date.now(),
        });

        return {
          success: false,
          validationResult,
          error: 'Validation failed, retry required',
        };
      }
    }

    // Complete job even if there are warnings (non-critical issues)
    this.completeJob(jobId, result, metadata);

    return {
      success: true,
      validationResult,
    };
  }

  /**
   * Fail job
   *
   * @param jobId - Job ID
   * @param error - Error message
   */
  failJob(jobId: string, error: string): void {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = JobStatus.FAILED;
    job.error = error;
    job.updatedAt = Date.now();

    this.jobs.set(jobId, job);

    // Emit failure event
    this.emit(jobId, {
      type: 'job_failed',
      error,
      timestamp: Date.now(),
    });

    this.logger.error(`Job failed: ${jobId} - ${error}`);
  }

  /**
   * Subscribe to job events
   *
   * @param jobId - Job ID
   * @param callback - Event callback
   */
  on(jobId: string, callback: (event: any) => void): void {
    const emitter = this.eventEmitters.get(jobId);
    if (emitter) {
      emitter.on('update', callback);
    }
  }

  /**
   * Unsubscribe from job events
   *
   * @param jobId - Job ID
   * @param callback - Event callback
   */
  off(jobId: string, callback: (event: any) => void): void {
    const emitter = this.eventEmitters.get(jobId);
    if (emitter) {
      emitter.off('update', callback);
    }
  }

  /**
   * Emit event for job
   *
   * @param jobId - Job ID
   * @param event - Event data
   */
  private emit(jobId: string, event: any): void {
    const emitter = this.eventEmitters.get(jobId);
    if (emitter) {
      emitter.emit('update', event);
    }
  }

  /**
   * Generate unique job ID
   *
   * @returns Job ID
   */
  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Retry a failed stage
   *
   * @param jobId - Job ID
   * @param stage - Stage to retry
   * @param retryFn - Function to execute for retry
   * @returns Promise that resolves when retry succeeds or max retries reached
   */
  async retryStage(
    jobId: string,
    stage: JobStage,
    retryFn: () => Promise<any>,
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    const job = this.jobs.get(jobId);
    if (!job) {
      return {
        success: false,
        error: 'Job not found',
      };
    }

    // Get retry configuration
    const stageConfig = job.config?.stageConfigs?.[stage];
    const maxRetries = stageConfig?.maxRetries ?? this.DEFAULT_MAX_RETRIES;
    const retryDelay = stageConfig?.retryDelay ?? this.DEFAULT_RETRY_DELAY;

    // Initialize stage if not exists
    if (!job.stages[stage]) {
      job.stages[stage] = { status: 'pending', retryCount: 0 };
    }

    const stageInfo = job.stages[stage]!;
    const currentRetryCount = stageInfo.retryCount ?? 0;

    if (currentRetryCount >= maxRetries) {
      this.logger.error(
        `Job ${jobId} - Stage ${stage}: Max retries (${maxRetries}) exceeded`,
      );
      return {
        success: false,
        error: `Max retries (${maxRetries}) exceeded`,
      };
    }

    // Increment retry count
    stageInfo.retryCount = currentRetryCount + 1;
    this.logger.log(
      `Job ${jobId} - Stage ${stage}: Retry attempt ${stageInfo.retryCount}/${maxRetries}`,
    );

    // Wait before retry
    if (currentRetryCount > 0) {
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }

    try {
      // Execute retry function
      this.updateStage(jobId, stage, undefined, 'processing');
      const data = await retryFn();
      this.updateStage(jobId, stage, data, 'completed');

      return { success: true, data };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Job ${jobId} - Stage ${stage}: Retry ${stageInfo.retryCount} failed: ${errorMessage}`,
      );

      // If max retries reached, fail the stage
      if (stageInfo.retryCount >= maxRetries) {
        this.failStage(jobId, stage, `Failed after ${maxRetries} retries: ${errorMessage}`);
        return { success: false, error: errorMessage };
      }

      // Otherwise, retry again
      return this.retryStage(jobId, stage, retryFn);
    }
  }

  /**
   * Create a structured job error
   *
   * @param type - Error type
   * @param message - Error message
   * @param stage - Stage where error occurred
   * @param originalError - Original error object
   * @returns JobError object
   */
  createJobError(
    type: JobErrorType,
    message: string,
    stage?: JobStage,
    originalError?: Error,
  ): JobError {
    return {
      type,
      message,
      stage,
      originalError,
      context: {
        timestamp: Date.now(),
      },
    };
  }

  /**
   * Validate job exists and is in valid state
   *
   * @param jobId - Job ID
   * @param allowedStatuses - Allowed job statuses
   * @returns JobError if validation fails, null otherwise
   */
  validateJob(
    jobId: string,
    allowedStatuses?: JobStatus[],
  ): JobError | null {
    const job = this.jobs.get(jobId);

    if (!job) {
      return this.createJobError(
        JobErrorType.NOT_FOUND,
        `Job ${jobId} not found`,
      );
    }

    if (allowedStatuses && !allowedStatuses.includes(job.status)) {
      return this.createJobError(
        JobErrorType.INVALID_TRANSITION,
        `Job ${jobId} is in ${job.status} state, expected one of: ${allowedStatuses.join(', ')}`,
      );
    }

    return null;
  }

  /**
   * Set stage configuration
   *
   * @param stage - Stage name
   * @param config - Stage configuration
   */
  setStageConfig(stage: JobStage, config: StageConfig): void {
    this.stageConfigs.set(stage, config);
  }

  /**
   * Get stage configuration
   *
   * @param stage - Stage name
   * @returns Stage configuration or undefined
   */
  getStageConfig(stage: JobStage): StageConfig | undefined {
    return this.stageConfigs.get(stage);
  }

  /**
   * Cleanup old jobs
   */
  private cleanupOldJobs(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [jobId, job] of this.jobs.entries()) {
      if (now - job.createdAt > this.JOB_TTL) {
        this.jobs.delete(jobId);
        this.eventEmitters.delete(jobId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.log(`Cleaned up ${cleaned} old jobs`);
    }
  }

  /**
   * Get job summary with stage details
   *
   * @param jobId - Job ID
   * @returns Job summary or null
   */
  getJobSummary(jobId: string): {
    jobId: string;
    status: JobStatus;
    totalDuration: number;
    totalStages: number;
    completedStages: number;
    failedStages: number;
    pendingStages: number;
    stageDetails: Array<{
      name: string;
      status: string;
      duration: number | null;
      error?: string;
    }>;
  } | null {
    const job = this.jobs.get(jobId);
    if (!job) return null;

    const totalDuration = job.updatedAt - job.createdAt;
    let completedStages = 0;
    let failedStages = 0;
    let pendingStages = 0;

    const stageDetails = Object.values(JobStage).map(stageName => {
      const stage = job.stages[stageName];
      if (!stage) {
        pendingStages++;
        return {
          name: stageName,
          status: 'pending',
          duration: null,
        };
      }

      if (stage.status === 'completed') completedStages++;
      if (stage.status === 'failed') failedStages++;
      if (stage.status === 'pending') pendingStages++;

      return {
        name: stageName,
        status: stage.status,
        duration: stage.duration || null,
        error: stage.error,
      };
    });

    return {
      jobId: job.id,
      status: job.status,
      totalDuration,
      totalStages: Object.values(JobStage).length,
      completedStages,
      failedStages,
      pendingStages,
      stageDetails,
    };
  }

  /**
   * Get job statistics
   *
   * @returns Job stats
   */
  getStats(): {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  } {
    const stats = {
      total: this.jobs.size,
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
    };

    for (const job of this.jobs.values()) {
      stats[job.status]++;
    }

    return stats;
  }
}
