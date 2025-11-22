#!/bin/bash

# TasteBuddyAI - Quick Test Script
# Script để test nhanh các AI agents

BASE_URL="http://localhost:3000"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   TasteBuddyAI - AI Agents Quick Test Script   ║${NC}"
echo -e "${BLUE}╔══════════════════════════════════════════════════╗${NC}"
echo ""

# Function to test an endpoint
test_endpoint() {
    local name=$1
    local endpoint=$2
    local data=$3
    
    echo -e "${YELLOW}Testing: $name${NC}"
    echo "Endpoint: $endpoint"
    echo ""
    
    response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$data" \
        "$BASE_URL$endpoint" \
        -w "\n%{http_code}")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
        echo -e "${GREEN}✓ Success (HTTP $http_code)${NC}"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    else
        echo -e "\033[0;31m✗ Failed (HTTP $http_code)${NC}"
        echo "$body"
    fi
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
}

# 1. Test Allergen Safety Agent
echo -e "${BLUE}[1/4] Testing Allergen Safety Agent...${NC}"
allergen_data='{
  "menuItems": [
    {
      "name": "Phở Bò",
      "description": "Phở bò truyền thống",
      "price": 50000
    },
    {
      "name": "Bún Đậu Mắm Tôm",
      "description": "Bún đậu với mắm tôm",
      "price": 45000
    }
  ],
  "userAllergens": [
    {
      "type": "shellfish",
      "severity": "severe"
    }
  ],
  "strictMode": true,
  "language": "en"
}'
test_endpoint "Allergen Safety" "/menu/test/allergen-safety" "$allergen_data"

# 2. Test Dietary Compliance Agent
echo -e "${BLUE}[2/4] Testing Dietary Compliance Agent...${NC}"
dietary_data='{
  "menuItems": [
    {
      "name": "Phở Chay",
      "description": "Phở chay với rau củ",
      "price": 45000
    },
    {
      "name": "Cơm Gà",
      "description": "Cơm gà Hải Nam",
      "price": 55000
    }
  ],
  "dietaryRestrictions": ["vegan"],
  "context": "Looking for vegan Vietnamese options"
}'
test_endpoint "Dietary Compliance" "/menu/test/dietary-compliance" "$dietary_data"

# 3. Test Nutrition Coach - Daily Targets
echo -e "${BLUE}[3/4] Testing Nutrition Coach (Daily Targets)...${NC}"
nutrition_data='{
  "age": 30,
  "gender": "male",
  "weight": 70,
  "height": 175,
  "activityLevel": "moderate",
  "goal": "weight-loss",
  "healthConditions": ["hypertension"],
  "requestType": "daily-targets"
}'
test_endpoint "Nutrition Coach - Daily Targets" "/menu/test/nutrition-coach" "$nutrition_data"

# 4. Test Nutrition Coach - Meal Plan
echo -e "${BLUE}[4/4] Testing Nutrition Coach (Meal Plan)...${NC}"
meal_plan_data='{
  "age": 25,
  "gender": "female",
  "weight": 60,
  "height": 165,
  "activityLevel": "active",
  "goal": "muscle-gain",
  "requestType": "meal-plan",
  "timeframe": "daily"
}'
test_endpoint "Nutrition Coach - Meal Plan" "/menu/test/nutrition-coach" "$meal_plan_data"

echo -e "${GREEN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║            All Tests Completed!                  ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════╝${NC}"
echo ""
echo "Note: Visual Extraction test requires base64 image"
echo "To test Visual Extraction:"
echo "  1. Get base64: base64 -i your_menu.jpg | pbcopy"
echo "  2. Replace MENU_IMAGE_BASE64 in curl command below"
echo ""
echo 'curl -X POST http://localhost:3000/menu/test/visual-extraction \'
echo '  -H "Content-Type: application/json" \'
echo '  -d "{\"imageData\":\"MENU_IMAGE_BASE64\",\"mimeType\":\"image/jpeg\",\"language\":\"vi\"}"'
echo ""
