# App Segmentation - Access Control Model

## 🔑 Access Hierarchy

### Organization Users (Staff/Managers) - **SUPER USERS**
✅ **Full Access to Everything:**
- ✅ Organization management features
- ✅ Staff management
- ✅ Daily collections
- ✅ Analytics & statistics
- ✅ **PLUS** All cooperative features:
  - ✅ Loans
  - ✅ Contributions & savings
  - ✅ Member activities
  - ✅ Cooperative management

**Permissions:** Complete access to manage organizations AND participate in cooperatives

### Cooperative Users (Members) - **RESTRICTED**
✅ **Access to Cooperative Features Only:**
- ✅ Cooperatives
- ✅ Contributions & savings
- ✅ Loans
- ✅ Member activities
- ✅ Group buys

❌ **NO Access to Organization Features:**
- ❌ Organization management
- ❌ Staff management
- ❌ Daily collections
- ❌ Organization analytics

**Permissions:** Limited to cooperative member activities only

## 🎯 User Type Matrix

| User Type | Has Staff Profile | Has Coop Memberships | Can See Org Features | Can See Coop Features | Default Mode |
|-----------|------------------|---------------------|---------------------|----------------------|--------------|
| **Organization** | ✅ Yes | ❌ No | ✅ Yes | ✅ Yes | Organization |
| **Both** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | Organization |
| **Cooperative** | ❌ No | ✅ Yes | ❌ No | ✅ Yes | Cooperative |
| **None** | ❌ No | ❌ No | ❌ No | ❌ No | - |

## 🔐 Access Control Rules

### Rule 1: Organization Users See Everything
```typescript
// Organization users can access ALL features
if (user.staffProfile?.isActive) {
  // Can access organization features
  navigation.navigate('OrganizationList'); ✅
  navigation.navigate('StaffList'); ✅
  navigation.navigate('CollectionsList'); ✅
  
  // Can ALSO access cooperative features
  navigation.navigate('Home'); // Cooperatives ✅
  navigation.navigate('LoanRequest'); ✅
  navigation.navigate('ContributionPlan'); ✅
}
```

### Rule 2: Cooperative Users Are Restricted
```typescript
// Cooperative users can ONLY access cooperative features
if (!user.staffProfile && user.cooperativeMemberships?.length > 0) {
  // Can access cooperative features
  navigation.navigate('Home'); // Cooperatives ✅
  navigation.navigate('LoanRequest'); ✅
  navigation.navigate('ContributionPlan'); ✅
  
  // CANNOT access organization features
  navigation.navigate('OrganizationList'); ❌ // Shows AccessDenied
  navigation.navigate('StaffList'); ❌ // Shows AccessDenied
  navigation.navigate('CollectionsList'); ❌ // Shows AccessDenied
}
```

## 📱 UI Behavior

### Organization Mode (Staff Users)
**Shows ALL Features:**
```
┌─────────────────────────────┐
│ 🏢 Organization Mode        │
├─────────────────────────────┤
│ Organization Features:      │
│ • Organizations             │
│ • Daily Collections         │
│ • Staff Management          │
│ • Analytics & Reports       │
│                             │
│ Cooperative Features:       │
│ • Cooperatives              │
│ • Loans                     │
│ • Contributions             │
│ • Member Activities         │
└─────────────────────────────┘
```

### Cooperative Mode (Regular Members)
**Shows Only Cooperative Features:**
```
┌─────────────────────────────┐
│ 👥 Cooperative Mode         │
├─────────────────────────────┤
│ Cooperative Features:       │
│ • Cooperatives              │
│ • Loans                     │
│ • Contributions             │
│ • Member Activities         │
│ • Savings & Group Buys      │
│                             │
│ ❌ No Organization Access   │
└─────────────────────────────┘
```

### Both Roles (Staff + Member)
**Organization users with cooperative memberships see everything with optional mode toggle:**
```
┌─────────────────────────────┐
│ 🔄 [Org Mode | Coop Mode]   │
├─────────────────────────────┤
│ In Org Mode:                │
│ • All Organization features │
│ • All Cooperative features  │
│                             │
│ In Coop Mode:               │
│ • Only Cooperative features │
│ (Simplified view)           │
└─────────────────────────────┘
```

## 🎨 Landing Screen Layout

### For Organization Users:
```
Good morning, John 👋
Manage your organizations, staff, and all cooperative activities

[🔄 Organization Mode | Cooperative Mode] (if has both)

┌──────────────┐  ┌──────────────┐
│ Organizations│  │  Collections │
│      5       │  │    Today     │
└──────────────┘  └──────────────┘

┌──────────────┐  ┌──────────────┐
│    Staff     │  │   Analytics  │
│     Team     │  │   & Reports  │
└──────────────┘  └──────────────┘

┌──────────────┐  ┌──────────────┐
│ Cooperatives │  │    Loans     │
│      3       │  │      12      │
└──────────────┘  └──────────────┘

┌──────────────┐  ┌──────────────┐
│Contributions │  │   Members    │
│   Activity   │  │   Activity   │
└──────────────┘  └──────────────┘
```

### For Cooperative Users:
```
Good morning, Jane 👋
Manage your cooperatives, contributions, and loans

┌──────────────┐  ┌──────────────┐
│ Cooperatives │  │  Guarantor   │
│      2       │  │   Requests   │
└──────────────┘  └──────────────┘

┌──────────────┐  ┌──────────────┐
│    Loans     │  │Contributions │
│      5       │  │   & Savings  │
└──────────────┘  └──────────────┘
```

## 🚦 Navigation Flow

### Organization User Journey
```
Login → Profile Check
       ↓
   Has Staff Profile?
       ↓ YES
   Organization Mode (Default)
       ↓
   Full Access:
   • Manage Organizations
   • Manage Staff
   • View Collections
   • Access Analytics
   • Participate in Cooperatives
   • Request/Manage Loans
   • Make Contributions
```

### Cooperative User Journey
```
Login → Profile Check
       ↓
   Has Staff Profile?
       ↓ NO
   Cooperative Mode (Only Option)
       ↓
   Restricted Access:
   • Join/View Cooperatives
   • Request/Manage Loans
   • Make Contributions
   • View Member Activities
   ❌ Cannot access org features
```

## 🔧 Implementation Guide

### Protect Organization Screens
```typescript
// Add to ALL organization-specific screens
import { useUserType } from '../../contexts/UserTypeContext';
import AccessDenied from '../../components/AccessDenied';

const OrganizationScreen: React.FC = () => {
  const { canAccessOrganization } = useUserType();
  
  if (!canAccessOrganization) {
    return <AccessDenied 
      message="Only organization staff can access this feature." 
    />;
  }
  
  // Rest of component for authorized users
};
```

### Show Organization Features in Landing
```typescript
const { canAccessOrganization } = useUserType();

// Organization users see ALL features
{canAccessOrganization && (
  <>
    {/* Organization-specific features */}
    <FeatureCard title="Organizations" onPress={...} />
    <FeatureCard title="Staff" onPress={...} />
    <FeatureCard title="Collections" onPress={...} />
    <FeatureCard title="Analytics" onPress={...} />
    
    {/* PLUS all cooperative features */}
    <FeatureCard title="Cooperatives" onPress={...} />
    <FeatureCard title="Loans" onPress={...} />
    <FeatureCard title="Contributions" onPress={...} />
  </>
)}

// Cooperative users see ONLY cooperative features
{!canAccessOrganization && (
  <>
    <FeatureCard title="Cooperatives" onPress={...} />
    <FeatureCard title="Loans" onPress={...} />
    <FeatureCard title="Contributions" onPress={...} />
  </>
)}
```

### Mode Switcher (Optional for Organization Users)
```typescript
// Organization users with cooperative memberships can switch views
{userType === 'both' && (
  <RoleSwitcher />
)}

// In Organization Mode: See everything (org + coop features)
// In Cooperative Mode: See only cooperative features (simpler view)
```

## 🎯 Benefits of This Model

### For Organizations (Staff)
✅ **Complete Control**: Manage both organization operations and cooperative activities
✅ **Unified View**: No need to switch accounts to participate in cooperatives
✅ **Operational Efficiency**: Oversee collections while managing loans/contributions
✅ **Comprehensive Analytics**: See both organizational and member-level insights

### For Cooperatives (Members)
✅ **Simple Interface**: Only see relevant features
✅ **No Confusion**: Organization management hidden from view
✅ **Focused Experience**: Dedicated to member activities
✅ **Clean Navigation**: Fewer menu items, clearer purpose

## 🔍 Testing Scenarios

### Test 1: Organization User (Staff Only)
```typescript
staffProfile: { isActive: true }
cooperativeMemberships: []

Expected:
✅ Can access organization features
✅ Can access cooperative features
✅ No role switcher (only organization mode)
✅ Sees all feature cards on landing
```

### Test 2: Organization User with Memberships
```typescript
staffProfile: { isActive: true }
cooperativeMemberships: [{ cooperativeId: '...' }]

Expected:
✅ Can access organization features
✅ Can access cooperative features
✅ Sees role switcher (optional simplified view)
✅ Organization mode: All features
✅ Cooperative mode: Only cooperative features (filtered view)
```

### Test 3: Cooperative User (Member Only)
```typescript
staffProfile: undefined
cooperativeMemberships: [{ cooperativeId: '...' }]

Expected:
✅ Can access cooperative features only
❌ Cannot access organization features (Access Denied)
❌ No role switcher
✅ Sees only cooperative cards on landing
```

## 📋 Quick Reference

| Action | Organization User | Cooperative User |
|--------|------------------|------------------|
| View Organizations | ✅ | ❌ Access Denied |
| Manage Staff | ✅ | ❌ Access Denied |
| Daily Collections | ✅ | ❌ Access Denied |
| View Analytics | ✅ | ❌ Access Denied |
| Join Cooperatives | ✅ | ✅ |
| Request Loans | ✅ | ✅ |
| Make Contributions | ✅ | ✅ |
| View Members | ✅ | ✅ |
| Savings & Ajo | ✅ | ✅ |
| Group Buys | ✅ | ✅ |

---

## ✅ Summary

**Organization Users = Super Users**
- Full access to organization management
- Full access to cooperative features
- Can do everything in the app

**Cooperative Users = Regular Members**
- Access only to cooperative features
- Restricted from organization management
- Focused member experience

This creates a clear hierarchy where organization staff have elevated permissions to manage operations while still participating in cooperative activities, and regular members have a clean, focused experience without organizational complexity.
