import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import Icon from '../../components/common/Icon';
import { fetchLedger, fetchAllMemberBalances } from '../../store/slices/ledgerSlice';
import { LedgerEntry } from '../../models';

type Props = NativeStackScreenProps<HomeStackParamList, 'Ledger'>;

const LedgerScreen: React.FC<Props> = ({ route }) => {
  const { cooperativeId, memberId } = route.params;
  const dispatch = useAppDispatch();
  const [refreshing, setRefreshing] = React.useState(false);

  const { entries, memberBalances, isLoading } = useAppSelector((state) => state.ledger);
  const { currentCooperative } = useAppSelector((state) => state.cooperative);

  const loadData = useCallback(async () => {
    await Promise.all([
      dispatch(fetchLedger({ cooperativeId, memberId })),
      dispatch(fetchAllMemberBalances(cooperativeId)),
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

  const getEntryTypeLabel = (type: LedgerEntry['type']) => {
    switch (type) {
      case 'contribution_in':
        return 'Contribution';
      case 'loan_disbursement':
        return 'Loan Disbursement';
      case 'loan_repayment':
        return 'Loan Repayment';
      case 'groupbuy_outlay':
        return 'Group Buy';
      case 'groupbuy_repayment':
        return 'Group Buy Repayment';
      case 'manual_credit':
        return 'Credit Adjustment';
      case 'manual_debit':
        return 'Debit Adjustment';
      default:
        return type;
    }
  };

  const totalBalance = memberBalances.reduce((sum, b) => sum + b.currentBalance, 0);

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>
          {memberId ? 'Member Balance' : 'Total Cooperative Balance'}
        </Text>
        <Text style={styles.summaryValue}>₦{totalBalance.toLocaleString()}</Text>
        {!memberId && (
          <Text style={styles.summarySubtext}>Across {memberBalances.length} members</Text>
        )}
      </View>

      {!memberId && (
        <View style={styles.breakdownRow}>
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownValue}>
              ₦{memberBalances.reduce((sum, b) => sum + b.totalContributions, 0).toLocaleString()}
            </Text>
            <Text style={styles.breakdownLabel}>Contributions</Text>
          </View>
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownValue}>
              ₦
              {memberBalances
                .reduce((sum, b) => sum + b.totalLoanDisbursements, 0)
                .toLocaleString()}
            </Text>
            <Text style={styles.breakdownLabel}>Loans Out</Text>
          </View>
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownValue}>
              ₦{memberBalances.reduce((sum, b) => sum + b.totalGroupBuyOutlays, 0).toLocaleString()}
            </Text>
            <Text style={styles.breakdownLabel}>Group Buys</Text>
          </View>
        </View>
      )}

      <Text style={styles.sectionTitle}>
        {memberId ? 'Transaction History' : 'All Transactions'} ({entries.length})
      </Text>
    </View>
  );

  const renderEntry = ({ item }: { item: LedgerEntry }) => (
    <View style={styles.entryCard}>
      <View style={styles.entryIcon}>
          <Icon name={getEntryIcon(item.type)} size={20} style={{}} />
        </View>
      <View style={styles.entryContent}>
        <Text style={styles.entryType}>{getEntryTypeLabel(item.type)}</Text>
        <Text style={styles.entryDescription} numberOfLines={1}>
          {item.description}
        </Text>
        <Text style={styles.entryDate}>{new Date(item.createdAt).toLocaleString()}</Text>
      </View>
      <View style={styles.entryAmount}>
        <Text
          style={[
            styles.entryAmountValue,
            item.amount > 0 ? styles.creditAmount : styles.debitAmount,
          ]}
        >
          {item.amount > 0 ? '+' : ''}₦{Math.abs(item.amount).toLocaleString()}
        </Text>
        <Text style={styles.entryBalance}>Bal: ₦{item.balanceAfter.toLocaleString()}</Text>
      </View>
    </View>
  );

  if (isLoading && entries.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={entries}
      keyExtractor={(item) => item.id}
      renderItem={renderEntry}
      ListHeaderComponent={renderHeader}
      contentContainerStyle={styles.listContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Icon name="BarChart" size={64} style={styles.emptyIcon} />
          <Text style={styles.emptyTitle}>No Transactions</Text>
          <Text style={styles.emptyText}>
            Ledger entries will appear here as transactions occur.
          </Text>
        </View>
      }
    />
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
  listContent: {
    paddingBottom: 24,
  },
  header: {
    padding: 16,
  },
  summaryCard: {
    backgroundColor: '#0ea5e9',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  summarySubtext: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  breakdownItem: {
    flex: 1,
    alignItems: 'center',
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  breakdownLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginTop: 8,
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  entryIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  entryIconText: {
    fontSize: 20,
  },
  entryContent: {
    flex: 1,
  },
  entryType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  entryDescription: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  entryDate: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 4,
  },
  entryAmount: {
    alignItems: 'flex-end',
  },
  entryAmountValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  creditAmount: {
    color: '#22c55e',
  },
  debitAmount: {
    color: '#ef4444',
  },
  entryBalance: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    padding: 48,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
});

export default LedgerScreen;
