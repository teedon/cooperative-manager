import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ContributionPeriod } from '../../models';
import Badge from '../common/Badge';

export interface PeriodCardProps {
  period: ContributionPeriod;
  onPress?: () => void;
  expectedAmount?: number;
  testID?: string;
}

const PeriodCard: React.FC<PeriodCardProps> = ({ period, onPress, expectedAmount, testID }) => {
  const getStatusVariant = () => {
    switch (period.status) {
      case 'completed':
        return 'success';
      case 'active':
        return 'info';
      case 'overdue':
        return 'error';
      default:
        return 'default';
    }
  };

  const progress = expectedAmount
    ? Math.min((period.collectedAmount / expectedAmount) * 100, 100)
    : 0;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
      testID={testID}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Period {period.periodNumber}</Text>
        <Badge text={period.status} variant={getStatusVariant()} />
      </View>

      <View style={styles.dateRange}>
        <Text style={styles.dateText}>
          {new Date(period.startDate).toLocaleDateString()} -{' '}
          {new Date(period.endDate).toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <View style={styles.progressLabels}>
          <Text style={styles.collectedAmount}>${period.collectedAmount.toLocaleString()}</Text>
          {expectedAmount && (
            <Text style={styles.expectedAmount}>of ${expectedAmount.toLocaleString()}</Text>
          )}
        </View>
      </View>

      <View style={styles.dueDate}>
        <Text style={styles.dueDateLabel}>Due Date</Text>
        <Text style={styles.dueDateValue}>{new Date(period.dueDate).toLocaleDateString()}</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  dateRange: {
    marginBottom: 16,
  },
  dateText: {
    fontSize: 14,
    color: '#64748b',
  },
  progressSection: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  collectedAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  expectedAmount: {
    fontSize: 14,
    color: '#64748b',
  },
  dueDate: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  dueDateLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  dueDateValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0f172a',
  },
});

export default PeriodCard;
