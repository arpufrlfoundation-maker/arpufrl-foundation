#!/bin/bash

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000"

echo -e "${BLUE}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         ARPUFRL API Testing Suite                    ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════╝${NC}\n"

# Test counter
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to print test result
print_result() {
    local test_name="$1"
    local status_code="$2"
    local expected="$3"

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    if [ "$status_code" == "$expected" ]; then
        echo -e "${GREEN}✓${NC} $test_name ${GREEN}(Status: $status_code)${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}✗${NC} $test_name ${RED}(Expected: $expected, Got: $status_code)${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# Function to extract cookie from response
extract_cookie() {
    grep -i "set-cookie:" | sed 's/.*set-cookie: //i' | cut -d';' -f1
}

echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}1. AUTHENTICATION TESTS${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}\n"

# Test 1: Login as Admin
echo -e "${BLUE}Testing Admin Login...${NC}"
ADMIN_RESPONSE=$(curl -s -w "\nSTATUS:%{http_code}" -X POST "${BASE_URL}/api/auth/signin" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@arpufrl.org",
    "password": "Password123!"
  }')

ADMIN_STATUS=$(echo "$ADMIN_RESPONSE" | grep "STATUS:" | cut -d':' -f2)
print_result "Admin Login" "$ADMIN_STATUS" "200"

# Extract admin session (simplified)
ADMIN_EMAIL="admin@arpufrl.org"

# Test 2: Login as Coordinator
echo -e "${BLUE}Testing Coordinator Login...${NC}"
COORD_RESPONSE=$(curl -s -w "\nSTATUS:%{http_code}" -X POST "${BASE_URL}/api/auth/signin" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "state.coord@example.com",
    "password": "Password123!"
  }')

COORD_STATUS=$(echo "$COORD_RESPONSE" | grep "STATUS:" | cut -d':' -f2)
print_result "Coordinator Login" "$COORD_STATUS" "200"

# Test 3: Login as Volunteer
echo -e "${BLUE}Testing Volunteer Login...${NC}"
VOL_RESPONSE=$(curl -s -w "\nSTATUS:%{http_code}" -X POST "${BASE_URL}/api/auth/signin" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "rahul@example.com",
    "password": "Password123!"
  }')

VOL_STATUS=$(echo "$VOL_RESPONSE" | grep "STATUS:" | cut -d':' -f2)
print_result "Volunteer Login" "$VOL_STATUS" "200"

# Test 4: Invalid Login
echo -e "${BLUE}Testing Invalid Login...${NC}"
INVALID_STATUS=$(curl -s -w "%{http_code}" -o /dev/null -X POST "${BASE_URL}/api/auth/signin" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid@example.com",
    "password": "wrongpassword"
  }')

print_result "Invalid Login (should fail)" "$INVALID_STATUS" "401"

echo ""
echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}2. PUBLIC API TESTS (No Auth Required)${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}\n"

# Test 5: Get Programs
echo -e "${BLUE}Testing Get Programs...${NC}"
PROGRAMS_STATUS=$(curl -s -w "%{http_code}" -o /dev/null "${BASE_URL}/api/programs")
print_result "Get Programs" "$PROGRAMS_STATUS" "200"

# Test 6: Health Check
echo -e "${BLUE}Testing Health Check...${NC}"
HEALTH_STATUS=$(curl -s -w "%{http_code}" -o /dev/null "${BASE_URL}/api/health")
print_result "Health Check" "$HEALTH_STATUS" "200"

# Test 7: Submit Contact Form
echo -e "${BLUE}Testing Contact Form Submission...${NC}"
CONTACT_STATUS=$(curl -s -w "%{http_code}" -o /dev/null -X POST "${BASE_URL}/api/contact" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "9876543210",
    "subject": "Test Message",
    "message": "This is a test message from API testing"
  }')

print_result "Contact Form Submission" "$CONTACT_STATUS" "201"

# Test 8: Submit Volunteer Request
echo -e "${BLUE}Testing Volunteer Request Submission...${NC}"
VOLUNTEER_REQ_STATUS=$(curl -s -w "%{http_code}" -o /dev/null -X POST "${BASE_URL}/api/volunteer" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Volunteer",
    "email": "volunteer@test.com",
    "phone": "9876543299",
    "state": "Uttar Pradesh",
    "city": "Lucknow",
    "interests": ["TEACHING", "SOCIAL_WORK"],
    "message": "I want to volunteer",
    "availability": "Weekends"
  }')

print_result "Volunteer Request Submission" "$VOLUNTEER_REQ_STATUS" "201"

echo ""
echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}3. ADMIN API TESTS${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}\n"

# Note: These tests won't work without proper session cookies from NextAuth
# But we can test the endpoints exist

# Test 9: Get All Users (Admin only)
echo -e "${BLUE}Testing Get All Users (should require auth)...${NC}"
USERS_STATUS=$(curl -s -w "%{http_code}" -o /dev/null "${BASE_URL}/api/users")
print_result "Get All Users" "$USERS_STATUS" "401"

# Test 10: Get Donations (Admin)
echo -e "${BLUE}Testing Get Donations (should require auth)...${NC}"
DONATIONS_STATUS=$(curl -s -w "%{http_code}" -o /dev/null "${BASE_URL}/api/donations")
print_result "Get Donations" "$DONATIONS_STATUS" "401"

# Test 11: Get Targets
echo -e "${BLUE}Testing Get Targets (should require auth)...${NC}"
TARGETS_STATUS=$(curl -s -w "%{http_code}" -o /dev/null "${BASE_URL}/api/targets")
print_result "Get Targets" "$TARGETS_STATUS" "401"

# Test 12: Get Surveys
echo -e "${BLUE}Testing Get Surveys (should require auth)...${NC}"
SURVEYS_STATUS=$(curl -s -w "%{http_code}" -o /dev/null "${BASE_URL}/api/surveys")
print_result "Get Surveys" "$SURVEYS_STATUS" "401"

echo ""
echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}4. COORDINATOR API TESTS${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}\n"

# Test 13: Get Coordinators (should require auth)
echo -e "${BLUE}Testing Get Coordinators...${NC}"
COORDINATORS_STATUS=$(curl -s -w "%{http_code}" -o /dev/null "${BASE_URL}/api/coordinators")
print_result "Get Coordinators" "$COORDINATORS_STATUS" "401"

# Test 14: Get Sub-coordinators
echo -e "${BLUE}Testing Get Sub-coordinators...${NC}"
SUB_COORD_STATUS=$(curl -s -w "%{http_code}" -o /dev/null "${BASE_URL}/api/coordinators/sub-coordinators")
print_result "Get Sub-coordinators" "$SUB_COORD_STATUS" "401"

echo ""
echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}5. CLOUDINARY UPLOAD TEST${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}\n"

# Test Cloudinary configuration
echo -e "${BLUE}Testing Cloudinary Configuration...${NC}"
if [ -n "$NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME" ] && [ -n "$NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET" ]; then
    echo -e "${GREEN}✓${NC} Cloudinary Environment Variables Found"
    echo -e "  Cloud Name: ${YELLOW}$NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME${NC}"
    echo -e "  Upload Preset: ${YELLOW}$NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET${NC}"

    # Create a test image file
    echo -e "${BLUE}Creating test image...${NC}"
    echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" | base64 -d > /tmp/test_image.png

    # Test direct Cloudinary upload (unsigned)
    echo -e "${BLUE}Testing Direct Cloudinary Upload...${NC}"
    CLOUDINARY_RESPONSE=$(curl -s -w "\nSTATUS:%{http_code}" -X POST \
      "https://api.cloudinary.com/v1_1/$NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME/image/upload" \
      -F "file=@/tmp/test_image.png" \
      -F "upload_preset=$NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET" \
      -F "folder=arpufrl/test")

    CLOUDINARY_STATUS=$(echo "$CLOUDINARY_RESPONSE" | grep "STATUS:" | cut -d':' -f2)

    if [ "$CLOUDINARY_STATUS" == "200" ]; then
        echo -e "${GREEN}✓${NC} Cloudinary Upload Successful"
        UPLOAD_URL=$(echo "$CLOUDINARY_RESPONSE" | grep -o '"secure_url":"[^"]*"' | cut -d'"' -f4)
        if [ -n "$UPLOAD_URL" ]; then
            echo -e "  ${GREEN}Uploaded URL:${NC} $UPLOAD_URL"
        fi
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}✗${NC} Cloudinary Upload Failed (Status: $CLOUDINARY_STATUS)"
        echo "$CLOUDINARY_RESPONSE" | grep -v "STATUS:"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    # Cleanup
    rm -f /tmp/test_image.png
else
    echo -e "${RED}✗${NC} Cloudinary Environment Variables Not Found"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
fi

echo ""
echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}6. DATABASE & CONTENT TESTS${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}\n"

# Test 15: Get Content (from data/info.json)
echo -e "${BLUE}Testing Get Content...${NC}"
CONTENT_STATUS=$(curl -s -w "%{http_code}" -o /dev/null "${BASE_URL}/api/content")
print_result "Get Content" "$CONTENT_STATUS" "200"

# Test 16: Get Program by Slug
echo -e "${BLUE}Testing Get Program by Slug...${NC}"
PROGRAM_SLUG_STATUS=$(curl -s -w "%{http_code}" -o /dev/null "${BASE_URL}/api/programs/child-women-welfare")
print_result "Get Program by Slug" "$PROGRAM_SLUG_STATUS" "200"

echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                  TEST SUMMARY                         ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════╝${NC}\n"

echo -e "Total Tests:  ${BLUE}$TOTAL_TESTS${NC}"
echo -e "Passed:       ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed:       ${RED}$FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}All tests completed successfully! ✓${NC}\n"
    exit 0
else
    echo -e "\n${YELLOW}Some tests failed. Check the output above for details.${NC}\n"
    exit 1
fi
