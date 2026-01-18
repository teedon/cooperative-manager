# App Segmentation Implementation Plan

## Overview
Implement role-based UI segmentation where:
- **Organization Users** (managers/staff) see: Organization features, Staff management, Daily Collections, Statistics
- **Cooperative Users** (members) see: Cooperative features, Contributions, Loans, Members, etc.
- Users can be **both** - show appropriate features based on context

## Architecture Strategy

### Option 1: Profile-Based Detection (Recommended)
**How it works:**
- On login, fetch user profile with relations (Staff, Member)
- Determine user type(s) from database relations
- Store in Redux state
- Show/hide features based on user type

**Pros:**
- Single source of truth (backend)
- Secure (backend validates permissions)
- Can handle users with multiple roles
- Easy to update without app changes

**Cons:**
- Requires API call on login
- Slightly more complex state management

### Option 2: Context-Based Detection
**How it works:**
- Check user's memberships and staff profiles
- Create UserTypeContext provider
- Consume context in components
- Show/hide features based on context

**Pros:**
- React-native pattern
- Easy to access anywhere in app
- Can cache user type locally

**Cons:**
- Need to sync with backend on changes
- More places to update

### Option 3: Navigation-Based Segmentation (Recommended for your app)
**How it works:**
- Create separate tab navigators for each user type
- On app load, determine user type and show appropriate navigator
- Can switch between modes if user has both roles

**Pros:**
- Clean separation of concerns
- Different UX for different user types
- Easy to test and maintain
- Can have completely different flows

**Cons:**
- More navigation files
- Need to handle role switching

## Recommended Implementation: Hybrid Approach

Combine all three for best UX:

```
1. Profile Detection (Backend)
   ↓
2. Redux State (User Type)
   ↓
3. Context Provider (Easy Access)
   ↓
4. Conditional Navigation (Different Tab Bars)
```

## Step-by-Step Implementation

### Phase 1: Backend API Enhancement
**Files to modify:**
- `backend/src/auth/auth.service.ts` - Enhance `/auth/me` endpoint

**Changes:**
```typescript
// Add to getCurrentUser response
{
  user: {
    id, email, firstName, lastName, ...
    staffProfile?: {  // If user is staff
      organizationId: string,
      role: 'admin' | 'supervisor' | 'agent',
      permissions: string[],
      isActive: boolean
    },
    cooperativeMemberships?: {  // If user is member
      cooperativeId: string,
      cooperativeName: string,
      memberRole: 'admin' | 'moderator' | 'member'
    }[]
  }
}
```

### Phase 2: Frontend Type Definitions
**Files to create/modify:**
- `src/models/UserProfile.ts` - New file for extended user types
- `src/models/index.ts` - Update User interface

**Changes:**
```typescript
// src/models/UserProfile.ts
export interface StaffProfile {
  organizationId: string;
  organizationName: string;
  role: 'admin' | 'supervisor' | 'agent';
  permissions: string[];
  isActive: boolean;
}

export interface CooperativeMembership {
  cooperativeId: string;
  cooperativeName: string;
  memberRole: 'admin' | 'moderator' | 'member';
}

export interface ExtendedUser extends User {
  staffProfile?: StaffProfile;
  cooperativeMemberships?: CooperativeMembership[];
}

export type UserType = 'organization' | 'cooperative' | 'both' | 'none';
```

### Phase 3: User Type Detection Utility
**Files to create:**
- `src/utils/userTypeDetection.ts`

**Content:**
```typescript
export const getUserType = (user: ExtendedUser): UserType => {
  const hasStaffProfile = user.staffProfile && user.staffProfile.isActive;
  const hasCooperatives = user.cooperativeMemberships && user.cooperativeMemberships.length > 0;
  
  if (hasStaffProfile && hasCooperatives) return 'both';
  if (hasStaffProfile) return 'organization';
  if (hasCooperatives) return 'cooperative';
  return 'none';
};

export const canAccessOrganizationFeatures = (user: ExtendedUser): boolean => {
  return user.staffProfile?.isActive === true;
};

export const canAccessCooperativeFeatures = (user: ExtendedUser): boolean => {
  return (user.cooperativeMemberships?.length ?? 0) > 0;
};
```

### Phase 4: Redux State Update
**Files to modify:**
- `src/store/slices/authSlice.ts`
- `src/api/authApi.ts`

**Changes:**
- Update User interface to ExtendedUser
- Fetch extended profile on login/restore
- Store userType in state

### Phase 5: Context Provider (Optional but Recommended)
**Files to create:**
- `src/contexts/UserTypeContext.tsx`

**Content:**
```typescript
interface UserTypeContextValue {
  userType: UserType;
  currentMode: 'organization' | 'cooperative';
  switchMode: (mode: 'organization' | 'cooperative') => void;
  canAccessOrganization: boolean;
  canAccessCooperative: boolean;
}
```

### Phase 6: Navigation Segmentation
**Files to modify:**
- `src/navigation/MainNavigator.tsx` - Update tab bars

**Strategy:**
```typescript
// Conditional tab bar based on user type
{userType === 'organization' && <OrganizationTabBar />}
{userType === 'cooperative' && <CooperativeTabBar />}
{userType === 'both' && <UnifiedTabBar />}
```

**Tab Configuration:**

**Organization Tab Bar:**
- Dashboard (Landing)
- Collections (Daily collections list)
- Staff (Staff management)
- Reports (Statistics & analytics)
- Profile

**Cooperative Tab Bar:**
- Home (Cooperatives list)
- Contributions
- Loans
- Members
- Profile

**Unified Tab Bar (Both roles):**
- Dashboard (Shows both contexts)
- Organizations (Organization features)
- Cooperatives (Cooperative features)
- Profile (With mode switcher)

### Phase 7: Screen-Level Access Control
**Files to modify:**
- All organization-specific screens
- All cooperative-specific screens

**Pattern:**
```typescript
// At top of screen component
const { userType, canAccessOrganization } = useUserType();

if (!canAccessOrganization) {
  return <AccessDeniedScreen />;
}
```

### Phase 8: Landing/Home Screen Update
**Files to modify:**
- `src/screens/home/LandingScreen.tsx`

**Changes:**
- Show different cards based on user type
- Organization users see: My Organizations, Collections Today, Staff Performance
- Cooperative users see: My Cooperatives, Pending Approvals, Activity Feed
- Both users see: Role switcher button

## Implementation Order

### Immediate (Day 1-2):
1. ✅ Create type definitions (Phase 2)
2. ✅ Create user type utility (Phase 3)
3. ✅ Update Redux state (Phase 4)
4. ✅ Create context provider (Phase 5)

### Short-term (Day 3-5):
5. ✅ Update navigation with conditional tabs (Phase 6)
6. ✅ Update LandingScreen for segmentation
7. ✅ Add access control to organization screens (Phase 7)

### Long-term (Week 2):
8. 🔄 Backend API enhancement (Phase 1)
9. 🔄 Test all flows
10. 🔄 Add role switching UI

## File Structure

```
src/
├── models/
│   ├── UserProfile.ts (NEW)
│   └── index.ts (UPDATED)
├── utils/
│   └── userTypeDetection.ts (NEW)
├── contexts/
│   └── UserTypeContext.tsx (NEW)
├── hooks/
│   └── useUserType.ts (NEW)
├── navigation/
│   ├── MainNavigator.tsx (UPDATED)
│   ├── OrganizationTabNavigator.tsx (NEW)
│   ├── CooperativeTabNavigator.tsx (NEW)
│   └── UnifiedTabNavigator.tsx (NEW)
├── screens/
│   ├── home/
│   │   ├── LandingScreen.tsx (UPDATED)
│   │   └── RoleSwitcherScreen.tsx (NEW)
│   ├── organizations/ (PROTECTED)
│   └── cooperative/ (PROTECTED)
└── components/
    ├── AccessDenied.tsx (NEW)
    └── RoleSwitcher.tsx (NEW)
```

## Testing Strategy

### Unit Tests:
- getUserType() with different user profiles
- canAccessOrganizationFeatures()
- canAccessCooperativeFeatures()

### Integration Tests:
- Login as organization user → See organization tabs
- Login as cooperative user → See cooperative tabs
- Login as both → See unified tabs with switcher
- Try accessing protected screen → Show access denied

### Manual Tests:
- [ ] Organization-only user can't see cooperative features
- [ ] Cooperative-only user can't see organization features
- [ ] Dual-role user can switch between modes
- [ ] Navigation persists after app restart
- [ ] Deep links work for both user types

## Security Considerations

1. **Frontend is NOT security** - Always validate on backend
2. Hide UI elements only for UX, not security
3. All API calls must validate permissions on backend
4. Token must include user type/permissions
5. Never trust client-side role detection

## Backward Compatibility

**Existing users:**
- Default to 'cooperative' type (existing behavior)
- Gradually migrate as they join organizations
- No breaking changes to existing features

**Database migration:**
- No schema changes needed (Staff table already exists)
- Just need to fetch relations in /auth/me

## Future Enhancements

1. **Multiple Organizations:**
   - User can be staff in multiple organizations
   - Add organization switcher like cooperative switcher

2. **Permission-Based UI:**
   - Hide features based on specific permissions
   - Not just organization vs cooperative

3. **Hybrid Screens:**
   - Some screens show different content based on user type
   - Example: ProfileScreen shows staff info for org users

4. **Onboarding:**
   - Different onboarding for different user types
   - Explain features relevant to their role

## Rollout Plan

### Phase 1: Foundation (This PR)
- Type definitions
- User type detection
- Context provider
- Basic access control

### Phase 2: Navigation (Next PR)
- Separate tab bars
- Landing screen segmentation
- Role switcher UI

### Phase 3: Backend (Next PR)
- Enhanced /auth/me endpoint
- Permission validation middleware
- Staff profile in JWT

### Phase 4: Polish (Final PR)
- Onboarding per user type
- Deep linking
- Analytics
- Documentation

---

## Decision: Let's Start with Phase 1-2 Today

I'll implement:
1. Type definitions and utilities
2. Context provider
3. Basic navigation segmentation
4. Update LandingScreen

This gives you immediate value without backend changes (we'll mock data temporarily).

Ready to proceed?
