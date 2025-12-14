import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// Note: keeping to bottom-tabs only to avoid adding drawer dependency
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View, StyleSheet } from 'react-native';
import { colors, spacing } from '../theme';
import CustomTabBar from '../components/navigation/CustomTabBar';

import HomeScreen from '../screens/home/HomeScreen';
import LandingScreen from '../screens/home/LandingScreen';
import CooperativeDetailScreen from '../screens/cooperative/CooperativeDetailScreen';
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
import LedgerScreen from '../screens/ledger/LedgerScreen';
import MemberDashboardScreen from '../screens/cooperative/MemberDashboardScreen';
import ProfileScreen from '../screens/home/ProfileScreen';

export type MainTabParamList = {
  HomeTab: undefined;
  CoopsTab: undefined;
  ProfileTab: undefined;
};



const Tab = createBottomTabNavigator<MainTabParamList>();
// drawer navigator omitted (avoids adding @react-navigation/drawer dependency)
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const CoopsStack = createNativeStackNavigator<HomeStackParamList>();

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
  Ledger: { cooperativeId: string; memberId?: string };
  MemberDashboard: { cooperativeId: string; memberId: string };
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
      <HomeStack.Screen name="Ledger" component={LedgerScreen} options={{ title: 'Ledger' }} />
      <HomeStack.Screen
        name="MemberDashboard"
        component={MemberDashboardScreen}
        options={{ title: 'Member Dashboard' }}
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
      <CoopsStack.Screen name="Ledger" component={LedgerScreen} options={{ title: 'Ledger' }} />
      <CoopsStack.Screen
        name="MemberDashboard"
        component={MemberDashboardScreen}
        options={{ title: 'Member Dashboard' }}
      />
    </CoopsStack.Navigator>
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
        component={ProfileScreen}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;
