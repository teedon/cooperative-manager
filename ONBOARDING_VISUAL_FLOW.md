# Enhanced Onboarding System - Visual Flow

## Complete User Journey

```
┌─────────────────────────────────────────────────────────────────────┐
│                          APP LAUNCH (New User)                       │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
         ┌──────────────────────────────────────────────────┐
         │  RootNavigator checks AsyncStorage               │
         │  Key: 'hasSeenOnboarding'                        │
         │  Value: undefined (new user)                     │
         └──────────────────┬───────────────────────────────┘
                            │
                            ▼
         ┌──────────────────────────────────────────────────┐
         │       ONBOARDING SCREEN (Main Orchestrator)      │
         │       State: 'selection'                         │
         └──────────────────┬───────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────────────┐
│                   USER TYPE SELECTION SCREEN                          │
│                                                                       │
│   ┌─────────────────────────────────────────────────────────┐      │
│   │  "Welcome to CoopManager!"                              │      │
│   │  "Let's get started by understanding how you'll use..." │      │
│   └─────────────────────────────────────────────────────────┘      │
│                                                                       │
│   ┌──────────────────────────┐  ┌──────────────────────────┐       │
│   │  🏢 Organization/Manager │  │  👥 Cooperative Member   │       │
│   │  ──────────────────────  │  │  ──────────────────────  │       │
│   │  ✓ Manage Organizations  │  │  ✓ Join Cooperatives     │       │
│   │  ✓ Staff Management      │  │  ✓ Loans & Contributions │       │
│   │  ✓ Daily Collections     │  │  ✓ Savings & Group Buys  │       │
│   │  ✓ Full Access           │  │  ✓ Member Activities     │       │
│   └────────────┬─────────────┘  └────────────┬─────────────┘       │
│                │                               │                      │
│   [Skip] ──────┼───────────────────────────────┼───→ Default to     │
│                │                               │      Cooperative     │
└────────────────┼───────────────────────────────┼──────────────────────┘
                 │                               │
         SAVES: 'organization'           SAVES: 'cooperative'
         to AsyncStorage                 to AsyncStorage
                 │                               │
                 ▼                               ▼
┌─────────────────────────────┐   ┌─────────────────────────────┐
│  ORGANIZATION ONBOARDING    │   │  COOPERATIVE ONBOARDING     │
│  FLOW (5 Slides)            │   │  FLOW (5 Slides)            │
├─────────────────────────────┤   ├─────────────────────────────┤
│                             │   │                             │
│  1️⃣  Create Your Org       │   │  1️⃣  Join a Cooperative    │
│     • Tap "Create Org"      │   │     • Get 6-digit code      │
│     • Enter details         │   │     • Enter code            │
│     • Instant setup         │   │     • Wait for approval     │
│                             │   │                             │
│  2️⃣  Build Your Team       │   │  2️⃣  Make Contributions    │
│     • Add staff members     │   │     • View active plans     │
│     • Assign roles          │   │     • Make payments         │
│     • Set permissions       │   │     • Upload proof          │
│                             │   │                             │
│  3️⃣  Daily Collections     │   │  3️⃣  Request Loans         │
│     • Agent creates         │   │     • Check loan types      │
│     • Add transactions      │   │     • Submit request        │
│     • Submit for approval   │   │     • Provide guarantors    │
│     • Admin approves        │   │     • Track repayments      │
│                             │   │                             │
│  4️⃣  Track Performance     │   │  4️⃣  Grow Your Savings     │
│     • Analytics dashboard   │   │     • Join Ajo groups       │
│     • Org-wide stats        │   │     • Esusu savings         │
│     • Staff monitoring      │   │     • Group buying deals    │
│     • Report generation     │   │     • Watch savings grow    │
│                             │   │                             │
│  5️⃣  Full Coop Access      │   │  5️⃣  Stay Connected        │
│     • Join cooperatives     │   │     • Member activities     │
│     • Process loans         │   │     • Message wall          │
│     • Track members         │   │     • Polls & voting        │
│     • All features          │   │     • Reports & statements  │
│                             │   │                             │
│  [Skip] → Jump to end       │   │  [Skip] → Jump to end       │
│  [Next] → Next slide        │   │  [Next] → Next slide        │
│  [Get Started] → Complete   │   │  [Get Started] → Complete   │
└─────────────┬───────────────┘   └─────────────┬───────────────┘
              │                                 │
              └────────────┬────────────────────┘
                           │
                           ▼
         ┌─────────────────────────────────────────────┐
         │  ONBOARDING COMPLETE                        │
         │  Save: hasSeenOnboarding = 'true'           │
         └─────────────────┬───────────────────────────┘
                           │
                           ▼
         ┌─────────────────────────────────────────────┐
         │  Navigate to AUTH/LOGIN                     │
         └─────────────────┬───────────────────────────┘
                           │
                           ▼
         ┌─────────────────────────────────────────────┐
         │  USER LOGS IN                               │
         └─────────────────┬───────────────────────────┘
                           │
                           ▼
         ┌─────────────────────────────────────────────┐
         │  LANDING SCREEN / MAIN APP                  │
         │  PostOnboardingGuidance Component Mounts    │
         └─────────────────┬───────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│          POST-ONBOARDING GUIDANCE MODAL (Shows Once)                 │
│                                                                      │
│  Check AsyncStorage: 'hasSeenPostOnboardingGuidance'               │
│  If not seen, show personalized welcome                            │
│                                                                      │
│  ┌────────────────────┐         ┌────────────────────┐            │
│  │  ORGANIZATION      │   OR    │  COOPERATIVE       │            │
│  ├────────────────────┤         ├────────────────────┤            │
│  │                    │         │                    │            │
│  │  🎉 Welcome,       │         │  🎉 Welcome to     │            │
│  │     Org Manager!   │         │     Your Coop!     │            │
│  │                    │         │                    │            │
│  │  Quick Actions:    │         │  Quick Actions:    │            │
│  │  ✓ Create Org      │         │  ✓ Join Coop      │            │
│  │  ✓ Add Staff       │         │  ✓ Contribute     │            │
│  │  ✓ View Analytics  │         │  ✓ Request Loan   │            │
│  │                    │         │                    │            │
│  │  Pro Tips:         │         │  Pro Tips:         │            │
│  │  💡 Full access    │         │  💡 Need 6-digit  │            │
│  │  💡 Mode switcher  │         │     code to join  │            │
│  │  💡 Role perms     │         │  💡 Wait for admin│            │
│  │                    │         │     approval      │            │
│  │  [Got It, Go!] ──┐ │         │  [Got It, Go!] ──┐│            │
│  └──────────────────┼─┘         └──────────────────┼┘            │
│                     │                              │              │
│                     └──────────┬───────────────────┘              │
│                                │                                  │
│         Saves: hasSeenPostOnboardingGuidance = 'true'           │
└────────────────────────────────┬─────────────────────────────────┘
                                 │
                                 ▼
         ┌─────────────────────────────────────────────┐
         │  USER IN MAIN APP                           │
         │  • Onboarding will never show again         │
         │  • Guidance will never show again           │
         │  • User can now use all features            │
         └─────────────────────────────────────────────┘
```

## AsyncStorage State Timeline

```
New User State:
├─ hasSeenOnboarding: undefined
├─ user_type_preference: undefined
└─ hasSeenPostOnboardingGuidance: undefined

After User Type Selection:
├─ hasSeenOnboarding: undefined
├─ user_type_preference: 'organization' | 'cooperative'
└─ hasSeenPostOnboardingGuidance: undefined

After Onboarding Complete:
├─ hasSeenOnboarding: 'true'  ← RootNavigator checks this
├─ user_type_preference: 'organization' | 'cooperative'
└─ hasSeenPostOnboardingGuidance: undefined

After First Login (Post-Guidance Shown):
├─ hasSeenOnboarding: 'true'
├─ user_type_preference: 'organization' | 'cooperative'
└─ hasSeenPostOnboardingGuidance: 'true'  ← Guidance checks this

Returning User (All Set):
├─ hasSeenOnboarding: 'true'
├─ user_type_preference: 'organization' | 'cooperative'
└─ hasSeenPostOnboardingGuidance: 'true'
```

## Component Hierarchy

```
App.tsx
 └─ NavigationContainer
     └─ RootNavigator
         ├─ checks hasSeenOnboarding
         │
         ├─ IF not seen:
         │   └─ OnboardingScreen (Main Orchestrator)
         │       ├─ UserTypeSelectionScreen
         │       │   ├─ Organization Card (saves 'organization')
         │       │   └─ Cooperative Card (saves 'cooperative')
         │       │
         │       ├─ OrganizationOnboardingFlow (5 slides)
         │       │   └─ AppIntroSlider with custom buttons
         │       │
         │       └─ CooperativeOnboardingFlow (5 slides)
         │           └─ AppIntroSlider with custom buttons
         │
         └─ IF seen:
             └─ AuthNavigator / MainNavigator
                 └─ LandingScreen
                     └─ PostOnboardingGuidance (Modal)
                         ├─ checks hasSeenPostOnboardingGuidance
                         ├─ reads user_type_preference
                         └─ shows once with quick actions
```

## Data Flow Diagram

```
User Interaction          AsyncStorage                Component State
─────────────────         ────────────                ───────────────

Select User Type   ──────►  Save:                   ──► selectedUserType = 
                            'user_type_preference'       'organization'

                                                         currentStep =
                                                         'organization-flow'
                                   │
                                   ▼
Complete Slides    ──────►  Save:                   ──► Navigate to
                            'hasSeenOnboarding'          Auth/Login
                            = 'true'
                                   │
                                   ▼
First Login        ──────►  Read:                   ──► Show Guidance
                            'user_type_preference'       Modal with
                            'hasSeenPost...'             Org/Coop Actions
                                   │
                                   ▼
Dismiss Guidance   ──────►  Save:                   ──► Return to
                            'hasSeenPost...'             Landing Screen
                            = 'true'
```

## Screen Transitions

```
1. App Launch
   ↓
2. Onboarding Check (RootNavigator)
   ↓
3. UserTypeSelectionScreen
   │
   ├─ Organization selected ────► OrganizationOnboardingFlow
   │                                └─ Slide 1
   │                                   └─ Slide 2
   │                                      └─ Slide 3
   │                                         └─ Slide 4
   │                                            └─ Slide 5
   │                                               └─ Complete
   │
   ├─ Cooperative selected ─────► CooperativeOnboardingFlow
   │                                └─ Slide 1
   │                                   └─ Slide 2
   │                                      └─ Slide 3
   │                                         └─ Slide 4
   │                                            └─ Slide 5
   │                                               └─ Complete
   │
   └─ Skip ──────────────────────► CooperativeOnboardingFlow (default)
                                     └─ Same flow as above
                                        └─ Complete
4. Auth/Login Screen
   ↓
5. Landing Screen (with PostOnboardingGuidance)
   ↓
6. Main App (guidance dismissed)
```

## Decision Points

```
┌─────────────────────────────────────────────────────────────┐
│                    DECISION TREE                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Is hasSeenOnboarding === 'true'?                          │
│    ├─ NO  → Show OnboardingScreen                          │
│    └─ YES → Skip to Auth/Login                             │
│                                                             │
│  On UserTypeSelectionScreen:                               │
│    ├─ Organization selected → OrganizationOnboardingFlow   │
│    ├─ Cooperative selected  → CooperativeOnboardingFlow    │
│    └─ Skip pressed          → CooperativeOnboardingFlow    │
│                                                             │
│  On Any Onboarding Flow:                                   │
│    ├─ Skip pressed  → Jump to end, complete onboarding     │
│    ├─ Next pressed  → Go to next slide                     │
│    └─ Done pressed  → Save hasSeenOnboarding, complete     │
│                                                             │
│  On Landing Screen (after login):                          │
│    Is hasSeenPostOnboardingGuidance === 'true'?            │
│    ├─ NO  → Show PostOnboardingGuidance modal              │
│    └─ YES → Don't show, user already saw it                │
│                                                             │
│  In PostOnboardingGuidance:                                │
│    Read user_type_preference:                              │
│    ├─ 'organization' → Show org quick actions & tips       │
│    └─ 'cooperative'  → Show coop quick actions & tips      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Integration with User Type Context

```
┌───────────────────────────────────────────────────────────────┐
│           ONBOARDING PREFERENCE vs ACTUAL ROLE                │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  Onboarding Preference (user_type_preference)                │
│  ↓                                                            │
│  User says: "I want to manage organizations"                 │
│  Saved during onboarding                                     │
│  Used for: Initial guidance, quick actions                   │
│  Nature: Soft preference, can change                         │
│                                                               │
│  ───────────────────────────────────────────────────         │
│                                                               │
│  Actual Role (from backend via UserTypeContext)              │
│  ↓                                                            │
│  Backend says: "User is staff member"                        │
│  Retrieved after login                                       │
│  Used for: Access control, permissions, features             │
│  Nature: Hard security boundary, enforced                    │
│                                                               │
│  ───────────────────────────────────────────────────────     │
│                                                               │
│  How They Work Together:                                     │
│                                                               │
│  Scenario 1: Preference = Org, Role = Staff                  │
│   ✓ Perfect match!                                           │
│   → Default to organization mode                             │
│   → Show org quick actions                                   │
│   → User has full access                                     │
│                                                               │
│  Scenario 2: Preference = Org, Role = Member Only            │
│   ⚠ Mismatch (user wanted org but isn't staff)              │
│   → Force to cooperative mode                                │
│   → User restricted to coop features                         │
│   → Can't create organizations (not staff)                   │
│                                                               │
│  Scenario 3: Preference = Coop, Role = Staff                 │
│   ✓ Staff can still access everything                        │
│   → Default to cooperative mode (per preference)             │
│   → Can switch to organization mode anytime                  │
│   → RoleSwitcher component available                         │
│                                                               │
│  Scenario 4: Preference = Coop, Role = Member Only           │
│   ✓ Perfect match!                                           │
│   → Stay in cooperative mode                                 │
│   → Show coop quick actions                                  │
│   → No organization access (not staff)                       │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

---

**Visual Reference Complete** ✅

This diagram shows the complete user journey from app launch through onboarding to their first experience in the app.
