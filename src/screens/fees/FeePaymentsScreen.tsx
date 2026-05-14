import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import { feeApi } from '../../api/feeApi';
import { CooperativeFeePayment } from '../../models';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import Icon from '../../components/common/Icon';
import { usePermissions } from '../../hooks/usePermissions';

type Props = NativeStackScreenProps<HomeStackParamList, 'FeePayments'>;

const FeePaymentsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { cooperativeId, feeId, feeName } = route.params;
  const [payments, setPayments] = useState<CooperativeFeePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { canApproveFeePayments, canEditFees } = usePermissions(cooperativeId);

  const loadPayments = useCallback(async () => {
    try {
      const response = await feeApi.getFeePayments(feeId);
      if (response.success) {
        setPayments(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load payments:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [feeId]);

  useEffect(() => {
    navigation.setOptions({ title: feeName || 'Fee Payments' });
    loadPayments();
  }, [navigation, feeName, loadPayments]);

  const onRefresh = () => {
    setRefreshing(true);
    loadPayments();
  };

  const renderItem = ({ item }: { item: CooperativeFeePayment }) => (
    <View style={styles.itemCard}>
      <View style={styles.rowBetween}>
        <Text style={styles.amount}>₦{item.amount.toLocaleString()}</Text>
        <View style={[styles.statusBadge, styles[`${item.status}Badge` as keyof typeof styles]]}>
          <Text style={[styles.statusText, styles[`${item.status}Text` as keyof typeof styles]]}>
            {item.status}
          </Text>
        </View>
      </View>
      <Text style={styles.memberName}>
        {item.member?.user
          ? `${item.member.user.firstName} ${item.member.user.lastName}`
          : 'Member'}
      </Text>
      <Text style={styles.meta}>
        {item.paymentDate ? new Date(item.paymentDate).toLocaleDateString() : 'No payment date'}
      </Text>
      {item.rejectionReason ? <Text style={styles.rejection}>Reason: {item.rejectionReason}</Text> : null}
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
      <View style={styles.headerActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('RecordFeePayment', { cooperativeId, feeId, feeName })}
        >
          <Icon name="Plus" size={16} color={colors.white} />
          <Text style={styles.actionText}>Record Payment</Text>
        </TouchableOpacity>

        {canApproveFeePayments && (
          <TouchableOpacity
            style={[styles.actionButton, styles.warningAction]}
            onPress={() => navigation.navigate('FeePaymentApproval', { cooperativeId, feeId })}
          >
            <Icon name="CheckCircle2" size={16} color={colors.white} />
            <Text style={styles.actionText}>Approvals</Text>
          </TouchableOpacity>
        )}

        {canEditFees && (
          <TouchableOpacity
            style={[styles.actionButton, styles.neutralAction]}
            onPress={() => navigation.navigate('CreateFee', { cooperativeId, feeId })}
          >
            <Icon name="Pencil" size={16} color={colors.white} />
            <Text style={styles.actionText}>Edit Fee</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={payments}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="Clock" size={40} color={colors.text.disabled} />
            <Text style={styles.emptyTitle}>No payments yet</Text>
            <Text style={styles.emptySubtitle}>Record the first payment for this fee.</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.default },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  actionText: { color: colors.white, fontWeight: '700' },
  warningAction: { backgroundColor: colors.warning.main },
  neutralAction: { backgroundColor: colors.text.secondary },
  listContent: { padding: spacing.md, gap: spacing.sm },
  itemCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amount: { fontSize: 18, fontWeight: '800', color: colors.primary.main },
  memberName: { marginTop: 4, fontWeight: '600', color: colors.text.primary },
  meta: { marginTop: 2, color: colors.text.secondary, fontSize: 12 },
  rejection: { marginTop: 4, color: colors.error.main, fontSize: 12 },
  statusBadge: { borderRadius: 999, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  statusText: { fontWeight: '700', fontSize: 11, textTransform: 'capitalize' },
  pendingBadge: { backgroundColor: 'rgba(245,158,11,0.2)' },
  approvedBadge: { backgroundColor: 'rgba(34,197,94,0.2)' },
  rejectedBadge: { backgroundColor: 'rgba(239,68,68,0.2)' },
  pendingText: { color: '#b45309' },
  approvedText: { color: '#166534' },
  rejectedText: { color: '#991b1b' },
  emptyContainer: { marginTop: spacing.xxl, alignItems: 'center' },
  emptyTitle: { marginTop: spacing.sm, fontSize: 16, fontWeight: '700', color: colors.text.primary },
  emptySubtitle: { marginTop: 2, color: colors.text.secondary },
});

export default FeePaymentsScreen;
