#!/bin/bash

# Backend Connection Test Script
# Tests if backend API is responding correctly

API_URL="${NEXT_PUBLIC_API_BASE_URL:-http://127.0.0.1:2024}"
ENDPOINTS=(
  "/api/v1/user/profile"
  "/api/v1/user/preferences"
  "/api/v1/user/preferences/notifications"
)

echo "========================================"
echo "Backend API Connection Test"
echo "========================================"
echo ""
echo "Testing backend at: $API_URL"
echo ""

# Test if backend is reachable
echo "1. Testing backend connectivity..."
if curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "$API_URL" > /dev/null 2>&1; then
  echo "   ✅ Backend is reachable"
else
  echo "   ❌ Cannot connect to backend"
  echo ""
  echo "PROBLEM: Backend server is not running or not accessible"
  echo ""
  echo "Solutions:"
  echo "  1. Start your backend server"
  echo "  2. Check if it's running on port 2024"
  echo "  3. Verify firewall settings"
  echo ""
  exit 1
fi

echo ""
echo "2. Testing API endpoints..."
echo ""

ALL_PASS=true

for endpoint in "${ENDPOINTS[@]}"; do
  echo "Testing: $endpoint"

  # Test endpoint (without auth for now, just to see if it responds)
  RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL$endpoint" 2>&1)
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | head -n-1)

  if [ -z "$HTTP_CODE" ] || [ "$HTTP_CODE" = "000" ]; then
    echo "   ❌ FAIL: Empty reply from server"
    echo "   Problem: Server not responding with HTTP"
    ALL_PASS=false
  elif [ "$HTTP_CODE" = "401" ]; then
    echo "   ⚠️  401 Unauthorized (Expected - needs authentication)"
    echo "   This is OK - endpoint exists but requires login"
  elif [ "$HTTP_CODE" = "404" ]; then
    echo "   ❌ FAIL: 404 Not Found"
    echo "   Problem: Endpoint not implemented on backend"
    ALL_PASS=false
  elif [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
    echo "   ✅ PASS: HTTP $HTTP_CODE"
    echo "   Response: ${BODY:0:100}..."
  elif [ "$HTTP_CODE" -ge 500 ]; then
    echo "   ❌ FAIL: HTTP $HTTP_CODE (Server Error)"
    echo "   Problem: Backend crashed or has internal error"
    ALL_PASS=false
  else
    echo "   ⚠️  HTTP $HTTP_CODE"
  fi

  echo ""
done

echo "========================================"
echo "Summary"
echo "========================================"

if [ "$ALL_PASS" = true ]; then
  echo "✅ All endpoints responding!"
  echo ""
  echo "If settings page is still empty, check:"
  echo "  1. Browser console for errors"
  echo "  2. Authentication token"
  echo "  3. CORS configuration"
else
  echo "❌ Some endpoints have issues"
  echo ""
  echo "Fix the backend issues above, then:"
  echo "  1. Restart backend server"
  echo "  2. Refresh settings page"
  echo "  3. Check browser console"
fi

echo ""
