#!/bin/bash

echo "🧪 Starting Data Flow Tests..."
echo "======================================"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0
TOTAL=0

# Base URL
BASE_URL="http://localhost:3000"

# Function to wait for job completion
wait_for_job() {
  local job_id=$1
  local timeout=45
  local elapsed=0

  while [ $elapsed -lt $timeout ]; do
    STATUS=$(curl -s "$BASE_URL/menu/job-status/$job_id" | jq -r '.status')

    if [ "$STATUS" == "completed" ] || [ "$STATUS" == "failed" ]; then
      return 0
    fi

    sleep 3
    elapsed=$((elapsed + 3))
    echo -n "."
  done

  echo -e "\n${RED}Timeout waiting for job${NC}"
  return 1
}

# Test 1: Good Image with Allergens
echo -e "\n${BLUE}════════════════════════════════════════════${NC}"
echo -e "${YELLOW}Test 1: Normal Flow - Good Image${NC}"
echo -e "${BLUE}════════════════════════════════════════════${NC}"
((TOTAL++))

# Check if test image exists
if [ ! -f "test_images/clear_menu.jpg" ]; then
  echo -e "${RED}❌ Test image not found: test_images/clear_menu.jpg${NC}"
  echo "Please create test_images directory with sample images"
  ((FAILED++))
else
  RESPONSE=$(curl -s -X POST "$BASE_URL/menu/upload/scan-async" \
    -F "image=@test_images/clear_menu.jpg" \
    -F "language=vi" \
    -F "userAllergens=[{\"type\":\"shellfish\",\"severity\":\"severe\"}]")

  JOB_ID=$(echo $RESPONSE | jq -r '.jobId')

  if [ ! -z "$JOB_ID" ] && [ "$JOB_ID" != "null" ]; then
    echo -e "${GREEN}✓ Job created: $JOB_ID${NC}"
    echo -n "Waiting for completion"

    if wait_for_job "$JOB_ID"; then
      STATUS_RESPONSE=$(curl -s "$BASE_URL/menu/job-status/$JOB_ID")
      STATUS=$(echo $STATUS_RESPONSE | jq -r '.status')
      TOTAL_ITEMS=$(echo $STATUS_RESPONSE | jq -r '.stages.extraction.data.totalItems')
      ENRICHED=$(echo $STATUS_RESPONSE | jq -r '.stages.dish_understanding.data.totalDishes')

      echo -e "\n${BLUE}Results:${NC}"
      echo "  Status: $STATUS"
      echo "  Extracted Items: $TOTAL_ITEMS"
      echo "  Enriched Dishes: $ENRICHED"

      if [ "$STATUS" == "completed" ] && [ "$TOTAL_ITEMS" != "0" ] && [ "$TOTAL_ITEMS" != "null" ]; then
        echo -e "${GREEN}✅ PASSED: Job completed successfully${NC}"
        ((PASSED++))
      else
        echo -e "${RED}❌ FAILED: Job status=$STATUS, items=$TOTAL_ITEMS${NC}"
        ((FAILED++))
      fi
    else
      ((FAILED++))
    fi
  else
    echo -e "${RED}❌ FAILED: No job ID returned${NC}"
    echo "Response: $RESPONSE"
    ((FAILED++))
  fi
fi

# Test 2: Blurry Image (should fail)
echo -e "\n${BLUE}════════════════════════════════════════════${NC}"
echo -e "${YELLOW}Test 2: Zero Extraction - Poor Quality Image${NC}"
echo -e "${BLUE}════════════════════════════════════════════${NC}"
((TOTAL++))

if [ ! -f "test_images/blurry_menu.jpg" ]; then
  echo -e "${YELLOW}⚠️  SKIPPED: Blurry test image not found${NC}"
  echo "Create test_images/blurry_menu.jpg to test this case"
else
  RESPONSE=$(curl -s -X POST "$BASE_URL/menu/upload/scan-async" \
    -F "image=@test_images/blurry_menu.jpg" \
    -F "language=vi")

  JOB_ID=$(echo $RESPONSE | jq -r '.jobId')

  if [ ! -z "$JOB_ID" ] && [ "$JOB_ID" != "null" ]; then
    echo -e "${GREEN}✓ Job created: $JOB_ID${NC}"
    echo -n "Waiting for completion/failure"

    if wait_for_job "$JOB_ID"; then
      STATUS_RESPONSE=$(curl -s "$BASE_URL/menu/job-status/$JOB_ID")
      STATUS=$(echo $STATUS_RESPONSE | jq -r '.status')
      ERROR=$(echo $STATUS_RESPONSE | jq -r '.error')

      echo -e "\n${BLUE}Results:${NC}"
      echo "  Status: $STATUS"
      echo "  Error: $ERROR"

      if [ "$STATUS" == "failed" ] && [[ "$ERROR" == *"ERR_ZERO_EXTRACTION"* ]]; then
        echo -e "${GREEN}✅ PASSED: Job failed with correct error${NC}"
        ((PASSED++))
      else
        echo -e "${RED}❌ FAILED: Expected ERR_ZERO_EXTRACTION, got: $ERROR${NC}"
        ((FAILED++))
      fi
    else
      ((FAILED++))
    fi
  else
    echo -e "${RED}❌ FAILED: No job ID returned${NC}"
    ((FAILED++))
  fi
fi

# Test 3: No Allergens
echo -e "\n${BLUE}════════════════════════════════════════════${NC}"
echo -e "${YELLOW}Test 3: No Allergens Provided${NC}"
echo -e "${BLUE}════════════════════════════════════════════${NC}"
((TOTAL++))

if [ ! -f "test_images/clear_menu.jpg" ]; then
  echo -e "${YELLOW}⚠️  SKIPPED: Test image not found${NC}"
else
  RESPONSE=$(curl -s -X POST "$BASE_URL/menu/upload/scan-async" \
    -F "image=@test_images/clear_menu.jpg" \
    -F "language=vi")
    # No userAllergens parameter

  JOB_ID=$(echo $RESPONSE | jq -r '.jobId')

  if [ ! -z "$JOB_ID" ] && [ "$JOB_ID" != "null" ]; then
    echo -e "${GREEN}✓ Job created: $JOB_ID${NC}"
    echo -n "Waiting for completion"

    if wait_for_job "$JOB_ID"; then
      STATUS_RESPONSE=$(curl -s "$BASE_URL/menu/job-status/$JOB_ID")
      STATUS=$(echo $STATUS_RESPONSE | jq -r '.status')
      HAS_ALLERGEN_STAGE=$(echo $STATUS_RESPONSE | jq -r '.stages.allergen_analysis')

      echo -e "\n${BLUE}Results:${NC}"
      echo "  Status: $STATUS"
      echo "  Allergen Stage: $HAS_ALLERGEN_STAGE"

      if [ "$STATUS" == "completed" ] && [ "$HAS_ALLERGEN_STAGE" == "null" ]; then
        echo -e "${GREEN}✅ PASSED: Allergen stage skipped correctly${NC}"
        ((PASSED++))
      else
        echo -e "${RED}❌ FAILED: Allergen stage should be null${NC}"
        ((FAILED++))
      fi
    else
      ((FAILED++))
    fi
  else
    echo -e "${RED}❌ FAILED: No job ID returned${NC}"
    ((FAILED++))
  fi
fi

# Summary
echo -e "\n${BLUE}════════════════════════════════════════════${NC}"
echo -e "${BLUE}           TEST SUMMARY                    ${NC}"
echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo -e "Total Tests: $TOTAL"
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"
echo -e "${BLUE}════════════════════════════════════════════${NC}"

# Check logs for issues
echo -e "\n${YELLOW}Checking logs for issues...${NC}"

# Check for console.log (should not exist)
CONSOLE_LOGS=$(grep -r "console\.log" src/modules/menu/menu.service.ts 2>/dev/null | wc -l)
if [ "$CONSOLE_LOGS" -gt 0 ]; then
  echo -e "${RED}⚠️  Found $CONSOLE_LOGS console.log statements (should be 0)${NC}"
else
  echo -e "${GREEN}✓ No console.log found${NC}"
fi

# Check for NaN in recent logs
if [ -f "logs/app.log" ]; then
  NAN_COUNT=$(grep "NaN" logs/app.log | tail -100 | wc -l)
  if [ "$NAN_COUNT" -gt 0 ]; then
    echo -e "${RED}⚠️  Found NaN in logs (should be 0)${NC}"
  else
    echo -e "${GREEN}✓ No NaN values in logs${NC}"
  fi
fi

echo -e "\n${BLUE}════════════════════════════════════════════${NC}"

# Exit code
if [ $FAILED -gt 0 ]; then
  echo -e "${RED}Some tests failed. Check logs for details.${NC}"
  exit 1
else
  echo -e "${GREEN}All tests passed! 🎉${NC}"
  exit 0
fi
