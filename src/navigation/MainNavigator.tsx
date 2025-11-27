import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';

import HomeScreen from '../screens/home/HomeScreen';
import CooperativeDetailScreen from '../screens/cooperative/CooperativeDetailScreen';
import ContributionPlanScreen from '../screens/contributions/ContributionPlanScreen';
import ContributionPeriodScreen from '../screens/contributions/ContributionPeriodScreen';
import RecordPaymentScreen from '../screens/contributions/RecordPaymentScreen';
import PaymentVerificationScreen from '../screens/contributions/PaymentVerificationScreen';
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
  ProfileTab: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  CooperativeDetail: { cooperativeId: string };
  ContributionPlan: { planId: string };
  ContributionPeriod: { periodId: string };
  RecordPayment: { periodId: string };
  PaymentVerification: { cooperativeId: string };
  GroupBuyList: { cooperativeId: string };
  GroupBuyDetail: { groupBuyId: string };
  GroupBuyManagement: { groupBuyId: string };
  LoanRequest: { cooperativeId: string };
  LoanDetail: { loanId: string };
  LoanDecision: { loanId: string };
  Ledger: { cooperativeId: string; memberId?: string };
  MemberDashboard: { cooperativeId: string; memberId: string };
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();

// Tab bar icon component
const TabIcon: React.FC<{ name: string; focused: boolean }> = ({ name, focused }) => (
  <View
    style={{
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 8,
    }}
  >
    <Text style={{ fontSize: 20 }}>{name === 'Home' ? '🏠' : '👤'}</Text>
    <Text
      style={{
        fontSize: 10,
        color: focused ? '#0ea5e9' : '#64748b',
        marginTop: 2,
      }}
    >
      {name}
    </Text>
  </View>
);

const HomeStackNavigator: React.FC = () => {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#0ea5e9',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <HomeStack.Screen name="Home" component={HomeScreen} options={{ title: 'My Cooperatives' }} />
      <HomeStack.Screen
        name="CooperativeDetail"
        component={CooperativeDetailScreen}
        options={{ title: 'Cooperative' }}
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

const MainNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0',
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="Home" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="Profile" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;
