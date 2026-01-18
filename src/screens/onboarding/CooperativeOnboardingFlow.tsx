// Cooperative Onboarding Flow - Guide cooperative members through setup

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
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
    key: 'join-coop',
    title: 'Join a Cooperative',
    description: 'Connect with your cooperative society to start participating',
    icon: 'people',
    iconColor: colors.primary.main,
    iconBg: colors.primary.light,
    steps: [
      'Get your cooperative code from your admin',
      'Tap "Join Cooperative" on the home screen',
      'Enter the 6-digit code',
      'Wait for admin approval',
    ],
  },
  {
    key: 'contributions',
    title: 'Make Contributions',
    description: 'Participate in contribution plans and track your savings',
    icon: 'wallet',
    iconColor: colors.success.main,
    iconBg: colors.success.light,
    steps: [
      'View active contribution plans',
      'Make payments for current periods',
      'Upload payment proof',
      'Track your total contributions',
    ],
  },
  {
    key: 'loans',
    title: 'Request Loans',
    description: 'Access loans from your cooperative with flexible repayment',
    icon: 'cash',
    iconColor: colors.warning.main,
    iconBg: colors.warning.light,
    steps: [
      'Check available loan types',
      'Submit a loan request',
      'Provide guarantors if required',
      'Track loan status and repayments',
    ],
  },
  {
    key: 'savings',
    title: 'Grow Your Savings',
    description: 'Participate in Ajo, Esusu, and other savings schemes',
    icon: 'trending-up',
    iconColor: colors.accent.main,
    iconBg: colors.accent.light,
    steps: [
      'Join Ajo (target savings) groups',
      'Participate in Esusu rotational savings',
      'Earn from group buying deals',
      'Watch your savings grow',
    ],
  },
  {
    key: 'community',
    title: 'Stay Connected',
    description: 'Engage with your cooperative community and stay informed',
    icon: 'chatbubbles',
    iconColor: colors.primary.main,
    iconBg: colors.primary.light,
    steps: [
      'View member activities and updates',
      'Participate in message wall discussions',
      'Vote in polls and decisions',
      'Access reports and statements',
    ],
  },
];

interface Props {
  onComplete: () => void;
}

const CooperativeOnboardingFlow: React.FC<Props> = ({ onComplete }) => {
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

export default CooperativeOnboardingFlow;
