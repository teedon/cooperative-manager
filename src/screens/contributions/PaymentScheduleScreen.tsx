import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchSubscriptionSchedules,
  fetchMySchedules,
} from '../../store/slices/contributionSlice';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import Icon from '../../components/common/Icon';
import { PaymentSchedule } from '../../models';

type Props = NativeStackScreenProps<HomeStackParamList, 'PaymentSchedule'>;

const PaymentScheduleScreen: React.FC<Props> = ({ route, navigation }) => {
  const { subscriptionId, cooperativeId } = route.params;
  const dispatch = useAppDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'overdue' | 'paid'>('all');

  const { subscriptionSchedules, mySchedules, isLoading } = useAppSelector(
    (state) => state.contribution
  );

  // Use subscription schedules if subscriptionId provided, otherwise use all my schedules
  const schedules = subscriptionId ? subscriptionSchedules : mySchedules;

  const loadData = useCallback(async () => {
    if (subscriptionId) {
      await dispatch(fetchSubscriptionSchedules(subscriptionId));
    } else if (cooperativeId) {
      await dispatch(fetchMySchedules(cooperativeId));
    }
  }, [dispatch, subscriptionId, cooperativeId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const filteredSchedules = schedules.filter((schedule) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return schedule.status === 'pending' && !schedule.isOverdue;
    if (filter === 'overdue') return schedule.isOverdue;
    if (filter === 'paid') return schedule.status === 'paid';
    return true;
  });

  const getStatusColor = (schedule: PaymentSchedule) => {
    if (schedule.isOverdue) return colors.error.main;
    switch (schedule.status) {
      case 'paid':
        return colors.success.main;
      case 'partial':
        return colors.warning.main;
      case 'pending':
        return colors.primary.main;
      case 'waived':
        return colors.text.disabled;
      default:
        return colors.text.secondary;
    }
  };

  const getStatusLabel = (schedule: PaymentSchedule) => {
    if (schedule.isOverdue) return `Overdue (${schedule.daysOverdue} days)`;
    return schedule.status;
  };

  const handlePaySchedule = (schedule: PaymentSchedule) => {
    navigation.navigate('RecordSchedulePayment', {
      scheduleId: schedule.id,
      planName: schedule.subscription?.plan?.name,
      amount: schedule.amount,
      dueDate: schedule.dueDate,
      periodLabel: schedule.periodLabel,
    });
  };

  const renderScheduleItem = ({ item }: { item: PaymentSchedule }) => {
    const statusColor = getStatusColor(item);
    const dueDate = new Date(item.dueDate);
    const isPastDue = new Date() > dueDate && item.status === 'pending';

    return (
      <TouchableOpacity
        style={[styles.scheduleCard, isPastDue && styles.overdueCard]}
        onPress={() => item.status !== 'paid' && handlePaySchedule(item)}
        disabled={item.status === 'paid'}
      >
        <View style={styles.scheduleHeader}>
          <View style={styles.periodInfo}>
            <Text style={styles.periodLabel}>{item.periodLabel || `Period ${item.periodNumber}`}</Text>
            {item.subscription?.plan?.name && (
              <Text style={styles.planName}>{item.subscription.plan.name}</Text>
            )}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {getStatusLabel(item)}
            </Text>
          </View>
        </View>

        <View style={styles.scheduleDetails}>
          <View style={styles.detailRow}>
            <Icon name="Calendar" size={16} color={colors.text.secondary} />
            <Text style={styles.detailText}>
              Due: {dueDate.toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Icon name="DollarSign" size={16} color={colors.text.secondary} />
            <Text style={styles.detailText}>
              ₦{item.amount.toLocaleString()}
            </Text>
          </View>
          {item.status === 'partial' && (
            <View style={styles.detailRow}>
              <Icon name="Check" size={16} color={colors.success.main} />
              <Text style={[styles.detailText, { color: colors.success.main }]}>
                Paid: ₦{item.paidAmount.toLocaleString()}
              </Text>
            </View>
          )}
        </View>

        {item.status !== 'paid' && (
          <View style={styles.actionSection}>
            <TouchableOpacity
              style={styles.payButton}
              onPress={() => handlePaySchedule(item)}
            >
              <Icon name="CreditCard" size={16} color={colors.primary.contrast} />
              <Text style={styles.payButtonText}>Record Payment</Text>
            </TouchableOpacity>
          </View>
        )}

        {item.status === 'paid' && item.paidAt && (
          <Text style={styles.paidDate}>
            Paid on {new Date(item.paidAt).toLocaleDateString()}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderFilterTabs = () => (
    <View style={styles.filterContainer}>
      {(['all', 'pending', 'overdue', 'paid'] as const).map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[styles.filterTab, filter === tab && styles.filterTabActive]}
          onPress={() => setFilter(tab)}
        >
          <Text style={[styles.filterText, filter === tab && styles.filterTextActive]}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Text>
          {tab === 'overdue' && schedules.filter((s) => s.isOverdue).length > 0 && (
            <View style={styles.badgeCount}>
              <Text style={styles.badgeCountText}>
                {schedules.filter((s) => s.isOverdue).length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderSummary = () => {
    const overdueCount = schedules.filter((s) => s.isOverdue).length;
    const pendingCount = schedules.filter((s) => s.status === 'pending' && !s.isOverdue).length;
    const totalOverdue = schedules
      .filter((s) => s.isOverdue)
      .reduce((sum, s) => sum + (s.amount - s.paidAmount), 0);

    return (
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{overdueCount}</Text>
          <Text style={styles.summaryLabel}>Overdue</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{pendingCount}</Text>
          <Text style={styles.summaryLabel}>Upcoming</Text>
        </View>
        <View style={[styles.summaryCard, styles.summaryCardWide]}>
          <Text style={[styles.summaryValue, { color: colors.error.main }]}>
            ₦{totalOverdue.toLocaleString()}
          </Text>
          <Text style={styles.summaryLabel}>Total Overdue</Text>
        </View>
      </View>
    );
  };

  if (isLoading && schedules.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.main} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderSummary()}
      {renderFilterTabs()}
      
      <FlatList
        data={filteredSchedules}
        renderItem={renderScheduleItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="Calendar" size={48} color={colors.text.disabled} />
            <Text style={styles.emptyText}>
              {filter === 'all'
                ? 'No payment schedules found'
                : `No ${filter} schedules`}
            </Text>
          </View>
        }
      />
    </View>
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
  summaryContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  summaryCardWide: {
    flex: 1.5,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.paper,
    gap: spacing.xs,
  },
  filterTabActive: {
    backgroundColor: colors.primary.main,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  filterTextActive: {
    color: colors.primary.contrast,
  },
  badgeCount: {
    backgroundColor: colors.error.main,
    borderRadius: 10,
    minWidth: 20,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  badgeCountText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.primary.contrast,
    textAlign: 'center',
  },
  listContent: {
    padding: spacing.md,
    paddingTop: 0,
  },
  scheduleCard: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  overdueCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.error.main,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  periodInfo: {
    flex: 1,
  },
  periodLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  planName: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  scheduleDetails: {
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detailText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  actionSection: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.main,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  payButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary.contrast,
  },
  paidDate: {
    fontSize: 12,
    color: colors.success.main,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
});

export default PaymentScheduleScreen;
