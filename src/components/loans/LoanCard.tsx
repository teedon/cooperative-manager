import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LoanRequest } from '../../models';
import Badge from '../common/Badge';

export interface LoanCardProps {
  loan: LoanRequest;
  onPress?: () => void;
  showMember?: boolean;
  testID?: string;
}

const LoanCard: React.FC<LoanCardProps> = ({ loan, onPress, showMember, testID }) => {
  const getStatusVariant = () => {
    switch (loan.status) {
      case 'approved':
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
      case 'defaulted':
        return 'error';
      case 'disbursed':
      case 'repaying':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
      testID={testID}
    >
      <View style={styles.header}>
        <View style={styles.amountSection}>
          <Text style={styles.amount}>${loan.amount.toLocaleString()}</Text>
          <Badge text={loan.status} variant={getStatusVariant()} />
        </View>
      </View>

      {showMember && loan.member?.user && (
        <Text style={styles.memberName}>
          {loan.member.user.firstName} {loan.member.user.lastName}
        </Text>
      )}

      <Text style={styles.purpose} numberOfLines={2}>
        {loan.purpose}
      </Text>

      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Duration</Text>
          <Text style={styles.detailValue}>{loan.duration} months</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Interest</Text>
          <Text style={styles.detailValue}>{loan.interestRate}%</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Monthly</Text>
          <Text style={styles.detailValue}>${loan.monthlyRepayment.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerLabel}>Total Repayment</Text>
        <Text style={styles.footerValue}>${loan.totalRepayment.toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    marginBottom: 8,
  },
  amountSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amount: {
    fontSize: 24,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  memberName: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  purpose: {
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 16,
    lineHeight: 20,
  },
  details: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  footerLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  footerValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
});

export default LoanCard;
