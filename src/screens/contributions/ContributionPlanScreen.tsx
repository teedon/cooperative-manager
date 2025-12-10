import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchPeriods, setCurrentPlan } from '../../store/slices/contributionSlice';
import { ContributionPeriod } from '../../models';

type Props = NativeStackScreenProps<HomeStackParamList, 'ContributionPlan'>;

const ContributionPlanScreen: React.FC<Props> = ({ route, navigation }) => {
  const { planId } = route.params;
  const dispatch = useAppDispatch();
  const [refreshing, setRefreshing] = React.useState(false);

  const { plans, periods, isLoading } = useAppSelector((state) => state.contribution);
  const plan = plans.find((p) => p.id === planId);

  const loadData = useCallback(async () => {
    await dispatch(fetchPeriods(planId));
  }, [dispatch, planId]);

  useEffect(() => {
    loadData();
    if (plan) {
      dispatch(setCurrentPlan(plan));
    }
  }, [loadData, plan, dispatch]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getStatusColor = (status: ContributionPeriod['status']) => {
    switch (status) {
      case 'completed':
        return '#22c55e';
      case 'active':
        return '#0ea5e9';
      case 'upcoming':
        return '#64748b';
      case 'overdue':
        return '#ef4444';
      default:
        return '#64748b';
    }
  };

  const getStatusIcon = (status: ContributionPeriod['status']) => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'active':
        return '🔵';
      case 'upcoming':
        return '⏳';
      case 'overdue':
        return '❌';
      default:
        return '📋';
    }
  };

  if (isLoading && !plan) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  if (!plan) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Plan not found</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.planName}>{plan.name}</Text>
        {plan.description && <Text style={styles.planDescription}>{plan.description}</Text>}
      </View>

      <View style={styles.detailsCard}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Type</Text>
          <Text style={styles.detailValue}>{plan.type}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Amount</Text>
          <Text style={styles.detailValue}>
            {plan.type === 'fixed' ? `₦${plan.amount}` : `₦${plan.minAmount} - ₦${plan.maxAmount}`}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Frequency</Text>
          <Text style={styles.detailValue}>{plan.frequency}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Duration</Text>
          <Text style={styles.detailValue}>{plan.duration}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Start Date</Text>
          <Text style={styles.detailValue}>{new Date(plan.startDate).toLocaleDateString()}</Text>
        </View>
        {plan.endDate && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>End Date</Text>
            <Text style={styles.detailValue}>{new Date(plan.endDate).toLocaleDateString()}</Text>
          </View>
        )}
      </View>

      <View style={styles.periodsSection}>
        <Text style={styles.sectionTitle}>Contribution Periods</Text>
        {periods.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyText}>No periods generated yet</Text>
          </View>
        ) : (
          periods.map((period) => (
            <TouchableOpacity
              key={period.id}
              style={styles.periodCard}
              onPress={() => navigation.navigate('ContributionPeriod', { periodId: period.id })}
            >
              <View style={styles.periodHeader}>
                <Text style={styles.periodIcon}>{getStatusIcon(period.status)}</Text>
                <View style={styles.periodInfo}>
                  <Text style={styles.periodNumber}>Period {period.periodNumber}</Text>
                  <Text style={styles.periodDates}>
                    {new Date(period.startDate).toLocaleDateString()} -{' '}
                    {new Date(period.endDate).toLocaleDateString()}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(period.status) + '20' },
                  ]}
                >
                  <Text style={[styles.statusText, { color: getStatusColor(period.status) }]}>
                    {period.status}
                  </Text>
                </View>
              </View>

              <View style={styles.periodProgress}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(
                          (period.collectedAmount / period.expectedAmount) * 100,
                          100
                        )}%`,
                        backgroundColor: getStatusColor(period.status),
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  ₦{period.collectedAmount.toLocaleString()} / ₦
                  {period.expectedAmount.toLocaleString()}
                </Text>
              </View>

              <View style={styles.periodFooter}>
                <Text style={styles.dueDate}>
                  Due: {new Date(period.dueDate).toLocaleDateString()}
                </Text>
                {period.status === 'active' && (
                  <TouchableOpacity
                    style={styles.recordButton}
                    onPress={() => navigation.navigate('RecordPayment', { periodId: period.id })}
                  >
                    <Text style={styles.recordButtonText}>Record Payment</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
  },
  errorText: {
    fontSize: 16,
    color: '#64748b',
  },
  header: {
    backgroundColor: '#0ea5e9',
    padding: 24,
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  planDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  detailsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    textTransform: 'capitalize',
  },
  periodsSection: {
    padding: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 16,
  },
  periodCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  periodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  periodIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  periodInfo: {
    flex: 1,
  },
  periodNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  periodDates: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  periodProgress: {
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'right',
  },
  periodFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dueDate: {
    fontSize: 12,
    color: '#64748b',
  },
  recordButton: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  recordButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
  },
});

export default ContributionPlanScreen;
