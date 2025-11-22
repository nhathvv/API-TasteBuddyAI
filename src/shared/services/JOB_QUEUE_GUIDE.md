# 📋 Job Queue Service - Hướng Dẫn Xử Lý Job Có Kết Quả Chưa Chính Xác

## 🎯 Mục Đích

Hướng dẫn này giúp bạn xử lý các job có kết quả chưa chính xác bằng cách sử dụng:
- ✅ **Validation** - Kiểm tra chất lượng dữ liệu
- 🔄 **Retry Mechanism** - Thử lại khi thất bại
- 📊 **Detailed Logging** - Theo dõi chi tiết quá trình

---

## 📚 Tổng Quan

### Các Vấn Đề Thường Gặp

1. **Dữ liệu thiếu hoặc không đầy đủ**
   - Món ăn không có tên
   - Giá bằng 0 hoặc âm
   - Thành phần rỗng

2. **Dữ liệu không nhất quán**
   - Số lượng món trong allergen summary khác với số món thực tế
   - Risk level không khớp với số allergens
   - Giá trung bình nằm ngoài khoảng min-max

3. **AI trả về kết quả sai**
   - Phân tích allergen không chính xác
   - Nhận diện món ăn sai
   - Giá cả không hợp lý

---

## 🔧 Giải Pháp

### 1. Validation Trước Khi Complete Job

#### Sử dụng `validateAndCompleteJob()`

```typescript
import { JobQueueService } from './job-queue.service';
import { JobMetadata } from './job-queue.types';

// Thay vì dùng completeJob()
jobQueue.completeJob(jobId, result, metadata);

// Sử dụng validateAndCompleteJob()
const validationResult = jobQueue.validateAndCompleteJob(
  jobId,
  result,
  metadata,
  true, // autoRetryOnValidationError
);

if (!validationResult.success) {
  console.error('❌ Validation failed:', validationResult.error);
  // Xử lý retry hoặc thông báo lỗi
}
```

#### Kết Quả Validation

```typescript
{
  success: boolean,
  validationResult: {
    isValid: boolean,
    errors: string[],    // Lỗi nghiêm trọng
    warnings: string[]   // Cảnh báo không nghiêm trọng
  },
  error?: string
}
```

---

### 2. Retry Mechanism

#### A. Retry Một Stage Cụ Thể

```typescript
const result = await jobQueue.retryStage(
  jobId,
  JobStage.ALLERGEN_ANALYSIS,
  async () => {
    // Logic xử lý
    return await analyzeAllergens(dishes, userAllergens);
  }
);

if (result.success) {
  console.log('✅ Retry thành công');
} else {
  console.error('❌ Retry thất bại:', result.error);
}
```

#### B. Cấu Hình Retry Cho Job

```typescript
const jobId = jobQueue.createJob({
  stageConfigs: {
    [JobStage.ALLERGEN_ANALYSIS]: {
      maxRetries: 5,        // Thử tối đa 5 lần
      retryDelay: 2000,     // Đợi 2 giây giữa các lần
      timeout: 60000,       // Timeout 1 phút
      required: true        // Stage bắt buộc
    },
    [JobStage.EXTRACTION]: {
      maxRetries: 3,
      retryDelay: 1000,
      required: true
    }
  }
});
```

---

### 3. Xử Lý Kết Quả Không Chính Xác

#### Workflow Đầy Đủ

```typescript
async function processMenuWithRetry(
  jobQueue: JobQueueService,
  imageUrl: string,
  userAllergens: string[]
) {
  const jobId = jobQueue.createJob({
    stageConfigs: {
      [JobStage.ALLERGEN_ANALYSIS]: {
        maxRetries: 3,
        retryDelay: 2000,
      }
    }
  });

  try {
    // 1. Extraction với retry
    const extractionResult = await jobQueue.retryStage(
      jobId,
      JobStage.EXTRACTION,
      async () => await extractMenu(imageUrl)
    );

    if (!extractionResult.success) {
      throw new Error('Extraction failed');
    }

    // 2. Allergen Analysis với retry
    const allergenResult = await jobQueue.retryStage(
      jobId,
      JobStage.ALLERGEN_ANALYSIS,
      async () => await analyzeAllergens(
        extractionResult.data.dishes,
        userAllergens
      )
    );

    // 3. Validate và complete
    const metadata: JobMetadata = {
      dishes: extractionResult.data.dishes,
      allergenSummary: allergenResult.data.summary,
      priceAnalysis: {
        averagePrice: 50000,
        minPrice: 20000,
        maxPrice: 100000,
        dishCount: extractionResult.data.dishes.length,
      }
    };

    const validation = jobQueue.validateAndCompleteJob(
      jobId,
      { success: true },
      metadata,
      false // Đã xử lý retry ở từng stage
    );

    if (!validation.success) {
      // Xử lý validation failure
      console.error('Validation errors:', validation.validationResult?.errors);
      
      // Option 1: Retry với prompt cải tiến
      await retryWithImprovedPrompt(jobId, validation.validationResult);
      
      // Option 2: Fail job và thông báo
      jobQueue.failJob(jobId, 'Validation failed after retries');
    }

    return { success: true, jobId };

  } catch (error) {
    jobQueue.failJob(jobId, error.message);
    return { success: false, error: error.message };
  }
}
```

---

### 4. Retry Với Prompt Cải Tiến

Khi validation phát hiện lỗi, bạn có thể retry với prompt được cải tiến dựa trên lỗi:

```typescript
async function retryWithImprovedPrompt(
  jobQueue: JobQueueService,
  jobId: string,
  validationResult: any
) {
  // Phân tích lỗi validation
  const errors = validationResult.errors;
  
  // Tạo prompt cải tiến
  let improvedPrompt = 'Please analyze again with focus on:\n';
  
  if (errors.some(e => e.includes('price'))) {
    improvedPrompt += '- Ensure all prices are positive and realistic\n';
  }
  
  if (errors.some(e => e.includes('allergen'))) {
    improvedPrompt += '- Double-check allergen identification\n';
    improvedPrompt += '- Verify risk level matches allergen count\n';
  }
  
  if (errors.some(e => e.includes('ingredients'))) {
    improvedPrompt += '- List all ingredients clearly\n';
  }

  // Retry với prompt mới
  const result = await jobQueue.retryStage(
    jobId,
    JobStage.ALLERGEN_ANALYSIS,
    async () => {
      return await analyzeWithImprovedPrompt(improvedPrompt);
    }
  );

  return result;
}
```

---

## 📊 Validation Rules

### Dish Validation

✅ **Required:**
- `name` không rỗng
- `canonicalName` không rỗng
- `price >= 0`

⚠️ **Warnings:**
- `ingredients` rỗng
- `price = 0`
- `price` ngoài khoảng hợp lý (1,000 - 10,000,000 VND)

### Allergen Summary Validation

✅ **Required:**
- `safeItems >= 0`
- `unsafeItems >= 0`
- Số món trong `details` = `safeItems + unsafeItems`
- Risk level phù hợp với số allergens

⚠️ **Warnings:**
- Không có món nào được phân tích
- Overall risk không khớp với unsafe items
- Món SAFE nhưng có allergens
- Món unsafe nhưng không có allergens

### Price Analysis Validation

✅ **Required:**
- Tất cả giá >= 0
- `minPrice <= averagePrice <= maxPrice`
- `dishCount >= 0`

⚠️ **Warnings:**
- `dishCount = 0`
- Khoảng giá quá lớn (> 5,000,000 VND)
- Average price = 0 nhưng có dishes

---

## 🔍 Monitoring & Debugging

### 1. Theo Dõi Job Events

```typescript
jobQueue.on(jobId, (event) => {
  switch (event.type) {
    case 'stage_update':
      console.log(`Stage ${event.stage}: ${event.status}`);
      break;
      
    case 'stage_failed':
      console.error(`Stage ${event.stage} failed: ${event.error}`);
      // Trigger retry
      break;
      
    case 'validation_failed':
      console.warn('Validation failed:', event.validationResult);
      // Xử lý validation failure
      break;
      
    case 'job_completed':
      console.log('Job completed:', event.summary);
      break;
  }
});
```

### 2. Kiểm Tra Job Summary

```typescript
const summary = jobQueue.getJobSummary(jobId);

console.log(`Total duration: ${summary.totalDuration}ms`);
console.log(`Completed stages: ${summary.completedStages}/${summary.totalStages}`);
console.log(`Failed stages: ${summary.failedStages}`);

summary.stageDetails.forEach(stage => {
  console.log(`${stage.name}: ${stage.status} (${stage.duration}ms)`);
  if (stage.error) {
    console.error(`  Error: ${stage.error}`);
  }
});
```

### 3. Detailed Logging

Khi tạo job, bật detailed logging:

```typescript
const jobId = jobQueue.createJob({
  enableDetailedLogging: true,
  // ... other configs
});
```

---

## 🎯 Best Practices

### 1. Luôn Validate Trước Khi Complete

```typescript
// ❌ BAD
jobQueue.completeJob(jobId, result, metadata);

// ✅ GOOD
const validation = jobQueue.validateAndCompleteJob(
  jobId, result, metadata, true
);
```

### 2. Cấu Hình Retry Hợp Lý

```typescript
// ❌ BAD - Quá nhiều retries
maxRetries: 100,
retryDelay: 100

// ✅ GOOD - Cân bằng giữa reliability và performance
maxRetries: 3-5,
retryDelay: 1000-2000
```

### 3. Xử Lý Errors Gracefully

```typescript
try {
  const result = await jobQueue.retryStage(jobId, stage, fn);
  
  if (!result.success) {
    // Log error
    logger.error('Stage failed:', result.error);
    
    // Notify user
    await notifyUser(jobId, 'Processing failed');
    
    // Fail job
    jobQueue.failJob(jobId, result.error);
  }
} catch (error) {
  // Handle unexpected errors
  logger.error('Unexpected error:', error);
  jobQueue.failJob(jobId, error.message);
}
```

### 4. Monitor Performance

```typescript
// Track retry counts
const job = jobQueue.getJob(jobId);
const retryCount = job?.stages[stage]?.retryCount || 0;

if (retryCount > 2) {
  logger.warn(`Stage ${stage} required ${retryCount} retries`);
  // Consider adjusting AI prompt or parameters
}
```

---

## 📝 Checklist Khi Job Có Kết Quả Sai

- [ ] Kiểm tra validation errors trong logs
- [ ] Xem stage nào thất bại nhiều nhất
- [ ] Kiểm tra retry count của từng stage
- [ ] Review AI prompt có phù hợp không
- [ ] Kiểm tra input data (image quality, user allergens)
- [ ] Xem warnings có gợi ý vấn đề gì không
- [ ] Test với data tương tự để reproduce
- [ ] Cân nhắc tăng maxRetries cho stage quan trọng
- [ ] Cải thiện prompt dựa trên validation errors
- [ ] Thêm logging chi tiết hơn nếu cần

---

## 🚀 Quick Start

```typescript
import { JobQueueService } from './job-queue.service';

// 1. Inject service
constructor(private jobQueue: JobQueueService) {}

// 2. Tạo job với retry config
const jobId = this.jobQueue.createJob({
  stageConfigs: {
    [JobStage.ALLERGEN_ANALYSIS]: {
      maxRetries: 3,
      retryDelay: 2000,
    }
  }
});

// 3. Process với retry
const result = await this.jobQueue.retryStage(
  jobId,
  JobStage.ALLERGEN_ANALYSIS,
  async () => await this.analyzeAllergens()
);

// 4. Validate và complete
const validation = this.jobQueue.validateAndCompleteJob(
  jobId,
  result.data,
  metadata,
  true
);

// 5. Handle result
if (!validation.success) {
  console.error('Errors:', validation.validationResult?.errors);
}
```

---

## 📞 Support

Nếu gặp vấn đề:
1. Kiểm tra logs chi tiết
2. Review validation errors
3. Xem examples trong `job-queue.examples.ts`
4. Tham khảo tests trong `job-queue.service.spec.ts`

---

**Last Updated:** 2025-11-23  
**Version:** 1.0.0
