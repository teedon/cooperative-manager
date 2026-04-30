import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  StyleSheet,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchPendingLoans, approveLoan, rejectLoan, finalApproveLoan } from '../../store/slices/loanSlice';
import { Card, Badge, Modal, Button } from '../../components/common';
import { LoanRequest } from '../../models';
import { formatCurrency, formatDate } from '../../utils';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getErrorMessage } from '../../utils/errorHandler';

type Props = NativeStackScreenProps<any, 'LoanApprovalList'>;

const LoanApprovalListScreen: React.FC<Props> = ({ route, navigation }) => {
  const { cooperativeId } = route.params as { cooperativeId: string };
  const dispatch = useAppDispatch();
  const { pendingLoans, isLoading } = useAppSelector((state) => state.loan);
  const currentUser = useAppSelector((state) => state.auth?.user);
  const [refreshing, setRefreshing] = useState(false);
  
  // Approval modal state
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<LoanRequest | null>(null);
  const [deductionStartDate, setDeductionStartDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  
  // Rejection modal state
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Final approve modal state
  const [finalApproveModalVisible, setFinalApproveModalVisible] = useState(false);
  const [finalAdjustedAmount, setFinalAdjustedAmount] = useState('');
  const [finalNotes, setFinalNotes] = useState('');
  const [finalDeductionDate, setFinalDeductionDate] = useState(new Date());
  const [showFinalDatePicker, setShowFinalDatePicker] = useState(false);

  useEffect(() => {
    loadPendingLoans();
  }, [cooperativeId]);

  const loadPendingLoans = () => {
    dispatch(fetchPendingLoans(cooperativeId));
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    dispatch(fetchPendingLoans(cooperativeId)).finally(() => setRefreshing(false));
  }, [cooperativeId]);

  const openApproveModal = (loan: LoanRequest) => {
    setSelectedLoan(loan);
    setDeductionStartDate(new Date());
    setApprovalNotes('');
    setApproveModalVisible(true);
  };

  const openRejectModal = (loan: LoanRequest) => {
    setSelectedLoan(loan);
    setRejectionReason('');
    setRejectModalVisible(true);
  };

  const openFinalApproveModal = (loan: LoanRequest) => {
    setSelectedLoan(loan);
    setFinalAdjustedAmount('');
    setFinalNotes('');
    setFinalDeductionDate(new Date());
    setFinalApproveModalVisible(true);
  };

  const handleApprove = async () => {
    if (!selectedLoan) return;

    try {
      await dispatch(
        approveLoan({
          loanId: selectedLoan.id,
          data: {
            deductionStartDate: deductionStartDate.toISOString(),
            notes: approvalNotes || undefined,
          },
        })
      ).unwrap();

      Alert.alert('Success', 'Loan approved successfully. Repayment schedule has been generated.');
      setApproveModalVisible(false);
      setSelectedLoan(null);
    } catch (error: any) {
      Alert.alert('Error', getErrorMessage(error, 'Failed to approve loan'));
    }
  };

  const handleReject = async () => {
    if (!selectedLoan) return;

    if (!rejectionReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for rejection');
      return;
    }

    try {
      await dispatch(
        rejectLoan({
          loanId: selectedLoan.id,
          reason: rejectionReason.trim(),
        })
      ).unwrap();

      Alert.alert('Success', 'Your rejection vote has been recorded.');
      setRejectModalVisible(false);
      setSelectedLoan(null);
    } catch (error: any) {
      Alert.alert('Error', getErrorMessage(error, 'Failed to reject loan'));
    }
  };

  const handleFinalApprove = async () => {
    if (!selectedLoan) return;

    try {
      const parsedAmount = finalAdjustedAmount.trim()
        ? parseFloat(finalAdjustedAmount.replace(/,/g, ''))
        : undefined;

      if (parsedAmount !== undefined && (isNaN(parsedAmount) || parsedAmount < 1000)) {
        Alert.alert('Error', 'Adjusted amount must be at least ₦1,000');
        return;
      }

      await dispatch(
        finalApproveLoan({
          loanId: selectedLoan.id,
          data: {
            adjustedAmount: parsedAmount,
            deductionStartDate: finalDeductionDate.toISOString(),
            notes: finalNotes || undefined,
          },
        })
      ).unwrap();

      const message = parsedAmount
        ? `Counter-offer of ₦${parsedAmount.toLocaleString()} sent to member for acceptance.`
        : 'Loan has been fully approved.';
      Alert.alert('Success', message);
      setFinalApproveModalVisible(false);
      setSelectedLoan(null);
    } catch (error: any) {
      Alert.alert('Error', getErrorMessage(error, 'Failed to process final approval'));
    }
  };

  const getMemberName = (loan: LoanRequest): string => {
    if (loan.member?.user) {
      return `${loan.member.user.firstName} ${loan.member.user.lastName}`;
    }
    if (loan.member?.firstName) {
      return `${loan.member.firstName} ${loan.member.lastName || ''}`;
    }
    return 'Unknown Member';
  };

  const getGuarantorApprovalStatus = (loan: LoanRequest) => {
    if (!loan.loanType?.requiresGuarantor) {
      return { canApprove: true, message: null };
    }

    const minGuarantors = loan.loanType.minGuarantors || 1;
    const approvedGuarantors = loan.guarantors?.filter(g => g.status === 'approved').length || 0;
    const canApprove = approvedGuarantors >= minGuarantors;

    return {
      canApprove,
      message: canApprove
        ? null
        : `Requires ${minGuarantors - approvedGuarantors} more guarantor approval(s)`,
      approvedCount: approvedGuarantors,
      requiredCount: minGuarantors,
    };
  };

  const renderLoanCard = ({ item }: { item: LoanRequest }) => {
    const guarantorStatus = getGuarantorApprovalStatus(item);
    const isConditionallyApproved = item.status === 'conditionally_approved';
    const isFinalApprover = currentUser && item.finalApproverUserId === currentUser.id;
    const rejectionVotes = item.approvals?.filter(a => a.decision === 'rejected').length ?? 0;
    
    return (
    <Card style={styles.loanCard}>
      <View style={styles.cardHeader}>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{getMemberName(item)}</Text>
          <Text style={styles.requestDate}>
            Requested {formatDate(item.requestedAt || item.createdAt)}
          </Text>
        </View>
        <Badge
          variant={isConditionallyApproved ? 'info' : 'warning'}
          text={isConditionallyApproved ? 'Needs Final Approval' : 'Pending'}
        />
      </View>

      {item.loanType && (
        <View style={styles.loanTypeTag}>
          <Text style={styles.loanTypeText}>{item.loanType.name}</Text>
        </View>
      )}

      {/* Guarantor Status Section */}
      {item.loanType?.requiresGuarantor && (
        <View style={[styles.guarantorSection, !guarantorStatus.canApprove && styles.guarantorSectionWarning]}>
          <Text style={styles.guarantorLabel}>Guarantor Approvals:</Text>
          <Text style={[styles.guarantorStatus, !guarantorStatus.canApprove && styles.guarantorStatusWarning]}>
            {guarantorStatus.approvedCount} / {guarantorStatus.requiredCount} approved
          </Text>
          {!guarantorStatus.canApprove && (
            <Text style={styles.guarantorMessage}>⚠️ {guarantorStatus.message}</Text>
          )}
        </View>
      )}

      <View style={styles.loanDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Amount Requested</Text>
          <Text style={styles.detailValue}>{formatCurrency(item.amount)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Duration</Text>
          <Text style={styles.detailValue}>{item.duration} months</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Interest Rate</Text>
          <Text style={styles.detailValue}>{item.interestRate}%</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Monthly Repayment</Text>
          <Text style={styles.detailValueHighlight}>
            {formatCurrency(item.monthlyRepayment)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Total Repayment</Text>
          <Text style={styles.detailValue}>{formatCurrency(item.totalRepayment)}</Text>
        </View>
      </View>

      <View style={styles.purposeSection}>
        <Text style={styles.purposeLabel}>Purpose</Text>
        <Text style={styles.purposeText}>{item.purpose}</Text>
      </View>

      {/* Rejection vote tally (only on pending loans that have at least 1 rejection vote) */}
      {!isConditionallyApproved && rejectionVotes > 0 && (
        <View style={styles.rejectionVoteSection}>
          <Text style={styles.rejectionVoteLabel}>Rejection Votes:</Text>
          <Text style={styles.rejectionVoteCount}>{rejectionVotes} vote(s) to reject</Text>
        </View>
      )}

      {/* Approval vote tally (multi-approval loans) */}
      {!isConditionallyApproved && item.loanType?.requiresMultipleApprovals && (
        <View style={styles.approvalVoteSection}>
          <Text style={styles.approvalVoteLabel}>Approval Progress:</Text>
          <Text style={styles.approvalVoteCount}>
            {item.approvals?.filter(a => a.decision === 'approved').length ?? 0} / {item.loanType.minApprovers} approvals
          </Text>
        </View>
      )}

      <View style={styles.actionButtons}>
        {isConditionallyApproved ? (
          isFinalApprover ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.finalApproveButton]}
              onPress={() => openFinalApproveModal(item)}
            >
              <Text style={styles.finalApproveButtonText}>Final Approve</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.awaitingFinalApproverText}>
              Awaiting final approver sign-off
            </Text>
          )
        ) : (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => openRejectModal(item)}
            >
              <Text style={styles.rejectButtonText}>Vote to Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.approveButton,
                !guarantorStatus.canApprove && styles.approveButtonDisabled,
              ]}
              onPress={() => {
                if (guarantorStatus.canApprove) {
                  openApproveModal(item);
                } else {
                  Alert.alert(
                    'Cannot Approve',
                    `This loan requires at least ${guarantorStatus.requiredCount} guarantor approval(s). Currently ${guarantorStatus.approvedCount} approved.`,
                    [{ text: 'OK' }]
                  );
                }
              }}
              disabled={!guarantorStatus.canApprove}
            >
              <Text style={[
                styles.approveButtonText,
                !guarantorStatus.canApprove && styles.approveButtonTextDisabled,
              ]}>
                Approve
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </Card>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={pendingLoans}
        renderItem={renderLoanCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Pending Loans</Text>
            <Text style={styles.emptyText}>
              All loan requests have been processed. Check back later for new requests.
            </Text>
          </View>
        }
        ListHeaderComponent={
          pendingLoans.length > 0 ? (
            <Text style={styles.headerText}>
              {pendingLoans.length} loan request{pendingLoans.length !== 1 ? 's' : ''} pending review
            </Text>
          ) : null
        }
      />

      {/* Approve Modal */}
      <Modal
        visible={approveModalVisible}
        onClose={() => {
          setApproveModalVisible(false);
          setSelectedLoan(null);
        }}
        title="Approve Loan"
      >
        {selectedLoan && (
          <View>
            <Text style={styles.modalSubtitle}>
              Approving loan of {formatCurrency(selectedLoan.amount)} for{' '}
              {getMemberName(selectedLoan)}
            </Text>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Deduction Start Date *</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  {deductionStartDate.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={deductionStartDate}
                  mode="date"
                  onChange={(event, date) => {
                    setShowDatePicker(false);
                    if (date) setDeductionStartDate(date);
                  }}
                />
              )}
              <Text style={styles.modalHint}>
                When should loan repayment deductions begin?
              </Text>
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Notes (Optional)</Text>
              <TextInput
                style={styles.modalInput}
                value={approvalNotes}
                onChangeText={setApprovalNotes}
                placeholder="Add any notes for this approval..."
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => {
                  setApproveModalVisible(false);
                  setSelectedLoan(null);
                }}
              />
              <Button
                title="Approve Loan"
                variant="primary"
                onPress={handleApprove}
              />
            </View>
          </View>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal
        visible={rejectModalVisible}
        onClose={() => {
          setRejectModalVisible(false);
          setSelectedLoan(null);
        }}
        title="Reject Loan"
      >
        {selectedLoan && (
          <View>
            <Text style={styles.modalSubtitle}>
              Rejecting loan request of {formatCurrency(selectedLoan.amount)} from{' '}
              {getMemberName(selectedLoan)}
            </Text>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Reason for Rejection *</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea]}
                value={rejectionReason}
                onChangeText={setRejectionReason}
                placeholder="Please provide a reason for rejection..."
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => {
                  setRejectModalVisible(false);
                  setSelectedLoan(null);
                }}
              />
              <Button
                title="Vote to Reject"
                variant="danger"
                onPress={handleReject}
              />
            </View>
          </View>
        )}
      </Modal>

      {/* Final Approve Modal */}
      <Modal
        visible={finalApproveModalVisible}
        onClose={() => {
          setFinalApproveModalVisible(false);
          setSelectedLoan(null);
        }}
        title="Final Approval"
      >
        {selectedLoan && (
          <View>
            <Text style={styles.modalSubtitle}>
              Final approval for loan of {formatCurrency(selectedLoan.amount)} from{' '}
              {getMemberName(selectedLoan)}
            </Text>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Adjusted Amount (Optional)</Text>
              <TextInput
                style={styles.modalInput}
                value={finalAdjustedAmount}
                onChangeText={setFinalAdjustedAmount}
                placeholder={`Leave blank to approve ₦${selectedLoan.amount.toLocaleString()} as-is`}
                keyboardType="numeric"
              />
              <Text style={styles.modalHint}>
                If you enter an amount, the member will be asked to accept or reject the counter-offer.
              </Text>
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Deduction Start Date</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowFinalDatePicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  {finalDeductionDate.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
              {showFinalDatePicker && (
                <DateTimePicker
                  value={finalDeductionDate}
                  mode="date"
                  onChange={(event, date) => {
                    setShowFinalDatePicker(false);
                    if (date) setFinalDeductionDate(date);
                  }}
                />
              )}
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Notes (Optional)</Text>
              <TextInput
                style={styles.modalInput}
                value={finalNotes}
                onChangeText={setFinalNotes}
                placeholder="Add notes for this final approval..."
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => {
                  setFinalApproveModalVisible(false);
                  setSelectedLoan(null);
                }}
              />
              <Button
                title={finalAdjustedAmount.trim() ? 'Send Counter-Offer' : 'Approve Loan'}
                variant="primary"
                onPress={handleFinalApprove}
              />
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  listContent: {
    padding: 16,
  },
  headerText: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  loanCard: {
    marginBottom: 16,
    padding: 16,
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
    color: '#0f172a',
  },
  requestDate: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  loanTypeTag: {
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  loanTypeText: {
    fontSize: 12,
    color: '#0ea5e9',
    fontWeight: '500',
  },
  loanDetails: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  detailValue: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '500',
  },
  detailValueHighlight: {
    fontSize: 13,
    color: '#8b5cf6',
    fontWeight: '600',
  },
  purposeSection: {
    marginBottom: 16,
  },
  purposeLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  purposeText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  actionButtons: {
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
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  rejectButtonText: {
    color: '#dc2626',
    fontWeight: '600',
  },
  approveButton: {
    backgroundColor: '#22c55e',
  },
  approveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  approveButtonDisabled: {
    backgroundColor: '#cbd5e1',
    opacity: 0.6,
  },
  approveButtonTextDisabled: {
    color: '#64748b',
  },
  finalApproveButton: {
    flex: 1,
    backgroundColor: '#7c3aed',
  },
  finalApproveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  awaitingFinalApproverText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    color: '#64748b',
    fontStyle: 'italic',
    paddingVertical: 12,
  },
  rejectionVoteSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fef2f2',
    borderLeftWidth: 3,
    borderLeftColor: '#ef4444',
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
  },
  rejectionVoteLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#b91c1c',
  },
  rejectionVoteCount: {
    fontSize: 12,
    color: '#991b1b',
    fontWeight: '700',
  },
  approvalVoteSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f0fdf4',
    borderLeftWidth: 3,
    borderLeftColor: '#22c55e',
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
  },
  approvalVoteLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
  },
  approvalVoteCount: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '700',
  },
  // Guarantor section styles
  guarantorSection: {
    backgroundColor: '#f0fdf4',
    borderLeftWidth: 3,
    borderLeftColor: '#22c55e',
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
  },
  guarantorSectionWarning: {
    backgroundColor: '#fef3c7',
    borderLeftColor: '#f59e0b',
  },
  guarantorLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
    marginBottom: 4,
  },
  guarantorStatus: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16a34a',
  },
  guarantorStatusWarning: {
    color: '#d97706',
  },
  guarantorMessage: {
    fontSize: 12,
    color: '#92400e',
    marginTop: 4,
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    maxWidth: 280,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 20,
  },
  modalField: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  modalHint: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  dateButton: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#0f172a',
  },
  modalInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
});

export default LoanApprovalListScreen;
