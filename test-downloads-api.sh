#!/bin/bash

# Test script for app downloads API

echo "🧪 Testing App Downloads API"
echo "================================"
echo ""

BASE_URL="http://localhost:3001/api"

# Test 1: Get download statistics
echo "📊 Test 1: Get Download Statistics"
echo "GET $BASE_URL/downloads/stats"
curl -s "$BASE_URL/downloads/stats" | jq '.' || echo "❌ Failed - Make sure backend is running"
echo ""
echo ""

# Test 2: Get platform-specific statistics
echo "📱 Test 2: Get Android Statistics"
echo "GET $BASE_URL/downloads/stats?platform=android"
curl -s "$BASE_URL/downloads/stats?platform=android" | jq '.' || echo "❌ Failed"
echo ""
echo ""

# Test 3: List available files (requires auth - will fail without token)
echo "📁 Test 3: List Available Files (requires auth)"
echo "GET $BASE_URL/downloads/files"
curl -s "$BASE_URL/downloads/files" || echo "❌ Failed (expected - requires authentication)"
echo ""
echo ""

# Test 4: Check if app files exist
echo "📦 Test 4: Check Storage Directory"
STORAGE_DIR="../backend/storage/app-files"
if [ -d "$STORAGE_DIR" ]; then
    echo "✅ Storage directory exists"
    echo "Files:"
    ls -lh "$STORAGE_DIR" | grep -v "^d" | grep -v "total" || echo "   (no files uploaded yet)"
else
    echo "❌ Storage directory not found"
fi
echo ""
echo ""

# Instructions
echo "📝 Next Steps:"
echo "================================"
echo "1. Upload your app files to: backend/storage/app-files/"
echo "   - cooperative-manager.apk (Android)"
echo "   - cooperative-manager.ipa (iOS)"
echo "   - cooperative-manager-web.zip (Web)"
echo ""
echo "2. Test download endpoints:"
echo "   curl -O $BASE_URL/downloads/app/android"
echo ""
echo "3. View statistics dashboard:"
echo "   Navigate to: http://localhost:5173/download-stats"
echo ""
echo "================================"
