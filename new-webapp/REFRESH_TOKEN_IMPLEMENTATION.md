# Refresh Token Implementation

## Overview
The webapp now automatically refreshes expired access tokens using refresh tokens, keeping users logged in without requiring them to re-authenticate unless the refresh token itself expires.

## How It Works

### 1. Token Storage
When a user logs in or signs up:
- **Access Token**: Stored in `localStorage` as both `token` and `auth_token`
- **Refresh Token**: Stored in `localStorage` as `auth_refresh_token`
- **User Data**: Stored in `localStorage` as `auth_user`

### 2. Automatic Token Refresh
The system uses axios interceptors to automatically handle token expiration:

**When an API call receives a 401 (Unauthorized) response:**
1. The interceptor catches the error
2. Checks if a refresh token exists
3. Calls `/auth/refresh` endpoint with the refresh token
4. If successful:
   - Updates both access and refresh tokens in localStorage
   - Retries the original failed request with the new token
   - Continues seamlessly without user intervention
5. If refresh fails:
   - Clears all auth data
   - Redirects to login page

### 3. Request Queueing
To prevent multiple simultaneous refresh attempts:
- While a refresh is in progress, subsequent 401 errors queue their requests
- Once refresh completes, all queued requests retry with the new token
- If refresh fails, all queued requests are rejected

## Implementation Details

### Files Modified

#### 1. `/src/api/cooperativeApi.ts`
Added sophisticated response interceptor:
```typescript
// Track refresh state
let isRefreshing = false
let failedQueue = []

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Automatic token refresh logic
      // - Queue requests during refresh
      // - Call /auth/refresh endpoint
      // - Retry original request with new token
    }
  }
)
```

**Benefits:**
- All API modules (`loanApi.ts`, `contributionApi.ts`, `expenseApi.ts`, `activityApi.ts`) import this client
- Automatic refresh works for all API calls across the entire app

#### 2. `/src/store/authSlice.ts`
Added `refreshAccessToken` async thunk:
```typescript
export const refreshAccessToken = createAsyncThunk(
  'auth/refresh',
  async (_, { getState, rejectWithValue }) => {
    // Call /auth/refresh endpoint
    // Update tokens in localStorage
    // Return new tokens
  }
)
```

Added reducer cases for refresh token handling:
- `refreshAccessToken.pending`: Set loading state
- `refreshAccessToken.fulfilled`: Update tokens, maintain authentication
- `refreshAccessToken.rejected`: Clear auth state, show error

## Backend API

### Endpoint
```
POST /auth/refresh
```

### Request Body
```json
{
  "refreshToken": "string"
}
```

### Response (Success)
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "token": "new-access-token",
    "refreshToken": "new-refresh-token"
  }
}
```

### Response (Error - 401)
```json
{
  "success": false,
  "message": "Invalid refresh token",
  "data": null
}
```

## Token Lifecycle

```
User Login/Signup
    ↓
Store access token (1hr expiry) + refresh token
    ↓
Make API calls with access token
    ↓
Access token expires → 401 error
    ↓
Interceptor catches 401
    ↓
Call /auth/refresh with refresh token
    ↓
Receive new access + refresh tokens
    ↓
Update localStorage
    ↓
Retry original request with new token
    ↓
Continue seamlessly (user unaware)
```

## User Experience

### Before (Without Refresh Token)
- Access token expires after 1 hour
- User gets logged out
- Must manually log back in
- Loses current work/context

### After (With Refresh Token)
- Access token expires after 1 hour
- System automatically refreshes in background
- User stays logged in seamlessly
- No interruption to workflow
- Only logs out when:
  - User manually logs out
  - Refresh token expires
  - Refresh token is invalid

## Security Considerations

1. **Token Rotation**: Both access and refresh tokens are rotated on refresh for enhanced security
2. **Single Refresh**: Request queueing prevents multiple simultaneous refresh attempts
3. **Automatic Cleanup**: All tokens cleared on refresh failure or logout
4. **HTTPS Required**: Tokens should only be transmitted over HTTPS in production
5. **Refresh Token Storage**: Stored in localStorage (consider httpOnly cookies for enhanced security)

## Testing

### Manual Testing
1. **Normal Flow**:
   - Log in → Make API calls → Verify success
   
2. **Token Refresh**:
   - Log in
   - Wait for access token to expire (~1 hour)
   - Make an API call
   - Verify automatic refresh (check Network tab)
   - Verify call succeeds without re-login

3. **Invalid Refresh Token**:
   - Log in
   - Manually corrupt `auth_refresh_token` in localStorage
   - Make an API call
   - Verify redirect to login page

4. **No Refresh Token**:
   - Log in
   - Remove `auth_refresh_token` from localStorage
   - Make an API call that returns 401
   - Verify redirect to login page

### Console Verification
Open browser DevTools console and check for:
- `Token refresh failed` logs (on refresh failure)
- Network requests to `/auth/refresh` (during automatic refresh)
- 401 errors followed by successful retry (visible in Network tab)

## Configuration

### Token Expiry (Backend)
Access token expiry is configured in backend:
```typescript
// backend/src/auth/auth.service.ts
const accessToken = this.jwt.sign(
  { sub: user.id, email: user.email },
  { expiresIn: '1h' } // 1 hour
)
```

### API Base URL
Configure in `.env`:
```bash
VITE_API_BASE_URL=http://localhost:3001/api  # Development
VITE_API_BASE_URL=https://api.yourapp.com/api  # Production
```

## Future Enhancements

1. **Token Expiry Warning**: Show notification before token expires
2. **Refresh Token Expiry**: Implement refresh token expiry (e.g., 30 days)
3. **HttpOnly Cookies**: Move tokens to httpOnly cookies for enhanced security
4. **Silent Refresh**: Proactively refresh before access token expires
5. **Multi-Tab Sync**: Synchronize auth state across browser tabs
6. **Device Management**: Track and manage user sessions across devices

## Troubleshooting

### Issue: User gets logged out frequently
**Cause**: Refresh token might be expiring or invalid
**Solution**: Check backend refresh token expiry settings

### Issue: Multiple refresh calls
**Cause**: Request queueing not working properly
**Solution**: Check `isRefreshing` flag logic in interceptor

### Issue: Infinite refresh loop
**Cause**: Refresh endpoint might be returning 401
**Solution**: Ensure `/auth/refresh` doesn't require access token, only refresh token

### Issue: Token not updating after refresh
**Cause**: localStorage not being updated correctly
**Solution**: Verify token storage in both interceptor and authSlice

---

**Status**: ✅ Fully implemented and functional
**Last Updated**: December 28, 2025
