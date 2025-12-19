import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { initiateLoan, fetchLoanTypes } from '../../store/slices/loanSlice';
import { fetchMembers } from '../../store/slices/cooperativeSlice';
import { LoanType, CooperativeMember } from '../../models';
import { formatCurrency } from '../../utils';
import DateTimePicker from '@react-native-community/datetimepicker';

type Props = NativeStackScreenProps<any, 'LoanInitiate'>;

const LoanInitiateScreen: React.FC<Props> = ({ route, navigation }) => {
  const { cooperativeId } = route.params as { cooperativeId: string };
  const dispatch = useAppDispatch();
  const { loanTypes, isLoading: loanLoading } = useAppSelector((state) => state.loan);
  const { members, isLoading: membersLoading } = useAppSelector((state) => state.cooperative);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMember, setSelectedMember] = useState<CooperativeMember | null>(null);
  const [selectedLoanType, setSelectedLoanType] = useState<LoanType | null>(null);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [showMemberList, setShowMemberList] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [formData, setFormData] = useState({
    amount: '',
    purpose: '',
    duration: '6',
    deductionStartDate: new Date(),
  });

  useEffect(() => {
    dispatch(fetchLoanTypes(cooperativeId));
    dispatch(fetchMembers(cooperativeId));
  }, [cooperativeId]);

  const activeLoanTypes = useMemo(() => {
    return loanTypes.filter((lt) => lt.isActive);
  }, [loanTypes]);

  const filteredMembers = useMemo(() => {
    if (!memberSearchQuery.trim()) return members.slice(0, 10);
    const query = memberSearchQuery.toLowerCase();
    return members.filter((member) => {
      const firstName = member.user?.firstName || member.firstName || '';
      const lastName = member.user?.lastName || member.lastName || '';
      const fullName = `${firstName} ${lastName}`.toLowerCase();
      return fullName.includes(query);
    }).slice(0, 10);
  }, [members, memberSearchQuery]);

  const getMemberDisplayName = (member: CooperativeMember): string => {
    if (member.user) {
      return `${member.user.firstName} ${member.user.lastName}`;
    }
    return `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Unknown Member';
  };

  const amount = parseFloat(formData.amount || '0');
  const duration = parseInt(formData.duration || '6');
  const interestRate = selectedLoanType?.interestRate || 5;
  const interestType = selectedLoanType?.interestType || 'flat';

  const loanSummary = useMemo(() => {
    if (amount <= 0 || duration <= 0) return null;

    let totalInterest: number;
    let monthlyRepayment: number;
    let totalRepayment: number;

    if (interestType === 'flat') {
      totalInterest = amount * (interestRate / 100) * (duration / 12);
      totalRepayment = amount + totalInterest;
      monthlyRepayment = totalRepayment / duration;
    } else {
      const monthlyRate = interestRate / 100 / 12;
      if (monthlyRate === 0) {
        monthlyRepayment = amount / duration;
      } else {
        monthlyRepayment =
          (amount * monthlyRate * Math.pow(1 + monthlyRate, duration)) /
          (Math.pow(1 + monthlyRate, duration) - 1);
      }
      totalRepayment = monthlyRepayment * duration;
      totalInterest = totalRepayment - amount;
    }

    return {
      principal: amount,
      totalInterest,
      totalRepayment,
      monthlyRepayment,
    };
  }, [amount, duration, interestRate, interestType]);

  const durationOptions = useMemo(() => {
    if (selectedLoanType) {
      const options: number[] = [];
      for (
        let i = selectedLoanType.minDuration;
        i <= selectedLoanType.maxDuration;
        i += Math.max(1, Math.floor((selectedLoanType.maxDuration - selectedLoanType.minDuration) / 4))
      ) {
        options.push(i);
      }
      if (!options.includes(selectedLoanType.maxDuration)) {
        options.push(selectedLoanType.maxDuration);
      }
      return options.slice(0, 5);
    }
    return [3, 6, 12, 18, 24];
  }, [selectedLoanType]);

  const validateForm = (): boolean => {
    if (!selectedMember) {
      Alert.alert('Error', 'Please select a member');
      return false;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid loan amount');
      return false;
    }
    if (selectedLoanType) {
      const amt = parseFloat(formData.amount);
      if (amt < selectedLoanType.minAmount || amt > selectedLoanType.maxAmount) {
        Alert.alert(
          'Error',
          `Amount must be between ${formatCurrency(selectedLoanType.minAmount)} and ${formatCurrency(selectedLoanType.maxAmount)}`
        );
        return false;
      }
    }
    if (!formData.purpose.trim()) {
      Alert.alert('Error', 'Please enter a purpose for the loan');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await dispatch(
        initiateLoan({
          cooperativeId,
          data: {
            memberId: selectedMember!.id,
            loanTypeId: selectedLoanType?.id,
            amount: parseFloat(formData.amount),
            purpose: formData.purpose.trim(),
            duration: parseInt(formData.duration),
            interestRate: selectedLoanType?.interestRate,
            deductionStartDate: formData.deductionStartDate.toISOString(),
          },
        })
      ).unwrap();

      Alert.alert(
        'Success',
        `Loan of ${formatCurrency(parseFloat(formData.amount))} has been initiated for ${getMemberDisplayName(selectedMember!)}. The loan is automatically approved.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to initiate loan');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loanLoading || membersLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Initiate Loan</Text>
        <Text style={styles.headerSubtitle}>
          Create a loan for a member. Admin-initiated loans are automatically approved.
        </Text>
      </View>

      <View style={styles.form}>
        {/* Member Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Select Member *</Text>
          <TextInput
            style={styles.input}
            placeholder="Search member by name..."
            value={selectedMember ? getMemberDisplayName(selectedMember) : memberSearchQuery}
            onChangeText={(text) => {
              setMemberSearchQuery(text);
              setSelectedMember(null);
              setShowMemberList(true);
            }}
            onFocus={() => setShowMemberList(true)}
          />
          {showMemberList && filteredMembers.length > 0 && !selectedMember && (
            <View style={styles.memberList}>
              {filteredMembers.map((member) => (
                <TouchableOpacity
                  key={member.id}
                  style={styles.memberItem}
                  onPress={() => {
                    setSelectedMember(member);
                    setMemberSearchQuery('');
                    setShowMemberList(false);
                  }}
                >
                  <Text style={styles.memberName}>{getMemberDisplayName(member)}</Text>
                  <Text style={styles.memberType}>
                    {member.isOfflineMember ? 'Offline' : 'Online'} Member
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {selectedMember && (
            <View style={styles.selectedMemberCard}>
              <View style={styles.selectedMemberInfo}>
                <Text style={styles.selectedMemberName}>
                  {getMemberDisplayName(selectedMember)}
                </Text>
                <Text style={styles.selectedMemberType}>
                  {selectedMember.isOfflineMember ? 'Offline' : 'Online'} Member
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setSelectedMember(null);
                  setMemberSearchQuery('');
                }}
                style={styles.clearButton}
              >
                <Text style={styles.clearButtonText}>Change</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Loan Type Selection */}
        {activeLoanTypes.length > 0 && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Loan Type (Optional)</Text>
            <View style={styles.loanTypeGrid}>
              {activeLoanTypes.map((loanType) => (
                <TouchableOpacity
                  key={loanType.id}
                  style={[
                    styles.loanTypeCard,
                    selectedLoanType?.id === loanType.id && styles.loanTypeCardActive,
                  ]}
                  onPress={() => {
                    setSelectedLoanType(
                      selectedLoanType?.id === loanType.id ? null : loanType
                    );
                    if (loanType.id !== selectedLoanType?.id) {
                      setFormData({ ...formData, duration: String(loanType.minDuration) });
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.loanTypeName,
                      selectedLoanType?.id === loanType.id && styles.loanTypeNameActive,
                    ]}
                  >
                    {loanType.name}
                  </Text>
                  <Text
                    style={[
                      styles.loanTypeDetails,
                      selectedLoanType?.id === loanType.id && styles.loanTypeDetailsActive,
                    ]}
                  >
                    {formatCurrency(loanType.minAmount)} - {formatCurrency(loanType.maxAmount)}
                  </Text>
                  <Text
                    style={[
                      styles.loanTypeRate,
                      selectedLoanType?.id === loanType.id && styles.loanTypeRateActive,
                    ]}
                  >
                    {loanType.interestRate}% {loanType.interestType === 'flat' ? 'Flat' : 'p.a.'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Loan Amount */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Loan Amount *</Text>
          {selectedLoanType && (
            <Text style={styles.hint}>
              Range: {formatCurrency(selectedLoanType.minAmount)} -{' '}
              {formatCurrency(selectedLoanType.maxAmount)}
            </Text>
          )}
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencyPrefix}>₦</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              keyboardType="numeric"
              value={formData.amount}
              onChangeText={(text) => setFormData({ ...formData, amount: text })}
            />
          </View>
        </View>

        {/* Purpose */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Purpose *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Purpose of this loan..."
            multiline
            numberOfLines={3}
            value={formData.purpose}
            onChangeText={(text) => setFormData({ ...formData, purpose: text })}
          />
        </View>

        {/* Duration */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Repayment Duration (months) *</Text>
          {selectedLoanType && (
            <Text style={styles.hint}>
              Range: {selectedLoanType.minDuration} - {selectedLoanType.maxDuration} months
            </Text>
          )}
          <View style={styles.durationOptions}>
            {durationOptions.map((months) => (
              <TouchableOpacity
                key={months}
                style={[
                  styles.durationOption,
                  formData.duration === String(months) && styles.durationOptionActive,
                ]}
                onPress={() => setFormData({ ...formData, duration: String(months) })}
              >
                <Text
                  style={[
                    styles.durationOptionText,
                    formData.duration === String(months) && styles.durationOptionTextActive,
                  ]}
                >
                  {months}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Deduction Start Date */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Deduction Start Date *</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateButtonText}>
              {formData.deductionStartDate.toLocaleDateString()}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={formData.deductionStartDate}
              mode="date"
              minimumDate={new Date()}
              onChange={(event, date) => {
                setShowDatePicker(false);
                if (date) {
                  setFormData({ ...formData, deductionStartDate: date });
                }
              }}
            />
          )}
          <Text style={styles.hint}>When should monthly deductions begin?</Text>
        </View>

        {/* Loan Summary */}
        {loanSummary && (
          <View style={styles.calculationCard}>
            <Text style={styles.calculationTitle}>Loan Summary</Text>
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Principal Amount</Text>
              <Text style={styles.calcValue}>{formatCurrency(loanSummary.principal)}</Text>
            </View>
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Interest Rate</Text>
              <Text style={styles.calcValue}>
                {interestRate}% ({interestType === 'flat' ? 'Flat' : 'Reducing Balance'})
              </Text>
            </View>
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Duration</Text>
              <Text style={styles.calcValue}>{duration} months</Text>
            </View>
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Total Interest</Text>
              <Text style={styles.calcValue}>{formatCurrency(loanSummary.totalInterest)}</Text>
            </View>
            <View style={[styles.calcRow, styles.highlightRow]}>
              <Text style={styles.highlightLabel}>Monthly Repayment</Text>
              <Text style={styles.highlightValue}>
                {formatCurrency(loanSummary.monthlyRepayment)}
              </Text>
            </View>
            <View style={[styles.calcRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total Repayment</Text>
              <Text style={styles.totalValue}>{formatCurrency(loanSummary.totalRepayment)}</Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Initiate Loan</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          * Admin-initiated loans are automatically approved and a repayment schedule will be
          generated immediately.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748b',
  },
  header: {
    backgroundColor: '#22c55e',
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
    lineHeight: 20,
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  memberList: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
  },
  memberItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  memberName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0f172a',
  },
  memberType: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  selectedMemberCard: {
    flexDirection: 'row',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#22c55e',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    alignItems: 'center',
  },
  selectedMemberInfo: {
    flex: 1,
  },
  selectedMemberName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#15803d',
  },
  selectedMemberType: {
    fontSize: 12,
    color: '#22c55e',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearButtonText: {
    color: '#dc2626',
    fontWeight: '500',
  },
  loanTypeGrid: {
    gap: 10,
  },
  loanTypeCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
  },
  loanTypeCardActive: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  loanTypeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  loanTypeNameActive: {
    color: '#fff',
  },
  loanTypeDetails: {
    fontSize: 13,
    color: '#64748b',
  },
  loanTypeDetailsActive: {
    color: 'rgba(255,255,255,0.8)',
  },
  loanTypeRate: {
    fontSize: 12,
    color: '#22c55e',
    fontWeight: '500',
    marginTop: 4,
  },
  loanTypeRateActive: {
    color: 'rgba(255,255,255,0.9)',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingLeft: 16,
  },
  currencyPrefix: {
    fontSize: 24,
    fontWeight: '600',
    color: '#64748b',
  },
  amountInput: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 12,
    fontSize: 24,
    fontWeight: '600',
  },
  durationOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  durationOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  durationOptionActive: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  durationOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  durationOptionTextActive: {
    color: '#fff',
  },
  dateButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#0f172a',
  },
  calculationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  calculationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  calcLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  calcValue: {
    fontSize: 14,
    color: '#0f172a',
  },
  highlightRow: {
    backgroundColor: '#f0f9ff',
    marginHorizontal: -16,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  highlightLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  highlightValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0ea5e9',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    marginTop: 12,
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#22c55e',
  },
  submitButton: {
    backgroundColor: '#22c55e',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default LoanInitiateScreen;
