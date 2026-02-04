// Post-Onboarding Guidance Component - Shows first-time tips based on user type preference

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from '../common/Icon';
import { colors, spacing, borderRadius } from '../../theme';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type UserTypePreference = 'organization' | 'cooperative' | null;

interface QuickAction {
  title: string;
  description: string;
  icon: string;
  iconColor: string;
  iconBg: string;
  screenName: string;
  params?: any;
}

const PostOnboardingGuidance: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [visible, setVisible] = useState(false);
  const [userPreference, setUserPreference] = useState<UserTypePreference>(null);

  useEffect(() => {
    checkAndShowGuidance();
  }, []);

  const checkAndShowGuidance = async () => {
    try {
      const hasSeenGuidance = await AsyncStorage.getItem('hasSeenPostOnboardingGuidance');
      
      if (hasSeenGuidance === 'true') {
        return; // Already shown
      }

      // Since user type selection is removed, default to cooperative
      setUserPreference('cooperative');
      setVisible(true);
    } catch (error) {
      console.error('Error checking post-onboarding guidance:', error);
    }
  };

  const handleDismiss = async () => {
    try {
      await AsyncStorage.setItem('hasSeenPostOnboardingGuidance', 'true');
      setVisible(false);
    } catch (error) {
      console.error('Error saving guidance state:', error);
      setVisible(false);
    }
  };

  const handleActionPress = (screenName: string, params?: any) => {
    handleDismiss();
    navigation.navigate(screenName, params);
  };

  const organizationActions: QuickAction[] = [
    {
      title: 'Create Your Organization',
      description: 'Set up your organization profile to start managing cooperatives',
      icon: 'business',
      iconColor: colors.primary.main,
      iconBg: colors.primary.light,
      screenName: 'CreateOrganization',
    },
    {
      title: 'Add Staff Members',
      description: 'Invite team members and assign roles for collections',
      icon: 'people',
      iconColor: colors.success.main,
      iconBg: colors.success.light,
      screenName: 'OrganizationList',
    },
    {
      title: 'View Analytics',
      description: 'Check collections statistics and performance',
      icon: 'bar-chart',
      iconColor: colors.accent.main,
      iconBg: colors.accent.light,
      screenName: 'CollectionsStatistics',
    },
  ];

  const cooperativeActions: QuickAction[] = [
    {
      title: 'Join a Cooperative',
      description: 'Enter your cooperative code to get started',
      icon: 'people',
      iconColor: colors.primary.main,
      iconBg: colors.primary.light,
      screenName: 'CooperativesList',
    },
    {
      title: 'Make a Contribution',
      description: 'Start contributing to active plans',
      icon: 'wallet',
      iconColor: colors.success.main,
      iconBg: colors.success.light,
      screenName: 'Contributions',
    },
    {
      title: 'Request a Loan',
      description: 'Access loans from your cooperative',
      icon: 'cash',
      iconColor: colors.warning.main,
      iconBg: colors.warning.light,
      screenName: 'Loans',
    },
  ];

  const actions = userPreference === 'organization' ? organizationActions : cooperativeActions;
  const welcomeTitle = userPreference === 'organization' 
    ? 'Welcome, Organization Manager!' 
    : 'Welcome to Your Cooperative!';
  const welcomeMessage = userPreference === 'organization'
    ? 'Get started by setting up your organization and adding team members.'
    : 'Get started by joining your cooperative and exploring member benefits.';

  if (!visible || !userPreference) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleDismiss}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView 
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconHeader}>
              <Icon 
                name={userPreference === 'organization' ? 'business' : 'people'} 
                size={64} 
                color={colors.primary.main} 
              />
            </View>
            <Text style={styles.title}>{welcomeTitle}</Text>
            <Text style={styles.subtitle}>{welcomeMessage}</Text>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <Text style={styles.sectionDescription}>
              Here are some recommended first steps to get you started:
            </Text>

            <View style={styles.actionsContainer}>
              {actions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.actionCard}
                  onPress={() => handleActionPress(action.screenName, action.params)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.actionIcon, { backgroundColor: action.iconBg }]}>
                    <Icon name={action.icon} size={28} color={action.iconColor} />
                  </View>
                  <View style={styles.actionContent}>
                    <Text style={styles.actionTitle}>{action.title}</Text>
                    <Text style={styles.actionDescription}>{action.description}</Text>
                  </View>
                  <Icon name="chevron-forward" size={20} color={colors.text.secondary} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Tips Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pro Tips</Text>
            
            {userPreference === 'organization' ? (
              <View style={styles.tipsContainer}>
                <View style={styles.tipRow}>
                  <Icon name="bulb" size={20} color={colors.warning.main} />
                  <Text style={styles.tipText}>
                    You have access to both organization and cooperative features
                  </Text>
                </View>
                <View style={styles.tipRow}>
                  <Icon name="bulb" size={20} color={colors.warning.main} />
                  <Text style={styles.tipText}>
                    Use the mode switcher to toggle between organization and cooperative views
                  </Text>
                </View>
                <View style={styles.tipRow}>
                  <Icon name="bulb" size={20} color={colors.warning.main} />
                  <Text style={styles.tipText}>
                    Assign staff roles carefully - they determine collection permissions
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.tipsContainer}>
                <View style={styles.tipRow}>
                  <Icon name="bulb" size={20} color={colors.warning.main} />
                  <Text style={styles.tipText}>
                    You'll need a 6-digit code from your cooperative admin to join
                  </Text>
                </View>
                <View style={styles.tipRow}>
                  <Icon name="bulb" size={20} color={colors.warning.main} />
                  <Text style={styles.tipText}>
                    Wait for admin approval before you can access cooperative features
                  </Text>
                </View>
                <View style={styles.tipRow}>
                  <Icon name="bulb" size={20} color={colors.warning.main} />
                  <Text style={styles.tipText}>
                    Check the message wall regularly for updates and announcements
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Icon name="information-circle" size={24} color={colors.primary.main} />
            <Text style={styles.infoText}>
              You can always access these quick actions from the home screen.
            </Text>
          </View>
        </ScrollView>

        {/* Footer Buttons */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleDismiss}
          >
            <Text style={styles.primaryButtonText}>Got It, Let's Go!</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    paddingHorizontal: spacing.lg,
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  iconHeader: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.md,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  actionsContainer: {
    gap: spacing.sm,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.paper,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  tipsContainer: {
    gap: spacing.sm,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 20,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary.light,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.primary.dark,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    backgroundColor: '#ffffff',
  },
  primaryButton: {
    backgroundColor: colors.primary.main,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PostOnboardingGuidance;
