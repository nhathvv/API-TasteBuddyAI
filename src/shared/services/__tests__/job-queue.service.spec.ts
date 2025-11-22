import { Test, TestingModule } from '@nestjs/testing';
import { JobQueueService, JobStatus, JobStage } from '../job-queue.service';
import { JobMetadata } from '../job-queue.types';

describe('JobQueueService', () => {
  let service: JobQueueService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JobQueueService],
    }).compile();

    service = module.get<JobQueueService>(JobQueueService);
  });

  afterEach(() => {
    // Clear all jobs after each test
    jest.clearAllMocks();
  });

  describe('createJob', () => {
    it('should create a new job with PENDING status', () => {
      const jobId = service.createJob();

      expect(jobId).toBeDefined();
      expect(jobId).toMatch(/^job_\d+_[a-z0-9]+$/);

      const job = service.getJob(jobId);
      expect(job).toBeDefined();
      expect(job?.status).toBe(JobStatus.PENDING);
      expect(job?.currentStage).toBeNull();
      expect(job?.stages).toEqual({});
    });

    it('should generate unique job IDs', () => {
      const jobId1 = service.createJob();
      const jobId2 = service.createJob();

      expect(jobId1).not.toBe(jobId2);
    });

    it('should set createdAt and updatedAt timestamps', () => {
      const beforeCreate = Date.now();
      const jobId = service.createJob();
      const afterCreate = Date.now();

      const job = service.getJob(jobId);
      expect(job?.createdAt).toBeGreaterThanOrEqual(beforeCreate);
      expect(job?.createdAt).toBeLessThanOrEqual(afterCreate);
      expect(job?.updatedAt).toBe(job?.createdAt);
    });
  });

  describe('getJob', () => {
    it('should return job by ID', () => {
      const jobId = service.createJob();
      const job = service.getJob(jobId);

      expect(job).toBeDefined();
      expect(job?.id).toBe(jobId);
    });

    it('should return null for non-existent job', () => {
      const job = service.getJob('non-existent-job');
      expect(job).toBeNull();
    });
  });

  describe('updateStage', () => {
    it('should update stage to completed with data', () => {
      const jobId = service.createJob();
      const testData = { result: 'test' };

      service.updateStage(jobId, JobStage.VALIDATION, testData, 'completed');

      const job = service.getJob(jobId);
      expect(job?.status).toBe(JobStatus.PROCESSING);
      expect(job?.currentStage).toBe(JobStage.VALIDATION);
      expect(job?.stages[JobStage.VALIDATION]?.status).toBe('completed');
      expect(job?.stages[JobStage.VALIDATION]?.data).toEqual(testData);
    });

    it('should set startTime when status is processing', () => {
      const jobId = service.createJob();
      const beforeUpdate = Date.now();

      service.updateStage(jobId, JobStage.EXTRACTION, undefined, 'processing');

      const job = service.getJob(jobId);
      const stage = job?.stages[JobStage.EXTRACTION];
      expect(stage?.startTime).toBeDefined();
      expect(stage?.startTime).toBeGreaterThanOrEqual(beforeUpdate);
    });

    it('should calculate duration when stage completes', () => {
      const jobId = service.createJob();

      // Start processing
      service.updateStage(jobId, JobStage.EXTRACTION, undefined, 'processing');

      // Wait a bit
      const delay = 50;
      jest.advanceTimersByTime(delay);

      // Complete stage
      service.updateStage(jobId, JobStage.EXTRACTION, { data: 'test' }, 'completed');

      const job = service.getJob(jobId);
      const stage = job?.stages[JobStage.EXTRACTION];
      expect(stage?.duration).toBeDefined();
      expect(stage?.duration).toBeGreaterThan(0);
    });

    it('should change job status from PENDING to PROCESSING', () => {
      const jobId = service.createJob();
      expect(service.getJob(jobId)?.status).toBe(JobStatus.PENDING);

      service.updateStage(jobId, JobStage.VALIDATION, undefined, 'processing');

      expect(service.getJob(jobId)?.status).toBe(JobStatus.PROCESSING);
    });

    it('should emit stage_update event', (done) => {
      const jobId = service.createJob();
      const testData = { result: 'test' };

      service.on(jobId, (event) => {
        expect(event.type).toBe('stage_update');
        expect(event.stage).toBe(JobStage.VALIDATION);
        expect(event.status).toBe('completed');
        expect(event.data).toEqual(testData);
        done();
      });

      service.updateStage(jobId, JobStage.VALIDATION, testData, 'completed');
    });

    it('should handle non-existent job gracefully', () => {
      expect(() => {
        service.updateStage('non-existent', JobStage.VALIDATION, {}, 'completed');
      }).not.toThrow();
    });
  });

  describe('failStage', () => {
    it('should mark stage as failed with error message', () => {
      const jobId = service.createJob();
      const errorMessage = 'Validation failed';

      service.failStage(jobId, JobStage.VALIDATION, errorMessage);

      const job = service.getJob(jobId);
      const stage = job?.stages[JobStage.VALIDATION];
      expect(stage?.status).toBe('failed');
      expect(stage?.error).toBe(errorMessage);
      expect(stage?.endTime).toBeDefined();
    });

    it('should emit stage_failed event', (done) => {
      const jobId = service.createJob();
      const errorMessage = 'Test error';

      service.on(jobId, (event) => {
        expect(event.type).toBe('stage_failed');
        expect(event.stage).toBe(JobStage.VALIDATION);
        expect(event.error).toBe(errorMessage);
        done();
      });

      service.failStage(jobId, JobStage.VALIDATION, errorMessage);
    });

    it('should handle non-existent job gracefully', () => {
      expect(() => {
        service.failStage('non-existent', JobStage.VALIDATION, 'error');
      }).not.toThrow();
    });
  });

  describe('completeJob', () => {
    it('should mark job as completed with result', () => {
      const jobId = service.createJob();
      const result = { dishes: [], allergens: [] };

      service.completeJob(jobId, result);

      const job = service.getJob(jobId);
      expect(job?.status).toBe(JobStatus.COMPLETED);
      expect(job?.result).toEqual(result);
    });

    it('should emit job_completed event', (done) => {
      const jobId = service.createJob();
      const result = { test: 'data' };

      service.on(jobId, (event) => {
        if (event.type === 'job_completed') {
          expect(event.result).toEqual(result);
          expect(event.summary).toBeDefined();
          done();
        }
      });

      service.completeJob(jobId, result);
    });

    it('should include job summary in completion', () => {
      const jobId = service.createJob();
      service.updateStage(jobId, JobStage.VALIDATION, {}, 'completed');
      service.updateStage(jobId, JobStage.EXTRACTION, {}, 'completed');

      service.completeJob(jobId, {});

      const summary = service.getJobSummary(jobId);
      expect(summary).toBeDefined();
      expect(summary?.completedStages).toBe(2);
    });

    it('should handle metadata logging', () => {
      const jobId = service.createJob();
      const metadata = {
        dishes: [
          {
            name: 'Phở Bò',
            canonicalName: 'Pho Bo',
            ingredients: 'beef, noodles',
            price: 50000,
          },
        ],
        allergenSummary: {
          safeItems: 1,
          unsafeItems: 0,
          overallRisk: 'low' as const,
          details: [],
        },
        priceAnalysis: {
          averagePrice: 50000,
          minPrice: 50000,
          maxPrice: 50000,
          dishCount: 1,
        },
      };

      expect(() => {
        service.completeJob(jobId, {}, metadata);
      }).not.toThrow();
    });
  });

  describe('failJob', () => {
    it('should mark job as failed with error', () => {
      const jobId = service.createJob();
      const errorMessage = 'Job processing failed';

      service.failJob(jobId, errorMessage);

      const job = service.getJob(jobId);
      expect(job?.status).toBe(JobStatus.FAILED);
      expect(job?.error).toBe(errorMessage);
    });

    it('should emit job_failed event', (done) => {
      const jobId = service.createJob();
      const errorMessage = 'Test error';

      service.on(jobId, (event) => {
        expect(event.type).toBe('job_failed');
        expect(event.error).toBe(errorMessage);
        done();
      });

      service.failJob(jobId, errorMessage);
    });

    it('should handle non-existent job gracefully', () => {
      expect(() => {
        service.failJob('non-existent', 'error');
      }).not.toThrow();
    });
  });

  describe('getJobSummary', () => {
    it('should return null for non-existent job', () => {
      const summary = service.getJobSummary('non-existent');
      expect(summary).toBeNull();
    });

    it('should calculate summary correctly', () => {
      const jobId = service.createJob();

      service.updateStage(jobId, JobStage.VALIDATION, {}, 'completed');
      service.updateStage(jobId, JobStage.EXTRACTION, {}, 'completed');
      service.failStage(jobId, JobStage.DISH_UNDERSTANDING, 'error');

      const summary = service.getJobSummary(jobId);

      expect(summary).toBeDefined();
      expect(summary?.completedStages).toBe(2);
      expect(summary?.failedStages).toBe(1);
      expect(summary?.totalStages).toBe(Object.keys(JobStage).length);
    });

    it('should include stage details', () => {
      const jobId = service.createJob();
      service.updateStage(jobId, JobStage.VALIDATION, {}, 'completed');

      const summary = service.getJobSummary(jobId);
      const validationStage = summary?.stageDetails.find(
        (s) => s.name === JobStage.VALIDATION,
      );

      expect(validationStage).toBeDefined();
      expect(validationStage?.status).toBe('completed');
    });

    it('should calculate total duration', () => {
      const jobId = service.createJob();
      jest.advanceTimersByTime(1000);

      const summary = service.getJobSummary(jobId);
      expect(summary?.totalDuration).toBeGreaterThan(0);
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', () => {
      const jobId1 = service.createJob();
      const jobId2 = service.createJob();
      const jobId3 = service.createJob();

      service.updateStage(jobId1, JobStage.VALIDATION, {}, 'processing');
      service.completeJob(jobId2, {});
      service.failJob(jobId3, 'error');

      const stats = service.getStats();

      expect(stats.total).toBe(3);
      expect(stats.processing).toBe(1);
      expect(stats.completed).toBe(1);
      expect(stats.failed).toBe(1);
    });

    it('should return zero stats for empty queue', () => {
      const stats = service.getStats();

      expect(stats.total).toBe(0);
      expect(stats.pending).toBe(0);
      expect(stats.processing).toBe(0);
      expect(stats.completed).toBe(0);
      expect(stats.failed).toBe(0);
    });
  });

  describe('Event Subscription', () => {
    it('should allow subscribing to job events', (done) => {
      const jobId = service.createJob();
      let eventCount = 0;

      service.on(jobId, (event) => {
        eventCount++;
        if (eventCount === 2) {
          expect(eventCount).toBe(2);
          done();
        }
      });

      service.updateStage(jobId, JobStage.VALIDATION, {}, 'processing');
      service.updateStage(jobId, JobStage.VALIDATION, {}, 'completed');
    });

    it('should allow unsubscribing from job events', () => {
      const jobId = service.createJob();
      let eventCount = 0;

      const callback = () => {
        eventCount++;
      };

      service.on(jobId, callback);
      service.updateStage(jobId, JobStage.VALIDATION, {}, 'processing');

      service.off(jobId, callback);
      service.updateStage(jobId, JobStage.EXTRACTION, {}, 'processing');

      expect(eventCount).toBe(1);
    });
  });

  describe('Allergen Analysis Integration', () => {
    it('should handle complete allergen analysis workflow', () => {
      const jobId = service.createJob();

      // Stage 1: Validation
      service.updateStage(jobId, JobStage.VALIDATION, { valid: true }, 'completed');

      // Stage 2: Extraction
      service.updateStage(
        jobId,
        JobStage.EXTRACTION,
        { dishes: ['Phở Bò', 'Bún Chả'] },
        'completed',
      );

      // Stage 3: Allergen Analysis
      const allergenData = {
        dishes: [
          {
            name: 'Phở Bò',
            allergens: [
              {
                type: 'shellfish',
                source: 'fish sauce',
                likelihood: 'high',
                severity: 'moderate',
              },
            ],
            riskLevel: 'MODERATE_RISK',
          },
        ],
      };
      service.updateStage(jobId, JobStage.ALLERGEN_ANALYSIS, allergenData, 'completed');

      // Complete job
      const metadata: JobMetadata = {
        dishes: [
          {
            name: 'Phở Bò',
            canonicalName: 'Pho Bo',
            ingredients: 'beef, noodles, fish sauce',
            price: 50000,
          },
        ],
        allergenSummary: {
          safeItems: 0,
          unsafeItems: 1,
          overallRisk: 'moderate' as const,
          details: [
            {
              dishName: 'Phở Bò',
              riskLevel: 'MODERATE_RISK' as const,
              allergens: [
                {
                  type: 'shellfish',
                  source: 'fish sauce',
                  likelihood: 'high' as const,
                  severity: 'moderate' as const,
                },
              ],
            },
          ],
        },
      };

      service.completeJob(jobId, { success: true }, metadata);

      const job = service.getJob(jobId);
      expect(job?.status).toBe(JobStatus.COMPLETED);
      expect(job?.stages[JobStage.ALLERGEN_ANALYSIS]?.data).toEqual(allergenData);
    });
  });
});
