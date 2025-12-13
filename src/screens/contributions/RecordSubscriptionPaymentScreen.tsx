import React, { useState, useEffect } from 'react';
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
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { recordSubscriptionPayment } from '../../store/slices/contributionSlice';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import Icon from '../../components/common/Icon';
import { launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import { RecordPaymentData } from '../../api/contributionApi';

type Props = NativeStackScreenProps<HomeStackParamList, 'RecordSubscriptionPayment'>;

type PaymentMethod = 'bank_transfer' | 'cash' | 'mobile_money' | 'card';

const paymentMethods: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: 'bank_transfer', label: 'Bank Transfer', icon: 'Building' },
  { value: 'mobile_money', label: 'Mobile Money', icon: 'Smartphone' },
  { value: 'card', label: 'Card Payment', icon: 'CreditCard' },
  { value: 'cash', label: 'Cash', icon: 'Banknote' },
];

const RecordSubscriptionPaymentScreen: React.FC<Props> = ({ route, navigation }) => {
  const { subscriptionId, planName, amount: defaultAmount, dueDate } = route.params as {
    subscriptionId: string;
    planName?: string;
    amount?: number;
    dueDate?: string;
  };
  const dispatch = useAppDispatch();
  const { isLoading, mySubscriptions } = useAppSelector((state) => state.contribution);
  
  // Get subscription from store if not passed in params
  const subscription = mySubscriptions.find((s) => s.id === subscriptionId);
  const resolvedPlanName = planName || (subscription?.plan as any)?.name || 'Contribution';
  const resolvedAmount = defaultAmount || subscription?.amount;

  const [amount, setAmount] = useState(resolvedAmount?.toString() || '');
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
        // In a real app, you would upload to a server and get a URL
        // For now, we'll use the local URI as a placeholder
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
      await dispatch(recordSubscriptionPayment({ subscriptionId, data: paymentData })).unwrap();
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
      {/* Plan Info Header */}
      <View style={styles.header}>
        <Icon name="Receipt" size={24} color={colors.primary.contrast} />
        <Text style={styles.headerTitle}>Record Payment</Text>
        <Text style={styles.headerSubtitle}>{resolvedPlanName}</Text>
      </View>

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
        {resolvedAmount && (
          <Text style={styles.amountHint}>Suggested amount: ₦{resolvedAmount.toLocaleString()}</Text>
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
          style={styles.textInput}
          value={paymentReference}
          onChangeText={setPaymentReference}
          placeholder="Transaction ID or reference number"
          placeholderTextColor={colors.text.disabled}
        />
      </View>

      {/* Receipt Upload */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upload Receipt (Optional)</Text>
        <TouchableOpacity style={styles.uploadButton} onPress={handleSelectReceipt}>
          {receiptPreview ? (
            <View style={styles.receiptPreviewContainer}>
              <Image source={{ uri: receiptPreview }} style={styles.receiptPreview} />
              <View style={styles.changeReceiptOverlay}>
                <Icon name="Camera" size={20} color={colors.primary.contrast} />
                <Text style={styles.changeReceiptText}>Change</Text>
              </View>
            </View>
          ) : (
            <View style={styles.uploadPlaceholder}>
              <Icon name="Upload" size={32} color={colors.text.disabled} />
              <Text style={styles.uploadText}>Tap to upload receipt</Text>
              <Text style={styles.uploadHint}>JPG, PNG up to 5MB</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notes (Optional)</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Add any additional notes..."
          placeholderTextColor={colors.text.disabled}
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.primary.contrast} />
        ) : (
          <>
            <Icon name="Check" size={20} color={colors.primary.contrast} />
            <Text style={styles.submitButtonText}>Submit Payment</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Info Notice */}
      <View style={styles.infoNotice}>
        <Icon name="Info" size={16} color={colors.info.main} />
        <Text style={styles.infoText}>
          Your payment will be reviewed by an admin. Once approved, it will be credited to your account.
        </Text>
      </View>

      <View style={{ height: spacing.xl }} />
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
  section: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.primary.main,
    paddingHorizontal: spacing.lg,
  },
  currencyPrefix: {
    fontSize: 28,
    fontWeight: '600',
    color: colors.primary.main,
    marginRight: spacing.sm,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text.primary,
    paddingVertical: spacing.lg,
  },
  amountHint: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  methodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  methodCard: {
    width: '48%',
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border.light,
    ...shadows.sm,
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
  textInput: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
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
    borderRadius: borderRadius.lg,
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
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  uploadHint: {
    fontSize: 12,
    color: colors.text.disabled,
    marginTop: spacing.xs,
  },
  receiptPreviewContainer: {
    position: 'relative',
  },
  receiptPreview: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  changeReceiptOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    gap: spacing.xs,
  },
  changeReceiptText: {
    color: colors.primary.contrast,
    fontSize: 14,
    fontWeight: '500',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.main,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    ...shadows.md,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary.contrast,
  },
  infoNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.info.light,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: colors.info.main,
    lineHeight: 18,
  },
});

export default RecordSubscriptionPaymentScreen;
