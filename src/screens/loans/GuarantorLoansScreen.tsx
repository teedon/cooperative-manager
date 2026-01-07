import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import { loanApi } from '../../api/loanApi';
import { formatCurrency, formatDate } from '../../utils';
import Icon from '../../components/common/Icon';

type Props = NativeStackScreenProps<HomeStackParamList, 'GuarantorLoans'>;

const GuarantorLoansScreen: React.FC<Props> = ({ route, navigation }) => {
  const { cooperativeId } = route.params;
  const [loans, setLoans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const loadLoans = async () => {
    try {
      setIsLoading(true);
      const response = await loanApi.getLoansAsGuarantor(cooperativeId);
      setLoans(response.data || []);
    } catch (error: any) {
      console.error('Failed to load guarantor loans:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to load loans');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLoans();
  }, [cooperativeId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLoans();
    setRefreshing(false);
  };

  const openResponseModal = (loan: any) => {
    setSelectedLoan(loan);
    setShowResponseModal(true);
  };

  const closeResponseModal = () => {
    setShowResponseModal(false);
    setSelectedLoan(null);
    setRejectionReason('');
  };

  const handleApprove = async () => {
    if (!selectedLoan) return;

    Alert.alert(
      'Approve Guarantee',
      `Are you sure you want to guarantee this ${formatCurrency(selectedLoan.amount)} loan for ${selectedLoan.member?.user?.firstName} ${selectedLoan.member?.user?.lastName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            setIsApproving(true);
            try {
              await loanApi.respondToGuarantorRequest(selectedLoan.id, true);
              Alert.alert('Success', 'You have successfully approved to guarantee this loan');
              closeResponseModal();
              loadLoans();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to approve guarantee');
            } finally {
              setIsApproving(false);
            }
          },
        },
      ]
    );
  };

  const handleReject = async () => {
    if (!selectedLoan) return;
    if (!rejectionReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for rejecting');
      return;
    }

    setIsApproving(true);
    try {
      await loanApi.respondToGuarantorRequest(selectedLoan.id, false, rejectionReason);
      Alert.alert('Success', 'You have declined to guarantee this loan');
      closeResponseModal();
      loadLoans();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit rejection');
    } finally {
      setIsApproving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#f59e0b';
      case 'approved':
        return '#22c55e';
      case 'rejected':
        return '#ef4444';
      default:
        return '#64748b';
    }
  };

  const renderLoanItem = ({ item }: { item: any }) => {
    const isPending = item.guarantorStatus === 'pending';
    const isApproved = item.guarantorStatus === 'approved';
    const isRejected = item.guarantorStatus === 'rejected';

    return (
      <TouchableOpacity
        style={styles.loanCard}
        onPress={() => {
          if (isPending) {
            openResponseModal(item);
          } else {
            navigation.navigate('LoanDetail', { loanId: item.id });
          }
        }}
      >
        <View style={styles.loanHeader}>
          <View style={styles.loanHeaderLeft}>
            <Text style={styles.loanAmount}>{formatCurrency(item.amount)}</Text>
            <Text style={styles.loanMember}>
              {item.member?.user?.firstName} {item.member?.user?.lastName}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.guarantorStatus) }]}>
            <Text style={styles.statusText}>{item.guarantorStatus}</Text>
          </View>
        </View>

        <View style={styles.loanDetails}>
          <View style={styles.detailRow}>
            <Icon name="document-text-outline" size={16} color="#64748b" />
            <Text style={styles.detailText}>{item.purpose}</Text>
          </View>
          <View style={styles.detailRow}>
            <Icon name="time-outline" size={16} color="#64748b" />
            <Text style={styles.detailText}>{item.duration} months</Text>
          </View>
          <View style={styles.detailRow}>
            <Icon name="calendar-outline" size={16} color="#64748b" />
            <Text style={styles.detailText}>Requested {formatDate(item.requestedAt)}</Text>
          </View>
        </View>

        {isPending && (
          <View style={styles.actionHint}>
            <Icon name="hand-right-outline" size={16} color="#8b5cf6" />
            <Text style={styles.actionHintText}>Tap to respond</Text>
          </View>
        )}

        {isRejected && item.guarantorRejectionReason && (
          <View style={styles.rejectionInfo}>
            <Text style={styles.rejectionLabel}>Your reason:</Text>
            <Text style={styles.rejectionText}>{item.guarantorRejectionReason}</Text>
          </View>
        )}

        {isApproved && item.guarantorRespondedAt && (
          <View style={styles.approvedInfo}>
            <Icon name="checkmark-circle" size={16} color="#22c55e" />
            <Text style={styles.approvedText}>
              Approved on {formatDate(item.guarantorRespondedAt)}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={loans}
        renderItem={renderLoanItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="document-outline" size={64} color="#cbd5e1" />
            <Text style={styles.emptyText}>No guarantor requests</Text>
            <Text style={styles.emptySubtext}>
              You haven't been requested to guarantee any loans yet
            </Text>
          </View>
        }
      />

      {/* Response Modal */}
      <Modal
        visible={showResponseModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeResponseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Guarantor Request</Text>
              <TouchableOpacity onPress={closeResponseModal} style={styles.closeButton}>
                <Icon name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.modalScrollView}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
            >
              {selectedLoan && (
                <>
                  <View style={styles.loanSummary}>
                    <Text style={styles.summaryLabel}>Member</Text>
                    <Text style={styles.summaryValue}>
                      {selectedLoan.member?.user?.firstName} {selectedLoan.member?.user?.lastName}
                    </Text>

                    <Text style={styles.summaryLabel}>Amount</Text>
                    <Text style={styles.summaryValue}>{formatCurrency(selectedLoan.amount)}</Text>

                    <Text style={styles.summaryLabel}>Purpose</Text>
                    <Text style={styles.summaryValue}>{selectedLoan.purpose}</Text>

                    <Text style={styles.summaryLabel}>Duration</Text>
                    <Text style={styles.summaryValue}>{selectedLoan.duration} months</Text>

                    <Text style={styles.summaryLabel}>Interest Rate</Text>
                    <Text style={styles.summaryValue}>{selectedLoan.interestRate}%</Text>
                  </View>

                  <View style={styles.warningBox}>
                    <Icon name="alert-circle-outline" size={20} color="#f59e0b" />
                    <Text style={styles.warningText}>
                      As a guarantor, you may be liable if the borrower defaults on this loan
                    </Text>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Rejection Reason (if declining)</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder="Enter reason for declining..."
                      value={rejectionReason}
                      onChangeText={setRejectionReason}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                    />
                  </View>

                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={[styles.rejectButton, isApproving && styles.buttonDisabled]}
                      onPress={handleReject}
                      disabled={isApproving}
                    >
                      {isApproving ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Icon name="close-circle-outline" size={20} color="#fff" />
                          <Text style={styles.rejectButtonText}>Decline</Text>
                        </>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.approveButton, isApproving && styles.buttonDisabled]}
                      onPress={handleApprove}
                      disabled={isApproving}
                    >
                      {isApproving ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Icon name="checkmark-circle-outline" size={20} color="#fff" />
                          <Text style={styles.approveButtonText}>Approve</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
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
  listContent: {
    padding: 16,
  },
  loanCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  loanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  loanHeaderLeft: {
    flex: 1,
  },
  loanAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  loanMember: {
    fontSize: 16,
    color: '#64748b',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  loanDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#64748b',
  },
  actionHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f3ff',
    padding: 12,
    borderRadius: 8,
  },
  actionHintText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#8b5cf6',
    fontWeight: '600',
  },
  rejectionInfo: {
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 8,
  },
  rejectionLabel: {
    fontSize: 12,
    color: '#991b1b',
    marginBottom: 4,
    fontWeight: '600',
  },
  rejectionText: {
    fontSize: 14,
    color: '#dc2626',
  },
  approvedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 8,
  },
  approvedText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#16a34a',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 8,
    textAlign: 'center',
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
    padding: 24,
    maxHeight: '85%',
    height: '85%',
  },
  modalScrollView: {
    flexGrow: 1,
  },
  modalScrollContent: {
    paddingBottom: 16,
    flexGrow: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  closeButton: {
    padding: 4,
  },
  loanSummary: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 12,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '600',
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#fffbeb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  warningText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#92400e',
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1e293b',
  },
  textArea: {
    minHeight: 80,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  rejectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#22c55e',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  approveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

export default GuarantorLoansScreen;
