# 🧪 Test Script - Data Flow Verification

**Purpose:** Verify các fixes đã áp dụng cho data flow issues

---

## 📋 Test Cases

### **Test 1: Normal Flow - Good Image** ✅

**Objective:** Verify toàn bộ pipeline hoạt động với ảnh tốt

**Setup:**
```bash
# Prepare test image (clear menu photo)
# Resolution: > 1024px
# Format: JPEG/PNG
# Content: Vietnamese menu with clear text
```

**Test Command:**
```bash
curl -X POST http://localhost:3000/menu/upload/scan-async \
  -H "Content-Type: multipart/form-data" \
  -F "image=@test_images/clear_menu.jpg" \
  -F "language=vi" \
  -F "userAllergens=[{\"type\":\"shellfish\",\"severity\":\"severe\"}]"
```

**Expected Response:**
```json
{
  "jobId": "job_1732310000000_abc123xyz"
}
```

**Expected Logs:**
```
[LOG] 🚀 Async scan started: job_1732310000000_abc123xyz
[LOG] ✅ Validation completed (200ms)
[LOG] ✅ Visual Extraction: 4 items extracted
[LOG] ✅ Dish Understanding completed: 4 dishes enriched
[LOG] ✅ Allergen Analysis: 2 safe, 2 unsafe
[LOG] ✅ JOB COMPLETED
```

**Verify:**
- [ ] Job completes successfully
- [ ] No "ZERO ITEMS EXTRACTED" error
- [ ] No "ZERO ENRICHED DISHES" warning
- [ ] No NaN values in response
- [ ] enrichedDishes.length > 0
- [ ] allergenAnalysis has data

---

### **Test 2: Zero Extraction - Blurry Image** ❌

**Objective:** Verify error handling khi extraction fails

**Setup:**
```bash
# Prepare blurry/low quality image
# Or use food photo instead of menu
```

**Test Command:**
```bash
curl -X POST http://localhost:3000/menu/upload/scan-async \
  -F "image=@test_images/blurry_menu.jpg" \
  -F "language=vi"
```

**Expected Logs:**
```
[ERROR] ═══════════════════════════════════════════
[ERROR] ❌ ZERO ITEMS EXTRACTED
[ERROR] ═══════════════════════════════════════════
[ERROR] Both Cloud Vision and Visual Extraction returned 0 items
[ERROR] Possible causes:
[ERROR]   1. Image quality too low (blurry, dark, small text)
[ERROR]   2. Image is food photo, not a menu
[ERROR]   3. Gemini OCR failed to detect text
[ERROR]   4. Handwritten or artistic menu
[ERROR] Recommendations:
[ERROR]   - Upload a clearer menu photo
[ERROR]   - Ensure good lighting and focus
[ERROR]   - Try a different image
[ERROR] ═══════════════════════════════════════════
[ERROR] Job job_xxx failed: ERR_ZERO_EXTRACTION
```

**Verify:**
- [ ] Job fails with clear error
- [ ] Error message includes "ERR_ZERO_EXTRACTION"
- [ ] Recommendations are logged
- [ ] Job status = 'failed'
- [ ] No downstream agents run (waste of resources)

---

### **Test 3: Dish Understanding Fails** ⚠️

**Objective:** Verify warning khi enrichment fails nhưng extraction OK

**Mock Setup:**
```typescript
// Temporarily mock DishUnderstandingAgent to return empty
// In menu.service.ts, add test mode:
const dishResult = TEST_MODE
  ? { dishes: [] }  // Force empty
  : await this.dishUnderstandingAgent.execute(...);
```

**Expected Logs:**
```
[LOG] ✅ Visual Extraction: 4 items extracted
[WARN] ═══════════════════════════════════════════
[WARN] ⚠️  ZERO ENRICHED DISHES
[WARN] ═══════════════════════════════════════════
[WARN] Dish Understanding Agent returned 0 dishes
[WARN] Input dishes: 4
[WARN] WARNING: Allergen/Dietary analysis will be less accurate
[WARN] ═══════════════════════════════════════════
[WARN] ⚠️  Running Allergen Analysis WITHOUT enriched data
[WARN] Analysis will rely on dish names only - less accurate
[LOG] ✅ JOB COMPLETED (with warnings)
```

**Verify:**
- [ ] Warning is logged when enrichedDishes = 0
- [ ] Warning before allergen analysis
- [ ] Job still completes (not failed)
- [ ] averageConfidence = 0 (not NaN)
- [ ] Job stage data is valid

---

### **Test 4: Multiple Allergens** 🚨

**Objective:** Verify allergen analysis với nhiều allergens

**Test Command:**
```bash
curl -X POST http://localhost:3000/menu/upload/scan-async \
  -F "image=@test_images/clear_menu.jpg" \
  -F "language=vi" \
  -F "userAllergens=[
    {\"type\":\"shellfish\",\"severity\":\"severe\"},
    {\"type\":\"peanut\",\"severity\":\"moderate\"},
    {\"type\":\"gluten\",\"severity\":\"mild\"}
  ]"
```

**Expected Logs:**
```
[LOG] User allergens: ["shellfish","peanut","gluten"]
[LOG] ✅ Allergen Analysis: X safe, Y unsafe
[LOG] Detailed Results:
[LOG] 1. Phở Bò
[LOG]    ⚠️  Risk: LOW_RISK
[LOG] 2. Bún Riêu
[LOG]    ⚠️  Risk: SEVERE_RISK
[LOG]    🚨 Allergens Found:
[LOG]       - shellfish: Riêu paste (definite, severe)
```

**Verify:**
- [ ] All allergens are checked
- [ ] Risk levels are appropriate
- [ ] Allergen details are logged
- [ ] Summary counts match

---

### **Test 5: No Allergens Provided**

**Objective:** Verify allergen stage is skipped khi không có allergens

**Test Command:**
```bash
curl -X POST http://localhost:3000/menu/upload/scan-async \
  -F "image=@test_images/clear_menu.jpg" \
  -F "language=vi"
  # No userAllergens parameter
```

**Expected Logs:**
```
[LOG] ⚠️  Skipping AllergenSafetyAgent (no allergens provided)
```

**Verify:**
- [ ] Allergen stage is not run
- [ ] No allergen analysis in response
- [ ] Job still completes successfully
- [ ] Processing time is faster

---

## 🔍 Automated Test Script

Create: `scripts/test-data-flow.sh`

```bash
#!/bin/bash

echo "🧪 Starting Data Flow Tests..."
echo "======================================"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Base URL
BASE_URL="http://localhost:3000"

# Test 1: Good Image
echo -e "\n${YELLOW}Test 1: Normal Flow - Good Image${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/menu/upload/scan-async" \
  -F "image=@test_images/clear_menu.jpg" \
  -F "language=vi" \
  -F "userAllergens=[{\"type\":\"shellfish\",\"severity\":\"severe\"}]")

JOB_ID=$(echo $RESPONSE | jq -r '.jobId')

if [ ! -z "$JOB_ID" ] && [ "$JOB_ID" != "null" ]; then
  echo -e "${GREEN}✅ PASSED: Job created with ID $JOB_ID${NC}"
  ((PASSED++))

  # Wait for completion
  echo "Waiting 30s for job completion..."
  sleep 30

  # Check job status
  STATUS_RESPONSE=$(curl -s "$BASE_URL/menu/job-status/$JOB_ID")
  STATUS=$(echo $STATUS_RESPONSE | jq -r '.status')

  if [ "$STATUS" == "completed" ]; then
    echo -e "${GREEN}✅ PASSED: Job completed successfully${NC}"
    ((PASSED++))
  else
    echo -e "${RED}❌ FAILED: Job status is $STATUS${NC}"
    ((FAILED++))
  fi
else
  echo -e "${RED}❌ FAILED: No job ID returned${NC}"
  ((FAILED++))
fi

# Test 2: Blurry Image
echo -e "\n${YELLOW}Test 2: Zero Extraction - Blurry Image${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/menu/upload/scan-async" \
  -F "image=@test_images/blurry_menu.jpg" \
  -F "language=vi")

JOB_ID=$(echo $RESPONSE | jq -r '.jobId')

if [ ! -z "$JOB_ID" ] && [ "$JOB_ID" != "null" ]; then
  sleep 15

  STATUS_RESPONSE=$(curl -s "$BASE_URL/menu/job-status/$JOB_ID")
  STATUS=$(echo $STATUS_RESPONSE | jq -r '.status')
  ERROR=$(echo $STATUS_RESPONSE | jq -r '.error')

  if [ "$STATUS" == "failed" ] && [[ "$ERROR" == *"ERR_ZERO_EXTRACTION"* ]]; then
    echo -e "${GREEN}✅ PASSED: Job failed with correct error${NC}"
    ((PASSED++))
  else
    echo -e "${RED}❌ FAILED: Job status=$STATUS, error=$ERROR${NC}"
    ((FAILED++))
  fi
else
  echo -e "${RED}❌ FAILED: No job ID returned${NC}"
  ((FAILED++))
fi

# Test 3: No Allergens
echo -e "\n${YELLOW}Test 3: No Allergens Provided${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/menu/upload/scan-async" \
  -F "image=@test_images/clear_menu.jpg" \
  -F "language=vi")
  # No allergens

JOB_ID=$(echo $RESPONSE | jq -r '.jobId')

if [ ! -z "$JOB_ID" ] && [ "$JOB_ID" != "null" ]; then
  sleep 30

  STATUS_RESPONSE=$(curl -s "$BASE_URL/menu/job-status/$JOB_ID")
  HAS_ALLERGEN=$(echo $STATUS_RESPONSE | jq -r '.result.data.allergenAnalysis')

  if [ "$HAS_ALLERGEN" == "null" ]; then
    echo -e "${GREEN}✅ PASSED: Allergen analysis skipped${NC}"
    ((PASSED++))
  else
    echo -e "${RED}❌ FAILED: Allergen analysis should be null${NC}"
    ((FAILED++))
  fi
else
  echo -e "${RED}❌ FAILED: No job ID returned${NC}"
  ((FAILED++))
fi

# Summary
echo -e "\n======================================"
echo -e "${GREEN}✅ PASSED: $PASSED${NC}"
echo -e "${RED}❌ FAILED: $FAILED${NC}"
echo "======================================"

# Exit code
if [ $FAILED -gt 0 ]; then
  exit 1
else
  exit 0
fi
```

**Usage:**
```bash
chmod +x scripts/test-data-flow.sh
./scripts/test-data-flow.sh
```

---

## 📊 Log Verification Checklist

After running tests, check logs:

### **✅ Good Patterns (Should Exist):**
```bash
# 1. Structured logging
grep "═══════════════════════════════════════════" logs/app.log

# 2. Success messages
grep "✅" logs/app.log

# 3. Stage completions
grep "Dish Understanding completed:" logs/app.log

# 4. Job completions
grep "JOB COMPLETED" logs/app.log
```

### **❌ Bad Patterns (Should NOT Exist):**
```bash
# 1. console.log (should be replaced)
grep "console\.log" src/modules/menu/menu.service.ts
# Expected: No matches

# 2. NaN values
grep "NaN" logs/app.log
# Expected: No matches

# 3. Uncaught errors
grep "Unhandled" logs/app.log
# Expected: No matches
```

### **⚠️ Expected Warnings:**
```bash
# These should appear in certain test cases
grep "ZERO ENRICHED DISHES" logs/app.log
grep "Running Allergen Analysis WITHOUT enriched data" logs/app.log
grep "ZERO ITEMS EXTRACTED" logs/app.log
```

---

## 🎯 Performance Benchmarks

Track these metrics:

```bash
# Average job duration
grep "Total Duration:" logs/app.log | awk '{sum+=$4; count++} END {print "Average: " sum/count "ms"}'

# Extraction success rate
TOTAL=$(grep "Visual Extraction" logs/app.log | wc -l)
SUCCESS=$(grep "Visual Extraction.*items extracted" logs/app.log | grep -v "0 items" | wc -l)
echo "Extraction success rate: $((SUCCESS * 100 / TOTAL))%"

# Enrichment success rate
TOTAL=$(grep "Dish Understanding" logs/app.log | wc -l)
SUCCESS=$(grep "dishes enriched" logs/app.log | grep -v "0 dishes" | wc -l)
echo "Enrichment success rate: $((SUCCESS * 100 / TOTAL))%"
```

---

## 🐛 Debug Commands

If tests fail:

```bash
# 1. Check recent errors
grep "ERROR" logs/app.log | tail -20

# 2. Check specific job
JOB_ID="job_xxx"
grep "$JOB_ID" logs/app.log

# 3. Check stage failures
grep "Stage.*failed" logs/app.log

# 4. Check validation errors
grep "validation failed" logs/app.log

# 5. Real-time monitoring
tail -f logs/app.log | grep -E "(✅|❌|⚠️)"
```

---

## ✅ Success Criteria

All tests pass when:

- [ ] Test 1 (Good Image): Job completes, no errors
- [ ] Test 2 (Blurry): Job fails with ERR_ZERO_EXTRACTION
- [ ] Test 3 (Enrichment Fail): Warnings logged, job completes
- [ ] Test 4 (Multiple Allergens): All checked correctly
- [ ] Test 5 (No Allergens): Stage skipped
- [ ] No `console.log` in code
- [ ] No NaN in logs
- [ ] All warnings are helpful and actionable
- [ ] Error messages include recommendations

---

## 📝 Next Steps After Testing

If tests pass:
1. ✅ Deploy to staging
2. ✅ Monitor production logs
3. ✅ Collect user feedback
4. ✅ Optimize based on metrics

If tests fail:
1. ❌ Check logs for root cause
2. ❌ Fix identified issues
3. ❌ Re-run tests
4. ❌ Update this document

---

**Status:** Ready for testing
**Last Updated:** Nov 23, 2025
