// Enhanced Onboarding - Main orchestrator for user type selection and guided flows
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UserTypeSelectionScreen, { UserTypeSelection } from './UserTypeSelectionScreen';
import OrganizationOnboardingFlow from './OrganizationOnboardingFlow';
import CooperativeOnboardingFlow from './CooperativeOnboardingFlow';


type OnboardingStep = 'selection' | 'organization-flow' | 'cooperative-flow';

interface OnboardingScreenProps {
  onComplete: () => void;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('selection');
  const [selectedUserType, setSelectedUserType] = useState<UserTypeSelection | null>(null);

  const handleUserTypeSelected = async (userType: UserTypeSelection) => {
    setSelectedUserType(userType);
    
    // Save user type preference
    try {
      await AsyncStorage.setItem('user_type_preference', userType);
    } catch (error) {
      console.error('Error saving user type preference:', error);
    }

    // Navigate to appropriate flow
    if (userType === 'organization') {
      setCurrentStep('organization-flow');
    } else {
      setCurrentStep('cooperative-flow');
    }
  };

  const handleSkipSelection = () => {
    // If user skips selection, default to cooperative flow
    setCurrentStep('cooperative-flow');
  };

  const handleFlowComplete = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      onComplete();
    } catch (error) {
      console.error('Error saving onboarding state:', error);
      onComplete(); // Continue anyway
    }
  };

  // Render appropriate screen based on current step
  if (currentStep === 'selection') {
    return (
      <UserTypeSelectionScreen
        onSelect={handleUserTypeSelected}
        onSkip={handleSkipSelection}
      />
    );
  }

  if (currentStep === 'organization-flow') {
    return <OrganizationOnboardingFlow onComplete={handleFlowComplete} />;
  }

  if (currentStep === 'cooperative-flow') {
    return <CooperativeOnboardingFlow onComplete={handleFlowComplete} />;
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});

export default OnboardingScreen;
