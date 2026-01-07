import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  TextInput,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchPendingPayments, approvePayment } from '../../store/slices/contributionSlice';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import Icon from '../../components/common/Icon';
import { ContributionPayment } from '../../models';
import { getErrorMessage } from '../../utils/errorHandler';

type Props = NativeStackScreenProps<HomeStackParamList, 'PaymentApproval'>;

const PaymentApprovalScreen: React.FC<Props> = ({ route }) => {
  const { cooperativeId } = route.params;
  const dispatch = useAppDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<ContributionPayment | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const { pendingPayments, isLoading } = useAppSelector((state) => state.contribution);

  const loadData = useCallback(async () => {
    await dispatch(fetchPendingPayments(cooperativeId));
  }, [dispatch, cooperativeId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleApprove = (payment: ContributionPayment) => {
    Alert.alert(
      'Approve Payment',
      `Are you sure you want to approve this payment of ₦${payment.amount.toLocaleString()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            setProcessingId(payment.id);
            try {
              await dispatch(approvePayment({ paymentId: payment.id, data: { status: 'approved' } })).unwrap();
              Alert.alert('Success', 'Payment approved successfully');
            } catch (error: any) {
              Alert.alert('Error', getErrorMessage(error, 'Failed to approve payment'));
            }
            setProcessingId(null);
          },
        },
      ]
    );
  };

  const handleReject = (payment: ContributionPayment) => {
    setSelectedPayment(payment);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (!selectedPayment) return;

    if (!rejectionReason.trim()) {
      Alert.alert('Required', 'Please provide a reason for rejection');
      return;
    }

    setProcessingId(selectedPayment.id);
    setShowRejectModal(false);

    try {
      await dispatch(
        approvePayment({
          paymentId: selectedPayment.id,
          data: { status: 'rejected', rejectionReason: rejectionReason.trim() },
        })
      ).unwrap();
      Alert.alert('Done', 'Payment has been rejected');
    } catch (error: any) {
      Alert.alert('Error', getErrorMessage(error, 'Failed to reject payment'));
    }

    setProcessingId(null);
    setSelectedPayment(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPaymentMethodIcon = (method?: string) => {
    switch (method) {
      case 'bank_transfer':
        return 'Building';
      case 'mobile_money':
        return 'Smartphone';
      case 'card':
        return 'CreditCard';
      case 'cash':
        return 'Banknote';
      default:
        return 'Receipt';
    }
  };

  const renderPaymentCard = ({ item: payment }: { item: ContributionPayment }) => {
    const isProcessing = processingId === payment.id;
    const member = payment.member;
    const plan = payment.subscription?.plan;

    return (
      <View style={styles.paymentCard}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.memberInfo}>
            {member?.user?.avatarUrl ? (
              <Image source={{ uri: member.user.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {member?.user?.firstName?.[0]}
                  {member?.user?.lastName?.[0]}
                </Text>
              </View>
            )}
            <View style={styles.memberDetails}>
              <Text style={styles.memberName}>
                {member?.user?.firstName} {member?.user?.lastName}
              </Text>
              <Text style={styles.planName}>{plan?.name}</Text>
            </View>
          </View>
          <View style={styles.amountBadge}>
            <Text style={styles.amountText}>₦{payment.amount.toLocaleString()}</Text>
          </View>
        </View>

        {/* Payment Details */}
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Icon name={getPaymentMethodIcon(payment.paymentMethod)} size={14} color={colors.text.secondary} />
            <Text style={styles.detailText}>{payment.paymentMethod?.replace('_', ' ') || 'Not specified'}</Text>
          </View>
          <View style={styles.detailItem}>
            <Icon name="Clock" size={14} color={colors.text.secondary} />
            <Text style={styles.detailText}>{formatDate(payment.paymentDate)}</Text>
          </View>
        </View>

        {payment.paymentReference && (
          <View style={styles.referenceRow}>
            <Text style={styles.referenceLabel}>Ref:</Text>
            <Text style={styles.referenceValue}>{payment.paymentReference}</Text>
          </View>
        )}

        {payment.notes && (
          <View style={styles.notesRow}>
            <Text style={styles.notesText}>{payment.notes}</Text>
          </View>
        )}

        {payment.receiptUrl && (
          <TouchableOpacity style={styles.receiptButton}>
            <Icon name="Image" size={16} color={colors.primary.main} />
            <Text style={styles.receiptButtonText}>View Receipt</Text>
          </TouchableOpacity>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleReject(payment)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color={colors.error.main} />
            ) : (
              <>
                <Icon name="X" size={18} color={colors.error.main} />
                <Text style={[styles.actionButtonText, styles.rejectButtonText]}>Reject</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => handleApprove(payment)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color={colors.primary.contrast} />
            ) : (
              <>
                <Icon name="Check" size={18} color={colors.primary.contrast} />
                <Text style={[styles.actionButtonText, styles.approveButtonText]}>Approve</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (isLoading && pendingPayments.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.main} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Stats */}
      <View style={styles.headerStats}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{pendingPayments.length}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            ₦{pendingPayments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
          </Text>
          <Text style={styles.statLabel}>Total Amount</Text>
        </View>
      </View>

      {/* Payment List */}
      <FlatList
        data={pendingPayments}
        renderItem={renderPaymentCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="CheckCircle" size={64} color={colors.success.main} />
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptyText}>No pending payments to review</Text>
          </View>
        }
      />

      {/* Rejection Modal */}
      <Modal
        visible={showRejectModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRejectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reject Payment</Text>
              <TouchableOpacity onPress={() => setShowRejectModal(false)}>
                <Icon name="X" size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Please provide a reason for rejecting this payment of ₦
              {selectedPayment?.amount.toLocaleString()}.
            </Text>

            <TextInput
              style={styles.reasonInput}
              value={rejectionReason}
              onChangeText={setRejectionReason}
              placeholder="Enter rejection reason..."
              placeholderTextColor={colors.text.disabled}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowRejectModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalRejectButton]}
                onPress={confirmReject}
              >
                <Text style={styles.modalRejectText}>Reject Payment</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerStats: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.sm,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary.main,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  listContent: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  paymentCard: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary.main,
  },
  memberDetails: {
    marginLeft: spacing.md,
    flex: 1,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  planName: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  amountBadge: {
    backgroundColor: colors.primary.light,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary.main,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.sm,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  detailText: {
    fontSize: 12,
    color: colors.text.secondary,
    textTransform: 'capitalize',
  },
  referenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.default,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  referenceLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginRight: spacing.xs,
  },
  referenceValue: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text.primary,
    flex: 1,
  },
  notesRow: {
    backgroundColor: colors.background.default,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  notesText: {
    fontSize: 12,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  receiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  receiptButtonText: {
    fontSize: 13,
    color: colors.primary.main,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingTop: spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  rejectButton: {
    backgroundColor: colors.error.light,
    borderWidth: 1,
    borderColor: colors.error.main,
  },
  approveButton: {
    backgroundColor: colors.primary.main,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  rejectButtonText: {
    color: colors.error.main,
  },
  approveButtonText: {
    color: colors.primary.contrast,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl * 2,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: spacing.lg,
  },
  emptyText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.paper,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  modalDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  reasonInput: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text.primary,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: spacing.xl,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: colors.background.default,
    borderWidth: 1,
    borderColor: colors.border.main,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  modalRejectButton: {
    backgroundColor: colors.error.main,
  },
  modalRejectText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary.contrast,
  },
});

export default PaymentApprovalScreen;
