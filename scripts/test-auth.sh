#!/bin/bash

BASE_URL="http://localhost:3000"
EMAIL="test_auth_$(date +%s)@example.com"
PASSWORD="Password123!"

echo "🔹 1. Registering new user: $EMAIL"
curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\",
    \"fullName\": \"Test User\"
  }"

echo -e "\n\n🔹 2. Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\"
  }")

echo "Response: $LOGIN_RESPONSE"

# Extract access token using grep/sed (simple hack for testing)
ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Login failed, no access token found"
  exit 1
fi

echo -e "\n🔹 3. Getting Profile (Protected Route)..."
curl -s -X GET "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Extract refresh token
REFRESH_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"refreshToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$REFRESH_TOKEN" ]; then
  echo "❌ No refresh token found"
  exit 1
fi

echo -e "\n\n🔹 4. Refreshing Token..."
REFRESH_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{ \"refreshToken\": \"$REFRESH_TOKEN\" }")

echo "Response: $REFRESH_RESPONSE"

NEW_ACCESS_TOKEN=$(echo "$REFRESH_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$NEW_ACCESS_TOKEN" ]; then
  echo "❌ Refresh failed"
  exit 1
fi

echo -e "\n🔹 5. Logging out..."
curl -s -X POST "$BASE_URL/auth/logout" \
  -H "Authorization: Bearer $NEW_ACCESS_TOKEN"

echo -e "\n\n✅ Full Auth Flow Test Completed"
