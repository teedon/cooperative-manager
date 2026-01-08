import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// Note: keeping to bottom-tabs only to avoid adding drawer dependency
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, spacing } from '../theme';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { fetchCooperatives } from '../store/slices/cooperativeSlice';
import CustomTabBar from '../components/navigation/CustomTabBar';
import NotificationBell from '../components/common/NotificationBell';

import HomeScreen from '../screens/home/HomeScreen';
import LandingScreen from '../screens/home/LandingScreen';
import CooperativeDetailScreen from '../screens/cooperative/CooperativeDetailScreen';
import PendingApprovalScreen from '../screens/cooperative/PendingApprovalScreen';
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
import GuarantorLoansScreen from '../screens/loans/GuarantorLoansScreen';
import PendingRepaymentsScreen from '../screens/loans/PendingRepaymentsScreen';
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
import AjoListScreen from '../screens/ajo/AjoListScreen';
import AjoSettingsScreen from '../screens/ajo/AjoSettingsScreen';
import CreateAjoScreen from '../screens/ajo/CreateAjoScreen';
import AjoDetailScreen from '../screens/ajo/AjoDetailScreen';
import AjoStatementScreen from '../screens/ajo/AjoStatementScreen';
import EsusuListScreen from '../screens/esusu/EsusuListScreen';
import EsusuSettingsScreen from '../screens/esusu/EsusuSettingsScreen';
import CreateEsusuScreen from '../screens/esusu/CreateEsusuScreen';
import EsusuDetailScreen from '../screens/esusu/EsusuDetailScreen';
import RecordContributionScreen from '../screens/esusu/RecordContributionScreen';
import ProcessCollectionScreen from '../screens/esusu/ProcessCollectionScreen';
import SetEsusuOrderScreen from '../screens/esusu/SetEsusuOrderScreen';

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
  CooperativeRedirect: undefined;
  CooperativeDetail: { cooperativeId: string };
  PendingApproval: { cooperativeId?: string } | undefined;
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
  GuarantorLoans: { cooperativeId: string };
  PendingRepayments: { cooperativeId: string };
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
  CreatePost: { cooperativeId: string };
  CreatePoll: { cooperativeId: string };
  // Ajo (Target Savings) screens
  AjoList: { cooperativeId: string };
  AjoDetail: { ajoId: string };
  CreateAjo: { cooperativeId: string };
  AjoSettings: { cooperativeId: string };
  AjoStatement: { ajoId: string; memberId: string };
  // Esusu (Rotational Savings) screens
  EsusuList: { cooperativeId: string };
  EsusuDetail: { esusuId: string };
  CreateEsusu: { cooperativeId: string };
  EsusuSettings: { cooperativeId: string };
  RecordContribution: { esusuId: string };
  ProcessCollection: { esusuId: string };
  SetEsusuOrder: { esusuId: string };
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
        name="PendingApproval"
        component={PendingApprovalScreen}
        options={{ title: 'Pending Approvals' }}
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
      <HomeStack.Screen
        name="GuarantorLoans"
        component={GuarantorLoansScreen}
        options={{ title: 'Guarantor Requests' }}
      />
      <HomeStack.Screen
        name="PendingRepayments"
        component={PendingRepaymentsScreen}
        options={{ title: 'Pending Repayments' }}
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
      {/* Ajo (Target Savings) Screens */}
      <HomeStack.Screen
        name="AjoList"
        component={AjoListScreen}
        options={{ title: 'Ajo (Target Savings)' }}
      />
      <HomeStack.Screen
        name="AjoSettings"
        component={AjoSettingsScreen}
        options={{ title: 'Ajo Settings' }}
      />
      <HomeStack.Screen
        name="CreateAjo"
        component={CreateAjoScreen}
        options={{ title: 'Create Ajo Plan' }}
      />
      <HomeStack.Screen
        name="AjoDetail"
        component={AjoDetailScreen}
        options={{ title: 'Ajo Details' }}
      />
      <HomeStack.Screen
        name="AjoStatement"
        component={AjoStatementScreen}
        options={{ title: 'Member Statement' }}
      />
      {/* Esusu (Rotational Savings) Screens */}
      <HomeStack.Screen
        name="EsusuList"
        component={EsusuListScreen}
        options={{ title: 'Esusu (Rotational Savings)' }}
      />
      <HomeStack.Screen
        name="EsusuSettings"
        component={EsusuSettingsScreen}
        options={{ title: 'Esusu Settings' }}
      />
      <HomeStack.Screen
        name="CreateEsusu"
        component={CreateEsusuScreen}
        options={{ title: 'Create Esusu Plan' }}
      />
      <HomeStack.Screen
        name="EsusuDetail"
        component={EsusuDetailScreen}
        options={{ title: 'Esusu Details' }}
      />
      <HomeStack.Screen
        name="RecordContribution"
        component={RecordContributionScreen}
        options={{ title: 'Record Contribution' }}
      />
      <HomeStack.Screen
        name="ProcessCollection"
        component={ProcessCollectionScreen}
        options={{ title: 'Process Collection' }}
      />
      <HomeStack.Screen
        name="SetEsusuOrder"
        component={SetEsusuOrderScreen}
        options={{ title: 'Set Collection Order' }}
      />
    </HomeStack.Navigator>
  );
};

// Component to redirect to default cooperative
const CooperativeRedirect: React.FC<any> = ({ navigation }) => {
  const { cooperatives } = useAppSelector((state) => state.cooperative);
  const dispatch = useAppDispatch();

  React.useEffect(() => {
    const loadAndNavigate = async () => {
      // Fetch cooperatives if not loaded
      if (cooperatives.length === 0) {
        await dispatch(fetchCooperatives());
      }
    };
    loadAndNavigate();
  }, [dispatch]);

  React.useEffect(() => {
    // Navigate to first cooperative when available
    if (cooperatives.length > 0) {
      // Get the last joined or first cooperative as default
      const defaultCoop = cooperatives[cooperatives.length - 1];
      navigation.replace('CooperativeDetail', { cooperativeId: defaultCoop.id });
    } else if (cooperatives.length === 0) {
      // If no cooperatives, navigate to the home screen to join/create
      navigation.replace('Home');
    }
  }, [cooperatives, navigation]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background.default }}>
      <ActivityIndicator size="large" color={colors.primary.main} />
      <Text style={{ marginTop: spacing.md, color: colors.text.secondary }}>Loading...</Text>
    </View>
  );
};

// Cooperatives tab stack - navigates directly to default cooperative
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
      initialRouteName="CooperativeRedirect"
    >
      <CoopsStack.Screen 
        name="CooperativeRedirect" 
        component={CooperativeRedirect} 
        options={{ title: 'My Cooperatives' }} 
      />
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
      <CoopsStack.Screen
        name="GuarantorLoans"
        component={GuarantorLoansScreen}
        options={{ title: 'Guarantor Requests' }}
      />
      <CoopsStack.Screen
        name="PendingRepayments"
        component={PendingRepaymentsScreen}
        options={{ title: 'Pending Repayments' }}
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
      {/* Ajo (Target Savings) Screens */}
      <CoopsStack.Screen
        name="AjoList"
        component={AjoListScreen}
        options={{ title: 'Ajo (Target Savings)' }}
      />
      <CoopsStack.Screen
        name="AjoSettings"
        component={AjoSettingsScreen}
        options={{ title: 'Ajo Settings' }}
      />
      <CoopsStack.Screen
        name="CreateAjo"
        component={CreateAjoScreen}
        options={{ title: 'Create Ajo Plan' }}
      />
      <CoopsStack.Screen
        name="AjoDetail"
        component={AjoDetailScreen}
        options={{ title: 'Ajo Details' }}
      />
      <CoopsStack.Screen
        name="AjoStatement"
        component={AjoStatementScreen}
        options={{ title: 'Member Statement' }}
      />
      {/* Esusu (Rotational Savings) Screens */}
      <CoopsStack.Screen
        name="EsusuList"
        component={EsusuListScreen}
        options={{ title: 'Esusu (Rotational Savings)' }}
      />
      <CoopsStack.Screen
        name="EsusuSettings"
        component={EsusuSettingsScreen}
        options={{ title: 'Esusu Settings' }}
      />
      <CoopsStack.Screen
        name="CreateEsusu"
        component={CreateEsusuScreen}
        options={{ title: 'Create Esusu Plan' }}
      />
      <CoopsStack.Screen
        name="EsusuDetail"
        component={EsusuDetailScreen}
        options={{ title: 'Esusu Details' }}
      />
      <CoopsStack.Screen
        name="RecordContribution"
        component={RecordContributionScreen}
        options={{ title: 'Record Contribution' }}
      />
      <CoopsStack.Screen
        name="ProcessCollection"
        component={ProcessCollectionScreen}
        options={{ title: 'Process Collection' }}
      />
      <CoopsStack.Screen
        name="SetEsusuOrder"
        component={SetEsusuOrderScreen}
        options={{ title: 'Set Collection Order' }}
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
