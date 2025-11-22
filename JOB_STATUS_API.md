# 📊 Job Status API - Enhanced Response

## 🎯 Overview

API endpoints để get job status với data chi tiết (món ăn, thành phần, dị ứng, giá).

---

## 📝 API Endpoints

### **1. GET /menu/job/:jobId/status**

Trả về job status với progress và stage details.

**Response:**
```json
{
  "jobId": "job_1763838581864_v3qlk4cyx",
  "status": "completed",
  "currentStage": "formatting",
  "createdAt": 1732310000000,
  "updatedAt": 1732310015234,
  
  "progress": {
    "totalStages": 8,
    "completedStages": 6,
    "failedStages": 0,
    "pendingStages": 2,
    "percentage": 75
  },
  
  "stages": [
    {
      "name": "validation",
      "status": "completed",
      "duration": 150
    },
    {
      "name": "extraction",
      "status": "completed",
      "duration": 5000
    },
    // ... other stages
  ],
  
  "result": {
    // Full result data (only if completed)
  },
  
  "metrics": {
    "totalDuration": 15234,
    "averageStageDuration": 2539
  }
}
```

---

### **2. GET /menu/job/:jobId/details**

Trả về chi tiết phân tích (dishes, allergens, prices).

**Response:**
```json
{
  "jobId": "job_1763838581864_v3qlk4cyx",
  "status": "completed",
  "completedAt": 1732310015234,
  
  "dishes": {
    "total": 4,
    "items": [
      {
        "name": "Phở Bò",
        "description": "Phở bò truyền thống",
        "price": 50000,
        "priceFormatted": "50.000₫",
        "category": "Món Nước"
      },
      {
        "name": "Bún Riêu",
        "description": "Bún riêu cua",
        "price": 45000,
        "priceFormatted": "45.000₫",
        "category": "Món Nước"
      }
      // ... other dishes
    ]
  },
  
  "allergens": {
    "summary": {
      "safeItems": 2,
      "warningItems": 0,
      "unsafeItems": 2,
      "overallRisk": "medium"
    },
    "details": [
      {
        "dishName": "Phở Bò",
        "riskLevel": "SAFE",
        "allergens": [],
        "reasoning": "...",
        "confidenceScore": 0.95
      },
      {
        "dishName": "Bún Riêu",
        "riskLevel": "HIGH_RISK",
        "allergens": [
          {
            "type": "shellfish",
            "source": "Riêu (crab/shrimp paste)",
            "likelihood": "definite",
            "severity": "severe"
          }
        ],
        "reasoning": "...",
        "confidenceScore": 0.95
      }
      // ... other dishes
    ]
  },
  
  "prices": {
    "average": 41250,
    "min": 30000,
    "max": 50000,
    "count": 4
  },
  
  "dietary": {
    "summary": {
      "compliantCount": 3,
      "nonCompliantCount": 1
    }
  },
  
  "metadata": {
    "language": "vi",
    "extractionQuality": "medium",
    "confidenceScore": 0.85
  }
}
```

---

## 🔧 Implementation Code

### **Add to menu.service.ts**

```typescript
/**
 * Get job status with enriched details
 */
getJobStatus(jobId: string) {
  const job = this.jobQueue.getJob(jobId);
  if (!job) {
    return null;
  }

  const summary = this.jobQueue.getJobSummary(jobId);

  return {
    jobId: job.id,
    status: job.status,
    currentStage: job.currentStage,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    
    progress: summary ? {
      totalStages: summary.totalStages,
      completedStages: summary.completedStages,
      failedStages: summary.failedStages,
      pendingStages: summary.pendingStages,
      percentage: Math.round((summary.completedStages / summary.totalStages) * 100),
    } : null,

    stages: summary ? summary.stageDetails : [],
    result: job.status === 'completed' ? job.result : null,
    error: job.error,

    metrics: summary ? {
      totalDuration: summary.totalDuration,
      averageStageDuration: summary.completedStages > 0 
        ? Math.round(summary.totalDuration / summary.completedStages)
        : 0,
    } : null,
  };
}

/**
 * Get detailed job analysis
 */
getJobDetails(jobId: string) {
  const job = this.jobQueue.getJob(jobId);
  if (!job || job.status !== 'completed') {
    return null;
  }

  const result = job.result;
  if (!result || !result.data) {
    return null;
  }

  // Extract dishes
  const dishes = result.data.extraction?.menuSections
    ?.flatMap((section: any) => section.items)
    ?.map((item: any) => ({
      name: item.name,
      description: item.description,
      price: item.price,
      priceFormatted: item.priceFormatted,
      category: item.category,
    })) || [];

  // Extract allergen analysis
  const allergenAnalysis = result.data.allergenAnalysis ? {
    summary: result.data.allergenAnalysis.summary,
    details: result.data.allergenAnalysis.analysis?.map((a: any) => ({
      dishName: a.dishName,
      riskLevel: a.riskLevel,
      allergens: a.identifiedAllergens?.map((allergen: any) => ({
        type: allergen.allergen,
        source: allergen.source,
        likelihood: allergen.likelihood,
        severity: allergen.severity,
      })) || [],
      reasoning: a.reasoning,
      confidenceScore: a.confidenceScore,
    })),
  } : null;

  // Calculate price statistics
  const prices = dishes.filter((d: any) => d.price > 0).map((d: any) => d.price);
  const priceStats = prices.length > 0 ? {
    average: Math.round(prices.reduce((sum: number, p: number) => sum + p, 0) / prices.length),
    min: Math.min(...prices),
    max: Math.max(...prices),
    count: prices.length,
  } : null;

  return {
    jobId: job.id,
    status: job.status,
    completedAt: job.updatedAt,
    
    dishes: {
      total: dishes.length,
      items: dishes,
    },

    allergens: allergenAnalysis,
    prices: priceStats,

    dietary: result.data.dietaryCompliance ? {
      summary: result.data.dietaryCompliance.summary,
    } : null,

    metadata: {
      language: result.language,
      extractionQuality: result.data.extraction?.metadata?.extractionQuality,
      confidenceScore: result.data.extraction?.metadata?.confidenceScore,
    },
  };
}
```

### **Add to menu.controller.ts**

```typescript
@Get('job/:jobId/status')
@ApiOperation({
  summary: 'Get Job Status',
  description: 'Get job progress, stages, and metrics'
})
async getJobStatus(@Param('jobId') jobId: string) {
  const status = this.menuService.getJobStatus(jobId);
  if (!status) {
    throw new NotFoundException(`Job not found: ${jobId}`);
  }
  return status;
}

@Get('job/:jobId/details')
@ApiOperation({
  summary: 'Get Job Details',
  description: 'Get detailed analysis: dishes, allergens, prices'
})
async getJobDetails(@Param('jobId') jobId: string) {
  const details = this.menuService.getJobDetails(jobId);
  if (!details) {
    throw new NotFoundException(`Job not found or not completed: ${jobId}`);
  }
  return details;
}
```

---

## 🚀 Usage Examples

### **1. Poll Job Status**

```javascript
// Client-side polling
async function pollJobStatus(jobId) {
  const interval = setInterval(async () => {
    const response = await fetch(`/menu/job/${jobId}/status`);
    const status = await response.json();
    
    console.log(`Progress: ${status.progress.percentage}%`);
    console.log(`Stage: ${status.currentStage}`);
    
    if (status.status === 'completed') {
      clearInterval(interval);
      // Get full details
      const details = await fetch(`/menu/job/${jobId}/details`);
      const data = await details.json();
      console.log('Analysis complete:', data);
    }
  }, 2000); // Poll every 2 seconds
}
```

### **2. Display Progress**

```javascript
function displayProgress(status) {
  const { progress, stages } = status;
  
  // Show progress bar
  const progressBar = document.getElementById('progress');
  progressBar.style.width = `${progress.percentage}%`;
  progressBar.textContent = `${progress.completedStages}/${progress.totalStages} stages`;
  
  // Show current stage
  const currentStage = stages.find(s => s.status === 'processing');
  if (currentStage) {
    document.getElementById('status').textContent = `Processing: ${currentStage.name}`;
  }
}
```

### **3. Display Results**

```javascript
function displayResults(details) {
  const { dishes, allergens, prices } = details;
  
  // Display dishes
  dishes.items.forEach(dish => {
    console.log(`${dish.name}: ${dish.priceFormatted}`);
  });
  
  // Display allergen warnings
  allergens.details.forEach(analysis => {
    if (analysis.riskLevel !== 'SAFE') {
      console.warn(`⚠️ ${analysis.dishName}: ${analysis.riskLevel}`);
      analysis.allergens.forEach(allergen => {
        console.log(`  - ${allergen.type}: ${allergen.source}`);
      });
    }
  });
  
  // Display price range
  console.log(`💰 Price range: ${prices.min}₫ - ${prices.max}₫`);
  console.log(`📊 Average: ${prices.average}₫`);
}
```

---

## 📊 Response Structure

### **Job Status Fields**

| Field | Type | Description |
|-------|------|-------------|
| `jobId` | string | Job ID |
| `status` | string | pending/processing/completed/failed |
| `currentStage` | string | Current stage name |
| `progress.percentage` | number | Progress 0-100% |
| `progress.completedStages` | number | Stages completed |
| `stages[]` | array | All stages with status & duration |
| `metrics.totalDuration` | number | Total time in ms |

### **Job Details Fields**

| Field | Type | Description |
|-------|------|-------------|
| `dishes.total` | number | Total dishes |
| `dishes.items[]` | array | Dish details with price |
| `allergens.summary` | object | Safe/unsafe counts |
| `allergens.details[]` | array | Per-dish allergen analysis |
| `prices.average` | number | Average price |
| `prices.min/max` | number | Price range |
| `metadata.language` | string | Output language |

---

## ✅ Benefits

### **Before:**
```json
{
  "jobId": "job_123"
}
```
❌ Phải poll nhiều lần để biết kết quả!

### **After:**
```json
{
  "jobId": "job_123",
  "status": "completed",
  "progress": { "percentage": 100 },
  "dishes": { "total": 4, "items": [...] },
  "allergens": { "summary": {...}, "details": [...] },
  "prices": { "average": 41250, "min": 30000, "max": 50000 }
}
```
✅ Có tất cả thông tin ngay!

---

## 🔗 Related Files

- `/src/modules/menu/menu.service.ts` - Implementation
- `/src/modules/menu/menu.controller.ts` - API endpoints
- `/src/shared/services/job-queue.service.ts` - Job queue
- `ENHANCED_JOB_SUMMARY.md` - Job summary format
