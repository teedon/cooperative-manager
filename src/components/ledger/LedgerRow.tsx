import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LedgerEntry, LedgerEntryType } from '../../models';

export interface LedgerRowProps {
  entry: LedgerEntry;
  testID?: string;
}

const LedgerRow: React.FC<LedgerRowProps> = ({ entry, testID }) => {
  const getTypeLabel = (type: LedgerEntryType): string => {
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

  const getTypeIcon = (type: LedgerEntryType): string => {
    switch (type) {
      case 'contribution_in':
        return '💰';
      case 'loan_disbursement':
        return '📤';
      case 'loan_repayment':
        return '📥';
      case 'groupbuy_outlay':
        return '🛒';
      case 'groupbuy_repayment':
        return '💵';
      case 'manual_credit':
        return '➕';
      case 'manual_debit':
        return '➖';
      default:
        return '📝';
    }
  };

  const isPositive = entry.amount > 0;

  return (
    <View style={styles.row} testID={testID}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{getTypeIcon(entry.type)}</Text>
      </View>
      <View style={styles.details}>
        <Text style={styles.type}>{getTypeLabel(entry.type)}</Text>
        <Text style={styles.description} numberOfLines={1}>
          {entry.description}
        </Text>
        <Text style={styles.date}>{new Date(entry.createdAt).toLocaleDateString()}</Text>
      </View>
      <View style={styles.amounts}>
        <Text style={[styles.amount, isPositive ? styles.positive : styles.negative]}>
          {isPositive ? '+' : ''}${Math.abs(entry.amount).toFixed(2)}
        </Text>
        <Text style={styles.balance}>Balance: ${entry.balanceAfter.toFixed(2)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 18,
  },
  details: {
    flex: 1,
  },
  type: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 2,
  },
  description: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 2,
  },
  date: {
    fontSize: 12,
    color: '#94a3b8',
  },
  amounts: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  positive: {
    color: '#22c55e',
  },
  negative: {
    color: '#ef4444',
  },
  balance: {
    fontSize: 12,
    color: '#94a3b8',
  },
});

export default LedgerRow;
