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
import { HomeStackParamList } from '../../navigation/MainNavigator';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { requestLoan, fetchLoanTypes } from '../../store/slices/loanSlice';
import { LoanType } from '../../models';
import { formatCurrency } from '../../utils';
import { validateRequired, validateMinLength } from '../../utils/validation';

type Props = NativeStackScreenProps<HomeStackParamList, 'LoanRequest'>;

interface LoanFormData {
  loanTypeId: string;
  amount: string;
  purpose: string;
  duration: string;
}

interface FormErrors {
  loanTypeId?: string;
  amount?: string;
  purpose?: string;
  duration?: string;
}

const LoanRequestScreen: React.FC<Props> = ({ route, navigation }) => {
  const { cooperativeId } = route.params;
  const dispatch = useAppDispatch();
  const { loanTypes, isLoading: loanTypesLoading } = useAppSelector((state) => state.loan);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<LoanFormData>({
    loanTypeId: '',
    amount: '',
    purpose: '',
    duration: '6',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    dispatch(fetchLoanTypes(cooperativeId));
  }, [cooperativeId]);

  // Filter only active loan types that require approval (member-requested)
  const availableLoanTypes = useMemo(() => {
    return loanTypes.filter((lt) => lt.isActive);
  }, [loanTypes]);

  const selectedLoanType = useMemo(() => {
    return availableLoanTypes.find((lt) => lt.id === formData.loanTypeId);
  }, [availableLoanTypes, formData.loanTypeId]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (availableLoanTypes.length > 0 && !formData.loanTypeId) {
      newErrors.loanTypeId = 'Please select a loan type';
    }

    const amountError = validateRequired(formData.amount, 'Amount');
    if (amountError) {
      newErrors.amount = amountError;
    } else if (selectedLoanType) {
      const amount = parseFloat(formData.amount);
      if (amount < selectedLoanType.minAmount) {
        newErrors.amount = `Minimum amount is ${formatCurrency(selectedLoanType.minAmount)}`;
      } else if (amount > selectedLoanType.maxAmount) {
        newErrors.amount = `Maximum amount is ${formatCurrency(selectedLoanType.maxAmount)}`;
      }
    }

    const purposeError = validateMinLength(formData.purpose, 10, 'Purpose');
    if (purposeError) newErrors.purpose = purposeError;

    const durationError = validateRequired(formData.duration, 'Duration');
    if (durationError) {
      newErrors.duration = durationError;
    } else if (selectedLoanType) {
      const duration = parseInt(formData.duration);
      if (duration < selectedLoanType.minDuration) {
        newErrors.duration = `Minimum duration is ${selectedLoanType.minDuration} months`;
      } else if (duration > selectedLoanType.maxDuration) {
        newErrors.duration = `Maximum duration is ${selectedLoanType.maxDuration} months`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const amount = parseFloat(formData.amount || '0');
  const duration = parseInt(formData.duration || '6');
  const interestRate = selectedLoanType?.interestRate || 5;
  const interestType = selectedLoanType?.interestType || 'flat';

  // Calculate loan summary based on interest type
  const loanSummary = useMemo(() => {
    if (amount <= 0 || duration <= 0) return null;

    let totalInterest: number;
    let monthlyRepayment: number;
    let totalRepayment: number;

    if (interestType === 'flat') {
      // Flat rate: interest on original principal for entire duration
      totalInterest = amount * (interestRate / 100) * (duration / 12);
      totalRepayment = amount + totalInterest;
      monthlyRepayment = totalRepayment / duration;
    } else {
      // Reducing balance (EMI calculation)
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

  const onSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await dispatch(
        requestLoan({
          cooperativeId,
          data: {
            loanTypeId: formData.loanTypeId || undefined,
            amount: Number(formData.amount),
            purpose: formData.purpose,
            duration: Number(formData.duration),
            interestRate: selectedLoanType?.interestRate,
          },
        })
      ).unwrap();

      const message = selectedLoanType?.requiresApproval
        ? 'Your loan request has been submitted and is pending admin review.'
        : 'Your loan request has been approved and will be disbursed shortly.';

      Alert.alert('Success', message, [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit loan request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectLoanType = (loanType: LoanType) => {
    setFormData({
      ...formData,
      loanTypeId: loanType.id,
      duration: String(loanType.minDuration),
    });
    setErrors({ ...errors, loanTypeId: undefined });
  };

  // Generate duration options based on selected loan type
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

  if (loanTypesLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={styles.loadingText}>Loading loan options...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Request a Loan</Text>
        <Text style={styles.headerSubtitle}>Submit your loan request for admin review</Text>
      </View>

      <View style={styles.form}>
        {/* Loan Type Selection */}
        {availableLoanTypes.length > 0 && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Select Loan Type *</Text>
            <View style={styles.loanTypeGrid}>
              {availableLoanTypes.map((loanType) => (
                <TouchableOpacity
                  key={loanType.id}
                  style={[
                    styles.loanTypeCard,
                    formData.loanTypeId === loanType.id && styles.loanTypeCardActive,
                  ]}
                  onPress={() => selectLoanType(loanType)}
                >
                  <Text
                    style={[
                      styles.loanTypeName,
                      formData.loanTypeId === loanType.id && styles.loanTypeNameActive,
                    ]}
                  >
                    {loanType.name}
                  </Text>
                  <Text
                    style={[
                      styles.loanTypeDetails,
                      formData.loanTypeId === loanType.id && styles.loanTypeDetailsActive,
                    ]}
                  >
                    {formatCurrency(loanType.minAmount)} - {formatCurrency(loanType.maxAmount)}
                  </Text>
                  <Text
                    style={[
                      styles.loanTypeRate,
                      formData.loanTypeId === loanType.id && styles.loanTypeRateActive,
                    ]}
                  >
                    {loanType.interestRate}% {loanType.interestType === 'flat' ? 'Flat' : 'p.a.'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.loanTypeId && <Text style={styles.errorText}>{errors.loanTypeId}</Text>}
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
          <View
            style={[styles.amountInputContainer, errors.amount && styles.inputContainerError]}
          >
            <Text style={styles.currencyPrefix}>₦</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              keyboardType="numeric"
              onChangeText={(text) => {
                setFormData({ ...formData, amount: text });
                setErrors({ ...errors, amount: undefined });
              }}
              value={formData.amount}
            />
          </View>
          {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}
        </View>

        {/* Purpose */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Purpose *</Text>
          <TextInput
            style={[styles.input, styles.textArea, errors.purpose && styles.inputError]}
            placeholder="Describe the purpose of this loan..."
            multiline={true}
            numberOfLines={4}
            onChangeText={(text) => {
              setFormData({ ...formData, purpose: text });
              setErrors({ ...errors, purpose: undefined });
            }}
            value={formData.purpose}
          />
          {errors.purpose && <Text style={styles.errorText}>{errors.purpose}</Text>}
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
                onPress={() => {
                  setFormData({ ...formData, duration: String(months) });
                  setErrors({ ...errors, duration: undefined });
                }}
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
          {errors.duration && <Text style={styles.errorText}>{errors.duration}</Text>}
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
          onPress={onSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Loan Request</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          * Loan requests are subject to admin approval. Interest rates and terms may vary based on
          cooperative policies.
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
    backgroundColor: '#8b5cf6',
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
  inputError: {
    borderColor: '#ef4444',
  },
  inputContainerError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
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
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
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
    color: '#8b5cf6',
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
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
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
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  durationOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  durationOptionTextActive: {
    color: '#fff',
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
    color: '#8b5cf6',
  },
  submitButton: {
    backgroundColor: '#8b5cf6',
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

export default LoanRequestScreen;
