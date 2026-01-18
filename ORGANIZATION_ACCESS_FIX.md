# Organization Access Fix - Testing Guide

## Issue Fixed
Users who selected "Organization" during onboarding weren't seeing organization features because:
1. The onboarding preference wasn't integrated with the access control system
2. The system only checked for actual staff role from backend
3. New users couldn't create organizations (chicken-and-egg problem)

## What Was Changed

### 1. UserTypeContext Integration
**File**: `src/contexts/UserTypeContext.tsx`

**Changes**:
- Now loads `user_type_preference` from AsyncStorage
- Grants organization access to users who selected "organization" during onboarding
- Sets default mode to "organization" for users with organization preference
- Allows new users to create their first organization

**Logic**:
```typescript
// Allow organization access if:
// 1. User is actually staff (from backend), OR
// 2. User selected organization in onboarding (to allow creating first org)
const canAccessOrganization = canAccessOrganizationFeatures(user) || 
  (onboardingPreference === 'organization' && authUser !== null);
```

### 2. LandingScreen Organization Features
**File**: `src/screens/home/LandingScreen.tsx`

**Changes**:
- Added organization quick actions section
- Shows "Create Organization", "View Organizations", and "Collections Stats" buttons
- Only visible when `canAccessOrganization` is true
- Added PostOnboardingGuidance component for first-time users

### 3. PostOnboardingGuidance Component
**File**: `src/components/onboarding/PostOnboardingGuidance.tsx`

**What it does**:
- Shows personalized welcome modal on first login
- Different quick actions based on user preference:
  - Organization users: Create Org, Add Staff, View Analytics
  - Cooperative users: Join Coop, Contribute, Request Loan
- Shows only once (saves to AsyncStorage)

## How to Test

### Test 1: New Organization User (Full Flow)
1. **Clear app data** (simulate new user)
   ```bash
   # iOS Simulator: Device → Erase All Content and Settings
   # Android: Settings → Apps → Clear Data
   ```

2. **Launch app and signup**
   - Create new account
   - Complete signup process

3. **Onboarding - Select Organization**
   - Should see UserTypeSelectionScreen
   - Select "Organization/Manager" card
   - View organization-focused slides
   - Complete onboarding

4. **First Login - Verify Post-Onboarding Guidance**
   - After login, should see welcome modal
   - Should show "Welcome, Organization Manager!"
   - Quick actions: Create Organization, Add Staff, View Analytics
   - Dismiss modal

5. **Landing Screen - Verify Organization Features**
   - Should see "Organization Management" section
   - Three quick action buttons:
     - Create Organization ✅
     - View Organizations ✅
     - Collections Stats ✅
   - Tap "Create Organization" → should navigate to creation screen

6. **Create First Organization**
   - Fill in organization details
   - Submit
   - **After creation, you become staff automatically**
   - Should now have full organization access

### Test 2: Verify Access Control
1. **Check current mode**
   - Should default to "organization" mode
   - Look for RoleSwitcher if you also have cooperative membership

2. **Navigate to Organization features**
   - Try: Main Tab → Organizations
   - Should work without AccessDenied screen

3. **Try creating collection**
   - Go to your organization
   - Try to create daily collection
   - Should work (you're staff now)

### Test 3: New Cooperative User (Control Test)
1. **Clear app data again**

2. **Signup and select "Cooperative Member"**
   - View cooperative-focused slides
   - Complete onboarding

3. **First Login**
   - Should see "Welcome to Your Cooperative!" modal
   - Quick actions: Join Coop, Contribute, Request Loan

4. **Landing Screen**
   - Should NOT see "Organization Management" section
   - Should see "Get Started" with cooperative options
   - Cannot access organization features (no staff role)

### Test 4: Existing User (Already Has Onboarding Preference)
1. **User who already completed onboarding**
   - Post-onboarding guidance should NOT show again
   - Landing screen should show appropriate features based on:
     - Their saved preference
     - Their actual role from backend

## Expected Behavior

### For Organization Users (New)
✅ Can see organization quick actions immediately after onboarding  
✅ Can navigate to "Create Organization" screen  
✅ Can create their first organization  
✅ After creating org, become staff automatically  
✅ Get full access to all organization features  
✅ Also have access to cooperative features (super user)

### For Cooperative Users (New)
✅ See cooperative-focused onboarding  
✅ Get cooperative quick actions  
❌ Cannot see organization features (not staff)  
✅ Can join cooperatives  
✅ Can use all cooperative features

### For Existing Staff Users
✅ Have access to everything (organization + cooperative)  
✅ Can switch between modes using RoleSwitcher  
✅ Default to organization mode

### For Existing Cooperative Members
✅ Have access to cooperative features only  
❌ Cannot access organization features  
✅ Stay in cooperative mode

## Troubleshooting

### Issue: Still not seeing organization features
**Check**:
1. Did you complete onboarding and select "Organization"?
   ```javascript
   // In terminal
   AsyncStorage.getItem('user_type_preference')
   // Should return: 'organization'
   ```

2. Is the UserTypeContext loading the preference?
   - Check console logs for "Failed to load preferences"

3. Try force reload:
   - Shake device → Reload
   - Or: `npm run android` / `npm run ios` again

### Issue: Post-onboarding guidance shows every time
**Solution**: Clear the flag
```javascript
AsyncStorage.removeItem('hasSeenPostOnboardingGuidance')
```

### Issue: Organization quick actions not clickable
**Check**:
- Navigation screens exist: `CreateOrganization`, `OrganizationList`, `CollectionsStatistics`
- They're registered in MainNavigator
- No TypeScript errors in navigation types

### Issue: Still getting AccessDenied
**This means**:
- The canAccessOrganization flag isn't true
- Check if onboarding preference was saved
- Verify UserTypeContext is providing correct value

## Verification Checklist

After implementing the fix, verify:
- [ ] New users can select organization type in onboarding
- [ ] Onboarding preference saves to AsyncStorage
- [ ] UserTypeContext loads the preference
- [ ] canAccessOrganization returns true for org preference users
- [ ] Landing screen shows organization quick actions
- [ ] "Create Organization" button navigates correctly
- [ ] Post-onboarding guidance shows appropriate content
- [ ] Guidance only shows once
- [ ] After creating org, user becomes staff
- [ ] Full organization access granted after becoming staff
- [ ] Cooperative users don't see organization features
- [ ] No TypeScript errors

## Success Criteria

✅ **Problem Solved**: New users who select "Organization" during onboarding can immediately:
1. See organization quick actions on landing screen
2. Navigate to "Create Organization" screen
3. Create their first organization
4. Automatically become staff
5. Access all organization features

✅ **Security Maintained**: 
- Cooperative-only users still can't access organization features
- Access control still enforced for actual features
- Creating organization properly creates staff relationship

✅ **UX Improved**:
- Seamless onboarding to first action
- No confusion about "where are my features?"
- Clear path from signup → organization creation → full access

---

**Status**: ✅ Fix Complete
**Files Modified**: 3
**New Features**: Post-onboarding guidance, Organization quick actions
**Testing**: Ready for testing
