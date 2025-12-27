import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// Note: keeping to bottom-tabs only to avoid adding drawer dependency
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View, StyleSheet } from 'react-native';
import { colors, spacing } from '../theme';
import CustomTabBar from '../components/navigation/CustomTabBar';
import NotificationBell from '../components/common/NotificationBell';

import HomeScreen from '../screens/home/HomeScreen';
import LandingScreen from '../screens/home/LandingScreen';
import CooperativeDetailScreen from '../screens/cooperative/CooperativeDetailScreen';
import CooperativeSettingsScreen from '../screens/cooperative/CooperativeSettingsScreen';
import ContributionPlanScreen from '../screens/contributions/ContributionPlanScreen';
import ContributionPeriodScreen from '../screens/contributions/ContributionPeriodScreen';
import CreateContributionScreen from '../screens/contributions/CreateContributionScreen';
import RecordPaymentScreen from '../screens/contributions/RecordPaymentScreen';
import PaymentVerificationScreen from '../screens/contributions/PaymentVerificationScreen';
import RecordSubscriptionPaymentScreen from '../screens/contributions/RecordSubscriptionPaymentScreen';
import PaymentApprovalScreen from '../screens/contributions/PaymentApprovalScreen';
import PaymentScheduleScreen from '../screens/contributions/PaymentScheduleScreen';
import RecordSchedulePaymentScreen from '../screens/contributions/RecordSchedulePaymentScreen';
import BulkApprovalScreen from '../screens/contributions/BulkApprovalScreen';
import GroupBuyListScreen from '../screens/groupbuys/GroupBuyListScreen';
import GroupBuyDetailScreen from '../screens/groupbuys/GroupBuyDetailScreen';
import GroupBuyManagementScreen from '../screens/groupbuys/GroupBuyManagementScreen';
import LoanRequestScreen from '../screens/loans/LoanRequestScreen';
import LoanDetailScreen from '../screens/loans/LoanDetailScreen';
import LoanDecisionScreen from '../screens/loans/LoanDecisionScreen';
import LoanTypesScreen from '../screens/loans/LoanTypesScreen';
import LoanApprovalListScreen from '../screens/loans/LoanApprovalListScreen';
import LoanInitiateScreen from '../screens/loans/LoanInitiateScreen';
import LedgerScreen from '../screens/ledger/LedgerScreen';
import MemberDashboardScreen from '../screens/cooperative/MemberDashboardScreen';
import AdminManagementScreen from '../screens/cooperative/AdminManagementScreen';
import OfflineMembersScreen from '../screens/cooperative/OfflineMembersScreen';
import InviteMembersScreen from '../screens/cooperative/InviteMembersScreen';
import ProfileScreen from '../screens/home/ProfileScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import NotificationSettingsScreen from '../screens/notifications/NotificationSettingsScreen';
import {
  SubscriptionPlansScreen,
  SubscriptionManagementScreen,
  PaymentWebViewScreen,
} from '../screens/subscription';
import {
  EditProfileScreen,
  ChangePasswordScreen,
  PrivacySecurityScreen,
  HelpSupportScreen,
  AboutScreen,
} from '../screens/profile';
import {
  ExpenseListScreen,
  CreateExpenseScreen,
  ExpenseDetailScreen,
} from '../screens/expenses';
import ReportsScreen from '../screens/reports/ReportsScreen';
import MessageWallScreen from '../screens/posts/MessageWallScreen';
import PostDetailScreen from '../screens/posts/PostDetailScreen';
import CreatePostScreen from '../screens/posts/CreatePostScreen';
import CreatePollScreen from '../screens/polls/CreatePollScreen';

export type MainTabParamList = {
  HomeTab: undefined;
  CoopsTab: undefined;
  ProfileTab: undefined;
};



const Tab = createBottomTabNavigator<MainTabParamList>();
// drawer navigator omitted (avoids adding @react-navigation/drawer dependency)
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const CoopsStack = createNativeStackNavigator<HomeStackParamList>();
const ProfileStack = createNativeStackNavigator<HomeStackParamList>();

export type HomeStackParamList = {
  Landing: undefined;
  Home: { openModal?: 'create' | 'join' } | undefined;
  CooperativeDetail: { cooperativeId: string };
  CreateContribution: { cooperativeId: string };
  ContributionPlan: { planId: string };
  ContributionPeriod: { periodId: string };
  RecordPayment: { periodId: string };
  PaymentVerification: { cooperativeId: string };
  RecordSubscriptionPayment: { 
    subscriptionId: string;
    planName?: string;
    amount?: number;
    dueDate?: string;
  };
  PaymentApproval: { cooperativeId: string };
  PaymentSchedule: {
    subscriptionId?: string;
    cooperativeId?: string;
  };
  RecordSchedulePayment: {
    scheduleId: string;
    planName?: string;
    amount?: number;
    dueDate?: string;
    periodLabel?: string;
  };
  BulkApproval: { cooperativeId: string };
  GroupBuyList: { cooperativeId: string };
  GroupBuyDetail: { groupBuyId: string };
  GroupBuyManagement: { groupBuyId?: string; cooperativeId?: string };
  LoanRequest: { cooperativeId: string };
  LoanDetail: { loanId: string };
  LoanDecision: { loanId: string };
  LoanTypes: { cooperativeId: string };
  LoanApprovalList: { cooperativeId: string };
  LoanInitiate: { cooperativeId: string };
  Ledger: { cooperativeId: string; memberId?: string };
  MemberDashboard: { cooperativeId: string; memberId: string };
  AdminManagement: { cooperativeId: string };
  OfflineMembers: { cooperativeId: string; cooperativeName: string };
  InviteMembers: { cooperativeId: string; cooperativeName: string };
  Notifications: undefined;
  NotificationSettings: undefined;
  SubscriptionPlans: { cooperativeId: string; currentPlanId?: string };
  SubscriptionManagement: { cooperativeId: string };
  PaymentWebView: { authorizationUrl: string; reference: string; cooperativeId: string };
  CooperativeSettings: { cooperativeId: string };
  // Profile screens
  Profile: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  PrivacySecurity: undefined;
  HelpSupport: undefined;
  About: undefined;
  // Expense screens
  ExpenseList: { cooperativeId: string };
  CreateExpense: { cooperativeId: string };
  ExpenseDetail: { expenseId: string; cooperativeId: string; canApprove?: boolean };
  // Reports screen
  Reports: { cooperativeId: string; cooperativeName: string };
  // Message Wall screens
  MessageWall: { cooperativeId: string };
  PostDetail: { postId: string };
};

const HomeStackNavigator: React.FC = () => {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary.main,
        },
        headerTintColor: colors.primary.contrast,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerRight: () => <NotificationBell color={colors.primary.contrast} />,
      }}
      initialRouteName="Landing"
    >
      <HomeStack.Screen name="Landing" component={LandingScreen} options={{ title: 'Overview' }} />
      <HomeStack.Screen name="Home" component={HomeScreen} options={{ title: 'My Cooperatives' }} />
      <HomeStack.Screen
        name="CooperativeDetail"
        component={CooperativeDetailScreen}
        options={{ title: 'Cooperative' }}
      />
      <HomeStack.Screen
        name="CreateContribution"
        component={CreateContributionScreen}
        options={{ title: 'Create Contribution' }}
      />
      <HomeStack.Screen
        name="ContributionPlan"
        component={ContributionPlanScreen}
        options={{ title: 'Contribution Plan' }}
      />
      <HomeStack.Screen
        name="ContributionPeriod"
        component={ContributionPeriodScreen}
        options={{ title: 'Period Details' }}
      />
      <HomeStack.Screen
        name="RecordPayment"
        component={RecordPaymentScreen}
        options={{ title: 'Record Payment' }}
      />
      <HomeStack.Screen
        name="PaymentVerification"
        component={PaymentVerificationScreen}
        options={{ title: 'Verify Payments' }}
      />
      <HomeStack.Screen
        name="RecordSubscriptionPayment"
        component={RecordSubscriptionPaymentScreen}
        options={{ title: 'Record Payment' }}
      />
      <HomeStack.Screen
        name="PaymentApproval"
        component={PaymentApprovalScreen}
        options={{ title: 'Pending Payments' }}
      />
      <HomeStack.Screen
        name="PaymentSchedule"
        component={PaymentScheduleScreen}
        options={{ title: 'Payment Schedule' }}
      />
      <HomeStack.Screen
        name="RecordSchedulePayment"
        component={RecordSchedulePaymentScreen}
        options={{ title: 'Record Payment' }}
      />
      <HomeStack.Screen
        name="BulkApproval"
        component={BulkApprovalScreen}
        options={{ title: 'Bulk Approval' }}
      />
      <HomeStack.Screen
        name="GroupBuyList"
        component={GroupBuyListScreen}
        options={{ title: 'Group Buys' }}
      />
      <HomeStack.Screen
        name="GroupBuyDetail"
        component={GroupBuyDetailScreen}
        options={{ title: 'Group Buy' }}
      />
      <HomeStack.Screen
        name="GroupBuyManagement"
        component={GroupBuyManagementScreen}
        options={{ title: 'Manage Group Buy' }}
      />
      <HomeStack.Screen
        name="LoanRequest"
        component={LoanRequestScreen}
        options={{ title: 'Request Loan' }}
      />
      <HomeStack.Screen
        name="LoanDetail"
        component={LoanDetailScreen}
        options={{ title: 'Loan Details' }}
      />
      <HomeStack.Screen
        name="LoanDecision"
        component={LoanDecisionScreen}
        options={{ title: 'Review Loan' }}
      />
      <HomeStack.Screen
        name="LoanTypes"
        component={LoanTypesScreen}
        options={{ title: 'Loan Types' }}
      />
      <HomeStack.Screen
        name="LoanApprovalList"
        component={LoanApprovalListScreen}
        options={{ title: 'Pending Loan Requests' }}
      />
      <HomeStack.Screen
        name="LoanInitiate"
        component={LoanInitiateScreen}
        options={{ title: 'Initiate Loan' }}
      />
      <HomeStack.Screen name="Ledger" component={LedgerScreen} options={{ title: 'Ledger' }} />
      <HomeStack.Screen
        name="MemberDashboard"
        component={MemberDashboardScreen}
        options={{ title: 'Member Dashboard' }}
      />
      <HomeStack.Screen
        name="AdminManagement"
        component={AdminManagementScreen}
        options={{ title: 'Admin Management' }}
      />
      <HomeStack.Screen
        name="OfflineMembers"
        component={OfflineMembersScreen}
        options={{ title: 'Offline Members', headerShown: false }}
      />
      <HomeStack.Screen
        name="InviteMembers"
        component={InviteMembersScreen}
        options={{ title: 'Invite Members', headerShown: false }}
      />
      <HomeStack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: 'Notifications' }}
      />
      <HomeStack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{ title: 'Notification Settings' }}
      />
      <HomeStack.Screen
        name="SubscriptionPlans"
        component={SubscriptionPlansScreen}
        options={{ title: 'Subscription Plans', headerShown: false }}
      />
      <HomeStack.Screen
        name="SubscriptionManagement"
        component={SubscriptionManagementScreen}
        options={{ title: 'Subscription', headerShown: false }}
      />
      <HomeStack.Screen
        name="PaymentWebView"
        component={PaymentWebViewScreen}
        options={{ title: 'Payment', headerShown: false }}
      />
      <HomeStack.Screen
        name="CooperativeSettings"
        component={CooperativeSettingsScreen}
        options={{ title: 'Cooperative Settings' }}
      />
      {/* Profile Screens */}
      <HomeStack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: 'Edit Profile' }}
      />
      <HomeStack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ title: 'Change Password' }}
      />
      <HomeStack.Screen
        name="PrivacySecurity"
        component={PrivacySecurityScreen}
        options={{ title: 'Privacy & Security' }}
      />
      <HomeStack.Screen
        name="HelpSupport"
        component={HelpSupportScreen}
        options={{ title: 'Help & Support' }}
      />
      <HomeStack.Screen
        name="About"
        component={AboutScreen}
        options={{ title: 'About' }}
      />
      {/* Expense Screens */}
      <HomeStack.Screen
        name="ExpenseList"
        component={ExpenseListScreen}
        options={{ title: 'Expenses' }}
      />
      <HomeStack.Screen
        name="CreateExpense"
        component={CreateExpenseScreen}
        options={{ title: 'Record Expense' }}
      />
      <HomeStack.Screen
        name="ExpenseDetail"
        component={ExpenseDetailScreen}
        options={{ title: 'Expense Details' }}
      />
      {/* Reports Screen */}
      <HomeStack.Screen
        name="Reports"
        component={ReportsScreen}
        options={{ title: 'Reports' }}
      />
      {/* Message Wall Screens */}
      <HomeStack.Screen
        name="MessageWall"
        component={MessageWallScreen}
        options={{ title: 'Message Wall' }}
      />
      <HomeStack.Screen
        name="PostDetail"
        component={PostDetailScreen}
        options={{ title: 'Post' }}
      />
      <HomeStack.Screen
        name="CreatePost"
        component={CreatePostScreen}
        options={{ title: 'Create Post' }}
      />
      <HomeStack.Screen
        name="CreatePoll"
        component={CreatePollScreen}
        options={{ title: 'Create Poll' }}
      />
    </HomeStack.Navigator>
  );
};

// Cooperatives tab stack - starts with the cooperatives list (Home screen)
const CoopsStackNavigator: React.FC = () => {
  return (
    <CoopsStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary.main,
        },
        headerTintColor: colors.primary.contrast,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerRight: () => <NotificationBell color={colors.primary.contrast} />,
      }}
      initialRouteName="Home"
    >
      <CoopsStack.Screen name="Home" component={HomeScreen} options={{ title: 'My Cooperatives' }} />
      <CoopsStack.Screen
        name="CooperativeDetail"
        component={CooperativeDetailScreen}
        options={{ title: 'Cooperative' }}
      />
      <CoopsStack.Screen
        name="CreateContribution"
        component={CreateContributionScreen}
        options={{ title: 'Create Contribution' }}
      />
      <CoopsStack.Screen
        name="ContributionPlan"
        component={ContributionPlanScreen}
        options={{ title: 'Contribution Plan' }}
      />
      <CoopsStack.Screen
        name="ContributionPeriod"
        component={ContributionPeriodScreen}
        options={{ title: 'Period Details' }}
      />
      <CoopsStack.Screen
        name="RecordPayment"
        component={RecordPaymentScreen}
        options={{ title: 'Record Payment' }}
      />
      <CoopsStack.Screen
        name="PaymentVerification"
        component={PaymentVerificationScreen}
        options={{ title: 'Verify Payments' }}
      />
      <CoopsStack.Screen
        name="RecordSubscriptionPayment"
        component={RecordSubscriptionPaymentScreen}
        options={{ title: 'Record Payment' }}
      />
      <CoopsStack.Screen
        name="PaymentApproval"
        component={PaymentApprovalScreen}
        options={{ title: 'Pending Payments' }}
      />
      <CoopsStack.Screen
        name="PaymentSchedule"
        component={PaymentScheduleScreen}
        options={{ title: 'Payment Schedule' }}
      />
      <CoopsStack.Screen
        name="RecordSchedulePayment"
        component={RecordSchedulePaymentScreen}
        options={{ title: 'Record Payment' }}
      />
      <CoopsStack.Screen
        name="BulkApproval"
        component={BulkApprovalScreen}
        options={{ title: 'Bulk Approval' }}
      />
      <CoopsStack.Screen
        name="GroupBuyList"
        component={GroupBuyListScreen}
        options={{ title: 'Group Buys' }}
      />
      <CoopsStack.Screen
        name="GroupBuyDetail"
        component={GroupBuyDetailScreen}
        options={{ title: 'Group Buy' }}
      />
      <CoopsStack.Screen
        name="GroupBuyManagement"
        component={GroupBuyManagementScreen}
        options={{ title: 'Manage Group Buy' }}
      />
      <CoopsStack.Screen
        name="LoanRequest"
        component={LoanRequestScreen}
        options={{ title: 'Request Loan' }}
      />
      <CoopsStack.Screen
        name="LoanDetail"
        component={LoanDetailScreen}
        options={{ title: 'Loan Details' }}
      />
      <CoopsStack.Screen
        name="LoanDecision"
        component={LoanDecisionScreen}
        options={{ title: 'Review Loan' }}
      />
      <CoopsStack.Screen
        name="LoanTypes"
        component={LoanTypesScreen}
        options={{ title: 'Loan Types' }}
      />
      <CoopsStack.Screen
        name="LoanApprovalList"
        component={LoanApprovalListScreen}
        options={{ title: 'Pending Loan Requests' }}
      />
      <CoopsStack.Screen
        name="LoanInitiate"
        component={LoanInitiateScreen}
        options={{ title: 'Initiate Loan' }}
      />
      <CoopsStack.Screen name="Ledger" component={LedgerScreen} options={{ title: 'Ledger' }} />
      <CoopsStack.Screen
        name="MemberDashboard"
        component={MemberDashboardScreen}
        options={{ title: 'Member Dashboard' }}
      />
      <CoopsStack.Screen
        name="AdminManagement"
        component={AdminManagementScreen}
        options={{ title: 'Admin Management' }}
      />
      <CoopsStack.Screen
        name="OfflineMembers"
        component={OfflineMembersScreen}
        options={{ title: 'Offline Members', headerShown: false }}
      />
      <CoopsStack.Screen
        name="InviteMembers"
        component={InviteMembersScreen}
        options={{ title: 'Invite Members', headerShown: false }}
      />
      <CoopsStack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: 'Notifications' }}
      />
      <CoopsStack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{ title: 'Notification Settings' }}
      />
      <CoopsStack.Screen
        name="SubscriptionPlans"
        component={SubscriptionPlansScreen}
        options={{ title: 'Subscription Plans', headerShown: false }}
      />
      <CoopsStack.Screen
        name="SubscriptionManagement"
        component={SubscriptionManagementScreen}
        options={{ title: 'Subscription', headerShown: false }}
      />
      <CoopsStack.Screen
        name="PaymentWebView"
        component={PaymentWebViewScreen}
        options={{ title: 'Payment', headerShown: false }}
      />
      <CoopsStack.Screen
        name="CooperativeSettings"
        component={CooperativeSettingsScreen}
        options={{ title: 'Cooperative Settings' }}
      />
      {/* Profile Screens */}
      <CoopsStack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: 'Edit Profile' }}
      />
      <CoopsStack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ title: 'Change Password' }}
      />
      <CoopsStack.Screen
        name="PrivacySecurity"
        component={PrivacySecurityScreen}
        options={{ title: 'Privacy & Security' }}
      />
      <CoopsStack.Screen
        name="HelpSupport"
        component={HelpSupportScreen}
        options={{ title: 'Help & Support' }}
      />
      <CoopsStack.Screen
        name="About"
        component={AboutScreen}
        options={{ title: 'About' }}
      />
      {/* Expense Screens */}
      <CoopsStack.Screen
        name="ExpenseList"
        component={ExpenseListScreen}
        options={{ title: 'Expenses' }}
      />
      <CoopsStack.Screen
        name="CreateExpense"
        component={CreateExpenseScreen}
        options={{ title: 'Record Expense' }}
      />
      <CoopsStack.Screen
        name="ExpenseDetail"
        component={ExpenseDetailScreen}
        options={{ title: 'Expense Details' }}
      />
      {/* Reports Screen */}
      <CoopsStack.Screen
        name="Reports"
        component={ReportsScreen}
        options={{ title: 'Reports' }}
      />
      {/* Message Wall Screens */}
      <CoopsStack.Screen
        name="MessageWall"
        component={MessageWallScreen}
        options={{ title: 'Message Wall' }}
      />
      <CoopsStack.Screen
        name="PostDetail"
        component={PostDetailScreen}
        options={{ title: 'Post' }}
      />
      <CoopsStack.Screen
        name="CreatePost"
        component={CreatePostScreen}
        options={{ title: 'Create Post' }}
      />
      <CoopsStack.Screen
        name="CreatePoll"
        component={CreatePollScreen}
        options={{ title: 'Create Poll' }}
      />
    </CoopsStack.Navigator>
  );
};

// Profile tab stack
const ProfileStackNavigator: React.FC = () => {
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary.main,
        },
        headerTintColor: colors.primary.contrast,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <ProfileStack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <ProfileStack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: 'Edit Profile' }}
      />
      <ProfileStack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ title: 'Change Password' }}
      />
      <ProfileStack.Screen
        name="PrivacySecurity"
        component={PrivacySecurityScreen}
        options={{ title: 'Privacy & Security' }}
      />
      <ProfileStack.Screen
        name="HelpSupport"
        component={HelpSupportScreen}
        options={{ title: 'Help & Support' }}
      />
      <ProfileStack.Screen
        name="About"
        component={AboutScreen}
        options={{ title: 'About' }}
      />
      <ProfileStack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{ title: 'Notification Settings' }}
      />
    </ProfileStack.Navigator>
  );
};

const MainNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
      />
      <Tab.Screen
        name="CoopsTab"
        component={CoopsStackNavigator}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;
