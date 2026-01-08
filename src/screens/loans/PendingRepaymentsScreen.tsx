import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppSelector } from '../../store/hooks';
import { getPendingRepayments, confirmRepayment, rejectRepayment, PendingRepayment } from '../../api/repaymentApi';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { getErrorMessage } from '../../utils/errorHandler';
import Icon from '../../components/common/Icon';
import { HomeStackParamList } from '../../navigation/MainNavigator';

type PendingRepaymentsScreenRouteProp = RouteProp<HomeStackParamList, 'PendingRepayments'>;
type PendingRepaymentsScreenNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'PendingRepayments'>;

export default function PendingRepaymentsScreen() {
  const route = useRoute<PendingRepaymentsScreenRouteProp>();
  const navigation = useNavigation<PendingRepaymentsScreenNavigationProp>();
  const { cooperativeId } = route.params;

  const [repayments, setRepayments] = useState<PendingRepayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRepayment, setSelectedRepayment] = useState<PendingRepayment | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const loadRepayments = useCallback(async () => {
    try {
      const data = await getPendingRepayments(cooperativeId);
      setRepayments(data);
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error, 'Failed to load pending repayments'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [cooperativeId]);

  useEffect(() => {
    loadRepayments();
  }, [loadRepayments]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadRepayments();
  };

  const handleViewDetails = (repayment: PendingRepayment) => {
    setSelectedRepayment(repayment);
    setShowDetailsModal(true);
  };

  const handleConfirm = async (repayment: PendingRepayment) => {
    Alert.alert(
      'Confirm Repayment',
      `Are you sure you want to confirm this repayment of ${formatCurrency(repayment.amount)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setProcessing(true);
            try {
              await confirmRepayment(repayment.id);
              Alert.alert('Success', 'Repayment confirmed successfully');
              setShowDetailsModal(false);
              loadRepayments();
            } catch (error) {
              Alert.alert('Error', getErrorMessage(error, 'Failed to confirm repayment'));
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleReject = (repayment: PendingRepayment) => {
    setSelectedRepayment(repayment);
    setShowDetailsModal(false);
    setShowRejectModal(true);
    setRejectionReason('');
  };

  const submitRejection = async () => {
    if (!rejectionReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for rejection');
      return;
    }

    if (!selectedRepayment) return;

    setProcessing(true);
    try {
      await rejectRepayment(selectedRepayment.id, rejectionReason);
      Alert.alert('Success', 'Repayment rejected successfully');
      setShowRejectModal(false);
      loadRepayments();
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error, 'Failed to reject repayment'));
    } finally {
      setProcessing(false);
    }
  };

  const renderRepaymentCard = ({ item }: { item: PendingRepayment }) => {
    const memberName = item.loan.member.user
      ? `${item.loan.member.user.firstName} ${item.loan.member.user.lastName}`
      : 'Unknown Member';

    return (
      <TouchableOpacity style={styles.card} onPress={() => handleViewDetails(item)}>
        <View style={styles.cardHeader}>
          <View style={styles.memberInfo}>
            <Text style={styles.memberName}>{memberName}</Text>
            <Text style={styles.submittedDate}>
              Submitted {formatDate(item.submittedAt)}
            </Text>
          </View>
          <View style={styles.amountBadge}>
            <Text style={styles.amountText}>{formatCurrency(item.amount)}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Icon name="card-outline" size={16} color="#64748b" />
            <Text style={styles.infoLabel}>Payment Method:</Text>
            <Text style={styles.infoValue}>
              {item.paymentMethod === 'bank_transfer' ? 'Bank Transfer' :
               item.paymentMethod === 'cash' ? 'Cash' :
               item.paymentMethod === 'mobile_money' ? 'Mobile Money' :
               item.paymentMethod}
            </Text>
          </View>

          {item.receiptNumber && (
            <View style={styles.infoRow}>
              <Icon name="receipt-outline" size={16} color="#64748b" />
              <Text style={styles.infoLabel}>Receipt:</Text>
              <Text style={styles.infoValue}>{item.receiptNumber}</Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Icon name="calendar-outline" size={16} color="#64748b" />
            <Text style={styles.infoLabel}>Payment Date:</Text>
            <Text style={styles.infoValue}>{formatDate(item.paymentDate)}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.viewDetailsButton}
            onPress={() => handleViewDetails(item)}
          >
            <Text style={styles.viewDetailsText}>View Details</Text>
            <Icon name="chevron-forward" size={16} color="#3b82f6" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading pending repayments...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={repayments}
        renderItem={renderRepaymentCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={repayments.length === 0 ? styles.emptyContainer : styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="checkmark-done-circle-outline" size={64} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No Pending Repayments</Text>
            <Text style={styles.emptyText}>
              All repayments have been reviewed. New submissions will appear here.
            </Text>
          </View>
        }
      />

      {/* Details Modal */}
      <Modal
        visible={showDetailsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Repayment Details</Text>
              <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                <Icon name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {selectedRepayment && (
                <>
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>Member Information</Text>
                    <Text style={styles.detailText}>
                      {selectedRepayment.loan.member.user
                        ? `${selectedRepayment.loan.member.user.firstName} ${selectedRepayment.loan.member.user.lastName}`
                        : 'Unknown Member'}
                    </Text>
                    {selectedRepayment.loan.member.user?.email && (
                      <Text style={styles.detailSubtext}>
                        {selectedRepayment.loan.member.user.email}
                      </Text>
                    )}
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>Payment Details</Text>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Amount:</Text>
                      <Text style={styles.detailValue}>
                        {formatCurrency(selectedRepayment.amount)}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Method:</Text>
                      <Text style={styles.detailValue}>
                        {selectedRepayment.paymentMethod}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Date:</Text>
                      <Text style={styles.detailValue}>
                        {formatDate(selectedRepayment.paymentDate)}
                      </Text>
                    </View>
                    {selectedRepayment.receiptNumber && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Receipt:</Text>
                        <Text style={styles.detailValue}>
                          {selectedRepayment.receiptNumber}
                        </Text>
                      </View>
                    )}
                  </View>

                  {selectedRepayment.notes && (
                    <View style={styles.detailSection}>
                      <Text style={styles.sectionTitle}>Notes</Text>
                      <Text style={styles.detailText}>{selectedRepayment.notes}</Text>
                    </View>
                  )}

                  <View style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>Loan Information</Text>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Loan Amount:</Text>
                      <Text style={styles.detailValue}>
                        {formatCurrency(selectedRepayment.loan.amount)}
                      </Text>
                    </View>
                    {selectedRepayment.loan.loanType && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Type:</Text>
                        <Text style={styles.detailValue}>
                          {selectedRepayment.loan.loanType.name}
                        </Text>
                      </View>
                    )}
                  </View>
                </>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => selectedRepayment && handleReject(selectedRepayment)}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Icon name="close-circle" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Reject</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.confirmButton]}
                onPress={() => selectedRepayment && handleConfirm(selectedRepayment)}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Icon name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Confirm</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reject Modal */}
      <Modal
        visible={showRejectModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRejectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reject Repayment</Text>
              <TouchableOpacity onPress={() => setShowRejectModal(false)}>
                <Icon name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Reason for Rejection</Text>
              <TextInput
                style={styles.textArea}
                value={rejectionReason}
                onChangeText={setRejectionReason}
                placeholder="Provide a reason for rejecting this repayment..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => setShowRejectModal(false)}
                disabled={processing}
              >
                <Text style={[styles.actionButtonText, styles.cancelButtonText]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.submitButton]}
                onPress={submitRejection}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.actionButtonText}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
  listContainer: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  submittedDate: {
    fontSize: 12,
    color: '#64748b',
  },
  amountBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  amountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
  },
  cardBody: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
    marginRight: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewDetailsText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
    marginRight: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
  },
  modalBody: {
    padding: 20,
  },
  detailSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 16,
    color: '#1e293b',
    marginBottom: 4,
  },
  detailSubtext: {
    fontSize: 14,
    color: '#64748b',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  detailValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  confirmButton: {
    backgroundColor: '#22c55e',
  },
  rejectButton: {
    backgroundColor: '#ef4444',
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  cancelButtonText: {
    color: '#64748b',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#1e293b',
    minHeight: 100,
  },
});
