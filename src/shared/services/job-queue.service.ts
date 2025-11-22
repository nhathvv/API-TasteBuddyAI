import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter } from 'events';

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
    };
  };
  result: any;
  error?: string;
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

  // Auto-cleanup jobs after 1 hour
  private readonly JOB_TTL = 60 * 60 * 1000; // 1 hour

  constructor() {
    // Cleanup old jobs every 10 minutes
    setInterval(() => this.cleanupOldJobs(), 10 * 60 * 1000);
  }

  /**
   * Create a new job
   *
   * @returns Job ID
   */
  createJob(): string {
    const jobId = this.generateJobId();
    const now = Date.now();

    const job: Job = {
      id: jobId,
      status: JobStatus.PENDING,
      currentStage: null,
      stages: {},
      result: null,
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
   */
  completeJob(jobId: string, result: any): void {
    const job = this.jobs.get(jobId);
    if (!job) {
      this.logger.warn(`Job not found: ${jobId}`);
      return;
    }

    job.status = JobStatus.COMPLETED;
    job.result = result;
    job.updatedAt = Date.now();

    this.jobs.set(jobId, job);

    // Emit completion event
    this.emit(jobId, {
      type: 'job_completed',
      result,
      timestamp: Date.now(),
    });

    this.logger.log(`Job completed: ${jobId}`);
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
