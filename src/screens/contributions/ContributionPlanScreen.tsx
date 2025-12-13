import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchPlan,
  fetchPlanSubscriptions,
  fetchMySubscriptions,
  subscribeToPlan,
  updateSubscription,
  setCurrentPlan,
  fetchMyPayments,
  fetchSubscriptionSchedules,
} from '../../store/slices/contributionSlice';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import Icon from '../../components/common/Icon';

type Props = NativeStackScreenProps<HomeStackParamList, 'ContributionPlan'>;

const ContributionPlanScreen: React.FC<Props> = ({ route, navigation }) => {
  const { planId } = route.params;
  const dispatch = useAppDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [subscribeAmount, setSubscribeAmount] = useState('');

  const { plans, currentPlan, mySubscriptions, planSubscriptions, isLoading, myPayments, subscriptionSchedules } = useAppSelector(
    (state) => state.contribution
  );
  const { members } = useAppSelector((state) => state.cooperative);
  const { user } = useAppSelector((state) => state.auth);

  const plan = currentPlan || plans.find((p) => p.id === planId);
  const currentMember = members.find((m) => m.userId === user?.id);
  const isAdmin = currentMember?.role === 'admin';
  
  // Check if user is already subscribed
  const mySubscription = mySubscriptions.find((s) => s.planId === planId);
  
  // Filter payments for this subscription
  const subscriptionPayments = mySubscription 
    ? myPayments.filter((p) => p.subscriptionId === mySubscription.id)
    : [];

  const loadData = useCallback(async () => {
    try {
      const fetchedPlan = await dispatch(fetchPlan(planId)).unwrap();
      const cooperativeId = fetchedPlan?.cooperativeId || plan?.cooperativeId || currentMember?.cooperativeId;
      
      if (cooperativeId) {
        const subscriptions = await dispatch(fetchMySubscriptions(cooperativeId)).unwrap();
        await dispatch(fetchMyPayments(cooperativeId));
        
        // Fetch schedules for the subscription to this plan
        const sub = subscriptions?.find((s: any) => s.planId === planId);
        if (sub) {
          await dispatch(fetchSubscriptionSchedules(sub.id));
        }
      }
      if (isAdmin) {
        await dispatch(fetchPlanSubscriptions(planId));
      }
    } catch (error) {
      console.error('Error loading plan data:', error);
    }
  }, [dispatch, planId, plan?.cooperativeId, currentMember?.cooperativeId, isAdmin]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  // Re-fetch subscriptions when plan.cooperativeId becomes available
  useEffect(() => {
    if (plan?.cooperativeId && mySubscriptions.length === 0) {
      dispatch(fetchMySubscriptions(plan.cooperativeId));
      dispatch(fetchMyPayments(plan.cooperativeId));
    }
  }, [dispatch, plan?.cooperativeId, mySubscriptions.length]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSubscribe = () => {
    if (!plan) return;

    if (plan.amountType === 'fixed') {
      // For fixed plans, subscribe directly with the fixed amount
      confirmSubscribe(plan.fixedAmount!);
    } else {
      // For notional plans, show modal to enter amount
      setSubscribeAmount('');
      setShowSubscribeModal(true);
    }
  };

  const confirmSubscribe = async (amount: number) => {
    try {
      await dispatch(subscribeToPlan({ planId, data: { amount } })).unwrap();
      Alert.alert('Success', 'You have successfully subscribed to this contribution plan!');
      setShowSubscribeModal(false);
      loadData();
    } catch (err: any) {
      Alert.alert('Error', err || 'Failed to subscribe to plan');
    }
  };

  const handleUpdateSubscription = (action: 'pause' | 'resume' | 'cancel') => {
    if (!mySubscription) return;

    const actionMessages = {
      pause: 'pause your subscription',
      resume: 'resume your subscription',
      cancel: 'cancel your subscription',
    };

    Alert.alert(
      'Confirm Action',
      `Are you sure you want to ${actionMessages[action]}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              const status = action === 'pause' ? 'paused' : action === 'resume' ? 'active' : 'cancelled';
              await dispatch(
                updateSubscription({ subscriptionId: mySubscription.id, data: { status } })
              ).unwrap();
              Alert.alert('Success', `Subscription ${action}d successfully`);
              loadData();
            } catch (err: any) {
              Alert.alert('Error', err || `Failed to ${action} subscription`);
            }
          },
        },
      ]
    );
  };

  const handleAdminUpdateSubscription = (subscriptionId: string, action: 'pause' | 'resume' | 'cancel', memberName: string) => {
    const actionMessages = {
      pause: `pause ${memberName}'s subscription`,
      resume: `resume ${memberName}'s subscription`,
      cancel: `cancel ${memberName}'s subscription`,
    };

    Alert.alert(
      'Admin Action',
      `Are you sure you want to ${actionMessages[action]}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: action === 'cancel' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              const status = action === 'pause' ? 'paused' : action === 'resume' ? 'active' : 'cancelled';
              await dispatch(
                updateSubscription({ subscriptionId, data: { status } })
              ).unwrap();
              Alert.alert('Success', `Subscription ${action}d successfully`);
              loadData();
            } catch (err: any) {
              Alert.alert('Error', err || `Failed to ${action} subscription`);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return colors.success.main;
      case 'paused':
        return colors.warning.main;
      case 'cancelled':
        return colors.error.main;
      default:
        return colors.text.secondary;
    }
  };

  if (isLoading && !plan) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.main} />
      </View>
    );
  }

  if (!plan) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="AlertCircle" size={48} color={colors.text.disabled} />
        <Text style={styles.errorText}>Plan not found</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerBadges}>
          <View style={[styles.categoryBadge, plan.category === 'compulsory' ? styles.compulsoryBadge : styles.optionalBadge]}>
            <Text style={[styles.categoryBadgeText, plan.category === 'compulsory' ? styles.compulsoryText : styles.optionalText]}>
              {plan.category}
            </Text>
          </View>
          <View style={[styles.statusBadge, plan.isActive ? styles.activeBadge : styles.inactiveBadge]}>
            <Text style={[styles.statusBadgeText, { color: plan.isActive ? colors.success.main : colors.error.main }]}>
              {plan.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
        <Text style={styles.planName}>{plan.name}</Text>
        {plan.description && <Text style={styles.planDescription}>{plan.description}</Text>}
      </View>

      {/* Details Card */}
      <View style={styles.detailsCard}>
        <View style={styles.detailRow}>
          <View style={styles.detailIconContainer}>
            <Icon name={plan.amountType === 'fixed' ? 'Lock' : 'Unlock'} size={16} color={colors.primary.main} />
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Amount Type</Text>
            <Text style={styles.detailValue}>
              {plan.amountType === 'fixed' ? 'Fixed Amount' : 'Member Decides (Notional)'}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailIconContainer}>
            <Icon name="DollarSign" size={16} color={colors.primary.main} />
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Amount</Text>
            <Text style={styles.detailValue}>
              {plan.amountType === 'fixed'
                ? `₦${plan.fixedAmount?.toLocaleString()}`
                : plan.minAmount && plan.maxAmount
                  ? `₦${plan.minAmount.toLocaleString()} - ₦${plan.maxAmount.toLocaleString()}`
                  : 'Any amount'}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailIconContainer}>
            <Icon name="Calendar" size={16} color={colors.primary.main} />
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Frequency</Text>
            <Text style={styles.detailValue}>{plan.frequency || 'Not specified'}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailIconContainer}>
            <Icon name="Clock" size={16} color={colors.primary.main} />
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Duration Type</Text>
            <Text style={styles.detailValue}>
              {plan.contributionType === 'continuous' ? 'Continuous (No end date)' : 'Period-based'}
            </Text>
          </View>
        </View>

        {plan.startDate && (
          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Icon name="Play" size={16} color={colors.primary.main} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Start Date</Text>
              <Text style={styles.detailValue}>{new Date(plan.startDate).toLocaleDateString()}</Text>
            </View>
          </View>
        )}

        {plan.endDate && (
          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Icon name="Square" size={16} color={colors.primary.main} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>End Date</Text>
              <Text style={styles.detailValue}>{new Date(plan.endDate).toLocaleDateString()}</Text>
            </View>
          </View>
        )}

        {plan._count && (
          <View style={[styles.detailRow, styles.lastDetailRow]}>
            <View style={styles.detailIconContainer}>
              <Icon name="Users" size={16} color={colors.primary.main} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Subscribers</Text>
              <Text style={styles.detailValue}>{plan._count.subscriptions} member(s)</Text>
            </View>
          </View>
        )}
      </View>

      {/* Subscription Status / Actions */}
      <View style={styles.subscriptionSection}>
        <Text style={styles.sectionTitle}>My Subscription</Text>
        
        {mySubscription ? (
          <View style={styles.subscriptionCard}>
            <View style={styles.subscriptionHeader}>
              <View style={[styles.subscriptionStatus, { backgroundColor: getStatusColor(mySubscription.status) + '20' }]}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(mySubscription.status) }]} />
                <Text style={[styles.subscriptionStatusText, { color: getStatusColor(mySubscription.status) }]}>
                  {mySubscription.status}
                </Text>
              </View>
            </View>
            
            <View style={styles.subscriptionDetails}>
              <Text style={styles.subscriptionAmount}>₦{mySubscription.amount.toLocaleString()}</Text>
              <Text style={styles.subscriptionLabel}>per {plan.frequency}</Text>
            </View>

            <Text style={styles.subscribedDate}>
              Subscribed on {new Date(mySubscription.subscribedAt).toLocaleDateString()}
            </Text>

            <View style={styles.subscriptionActions}>
              {mySubscription.status === 'active' && (
                <>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.recordPaymentButton]}
                    onPress={() => navigation.navigate('RecordSubscriptionPayment', { subscriptionId: mySubscription.id })}
                  >
                    <Icon name="CreditCard" size={16} color={colors.primary.main} />
                    <Text style={[styles.actionButtonText, { color: colors.primary.main }]}>Record Payment</Text>
                  </TouchableOpacity>
                </>
              )}
              {(mySubscription.status === 'paused' || mySubscription.status === 'cancelled') && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.resumeButton]}
                  onPress={() => handleUpdateSubscription('resume')}
                >
                  <Icon name="Play" size={16} color={colors.success.main} />
                  <Text style={[styles.actionButtonText, { color: colors.success.main }]}>Resume Subscription</Text>
                </TouchableOpacity>
              )}
              {(mySubscription.status === 'paused' || mySubscription.status === 'cancelled') && (
                <Text style={styles.pausedByAdminText}>
                  Contact admin if you need assistance
                </Text>
              )}
            </View>

            {/* Payment History */}
            {subscriptionPayments.length > 0 && (
              <View style={styles.paymentHistorySection}>
                <Text style={styles.paymentHistoryTitle}>Recent Payments</Text>
                {subscriptionPayments.slice(0, 5).map((payment) => (
                  <View key={payment.id} style={styles.paymentHistoryItem}>
                    <View style={styles.paymentHistoryLeft}>
                      <Text style={styles.paymentHistoryAmount}>₦{payment.amount.toLocaleString()}</Text>
                      <Text style={styles.paymentHistoryDate}>
                        {new Date(payment.paymentDate).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={[
                      styles.paymentStatusBadge,
                      payment.status === 'approved' && styles.paymentApproved,
                      payment.status === 'pending' && styles.paymentPending,
                      payment.status === 'rejected' && styles.paymentRejected,
                    ]}>
                      <Text style={[
                        styles.paymentStatusText,
                        payment.status === 'approved' && { color: colors.success.main },
                        payment.status === 'pending' && { color: colors.warning.main },
                        payment.status === 'rejected' && { color: colors.error.main },
                      ]}>
                        {payment.status}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Payment Schedule Preview */}
            {subscriptionSchedules.length > 0 && (
              <View style={styles.schedulePreviewSection}>
                <View style={styles.schedulePreviewHeader}>
                  <Text style={styles.schedulePreviewTitle}>Payment Schedule</Text>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('PaymentSchedule', { subscriptionId: mySubscription.id })}
                  >
                    <Text style={styles.viewAllLink}>View All</Text>
                  </TouchableOpacity>
                </View>
                
                {/* Overdue warning */}
                {subscriptionSchedules.filter(s => s.isOverdue).length > 0 && (
                  <View style={styles.overdueWarning}>
                    <Icon name="AlertTriangle" size={16} color={colors.error.main} />
                    <Text style={styles.overdueWarningText}>
                      {subscriptionSchedules.filter(s => s.isOverdue).length} overdue payment(s)
                    </Text>
                  </View>
                )}

                {/* Next upcoming schedules */}
                {subscriptionSchedules
                  .filter(s => s.status === 'pending')
                  .slice(0, 3)
                  .map((schedule) => (
                    <TouchableOpacity
                      key={schedule.id}
                      style={[styles.scheduleItem, schedule.isOverdue && styles.scheduleItemOverdue]}
                      onPress={() => navigation.navigate('RecordSchedulePayment', {
                        scheduleId: schedule.id,
                        planName: plan?.name,
                        amount: schedule.amount,
                        dueDate: schedule.dueDate,
                        periodLabel: schedule.periodLabel,
                      })}
                    >
                      <View style={styles.scheduleItemLeft}>
                        <Text style={styles.scheduleItemPeriod}>{schedule.periodLabel}</Text>
                        <Text style={[styles.scheduleItemDue, schedule.isOverdue && styles.scheduleItemDueOverdue]}>
                          Due: {new Date(schedule.dueDate).toLocaleDateString()}
                          {schedule.isOverdue && ` (${schedule.daysOverdue} days late)`}
                        </Text>
                      </View>
                      <View style={styles.scheduleItemRight}>
                        <Text style={styles.scheduleItemAmount}>₦{schedule.amount.toLocaleString()}</Text>
                        <Icon name="ChevronRight" size={16} color={colors.text.disabled} />
                      </View>
                    </TouchableOpacity>
                  ))}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.notSubscribedCard}>
            <Icon name="UserPlus" size={32} color={colors.text.disabled} />
            <Text style={styles.notSubscribedText}>You're not subscribed to this plan</Text>
            {plan.isActive && (
              <TouchableOpacity style={styles.subscribeButton} onPress={handleSubscribe}>
                <Icon name="Plus" size={18} color={colors.primary.contrast} />
                <Text style={styles.subscribeButtonText}>Subscribe Now</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Admin: Plan Subscribers */}
      {isAdmin && planSubscriptions.length > 0 && (
        <View style={styles.subscribersSection}>
          <Text style={styles.sectionTitle}>All Subscribers ({planSubscriptions.length})</Text>
          {planSubscriptions.map((sub) => (
            <View key={sub.id} style={styles.subscriberCard}>
              <View style={styles.subscriberInfo}>
                <Text style={styles.subscriberName}>
                  {(sub.member as any)?.user?.firstName} {(sub.member as any)?.user?.lastName}
                </Text>
                <Text style={styles.subscriberAmount}>₦{sub.amount.toLocaleString()}</Text>
              </View>
              <View style={styles.subscriberActions}>
                <View style={[styles.subscriberStatus, { backgroundColor: getStatusColor(sub.status) + '20' }]}>
                  <Text style={[styles.subscriberStatusText, { color: getStatusColor(sub.status) }]}>
                    {sub.status}
                  </Text>
                </View>
                {sub.status === 'active' && (
                  <View style={styles.adminActionButtons}>
                    <TouchableOpacity
                      style={styles.adminActionBtn}
                      onPress={() => handleAdminUpdateSubscription(sub.id, 'pause', (sub.member as any)?.user?.firstName)}
                    >
                      <Icon name="Pause" size={14} color={colors.warning.main} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.adminActionBtn}
                      onPress={() => handleAdminUpdateSubscription(sub.id, 'cancel', (sub.member as any)?.user?.firstName)}
                    >
                      <Icon name="X" size={14} color={colors.error.main} />
                    </TouchableOpacity>
                  </View>
                )}
                {(sub.status === 'paused' || sub.status === 'cancelled') && (
                  <TouchableOpacity
                    style={styles.adminActionBtn}
                    onPress={() => handleAdminUpdateSubscription(sub.id, 'resume', (sub.member as any)?.user?.firstName)}
                  >
                    <Icon name="Play" size={14} color={colors.success.main} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Subscribe Modal for Notional Plans */}
      <Modal
        visible={showSubscribeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSubscribeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Subscribe to {plan.name}</Text>
              <TouchableOpacity onPress={() => setShowSubscribeModal(false)}>
                <Icon name="X" size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Enter the amount you want to contribute per {plan.frequency}
            </Text>

            {plan.minAmount && plan.maxAmount && (
              <Text style={styles.amountHint}>
                Range: ₦{plan.minAmount.toLocaleString()} - ₦{plan.maxAmount.toLocaleString()}
              </Text>
            )}

            <View style={styles.amountInputContainer}>
              <Text style={styles.currencyPrefix}>₦</Text>
              <TextInput
                style={styles.amountInput}
                value={subscribeAmount}
                onChangeText={setSubscribeAmount}
                keyboardType="numeric"
                placeholder="Enter amount"
                placeholderTextColor={colors.text.disabled}
              />
            </View>

            <TouchableOpacity
              style={[styles.confirmButton, !subscribeAmount && styles.confirmButtonDisabled]}
              onPress={() => {
                const amount = parseInt(subscribeAmount);
                if (isNaN(amount) || amount <= 0) {
                  Alert.alert('Invalid Amount', 'Please enter a valid amount');
                  return;
                }
                confirmSubscribe(amount);
              }}
              disabled={!subscribeAmount}
            >
              <Text style={styles.confirmButtonText}>Confirm Subscription</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  errorText: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  header: {
    backgroundColor: colors.primary.main,
    padding: spacing.xl,
    paddingTop: spacing.lg,
  },
  headerBadges: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  categoryBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  compulsoryBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  optionalBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  compulsoryText: {
    color: colors.primary.contrast,
  },
  optionalText: {
    color: colors.primary.contrast,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  activeBadge: {
    backgroundColor: colors.success.light,
  },
  inactiveBadge: {
    backgroundColor: colors.error.light,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary.contrast,
    marginBottom: spacing.xs,
  },
  planDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  detailsCard: {
    backgroundColor: colors.background.paper,
    marginHorizontal: spacing.lg,
    marginTop: -spacing.xl,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.lg,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  lastDetailRow: {
    borderBottomWidth: 0,
  },
  detailIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    textTransform: 'capitalize',
  },
  subscriptionSection: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  subscriptionCard: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.md,
  },
  subscriptionHeader: {
    marginBottom: spacing.md,
  },
  subscriptionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  subscriptionStatusText: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  subscriptionDetails: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  subscriptionAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary.main,
  },
  subscriptionLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  subscribedDate: {
    fontSize: 12,
    color: colors.text.disabled,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  subscriptionActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.xs,
  },
  pauseButton: {
    borderColor: colors.warning.main,
    backgroundColor: colors.warning.light,
  },
  resumeButton: {
    borderColor: colors.success.main,
    backgroundColor: colors.success.light,
  },
  cancelButton: {
    borderColor: colors.error.main,
    backgroundColor: colors.error.light,
  },
  recordPaymentButton: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.light,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  paymentHistorySection: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  paymentHistoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  paymentHistoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  paymentHistoryLeft: {
    flex: 1,
  },
  paymentHistoryAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  paymentHistoryDate: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  paymentStatusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  paymentApproved: {
    backgroundColor: colors.success.light,
  },
  paymentPending: {
    backgroundColor: colors.warning.light,
  },
  paymentRejected: {
    backgroundColor: colors.error.light,
  },
  paymentStatusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  schedulePreviewSection: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  schedulePreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  schedulePreviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  viewAllLink: {
    fontSize: 14,
    color: colors.primary.main,
    fontWeight: '500',
  },
  overdueWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error.light,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  overdueWarningText: {
    fontSize: 13,
    color: colors.error.main,
    fontWeight: '500',
  },
  scheduleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background.default,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  scheduleItemOverdue: {
    borderLeftWidth: 3,
    borderLeftColor: colors.error.main,
  },
  scheduleItemLeft: {
    flex: 1,
  },
  scheduleItemPeriod: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  scheduleItemDue: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  scheduleItemDueOverdue: {
    color: colors.error.main,
  },
  scheduleItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  scheduleItemAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary.main,
  },
  notSubscribedCard: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.md,
  },
  notSubscribedText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  subscribeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.main,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  subscribeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary.contrast,
  },
  subscribersSection: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  subscriberCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  subscriberInfo: {
    flex: 1,
  },
  subscriberName: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text.primary,
  },
  subscriberAmount: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
  },
  subscriberStatus: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  subscriberStatusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  subscriberActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  adminActionButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  adminActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background.default,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.paper,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  modalDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  amountHint: {
    fontSize: 12,
    color: colors.primary.main,
    marginBottom: spacing.lg,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  currencyPrefix: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.secondary,
    marginRight: spacing.sm,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    color: colors.text.primary,
    paddingVertical: spacing.lg,
  },
  confirmButton: {
    backgroundColor: colors.primary.main,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary.contrast,
  },
  pausedByAdminText: {
    fontSize: 12,
    color: colors.text.secondary,
    fontStyle: 'italic',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});

export default ContributionPlanScreen;
