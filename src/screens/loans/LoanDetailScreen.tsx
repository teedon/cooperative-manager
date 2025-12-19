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
import { fetchLoan, fetchRepaymentSchedule } from '../../store/slices/loanSlice';
import { formatCurrency, formatDate } from '../../utils';

type Props = NativeStackScreenProps<HomeStackParamList, 'LoanDetail'>;

const LoanDetailScreen: React.FC<Props> = ({ route }) => {
  const { loanId } = route.params;
  const dispatch = useAppDispatch();
  const [refreshing, setRefreshing] = React.useState(false);

  const { currentLoan, repaymentSchedule, isLoading } = useAppSelector((state) => state.loan);

  const loadData = useCallback(async () => {
    await Promise.all([dispatch(fetchLoan(loanId)), dispatch(fetchRepaymentSchedule(loanId))]);
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
          <Text style={styles.amountValue}>{formatCurrency(currentLoan.amount)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(currentLoan.status) }]}>
          <Text style={styles.statusText}>{currentLoan.status}</Text>
        </View>
      </View>

      {currentLoan.loanType && (
        <View style={styles.loanTypeTag}>
          <Text style={styles.loanTypeText}>{currentLoan.loanType.name}</Text>
        </View>
      )}

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
          <Text style={styles.detailValue}>
            {currentLoan.interestRate}%
            {currentLoan.loanType?.interestType === 'reducing_balance' ? ' (Reducing)' : ' (Flat)'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Monthly Repayment</Text>
          <Text style={styles.detailValue}>{formatCurrency(currentLoan.monthlyRepayment)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Total Repayment</Text>
          <Text style={[styles.detailValue, styles.totalValue]}>
            {formatCurrency(currentLoan.totalRepayment)}
          </Text>
        </View>
        {currentLoan.deductionStartDate && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Deductions Start</Text>
            <Text style={styles.detailValue}>{formatDate(currentLoan.deductionStartDate)}</Text>
          </View>
        )}
        {currentLoan.deductionStartDate && currentLoan.duration && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Expected End Date</Text>
            <Text style={styles.detailValue}>
              {formatDate(
                new Date(
                  new Date(currentLoan.deductionStartDate).setMonth(
                    new Date(currentLoan.deductionStartDate).getMonth() + currentLoan.duration
                  )
                ).toISOString()
              )}
            </Text>
          </View>
        )}
        {currentLoan.outstandingBalance > 0 && (
          <View style={[styles.detailRow, styles.balanceRow]}>
            <Text style={styles.balanceLabel}>Outstanding Balance</Text>
            <Text style={styles.balanceValue}>{formatCurrency(currentLoan.outstandingBalance)}</Text>
          </View>
        )}
        {currentLoan.initiatedBy === 'admin' && (
          <View style={styles.adminInitiatedTag}>
            <Text style={styles.adminInitiatedText}>Admin Initiated Loan</Text>
          </View>
        )}
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

      {repaymentSchedule.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Repayment Schedule</Text>
          {repaymentSchedule.map((repayment) => (
            <View key={repayment.id} style={styles.repaymentItem}>
              <View style={styles.repaymentHeader}>
                <Text style={styles.repaymentNumber}>
                  Payment {repayment.installmentNumber}
                </Text>
                <View
                  style={[
                    styles.repaymentStatus,
                    {
                      backgroundColor:
                        repayment.status === 'paid'
                          ? '#dcfce7'
                          : repayment.status === 'overdue'
                            ? '#fee2e2'
                            : repayment.status === 'partial'
                              ? '#fef3c7'
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
                              : repayment.status === 'partial'
                                ? '#d97706'
                                : '#64748b',
                      },
                    ]}
                  >
                    {repayment.status}
                  </Text>
                </View>
              </View>
              <View style={styles.repaymentDetails}>
                <View>
                  <Text style={styles.repaymentDate}>
                    Due: {formatDate(repayment.dueDate)}
                  </Text>
                  {repayment.paidAt && (
                    <Text style={styles.repaymentPaidDate}>
                      Paid: {formatDate(repayment.paidAt)}
                    </Text>
                  )}
                </View>
                <View style={styles.repaymentAmounts}>
                  <Text style={styles.repaymentAmount}>
                    {formatCurrency(repayment.totalAmount)}
                  </Text>
                  {repayment.paidAmount > 0 && repayment.paidAmount < repayment.totalAmount && (
                    <Text style={styles.repaymentPaid}>
                      Paid: {formatCurrency(repayment.paidAmount)}
                    </Text>
                  )}
                </View>
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
  loanTypeTag: {
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  loanTypeText: {
    color: '#0ea5e9',
    fontSize: 14,
    fontWeight: '600',
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
    alignItems: 'flex-start',
  },
  repaymentDate: {
    fontSize: 12,
    color: '#64748b',
  },
  repaymentPaidDate: {
    fontSize: 11,
    color: '#22c55e',
    marginTop: 2,
  },
  repaymentAmounts: {
    alignItems: 'flex-end',
  },
  repaymentAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  repaymentPaid: {
    fontSize: 11,
    color: '#22c55e',
    marginTop: 2,
  },
  balanceRow: {
    backgroundColor: '#fef3c7',
    marginHorizontal: -20,
    paddingHorizontal: 20,
    marginTop: 12,
    paddingTop: 12,
    paddingBottom: 12,
    marginBottom: -20,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#d97706',
  },
  adminInitiatedTag: {
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  adminInitiatedText: {
    fontSize: 12,
    color: '#0ea5e9',
    fontWeight: '500',
  },
});

export default LoanDetailScreen;
