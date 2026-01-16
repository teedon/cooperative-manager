# Quick Start: Test App Segmentation Now

## ✅ What's Already Working

Your app now has a **complete role-based segmentation system** ready to use!

## 🚀 Test It Immediately (5 Minutes)

### Step 1: Mock a Dual-Role User

The app currently mocks all users as having both roles (organization + cooperative). This means you'll see the role switcher when you run the app.

### Step 2: Run the App
```bash
# Start metro bundler
npm start

# In another terminal, run on Android
npm run android

# Or iOS
npm run ios
```

### Step 3: See It in Action

1. **Login** to the app
2. **Navigate to Landing screen** (home tab)
3. **Look for the Role Switcher** at the top (organization/cooperative toggle)
4. **Tap to switch modes** - Notice the subtitle changes
5. **Navigate to Organizations** 
   ```typescript
   // From anywhere in the app
   navigation.navigate('OrganizationList')
   ```

## 🎭 Test Different User Types

### Test 1: User with BOTH Roles (Default)

File: `/src/utils/userTypeDetection.ts`

```typescript
export const mockExtendUser = (user: any): ExtendedUser => {
  return {
    ...user,
    // Has cooperative memberships
    cooperativeMemberships: [
      { 
        cooperativeId: 'coop1',
        cooperativeName: 'Test Cooperative', 
        memberRole: 'admin' 
      }
    ],
    // Has staff profile
    staffProfile: {
      id: 'staff1',
      organizationId: 'org1',
      organizationName: 'Test Organization',
      role: 'admin',
      permissions: ['manage_collections', 'approve_collections'],
      isActive: true,
    },
  };
};
```

**Expected Result:**
- ✅ See role switcher
- ✅ Can switch between organization and cooperative modes
- ✅ Different subtitle in each mode
- ✅ Can access organization screens
- ✅ Can access cooperative screens

### Test 2: Organization-Only User

Change `mockExtendUser()` to:
```typescript
export const mockExtendUser = (user: any): ExtendedUser => {
  return {
    ...user,
    // NO cooperative memberships
    cooperativeMemberships: [],
    // HAS staff profile
    staffProfile: {
      id: 'staff1',
      organizationId: 'org1',
      organizationName: 'Test Organization',
      role: 'admin',
      permissions: ['manage_collections', 'approve_collections'],
      isActive: true,
    },
  };
};
```

**Expected Result:**
- ❌ No role switcher (only has one role)
- ✅ Locked to organization mode
- ✅ Subtitle shows "Manage your organizations..."
- ✅ Can access organization features
- ❌ Cannot access cooperative features

### Test 3: Cooperative-Only User (Existing Users)

Change `mockExtendUser()` to:
```typescript
export const mockExtendUser = (user: any): ExtendedUser => {
  return {
    ...user,
    // HAS cooperative memberships
    cooperativeMemberships: [
      { cooperativeId: 'coop1', cooperativeName: 'Test Coop', memberRole: 'member' }
    ],
    // NO staff profile
    // staffProfile: undefined, (or just omit it)
  };
};
```

**Expected Result:**
- ❌ No role switcher
- ✅ Locked to cooperative mode (existing behavior)
- ✅ Subtitle shows "Manage your cooperatives..."
- ✅ Can access cooperative features
- ❌ Cannot access organization features (will see Access Denied)

### Test 4: New User (No Roles)

Change `mockExtendUser()` to:
```typescript
export const mockExtendUser = (user: any): ExtendedUser => {
  return {
    ...user,
    cooperativeMemberships: [],
    // NO roles at all
  };
};
```

**Expected Result:**
- ❌ No role switcher
- ✅ See "Welcome to Cooperative Manager!" message
- ✅ Prompt to join cooperative or create organization

## 🔒 Test Access Control

### Test Organization Screen Protection

1. **Mock as cooperative-only user** (Test 3 above)
2. **Try to navigate to organization screen:**
   ```typescript
   navigation.navigate('OrganizationList')
   ```
3. **Expected:** See "Access Denied" screen with lock icon
4. **Tap "Go Back"** - Returns to previous screen

To enable access control, add this to any organization screen:

```typescript
import { useUserType } from '../../contexts/UserTypeContext';
import AccessDenied from '../../components/AccessDenied';

const YourScreen: React.FC = () => {
  const { canAccessOrganization } = useUserType();
  
  if (!canAccessOrganization) {
    return <AccessDenied />;
  }
  
  // ... rest of component
};
```

## 🎨 Customize the Experience

### Change Role Switcher Style

File: `/src/components/RoleSwitcher.tsx`

**Use compact version:**
```typescript
<RoleSwitcher compact />
```

**Use full version (default):**
```typescript
<RoleSwitcher />
```

### Add to Profile Screen

```typescript
// In ProfileScreen.tsx
import RoleSwitcher from '../../components/RoleSwitcher';
import { useUserType } from '../../contexts/UserTypeContext';

// In render:
const { userType } = useUserType();

{userType === 'both' && (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Switch Mode</Text>
    <RoleSwitcher />
  </View>
)}
```

### Add to Header

```typescript
// In navigation header
import RoleSwitcher from '../components/RoleSwitcher';

// In screen options:
headerRight: () => (
  <View style={{ marginRight: 16 }}>
    <RoleSwitcher compact />
  </View>
),
```

## 📱 Navigation Examples

### From Anywhere to Organization Features

```typescript
import { useNavigation } from '@react-navigation/native';
import { useUserType } from '../../contexts/UserTypeContext';

const MyComponent = () => {
  const navigation = useNavigation();
  const { canAccessOrganization, switchMode } = useUserType();
  
  const handleOrganizations = () => {
    if (canAccessOrganization) {
      switchMode('organization'); // Switch to org mode
      navigation.navigate('OrganizationList');
    } else {
      Alert.alert('Access Denied', 'You need to be a staff member');
    }
  };
  
  return (
    <Button title="Organizations" onPress={handleOrganizations} />
  );
};
```

### From Organization to Cooperative

```typescript
const handleCooperatives = () => {
  if (canAccessCooperative) {
    switchMode('cooperative'); // Switch to coop mode
    navigation.navigate('Home');
  }
};
```

## 🔍 Debug User Type

Add this to any screen to see current state:

```typescript
import { useUserType } from '../../contexts/UserTypeContext';

const DebugPanel = () => {
  const { 
    userType, 
    currentMode, 
    canAccessOrganization, 
    canAccessCooperative,
    user 
  } = useUserType();
  
  return (
    <View style={{ padding: 10, backgroundColor: '#f0f0f0' }}>
      <Text>User Type: {userType}</Text>
      <Text>Current Mode: {currentMode}</Text>
      <Text>Can Access Org: {canAccessOrganization ? 'Yes' : 'No'}</Text>
      <Text>Can Access Coop: {canAccessCooperative ? 'Yes' : 'No'}</Text>
      {user?.staffProfile && (
        <Text>Org: {user.staffProfile.organizationName}</Text>
      )}
    </View>
  );
};
```

## ✅ Verification Checklist

- [ ] App compiles without errors ✅ (Already verified)
- [ ] UserTypeProvider wraps the app ✅ (Already done)
- [ ] Can see role switcher for dual-role users
- [ ] Switching modes changes subtitle text
- [ ] Organization screens accessible in org mode
- [ ] Access Denied shows for unauthorized access
- [ ] Mode persists after app restart
- [ ] Different mocks show different behaviors

## 🎯 Next Steps After Testing

### 1. Update Landing Screen
Show different feature cards based on mode (see SEGMENTATION_STATUS.md)

### 2. Add Access Control to All Organization Screens
Add 3 lines to each screen:
```typescript
const { canAccessOrganization } = useUserType();
if (!canAccessOrganization) return <AccessDenied />;
```

### 3. Update Tab Navigator
Show different tabs for different modes

### 4. Connect to Real Backend
Update `/auth/me` endpoint to return staffProfile and cooperativeMemberships

## 🐛 Troubleshooting

### Role Switcher Not Showing
- Check user has both roles in mockExtendUser()
- Verify UserTypeProvider wraps app (in App.tsx)
- Check RoleSwitcher is imported correctly

### Access Denied Always Shows
- Check canAccessOrganization/canAccessCooperative values
- Verify mock data has correct structure
- Check staffProfile.isActive is true

### Mode Not Persisting
- Check AsyncStorage permissions
- Verify switchMode() is being called
- Check console for errors

### TypeScript Errors
All code is TypeScript compliant. If you see errors:
- Run `npm install` (might be missing dependencies)
- Restart TypeScript server in VS Code
- Check import paths are correct

## 💡 Pro Tips

1. **Use Debug Panel** during development to see live state
2. **Test each user type** before implementing UI changes
3. **Mock different organizations** to test staff assignments
4. **Add console.logs** in useUserType hook to track mode changes
5. **Clear AsyncStorage** between tests: `await AsyncStorage.clear()`

---

**Ready to test?** Just run `npm start` and see the segmentation in action! 🚀

The foundation is complete. Now you can build the rest incrementally based on your user feedback.
