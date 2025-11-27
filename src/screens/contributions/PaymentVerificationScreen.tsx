import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchPendingVerifications, verifyPayment } from '../../store/slices/contributionSlice';

type Props = NativeStackScreenProps<HomeStackParamList, 'PaymentVerification'>;

const PaymentVerificationScreen: React.FC<Props> = ({ route }) => {
  const { cooperativeId } = route.params;
  const dispatch = useAppDispatch();
  const [refreshing, setRefreshing] = React.useState(false);

  const { pendingVerifications, isLoading } = useAppSelector((state) => state.contribution);

  const loadData = useCallback(async () => {
    await dispatch(fetchPendingVerifications(cooperativeId));
  }, [dispatch, cooperativeId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleVerify = async (recordId: string, approved: boolean) => {
    if (!approved) {
      Alert.prompt(
        'Rejection Reason',
        'Please provide a reason for rejecting this payment:',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Reject',
            style: 'destructive',
            onPress: async (reason: string | undefined) => {
              try {
                await dispatch(verifyPayment({ recordId, approved: false, reason })).unwrap();
                Alert.alert('Success', 'Payment rejected');
              } catch {
                Alert.alert('Error', 'Failed to reject payment');
              }
            },
          },
        ],
        'plain-text'
      );
    } else {
      Alert.alert('Approve Payment', 'Are you sure you want to approve this payment?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              await dispatch(verifyPayment({ recordId, approved: true })).unwrap();
              Alert.alert('Success', 'Payment approved and ledger updated');
            } catch {
              Alert.alert('Error', 'Failed to approve payment');
            }
          },
        },
      ]);
    }
  };

  if (isLoading && pendingVerifications.length === 0) {
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
        <Text style={styles.headerTitle}>Payment Verification</Text>
        <Text style={styles.headerSubtitle}>
          {pendingVerifications.length} pending payment
          {pendingVerifications.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {pendingVerifications.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>✅</Text>
          <Text style={styles.emptyTitle}>All Caught Up!</Text>
          <Text style={styles.emptyText}>No payments pending verification</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {pendingVerifications.map((record) => (
            <View key={record.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.memberInfo}>
                  <Image
                    source={{
                      uri:
                        (record as unknown as { member?: { user?: { avatarUrl: string } } })?.member
                          ?.user?.avatarUrl || 'https://i.pravatar.cc/150',
                    }}
                    style={styles.avatar}
                  />
                  <View>
                    <Text style={styles.memberName}>
                      {
                        (
                          record as unknown as {
                            member?: { user?: { firstName: string; lastName: string } };
                          }
                        )?.member?.user?.firstName
                      }{' '}
                      {
                        (
                          record as unknown as {
                            member?: { user?: { firstName: string; lastName: string } };
                          }
                        )?.member?.user?.lastName
                      }
                    </Text>
                    <Text style={styles.recordDate}>
                      Submitted {new Date(record.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.amount}>${record.amount.toLocaleString()}</Text>
              </View>

              <View style={styles.cardDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Payment Date</Text>
                  <Text style={styles.detailValue}>
                    {new Date(record.paymentDate).toLocaleDateString()}
                  </Text>
                </View>
                {record.paymentReference && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Reference</Text>
                    <Text style={styles.detailValue}>{record.paymentReference}</Text>
                  </View>
                )}
                {record.notes && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Notes</Text>
                    <Text style={styles.detailValue}>{record.notes}</Text>
                  </View>
                )}
              </View>

              {record.receiptUrl && (
                <TouchableOpacity style={styles.receiptButton}>
                  <Text style={styles.receiptIcon}>🧾</Text>
                  <Text style={styles.receiptText}>View Receipt</Text>
                </TouchableOpacity>
              )}

              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => handleVerify(record.id, false)}
                >
                  <Text style={styles.rejectButtonText}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.approveButton]}
                  onPress={() => handleVerify(record.id, true)}
                >
                  <Text style={styles.approveButtonText}>Approve</Text>
                </TouchableOpacity>
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
  header: {
    backgroundColor: '#0ea5e9',
    padding: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
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
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#e2e8f0',
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  recordDate: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  amount: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0ea5e9',
  },
  cardDetails: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0f172a',
    maxWidth: '60%',
    textAlign: 'right',
  },
  receiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  receiptIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  receiptText: {
    fontSize: 14,
    color: '#0ea5e9',
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: '#fee2e2',
  },
  rejectButtonText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '600',
  },
  approveButton: {
    backgroundColor: '#22c55e',
  },
  approveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default PaymentVerificationScreen;
