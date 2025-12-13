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
  Image,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { recordSchedulePayment } from '../../store/slices/contributionSlice';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import Icon from '../../components/common/Icon';
import { launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import { RecordPaymentData } from '../../api/contributionApi';

type Props = NativeStackScreenProps<HomeStackParamList, 'RecordSchedulePayment'>;

type PaymentMethod = 'bank_transfer' | 'cash' | 'mobile_money' | 'card';

const paymentMethods: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: 'bank_transfer', label: 'Bank Transfer', icon: 'Building' },
  { value: 'mobile_money', label: 'Mobile Money', icon: 'Smartphone' },
  { value: 'card', label: 'Card Payment', icon: 'CreditCard' },
  { value: 'cash', label: 'Cash', icon: 'Banknote' },
];

const RecordSchedulePaymentScreen: React.FC<Props> = ({ route, navigation }) => {
  const { scheduleId, planName, amount: defaultAmount, dueDate, periodLabel } = route.params as {
    scheduleId: string;
    planName?: string;
    amount?: number;
    dueDate?: string;
    periodLabel?: string;
  };
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.contribution);

  const [amount, setAmount] = useState(defaultAmount?.toString() || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [paymentReference, setPaymentReference] = useState('');
  const [notes, setNotes] = useState('');
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  const handleSelectReceipt = async () => {
    try {
      const result: ImagePickerResponse = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1024,
        maxHeight: 1024,
      });

      if (result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setReceiptPreview(asset.uri || null);
        setReceiptUrl(asset.uri || null);
      }
    } catch (error) {
      console.log('Image picker error:', error);
    }
  };

  const handleSubmit = async () => {
    const parsedAmount = parseInt(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    const paymentData: RecordPaymentData = {
      amount: parsedAmount,
      paymentMethod,
      paymentReference: paymentReference || undefined,
      notes: notes || undefined,
      receiptUrl: receiptUrl || undefined,
      dueDate: dueDate || undefined,
    };

    try {
      await dispatch(recordSchedulePayment({ scheduleId, data: paymentData })).unwrap();
      Alert.alert(
        'Payment Recorded',
        'Your payment has been recorded and is pending admin approval.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      Alert.alert('Error', error || 'Failed to record payment');
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {/* Schedule Info Header */}
      <View style={styles.header}>
        <Icon name="Calendar" size={24} color={colors.primary.contrast} />
        <Text style={styles.headerTitle}>Record Payment</Text>
        {planName && <Text style={styles.headerSubtitle}>{planName}</Text>}
        {periodLabel && <Text style={styles.periodLabel}>{periodLabel}</Text>}
      </View>

      {/* Due Date Info */}
      {dueDate && (
        <View style={styles.dueDateCard}>
          <Icon name="Clock" size={20} color={colors.warning.main} />
          <Text style={styles.dueDateText}>
            Due: {new Date(dueDate).toLocaleDateString()}
          </Text>
        </View>
      )}

      {/* Amount Input */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Amount</Text>
        <View style={styles.amountInputContainer}>
          <Text style={styles.currencyPrefix}>₦</Text>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="Enter amount"
            placeholderTextColor={colors.text.disabled}
          />
        </View>
        {defaultAmount && (
          <Text style={styles.amountHint}>Expected amount: ₦{defaultAmount.toLocaleString()}</Text>
        )}
      </View>

      {/* Payment Method */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Method</Text>
        <View style={styles.methodsGrid}>
          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.value}
              style={[
                styles.methodCard,
                paymentMethod === method.value && styles.methodCardActive,
              ]}
              onPress={() => setPaymentMethod(method.value)}
            >
              <Icon
                name={method.icon}
                size={24}
                color={paymentMethod === method.value ? colors.primary.main : colors.text.secondary}
              />
              <Text
                style={[
                  styles.methodLabel,
                  paymentMethod === method.value && styles.methodLabelActive,
                ]}
              >
                {method.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Payment Reference */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Reference (Optional)</Text>
        <TextInput
          style={styles.input}
          value={paymentReference}
          onChangeText={setPaymentReference}
          placeholder="Transaction ID or reference number"
          placeholderTextColor={colors.text.disabled}
        />
      </View>

      {/* Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notes (Optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Add any additional notes"
          placeholderTextColor={colors.text.disabled}
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Receipt Upload */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Receipt (Optional)</Text>
        <TouchableOpacity style={styles.uploadButton} onPress={handleSelectReceipt}>
          {receiptPreview ? (
            <Image source={{ uri: receiptPreview }} style={styles.receiptPreview} />
          ) : (
            <View style={styles.uploadPlaceholder}>
              <Icon name="Upload" size={32} color={colors.text.disabled} />
              <Text style={styles.uploadText}>Tap to upload receipt</Text>
            </View>
          )}
        </TouchableOpacity>
        {receiptPreview && (
          <TouchableOpacity
            style={styles.removeReceiptButton}
            onPress={() => {
              setReceiptPreview(null);
              setReceiptUrl(null);
            }}
          >
            <Icon name="X" size={16} color={colors.error.main} />
            <Text style={styles.removeReceiptText}>Remove receipt</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.primary.contrast} />
        ) : (
          <>
            <Icon name="Check" size={20} color={colors.primary.contrast} />
            <Text style={styles.submitButtonText}>Submit Payment</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  header: {
    backgroundColor: colors.primary.main,
    padding: spacing.xl,
    paddingTop: spacing.lg,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary.contrast,
    marginTop: spacing.sm,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: spacing.xs,
  },
  periodLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary.contrast,
    marginTop: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  dueDateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.warning.light,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: -spacing.lg,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    ...shadows.sm,
  },
  dueDateText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.warning.dark,
  },
  section: {
    padding: spacing.lg,
    paddingBottom: 0,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: spacing.lg,
  },
  currencyPrefix: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text.secondary,
    marginRight: spacing.sm,
  },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '600',
    color: colors.text.primary,
    paddingVertical: spacing.lg,
  },
  amountHint: {
    fontSize: 12,
    color: colors.primary.main,
    marginTop: spacing.sm,
  },
  methodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  methodCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  methodCardActive: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.light,
  },
  methodLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  methodLabelActive: {
    color: colors.primary.main,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text.primary,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  uploadButton: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border.light,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  uploadPlaceholder: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  uploadText: {
    fontSize: 14,
    color: colors.text.disabled,
    marginTop: spacing.sm,
  },
  receiptPreview: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  removeReceiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  removeReceiptText: {
    fontSize: 14,
    color: colors.error.main,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.main,
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary.contrast,
  },
  bottomPadding: {
    height: spacing['2xl'],
  },
});

export default RecordSchedulePaymentScreen;
