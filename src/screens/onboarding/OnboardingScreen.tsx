import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import AppIntroSlider from 'react-native-app-intro-slider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors, { colors as colorTheme } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme';
import Logo from '../../components/common/Logo';
import {
  CommunityIllustration,
  SavingsIllustration,
  GrowthIllustration,
  SecureIllustration,
} from '../../components/common/OnboardingIllustrations';

const { width, height } = Dimensions.get('window');

interface SlideItem {
  key: string;
  title: string;
  description: string;
  illustration: React.ReactNode;
  backgroundColor: string;
}

const slides: SlideItem[] = [
  {
    key: 'welcome',
    title: 'Welcome to CoopManager',
    description: 'Your all-in-one platform for managing cooperative societies. Join hands with your community to achieve financial goals together.',
    illustration: <Logo size={140} showText textColor={colorTheme.text.primary} />,
    backgroundColor: '#ffffff',
  },
  {
    key: 'community',
    title: 'Build Your Community',
    description: 'Create or join cooperative groups, manage memberships, and collaborate with people who share your financial vision.',
    illustration: <CommunityIllustration width={280} height={280} />,
    backgroundColor: '#eef2ff',
  },
  {
    key: 'savings',
    title: 'Smart Contributions',
    description: 'Set up flexible contribution plans, track payments, and watch your collective savings grow steadily over time.',
    illustration: <SavingsIllustration width={280} height={280} />,
    backgroundColor: '#fef3c7',
  },
  {
    key: 'growth',
    title: 'Grow Together',
    description: 'Access group buying deals, request loans, and benefit from the power of collective bargaining.',
    illustration: <GrowthIllustration width={280} height={280} />,
    backgroundColor: '#d1fae5',
  },
  {
    key: 'secure',
    title: 'Safe & Transparent',
    description: 'All transactions are tracked, verified, and visible to members. Your cooperative finances are always secure.',
    illustration: <SecureIllustration width={280} height={280} />,
    backgroundColor: '#dbeafe',
  },
];

interface OnboardingScreenProps {
  onComplete: () => void;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const insets = useSafeAreaInsets();
  
  const handleDone = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      onComplete();
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      onComplete();
    }
  };

  const renderItem = ({ item }: { item: SlideItem }) => {
    return (
      <View style={[styles.slide, { backgroundColor: item.backgroundColor }]}>
        <StatusBar 
          barStyle="dark-content" 
          backgroundColor={item.backgroundColor} 
        />
        
        <View style={styles.illustrationContainer}>
          {item.illustration}
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>
      </View>
    );
  };

  const renderNextButton = () => (
    <SafeAreaView edges={['bottom']} style={styles.buttonWrapper}>
      <View style={[styles.buttonContainer, { paddingBottom: spacing.xl }]}>
        <View style={styles.nextButton}>
          <Text style={styles.nextButtonText}>Next</Text>
        </View>
      </View>
    </SafeAreaView>
  );

  const renderDoneButton = () => (
    <SafeAreaView edges={['bottom']} style={styles.buttonWrapper}>
      <View style={[styles.buttonContainer, { paddingBottom: spacing.xl }]}>
        <View style={styles.doneButton}>
          <Text style={styles.doneButtonText}>Get Started</Text>
        </View>
      </View>
    </SafeAreaView>
  );

  const renderSkipButton = () => (
    <SafeAreaView edges={['bottom']} style={styles.skipButtonWrapper}>
      <TouchableOpacity 
        style={[styles.skipButton, { paddingBottom: spacing.xl }]} 
        onPress={handleDone}
      >
        <Text style={styles.skipButtonText}>Skip</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );

  return (
    <AppIntroSlider
      data={slides}
      renderItem={renderItem}
      renderNextButton={renderNextButton}
      renderDoneButton={renderDoneButton}
      renderSkipButton={renderSkipButton}
      onDone={handleDone}
      showSkipButton
      dotStyle={styles.dot}
      activeDotStyle={styles.activeDot}
      bottomButton={false}
    />
  );
};

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: 80,
    paddingBottom: 180, // Increased from 140 to provide more space for buttons on Android 15
  },
  illustrationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colorTheme.text.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: {
    fontSize: 16,
    color: colorTheme.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonWrapper: {
    backgroundColor: 'transparent',
  },
  skipButtonWrapper: {
    backgroundColor: 'transparent',
  },
  buttonContainer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  nextButton: {
    backgroundColor: colorTheme.primary.main,
    paddingHorizontal: spacing.xl * 2,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    minWidth: 140,
    alignItems: 'center',
  },
  nextButtonText: {
    color: colorTheme.primary.contrast,
    fontSize: 16,
    fontWeight: '600',
  },
  doneButton: {
    backgroundColor: colorTheme.primary.main,
    paddingHorizontal: spacing.xl * 2,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    minWidth: 160,
    alignItems: 'center',
  },
  doneButtonText: {
    color: colorTheme.primary.contrast,
    fontSize: 16,
    fontWeight: 'bold',
  },
  skipButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    marginLeft: spacing.md,
  },
  skipButtonText: {
    color: colorTheme.text.secondary,
    fontSize: 16,
  },
  dot: {
    backgroundColor: 'rgba(79, 70, 229, 0.2)',
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: colorTheme.primary.main,
    width: 24,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
});

export default OnboardingScreen;
