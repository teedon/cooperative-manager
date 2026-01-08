import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Linking,
  Image,
  Dimensions,
} from 'react-native';
import Pdf from 'react-native-pdf';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchLoan, fetchRepaymentSchedule, recordRepayment, disburseLoan, reviewLoan } from '../../store/slices/loanSlice';
import { formatCurrency, formatDate } from '../../utils';
import Icon from '../../components/common/Icon';
import { usePermissions } from '../../hooks/usePermissions';
import { getErrorMessage } from '../../utils/errorHandler';
import { loanApi } from '../../api/loanApi';

type Props = NativeStackScreenProps<HomeStackParamList, 'LoanDetail'>;

const LoanDetailScreen: React.FC<Props> = ({ route }) => {
  const { loanId } = route.params;
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const [refreshing, setRefreshing] = React.useState(false);
  const [showRepaymentModal, setShowRepaymentModal] = useState(false);
  const [repaymentAmount, setRepaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDisbursing, setIsDisbursing] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [documentSignedUrl, setDocumentSignedUrl] = useState<string>('');
  const [loadingSignedUrl, setLoadingSignedUrl] = useState(false);

  const { currentLoan, repaymentSchedule, isLoading } = useAppSelector((state) => state.loan);
  const { user } = useAppSelector((state) => state.auth);
  
  // Get permissions - use cooperativeId from the loaded loan
  const { canApproveLoans, isAdminOrModerator } = usePermissions(currentLoan?.cooperativeId);
  
  // Check if the current user is the loan owner
  const isLoanOwner = currentLoan?.member?.userId === user?.id;
  
  // Check if user can record repayment (admin/moderator or loan owner)
  const canRecordRepayment = (isAdminOrModerator || isLoanOwner) && 
    ['disbursed', 'repaying'].includes(currentLoan?.status || '');
  
  // Check if user can disburse the loan (only admins/moderators for approved loans)
  // Also verify that multi-approval requirements are met if applicable
  const hasMetApprovalRequirements = currentLoan?.loanType?.requiresMultipleApprovals
    ? (currentLoan?.approvals?.length || 0) >= (currentLoan?.loanType?.minApprovers || 2)
    : true;
  const canDisburseLoan = isAdminOrModerator && currentLoan?.status === 'approved' && hasMetApprovalRequirements;
  
  // Check if user can approve/reject pending loans
  const canApprovePendingLoan = canApproveLoans && currentLoan?.status === 'pending';

  const paymentMethods = ['bank_transfer', 'cash', 'mobile_money', 'debit_card', 'check'];

  const openDocument = async (doc: any) => {
    console.log('=== OPENING DOCUMENT ===');
    console.log('Document:', doc);
    console.log('Document URL:', doc?.documentUrl);
    console.log('File Name:', doc?.fileName);
    console.log('MIME Type:', doc?.mimeType);
    
    setSelectedDocument(doc);
    setShowDocumentModal(true);
    setLoadingSignedUrl(true);
    
    try {
      // Fetch signed URL for secure access
      const signedUrl = await loanApi.getDocumentSignedUrl(doc.id);
      console.log('Signed URL obtained:', signedUrl);
      setDocumentSignedUrl(signedUrl);
    } catch (error) {
      console.error('Failed to get signed URL:', error);
      Alert.alert('Error', 'Failed to load document. Please try again.');
      closeDocumentModal();
    } finally {
      setLoadingSignedUrl(false);
    }
  };

  const closeDocumentModal = () => {
    setShowDocumentModal(false);
    setSelectedDocument(null);
    setDocumentSignedUrl('');
  };

  const isImageFile = (url: string) => {
    const isImage = /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(url);
    console.log('Is Image File?', url, isImage);
    return isImage;
  };

  const isPdfFile = (url: string) => {
    const isPdf = /\.pdf$/i.test(url) || url.includes('pdf');
    console.log('Is PDF File?', url, isPdf);
    return isPdf;
  };

  const handleRecordRepayment = async () => {
    if (!repaymentAmount || parseFloat(repaymentAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    if (!paymentMethod) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await dispatch(recordRepayment({
        loanId,
        amount: parseFloat(repaymentAmount),
        paymentMethod,
        paymentReference: paymentReference || undefined,
        notes: notes || undefined,
      })).unwrap();
      
      const successMessage = isAdminOrModerator 
        ? 'Repayment recorded successfully'
        : 'Payment notification submitted successfully. Awaiting admin approval.';
      
      Alert.alert('Success', successMessage);
      setShowRepaymentModal(false);
      setRepaymentAmount('');
      setPaymentMethod('');
      setPaymentReference('');
      setNotes('');
      loadData(); // Refresh data
    } catch (error: any) {
      Alert.alert('Error', getErrorMessage(error, 'Failed to record repayment'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const openRepaymentModal = () => {
    // Pre-fill with next payment amount if available
    const nextPayment = repaymentSchedule.find(r => r.status === 'pending' || r.status === 'overdue');
    if (nextPayment) {
      const remaining = nextPayment.totalAmount - (nextPayment.paidAmount || 0);
      setRepaymentAmount(remaining.toString());
    }
    setShowRepaymentModal(true);
  };

  const handleDisburseLoan = () => {
    Alert.alert(
      'Disburse Loan',
      `Are you sure you want to disburse ${formatCurrency(currentLoan?.amount || 0)} to ${currentLoan?.member?.user?.firstName || 'this member'}?\n\nThis action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disburse',
          style: 'default',
          onPress: async () => {
            setIsDisbursing(true);
            try {
              await dispatch(disburseLoan(loanId)).unwrap();
              Alert.alert('Success', 'Loan has been disbursed successfully. The member can now start making repayments.');
              loadData();
            } catch (error: any) {
              Alert.alert('Error', getErrorMessage(error, 'Failed to disburse loan'));
            } finally {
              setIsDisbursing(false);
            }
          },
        },
      ]
    );
  };

  const handleApproveLoan = () => {
    // Check guarantor requirements
    if (currentLoan?.loanType?.requiresGuarantor) {
      const minGuarantors = currentLoan.loanType.minGuarantors || 1;
      const approvedGuarantors = currentLoan.guarantors?.filter(g => g.status === 'approved').length || 0;
      
      if (approvedGuarantors < minGuarantors) {
        Alert.alert(
          'Cannot Approve',
          `This loan requires at least ${minGuarantors} guarantor approval(s). Currently ${approvedGuarantors} approved.`,
          [{ text: 'OK' }]
        );
        return;
      }
    }

    Alert.alert(
      'Approve Loan',
      `Are you sure you want to approve this ${formatCurrency(currentLoan?.amount || 0)} loan request?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            setIsReviewing(true);
            try {
              await dispatch(reviewLoan({ loanId, approved: true })).unwrap();
              
              // Reload loan data to get updated approvals
              await loadData();
              
              // Check if more approvals are needed
              const requiresMultiple = currentLoan?.loanType?.requiresMultipleApprovals;
              const minApprovers = currentLoan?.loanType?.minApprovers || 2;
              const currentApprovals = (currentLoan?.approvals?.length || 0) + 1;
              
              if (requiresMultiple && currentApprovals < minApprovers) {
                const remaining = minApprovers - currentApprovals;
                Alert.alert(
                  'Approval Added', 
                  `Your approval has been recorded. ${remaining} more approval(s) needed before disbursement.`
                );
              } else {
                Alert.alert('Success', 'Loan has been approved successfully.');
              }
            } catch (error: any) {
              Alert.alert('Error', getErrorMessage(error, 'Failed to approve loan'));
            } finally {
              setIsReviewing(false);
            }
          },
        },
      ]
    );
  };

  const handleRejectLoan = () => {
    setShowRejectModal(true);
  };

  const confirmRejectLoan = async () => {
    if (!rejectionReason || rejectionReason.trim() === '') {
      Alert.alert('Error', 'Please provide a rejection reason');
      return;
    }
    setIsReviewing(true);
    try {
      await dispatch(reviewLoan({ loanId, approved: false, reason: rejectionReason })).unwrap();
      Alert.alert('Success', 'Loan has been rejected.');
      setShowRejectModal(false);
      setRejectionReason('');
      loadData();
    } catch (error: any) {
      Alert.alert('Error', getErrorMessage(error, 'Failed to reject loan'));
    } finally {
      setIsReviewing(false);
    }
  };

  const loadData = useCallback(async () => {
    await Promise.all([dispatch(fetchLoan(loanId)), dispatch(fetchRepaymentSchedule(loanId))]);
  }, [dispatch, loanId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Debug logging
  useEffect(() => {
    if (currentLoan) {
      console.log('=== LOAN DETAIL DEBUG ===');
      console.log('Loan ID:', currentLoan.id);
      console.log('Loan Type:', currentLoan.loanType);
      console.log('Requires Guarantor:', currentLoan.loanType?.requiresGuarantor);
      console.log('Min Guarantors:', currentLoan.loanType?.minGuarantors);
      console.log('Guarantors:', currentLoan.guarantors);
      console.log('Guarantors Length:', currentLoan.guarantors?.length || 0);
      console.log('Requires KYC:', currentLoan.loanType?.requiresKyc);
      console.log('KYC Document Types:', currentLoan.loanType?.kycDocumentTypes);
      console.log('KYC Documents:', currentLoan.kycDocuments);
      console.log('KYC Documents Length:', currentLoan.kycDocuments?.length || 0);
      console.log('Requires Multiple Approvals:', currentLoan.loanType?.requiresMultipleApprovals);
      console.log('Min Approvers:', currentLoan.loanType?.minApprovers);
      console.log('Approvals:', currentLoan.approvals);
      console.log('Approvals Length:', currentLoan.approvals?.length || 0);
      console.log('========================');
    }
  }, [currentLoan]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#f59e0b';
      case 'approved':
        return '#22c55e';
      case 'rejected':
        return '#ef4444';
      case 'disbursed':
      case 'repaying':
        return '#0ea5e9';
      case 'completed':
        return '#6366f1';
      default:
        return '#64748b';
    }
  };

  if (isLoading && !currentLoan) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  if (!currentLoan) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Loan not found</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <View style={styles.amountSection}>
          <Text style={styles.amountLabel}>Loan Amount</Text>
          <Text style={styles.amountValue}>{formatCurrency(currentLoan.amount)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(currentLoan.status) }]}>
          <Text style={styles.statusText}>{currentLoan.status}</Text>
        </View>
      </View>

      {currentLoan.loanType && (
        <View style={styles.loanTypeTag}>
          <Text style={styles.loanTypeText}>{currentLoan.loanType.name}</Text>
        </View>
      )}

      {/* Guarantor Section */}
      {currentLoan.loanType?.requiresGuarantor && currentLoan.guarantors && currentLoan.guarantors.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Guarantors</Text>
          <Text style={styles.sectionHint}>
            Required: {currentLoan.loanType.minGuarantors} guarantor(s)
          </Text>
          {currentLoan.guarantors.map((guarantor, index) => {
            const guarantorName = guarantor.guarantor?.user
              ? `${guarantor.guarantor.user.firstName} ${guarantor.guarantor.user.lastName}`
              : guarantor.guarantor?.firstName
                ? `${guarantor.guarantor.firstName} ${guarantor.guarantor.lastName || ''}`
                : 'Unknown';
            
            return (
              <View key={guarantor.id} style={styles.guarantorItem}>
                <View style={styles.guarantorInfo}>
                  <Text style={styles.guarantorName}>{guarantorName}</Text>
                  {guarantor.guarantor?.memberCode && (
                    <Text style={styles.guarantorCode}>{guarantor.guarantor.memberCode}</Text>
                  )}
                </View>
                <View style={[
                  styles.guarantorStatusBadge,
                  guarantor.status === 'approved' ? styles.guarantorApproved :
                  guarantor.status === 'rejected' ? styles.guarantorRejected :
                  styles.guarantorPending
                ]}>
                  <Text style={styles.guarantorStatusText}>{guarantor.status}</Text>
                </View>
              </View>
            );
          })}
          {currentLoan.status === 'pending' && (
            <View style={[
              styles.guarantorSummary,
              currentLoan.guarantors.filter(g => g.status === 'approved').length >= (currentLoan.loanType.minGuarantors || 1)
                ? styles.guarantorSummarySuccess
                : styles.guarantorSummaryWarning
            ]}>
              <Text style={styles.guarantorSummaryText}>
                {currentLoan.guarantors.filter(g => g.status === 'approved').length} / {currentLoan.loanType.minGuarantors} approved
              </Text>
            </View>
          )}
        </View>
      )}

      {/* KYC Documents Section */}
      {currentLoan.loanType?.requiresKyc && currentLoan.kycDocuments && currentLoan.kycDocuments.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>KYC Documents</Text>
          {currentLoan.kycDocuments.map((doc) => (
            <TouchableOpacity 
              key={doc.id} 
              style={styles.kycDocItem}
              onPress={() => openDocument(doc)}
              activeOpacity={0.7}
            >
              <View style={styles.kycDocInfo}>
                <Text style={styles.kycDocType}>
                  {doc.documentType.split('_').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ')}
                </Text>
                <Text style={styles.kycDocName}>{doc.fileName}</Text>
              </View>
              <View style={styles.kycDocActions}>
                <View style={[
                  styles.kycStatusBadge,
                  doc.status === 'verified' ? styles.kycVerified :
                  doc.status === 'rejected' ? styles.kycRejected :
                  styles.kycPending
                ]}>
                  <Text style={styles.kycStatusText}>{doc.status}</Text>
                </View>
                <Icon name="eye" size={20} color="#3b82f6" style={styles.kycViewIcon} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Multiple Approvals Section */}
      {currentLoan.loanType?.requiresMultipleApprovals && currentLoan.approvals && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Approval Progress</Text>
          <Text style={styles.sectionHint}>
            Required: {currentLoan.loanType.minApprovers} approval(s)
          </Text>
          {currentLoan.approvals.length > 0 ? (
            currentLoan.approvals.map((approval) => (
              <View key={approval.id} style={styles.approvalItem}>
                <View style={styles.approvalInfo}>
                  <Text style={styles.approverName}>
                    {approval.approver?.firstName} {approval.approver?.lastName}
                  </Text>
                  <Text style={styles.approvalDate}>
                    {formatDate(approval.approvedAt)}
                  </Text>
                </View>
                <Icon name="checkmark-circle" size={24} color="#22c55e" />
              </View>
            ))
          ) : (
            <Text style={styles.noApprovalsText}>No approvals yet</Text>
          )}
          {currentLoan.status === 'pending' && (
            <View style={[
              styles.approvalSummary,
              currentLoan.approvals.length >= (currentLoan.loanType.minApprovers || 2)
                ? styles.approvalSummarySuccess
                : styles.approvalSummaryWarning
            ]}>
              <Text style={styles.approvalSummaryText}>
                {currentLoan.approvals.length} / {currentLoan.loanType.minApprovers} approved
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Pending Repayments Section (for admins) */}
      {isAdminOrModerator && currentLoan.repayments && currentLoan.repayments.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pending Repayments</Text>
          <Text style={styles.sectionHint}>
            {currentLoan.repayments.length} repayment(s) awaiting confirmation
          </Text>
          {currentLoan.repayments.map((repayment) => (
            <View key={repayment.id} style={styles.repaymentItem}>
              <View style={styles.repaymentInfo}>
                <Text style={styles.repaymentAmount}>
                  {formatCurrency(repayment.amount)}
                </Text>
                <Text style={styles.repaymentDate}>
                  Submitted {formatDate(repayment.submittedAt)}
                </Text>
                <Text style={styles.repaymentMethod}>
                  via {repayment.paymentMethod}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.viewRepaymentButton}
                onPress={() => navigation.navigate('PendingRepayments', { cooperativeId: currentLoan.cooperativeId })}
              >
                <Text style={styles.viewRepaymentText}>Review</Text>
                <Icon name="chevron-forward" size={16} color="#3b82f6" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Loan Details</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Purpose</Text>
          <Text style={styles.detailValue}>{currentLoan.purpose}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Duration</Text>
          <Text style={styles.detailValue}>{currentLoan.duration} months</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Interest Rate</Text>
          <Text style={styles.detailValue}>
            {currentLoan.interestRate}%
            {currentLoan.loanType?.interestType === 'reducing_balance' ? ' (Reducing)' : ' (Flat)'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Monthly Repayment</Text>
          <Text style={styles.detailValue}>{formatCurrency(currentLoan.monthlyRepayment)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Total Repayment</Text>
          <Text style={[styles.detailValue, styles.totalValue]}>
            {formatCurrency(currentLoan.totalRepayment)}
          </Text>
        </View>
        {currentLoan.deductionStartDate && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Deductions Start</Text>
            <Text style={styles.detailValue}>{formatDate(currentLoan.deductionStartDate)}</Text>
          </View>
        )}
        {currentLoan.deductionStartDate && currentLoan.duration && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Expected End Date</Text>
            <Text style={styles.detailValue}>
              {formatDate(
                new Date(
                  new Date(currentLoan.deductionStartDate).setMonth(
                    new Date(currentLoan.deductionStartDate).getMonth() + currentLoan.duration
                  )
                ).toISOString()
              )}
            </Text>
          </View>
        )}
        {currentLoan.outstandingBalance > 0 && (
          <View style={[styles.detailRow, styles.balanceRow]}>
            <Text style={styles.balanceLabel}>Outstanding Balance</Text>
            <Text style={styles.balanceValue}>{formatCurrency(currentLoan.outstandingBalance)}</Text>
          </View>
        )}
        {currentLoan.initiatedBy === 'admin' && (
          <View style={styles.adminInitiatedTag}>
            <Text style={styles.adminInitiatedText}>Admin Initiated Loan</Text>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Timeline</Text>
        <View style={styles.timelineItem}>
          <View style={styles.timelineDot} />
          <View style={styles.timelineContent}>
            <Text style={styles.timelineTitle}>Requested</Text>
            <Text style={styles.timelineDate}>
              {new Date(currentLoan.requestedAt).toLocaleString()}
            </Text>
          </View>
        </View>
        {currentLoan.reviewedAt && (
          <View style={styles.timelineItem}>
            <View
              style={[styles.timelineDot, { backgroundColor: getStatusColor(currentLoan.status) }]}
            />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>
                {currentLoan.status === 'approved' || currentLoan.status === 'disbursed'
                  ? 'Approved'
                  : 'Reviewed'}
              </Text>
              <Text style={styles.timelineDate}>
                {new Date(currentLoan.reviewedAt).toLocaleString()}
              </Text>
            </View>
          </View>
        )}
        {currentLoan.disbursedAt && (
          <View style={styles.timelineItem}>
            <View style={[styles.timelineDot, { backgroundColor: '#0ea5e9' }]} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>Disbursed</Text>
              <Text style={styles.timelineDate}>
                {new Date(currentLoan.disbursedAt).toLocaleString()}
              </Text>
            </View>
          </View>
        )}
        {currentLoan.rejectionReason && (
          <View style={styles.rejectionCard}>
            <Text style={styles.rejectionTitle}>Rejection Reason</Text>
            <Text style={styles.rejectionText}>{currentLoan.rejectionReason}</Text>
          </View>
        )}
      </View>

      {repaymentSchedule.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Repayment Schedule</Text>
          {repaymentSchedule.map((repayment) => (
            <View key={repayment.id} style={styles.repaymentItem}>
              <View style={styles.repaymentHeader}>
                <Text style={styles.repaymentNumber}>
                  Payment {repayment.installmentNumber}
                </Text>
                <View
                  style={[
                    styles.repaymentStatus,
                    {
                      backgroundColor:
                        repayment.status === 'paid'
                          ? '#dcfce7'
                          : repayment.status === 'overdue'
                            ? '#fee2e2'
                            : repayment.status === 'partial'
                              ? '#fef3c7'
                              : '#f1f5f9',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.repaymentStatusText,
                      {
                        color:
                          repayment.status === 'paid'
                            ? '#16a34a'
                            : repayment.status === 'overdue'
                              ? '#dc2626'
                              : repayment.status === 'partial'
                                ? '#d97706'
                                : '#64748b',
                      },
                    ]}
                  >
                    {repayment.status}
                  </Text>
                </View>
              </View>
              <View style={styles.repaymentDetails}>
                <View>
                  <Text style={styles.repaymentDate}>
                    Due: {formatDate(repayment.dueDate)}
                  </Text>
                  {repayment.paidAt && (
                    <Text style={styles.repaymentPaidDate}>
                      Paid: {formatDate(repayment.paidAt)}
                    </Text>
                  )}
                </View>
                <View style={styles.repaymentAmounts}>
                  <Text style={styles.repaymentAmount}>
                    {formatCurrency(repayment.totalAmount)}
                  </Text>
                  {repayment.paidAmount > 0 && repayment.paidAmount < repayment.totalAmount && (
                    <Text style={styles.repaymentPaid}>
                      Paid: {formatCurrency(repayment.paidAmount)}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Approve/Reject Loan Buttons - for pending loans */}
      {canApprovePendingLoan && (
        <View style={styles.actionContainer}>
          <View style={styles.pendingInfo}>
            <Icon name="clock-outline" size={20} color="#f59e0b" />
            <Text style={styles.pendingInfoText}>
              This loan is pending approval. Review and make a decision.
            </Text>
          </View>
          <View style={styles.decisionButtons}>
            <TouchableOpacity 
              style={[styles.rejectButton, isReviewing && styles.buttonDisabled]} 
              onPress={handleRejectLoan}
              disabled={isReviewing}
            >
              {isReviewing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Icon name="close-circle-outline" size={20} color="#fff" />
                  <Text style={styles.rejectButtonText}>Reject</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.approveButton, isReviewing && styles.buttonDisabled]} 
              onPress={handleApproveLoan}
              disabled={isReviewing}
            >
              {isReviewing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Icon name="checkmark-circle-outline" size={20} color="#fff" />
                  <Text style={styles.approveButtonText}>Approve</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Disburse Loan Button - for approved loans */}
      {canDisburseLoan && (
        <View style={styles.actionContainer}>
          <View style={styles.disbursementInfo}>
            <Icon name="information-circle-outline" size={20} color="#0ea5e9" />
            <Text style={styles.disbursementInfoText}>
              This loan has been approved and is ready for disbursement.
            </Text>
          </View>
          <TouchableOpacity 
            style={[styles.disburseButton, isDisbursing && styles.buttonDisabled]} 
            onPress={handleDisburseLoan}
            disabled={isDisbursing}
          >
            {isDisbursing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Icon name="wallet-outline" size={20} color="#fff" />
                <Text style={styles.disburseButtonText}>Disburse Loan</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Record Repayment Button */}
      {canRecordRepayment && currentLoan.outstandingBalance > 0 && (
        <View style={styles.actionContainer}>
          <TouchableOpacity 
            style={[
              styles.recordRepaymentButton,
              !isAdminOrModerator && styles.notifyPaymentButton
            ]} 
            onPress={openRepaymentModal}
            disabled={isSubmitting}
          >
            <Icon name="cash-outline" size={20} color="#fff" />
            <Text style={styles.recordRepaymentText}>
              {isAdminOrModerator ? 'Record Repayment' : 'Notify Payment'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Repayment Modal */}
      <Modal
        visible={showRepaymentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRepaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isAdminOrModerator ? 'Record Repayment' : 'Notify Payment'}
              </Text>
              <TouchableOpacity 
                onPress={() => setShowRepaymentModal(false)}
                style={styles.closeButton}
              >
                <Icon name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.modalScrollView}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
            >
              {!isAdminOrModerator && (
                <View style={styles.notificationInfo}>
                  <Icon name="info" size={16} color="#0ea5e9" />
                  <Text style={styles.notificationInfoText}>
                    Your payment notification will be sent to admins for approval before being added to the ledger.
                  </Text>
                </View>
              )}

              <View style={styles.outstandingInfo}>
                <Text style={styles.outstandingLabel}>Outstanding Balance</Text>
                <Text style={styles.outstandingValue}>
                  {formatCurrency(currentLoan.outstandingBalance)}
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Amount *</Text>
                <TextInput
                  style={styles.input}
                  value={repaymentAmount}
                  onChangeText={setRepaymentAmount}
                  placeholder="Enter amount"
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Payment Method *</Text>
                <View style={styles.paymentMethodsContainer}>
                  {paymentMethods.map((method) => (
                    <TouchableOpacity
                      key={method}
                      style={[
                        styles.paymentMethodButton,
                        paymentMethod === method && styles.paymentMethodButtonActive,
                      ]}
                      onPress={() => setPaymentMethod(method)}
                    >
                      <Text
                        style={[
                          styles.paymentMethodText,
                          paymentMethod === method && styles.paymentMethodTextActive,
                        ]}
                      >
                        {method.replace(/_/g, ' ')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Payment Reference</Text>
                <TextInput
                  style={styles.input}
                  value={paymentReference}
                  onChangeText={setPaymentReference}
                  placeholder="e.g. Transaction ID"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Notes</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Optional notes"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowRepaymentModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                  onPress={handleRecordRepayment}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>
                      {isAdminOrModerator ? 'Record Payment' : 'Notify Payment'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Reject Loan Modal */}
      <Modal
        visible={showRejectModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowRejectModal(false);
          setRejectionReason('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reject Loan</Text>
              <TouchableOpacity 
                onPress={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                style={styles.closeButton}
              >
                <Icon name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Rejection Reason *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Please provide a reason for rejecting this loan..."
                value={rejectionReason}
                onChangeText={setRejectionReason}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.cancelButton]}
                onPress={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, styles.rejectModalButton, (isReviewing || !rejectionReason.trim()) && styles.buttonDisabled]}
                onPress={confirmRejectLoan}
                disabled={isReviewing || !rejectionReason.trim()}
              >
                {isReviewing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Reject Loan</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Document Preview Modal */}
      <Modal
        visible={showDocumentModal}
        animationType="slide"
        onRequestClose={closeDocumentModal}
      >
        <View style={styles.documentViewerContainer}>
          {/* Header */}
          <View style={styles.documentViewerHeader}>
            <TouchableOpacity onPress={closeDocumentModal} style={styles.backButton}>
              <Icon name="arrow-back" size={24} color="#1e293b" />
            </TouchableOpacity>
            <View style={styles.documentViewerHeaderInfo}>
              <Text style={styles.documentViewerTitle} numberOfLines={1}>
                {selectedDocument?.fileName || 'Document'}
              </Text>
              <Text style={styles.documentViewerSubtitle}>
                {selectedDocument?.documentType?.split('_').map((word: string) => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')}
              </Text>
            </View>
            <View style={[
              styles.documentViewerStatusBadge,
              selectedDocument?.status === 'verified' ? styles.kycVerified :
              selectedDocument?.status === 'rejected' ? styles.kycRejected :
              styles.kycPending
            ]}>
              <Text style={styles.kycStatusText}>{selectedDocument?.status}</Text>
            </View>
          </View>

          {/* Document Viewer */}
          <View style={styles.documentViewerContent}>
            {loadingSignedUrl ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0ea5e9" />
                <Text style={styles.loadingText}>Loading document...</Text>
              </View>
            ) : documentSignedUrl ? (
              <>
                {isImageFile(selectedDocument?.fileName || '') ? (
                  <ScrollView
                    contentContainerStyle={styles.imageScrollContainer}
                    maximumZoomScale={3}
                    minimumZoomScale={1}
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                  >
                    <Image
                      source={{ uri: documentSignedUrl }}
                      style={styles.documentImage}
                      resizeMode="contain"
                      onLoad={() => console.log('Image loaded successfully')}
                      onError={(error) => {
                        console.error('Image Error:', error.nativeEvent);
                        Alert.alert('Error', `Unable to load image: ${error.nativeEvent.error}`);
                      }}
                    />
                  </ScrollView>
                ) : isPdfFile(selectedDocument?.fileName || '') ? (
                  <Pdf
                    trustAllCerts={false}
                    source={{ uri: documentSignedUrl, cache: true }}
                    onLoadComplete={(numberOfPages) => {
                      console.log(`PDF loaded: ${numberOfPages} pages`);
                    }}
                    onError={(error) => {
                      console.error('PDF Error:', error);
                      Alert.alert('Error', 'Unable to load PDF document');
                    }}
                    style={styles.pdf}
                  />
                ) : (
                  <View style={styles.unsupportedFileContainer}>
                    <Icon name="document-outline" size={64} color="#94a3b8" />
                    <Text style={styles.unsupportedFileText}>
                      This file type cannot be previewed
                    </Text>
                    <TouchableOpacity
                      style={styles.openExternalButton}
                      onPress={() => {
                        Linking.openURL(documentSignedUrl).catch(() => {
                          Alert.alert('Error', 'Unable to open document');
                        });
                      }}
                    >
                      <Icon name="open-outline" size={20} color="#fff" />
                      <Text style={styles.openExternalButtonText}>Open Externally</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.unsupportedFileContainer}>
                <Icon name="alert-circle-outline" size={64} color="#ef4444" />
                <Text style={styles.unsupportedFileText}>
                  Failed to load document
                </Text>
              </View>
            )}
          </View>

          {/* Footer with details */}
          <View style={styles.documentViewerFooter}>
            <View style={styles.documentDetailRow}>
              <Text style={styles.documentDetailLabel}>Uploaded:</Text>
              <Text style={styles.documentDetailValue}>
                {formatDate(selectedDocument?.uploadedAt)}
              </Text>
            </View>
            {selectedDocument?.verifiedAt && (
              <View style={styles.documentDetailRow}>
                <Text style={styles.documentDetailLabel}>Verified:</Text>
                <Text style={styles.documentDetailValue}>
                  {formatDate(selectedDocument.verifiedAt)}
                </Text>
              </View>
            )}
            {selectedDocument?.rejectionReason && (
              <View style={styles.documentDetailRow}>
                <Text style={styles.documentDetailLabel}>Rejection Reason:</Text>
                <Text style={[styles.documentDetailValue, styles.rejectionText]}>
                  {selectedDocument.rejectionReason}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
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
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
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
    backgroundColor: '#8b5cf6',
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountSection: {},
  amountLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  amountValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  loanTypeTag: {
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  loanTypeText: {
    color: '#0ea5e9',
    fontSize: 14,
    fontWeight: '600',
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
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    maxWidth: '60%',
    textAlign: 'right',
  },
  totalValue: {
    color: '#8b5cf6',
    fontSize: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#94a3b8',
    marginRight: 12,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  timelineDate: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  rejectionCard: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  rejectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#dc2626',
    marginBottom: 4,
  },
  rejectionText: {
    fontSize: 14,
    color: '#991b1b',
  },
  repaymentItem: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  repaymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  repaymentNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  repaymentStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  repaymentStatusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  repaymentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  repaymentDate: {
    fontSize: 12,
    color: '#64748b',
  },
  repaymentPaidDate: {
    fontSize: 11,
    color: '#22c55e',
    marginTop: 2,
  },
  repaymentAmounts: {
    alignItems: 'flex-end',
  },
  repaymentAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  repaymentPaid: {
    fontSize: 11,
    color: '#22c55e',
    marginTop: 2,
  },
  balanceRow: {
    backgroundColor: '#fef3c7',
    marginHorizontal: -20,
    paddingHorizontal: 20,
    marginTop: 12,
    paddingTop: 12,
    paddingBottom: 12,
    marginBottom: -20,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#d97706',
  },
  adminInitiatedTag: {
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  adminInitiatedText: {
    fontSize: 12,
    color: '#0ea5e9',
    fontWeight: '500',
  },
  // Disbursement Styles
  disbursementInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  disbursementInfoText: {
    flex: 1,
    fontSize: 13,
    color: '#0369a1',
    lineHeight: 18,
  },
  disburseButton: {
    backgroundColor: '#0ea5e9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  disburseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  // Pending Loan Approval Styles
  pendingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  pendingInfoText: {
    flex: 1,
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
  },
  decisionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  rejectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22c55e',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  approveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  // Repayment Recording Styles
  actionContainer: {
    padding: 16,
    paddingTop: 0,
  },
  recordRepaymentButton: {
    backgroundColor: '#22c55e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  recordRepaymentText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  documentModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalScrollView: {
    flexGrow: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  closeButton: {
    padding: 4,
  },
  outstandingInfo: {
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  outstandingLabel: {
    fontSize: 14,
    color: '#92400e',
    marginBottom: 4,
  },
  outstandingValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#d97706',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#0f172a',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  paymentMethodsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  paymentMethodButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  paymentMethodButtonActive: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  paymentMethodText: {
    fontSize: 13,
    color: '#64748b',
    textTransform: 'capitalize',
  },
  paymentMethodTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  submitButton: {
    flex: 2,
    backgroundColor: '#22c55e',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  rejectModalButton: {
    backgroundColor: '#ef4444',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  notifyPaymentButton: {
    backgroundColor: '#0ea5e9', // Info blue color for members
  },
  notificationInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#e0f2fe',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  notificationInfoText: {
    flex: 1,
    fontSize: 13,
    color: '#0369a1',
    lineHeight: 18,
  },
  // New styles for guarantors, KYC, and approvals
  sectionHint: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  guarantorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  guarantorInfo: {
    flex: 1,
  },
  guarantorName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 2,
  },
  guarantorCode: {
    fontSize: 12,
    color: '#64748b',
  },
  guarantorStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  guarantorApproved: {
    backgroundColor: '#dcfce7',
  },
  guarantorRejected: {
    backgroundColor: '#fee2e2',
  },
  guarantorPending: {
    backgroundColor: '#fef3c7',
  },
  guarantorStatusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  guarantorSummary: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  guarantorSummarySuccess: {
    backgroundColor: '#dcfce7',
  },
  guarantorSummaryWarning: {
    backgroundColor: '#fef3c7',
  },
  guarantorSummaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#166534',
  },
  kycDocItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  kycDocInfo: {
    flex: 1,
  },
  kycDocActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  kycViewIcon: {
    marginLeft: 8,
  },
  kycDocType: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 2,
  },
  kycDocName: {
    fontSize: 12,
    color: '#64748b',
  },
  kycStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  kycVerified: {
    backgroundColor: '#dcfce7',
  },
  kycRejected: {
    backgroundColor: '#fee2e2',
  },
  kycPending: {
    backgroundColor: '#fef3c7',
  },
  kycStatusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  approvalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  approvalInfo: {
    flex: 1,
  },
  approverName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 2,
  },
  approvalDate: {
    fontSize: 12,
    color: '#64748b',
  },
  noApprovalsText: {
    fontSize: 14,
    color: '#94a3b8',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
  approvalSummary: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  approvalSummarySuccess: {
    backgroundColor: '#dcfce7',
  },
  approvalSummaryWarning: {
    backgroundColor: '#fef3c7',
  },
  approvalSummaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#166534',
  },
  repaymentInfo: {
    flex: 1,
  },
  repaymentMethod: {
    fontSize: 12,
    color: '#64748b',
  },
  viewRepaymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewRepaymentText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  documentModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
  },
  // Document Viewer Styles
  documentViewerContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  documentViewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  documentViewerHeaderInfo: {
    flex: 1,
    marginRight: 12,
  },
  documentViewerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  documentViewerSubtitle: {
    fontSize: 13,
    color: '#64748b',
  },
  documentViewerStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  documentViewerContent: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  imageScrollContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height - 200,
  },
  pdf: {
    flex: 1,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  unsupportedFileContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  unsupportedFileText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  openExternalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  openExternalButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  documentViewerFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  documentModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  documentModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  documentDetails: {
    marginBottom: 24,
  },
  documentDetailRow: {
    marginBottom: 16,
  },
  documentDetailLabel: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 4,
    fontWeight: '500',
  },
  documentDetailValue: {
    fontSize: 15,
    color: '#1e293b',
  },
  documentModalActions: {
    gap: 12,
  },
  documentViewButton: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  documentViewButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  documentCancelButton: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  documentCancelButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LoanDetailScreen;
