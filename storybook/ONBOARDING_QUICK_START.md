# Quick Integration Guide - Enhanced Onboarding

## Overview
This guide shows how to integrate the new onboarding system into your app in under 5 minutes.

## Step 1: Verify Installation (Already Done ✅)

The following components are already created:
- ✅ UserTypeSelectionScreen.tsx
- ✅ OrganizationOnboardingFlow.tsx
- ✅ CooperativeOnboardingFlow.tsx
- ✅ OnboardingScreen.tsx (updated)
- ✅ PostOnboardingGuidance.tsx

## Step 2: Add Post-Onboarding Guidance to Landing Screen

### Option A: Add to LandingScreen
Find your `LandingScreen.tsx` and add the component:

```tsx
import PostOnboardingGuidance from '../components/onboarding/PostOnboardingGuidance';

const LandingScreen: React.FC = () => {
  // ... your existing code
  
  return (
    <View style={styles.container}>
      {/* Your existing landing screen UI */}
      
      {/* Add this at the bottom */}
      <PostOnboardingGuidance />
    </View>
  );
};
```

### Option B: Add to Main App Component
If you want it available everywhere, add to `App.tsx`:

```tsx
import PostOnboardingGuidance from './src/components/onboarding/PostOnboardingGuidance';

function App() {
  return (
    <Provider store={store}>
      <NavigationContainer>
        {/* Your navigation */}
        
        {/* Add this at root level */}
        <PostOnboardingGuidance />
      </NavigationContainer>
    </Provider>
  );
}
```

## Step 3: Test the Flow

### Test as New User
```bash
# Clear app data to simulate new user
# On iOS Simulator
Device → Erase All Content and Settings

# On Android Emulator
Settings → Apps → CooperativeManager → Clear Data

# Or programmatically in your app
import AsyncStorage from '@react-native-async-storage/async-storage';
await AsyncStorage.multiRemove([
  'hasSeenOnboarding',
  'user_type_preference',
  'hasSeenPostOnboardingGuidance'
]);
```

### Test Organization Flow
1. Launch app
2. Select "Organization/Manager"
3. View 5 organization-focused slides
4. Tap "Get Started"
5. Should show post-onboarding guidance with organization quick actions

### Test Cooperative Flow
1. Clear data again
2. Launch app
3. Select "Cooperative Member"
4. View 5 cooperative-focused slides
5. Tap "Get Started"
6. Should show post-onboarding guidance with cooperative quick actions

### Test Skip Flow
1. Clear data again
2. Launch app
3. Tap "Skip" on selection screen
4. Should default to cooperative flow

## Step 4: Optional Customizations

### Change Default Flow When Skipping
In `OnboardingScreen.tsx`:

```tsx
const handleSkipSelection = () => {
  // Change 'cooperative-flow' to 'organization-flow' if you want
  setCurrentStep('cooperative-flow'); 
};
```

### Modify Slide Content
In `OrganizationOnboardingFlow.tsx` or `CooperativeOnboardingFlow.tsx`:

```tsx
const slides: SlideItem[] = [
  {
    key: 'your-key',
    title: 'Your Title',
    description: 'Your description',
    icon: 'your-icon', // any lucide-react-native icon
    iconColor: colors.primary.main,
    iconBg: colors.primary.light,
    steps: [
      'Step 1',
      'Step 2',
      'Step 3',
    ],
  },
  // Add more slides...
];
```

### Add More Quick Actions
In `PostOnboardingGuidance.tsx`:

```tsx
const organizationActions: QuickAction[] = [
  // ... existing actions
  {
    title: 'Your New Action',
    description: 'Description',
    icon: 'icon-name',
    iconColor: colors.primary.main,
    iconBg: colors.primary.light,
    screenName: 'YourScreen',
  },
];
```

### Disable Post-Onboarding Guidance
If you don't want the guidance modal:

```tsx
// Just don't import/add PostOnboardingGuidance component
// The main onboarding will still work perfectly
```

## Step 5: Navigation Integration

Ensure these screens exist in your navigation:

### Organization Screens
- `CreateOrganization`
- `OrganizationList`
- `CollectionsStatistics`

### Cooperative Screens
- `CooperativesList`
- `Contributions`
- `Loans`

If screen names differ, update in `PostOnboardingGuidance.tsx`:

```tsx
const organizationActions: QuickAction[] = [
  {
    // ...
    screenName: 'YourActualScreenName', // Change this
  },
];
```

## Step 6: Verify Everything Works

### Checklist
- [ ] User type selection appears for new users
- [ ] Organization flow shows correct 5 slides
- [ ] Cooperative flow shows correct 5 slides
- [ ] Skip button works on selection
- [ ] Skip button works in flows
- [ ] Get Started completes onboarding
- [ ] Post-onboarding guidance appears on login
- [ ] Quick actions navigate to correct screens
- [ ] Guidance only shows once
- [ ] hasSeenOnboarding prevents repeat onboarding

## Common Issues & Solutions

### Issue: Onboarding Doesn't Show
**Solution**: Clear AsyncStorage key `hasSeenOnboarding`

```tsx
await AsyncStorage.removeItem('hasSeenOnboarding');
```

### Issue: Wrong Flow Shows
**Solution**: Check user type preference

```tsx
const pref = await AsyncStorage.getItem('user_type_preference');
console.log('User preference:', pref);
```

### Issue: Guidance Shows Every Time
**Solution**: Clear the flag to test, it should save automatically

```tsx
await AsyncStorage.removeItem('hasSeenPostOnboardingGuidance');
```

### Issue: Navigation Doesn't Work
**Solution**: Verify screen names match your navigation stack

```tsx
// Check your MainNavigator.tsx or RootNavigator.tsx
<Stack.Screen name="CreateOrganization" ... />
// Name must match exactly in PostOnboardingGuidance
```

### Issue: Icons Don't Show
**Solution**: Verify icon names are from lucide-react-native

```tsx
// Valid icons: business, people, cash, wallet, etc.
// See: https://lucide.dev/icons/
```

## Performance Notes

- Onboarding screens are loaded on-demand
- AsyncStorage reads are async but fast
- No impact on app startup time
- Post-onboarding guidance lazy loads
- All images/icons are SVG (lightweight)

## Accessibility

The onboarding is accessible by default:
- ✅ Touch targets are 44pt minimum
- ✅ Text contrast meets WCAG AA standards
- ✅ Skip buttons for users who want to bypass
- ✅ Clear, simple language
- ✅ Logical tab order

## Analytics Integration (Optional)

Track onboarding events:

```tsx
// In UserTypeSelectionScreen.tsx
const handleUserTypeSelected = async (userType: UserTypeSelection) => {
  // Add your analytics
  analytics.track('Onboarding_UserTypeSelected', { type: userType });
  
  // ... rest of the code
};

// In OrganizationOnboardingFlow.tsx
const handleDone = async () => {
  analytics.track('Onboarding_Completed', { flow: 'organization' });
  onComplete();
};

// In PostOnboardingGuidance.tsx
const handleActionPress = (screenName: string) => {
  analytics.track('PostOnboarding_QuickActionClicked', { screen: screenName });
  // ... rest of the code
};
```

## What's Next?

After integration:
1. Test with real users
2. Collect analytics
3. Iterate on slide content based on feedback
4. Monitor completion rates
5. A/B test different flows

## Need Help?

See comprehensive documentation:
- `ENHANCED_ONBOARDING_SYSTEM.md` - Full system overview
- `ONBOARDING_ENHANCEMENT_SUMMARY.md` - Implementation details
- `SEGMENTATION_ACCESS_MODEL.md` - How it fits with user types

---

**Ready to Go!** 🚀

Your enhanced onboarding is ready. Just add PostOnboardingGuidance to your landing screen and you're done!
