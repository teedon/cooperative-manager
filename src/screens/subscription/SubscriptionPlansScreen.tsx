import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchPlans,
  initializeSubscription,
} from '../../store/slices/subscriptionSlice';
import { formatCurrency } from '../../utils/formatters';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import Icon from '../../components/common/Icon';
import { HomeStackParamList } from '../../navigation/MainNavigator';

type BillingCycle = 'monthly' | 'yearly';

type Props = NativeStackScreenProps<HomeStackParamList, 'SubscriptionPlans'>;

export default function SubscriptionPlansScreen({ navigation, route }: Props) {
  const { cooperativeId, currentPlanId } = route.params;
  const dispatch = useAppDispatch();
  const { plans, isLoading, isInitializing, error } = useAppSelector(
    (state) => state.subscription
  );

  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchPlans());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
    }
  }, [error]);

  const handleSelectPlan = async (planId: string) => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;

    // If selecting free plan, show confirmation
    if (plan.name === 'free') {
      Alert.alert(
        'Confirm Free Plan',
        'Are you sure you want to select the Free plan? You can upgrade anytime.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm',
            onPress: () => processSubscription(planId),
          },
        ]
      );
      return;
    }

    setSelectedPlanId(planId);
  };

  const processSubscription = async (planId: string) => {
    try {
      const result = await dispatch(
        initializeSubscription({
          cooperativeId,
          planId,
          billingCycle,
        })
      ).unwrap();

      if (result.requiresPayment && result.authorizationUrl) {
        // Navigate to Paystack WebView
        navigation.navigate('PaymentWebView', {
          authorizationUrl: result.authorizationUrl,
          reference: result.reference!,
          cooperativeId,
        });
      } else {
        // Free plan - subscription activated immediately
        Alert.alert('Success', 'Free plan activated successfully!', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to initialize subscription');
    }
  };

  const handleContinue = () => {
    if (selectedPlanId) {
      processSubscription(selectedPlanId);
    }
  };

  const getPrice = (plan: any) => {
    if (plan.name === 'free') return 0;
    return billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
  };

  const getMonthlyEquivalent = (plan: any) => {
    if (billingCycle === 'yearly' && plan.yearlyPrice > 0) {
      return Math.round(plan.yearlyPrice / 12);
    }
    return plan.monthlyPrice;
  };

  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case 'free':
        return 'gift-outline';
      case 'starter':
        return 'rocket-outline';
      case 'business':
        return 'briefcase-outline';
      case 'enterprise':
        return 'diamond-outline';
      default:
        return 'cube-outline';
    }
  };

  const getPlanColor = (planName: string) => {
    switch (planName) {
      case 'free':
        return '#6B7280';
      case 'starter':
        return '#3B82F6';
      case 'business':
        return '#8B5CF6';
      case 'enterprise':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.main} />
        <Text style={styles.loadingText}>Loading plans...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Choose Your Plan</Text>
          <Text style={styles.subtitle}>
            Select the plan that best fits your cooperative's needs
          </Text>
        </View>

        {/* Billing Toggle */}
        <View style={styles.toggleContainer}>
          <View style={styles.toggleWrapper}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                billingCycle === 'monthly' && styles.toggleButtonActive,
              ]}
              onPress={() => setBillingCycle('monthly')}
            >
              <Text
                style={[
                  styles.toggleText,
                  billingCycle === 'monthly' && styles.toggleTextActive,
                ]}
              >
                Monthly
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                billingCycle === 'yearly' && styles.toggleButtonActive,
              ]}
              onPress={() => setBillingCycle('yearly')}
            >
              <View style={styles.yearlyToggle}>
                <Text
                  style={[
                    styles.toggleText,
                    billingCycle === 'yearly' && styles.toggleTextActive,
                  ]}
                >
                  Yearly
                </Text>
                <View style={styles.saveBadge}>
                  <Text style={styles.saveBadgeText}>Save 20%</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Plans List */}
        <View style={styles.plansContainer}>
          {plans.map((plan) => {
            const isCurrentPlan = plan.id === currentPlanId;
            const isSelected = plan.id === selectedPlanId;
            const price = getPrice(plan);
            const planColor = getPlanColor(plan.name);

            return (
              <TouchableOpacity
                key={plan.id}
                style={[
                  styles.planCard,
                  isSelected && styles.planCardSelected,
                  isCurrentPlan && styles.planCardCurrent,
                ]}
                onPress={() => !isCurrentPlan && handleSelectPlan(plan.id)}
                disabled={isCurrentPlan}
              >
                {/* Plan Header */}
                <View style={styles.planHeader}>
                  <View style={[styles.planIcon, { backgroundColor: `${planColor}20` }]}>
                    <Icon name={getPlanIcon(plan.name)} size={24} color={planColor} />
                  </View>
                  <View style={styles.planInfo}>
                    <View style={styles.planNameRow}>
                      <Text style={styles.planName}>{plan.displayName}</Text>
                      {isCurrentPlan && (
                        <View style={styles.currentBadge}>
                          <Text style={styles.currentBadgeText}>Current</Text>
                        </View>
                      )}
                      {plan.name === 'business' && !isCurrentPlan && (
                        <View style={styles.popularBadge}>
                          <Text style={styles.popularBadgeText}>Popular</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.priceRow}>
                      <Text style={styles.price}>
                        {price === 0 ? 'Free' : formatCurrency(price / 100)}
                      </Text>
                      {price > 0 && (
                        <Text style={styles.pricePeriod}>
                          /{billingCycle === 'monthly' ? 'month' : 'year'}
                        </Text>
                      )}
                    </View>
                    {billingCycle === 'yearly' && price > 0 && (
                      <Text style={styles.monthlyEquivalent}>
                        {formatCurrency(getMonthlyEquivalent(plan) / 100)}/month
                      </Text>
                    )}
                  </View>
                </View>

                {/* Features */}
                <View style={styles.featuresSection}>
                  {/* Limits */}
                  <View style={styles.limitsRow}>
                    <View style={styles.limitItem}>
                      <Icon name="people-outline" size={16} color={colors.text.secondary} />
                      <Text style={styles.limitText}>
                        {plan.maxMembers === -1 ? 'Unlimited' : plan.maxMembers} members
                      </Text>
                    </View>
                    <View style={styles.limitItem}>
                      <Icon name="calendar-outline" size={16} color={colors.text.secondary} />
                      <Text style={styles.limitText}>
                        {plan.maxContributionPlans === -1 ? 'Unlimited' : plan.maxContributionPlans} plans
                      </Text>
                    </View>
                  </View>
                  <View style={styles.limitsRow}>
                    {plan.maxLoansPerMonth !== 0 && (
                      <View style={styles.limitItem}>
                        <Icon name="cash-outline" size={16} color={colors.text.secondary} />
                        <Text style={styles.limitText}>
                          {plan.maxLoansPerMonth === -1 ? 'Unlimited' : plan.maxLoansPerMonth} loans/mo
                        </Text>
                      </View>
                    )}
                    {plan.maxGroupBuys !== 0 && (
                      <View style={styles.limitItem}>
                        <Icon name="cart-outline" size={16} color={colors.text.secondary} />
                        <Text style={styles.limitText}>
                          {plan.maxGroupBuys === -1 ? 'Unlimited' : plan.maxGroupBuys} group buys
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Feature List */}
                  {plan.features && plan.features.length > 0 && (
                    <View style={styles.featureList}>
                      {plan.features.slice(0, 4).map((feature: string, index: number) => (
                        <View key={index} style={styles.featureItem}>
                          <Icon name="checkmark-circle" size={18} color={colors.success.main} />
                          <Text style={styles.featureText}>{feature}</Text>
                        </View>
                      ))}
                      {plan.features.length > 4 && (
                        <Text style={styles.moreFeatures}>
                          +{plan.features.length - 4} more features
                        </Text>
                      )}
                    </View>
                  )}
                </View>

                {/* Select Button */}
                {!isCurrentPlan && (
                  <TouchableOpacity
                    style={[
                      styles.selectButton,
                      isSelected && styles.selectButtonActive,
                    ]}
                    onPress={() => handleSelectPlan(plan.id)}
                  >
                    <Text
                      style={[
                        styles.selectButtonText,
                        isSelected && styles.selectButtonTextActive,
                      ]}
                    >
                      {isSelected ? 'Selected' : 'Select Plan'}
                    </Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Continue Button */}
      {selectedPlanId && (
        <View style={styles.continueContainer}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
            disabled={isInitializing}
          >
            {isInitializing ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.continueButtonText}>Continue to Payment</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background.default,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.text.secondary,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  backButton: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  toggleContainer: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  toggleWrapper: {
    flexDirection: 'row',
    backgroundColor: colors.secondary.main,
    borderRadius: borderRadius.lg,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  toggleButtonActive: {
    backgroundColor: colors.background.paper,
    ...shadows.sm,
  },
  toggleText: {
    textAlign: 'center',
    fontWeight: '600',
    color: colors.text.secondary,
  },
  toggleTextActive: {
    color: colors.primary.main,
  },
  yearlyToggle: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    marginLeft: spacing.xs,
  },
  saveBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#15803D',
  },
  plansContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  planCard: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadows.md,
  },
  planCardSelected: {
    borderColor: colors.primary.main,
  },
  planCardCurrent: {
    borderColor: colors.success.main,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  planIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planInfo: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  planNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  currentBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    marginLeft: spacing.xs,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#15803D',
  },
  popularBadge: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    marginLeft: spacing.xs,
  },
  popularBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#7C3AED',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  pricePeriod: {
    fontSize: 14,
    color: colors.text.secondary,
    marginLeft: 4,
  },
  monthlyEquivalent: {
    fontSize: 12,
    color: colors.text.disabled,
  },
  featuresSection: {
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingTop: spacing.md,
  },
  limitsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.sm,
  },
  limitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.md,
    marginBottom: spacing.xs,
  },
  limitText: {
    fontSize: 12,
    color: colors.text.secondary,
    marginLeft: 4,
  },
  featureList: {
    marginTop: spacing.xs,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  featureText: {
    fontSize: 14,
    color: colors.text.primary,
    marginLeft: spacing.xs,
    flex: 1,
  },
  moreFeatures: {
    fontSize: 12,
    color: colors.primary.main,
    marginLeft: 26,
  },
  selectButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.secondary.main,
  },
  selectButtonActive: {
    backgroundColor: colors.primary.main,
  },
  selectButtonText: {
    textAlign: 'center',
    fontWeight: '600',
    color: colors.text.primary,
  },
  selectButtonTextActive: {
    color: colors.primary.contrast,
  },
  continueContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.background.paper,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  continueButton: {
    backgroundColor: colors.primary.main,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  continueButtonText: {
    color: colors.primary.contrast,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
});
