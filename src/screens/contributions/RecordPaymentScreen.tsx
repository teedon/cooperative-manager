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
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { recordPayment } from '../../store/slices/contributionSlice';
import { validateRequired } from '../../utils/validation';

type Props = NativeStackScreenProps<HomeStackParamList, 'RecordPayment'>;

interface PaymentFormData {
  amount: string;
  paymentDate: string;
  paymentReference: string;
  notes: string;
}

interface FormErrors {
  amount?: string;
  paymentDate?: string;
}

const RecordPaymentScreen: React.FC<Props> = ({ route, navigation }) => {
  const { periodId } = route.params;
  const dispatch = useAppDispatch();
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { periods, currentPlan } = useAppSelector((state) => state.contribution);
  const period = periods.find((p) => p.id === periodId);

  const [formData, setFormData] = useState<PaymentFormData>({
    amount: currentPlan?.type === 'fixed' ? String(currentPlan.amount) : '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentReference: '',
    notes: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    const amountError = validateRequired(formData.amount, 'Amount');
    if (amountError) newErrors.amount = amountError;
    
    const dateError = validateRequired(formData.paymentDate, 'Payment date');
    if (dateError) newErrors.paymentDate = dateError;
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const pickImage = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      selectionLimit: 1,
    });

    if (result.didCancel) {
      return;
    }

    if (result.errorCode) {
      Alert.alert('Error', result.errorMessage || 'Failed to pick image');
      return;
    }

    if (result.assets && result.assets[0]) {
      setReceiptImage(result.assets[0].uri || null);
    }
  };

  const takePhoto = async () => {
    const result = await launchCamera({
      mediaType: 'photo',
      quality: 0.8,
      saveToPhotos: true,
    });

    if (result.didCancel) {
      return;
    }

    if (result.errorCode) {
      Alert.alert('Error', result.errorMessage || 'Failed to take photo');
      return;
    }

    if (result.assets && result.assets[0]) {
      setReceiptImage(result.assets[0].uri || null);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      await dispatch(
        recordPayment({
          periodId,
          record: {
            ...formData,
            amount: Number(formData.amount),
            receiptUrl: receiptImage || undefined,
          },
        })
      ).unwrap();

      Alert.alert('Success', 'Payment recorded successfully! Awaiting admin verification.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to record payment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!period) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Period not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Record Payment</Text>
        <Text style={styles.headerSubtitle}>
          Period {period.periodNumber} • Due {new Date(period.dueDate).toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Amount *</Text>
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
          <Text style={styles.label}>Payment Date *</Text>
          <TextInput
            style={[styles.input, errors.paymentDate && styles.inputError]}
            placeholder="YYYY-MM-DD"
            onChangeText={(text) => setFormData({ ...formData, paymentDate: text })}
            value={formData.paymentDate}
          />
          {errors.paymentDate && <Text style={styles.errorText}>{errors.paymentDate}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Payment Reference</Text>
          <TextInput
            style={styles.input}
            placeholder="Transaction ID or reference number"
            onChangeText={(text) => setFormData({ ...formData, paymentReference: text })}
            value={formData.paymentReference}
          />
            )}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Receipt Image</Text>
          {receiptImage ? (
            <View style={styles.receiptPreview}>
              <Image source={{ uri: receiptImage }} style={styles.receiptImage} />
              <TouchableOpacity
                style={styles.removeReceiptButton}
                onPress={() => setReceiptImage(null)}
              >
                <Text style={styles.removeReceiptText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.imageButtons}>
              <TouchableOpacity style={styles.imageButton} onPress={takePhoto}>
                <Text style={styles.imageButtonIcon}>📷</Text>
                <Text style={styles.imageButtonText}>Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                <Text style={styles.imageButtonIcon}>🖼️</Text>
                <Text style={styles.imageButtonText}>Choose File</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Any additional notes..."
            multiline={true}
            numberOfLines={3}
            onChangeText={(text) => setFormData({ ...formData, notes: text })}
            value={formData.notes}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Payment Record</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          * Payment records are subject to admin verification before being reflected in your
          balance.
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#0ea5e9',
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
    fontSize: 20,
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
    minHeight: 80,
    textAlignVertical: 'top',
  },
  imageButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  imageButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 24,
    alignItems: 'center',
  },
  imageButtonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  imageButtonText: {
    fontSize: 14,
    color: '#64748b',
  },
  receiptPreview: {
    alignItems: 'center',
  },
  receiptImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
  },
  removeReceiptButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  removeReceiptText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#0ea5e9',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
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
    marginTop: 16,
    lineHeight: 18,
  },
});

export default RecordPaymentScreen;
