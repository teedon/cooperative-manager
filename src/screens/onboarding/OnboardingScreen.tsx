// Enhanced Onboarding - Direct cooperative flow
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CooperativeOnboardingFlow from './CooperativeOnboardingFlow';

interface OnboardingScreenProps {
  onComplete: () => void;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const handleFlowComplete = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      onComplete();
    } catch (error) {
      console.error('Error saving onboarding state:', error);
      onComplete(); // Continue anyway
    }
  };

  // Always show cooperative flow instead of user type selection
  return <CooperativeOnboardingFlow onComplete={handleFlowComplete} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});

export default OnboardingScreen;
