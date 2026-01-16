import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import { collectionsApi } from '../../api/collectionsApi';
import Icon from '../../components/common/Icon';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import { getErrorMessage } from '../../utils/errorHandler';

type Props = NativeStackScreenProps<HomeStackParamList, 'CollectionsStatistics'>;

const CollectionsStatisticsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { organizationId } = route.params;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [organizationStats, setOrganizationStats] = useState<any>(null);
  const [transactionTypes, setTransactionTypes] = useState<any[]>([]);
  const [rejections, setRejections] = useState<any>(null);
  const [approvalLatency, setApprovalLatency] = useState<any>(null);
  const [dailyTrends, setDailyTrends] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const dashboard = await collectionsApi.getDashboard(organizationId);
      setOrganizationStats(dashboard.organizationStats);
      setTransactionTypes(dashboard.transactionTypes);
      setRejections(dashboard.rejections);
      setApprovalLatency(dashboard.approvalLatency);
      setDailyTrends(dashboard.dailyTrends.slice(0, 7)); // Last 7 days
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const formatCurrency = (amount: number) => {
    return `₦${(amount / 100).toLocaleString()}`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary.main} />
        <Text style={styles.loadingText}>Loading statistics...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="alert-circle" size={48} color={colors.error.main} />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Header Stats Cards */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, styles.primaryCard]}>
          <Icon name="trending-up" size={24} color={colors.primary.contrast} />
          <Text style={styles.statValue}>
            {organizationStats?.totalCollections || 0}
          </Text>
          <Text style={styles.statLabel}>Total Collections</Text>
        </View>

        <View style={[styles.statCard, styles.successCard]}>
          <Icon name="checkmark-circle" size={24} color="#fff" />
          <Text style={styles.statValue}>
            {organizationStats?.approvedCount || 0}
          </Text>
          <Text style={styles.statLabel}>Approved</Text>
        </View>

        <View style={[styles.statCard, styles.warningCard]}>
          <Icon name="time" size={24} color="#fff" />
          <Text style={styles.statValue}>
            {organizationStats?.submittedCount || 0}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>

        <View style={[styles.statCard, styles.errorCard]}>
          <Icon name="close-circle" size={24} color="#fff" />
          <Text style={styles.statValue}>
            {organizationStats?.rejectedCount || 0}
          </Text>
          <Text style={styles.statLabel}>Rejected</Text>
        </View>
      </View>

      {/* Total Amount Collected */}
      <View style={styles.amountCard}>
        <Text style={styles.amountLabel}>Total Amount Collected</Text>
        <Text style={styles.amountValue}>
          {formatCurrency(organizationStats?.totalAmount || 0)}
        </Text>
        <Text style={styles.amountSubtext}>
          Average: {formatCurrency(organizationStats?.averageAmount || 0)} per collection
        </Text>
      </View>

      {/* Transaction Types Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Transaction Types</Text>
        {transactionTypes.map((item, index) => (
          <View key={index} style={styles.transactionTypeRow}>
            <View style={styles.transactionTypeInfo}>
              <Text style={styles.transactionTypeName}>
                {item.type.replace(/_/g, ' ').toUpperCase()}
              </Text>
              <Text style={styles.transactionTypeCount}>
                {item.count} transactions
              </Text>
            </View>
            <Text style={styles.transactionTypeAmount}>
              {formatCurrency(item.totalAmount)}
            </Text>
          </View>
        ))}
      </View>

      {/* Approval Latency */}
      {approvalLatency && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Approval Time</Text>
          <View style={styles.latencyGrid}>
            <View style={styles.latencyItem}>
              <Text style={styles.latencyValue}>
                {approvalLatency.averageHours.toFixed(1)}h
              </Text>
              <Text style={styles.latencyLabel}>Average</Text>
            </View>
            <View style={styles.latencyItem}>
              <Text style={styles.latencyValue}>
                {approvalLatency.medianHours.toFixed(1)}h
              </Text>
              <Text style={styles.latencyLabel}>Median</Text>
            </View>
            <View style={styles.latencyItem}>
              <Text style={styles.latencyValue}>
                {approvalLatency.minHours.toFixed(1)}h
              </Text>
              <Text style={styles.latencyLabel}>Fastest</Text>
            </View>
            <View style={styles.latencyItem}>
              <Text style={styles.latencyValue}>
                {approvalLatency.maxHours.toFixed(1)}h
              </Text>
              <Text style={styles.latencyLabel}>Slowest</Text>
            </View>
          </View>
        </View>
      )}

      {/* Rejection Reasons */}
      {rejections && rejections.topReasons.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Rejection Reasons</Text>
          <Text style={styles.rejectionsTotal}>
            Total Rejections: {rejections.totalRejections}
          </Text>
          {rejections.topReasons.slice(0, 5).map((reason: any, index: number) => (
            <View key={index} style={styles.rejectionRow}>
              <View style={styles.rejectionNumberContainer}>
                <Text style={styles.rejectionNumber}>{index + 1}</Text>
              </View>
              <View style={styles.rejectionInfo}>
                <Text style={styles.rejectionReason}>{reason.reason}</Text>
                <View style={styles.rejectionBar}>
                  <View
                    style={[
                      styles.rejectionBarFill,
                      {
                        width: `${(reason.count / rejections.totalRejections) * 100}%`,
                      },
                    ]}
                  />
                </View>
              </View>
              <Text style={styles.rejectionCount}>{reason.count}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Daily Trends */}
      {dailyTrends.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Last 7 Days</Text>
          {dailyTrends.map((day, index) => (
            <View key={index} style={styles.trendRow}>
              <Text style={styles.trendDate}>
                {new Date(day.date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
              <View style={styles.trendStats}>
                <Text style={styles.trendCollections}>
                  {day.collections} collections
                </Text>
                <Text style={styles.trendAmount}>
                  {formatCurrency(day.amount)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: colors.text.secondary,
  },
  errorText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: colors.error.main,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.md,
    gap: spacing.md,
  },
  statCard: {
    width: (Dimensions.get('window').width - spacing.md * 3) / 2,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  primaryCard: {
    backgroundColor: colors.primary.main,
  },
  successCard: {
    backgroundColor: colors.success.main,
  },
  warningCard: {
    backgroundColor: colors.warning.main,
  },
  errorCard: {
    backgroundColor: colors.error.main,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: spacing.sm,
  },
  statLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginTop: spacing.xs,
  },
  amountCard: {
    margin: spacing.md,
    marginTop: 0,
    padding: spacing.lg,
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    alignItems: 'center',
    ...shadows.md,
  },
  amountLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  amountValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.primary.main,
    marginTop: spacing.sm,
  },
  amountSubtext: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  section: {
    margin: spacing.md,
    marginTop: 0,
    padding: spacing.md,
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  transactionTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  transactionTypeInfo: {
    flex: 1,
  },
  transactionTypeName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
  },
  transactionTypeCount: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  transactionTypeAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary.main,
  },
  latencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  latencyItem: {
    flex: 1,
    minWidth: '45%',
    padding: spacing.md,
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  latencyValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary.main,
  },
  latencyLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  rejectionsTotal: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  rejectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  rejectionNumberContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.error.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  rejectionNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.error.main,
  },
  rejectionInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  rejectionReason: {
    fontSize: 14,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  rejectionBar: {
    height: 4,
    backgroundColor: colors.background.paper,
    borderRadius: 2,
  },
  rejectionBarFill: {
    height: '100%',
    backgroundColor: colors.error.main,
    borderRadius: 2,
  },
  rejectionCount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error.main,
  },
  trendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  trendDate: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
    width: 100,
  },
  trendStats: {
    flex: 1,
    alignItems: 'flex-end',
  },
  trendCollections: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  trendAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary.main,
    marginTop: 2,
  },
});

export default CollectionsStatisticsScreen;
