#!/bin/bash

# Log Analysis Script
# Analyzes logs for data flow issues

echo "📊 Log Analysis - Data Flow Issues"
echo "======================================"

LOG_FILE="logs/app.log"

if [ ! -f "$LOG_FILE" ]; then
  echo "❌ Log file not found: $LOG_FILE"
  exit 1
fi

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. Check for Zero Extraction errors
echo -e "\n${BLUE}1. Zero Extraction Errors${NC}"
ZERO_EXTRACTION=$(grep "ZERO ITEMS EXTRACTED" $LOG_FILE | wc -l)
if [ "$ZERO_EXTRACTION" -gt 0 ]; then
  echo -e "${YELLOW}⚠️  Found $ZERO_EXTRACTION zero extraction errors${NC}"
  echo "Recent occurrences:"
  grep "ZERO ITEMS EXTRACTED" $LOG_FILE | tail -3
else
  echo -e "${GREEN}✓ No zero extraction errors${NC}"
fi

# 2. Check for Zero Enriched Dishes warnings
echo -e "\n${BLUE}2. Zero Enriched Dishes${NC}"
ZERO_ENRICHED=$(grep "ZERO ENRICHED DISHES" $LOG_FILE | wc -l)
if [ "$ZERO_ENRICHED" -gt 0 ]; then
  echo -e "${YELLOW}⚠️  Found $ZERO_ENRICHED zero enriched warnings${NC}"
  echo "Recent occurrences:"
  grep "ZERO ENRICHED DISHES" $LOG_FILE | tail -3
else
  echo -e "${GREEN}✓ No zero enriched warnings${NC}"
fi

# 3. Check for Allergen Analysis without enriched data
echo -e "\n${BLUE}3. Allergen Analysis Without Enriched Data${NC}"
NO_ENRICHED=$(grep "Running Allergen Analysis WITHOUT enriched data" $LOG_FILE | wc -l)
if [ "$NO_ENRICHED" -gt 0 ]; then
  echo -e "${YELLOW}⚠️  $NO_ENRICHED times allergen ran without enriched data${NC}"
else
  echo -e "${GREEN}✓ Allergen always had enriched data${NC}"
fi

# 4. Check for NaN values
echo -e "\n${BLUE}4. NaN Values${NC}"
NAN_COUNT=$(grep -i "nan" $LOG_FILE | wc -l)
if [ "$NAN_COUNT" -gt 0 ]; then
  echo -e "${RED}❌ Found $NAN_COUNT NaN values (SHOULD BE 0)${NC}"
  echo "Examples:"
  grep -i "nan" $LOG_FILE | tail -3
else
  echo -e "${GREEN}✓ No NaN values found${NC}"
fi

# 5. Check job completion rate
echo -e "\n${BLUE}5. Job Completion Stats${NC}"
TOTAL_JOBS=$(grep "Job created:" $LOG_FILE | wc -l)
COMPLETED=$(grep "JOB COMPLETED" $LOG_FILE | wc -l)
FAILED=$(grep "Job.*failed:" $LOG_FILE | wc -l)

if [ "$TOTAL_JOBS" -gt 0 ]; then
  SUCCESS_RATE=$((COMPLETED * 100 / TOTAL_JOBS))
  FAIL_RATE=$((FAILED * 100 / TOTAL_JOBS))

  echo "  Total Jobs: $TOTAL_JOBS"
  echo "  Completed: $COMPLETED ($SUCCESS_RATE%)"
  echo "  Failed: $FAILED ($FAIL_RATE%)"

  if [ "$SUCCESS_RATE" -ge 80 ]; then
    echo -e "${GREEN}✓ Good success rate${NC}"
  elif [ "$SUCCESS_RATE" -ge 50 ]; then
    echo -e "${YELLOW}⚠️  Moderate success rate${NC}"
  else
    echo -e "${RED}❌ Low success rate${NC}"
  fi
else
  echo "  No jobs found in logs"
fi

# 6. Check average processing time
echo -e "\n${BLUE}6. Performance Metrics${NC}"
if grep -q "Total Duration:" $LOG_FILE; then
  AVG_TIME=$(grep "Total Duration:" $LOG_FILE | awk '{sum+=$4; count++} END {print sum/count}')
  echo "  Average Job Duration: ${AVG_TIME}ms"

  # Convert to seconds for readability
  AVG_SECONDS=$(echo "scale=1; $AVG_TIME/1000" | bc)
  echo "  (~${AVG_SECONDS}s)"
else
  echo "  No duration data found"
fi

# 7. Check for stage failures
echo -e "\n${BLUE}7. Stage Failures${NC}"
STAGE_FAILURES=$(grep "Stage.*failed" $LOG_FILE | wc -l)
if [ "$STAGE_FAILURES" -gt 0 ]; then
  echo -e "${YELLOW}⚠️  $STAGE_FAILURES stage failures${NC}"
  echo "Most common failures:"
  grep "Stage.*failed" $LOG_FILE | awk '{print $NF}' | sort | uniq -c | sort -rn | head -5
else
  echo -e "${GREEN}✓ No stage failures${NC}"
fi

# 8. Check extraction methods
echo -e "\n${BLUE}8. Extraction Methods Used${NC}"
if grep -q "extractionMethod" $LOG_FILE; then
  echo "Distribution:"
  grep "extractionMethod" $LOG_FILE | grep -oP "extractionMethod\":\s*\"\K[^\"]*" | sort | uniq -c
else
  echo "  No extraction method data"
fi

# 9. Recent errors
echo -e "\n${BLUE}9. Recent Errors (Last 5)${NC}"
if grep -q "ERROR" $LOG_FILE; then
  grep "ERROR" $LOG_FILE | tail -5
else
  echo -e "${GREEN}✓ No recent errors${NC}"
fi

# 10. Data flow health check
echo -e "\n${BLUE}════════════════════════════════════════════${NC}"
echo -e "${BLUE}         DATA FLOW HEALTH SUMMARY          ${NC}"
echo -e "${BLUE}════════════════════════════════════════════${NC}"

HEALTH_SCORE=100

# Deduct points for issues
if [ "$ZERO_EXTRACTION" -gt 0 ]; then
  HEALTH_SCORE=$((HEALTH_SCORE - 10))
fi

if [ "$ZERO_ENRICHED" -gt 0 ]; then
  HEALTH_SCORE=$((HEALTH_SCORE - 10))
fi

if [ "$NAN_COUNT" -gt 0 ]; then
  HEALTH_SCORE=$((HEALTH_SCORE - 20))
fi

if [ "$STAGE_FAILURES" -gt 5 ]; then
  HEALTH_SCORE=$((HEALTH_SCORE - 15))
fi

if [ "$SUCCESS_RATE" -lt 80 ]; then
  HEALTH_SCORE=$((HEALTH_SCORE - 15))
fi

echo "Health Score: $HEALTH_SCORE/100"

if [ "$HEALTH_SCORE" -ge 90 ]; then
  echo -e "${GREEN}✅ Excellent - Data flow is healthy${NC}"
elif [ "$HEALTH_SCORE" -ge 70 ]; then
  echo -e "${YELLOW}⚠️  Good - Minor issues detected${NC}"
elif [ "$HEALTH_SCORE" -ge 50 ]; then
  echo -e "${YELLOW}⚠️  Fair - Some improvements needed${NC}"
else
  echo -e "${RED}❌ Poor - Significant issues need attention${NC}"
fi

echo -e "${BLUE}════════════════════════════════════════════${NC}"
