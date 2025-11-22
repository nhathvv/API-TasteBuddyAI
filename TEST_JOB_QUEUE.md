# 🧪 Testing Job Queue Service

## 📋 Test Files

1. **`job-queue.service.spec.ts`** - Service tests
2. **`job-queue.validators.spec.ts`** - Validator tests

## 🚀 Run Tests

### Chạy tất cả tests
```bash
npm test
```

### Chạy tests cho job queue
```bash
npm test -- job-queue
```

### Chạy tests cụ thể
```bash
# Service tests
npm test -- job-queue.service.spec

# Validator tests
npm test -- job-queue.validators.spec
```

### Chạy với coverage
```bash
npm test -- --coverage job-queue
```

### Watch mode
```bash
npm test -- --watch job-queue
```

## ✅ Test Coverage

### JobQueueService Tests (50+ tests)

#### Basic Operations
- ✅ Create job
- ✅ Get job
- ✅ Update stage
- ✅ Complete job
- ✅ Fail job

#### Retry Mechanism
- ✅ Retry failed stage
- ✅ Max retries exceeded
- ✅ Retry delay
- ✅ Retry with custom config

#### Validation
- ✅ Validate and complete job
- ✅ Auto-retry on validation error
- ✅ Handle validation warnings

#### Error Handling
- ✅ Create job error
- ✅ Validate job state
- ✅ Handle non-existent job

#### Events
- ✅ Subscribe to events
- ✅ Unsubscribe from events
- ✅ Stage update events
- ✅ Validation failed events

#### Statistics
- ✅ Get job summary
- ✅ Get job stats
- ✅ Calculate stage duration

### Validator Tests (20+ tests)

#### Dish Validation
- ✅ Valid dish
- ✅ Empty name
- ✅ Negative price
- ✅ Zero price warning
- ✅ Empty ingredients warning
- ✅ Unrealistic price warning

#### Allergen Validation
- ✅ Valid summary
- ✅ Negative counts
- ✅ Count mismatch
- ✅ SAFE dish with allergens
- ✅ Unsafe dish without allergens

#### Price Validation
- ✅ Valid analysis
- ✅ Negative prices
- ✅ Min > Max
- ✅ Average outside range
- ✅ Zero dish count
- ✅ Large price range

#### Metadata Validation
- ✅ Complete valid metadata
- ✅ Aggregate errors
- ✅ Cross-validate counts

#### Utility Functions
- ✅ Should retry based on validation
- ✅ Format validation result

## 📊 Expected Results

### All Tests Should Pass
```
PASS  src/shared/services/__tests__/job-queue.service.spec.ts
PASS  src/shared/services/__tests__/job-queue.validators.spec.ts

Test Suites: 2 passed, 2 total
Tests:       70+ passed, 70+ total
```

### Coverage Goals
- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

## 🐛 Troubleshooting

### Test không chạy
```bash
# Kiểm tra Jest config
cat jest.config.js

# Đảm bảo test files có đúng pattern
# Mặc định: *.spec.ts
```

### Import errors
```bash
# Kiểm tra tsconfig paths
cat tsconfig.json

# Build lại nếu cần
npm run build
```

### Timeout errors
```bash
# Tăng timeout trong jest.config.js
testTimeout: 30000
```

## 📝 Writing New Tests

### Template cho Service Test
```typescript
describe('NewFeature', () => {
  let service: JobQueueService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [JobQueueService],
    }).compile();
    service = module.get<JobQueueService>(JobQueueService);
  });

  it('should do something', () => {
    // Arrange
    const jobId = service.createJob();
    
    // Act
    const result = service.someMethod(jobId);
    
    // Assert
    expect(result).toBeDefined();
  });
});
```

### Template cho Validator Test
```typescript
describe('validateSomething', () => {
  it('should pass for valid input', () => {
    const input = { /* valid data */ };
    const result = validateSomething(input);
    
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should fail for invalid input', () => {
    const input = { /* invalid data */ };
    const result = validateSomething(input);
    
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
```

## 🎯 Test Checklist

Trước khi commit:
- [ ] Tất cả tests pass
- [ ] Coverage > 80%
- [ ] Không có test bị skip
- [ ] Không có console.log trong tests
- [ ] Test descriptions rõ ràng
- [ ] Edge cases được cover

## 📚 Resources

- [Jest Documentation](https://jestjs.io/)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Testing Best Practices](https://testingjavascript.com/)
