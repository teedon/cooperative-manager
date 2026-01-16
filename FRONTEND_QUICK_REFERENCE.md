# Quick Reference: New Frontend Features

## New Screens Navigation

### From anywhere in the app:
```typescript
// View all organizations
navigation.navigate('OrganizationList');

// Create new organization
navigation.navigate('CreateOrganization');

// View staff for an organization
navigation.navigate('StaffList', { organizationId: 'org-123' });

// View collections statistics
navigation.navigate('CollectionsStatistics', { organizationId: 'org-123' });
```

## API Usage Examples

### Organizations API
```typescript
import { organizationsApi } from '../api/organizationsApi';

// List all organizations
const response = await organizationsApi.getAll();
const organizations = response.data;

// Create organization
const org = await organizationsApi.create({
  name: 'My Organization',
  type: 'manager',
  description: 'Optional description'
});

// Get organization details
const orgDetail = await organizationsApi.getById('org-123');

// List staff
const staffResponse = await organizationsApi.getAllStaff('org-123');
const staff = staffResponse.data;
```

### Collections Statistics API
```typescript
import { collectionsApi } from '../api/collectionsApi';

// Get complete dashboard (recommended)
const dashboard = await collectionsApi.getDashboard('org-123', {
  startDate: '2024-01-01',
  endDate: '2024-12-31'
});

// Or get individual metrics
const orgStats = await collectionsApi.getOrganizationStats('org-123');
const staffStats = await collectionsApi.getStaffStats('org-123', 'staff-456');
const transactionTypes = await collectionsApi.getTransactionTypeStats('org-123');
const rejections = await collectionsApi.getRejectionStats('org-123');
const latency = await collectionsApi.getApprovalLatencyStats('org-123');
const trends = await collectionsApi.getDailyTrends('org-123', 30); // Last 30 days
```

## TypeScript Types

### Organization
```typescript
interface Organization {
  id: string;
  name: string;
  type: 'cooperative' | 'manager';
  description?: string;
  phone?: string;
  email?: string;
  cooperativesCount?: number; // Computed
  staffCount?: number; // Computed
  createdAt: string;
  updatedAt: string;
}
```

### Staff
```typescript
interface Staff {
  id: string;
  organizationId: string;
  userId: string;
  role: 'admin' | 'supervisor' | 'agent';
  permissions: string[];
  isActive: boolean;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}
```

## Permissions

```typescript
import { PERMISSIONS } from '../api/organizationsApi';

// Available permissions
PERMISSIONS.MANAGE_COLLECTIONS   // 'manage_collections'
PERMISSIONS.APPROVE_COLLECTIONS  // 'approve_collections'
PERMISSIONS.VIEW_REPORTS         // 'view_reports'
PERMISSIONS.MANAGE_STAFF         // 'manage_staff'
PERMISSIONS.MANAGE_SETTINGS      // 'manage_settings'
PERMISSIONS.VIEW_AUDIT_LOGS      // 'view_audit_logs'
```

## Common Patterns

### Loading State
```typescript
const [loading, setLoading] = useState(true);
const [data, setData] = useState<Type[]>([]);

const loadData = async () => {
  try {
    setLoading(true);
    const response = await api.getData();
    setData(response.data);
  } catch (err) {
    setError(getErrorMessage(err));
  } finally {
    setLoading(false);
  }
};
```

### Pull to Refresh
```typescript
const [refreshing, setRefreshing] = useState(false);

const handleRefresh = () => {
  setRefreshing(true);
  loadData();
};

// In FlatList
<FlatList
  refreshControl={
    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
  }
/>
```

### Error Handling
```typescript
import { getErrorMessage } from '../utils/errorHandler';

try {
  await api.someOperation();
} catch (err) {
  const message = getErrorMessage(err);
  Alert.alert('Error', message);
}
```

## Adding Links to New Screens

### From CollectionsListScreen
```typescript
// Add button in header or as FAB
<TouchableOpacity 
  onPress={() => navigation.navigate('CollectionsStatistics', { organizationId })}
>
  <Icon name="bar-chart" size={24} />
</TouchableOpacity>
```

### From HomeScreen
```typescript
// Add menu item
<MenuItem
  icon="business"
  title="Organizations"
  subtitle="Manage your organizations"
  onPress={() => navigation.navigate('OrganizationList')}
/>
```

### From CooperativeDetailScreen
```typescript
// Add action button
<TouchableOpacity
  onPress={() => navigation.navigate('StaffList', { 
    organizationId: cooperative.organizationId 
  })}
>
  <Text>Manage Staff</Text>
</TouchableOpacity>
```

## Styling

All screens use the existing theme:
```typescript
import { colors, spacing, borderRadius, shadows } from '../theme';

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.default, // Light gray background
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.md, // 8px
    padding: spacing.md, // 16px
    ...shadows.sm, // Subtle shadow
  },
  primaryButton: {
    backgroundColor: colors.primary.main,
  },
  errorText: {
    color: colors.error.main,
  },
});
```

## Testing Checklist

- [ ] App compiles without TypeScript errors
- [ ] Navigate to OrganizationList screen
- [ ] Create a new organization
- [ ] View organization in list
- [ ] Navigate to StaffList
- [ ] View staff list (if organization has staff)
- [ ] Navigate to CollectionsStatistics
- [ ] View all statistics cards
- [ ] Pull to refresh works on all lists
- [ ] Empty states show when no data
- [ ] Error states show on API failure
- [ ] Back navigation works correctly

## Troubleshooting

### "Cannot read property 'data' of undefined"
Make sure you're accessing the `data` property from API responses:
```typescript
const response = await api.getAll();
const items = response.data; // ✅ Correct
// const items = response; // ❌ Wrong
```

### "Navigation prop is undefined"
Make sure the screen is registered in MainNavigator:
```typescript
<HomeStack.Screen name="ScreenName" component={ScreenComponent} />
```

### "Type X is not assignable to type Y"
Check that your TypeScript types match the API response structure. Use optional chaining for optional fields:
```typescript
item.user?.email // ✅ Correct
item.user.email  // ❌ May error if user is undefined
```

### Theme property doesn't exist
Use only the theme properties that exist:
- ✅ `colors.background.default`, `colors.background.paper`
- ❌ `colors.background.light` (doesn't exist)
- ✅ `spacing['5xl']` for large spacing
- ❌ `spacing.xxl` (doesn't exist)

## Performance Tips

1. **Use FlatList for lists > 20 items**
2. **Memoize expensive computations**:
   ```typescript
   const formatted = useMemo(() => formatData(data), [data]);
   ```
3. **Avoid inline functions in renders**:
   ```typescript
   const handlePress = useCallback(() => {}, []);
   ```
4. **Load data on mount, not in render**:
   ```typescript
   useEffect(() => { loadData(); }, []);
   ```

## Need Help?

- See [FRONTEND_PHASE_7_UPDATES.md](./FRONTEND_PHASE_7_UPDATES.md) for comprehensive documentation
- See [FRONTEND_IMPLEMENTATION_COMPLETE.md](./FRONTEND_IMPLEMENTATION_COMPLETE.md) for completion status
- Check existing screens in `src/screens/` for implementation patterns
- Review API clients in `src/api/` for usage examples
