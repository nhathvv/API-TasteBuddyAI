# Quick Test - Nutrition Coach Agent (No Image Required)

# Test 1: Daily Targets for Weight Loss
echo "🔹 Test 1: Daily Targets for Weight Loss"
curl -X POST http://localhost:3000/menu/test/nutrition-coach \
  -H "Content-Type: application/json" \
  -d '{
    "age": 30,
    "gender": "male",
    "weight": 75,
    "height": 175,
    "activityLevel": "moderate",
    "goal": "weight-loss",
    "healthConditions": ["hypertension"],
    "requestType": "daily-targets"
  }' | jq '.'

echo -e "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"

# Test 2: Meal Plan for Muscle Gain
echo "🔹 Test 2: Meal Plan for Muscle Gain"
curl -X POST http://localhost:3000/menu/test/nutrition-coach \
  -H "Content-Type: application/json" \
  -d '{
    "age": 25,
    "gender": "female",
    "weight": 60,
    "height": 165,
    "activityLevel": "active",
    "goal": "muscle-gain",
    "requestType": "meal-plan",
    "timeframe": "daily"
  }' | jq '.'

echo -e "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"

# Test 3: Dietary Compliance (Vegan)
echo "🔹 Test 3: Dietary Compliance Check (Vegan)"
curl -X POST http://localhost:3000/menu/test/dietary-compliance \
  -H "Content-Type: application/json" \
  -d '{
    "menuItems": [
      {
        "name": "Phở Chay",
        "description": "Phở chay với nước dùng rau củ",
        "price": 45000
      },
      {
        "name": "Cơm Gà",
        "description": "Cơm gà Hải Nam",
        "price": 55000
      },
      {
        "name": "Gỏi Cuốn Chay",
        "description": "Gỏi cuốn chay với đậu hũ",
        "price": 30000
      }
    ],
    "dietaryRestrictions": ["vegan", "gluten-free"],
    "context": "Looking for authentic Vietnamese vegan options"
  }' | jq '.'

echo -e "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"

# Test 4: Allergen Safety (Shellfish)
echo "🔹 Test 4: Allergen Safety Check (Shellfish Allergy)"
curl -X POST http://localhost:3000/menu/test/allergen-safety \
  -H "Content-Type: application/json" \
  -d '{
    "menuItems": [
      {
        "name": "Phở Bò",
        "description": "Phở bò truyền thống với nước dùng xương",
        "price": 50000
      },
      {
        "name": "Bún Đậu Mắm Tôm",
        "description": "Bún đậu với mắm tôm",
        "price": 45000
      },
      {
        "name": "Gỏi Cuốn Tôm",
        "description": "Gỏi cuốn tôm tươi",
        "price": 35000
      }
    ],
    "userAllergens": [
      {
        "type": "shellfish",
        "severity": "life-threatening"
      }
    ],
    "strictMode": true,
    "language": "en"
  }' | jq '.'

echo -e "\n✅ All tests completed!\n"
