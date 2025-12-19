import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchSubscription,
  fetchUsage,
  cancelSubscription,
} from '../../store/slices/subscriptionSlice';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import Icon from '../../components/common/Icon';
import { HomeStackParamList } from '../../navigation/MainNavigator';

type Props = NativeStackScreenProps<HomeStackParamList, 'SubscriptionManagement'>;

export default function SubscriptionManagementScreen({ navigation, route }: Props) {
  const { cooperativeId } = route.params;
  const dispatch = useAppDispatch();
  const { currentSubscription, usage, isLoading, error } = useAppSelector(
    (state) => state.subscription
  );

  const [refreshing, setRefreshing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    loadData();
  }, [dispatch, cooperativeId]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
    }
  }, [error]);

  const loadData = async () => {
    await Promise.all([
      dispatch(fetchSubscription(cooperativeId)),
      dispatch(fetchUsage(cooperativeId)),
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleUpgrade = () => {
    navigation.navigate('SubscriptionPlans', {
      cooperativeId,
      currentPlanId: currentSubscription?.plan?.id,
    });
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.',
      [
        { text: 'Keep Subscription', style: 'cancel' },
        {
          text: 'Cancel Subscription',
          style: 'destructive',
          onPress: async () => {
            setIsCancelling(true);
            try {
              await dispatch(cancelSubscription({ cooperativeId })).unwrap();
              Alert.alert(
                'Subscription Cancelled',
                'Your subscription has been cancelled. You will continue to have access until the end of your billing period.'
              );
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to cancel subscription');
            } finally {
              setIsCancelling(false);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return { bg: '#DCFCE7', text: '#15803D' };
      case 'cancelled':
        return { bg: '#FEE2E2', text: '#DC2626' };
      case 'past_due':
        return { bg: '#FEF3C7', text: '#D97706' };
      case 'trialing':
        return { bg: '#DBEAFE', text: '#2563EB' };
      default:
        return { bg: colors.secondary.main, text: colors.text.secondary };
    }
  };

  const getUsagePercentage = (current: number, max: number) => {
    if (max === -1) return 0; // Unlimited
    return Math.min((current / max) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return '#EF4444';
    if (percentage >= 70) return '#F59E0B';
    return '#10B981';
  };

  if (isLoading && !currentSubscription) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.main} />
        <Text style={styles.loadingText}>Loading subscription...</Text>
      </SafeAreaView>
    );
  }

  const plan = currentSubscription?.plan;
  const statusColors = getStatusColor(currentSubscription?.status || 'inactive');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Subscription</Text>
          <Text style={styles.subtitle}>Manage your cooperative's subscription</Text>
        </View>

        {/* Current Plan Card */}
        <View style={styles.section}>
          <View style={styles.planCard}>
            <View style={styles.planCardHeader}>
              <View>
                <Text style={styles.planLabel}>Current Plan</Text>
                <Text style={styles.planName}>{plan?.displayName || 'No Plan'}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                <Text style={[styles.statusText, { color: statusColors.text }]}>
                  {currentSubscription?.status || 'Inactive'}
                </Text>
              </View>
            </View>

            {currentSubscription && plan && (
              <>
                {/* Billing Info */}
                <View style={styles.billingInfo}>
                  <View style={styles.billingRow}>
                    <Text style={styles.billingLabel}>Billing Cycle</Text>
                    <Text style={styles.billingValue}>
                      {currentSubscription.billingCycle === 'monthly' ? 'Monthly' : 'Yearly'}
                    </Text>
                  </View>

                  {plan.monthlyPrice > 0 && (
                    <View style={styles.billingRow}>
                      <Text style={styles.billingLabel}>Amount</Text>
                      <Text style={styles.billingValue}>
                        {formatCurrency(
                          (currentSubscription.billingCycle === 'monthly'
                            ? plan.monthlyPrice
                            : plan.yearlyPrice) / 100
                        )}
                        /{currentSubscription.billingCycle === 'monthly' ? 'mo' : 'yr'}
                      </Text>
                    </View>
                  )}

                  {currentSubscription.currentPeriodEnd && (
                    <View style={styles.billingRow}>
                      <Text style={styles.billingLabel}>
                        {currentSubscription.status === 'cancelled'
                          ? 'Access Until'
                          : 'Next Billing'}
                      </Text>
                      <Text style={styles.billingValue}>
                        {formatDate(currentSubscription.currentPeriodEnd)}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Actions */}
                <View style={styles.actionsRow}>
                  <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade}>
                    <Text style={styles.upgradeButtonText}>
                      {plan.name === 'free' ? 'Upgrade' : 'Change Plan'}
                    </Text>
                  </TouchableOpacity>

                  {plan.name !== 'free' && currentSubscription.status === 'active' && (
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={handleCancelSubscription}
                      disabled={isCancelling}
                    >
                      {isCancelling ? (
                        <ActivityIndicator color="#EF4444" />
                      ) : (
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}

            {!currentSubscription && (
              <TouchableOpacity style={styles.choosePlanButton} onPress={handleUpgrade}>
                <Text style={styles.choosePlanButtonText}>Choose a Plan</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Usage Section */}
        {usage && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Usage & Limits</Text>

            <View style={styles.usageCard}>
              {/* Members */}
              <View style={styles.usageItem}>
                <View style={styles.usageHeader}>
                  <Text style={styles.usageLabel}>Members</Text>
                  <Text style={styles.usageValue}>
                    {usage.usage.members.used} /{' '}
                    {usage.usage.members.limit === -1 ? '∞' : usage.usage.members.limit}
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${getUsagePercentage(
                          usage.usage.members.used,
                          usage.usage.members.limit
                        )}%`,
                        backgroundColor: getUsageColor(
                          getUsagePercentage(usage.usage.members.used, usage.usage.members.limit)
                        ),
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Contribution Plans */}
              <View style={styles.usageItem}>
                <View style={styles.usageHeader}>
                  <Text style={styles.usageLabel}>Contribution Plans</Text>
                  <Text style={styles.usageValue}>
                    {usage.usage.contributionPlans.used} /{' '}
                    {usage.usage.contributionPlans.limit === -1
                      ? '∞'
                      : usage.usage.contributionPlans.limit}
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${getUsagePercentage(
                          usage.usage.contributionPlans.used,
                          usage.usage.contributionPlans.limit
                        )}%`,
                        backgroundColor: getUsageColor(
                          getUsagePercentage(
                            usage.usage.contributionPlans.used,
                            usage.usage.contributionPlans.limit
                          )
                        ),
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Loans This Month */}
              <View style={styles.usageItem}>
                <View style={styles.usageHeader}>
                  <Text style={styles.usageLabel}>Loans This Month</Text>
                  <Text style={styles.usageValue}>
                    {usage.usage.loansThisMonth.used} /{' '}
                    {usage.usage.loansThisMonth.limit === -1
                      ? '∞'
                      : usage.usage.loansThisMonth.limit === 0
                      ? 'N/A'
                      : usage.usage.loansThisMonth.limit}
                  </Text>
                </View>
                {usage.usage.loansThisMonth.limit !== 0 && (
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${getUsagePercentage(
                            usage.usage.loansThisMonth.used,
                            usage.usage.loansThisMonth.limit
                          )}%`,
                          backgroundColor: getUsageColor(
                            getUsagePercentage(
                              usage.usage.loansThisMonth.used,
                              usage.usage.loansThisMonth.limit
                            )
                          ),
                        },
                      ]}
                    />
                  </View>
                )}
              </View>

              {/* Group Buys */}
              <View style={[styles.usageItem, { marginBottom: 0 }]}>
                <View style={styles.usageHeader}>
                  <Text style={styles.usageLabel}>Group Buys</Text>
                  <Text style={styles.usageValue}>
                    {usage.usage.groupBuys.used} /{' '}
                    {usage.usage.groupBuys.limit === -1
                      ? '∞'
                      : usage.usage.groupBuys.limit === 0
                      ? 'N/A'
                      : usage.usage.groupBuys.limit}
                  </Text>
                </View>
                {usage.usage.groupBuys.limit !== 0 && (
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${getUsagePercentage(
                            usage.usage.groupBuys.used,
                            usage.usage.groupBuys.limit
                          )}%`,
                          backgroundColor: getUsageColor(
                            getUsagePercentage(
                              usage.usage.groupBuys.used,
                              usage.usage.groupBuys.limit
                            )
                          ),
                        },
                      ]}
                    />
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Plan Features */}
        {plan && plan.features && plan.features.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Plan Features</Text>

            <View style={styles.featuresCard}>
              {plan.features.map((feature: string, index: number) => (
                <View
                  key={index}
                  style={[
                    styles.featureItem,
                    index === (plan.features?.length || 0) - 1 && { marginBottom: 0 },
                  ]}
                >
                  <Icon name="checkmark-circle" size={20} color={colors.success.main} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Need Help Section */}
        <View style={styles.section}>
          <View style={styles.helpCard}>
            <View style={styles.helpHeader}>
              <Icon name="help-circle-outline" size={24} color={colors.primary.main} />
              <Text style={styles.helpTitle}>Need Help?</Text>
            </View>
            <Text style={styles.helpText}>
              Contact our support team for any questions about your subscription or billing.
            </Text>
            <TouchableOpacity style={styles.supportButton}>
              <Text style={styles.supportButtonText}>Contact Support</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
    marginTop: 4,
  },
  section: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  planCard: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    ...shadows.md,
  },
  planCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  planLabel: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  billingInfo: {
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingTop: spacing.md,
  },
  billingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  billingLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  billingValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  upgradeButton: {
    flex: 1,
    backgroundColor: colors.primary.main,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  upgradeButtonText: {
    color: colors.primary.contrast,
    textAlign: 'center',
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.secondary.main,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  cancelButtonText: {
    color: '#EF4444',
    textAlign: 'center',
    fontWeight: '600',
  },
  choosePlanButton: {
    backgroundColor: colors.primary.main,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
  },
  choosePlanButtonText: {
    color: colors.primary.contrast,
    textAlign: 'center',
    fontWeight: '600',
  },
  usageCard: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    ...shadows.sm,
  },
  usageItem: {
    marginBottom: spacing.md,
  },
  usageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  usageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  usageValue: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.secondary.main,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  featuresCard: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    ...shadows.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  featureText: {
    fontSize: 14,
    color: colors.text.primary,
    marginLeft: spacing.sm,
    flex: 1,
  },
  helpCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
  },
  helpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginLeft: spacing.xs,
  },
  helpText: {
    fontSize: 14,
    color: '#1D4ED8',
    marginBottom: spacing.md,
  },
  supportButton: {
    backgroundColor: colors.primary.main,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  supportButtonText: {
    color: colors.primary.contrast,
    textAlign: 'center',
    fontWeight: '600',
  },
});
