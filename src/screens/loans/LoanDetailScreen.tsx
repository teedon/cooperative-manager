import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchLoan, fetchRepayments } from '../../store/slices/loanSlice';

type Props = NativeStackScreenProps<HomeStackParamList, 'LoanDetail'>;

const LoanDetailScreen: React.FC<Props> = ({ route }) => {
  const { loanId } = route.params;
  const dispatch = useAppDispatch();
  const [refreshing, setRefreshing] = React.useState(false);

  const { currentLoan, repayments, isLoading } = useAppSelector((state) => state.loan);

  const loadData = useCallback(async () => {
    await Promise.all([dispatch(fetchLoan(loanId)), dispatch(fetchRepayments(loanId))]);
  }, [dispatch, loanId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#f59e0b';
      case 'approved':
        return '#22c55e';
      case 'rejected':
        return '#ef4444';
      case 'disbursed':
      case 'repaying':
        return '#0ea5e9';
      case 'completed':
        return '#6366f1';
      default:
        return '#64748b';
    }
  };

  if (isLoading && !currentLoan) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  if (!currentLoan) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Loan not found</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <View style={styles.amountSection}>
          <Text style={styles.amountLabel}>Loan Amount</Text>
          <Text style={styles.amountValue}>${currentLoan.amount.toLocaleString()}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(currentLoan.status) }]}>
          <Text style={styles.statusText}>{currentLoan.status}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Loan Details</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Purpose</Text>
          <Text style={styles.detailValue}>{currentLoan.purpose}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Duration</Text>
          <Text style={styles.detailValue}>{currentLoan.duration} months</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Interest Rate</Text>
          <Text style={styles.detailValue}>{currentLoan.interestRate}%</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Monthly Repayment</Text>
          <Text style={styles.detailValue}>₦{currentLoan.monthlyRepayment.toLocaleString()}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Total Repayment</Text>
          <Text style={[styles.detailValue, styles.totalValue]}>
            ₦{currentLoan.totalRepayment.toLocaleString()}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Timeline</Text>
        <View style={styles.timelineItem}>
          <View style={styles.timelineDot} />
          <View style={styles.timelineContent}>
            <Text style={styles.timelineTitle}>Requested</Text>
            <Text style={styles.timelineDate}>
              {new Date(currentLoan.requestedAt).toLocaleString()}
            </Text>
          </View>
        </View>
        {currentLoan.reviewedAt && (
          <View style={styles.timelineItem}>
            <View
              style={[styles.timelineDot, { backgroundColor: getStatusColor(currentLoan.status) }]}
            />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>
                {currentLoan.status === 'approved' || currentLoan.status === 'disbursed'
                  ? 'Approved'
                  : 'Reviewed'}
              </Text>
              <Text style={styles.timelineDate}>
                {new Date(currentLoan.reviewedAt).toLocaleString()}
              </Text>
            </View>
          </View>
        )}
        {currentLoan.disbursedAt && (
          <View style={styles.timelineItem}>
            <View style={[styles.timelineDot, { backgroundColor: '#0ea5e9' }]} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>Disbursed</Text>
              <Text style={styles.timelineDate}>
                {new Date(currentLoan.disbursedAt).toLocaleString()}
              </Text>
            </View>
          </View>
        )}
        {currentLoan.rejectionReason && (
          <View style={styles.rejectionCard}>
            <Text style={styles.rejectionTitle}>Rejection Reason</Text>
            <Text style={styles.rejectionText}>{currentLoan.rejectionReason}</Text>
          </View>
        )}
      </View>

      {repayments.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Repayment Schedule</Text>
          {repayments.map((repayment, index) => (
            <View key={repayment.id} style={styles.repaymentItem}>
              <View style={styles.repaymentHeader}>
                <Text style={styles.repaymentNumber}>Payment {index + 1}</Text>
                <View
                  style={[
                    styles.repaymentStatus,
                    {
                      backgroundColor:
                        repayment.status === 'paid'
                          ? '#dcfce7'
                          : repayment.status === 'overdue'
                            ? '#fee2e2'
                            : '#f1f5f9',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.repaymentStatusText,
                      {
                        color:
                          repayment.status === 'paid'
                            ? '#16a34a'
                            : repayment.status === 'overdue'
                              ? '#dc2626'
                              : '#64748b',
                      },
                    ]}
                  >
                    {repayment.status}
                  </Text>
                </View>
              </View>
              <View style={styles.repaymentDetails}>
                <Text style={styles.repaymentDate}>
                  Due: {new Date(repayment.dueDate).toLocaleDateString()}
                </Text>
                <Text style={styles.repaymentAmount}>
                  ₦{repayment.totalAmount.toLocaleString()}
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
    backgroundColor: '#8b5cf6',
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountSection: {},
  amountLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  amountValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    maxWidth: '60%',
    textAlign: 'right',
  },
  totalValue: {
    color: '#8b5cf6',
    fontSize: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#94a3b8',
    marginRight: 12,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  timelineDate: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  rejectionCard: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  rejectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#dc2626',
    marginBottom: 4,
  },
  rejectionText: {
    fontSize: 14,
    color: '#991b1b',
  },
  repaymentItem: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  repaymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  repaymentNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  repaymentStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  repaymentStatusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  repaymentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  repaymentDate: {
    fontSize: 12,
    color: '#64748b',
  },
  repaymentAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
});

export default LoanDetailScreen;
