import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import { formatCurrency, formatDate } from '../../utils';
import { loanApi } from '../../api/loanApi';
import { getErrorMessage } from '../../utils/errorHandler';
import Icon from '../../components/common/Icon';
import { usePermissions } from '../../hooks/usePermissions';
import { useAppSelector } from '../../store/hooks';

type Props = NativeStackScreenProps<HomeStackParamList, 'LiquidationDetail'>;

const LiquidationDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { loanId, liquidationId } = route.params;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [liquidation, setLiquidation] = useState<any>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');

  const { user } = useAppSelector((state) => state.auth);
  const { canApproveLoans } = usePermissions(liquidation?.loan?.cooperativeId);

  useEffect(() => {
    fetchLiquidationDetails();
  }, [loanId, liquidationId]);

  const fetchLiquidationDetails = async () => {
    try {
      setLoading(true);
      const response = await loanApi.getLiquidation(loanId, liquidationId);
      if (response.success && response.data) {
        setLiquidation(response.data);
      }
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error));
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    Alert.alert(
      'Approve Liquidation',
      'Are you sure you want to approve this liquidation request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              setSubmitting(true);
              const response = await loanApi.approveLiquidation(
                loanId,
                liquidationId,
                approvalNotes
              );
              if (response.success) {
                Alert.alert('Success', 'Liquidation approved successfully', [
                  { text: 'OK', onPress: () => navigation.goBack() },
                ]);
              }
            } catch (error) {
              Alert.alert('Error', getErrorMessage(error));
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for rejection');
      return;
    }

    try {
      setSubmitting(true);
      const response = await loanApi.rejectLiquidation(
        loanId,
        liquidationId,
        rejectionReason
      );
      if (response.success) {
        setShowRejectModal(false);
        Alert.alert('Success', 'Liquidation rejected successfully', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: any = {
      pending: { label: 'Pending', color: '#fff3cd', textColor: '#856404' },
      approved: { label: 'Approved', color: '#d1ecf1', textColor: '#0c5460' },
      rejected: { label: 'Rejected', color: '#f8d7da', textColor: '#721c24' },
      completed: { label: 'Completed', color: '#d4edda', textColor: '#155724' },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <View style={[styles.statusBadge, { backgroundColor: config.color }]}>
        <Text style={[styles.statusText, { color: config.textColor }]}>
          {config.label}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading liquidation details...</Text>
      </View>
    );
  }

  if (!liquidation) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Liquidation not found</Text>
      </View>
    );
  }

  const member = liquidation.loan?.member;
  const memberName = member?.user
    ? `${member.user.firstName} ${member.user.lastName}`
    : member?.firstName && member?.lastName
    ? `${member.firstName} ${member.lastName}`
    : 'Unknown Member';

  const canApproveReject = canApproveLoans && liquidation.status === 'pending';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Liquidation Request</Text>
          {getStatusBadge(liquidation.status)}
        </View>
        <Text style={styles.headerSubtitle}>{memberName}</Text>
      </View>

      {/* Liquidation Details */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Liquidation Details</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Type:</Text>
          <Text style={styles.detailValue}>
            {liquidation.liquidationType === 'complete' ? 'Complete Liquidation' : 'Partial Liquidation'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Requested By:</Text>
          <Text style={styles.detailValue}>
            {liquidation.requestedBy === 'admin' ? 'Admin' : 'Member'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Requested At:</Text>
          <Text style={styles.detailValue}>
            {formatDate(new Date(liquidation.requestedAt))}
          </Text>
        </View>
      </View>

      {/* Amount Breakdown */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Amount Breakdown</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Outstanding Balance:</Text>
          <Text style={styles.detailValue}>
            {formatCurrency(liquidation.outstandingBalance)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Principal Amount:</Text>
          <Text style={styles.detailValue}>
            {formatCurrency(liquidation.principalAmount)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Interest Amount:</Text>
          <Text style={styles.detailValue}>
            {formatCurrency(liquidation.interestAmount)}
          </Text>
        </View>
        {liquidation.earlyPaymentDiscount > 0 && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Early Payment Discount:</Text>
            <Text style={[styles.detailValue, styles.discount]}>
              -{formatCurrency(liquidation.earlyPaymentDiscount)}
            </Text>
          </View>
        )}
        {liquidation.processingFee > 0 && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Processing Fee:</Text>
            <Text style={styles.detailValue}>
              {formatCurrency(liquidation.processingFee)}
            </Text>
          </View>
        )}
        <View style={[styles.detailRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total Amount:</Text>
          <Text style={styles.totalValue}>
            {formatCurrency(liquidation.finalAmount)}
          </Text>
        </View>
      </View>

      {/* Payment Information */}
      {(liquidation.paymentMethod || liquidation.paymentReference) && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment Information</Text>
          {liquidation.paymentMethod && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payment Method:</Text>
              <Text style={styles.detailValue}>
                {liquidation.paymentMethod.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
          )}
          {liquidation.paymentReference && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payment Reference:</Text>
              <Text style={styles.detailValue}>{liquidation.paymentReference}</Text>
            </View>
          )}
        </View>
      )}

      {/* Notes */}
      {liquidation.notes && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Notes</Text>
          <Text style={styles.notesText}>{liquidation.notes}</Text>
        </View>
      )}

      {/* Review Information */}
      {(liquidation.reviewedBy || liquidation.rejectionReason) && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Review Information</Text>
          {liquidation.reviewedAt && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Reviewed At:</Text>
              <Text style={styles.detailValue}>
                {formatDate(new Date(liquidation.reviewedAt))}
              </Text>
            </View>
          )}
          {liquidation.rejectionReason && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Rejection Reason:</Text>
              <Text style={[styles.detailValue, styles.rejectionText]}>
                {liquidation.rejectionReason}
              </Text>
            </View>
          )}
          {liquidation.completedAt && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Completed At:</Text>
              <Text style={styles.detailValue}>
                {formatDate(new Date(liquidation.completedAt))}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Admin Actions */}
      {canApproveReject && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Admin Actions</Text>
          <Text style={styles.inputLabel}>Notes (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Add notes about this decision"
            value={approvalNotes}
            onChangeText={setApprovalNotes}
            multiline
            numberOfLines={3}
          />

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => setShowRejectModal(true)}
              disabled={submitting}
            >
              <Icon name="close-circle" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.approveButton]}
              onPress={handleApprove}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Icon name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Approve</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.footer} />

      {/* Reject Modal */}
      <Modal
        visible={showRejectModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRejectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reject Liquidation</Text>
            <Text style={styles.modalSubtitle}>
              Please provide a reason for rejecting this liquidation request.
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter rejection reason"
              value={rejectionReason}
              onChangeText={setRejectionReason}
              multiline
              numberOfLines={4}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowRejectModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSubmitButton]}
                onPress={handleReject}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalSubmitButtonText}>Reject</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 0,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  discount: {
    color: '#4caf50',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#007AFF',
    borderBottomWidth: 0,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  notesText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  rejectionText: {
    color: '#d32f2f',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
    borderRadius: 8,
    gap: 8,
  },
  approveButton: {
    backgroundColor: '#4caf50',
  },
  rejectButton: {
    backgroundColor: '#d32f2f',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    height: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#e0e0e0',
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  modalSubmitButton: {
    backgroundColor: '#d32f2f',
  },
  modalSubmitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default LiquidationDetailScreen;
