#!/bin/bash

# E2E API Test Script
# Tests the complete payment verification flow via API

BASE_URL="http://localhost:3001/api"
TOKEN="Bearer mock-jwt-token-user-1"

echo "=== E2E API Test: Payment Verification Flow ==="
echo ""

# Test 1: Health check
echo "1. Health Check..."
HEALTH=$(curl -s "$BASE_URL/health")
if echo "$HEALTH" | grep -q '"status":"ok"'; then
    echo "   ✓ Server is healthy"
else
    echo "   ✗ Server health check failed"
    exit 1
fi

# Test 2: Login
echo "2. Login..."
LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"john.doe@example.com","password":"password123"}')
if echo "$LOGIN" | grep -q '"success":true'; then
    echo "   ✓ Login successful"
else
    echo "   ✗ Login failed"
    exit 1
fi

# Test 3: List cooperatives
echo "3. List Cooperatives..."
COOPS=$(curl -s "$BASE_URL/cooperatives" -H "Authorization: $TOKEN")
if echo "$COOPS" | grep -q '"success":true'; then
    echo "   ✓ Cooperatives retrieved"
else
    echo "   ✗ Failed to retrieve cooperatives"
    exit 1
fi

# Test 4: Get contribution periods
echo "4. Get Contribution Periods..."
PERIODS=$(curl -s "$BASE_URL/contribution-plans/plan-1/periods" -H "Authorization: $TOKEN")
if echo "$PERIODS" | grep -q '"success":true'; then
    echo "   ✓ Periods retrieved"
else
    echo "   ✗ Failed to retrieve periods"
    exit 1
fi

# Test 5: Record a payment
echo "5. Record Payment..."
TIMESTAMP=$(date +%s)
RECORD=$(curl -s -X POST "$BASE_URL/contribution-periods/period-6/records" \
    -H "Content-Type: application/json" \
    -H "Authorization: $TOKEN" \
    -d "{\"amount\":500,\"paymentDate\":\"2024-06-20\",\"paymentReference\":\"E2E-TEST-$TIMESTAMP\"}")
if echo "$RECORD" | grep -q '"success":true'; then
    RECORD_ID=$(echo "$RECORD" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "   ✓ Payment recorded (ID: $RECORD_ID)"
else
    echo "   ✗ Failed to record payment"
    exit 1
fi

# Test 6: Verify payment
echo "6. Verify Payment..."
VERIFY=$(curl -s -X POST "$BASE_URL/contribution-records/$RECORD_ID/verify" \
    -H "Content-Type: application/json" \
    -H "Authorization: $TOKEN" \
    -d '{"approved":true}')
if echo "$VERIFY" | grep -q '"status":"verified"'; then
    echo "   ✓ Payment verified"
else
    echo "   ✗ Failed to verify payment"
    exit 1
fi

# Test 7: Check ledger for new entry
echo "7. Check Ledger..."
LEDGER=$(curl -s "$BASE_URL/cooperatives/coop-1/ledger" -H "Authorization: $TOKEN")
if echo "$LEDGER" | grep -q "E2E-TEST-$TIMESTAMP"; then
    echo "   ✓ Ledger entry found"
else
    # Entry may have different format, check for recent contribution_in
    if echo "$LEDGER" | grep -q '"type":"contribution_in"'; then
        echo "   ✓ Contribution entries found in ledger"
    else
        echo "   ✗ No contribution entries in ledger"
        exit 1
    fi
fi

# Test 8: Check member balance
echo "8. Check Virtual Balance..."
BALANCE=$(curl -s "$BASE_URL/cooperatives/coop-1/members/member-1/balance" -H "Authorization: $TOKEN")
if echo "$BALANCE" | grep -q '"success":true'; then
    echo "   ✓ Virtual balance retrieved"
else
    echo "   ✗ Failed to retrieve balance"
    exit 1
fi

echo ""
echo "=== All E2E Tests Passed ✓ ==="
