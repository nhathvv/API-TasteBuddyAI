# 📊 Job Queue System Summary

**Generated:** Nov 23, 2025 at 2:30am UTC+07:00

## 🎯 Overview

Hệ thống Job Queue cho phép xử lý menu scan async với real-time progress tracking qua Server-Sent Events (SSE).

---

## 📝 Job Stages (7 Stages)

| # | Stage | Enum | Mục đích | Agent |
|---|-------|------|----------|-------|
| 1 | **VALIDATION** | `validation` | Xác thực ảnh food/menu | FoodImageValidationService |
| 2 | **EXTRACTION** | `extraction` | Trích xuất menu items | VisualExtractionAgent |
| 3 | **DISH_UNDERSTANDING** | `dish_understanding` | Phân tích ingredients | DishUnderstandingAgent |
| 4 | **ALLERGEN_ANALYSIS** | `allergen_analysis` | Phân tích allergen | AllergenSafetyAgent |
| 5 | **DIETARY_ANALYSIS** | `dietary_analysis` | Kiểm tra dietary | DietaryComplianceAgent |
| 6 | **NUTRITION_ANALYSIS** | `nutrition_analysis` | Tư vấn dinh dưỡng | NutritionCoachAgent |
| 7 | **PRICE_ANALYSIS** | `price_analysis` | Phân tích giá & format | PriceAnalysisService |
| 8 | **FORMATTING** | `formatting` | Format response cuối | - |

---

## 🔄 Job Workflow

### **1. Create Job**
```typescript
const jobId = jobQueue.createJob();
// Returns: "job_1732310000000_abc123xyz"
```

### **2. Update Stages**
```typescript
// Start stage
jobQueue.updateStage(jobId, JobStage.EXTRACTION, null, 'processing');

// Complete stage with data
jobQueue.updateStage(jobId, JobStage.EXTRACTION, {
  totalItems: 4,
  extractionMethod: 'visual-extraction'
}, 'completed');

// Fail stage
jobQueue.failStage(jobId, JobStage.EXTRACTION, 'Timeout error');
```

### **3. Complete Job**
```typescript
jobQueue.completeJob(jobId, finalResult);
// Auto logs job summary
```

---

## 📊 Job Interface

```typescript
interface Job {
  id: string;                    // "job_1732310000000_abc123xyz"
  status: JobStatus;             // pending | processing | completed | failed
  currentStage: JobStage | null; // Current stage being processed
  stages: {
    [key in JobStage]?: {
      status: 'pending' | 'processing' | 'completed' | 'failed';
      startTime?: number;
      endTime?: number;
      duration?: number;
      data?: any;              // Stage-specific data
      error?: string;          // Error message if failed
    };
  };
  result: any;                   // Final result
  error?: string;                // Job-level error
  createdAt: number;             // Timestamp
  updatedAt: number;             // Timestamp
}
```

---

## ✅ Job Completion Log

Khi job complete, JobQueueService tự động log summary chi tiết:

```
═══════════════════════════════════════════
✅ JOB COMPLETED: job_1732310000000_abc123xyz
═══════════════════════════════════════════
⏱️  Total Duration: 15234ms
📊 Stages: 6/8 completed

Stage Breakdown:
  ✅ validation: completed (150ms)
  ✅ extraction: completed (5000ms)
  ✅ dish_understanding: completed (3500ms)
  ✅ allergen_analysis: completed (4000ms)
  ⏳ dietary_analysis: pending (0ms)
  ⏳ nutrition_analysis: pending (0ms)
  ✅ price_analysis: completed (584ms)
  ✅ formatting: completed (2000ms)
═══════════════════════════════════════════
```

---

## 🔍 Job Summary Method

### **getJobSummary(jobId: string)**

Trả về summary chi tiết của job:

```typescript
const summary = jobQueue.getJobSummary(jobId);

// Returns:
{
  jobId: "job_1732310000000_abc123xyz",
  status: "completed",
  totalDuration: 15234,        // ms
  totalStages: 8,              // Total stages defined
  completedStages: 6,          // Stages completed
  failedStages: 0,             // Stages failed
  pendingStages: 2,            // Stages not run
  stageDetails: [
    {
      name: "validation",
      status: "completed",
      duration: 150,
      error: undefined
    },
    {
      name: "extraction",
      status: "completed",
      duration: 5000,
      error: undefined
    },
    // ... other stages
  ]
}
```

---

## 📊 Job Statistics

### **getStats()**

Trả về thống kê tất cả jobs:

```typescript
const stats = jobQueue.getStats();

// Returns:
{
  total: 15,
  pending: 2,
  processing: 3,
  completed: 8,
  failed: 2
}
```

---

## 🎯 Stage Data Examples

Mỗi stage có thể lưu data cụ thể:

### **VALIDATION**
```typescript
{
  isValid: true,
  duration: 150
}
```

### **EXTRACTION**
```typescript
{
  totalItems: 4,
  extractionMethod: "visual-extraction"
}
```

### **DISH_UNDERSTANDING**
```typescript
{
  totalDishes: 4,
  averageConfidence: 0.85
}
```

### **ALLERGEN_ANALYSIS**
```typescript
{
  safeItems: 2,
  unsafeItems: 2
}
```

### **DIETARY_ANALYSIS**
```typescript
{
  compliantCount: 3,
  nonCompliantCount: 1
}
```

---

## 🔔 Real-time Updates (SSE)

### **Subscribe to Job Events**

```typescript
// Backend
jobQueue.on(jobId, (update) => {
  console.log('Job update:', update);
  // Send via SSE to client
});

// Event types:
{
  type: 'stage_update',
  stage: 'extraction',
  status: 'completed',
  data: { totalItems: 4 },
  timestamp: 1732310000000
}

{
  type: 'stage_failed',
  stage: 'allergen_analysis',
  error: 'Timeout',
  timestamp: 1732310000000
}

{
  type: 'job_completed',
  result: {...},
  summary: {...},
  timestamp: 1732310000000
}

{
  type: 'job_failed',
  error: 'Network error',
  timestamp: 1732310000000
}
```

---

## 🚀 Usage Examples

### **Example 1: scanMenuAsync (Full Pipeline)**

```typescript
async scanMenuAsync(dto: ScanMenuDto) {
  const jobId = this.jobQueue.createJob();
  
  // Stage 1: Validation
  this.jobQueue.updateStage(jobId, JobStage.VALIDATION, null, 'processing');
  const valid = await this.validate(dto);
  this.jobQueue.updateStage(jobId, JobStage.VALIDATION, { isValid: true }, 'completed');
  
  // Stage 2: Extraction
  this.jobQueue.updateStage(jobId, JobStage.EXTRACTION, null, 'processing');
  const items = await this.extract(dto);
  this.jobQueue.updateStage(jobId, JobStage.EXTRACTION, { totalItems: items.length }, 'completed');
  
  // ... other stages
  
  // Complete
  const result = this.formatResponse(...);
  this.jobQueue.completeJob(jobId, result);
  
  return { jobId };
}
```

### **Example 2: Check Job Status**

```typescript
// Client polls this endpoint
async getJobStatus(jobId: string) {
  const job = this.jobQueue.getJob(jobId);
  if (!job) {
    throw new NotFoundException('Job not found');
  }
  
  const summary = this.jobQueue.getJobSummary(jobId);
  
  return {
    status: job.status,
    currentStage: job.currentStage,
    progress: summary.completedStages / summary.totalStages * 100,
    stages: summary.stageDetails,
    result: job.status === 'completed' ? job.result : null,
    error: job.error
  };
}
```

---

## ⏱️ Stage Durations (Typical)

| Stage | Typical Duration | Notes |
|-------|-----------------|-------|
| VALIDATION | 100-300ms | Fast, API call |
| EXTRACTION | 5-10s | Vision + OCR |
| DISH_UNDERSTANDING | 3-5s per dish | Cached after first |
| ALLERGEN_ANALYSIS | 4-8s | 4 dishes |
| DIETARY_ANALYSIS | 5-10s | Complex reasoning |
| NUTRITION_ANALYSIS | 8-12s | Personalized |
| PRICE_ANALYSIS | 100-500ms | Fast calculation |
| FORMATTING | 50-200ms | Data transformation |
| **Total** | **15-45s** | Depends on stages run |

---

## 🐛 Debugging

### **Check Job Logs**
```bash
# All job completions
grep "✅ JOB COMPLETED" logs/app.log

# Stage breakdowns
grep "Stage Breakdown:" logs/app.log -A 10

# Failed stages
grep "⚠️" logs/app.log
```

### **Check Specific Job**
```bash
# Find all logs for a job
grep "job_1732310000000_abc123xyz" logs/app.log

# Check stage updates
grep "Job job_1732310000000_abc123xyz - Stage" logs/app.log
```

### **Monitor Real-time**
```bash
# Watch job completions
tail -f logs/app.log | grep "JOB COMPLETED" -A 15

# Watch all job events
tail -f logs/app.log | grep "Job job_"
```

---

## 📈 Performance Optimization

### **1. Stage Skip Logic**
```typescript
// Skip allergen if no allergens provided
if (!dto.userAllergens || dto.userAllergens.length === 0) {
  this.logger.log('Skipping allergen analysis - no allergens');
  // Stage not added to job
}
```

### **2. Parallel Stages**
```typescript
// Run allergen & dietary in parallel
const [allergenResult, dietaryResult] = await Promise.all([
  this.allergenAgent.execute(...),
  this.dietaryAgent.execute(...)
]);
```

### **3. Caching**
```typescript
// DishUnderstanding uses cache (24h TTL)
// Popular dishes return instantly
```

---

## 🔒 Auto-cleanup

Jobs are automatically cleaned up after **1 hour** (TTL = 60 minutes).

```typescript
private readonly JOB_TTL = 60 * 60 * 1000; // 1 hour

// Cleanup runs every 10 minutes
setInterval(() => this.cleanupOldJobs(), 10 * 60 * 1000);
```

---

## 📝 Summary

### **Job Lifecycle:**
```
CREATE → STAGES (1-8) → COMPLETE/FAIL → AUTO-CLEANUP
   ↓         ↓              ↓               ↓
 [LOG]    [LOG]          [LOG]           [1h TTL]
```

### **Key Features:**
- ✅ 8 defined stages
- ✅ Real-time progress tracking
- ✅ Detailed logging on completion
- ✅ Stage-specific data storage
- ✅ Error tracking per stage
- ✅ Auto-cleanup (1h TTL)
- ✅ SSE support for live updates
- ✅ Job statistics

### **Files:**
- `/src/shared/services/job-queue.service.ts` - Core implementation
- `/src/modules/menu/menu.service.ts` - Usage in scanMenuAsync
- `/src/modules/menu/menu.controller.ts` - HTTP endpoints

---

## 🎯 Quick Reference

```typescript
// Create
const jobId = jobQueue.createJob();

// Update
jobQueue.updateStage(jobId, JobStage.EXTRACTION, data, 'completed');

// Fail
jobQueue.failStage(jobId, JobStage.EXTRACTION, 'Error');

// Complete
jobQueue.completeJob(jobId, result);  // Auto-logs summary

// Get
const job = jobQueue.getJob(jobId);
const summary = jobQueue.getJobSummary(jobId);
const stats = jobQueue.getStats();

// Subscribe
jobQueue.on(jobId, (event) => { /* handle */ });
```
