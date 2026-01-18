// User Type Selection Screen - Step 1 of Enhanced Onboarding

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../../components/common/Icon';
import { colors, spacing, borderRadius } from '../../theme';
import Logo from '../../components/common/Logo';

const { width } = Dimensions.get('window');

export type UserTypeSelection = 'organization' | 'cooperative';

interface Props {
  onSelect: (type: UserTypeSelection) => void;
  onSkip: () => void;
}

const UserTypeSelectionScreen: React.FC<Props> = ({ onSelect, onSkip }) => {
  const insets = useSafeAreaInsets();
  const [selectedType, setSelectedType] = useState<UserTypeSelection | null>(null);

  const handleContinue = () => {
    if (selectedType) {
      onSelect(selectedType);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <ScrollView 
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Skip Button */}
        <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Logo size={60} />
          <Text style={styles.title}>Welcome to CoopManager!</Text>
          <Text style={styles.subtitle}>
            Let's get started by understanding how you'll use the app
          </Text>
        </View>

        {/* User Type Cards */}
        <View style={styles.cardsContainer}>
          {/* Organization Card */}
          <TouchableOpacity
            style={[
              styles.typeCard,
              selectedType === 'organization' && styles.typeCardSelected,
            ]}
            onPress={() => setSelectedType('organization')}
            activeOpacity={0.7}
          >
            <View style={styles.radioContainer}>
              <View style={[
                styles.radio,
                selectedType === 'organization' && styles.radioSelected
              ]}>
                {selectedType === 'organization' && (
                  <View style={styles.radioInner} />
                )}
              </View>
            </View>

            <View style={[
              styles.iconContainer,
              selectedType === 'organization' && styles.iconContainerSelected
            ]}>
              <Icon 
                name="business" 
                size={32} 
                color={selectedType === 'organization' ? colors.primary.main : colors.text.secondary} 
              />
            </View>

            <Text style={[
              styles.cardTitle,
              selectedType === 'organization' && styles.cardTitleSelected
            ]}>
              Organization/Manager
            </Text>
            
            <Text style={styles.cardDescription}>
              I manage organizations, staff, and daily collections for multiple cooperatives
            </Text>

            <View style={styles.features}>
              <View style={styles.feature}>
                <Icon name="checkmark-circle" size={16} color={colors.success.main} />
                <Text style={styles.featureText}>Manage Organizations</Text>
              </View>
              <View style={styles.feature}>
                <Icon name="checkmark-circle" size={16} color={colors.success.main} />
                <Text style={styles.featureText}>Staff Management</Text>
              </View>
              <View style={styles.feature}>
                <Icon name="checkmark-circle" size={16} color={colors.success.main} />
                <Text style={styles.featureText}>Daily Collections</Text>
              </View>
              <View style={styles.feature}>
                <Icon name="checkmark-circle" size={16} color={colors.success.main} />
                <Text style={styles.featureText}>Full Access to All Features</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Cooperative Card */}
          <TouchableOpacity
            style={[
              styles.typeCard,
              selectedType === 'cooperative' && styles.typeCardSelected,
            ]}
            onPress={() => setSelectedType('cooperative')}
            activeOpacity={0.7}
          >
            <View style={styles.radioContainer}>
              <View style={[
                styles.radio,
                selectedType === 'cooperative' && styles.radioSelected
              ]}>
                {selectedType === 'cooperative' && (
                  <View style={styles.radioInner} />
                )}
              </View>
            </View>

            <View style={[
              styles.iconContainer,
              selectedType === 'cooperative' && styles.iconContainerSelected
            ]}>
              <Icon 
                name="people" 
                size={32} 
                color={selectedType === 'cooperative' ? colors.primary.main : colors.text.secondary} 
              />
            </View>

            <Text style={[
              styles.cardTitle,
              selectedType === 'cooperative' && styles.cardTitleSelected
            ]}>
              Cooperative Member
            </Text>
            
            <Text style={styles.cardDescription}>
              I'm a member of a cooperative society focused on savings, loans, and contributions
            </Text>

            <View style={styles.features}>
              <View style={styles.feature}>
                <Icon name="checkmark-circle" size={16} color={colors.success.main} />
                <Text style={styles.featureText}>Join Cooperatives</Text>
              </View>
              <View style={styles.feature}>
                <Icon name="checkmark-circle" size={16} color={colors.success.main} />
                <Text style={styles.featureText}>Loans & Contributions</Text>
              </View>
              <View style={styles.feature}>
                <Icon name="checkmark-circle" size={16} color={colors.success.main} />
                <Text style={styles.featureText}>Savings & Group Buys</Text>
              </View>
              <View style={styles.feature}>
                <Icon name="checkmark-circle" size={16} color={colors.success.main} />
                <Text style={styles.featureText}>Member Activities</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Icon name="information-circle" size={20} color={colors.primary.main} />
          <Text style={styles.infoText}>
            Don't worry! You can always change this later or use both modes.
          </Text>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedType && styles.continueButtonDisabled
          ]}
          onPress={handleContinue}
          disabled={!selectedType}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
          <Icon name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
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
  skipButton: {
    alignSelf: 'flex-end',
    padding: spacing.sm,
  },
  skipText: {
    color: colors.text.secondary,
    fontSize: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.md,
  },
  cardsContainer: {
    gap: spacing.md,
  },
  typeCard: {
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.border.light,
    position: 'relative',
  },
  typeCardSelected: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.light,
  },
  radioContainer: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: colors.primary.main,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary.main,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.background.paper,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconContainerSelected: {
    backgroundColor: '#ffffff',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  cardTitleSelected: {
    color: colors.primary.dark,
  },
  cardDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  features: {
    gap: spacing.xs,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  featureText: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary.light,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.primary.dark,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    backgroundColor: '#ffffff',
  },
  continueButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary.main,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  continueButtonDisabled: {
    backgroundColor: colors.text.disabled,
    opacity: 0.5,
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default UserTypeSelectionScreen;
