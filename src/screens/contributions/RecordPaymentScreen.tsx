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
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import * as ImagePicker from 'expo-image-picker';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { recordPayment } from '../../store/slices/contributionSlice';

type Props = NativeStackScreenProps<HomeStackParamList, 'RecordPayment'>;

const paymentSchema = z.object({
  amount: z.string().min(1, 'Amount is required'),
  paymentDate: z.string().min(1, 'Payment date is required'),
  paymentReference: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

const RecordPaymentScreen: React.FC<Props> = ({ route, navigation }) => {
  const { periodId } = route.params;
  const dispatch = useAppDispatch();
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { periods, currentPlan } = useAppSelector((state) => state.contribution);
  const period = periods.find((p) => p.id === periodId);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: currentPlan?.type === 'fixed' ? String(currentPlan.amount) : '',
      paymentDate: new Date().toISOString().split('T')[0],
      paymentReference: '',
      notes: '',
    },
  });

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant camera roll permissions to upload receipts.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setReceiptImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera permissions to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setReceiptImage(result.assets[0].uri);
    }
  };

  const onSubmit = async (data: PaymentFormData) => {
    setIsSubmitting(true);
    try {
      await dispatch(
        recordPayment({
          periodId,
          record: {
            ...data,
            amount: Number(data.amount),
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
          <Controller
            control={control}
            name="amount"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.amountInputContainer}>
                <Text style={styles.currencyPrefix}>$</Text>
                <TextInput
                  style={[styles.amountInput, errors.amount && styles.inputError]}
                  placeholder="0.00"
                  keyboardType="numeric"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              </View>
            )}
          />
          {errors.amount && <Text style={styles.errorText}>{errors.amount.message}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Payment Date *</Text>
          <Controller
            control={control}
            name="paymentDate"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.paymentDate && styles.inputError]}
                placeholder="YYYY-MM-DD"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.paymentDate && <Text style={styles.errorText}>{errors.paymentDate.message}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Payment Reference</Text>
          <Controller
            control={control}
            name="paymentReference"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="Transaction ID or reference number"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
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
          <Controller
            control={control}
            name="notes"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Any additional notes..."
                multiline
                numberOfLines={3}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit(onSubmit)}
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
