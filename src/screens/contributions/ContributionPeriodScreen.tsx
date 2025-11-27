import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import { useAppSelector } from '../../store/hooks';

type Props = NativeStackScreenProps<HomeStackParamList, 'ContributionPeriod'>;

const ContributionPeriodScreen: React.FC<Props> = ({ route, navigation }) => {
  const { periodId } = route.params;
  const { periods } = useAppSelector((state) => state.contribution);
  const period = periods.find((p) => p.id === periodId);

  if (!period) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Period not found</Text>
      </View>
    );
  }

  const progressPercent = Math.min((period.collectedAmount / period.expectedAmount) * 100, 100);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.periodTitle}>Period {period.periodNumber}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{period.status}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Collection Progress</Text>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
          <Text style={styles.progressText}>{progressPercent.toFixed(0)}%</Text>
        </View>
        <View style={styles.amountRow}>
          <View>
            <Text style={styles.amountLabel}>Collected</Text>
            <Text style={styles.amountValue}>${period.collectedAmount.toLocaleString()}</Text>
          </View>
          <View style={styles.amountDivider} />
          <View>
            <Text style={styles.amountLabel}>Expected</Text>
            <Text style={styles.amountValue}>${period.expectedAmount.toLocaleString()}</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Period Details</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Start Date</Text>
          <Text style={styles.detailValue}>{new Date(period.startDate).toLocaleDateString()}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>End Date</Text>
          <Text style={styles.detailValue}>{new Date(period.endDate).toLocaleDateString()}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Due Date</Text>
          <Text style={[styles.detailValue, styles.dueDate]}>
            {new Date(period.dueDate).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {period.status === 'active' && (
        <TouchableOpacity
          style={styles.recordButton}
          onPress={() => navigation.navigate('RecordPayment', { periodId })}
        >
          <Text style={styles.recordButtonText}>Record Your Payment</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  periodTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statusBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
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
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  progressBar: {
    flex: 1,
    height: 12,
    backgroundColor: '#e2e8f0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0ea5e9',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0ea5e9',
    width: 45,
    textAlign: 'right',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  amountValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0f172a',
    textAlign: 'center',
    marginTop: 4,
  },
  amountDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e2e8f0',
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
  },
  dueDate: {
    color: '#f59e0b',
  },
  recordButton: {
    backgroundColor: '#0ea5e9',
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  recordButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ContributionPeriodScreen;
