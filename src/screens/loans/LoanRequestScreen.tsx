import React, { useState } from 'react';
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
import { useAppDispatch } from '../../store/hooks';
import { requestLoan } from '../../store/slices/loanSlice';
import { validateRequired, validateMinLength } from '../../utils/validation';

type Props = NativeStackScreenProps<HomeStackParamList, 'LoanRequest'>;

interface LoanFormData {
  amount: string;
  purpose: string;
  duration: string;
}

interface FormErrors {
  amount?: string;
  purpose?: string;
  duration?: string;
}

const LoanRequestScreen: React.FC<Props> = ({ route, navigation }) => {
  const { cooperativeId } = route.params;
  const dispatch = useAppDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<LoanFormData>({
    amount: '',
    purpose: '',
    duration: '6',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    const amountError = validateRequired(formData.amount, 'Amount');
    if (amountError) newErrors.amount = amountError;
    
    const purposeError = validateMinLength(formData.purpose, 10, 'Purpose');
    if (purposeError) newErrors.purpose = purposeError;
    
    const durationError = validateRequired(formData.duration, 'Duration');
    if (durationError) newErrors.duration = durationError;
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const amount = parseFloat(formData.amount || '0');
  const duration = parseInt(formData.duration || '6');
  const interestRate = 5; // Default 5%
  const totalRepayment = amount * (1 + interestRate / 100);
  const monthlyRepayment = duration > 0 ? totalRepayment / duration : 0;

  const onSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      await dispatch(
        requestLoan({
          cooperativeId,
          loan: {
            amount: Number(formData.amount),
            purpose: formData.purpose,
            duration: Number(formData.duration),
          },
        })
      ).unwrap();

      Alert.alert('Success', 'Your loan request has been submitted and is pending admin review.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to submit loan request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Request a Loan</Text>
        <Text style={styles.headerSubtitle}>Submit your loan request for admin review</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Loan Amount *</Text>
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencyPrefix}>$</Text>
            <TextInput
              style={[styles.amountInput, errors.amount && styles.inputError]}
              placeholder="0.00"
              keyboardType="numeric"
              onChangeText={(text) => setFormData({ ...formData, amount: text })}
              value={formData.amount}
            />
          </View>
          {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Purpose *</Text>
          <TextInput
            style={[styles.input, styles.textArea, errors.purpose && styles.inputError]}
            placeholder="Describe the purpose of this loan..."
            multiline={true}
            numberOfLines={4}
            onChangeText={(text) => setFormData({ ...formData, purpose: text })}
            value={formData.purpose}
          />
          {errors.purpose && <Text style={styles.errorText}>{errors.purpose}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Repayment Duration (months) *</Text>
          <View style={styles.durationOptions}>
            {[3, 6, 12, 18, 24].map((months) => (
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

        {amount > 0 && (
          <View style={styles.calculationCard}>
            <Text style={styles.calculationTitle}>Loan Summary</Text>
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Principal Amount</Text>
              <Text style={styles.calcValue}>${amount.toFixed(2)}</Text>
            </View>
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Interest Rate</Text>
              <Text style={styles.calcValue}>{interestRate}%</Text>
            </View>
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Duration</Text>
              <Text style={styles.calcValue}>{duration} months</Text>
            </View>
            <View style={[styles.calcRow, styles.highlightRow]}>
              <Text style={styles.highlightLabel}>Monthly Repayment</Text>
              <Text style={styles.highlightValue}>${monthlyRepayment.toFixed(2)}</Text>
            </View>
            <View style={[styles.calcRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total Repayment</Text>
              <Text style={styles.totalValue}>${totalRepayment.toFixed(2)}</Text>
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
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
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
