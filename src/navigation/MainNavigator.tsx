import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// Note: keeping to bottom-tabs only to avoid adding drawer dependency
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View, StyleSheet } from 'react-native';
import { colors, spacing } from '../theme';

import HomeScreen from '../screens/home/HomeScreen';
import LandingScreen from '../screens/home/LandingScreen';
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
  CoopsTab: undefined;
  ProfileTab: undefined;
};



const Tab = createBottomTabNavigator<MainTabParamList>();
// drawer navigator omitted (avoids adding @react-navigation/drawer dependency)
const HomeStack = createNativeStackNavigator<HomeStackParamList>();

// Tab bar icon component
import Icon from '../components/common/Icon';

const TabIcon: React.FC<{ name: string; focused: boolean }> = ({ name, focused }) => (
  <View style={tabIconStyles.container}>
    <Icon name={name === 'Home' ? 'Home' : name === 'Profile' ? 'User' : 'List'} size={20} />
    <Text style={[tabIconStyles.label, focused && tabIconStyles.labelFocused]}>{name}</Text>
  </View>
);

const tabIconStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.sm,
  },
  emoji: {
    fontSize: 20,
  },
  label: {
    fontSize: 10,
    color: colors.text.secondary,
    marginTop: 2,
  },
  labelFocused: {
    color: colors.primary.main,
  },
});

export type HomeStackParamList = {
  Landing: undefined;
  Home: { openModal?: 'create' | 'join' } | undefined;
  CooperativeDetail: { cooperativeId: string };
  ContributionPlan: { planId: string };
  ContributionPeriod: { periodId: string };
  RecordPayment: { periodId: string };
  PaymentVerification: { cooperativeId: string };
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
          paddingBottom: spacing.sm,
          backgroundColor: colors.background.paper,
          borderTopWidth: 1,
          borderTopColor: colors.border.light,
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
        name="CoopsTab"
        component={HomeStackNavigator}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="Cooperatives" focused={focused} />,
          tabBarLabel: 'My Cooperatives',
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
