import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import { feeApi } from '../../api/feeApi';
import { CooperativeFeePayment } from '../../models';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import Icon from '../../components/common/Icon';

type Props = NativeStackScreenProps<HomeStackParamList, 'FeePaymentApproval'>;

const FeePaymentApprovalScreen: React.FC<Props> = ({ route }) => {
  const { cooperativeId, feeId } = route.params;
  const [payments, setPayments] = useState<CooperativeFeePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPending = useCallback(async () => {
    try {
      const response = feeId
        ? await feeApi.getFeePayments(feeId, { status: 'pending' })
        : await feeApi.getPendingPayments(cooperativeId);
      if (response.success) {
        setPayments((response.data || []).filter((p) => p.status === 'pending'));
      }
    } catch (error) {
      console.error('Failed to load pending fee payments:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [cooperativeId, feeId]);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  const onRefresh = () => {
    setRefreshing(true);
    loadPending();
  };

  const onApprove = async (paymentId: string) => {
    try {
      const response = await feeApi.approveFeePayment(paymentId, { status: 'approved' });
      if (response.success) {
        loadPending();
      } else {
        Alert.alert('Error', response.message || 'Failed to approve payment');
      }
    } catch (error) {
      console.error('Approve error:', error);
      Alert.alert('Error', 'Failed to approve payment');
    }
  };

  const onReject = async (paymentId: string) => {
    Alert.prompt(
      'Reject Payment',
      'Enter rejection reason',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async (reason) => {
            if (!reason?.trim()) return;
            try {
              const response = await feeApi.approveFeePayment(paymentId, {
                status: 'rejected',
                rejectionReason: reason.trim(),
              });
              if (response.success) {
                loadPending();
              } else {
                Alert.alert('Error', response.message || 'Failed to reject payment');
              }
            } catch (error) {
              console.error('Reject error:', error);
              Alert.alert('Error', 'Failed to reject payment');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const renderItem = ({ item }: { item: CooperativeFeePayment }) => (
    <View style={styles.card}>
      <Text style={styles.amount}>₦{item.amount.toLocaleString()}</Text>
      <Text style={styles.memberName}>
        {item.member?.user
          ? `${item.member.user.firstName} ${item.member.user.lastName}`
          : 'Member'}
      </Text>
      <Text style={styles.meta}>{item.fee?.name || 'Fee Payment'}</Text>
      <View style={styles.actionsRow}>
        <TouchableOpacity style={[styles.actionBtn, styles.approveBtn]} onPress={() => onApprove(item.id)}>
          <Icon name="CheckCircle2" size={16} color={colors.white} />
          <Text style={styles.actionText}>Approve</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => onReject(item.id)}>
          <Icon name="XCircle" size={16} color={colors.white} />
          <Text style={styles.actionText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary.main} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={payments}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="CheckCheck" size={40} color={colors.text.disabled} />
            <Text style={styles.emptyTitle}>No pending fee payments</Text>
            <Text style={styles.emptySubtitle}>Everything is up to date.</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.default },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: spacing.md, gap: spacing.sm },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  amount: { fontSize: 18, fontWeight: '800', color: colors.primary.main },
  memberName: { marginTop: 4, fontWeight: '700', color: colors.text.primary },
  meta: { marginTop: 2, color: colors.text.secondary, fontSize: 12 },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  approveBtn: { backgroundColor: colors.success.main },
  rejectBtn: { backgroundColor: colors.error.main },
  actionText: { color: colors.white, fontWeight: '700' },
  emptyContainer: { marginTop: spacing.xxl, alignItems: 'center' },
  emptyTitle: { marginTop: spacing.sm, fontSize: 16, fontWeight: '700', color: colors.text.primary },
  emptySubtitle: { marginTop: 2, color: colors.text.secondary },
});

export default FeePaymentApprovalScreen;
