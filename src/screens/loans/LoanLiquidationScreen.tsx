import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import { formatCurrency } from '../../utils';
import { loanApi } from '../../api/loanApi';
import { getErrorMessage } from '../../utils/errorHandler';
import Icon from '../../components/common/Icon';

type Props = NativeStackScreenProps<HomeStackParamList, 'LoanLiquidation'>;

const LoanLiquidationScreen: React.FC<Props> = ({ route, navigation }) => {
  const { loanId } = route.params;
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loan, setLoan] = useState<any>(null);
  const [calculation, setCalculation] = useState<any>(null);
  const [liquidationType, setLiquidationType] = useState<'partial' | 'complete'>('complete');
  const [requestedAmount, setRequestedAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [paymentReference, setPaymentReference] = useState('');
  const [notes, setNotes] = useState('');

  const paymentMethods = [
    { label: 'Bank Transfer', value: 'bank_transfer' },
    { label: 'Cash', value: 'cash' },
    { label: 'Mobile Money', value: 'mobile_money' },
    { label: 'Debit Card', value: 'debit_card' },
  ];

  useEffect(() => {
    fetchLoanDetails();
  }, [loanId]);

  useEffect(() => {
    if (liquidationType === 'complete') {
      calculateLiquidation();
    }
  }, [liquidationType]);

  const fetchLoanDetails = async () => {
    try {
      setLoading(true);
      const response = await loanApi.getById(loanId);
      if (response.success && response.data) {
        setLoan(response.data);
        // Auto-calculate for complete liquidation
        if (liquidationType === 'complete') {
          calculateLiquidation();
        }
      }
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error));
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const calculateLiquidation = async () => {
    try {
      setCalculating(true);
      const amount = liquidationType === 'partial' ? parseFloat(requestedAmount) : undefined;
      const response = await loanApi.calculateLiquidation(loanId, liquidationType, amount);
      if (response.success && response.data) {
        setCalculation(response.data);
      }
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error));
    } finally {
      setCalculating(false);
    }
  };

  const handleCalculate = () => {
    if (liquidationType === 'partial') {
      const amount = parseFloat(requestedAmount);
      if (!amount || amount <= 0) {
        Alert.alert('Invalid Amount', 'Please enter a valid amount');
        return;
      }
      if (loan && amount >= loan.outstandingBalance) {
        Alert.alert(
          'Invalid Amount',
          'For partial liquidation, amount must be less than outstanding balance'
        );
        return;
      }
    }
    calculateLiquidation();
  };

  const handleSubmit = async () => {
    if (!calculation) {
      Alert.alert('Error', 'Please calculate liquidation first');
      return;
    }

    if (!paymentMethod) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }

    try {
      setSubmitting(true);
      const response = await loanApi.createLiquidation(loanId, {
        liquidationType,
        requestedAmount: calculation.requestedAmount,
        paymentMethod,
        paymentReference,
        notes,
      });

      if (response.success) {
        Alert.alert(
          'Success',
          response.data.requestedBy === 'admin'
            ? 'Liquidation processed successfully'
            : 'Liquidation request submitted. Pending admin approval.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading loan details...</Text>
      </View>
    );
  }

  if (!loan) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Loan not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Loan Liquidation</Text>
        <Text style={styles.headerSubtitle}>
          Pay off your loan early - {liquidationType === 'complete' ? 'completely' : 'partially'}
        </Text>
      </View>

      {/* Loan Summary */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Current Loan Details</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Original Amount:</Text>
          <Text style={styles.detailValue}>{formatCurrency(loan.amount)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Outstanding Balance:</Text>
          <Text style={[styles.detailValue, styles.highlight]}>
            {formatCurrency(loan.outstandingBalance)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Amount Repaid:</Text>
          <Text style={styles.detailValue}>{formatCurrency(loan.amountRepaid)}</Text>
        </View>
      </View>

      {/* Liquidation Type Selection */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Liquidation Type</Text>
        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[
              styles.typeButton,
              liquidationType === 'complete' && styles.typeButtonActive,
            ]}
            onPress={() => setLiquidationType('complete')}
          >
            <View style={styles.typeButtonIconContainer}>
              <Icon
                name="checkmark-done-outline"
                size={28}
                color={liquidationType === 'complete' ? '#22c55e' : '#cbd5e1'}
              />
            </View>
            <View style={styles.typeButtonContent}>
              <Text
                style={[
                  styles.typeButtonText,
                  liquidationType === 'complete' && styles.typeButtonTextActive,
                ]}
              >
                Complete Liquidation
              </Text>
              <Text style={styles.typeButtonSubtext}>Pay off entire loan</Text>
            </View>
            <Icon
              name={liquidationType === 'complete' ? 'checkmark-circle' : 'circle-outline'}
              size={22}
              color={liquidationType === 'complete' ? '#007AFF' : '#cbd5e1'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.typeButton,
              liquidationType === 'partial' && styles.typeButtonActive,
            ]}
            onPress={() => setLiquidationType('partial')}
          >
            <View style={styles.typeButtonIconContainer}>
              <Icon
                name="wallet-outline"
                size={28}
                color={liquidationType === 'partial' ? '#f97316' : '#cbd5e1'}
              />
            </View>
            <View style={styles.typeButtonContent}>
              <Text
                style={[
                  styles.typeButtonText,
                  liquidationType === 'partial' && styles.typeButtonTextActive,
                ]}
              >
                Partial Liquidation
              </Text>
              <Text style={styles.typeButtonSubtext}>Pay partial amount</Text>
            </View>
            <Icon
              name={liquidationType === 'partial' ? 'checkmark-circle' : 'circle-outline'}
              size={22}
              color={liquidationType === 'partial' ? '#007AFF' : '#cbd5e1'}
            />
          </TouchableOpacity>
        </View>

        {liquidationType === 'partial' && (
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Amount to Pay</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter amount"
              keyboardType="numeric"
              value={requestedAmount}
              onChangeText={setRequestedAmount}
            />
            <TouchableOpacity
              style={styles.calculateButton}
              onPress={handleCalculate}
              disabled={calculating}
            >
              {calculating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.calculateButtonText}>Calculate</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Calculation Results */}
      {calculation && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Liquidation Summary</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Principal Amount:</Text>
            <Text style={styles.detailValue}>{formatCurrency(calculation.principalAmount)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Interest Amount:</Text>
            <Text style={styles.detailValue}>{formatCurrency(calculation.interestAmount)}</Text>
          </View>
          {calculation.earlyPaymentDiscount > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Early Payment Discount:</Text>
              <Text style={[styles.detailValue, styles.discount]}>
                -{formatCurrency(calculation.earlyPaymentDiscount)}
              </Text>
            </View>
          )}
          {calculation.processingFee > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Processing Fee:</Text>
              <Text style={styles.detailValue}>{formatCurrency(calculation.processingFee)}</Text>
            </View>
          )}
          <View style={[styles.detailRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total to Pay:</Text>
            <Text style={styles.totalValue}>{formatCurrency(calculation.finalAmount)}</Text>
          </View>
          {liquidationType === 'partial' && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>New Outstanding Balance:</Text>
              <Text style={styles.detailValue}>
                {formatCurrency(calculation.newOutstandingBalance)}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Payment Details */}
      {calculation && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment Details</Text>
          
          <Text style={styles.inputLabel}>Payment Method</Text>
          <View style={styles.pickerContainer}>
            {paymentMethods.map((method) => (
              <TouchableOpacity
                key={method.value}
                style={[
                  styles.methodButton,
                  paymentMethod === method.value && styles.methodButtonActive,
                ]}
                onPress={() => setPaymentMethod(method.value)}
              >
                <Text
                  style={[
                    styles.methodButtonText,
                    paymentMethod === method.value && styles.methodButtonTextActive,
                  ]}
                >
                  {method.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.inputLabel}>Payment Reference (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Transaction ID"
            value={paymentReference}
            onChangeText={setPaymentReference}
          />

          <Text style={styles.inputLabel}>Notes (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Add any additional notes"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </View>
      )}

      {/* Submit Button */}
      {calculation && (
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Liquidation Request</Text>
          )}
        </TouchableOpacity>
      )}

      <View style={styles.footer} />
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
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
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  highlight: {
    color: '#007AFF',
    fontWeight: '600',
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
  typeSelector: {
    marginTop: 8,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  typeButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#eff6ff',
  },
  typeButtonIconContainer: {
    marginRight: 12,
  },
  typeButtonContent: {
    flex: 1,
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
  },
  typeButtonTextActive: {
    color: '#007AFF',
  },
  typeButtonSubtext: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  inputContainer: {
    marginTop: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
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
  calculateButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  calculateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  pickerContainer: {
    marginBottom: 8,
  },
  methodButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginBottom: 8,
  },
  methodButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#e3f2fd',
  },
  methodButtonText: {
    fontSize: 16,
    color: '#666',
  },
  methodButtonTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#4caf50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    margin: 16,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    height: 20,
  },
});

export default LoanLiquidationScreen;
