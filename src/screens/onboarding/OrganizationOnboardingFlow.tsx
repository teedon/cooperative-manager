// Organization Onboarding Flow - Guide organization users through setup

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppIntroSlider from 'react-native-app-intro-slider';
import Icon from '../../components/common/Icon';
import { colors, spacing, borderRadius } from '../../theme';

const { width } = Dimensions.get('window');

interface SlideItem {
  key: string;
  title: string;
  description: string;
  icon: string;
  iconColor: string;
  iconBg: string;
  steps: string[];
}

const slides: SlideItem[] = [
  {
    key: 'create-org',
    title: 'Create Your Organization',
    description: 'Set up your organization profile to start managing cooperatives and staff',
    icon: 'business',
    iconColor: colors.primary.main,
    iconBg: colors.primary.light,
    steps: [
      'Tap "Create Organization" from the dashboard',
      'Enter your organization name and details',
      'Your organization will be created instantly',
    ],
  },
  {
    key: 'add-staff',
    title: 'Build Your Team',
    description: 'Invite staff members and assign them roles and permissions',
    icon: 'people',
    iconColor: colors.success.main,
    iconBg: colors.success.light,
    steps: [
      'Go to Staff Management section',
      'Add staff members with their emails',
      'Assign roles: Admin, Supervisor, or Agent',
      'Set permissions for collections and reports',
    ],
  },
  {
    key: 'daily-collections',
    title: 'Manage Daily Collections',
    description: 'Track and approve field agent collections in real-time',
    icon: 'cash',
    iconColor: colors.warning.main,
    iconBg: colors.warning.light,
    steps: [
      'Agents create daily collections in the field',
      'Add transactions for each member',
      'Submit collections for approval',
      'Admins review and approve collections',
      'Transactions post to member ledgers',
    ],
  },
  {
    key: 'analytics',
    title: 'Track Performance',
    description: 'View comprehensive statistics and reports on all activities',
    icon: 'bar-chart',
    iconColor: colors.accent.main,
    iconBg: colors.accent.light,
    steps: [
      'Access analytics dashboard',
      'View organization-wide statistics',
      'Monitor staff performance',
      'Track collection trends',
      'Generate detailed reports',
    ],
  },
  {
    key: 'cooperative-access',
    title: 'Full Cooperative Access',
    description: 'As an organization manager, you also have complete access to all cooperative features',
    icon: 'checkmark-circle',
    iconColor: colors.primary.main,
    iconBg: colors.primary.light,
    steps: [
      'Join or manage cooperatives',
      'Process loans and contributions',
      'Track member activities',
      'Participate in group buys',
      'Access all member features',
    ],
  },
];

interface Props {
  onComplete: () => void;
}

const OrganizationOnboardingFlow: React.FC<Props> = ({ onComplete }) => {
  const insets = useSafeAreaInsets();
  const [currentSlide, setCurrentSlide] = useState(0);
  const sliderRef = React.useRef<AppIntroSlider<SlideItem>>(null);

  const renderItem = ({ item }: { item: SlideItem }) => {
    return (
      <View style={styles.slide}>
        <View style={styles.contentContainer}>
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: item.iconBg }]}>
            <Icon name={item.icon} size={48} color={item.iconColor} />
          </View>

          {/* Title & Description */}
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>

          {/* Steps */}
          <View style={styles.stepsContainer}>
            {item.steps.map((step, index) => (
              <View key={index} style={styles.stepRow}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Skip Button */}
      {currentSlide < slides.length - 1 && (
        <TouchableOpacity
          style={[styles.skipButton, { top: insets.top + 10 }]}
          onPress={onComplete}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      <AppIntroSlider
        ref={sliderRef}
        data={slides}
        renderItem={renderItem}
        onDone={onComplete}
        onSlideChange={(index) => setCurrentSlide(index)}
        showSkipButton={false}
        showNextButton={true}
        showDoneButton={true}
        dotStyle={styles.dot}
        activeDotStyle={styles.activeDot}
        nextLabel="Next"
        doneLabel="Get Started"
        renderNextButton={() => (
          <View style={styles.button}>
            <Text style={styles.buttonText}>Next</Text>
          </View>
        )}
        renderDoneButton={() => (
          <View style={[styles.button, styles.doneButton]}>
            <Text style={styles.buttonText}>Get Started</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  skipButton: {
    position: 'absolute',
    right: spacing.lg,
    zIndex: 1000,
    padding: spacing.sm,
  },
  skipText: {
    color: colors.text.secondary,
    fontSize: 16,
  },
  slide: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  contentContainer: {
    flex: 1,
    paddingTop: 80,
    paddingHorizontal: spacing.xl,
    paddingBottom: 100,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  stepsContainer: {
    gap: spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: colors.text.primary,
    lineHeight: 22,
    paddingTop: 3,
  },
  dot: {
    backgroundColor: 'rgba(79, 70, 229, 0.2)',
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: colors.primary.main,
    width: 24,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  button: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    minWidth: 100,
  },
  doneButton: {
    minWidth: 140,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default OrganizationOnboardingFlow;
