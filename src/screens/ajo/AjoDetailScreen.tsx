import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import { ajoApi } from '../../api/ajoApi';
import Icon from '../../components/common/Icon';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import { getErrorMessage } from '../../utils/errorHandler';
import { usePermissions } from '../../hooks/usePermissions';
import { Ajo, AjoMember, AjoPayment, AjoPaymentMethod } from '../../models';

type Props = NativeStackScreenProps<HomeStackParamList, 'AjoDetail'>;

type TabType = 'info' | 'members' | 'payments';

const AjoDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { ajoId } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [ajo, setAjo] = useState<Ajo | null>(null);
  const [cooperativeId, setCooperativeId] = useState<string>('');
  
  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [recordingPayment, setRecordingPayment] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<AjoPaymentMethod>('cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [respondingToInvitation, setRespondingToInvitation] = useState(false);

  const { isAdmin } = usePermissions(cooperativeId);

  useEffect(() => {
    loadAjo();
  }, []);

  const loadAjo = async () => {
    try {
      setLoading(true);
      const data = await ajoApi.getOne(ajoId);
      setAjo(data);
      setCooperativeId(data.cooperativeId);
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAjo();
    setRefreshing(false);
  };

  const handleRespondToInvitation = async (status: 'accepted' | 'declined') => {
    try {
      setRespondingToInvitation(true);
      await ajoApi.respondToInvitation(ajoId, status);
      Alert.alert(
        'Success',
        `You have ${status === 'accepted' ? 'accepted' : 'declined'} the invitation`,
        [{ text: 'OK', onPress: () => loadAjo() }]
      );
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error));
    } finally {
      setRespondingToInvitation(false);
    }
  };

  const getMyMembership = (): AjoMember | null => {
    if (!ajo?.members) return null;
    // The API returns only the current user's membership in the members array
    return ajo.members.length > 0 ? ajo.members[0] : null;
  };

  const openPaymentModal = (memberId?: string) => {
    if (memberId) {
      setSelectedMemberId(memberId);
    }
    setPaymentAmount('');
    setPaymentMethod('cash');
    setReferenceNumber('');
    setShowPaymentModal(true);
  };

  const handleRecordPayment = async () => {
    if (!selectedMemberId) {
      Alert.alert('Validation Error', 'Please select a member');
      return;
    }

    const parsedAmount = parseFloat(paymentAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid amount');
      return;
    }

    if (paymentMethod !== 'cash' && !referenceNumber.trim()) {
      Alert.alert('Validation Error', 'Please enter a reference number for non-cash payments');
      return;
    }

    try {
      setRecordingPayment(true);
      await ajoApi.recordPayment(ajoId, {
        memberId: selectedMemberId,
        amount: parsedAmount,
        paymentMethod,
        referenceNumber: referenceNumber.trim() || undefined,
      });
      
      Alert.alert('Success', 'Payment recorded successfully');
      setShowPaymentModal(false);
      await loadAjo();
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error));
    } finally {
      setRecordingPayment(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return colors.success.main;
      case 'completed': return colors.info.main;
      case 'cancelled': return colors.error.main;
      default: return colors.text.secondary;
    }
  };

  const getMemberStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return colors.success.main;
      case 'pending': return colors.warning.main;
      case 'declined': return colors.error.main;
      default: return colors.text.secondary;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const renderInfo = () => {
    if (!ajo) return null;

    const myMembership = getMyMembership();

    return (
      <View style={styles.tabContent}>
        {/* Show invitation response buttons if user has pending invitation */}
        {myMembership && myMembership.status === 'pending' && (
          <View style={styles.invitationCard}>
            <View style={styles.invitationHeader}>
              <Icon name="mail" size={24} color={colors.warning.main} />
              <Text style={styles.invitationTitle}>Pending Invitation</Text>
            </View>
            <Text style={styles.invitationText}>
              You have been invited to join this Ajo. Please accept or decline to continue.
            </Text>
            <View style={styles.invitationButtons}>
              <TouchableOpacity
                style={[styles.invitationButton, styles.declineButton]}
                onPress={() => handleRespondToInvitation('declined')}
                disabled={respondingToInvitation}
              >
                {respondingToInvitation ? (
                  <ActivityIndicator size="small" color={colors.error.main} />
                ) : (
                  <>
                    <Icon name="close-circle" size={20} color={colors.error.main} />
                    <Text style={styles.declineButtonText}>Decline</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.invitationButton, styles.acceptButton]}
                onPress={() => handleRespondToInvitation('accepted')}
                disabled={respondingToInvitation}
              >
                {respondingToInvitation ? (
                  <ActivityIndicator size="small" color={colors.primary.contrast} />
                ) : (
                  <>
                    <Icon name="checkmark-circle" size={20} color={colors.primary.contrast} />
                    <Text style={styles.acceptButtonText}>Accept</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Title</Text>
          <Text style={styles.infoValue}>{ajo.title}</Text>
        </View>

        {ajo.description && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Description</Text>
            <Text style={styles.infoValue}>{ajo.description}</Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Amount per Payment</Text>
          <Text style={styles.infoValue}>{formatCurrency(ajo.amount)}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Frequency</Text>
          <Text style={styles.infoValue}>
            {ajo.frequency.charAt(0).toUpperCase() + ajo.frequency.slice(1)}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Status</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ajo.status) }]}>
            <Text style={styles.statusText}>
              {ajo.status.charAt(0).toUpperCase() + ajo.status.slice(1)}
            </Text>
          </View>
        </View>

        {ajo.isContinuous ? (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Duration</Text>
            <Text style={styles.infoValue}>Continuous (No end date)</Text>
          </View>
        ) : (
          <>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Start Date</Text>
              <Text style={styles.infoValue}>{formatDate(ajo.startDate!)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>End Date</Text>
              <Text style={styles.infoValue}>{formatDate(ajo.endDate!)}</Text>
            </View>
          </>
        )}

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Created</Text>
          <Text style={styles.infoValue}>{formatDate(ajo.createdAt)}</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Icon name="people" size={24} color={colors.primary.main} />
            <Text style={styles.statValue}>{ajo.members?.length || 0}</Text>
            <Text style={styles.statLabel}>Members</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="cash" size={24} color={colors.success.main} />
            <Text style={styles.statValue}>{ajo.payments?.length || 0}</Text>
            <Text style={styles.statLabel}>Payments</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderMembers = () => {
    if (!ajo?.members) return null;

    return (
      <View style={styles.tabContent}>
        {ajo.members.map((member: AjoMember) => {
          const memberName = member.member?.user 
            ? `${member.member.user.firstName} ${member.member.user.lastName}` 
            : `${member.member?.firstName || ''} ${member.member?.lastName || ''}`.trim() || 'Unknown';
          const memberEmail = member.member?.user?.email || member.member?.email || '';
          
          return (
          <View key={member.id} style={styles.memberCard}>
            <View style={styles.memberHeader}>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{memberName}</Text>
                <Text style={styles.memberEmail}>{memberEmail}</Text>
              </View>
              <View style={[
                styles.memberStatusBadge,
                { backgroundColor: getMemberStatusColor(member.status) }
              ]}>
                <Text style={styles.memberStatusText}>
                  {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                </Text>
              </View>
            </View>

            <View style={styles.memberStats}>
              <View style={styles.memberStat}>
                <Text style={styles.memberStatLabel}>Total Paid</Text>
                <Text style={styles.memberStatValue}>{formatCurrency(member.totalPaid)}</Text>
              </View>
              <View style={styles.memberActions}>
                {isAdmin && member.status === 'accepted' && (
                  <TouchableOpacity
                    style={styles.recordPaymentButton}
                    onPress={() => openPaymentModal(member.memberId)}
                  >
                    <Icon name="add-circle" size={16} color={colors.primary.main} />
                    <Text style={styles.recordPaymentText}>Record Payment</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.statementButton}
                  onPress={() => navigation.navigate('AjoStatement', { 
                    ajoId, 
                    memberId: member.memberId 
                  })}
                >
                  <Icon name="document-text" size={16} color={colors.primary.main} />
                  <Text style={styles.statementText}>Statement</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          );
        })}
      </View>
    );
  };

  const renderPayments = () => {
    if (!ajo?.payments) return null;

    const sortedPayments = [...ajo.payments].sort(
      (a: AjoPayment, b: AjoPayment) => 
        new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
    );

    return (
      <View style={styles.tabContent}>
        {sortedPayments.map((payment: AjoPayment) => {
          const member = ajo.members?.find((m: AjoMember) => m.memberId === payment.memberId);
          const memberName = member?.member?.user 
            ? `${member.member.user.firstName} ${member.member.user.lastName}` 
            : `${member?.member?.firstName || ''} ${member?.member?.lastName || ''}`.trim() || 'Unknown';
          
          return (
          <View key={payment.id} style={styles.paymentCard}>
            <View style={styles.paymentHeader}>
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentMember}>
                  {memberName}
                </Text>
                <Text style={styles.paymentDate}>{formatDate(payment.paymentDate)}</Text>
              </View>
              <Text style={styles.paymentAmount}>{formatCurrency(payment.amount)}</Text>
            </View>
            <View style={styles.paymentDetails}>
              <View style={styles.paymentMethod}>
                <Icon 
                  name={payment.paymentMethod === 'cash' ? 'cash' : payment.paymentMethod === 'transfer' ? 'card' : 'wallet'} 
                  size={16} 
                  color={colors.text.secondary} 
                />
                <Text style={styles.paymentMethodText}>
                  {payment.paymentMethod.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </Text>
              </View>
              {payment.referenceNumber && (
                <Text style={styles.paymentRef}>Ref: {payment.referenceNumber}</Text>
              )}
            </View>
          </View>
          );
        })}

        {sortedPayments.length === 0 && (
          <View style={styles.emptyState}>
            <Icon name="wallet" size={48} color={colors.text.secondary} />
            <Text style={styles.emptyText}>No payments recorded yet</Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.main} />
      </View>
    );
  }

  if (!ajo) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle" size={48} color={colors.error.main} />
        <Text style={styles.errorText}>Ajo plan not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'info' && styles.tabActive]}
          onPress={() => setActiveTab('info')}
        >
          <Icon 
            name="information-circle" 
            size={20} 
            color={activeTab === 'info' ? colors.primary.main : colors.text.secondary} 
          />
          <Text style={[styles.tabText, activeTab === 'info' && styles.tabTextActive]}>
            Info
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'members' && styles.tabActive]}
          onPress={() => setActiveTab('members')}
        >
          <Icon 
            name="people" 
            size={20} 
            color={activeTab === 'members' ? colors.primary.main : colors.text.secondary} 
          />
          <Text style={[styles.tabText, activeTab === 'members' && styles.tabTextActive]}>
            Members
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'payments' && styles.tabActive]}
          onPress={() => setActiveTab('payments')}
        >
          <Icon 
            name="cash" 
            size={20} 
            color={activeTab === 'payments' ? colors.primary.main : colors.text.secondary} 
          />
          <Text style={[styles.tabText, activeTab === 'payments' && styles.tabTextActive]}>
            Payments
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'info' && renderInfo()}
        {activeTab === 'members' && renderMembers()}
        {activeTab === 'payments' && renderPayments()}
      </ScrollView>

      {isAdmin && activeTab === 'members' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => openPaymentModal()}
        >
          <Icon name="add" size={24} color={colors.primary.contrast} />
        </TouchableOpacity>
      )}

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record Payment</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Icon name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.modalFormGroup}>
                <Text style={styles.modalLabel}>Member *</Text>
                <View style={styles.memberSelect}>
                  {ajo.members?.filter((m: AjoMember) => m.status === 'accepted').map((member: AjoMember) => {
                    const memberName = member.member?.user 
                      ? `${member.member.user.firstName} ${member.member.user.lastName}` 
                      : `${member.member?.firstName || ''} ${member.member?.lastName || ''}`.trim() || 'Unknown';
                    
                    return (
                    <TouchableOpacity
                      key={member.id}
                      style={[
                        styles.memberOption,
                        selectedMemberId === member.memberId && styles.memberOptionSelected,
                      ]}
                      onPress={() => setSelectedMemberId(member.memberId)}
                      disabled={recordingPayment}
                    >
                      <View style={[
                        styles.memberRadio,
                        selectedMemberId === member.memberId && styles.memberRadioSelected,
                      ]} />
                      <Text style={styles.memberOptionText}>{memberName}</Text>
                    </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.modalFormGroup}>
                <Text style={styles.modalLabel}>Amount *</Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputPrefix}>₦</Text>
                  <TextInput
                    style={[styles.input, styles.inputWithPrefix]}
                    value={paymentAmount}
                    onChangeText={setPaymentAmount}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    editable={!recordingPayment}
                  />
                </View>
              </View>

              <View style={styles.modalFormGroup}>
                <Text style={styles.modalLabel}>Payment Method *</Text>
                <View style={styles.paymentMethodContainer}>
                  {(['cash', 'transfer', 'wallet'] as AjoPaymentMethod[]).map((method) => (
                    <TouchableOpacity
                      key={method}
                      style={[
                        styles.paymentMethodButton,
                        paymentMethod === method && styles.paymentMethodButtonActive,
                      ]}
                      onPress={() => setPaymentMethod(method)}
                      disabled={recordingPayment}
                    >
                      <Text
                        style={[
                          styles.paymentMethodButtonText,
                          paymentMethod === method && styles.paymentMethodButtonTextActive,
                        ]}
                      >
                        {method.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {paymentMethod !== 'cash' && (
                <View style={styles.modalFormGroup}>
                  <Text style={styles.modalLabel}>Reference Number *</Text>
                  <TextInput
                    style={styles.input}
                    value={referenceNumber}
                    onChangeText={setReferenceNumber}
                    placeholder="Enter reference/transaction number"
                    editable={!recordingPayment}
                  />
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowPaymentModal(false)}
                disabled={recordingPayment}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveButton, recordingPayment && styles.modalSaveButtonDisabled]}
                onPress={handleRecordPayment}
                disabled={recordingPayment}
              >
                {recordingPayment ? (
                  <ActivityIndicator size="small" color={colors.primary.contrast} />
                ) : (
                  <Text style={styles.modalSaveText}>Record Payment</Text>
                )}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.main,
    ...shadows.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary.main,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  tabTextActive: {
    color: colors.primary.main,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: spacing.lg,
  },
  invitationCard: {
    backgroundColor: colors.warning.light,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.warning.main,
  },
  invitationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  invitationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.warning.main,
  },
  invitationText: {
    fontSize: 14,
    color: colors.text.primary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  invitationButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  invitationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
    ...shadows.sm,
  },
  acceptButton: {
    backgroundColor: colors.primary.main,
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary.contrast,
  },
  declineButton: {
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.error.main,
  },
  declineButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.error.main,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.main,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: colors.text.primary,
    flex: 1,
    textAlign: 'right',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary.contrast,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.background.paper,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: spacing.sm,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  memberCard: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  memberInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  memberEmail: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  memberStatusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  memberStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary.contrast,
  },
  memberStats: {
    borderTopWidth: 1,
    borderTopColor: colors.border.main,
    paddingTop: spacing.md,
  },
  memberStat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  memberStatLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  memberStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  memberActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  recordPaymentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primary.light,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  recordPaymentText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary.main,
  },
  statementButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  statementText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary.main,
  },
  paymentCard: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentMember: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  paymentDate: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.success.main,
  },
  paymentDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  paymentMethodText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  paymentRef: {
    fontSize: 12,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.paper,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    maxHeight: '80%',
    ...shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.main,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  modalBody: {
    padding: spacing.lg,
  },
  modalFormGroup: {
    marginBottom: spacing.lg,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  memberSelect: {
    gap: spacing.sm,
  },
  memberOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.main,
  },
  memberOptionSelected: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.light,
  },
  memberRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border.main,
    marginRight: spacing.md,
  },
  memberRadioSelected: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.main,
  },
  memberOptionText: {
    fontSize: 16,
    color: colors.text.primary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.main,
    paddingHorizontal: spacing.md,
  },
  inputPrefix: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.secondary,
    marginRight: spacing.sm,
  },
  input: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.main,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.text.primary,
  },
  inputWithPrefix: {
    flex: 1,
    borderWidth: 0,
    paddingHorizontal: 0,
  },
  paymentMethodContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  paymentMethodButton: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.main,
    backgroundColor: colors.background.default,
    alignItems: 'center',
  },
  paymentMethodButtonActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  paymentMethodButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  paymentMethodButtonTextActive: {
    color: colors.primary.contrast,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.main,
    gap: spacing.md,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.default,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  modalSaveButton: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary.main,
    alignItems: 'center',
    ...shadows.md,
  },
  modalSaveButtonDisabled: {
    opacity: 0.6,
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary.contrast,
  },
});

export default AjoDetailScreen;
