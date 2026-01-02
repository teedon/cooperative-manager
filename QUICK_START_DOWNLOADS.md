# Quick Start: App Downloads System

## ⚡ 3 Steps to Get Running

### 1️⃣ Restart Backend
```bash
cd backend
npm run start:dev
```

### 2️⃣ Add Your App Files
```bash
cd backend/storage/app-files/

# Place your files here with these exact names:
# ✅ cooperative-manager.apk (Android)
# ✅ cooperative-manager.ipa (iOS)  
# ✅ cooperative-manager-web.zip (Web)
```

### 3️⃣ Test It
```bash
# Test statistics
curl http://localhost:3001/api/downloads/stats

# Or run the test script
./test-downloads-api.sh
```

## 🌐 URLs

**Frontend Landing Page:**
```
http://localhost:5173/
```

**Download Statistics Dashboard:**
```
http://localhost:5173/download-stats
```

**Backend API:**
```
http://localhost:3001/api/downloads
```

## 🎯 API Endpoints

### Download App (Public)
```
GET /api/downloads/app/android
GET /api/downloads/app/ios
GET /api/downloads/app/web
```

### Get Statistics (Public)
```
GET /api/downloads/stats
GET /api/downloads/stats?platform=android
```

### Upload File (Protected - Requires Auth)
```bash
TOKEN="your_jwt_token"
curl -X POST http://localhost:3001/api/downloads/upload/android \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@your-app.apk"
```

## 📊 What Gets Tracked

Every download records:
- ✅ Platform (android/ios/web)
- ✅ Timestamp
- ✅ IP address
- ✅ User agent (device/browser)
- ✅ App version

## ✅ What's Done

- [x] Database migration ✅
- [x] Backend API ✅
- [x] Frontend integration ✅
- [x] Statistics dashboard ✅
- [x] Security (auth for uploads) ✅
- [x] Automatic tracking ✅
- [x] Documentation ✅

## ⏳ What You Need to Do

1. **Restart backend** (loads new module)
2. **Upload app files** (to storage directory)
3. **Test endpoints** (verify it works)

That's it! 🎉

## 📚 Full Documentation

See these files for complete details:
- `DOWNLOADS_IMPLEMENTATION_SUMMARY.md` - Complete guide
- `APP_DOWNLOADS_SETUP.md` - Technical setup
- `test-downloads-api.sh` - Test script

## 🆘 Need Help?

**Backend not responding?**
```bash
cd backend && npm run start:dev
```

**File not found error?**
```bash
# Upload files to:
backend/storage/app-files/
```

**Want to see logs?**
```bash
# Backend logs show download activity
cd backend
npm run start:dev
# Watch the terminal for download requests
```

## 🎊 Success!

If you can:
1. ✅ Visit landing page and see download buttons
2. ✅ Click download button (triggers download)
3. ✅ See statistics at `/download-stats`

Then you're all set! 🚀
