#!/bin/bash

# Enhanced API Testing Script with Session Management
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

BASE_URL="http://localhost:3000"
COOKIE_JAR="/tmp/arpufrl_cookies.txt"

# Clean up old cookies
rm -f "$COOKIE_JAR"

echo -e "${BLUE}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         ARPUFRL Detailed API Testing                 ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════╝${NC}\n"

echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}TEST 1: Cloudinary Configuration & Upload${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}\n"

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | grep CLOUDINARY | xargs)
fi

echo -e "${BLUE}Cloudinary Configuration:${NC}"
echo -e "  CLOUDINARY_CLOUD_NAME: ${YELLOW}${CLOUDINARY_CLOUD_NAME:-Not Set}${NC}"
echo -e "  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: ${YELLOW}${NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME:-Not Set}${NC}"
echo -e "  NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: ${YELLOW}${NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET:-Not Set}${NC}"
echo ""

if [ -n "$NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME" ] && [ -n "$NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET" ]; then
    echo -e "${GREEN}✓ Cloudinary is configured${NC}\n"

    # Create a minimal test image (1x1 pixel PNG)
    echo -e "${BLUE}Creating test image...${NC}"
    echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" | base64 -d > /tmp/test_cloudinary.png

    echo -e "${BLUE}Uploading to Cloudinary...${NC}"
    UPLOAD_RESULT=$(curl -s -X POST \
      "https://api.cloudinary.com/v1_1/${NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload" \
      -F "file=@/tmp/test_cloudinary.png" \
      -F "upload_preset=${NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}" \
      -F "folder=arpufrl/test")

    if echo "$UPLOAD_RESULT" | grep -q "secure_url"; then
        SECURE_URL=$(echo "$UPLOAD_RESULT" | grep -o '"secure_url":"[^"]*"' | cut -d'"' -f4)
        PUBLIC_ID=$(echo "$UPLOAD_RESULT" | grep -o '"public_id":"[^"]*"' | cut -d'"' -f4)
        echo -e "${GREEN}✓ Upload Successful!${NC}"
        echo -e "  URL: ${YELLOW}${SECURE_URL}${NC}"
        echo -e "  Public ID: ${YELLOW}${PUBLIC_ID}${NC}"
    else
        echo -e "${RED}✗ Upload Failed${NC}"
        echo "$UPLOAD_RESULT" | head -20
    fi

    rm -f /tmp/test_cloudinary.png
else
    echo -e "${RED}✗ Cloudinary is NOT configured properly${NC}"
    echo -e "${YELLOW}  Please check your .env file${NC}\n"
fi

echo ""
echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}TEST 2: Authentication Tests${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}\n"

# Test Admin Login
echo -e "${BLUE}Testing Admin Login...${NC}"
LOGIN_RESPONSE=$(curl -v -s -L -c "$COOKIE_JAR" -X POST "${BASE_URL}/api/auth/callback/credentials" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=admin@arpufrl.org&password=Password123!&csrfToken=test&callbackUrl=/dashboard&json=true" 2>&1)

echo "$LOGIN_RESPONSE" | grep -E "(HTTP|Location|Set-Cookie)" | head -10
echo ""

# Test with credentials API
echo -e "${BLUE}Testing Credentials Endpoint...${NC}"
CRED_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/auth/callback/credentials" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@arpufrl.org",
    "password": "Password123!",
    "csrfToken": "test"
  }')

echo "$CRED_RESPONSE" | head -20
echo ""

echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}TEST 3: Public APIs (No Auth)${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}\n"

# Test Programs API
echo -e "${BLUE}Testing GET /api/programs${NC}"
PROGRAMS=$(curl -s "${BASE_URL}/api/programs")
PROGRAM_COUNT=$(echo "$PROGRAMS" | grep -o '"_id"' | wc -l | tr -d ' ')
echo -e "  ${GREEN}✓${NC} Found ${YELLOW}${PROGRAM_COUNT}${NC} programs"
echo ""

# Test Content API
echo -e "${BLUE}Testing GET /api/content${NC}"
CONTENT=$(curl -s "${BASE_URL}/api/content")
if echo "$CONTENT" | grep -q "organizationName"; then
    ORG_NAME=$(echo "$CONTENT" | grep -o '"organizationName":"[^"]*"' | cut -d'"' -f4)
    echo -e "  ${GREEN}✓${NC} Organization: ${YELLOW}${ORG_NAME}${NC}"
else
    echo -e "  ${RED}✗${NC} Content API failed"
fi
echo ""

# Test Contact Form
echo -e "${BLUE}Testing POST /api/contact${NC}"
CONTACT_RESP=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/api/contact" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "API Test User",
    "email": "apitest@example.com",
    "phone": "9999999999",
    "subject": "API Testing",
    "message": "This is an automated test message"
  }')

CONTACT_STATUS=$(echo "$CONTACT_RESP" | tail -1)
if [ "$CONTACT_STATUS" == "201" ]; then
    echo -e "  ${GREEN}✓${NC} Contact form submitted successfully (Status: 201)"
else
    echo -e "  ${YELLOW}Status: ${CONTACT_STATUS}${NC}"
fi
echo ""

# Test Volunteer Request
echo -e "${BLUE}Testing POST /api/volunteer${NC}"
VOLUNTEER_RESP=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/api/volunteer" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "API Test Volunteer",
    "email": "voltest@example.com",
    "phone": "9999999998",
    "state": "Test State",
    "city": "Test City",
    "interests": ["TEACHING"],
    "message": "Test volunteer request",
    "availability": "Weekends"
  }')

VOLUNTEER_STATUS=$(echo "$VOLUNTEER_RESP" | tail -1)
if [ "$VOLUNTEER_STATUS" == "201" ]; then
    echo -e "  ${GREEN}✓${NC} Volunteer request submitted (Status: 201)"
else
    echo -e "  ${YELLOW}Status: ${VOLUNTEER_STATUS}${NC}"
fi
echo ""

echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}TEST 4: Protected APIs (Require Auth)${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}\n"

# Test Donations API
echo -e "${BLUE}Testing GET /api/donations (should be public)${NC}"
DONATIONS=$(curl -s -w "\n%{http_code}" "${BASE_URL}/api/donations")
DONATION_STATUS=$(echo "$DONATIONS" | tail -1)
DONATION_BODY=$(echo "$DONATIONS" | head -n -1)
DONATION_COUNT=$(echo "$DONATION_BODY" | grep -o '"_id"' | wc -l | tr -d ' ')
echo -e "  Status: ${YELLOW}${DONATION_STATUS}${NC}"
echo -e "  Found ${YELLOW}${DONATION_COUNT}${NC} donations"
echo ""

# Test Users API (Admin only)
echo -e "${BLUE}Testing GET /api/users (Admin only, no auth)${NC}"
USERS_STATUS=$(curl -s -w "%{http_code}" -o /dev/null "${BASE_URL}/api/users")
echo -e "  Status: ${YELLOW}${USERS_STATUS}${NC} (should be 401 or 307 redirect)"
echo ""

# Test Coordinators API
echo -e "${BLUE}Testing GET /api/coordinators${NC}"
COORD_STATUS=$(curl -s -w "%{http_code}" -o /dev/null "${BASE_URL}/api/coordinators")
echo -e "  Status: ${YELLOW}${COORD_STATUS}${NC}"
echo ""

# Test Surveys API
echo -e "${BLUE}Testing GET /api/surveys${NC}"
SURVEY_RESP=$(curl -s -w "\n%{http_code}" "${BASE_URL}/api/surveys")
SURVEY_STATUS=$(echo "$SURVEY_RESP" | tail -1)
echo -e "  Status: ${YELLOW}${SURVEY_STATUS}${NC}"
echo ""

# Test Targets API
echo -e "${BLUE}Testing GET /api/targets${NC}"
TARGET_STATUS=$(curl -s -w "%{http_code}" -o /dev/null "${BASE_URL}/api/targets")
echo -e "  Status: ${YELLOW}${TARGET_STATUS}${NC}"
echo ""

echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}TEST 5: Database Verification${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}\n"

echo -e "${BLUE}Checking seeded data counts:${NC}"
echo -e "  Programs: ${YELLOW}${PROGRAM_COUNT}${NC}"
echo -e "  Donations: ${YELLOW}${DONATION_COUNT}${NC}"
echo ""

echo -e "${GREEN}Testing completed!${NC}\n"
echo -e "${YELLOW}Note:${NC} For full authentication testing, you need to:"
echo -e "  1. Visit ${BLUE}http://localhost:3000/login${NC} in a browser"
echo -e "  2. Login with credentials and copy session cookies"
echo -e "  3. Use those cookies with curl -b flag for protected endpoints"
echo ""

# Cleanup
rm -f "$COOKIE_JAR"
