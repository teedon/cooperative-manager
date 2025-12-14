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
import { fetchVirtualBalance, fetchLedger } from '../../store/slices/ledgerSlice';
import { VirtualBalance, LedgerEntry } from '../../models';
import Icon from '../../components/common/Icon';

type Props = NativeStackScreenProps<HomeStackParamList, 'MemberDashboard'>;

const MemberDashboardScreen: React.FC<Props> = ({ route }) => {
  const { cooperativeId, memberId } = route.params;
  const dispatch = useAppDispatch();
  const [refreshing, setRefreshing] = React.useState(false);

  const { virtualBalance, entries, isLoading } = useAppSelector((state) => state.ledger);
  const { members } = useAppSelector((state) => state.cooperative);

  const member = members.find((m) => m.id === memberId);

  const loadData = useCallback(async () => {
    await Promise.all([
      dispatch(fetchVirtualBalance({ cooperativeId, memberId })),
      dispatch(fetchLedger({ cooperativeId, memberId })),
    ]);
  }, [dispatch, cooperativeId, memberId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const getEntryIcon = (type: LedgerEntry['type']) => {
    switch (type) {
      case 'contribution_in':
        return 'DollarSign';
      case 'loan_disbursement':
        return 'CreditCard';
      case 'loan_repayment':
        return 'DollarSign';
      case 'groupbuy_outlay':
        return 'ShoppingCart';
      case 'groupbuy_repayment':
        return 'RefreshCw';
      case 'manual_credit':
        return 'Plus';
      case 'manual_debit':
        return 'Minus';
      default:
        return 'List';
    }
  };

  if (isLoading && !virtualBalance) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.memberName}>
          {
            (member as unknown as { user?: { firstName: string; lastName: string } })?.user
              ?.firstName
          }{' '}
          {
            (member as unknown as { user?: { firstName: string; lastName: string } })?.user
              ?.lastName
          }
        </Text>
        <Text style={styles.memberRole}>{member?.role}</Text>
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Virtual Balance</Text>
        <Text style={styles.balanceValue}>
          {formatCurrency(virtualBalance?.currentBalance || member?.virtualBalance || 0)}
        </Text>
        <Text style={styles.balanceDate}>
          Last updated: {new Date(virtualBalance?.lastUpdated || Date.now()).toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.breakdownSection}>
        <Text style={styles.sectionTitle}>Balance Breakdown</Text>
        <View style={styles.breakdownGrid}>
          <View style={[styles.breakdownItem, styles.creditItem]}>
            <Text style={styles.breakdownLabel}>Contributions</Text>
            <Text style={[styles.breakdownValue, styles.creditValue]}>
              +{formatCurrency(virtualBalance?.totalContributions || 0)}
            </Text>
          </View>
          <View style={[styles.breakdownItem, styles.creditItem]}>
            <Text style={styles.breakdownLabel}>Loan Repayments</Text>
            <Text style={[styles.breakdownValue, styles.creditValue]}>
              +{formatCurrency(virtualBalance?.totalLoanRepayments || 0)}
            </Text>
          </View>
          <View style={[styles.breakdownItem, styles.debitItem]}>
            <Text style={styles.breakdownLabel}>Loan Disbursements</Text>
            <Text style={[styles.breakdownValue, styles.debitValue]}>
              -{formatCurrency(virtualBalance?.totalLoanDisbursements || 0)}
            </Text>
          </View>
          <View style={[styles.breakdownItem, styles.debitItem]}>
            <Text style={styles.breakdownLabel}>Group Buy Outlays</Text>
            <Text style={[styles.breakdownValue, styles.debitValue]}>
              -{formatCurrency(virtualBalance?.totalGroupBuyOutlays || 0)}
            </Text>
          </View>
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownLabel}>Adjustments</Text>
            <Text style={styles.breakdownValue}>
              {formatCurrency(virtualBalance?.manualAdjustments || 0)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.historySection}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {entries.slice(0, 10).map((entry) => (
          <View key={entry.id} style={styles.transactionItem}>
            <Icon name={getEntryIcon(entry.type)} size={20} style={styles.transactionIcon} />
            <View style={styles.transactionContent}>
              <Text style={styles.transactionDesc}>{entry.description}</Text>
              <Text style={styles.transactionDate}>
                {new Date(entry.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <Text
              style={[
                styles.transactionAmount,
                entry.amount > 0 ? styles.creditValue : styles.debitValue,
              ]}
            >
              {entry.amount > 0 ? '+' : ''}
              {formatCurrency(entry.amount)}
            </Text>
          </View>
        ))}
        {entries.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No transactions yet</Text>
          </View>
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
  header: {
    backgroundColor: '#0ea5e9',
    padding: 24,
    paddingTop: 16,
    alignItems: 'center',
  },
  memberName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  memberRole: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'capitalize',
    marginTop: 4,
  },
  balanceCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  balanceValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  balanceDate: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 8,
  },
  breakdownSection: {
    padding: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 16,
  },
  breakdownGrid: {
    gap: 8,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#e2e8f0',
  },
  creditItem: {
    borderLeftColor: '#22c55e',
  },
  debitItem: {
    borderLeftColor: '#ef4444',
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  creditValue: {
    color: '#22c55e',
  },
  debitValue: {
    color: '#ef4444',
  },
  historySection: {
    padding: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  transactionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  transactionContent: {
    flex: 1,
  },
  transactionDesc: {
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#94a3b8',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
  },
});

export default MemberDashboardScreen;
