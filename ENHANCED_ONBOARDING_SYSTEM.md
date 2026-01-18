# Enhanced Onboarding System

## Overview
The onboarding system has been completely redesigned to provide personalized guidance based on user intent. Users select their type (organization manager or cooperative member) and receive tailored onboarding content.

## Architecture

### Components

#### 1. **OnboardingScreen.tsx** (Main Orchestrator)
- Entry point for the onboarding flow
- Manages navigation between different onboarding steps
- Handles AsyncStorage persistence for:
  - `user_type_preference`: 'organization' | 'cooperative'
  - `hasSeenOnboarding`: 'true' when complete

**Flow States:**
- `selection`: User type selection screen
- `organization-flow`: Organization-specific onboarding
- `cooperative-flow`: Cooperative-specific onboarding

#### 2. **UserTypeSelectionScreen.tsx**
- First step in onboarding
- Presents two distinct options with visual cards:
  - **Organization/Manager**: For staff managing organizations and collections
  - **Cooperative Member**: For members participating in cooperatives

**Features:**
- Radio button selection
- Feature lists for each type
- Skip option (defaults to cooperative flow)
- Informational note about changing later
- Saves preference to AsyncStorage

#### 3. **OrganizationOnboardingFlow.tsx**
- 5-slide guided tour for organization managers
- **Slides:**
  1. Create Your Organization
  2. Build Your Team (Staff Management)
  3. Manage Daily Collections
  4. Track Performance (Analytics)
  5. Full Cooperative Access

**Key Information:**
- Step-by-step instructions for each feature
- Emphasizes organization users have access to ALL features
- Guides through: Organization setup → Staff addition → Collections → Analytics

#### 4. **CooperativeOnboardingFlow.tsx**
- 5-slide guided tour for cooperative members
- **Slides:**
  1. Join a Cooperative
  2. Make Contributions
  3. Request Loans
  4. Grow Your Savings (Ajo/Esusu)
  5. Stay Connected (Community)

**Key Information:**
- Step-by-step instructions for member activities
- Focuses on: Joining → Contributing → Loans → Savings → Community

## User Experience Flow

### Initial Onboarding Journey

```
1. App Launch (New User)
   ↓
2. OnboardingScreen renders
   ↓
3. UserTypeSelectionScreen
   ├─ User selects "Organization" → OrganizationOnboardingFlow
   ├─ User selects "Cooperative" → CooperativeOnboardingFlow
   └─ User skips → CooperativeOnboardingFlow (default)
   ↓
4. Appropriate flow completes
   ↓
5. Save hasSeenOnboarding = 'true'
   ↓
6. Navigate to Auth/Login
```

### Post-Onboarding Guidance

After onboarding completes, the app can read `user_type_preference` from AsyncStorage to:
- Show personalized welcome messages
- Highlight relevant first actions
- Provide contextual quick-start tips

## AsyncStorage Keys

### Onboarding-Related Keys
1. **`hasSeenOnboarding`**: `'true'` | `undefined`
   - Set when user completes any onboarding flow
   - Checked by RootNavigator to show/hide onboarding

2. **`user_type_preference`**: `'organization'` | `'cooperative'` | `undefined`
   - Set when user selects their type
   - Used for personalized guidance post-onboarding
   - Can be updated later if user changes role

## Integration with Existing Systems

### User Type Context Integration
The onboarding preference complements but doesn't replace the UserTypeContext system:

**Onboarding Preference** (`user_type_preference`):
- User's intended use case
- Set during onboarding
- Guide initial experience
- Soft suggestion

**User Type Context** (`userType`, `currentMode`):
- Actual roles from backend (staff, member, both)
- Determines real access permissions
- Enforced at runtime
- Hard security boundary

**Relationship:**
```
Organization Preference + Staff Role = Organization Mode (default)
Organization Preference + Member Only = Cooperative Mode (restricted)
Cooperative Preference + Staff Role = Organization Mode (but can switch)
Cooperative Preference + Member Only = Cooperative Mode (only option)
```

## Customization

### Modifying Slide Content
Each flow component (OrganizationOnboardingFlow, CooperativeOnboardingFlow) has a `slides` array that can be easily modified:

```typescript
const slides: SlideItem[] = [
  {
    key: 'unique-key',
    title: 'Slide Title',
    description: 'Brief description',
    icon: 'icon-name',
    iconColor: colors.primary.main,
    iconBg: colors.primary.light,
    steps: [
      'Step 1 instruction',
      'Step 2 instruction',
      // Add more steps
    ],
  },
  // Add more slides
];
```

### Adding New User Types
To add a new user type:

1. Update `UserTypeSelection` type in UserTypeSelectionScreen.tsx
2. Add new option card in UserTypeSelectionScreen
3. Create new flow component (e.g., HybridOnboardingFlow.tsx)
4. Add new step state in OnboardingScreen
5. Handle new selection in `handleUserTypeSelected`

### Changing Default Flow
In OnboardingScreen.tsx, update `handleSkipSelection`:

```typescript
const handleSkipSelection = () => {
  // Change this to your preferred default
  setCurrentStep('organization-flow'); // or 'cooperative-flow'
};
```

## Visual Design

### Color Scheme
- Organization: Primary color (indigo) for main theme
- Success: Green checkmarks for feature lists
- Neutral: Gray borders and secondary text
- Light backgrounds: Color-tinted backgrounds for visual variety

### Icons Used
- `business`: Organization icon
- `people`: Cooperative/community icon
- `cash`: Monetary transactions
- `wallet`: Savings and contributions
- `bar-chart`: Analytics
- `trending-up`: Growth
- `checkmark-circle`: Features/benefits
- `information-circle`: Info boxes

### Responsive Design
- Uses SafeAreaInsets for proper spacing on all devices
- Adapts to different screen sizes
- ScrollView for content that may overflow
- Touch-friendly button sizes (minimum 44pt)

## Best Practices

### Do's
✅ Keep slide content concise (3-5 bullet points max)
✅ Use clear, action-oriented language
✅ Include actual step numbers for multi-step processes
✅ Show benefits, not just features
✅ Allow users to skip if they want

### Don'ts
❌ Don't make onboarding too long (5 slides max)
❌ Don't force users through entire flow
❌ Don't duplicate information across slides
❌ Don't use technical jargon
❌ Don't hide the skip button

## Future Enhancements

### Potential Additions
1. **Interactive Onboarding**: Quick setup within onboarding flow
2. **Video Tutorials**: Embedded video guides for complex features
3. **Progress Indicators**: Show percentage completion
4. **Personalized Recommendations**: Based on selected type
5. **Quick Actions**: Direct links to first-time setup tasks
6. **A/B Testing**: Track which flow converts better
7. **Multi-language Support**: Localized content
8. **Tooltips & Hints**: Post-onboarding contextual help

### Analytics Opportunities
- Track which user type is selected more
- Monitor skip rates per slide
- Measure time spent on each slide
- Track completion rates
- Correlate onboarding path with feature adoption

## Testing Checklist

### Manual Testing
- [ ] User type selection saves to AsyncStorage
- [ ] Skip button works on selection screen
- [ ] Organization flow shows correct slides
- [ ] Cooperative flow shows correct slides
- [ ] Skip button works in each flow
- [ ] Get Started completes onboarding
- [ ] hasSeenOnboarding prevents re-showing
- [ ] Safe area insets work on notched devices
- [ ] Buttons are touchable and responsive
- [ ] Text is readable on all backgrounds

### Edge Cases
- [ ] What if AsyncStorage fails?
- [ ] What if user exits mid-onboarding?
- [ ] What if user changes mind about type?
- [ ] What if user has both roles?
- [ ] What if backend role conflicts with preference?

## Troubleshooting

### Common Issues

**Issue**: Onboarding shows every time
- **Cause**: AsyncStorage not persisting
- **Fix**: Check AsyncStorage permissions, verify write success

**Issue**: Wrong flow for user type
- **Cause**: Mismatch between preference and actual role
- **Fix**: Update post-login to validate role vs preference

**Issue**: Buttons not working
- **Cause**: Z-index or TouchableOpacity issue
- **Fix**: Verify zIndex values, check parent View props

**Issue**: Layout broken on device
- **Cause**: SafeAreaInsets not applied
- **Fix**: Ensure useSafeAreaInsets is used correctly

## Maintenance

### Regular Updates
- Update slide content as features evolve
- Refresh screenshots/illustrations periodically
- Review analytics to optimize flow
- Gather user feedback on clarity
- Keep documentation in sync with code

### Version Compatibility
- Onboarding screens are forward-compatible
- Can add new slides without breaking existing flows
- AsyncStorage keys are versioned for migration
- Backward compatible with old onboarding state

---

**Last Updated**: January 2025
**Maintained By**: CoopManager Team
**Related Docs**: SEGMENTATION_ACCESS_MODEL.md, UserTypeContext.tsx
