# Frontend Authentication Debug Guide

## Issue
Frontend new-webapp is not getting response from backend `/auth/login` endpoint, even though the backend works fine via Postman.

## Changes Made

### 1. Fixed Auth Response Mapping
**File**: `src/store/authSlice.ts`

The backend returns:
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "jwt-token",
    "refreshToken": "refresh-token"
  }
}
```

Updated the auth API to properly extract and map `token` → `accessToken`:
```typescript
const { user, token, refreshToken } = response.data.data
return {
  user,
  accessToken: token,  // Map token to accessToken
  refreshToken
}
```

### 2. Added Axios Configuration
- Created dedicated axios instance with `withCredentials: true`
- Proper CORS configuration matching backend
- Updated API base URL to `http://localhost:3001/api`

### 3. Enhanced Error Handling
- Added comprehensive error logging in auth thunks
- Better error message extraction from API responses
- Console logs at each step for debugging

### 4. Added API Test Utility
**File**: `src/utils/apiTest.ts`

Run `window.testAPI()` in browser console to test:
- Backend reachability
- CORS configuration
- Login endpoint response

## Testing Instructions

### Step 1: Verify Environment Variables
Check `new-webapp/.env`:
```env
VITE_API_BASE_URL=http://localhost:3001/api
```

### Step 2: Start Backend
```bash
cd backend
npm run start:dev
```

Verify it's running on port 3001:
```
Server listening on http://localhost:3001/api
```

### Step 3: Start Frontend
```bash
cd new-webapp
npm run dev
```

### Step 4: Open Browser Console
Navigate to `http://localhost:5174/login` and open DevTools Console.

You should see:
```
🚀 Cooperative Manager Web App
API URL: http://localhost:3001/api
Run window.testAPI() in console to test API connection
```

### Step 5: Run API Test
In the console, type:
```javascript
window.testAPI()
```

This will test:
1. Backend health check
2. Login endpoint connectivity
3. CORS configuration

### Step 6: Test Login
1. Enter email and password
2. Click "Sign In"
3. Check console for logs:
   - "Login form submitted: { email: '...' }"
   - "Attempting login with: { email: '...' }"
   - "Login response: { success: true, ... }"
   - "Login successful, tokens stored"

### Step 7: Check for Errors

**Common Issues:**

#### Network Error
```
ERR_NETWORK - Network error
```
**Solution**: Backend not running. Start backend server.

#### CORS Error
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solution**: Backend CORS configuration in `backend/src/main.ts` should include:
```typescript
app.enableCors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
})
```

#### 401 Unauthorized
```
Invalid email or password
```
**Solution**: Wrong credentials. Use valid test account or create one.

#### 404 Not Found
```
Cannot POST /api/auth/login
```
**Solution**: 
- Check API base URL in `.env`
- Verify backend route is `/api/auth/login`
- Ensure backend `app.setGlobalPrefix('api')` is set

## Debug Checklist

- [ ] Backend is running on port 3001
- [ ] Frontend `.env` has correct `VITE_API_BASE_URL=http://localhost:3001/api`
- [ ] Backend CORS allows `http://localhost:5174`
- [ ] `window.testAPI()` shows no errors
- [ ] Browser console shows "Attempting login with: ..." when form is submitted
- [ ] No CORS errors in Network tab
- [ ] Login request appears in Network tab
- [ ] Response status is 200 (or 401 for wrong credentials)

## Additional Console Commands

```javascript
// Check stored tokens
localStorage.getItem('token')
localStorage.getItem('auth_token')
localStorage.getItem('auth_user')

// Clear all auth data
localStorage.clear()

// Test direct API call
fetch('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ email: 'test@test.com', password: 'test123' })
}).then(r => r.json()).then(console.log)
```

## Files Modified

1. `new-webapp/src/store/authSlice.ts` - Fixed response mapping and added logging
2. `new-webapp/src/pages/auth/LoginPage.tsx` - Added form submission logging
3. `new-webapp/src/main.tsx` - Added API test utility
4. `new-webapp/src/utils/apiTest.ts` - Created API test utility
5. `new-webapp/.env` - Updated API base URL to port 3001
6. `backend/src/main.ts` - Added CORS configuration (previously done)

## Next Steps

1. Start both servers
2. Run `window.testAPI()` to verify connection
3. Try logging in with valid credentials
4. Check console logs for detailed error information
5. If still failing, share the console logs for further debugging
