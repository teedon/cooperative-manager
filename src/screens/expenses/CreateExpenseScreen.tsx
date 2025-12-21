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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import Icon from '../../components/common/Icon';
import { expenseApi, ExpenseCategory, CreateExpenseData } from '../../api/expenseApi';
import DateTimePicker from '@react-native-community/datetimepicker';

type Props = NativeStackScreenProps<HomeStackParamList, 'CreateExpense'>;

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash', icon: 'banknote' },
  { id: 'bank_transfer', label: 'Bank Transfer', icon: 'building' },
  { id: 'card', label: 'Card', icon: 'credit-card' },
  { id: 'mobile_money', label: 'Mobile Money', icon: 'smartphone' },
];

const CreateExpenseScreen: React.FC<Props> = ({ route, navigation }) => {
  const { cooperativeId } = route.params;

  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date());
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [vendorName, setVendorName] = useState('');
  const [vendorContact, setVendorContact] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string | undefined>();
  const [paymentReference, setPaymentReference] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await expenseApi.getCategories(cooperativeId);
      if (response.success) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
    setLoading(false);
  };

  const validateForm = (): boolean => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter an expense title');
      return false;
    }
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid amount');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const data: CreateExpenseData = {
        title: title.trim(),
        description: description.trim() || undefined,
        amount: Math.round(parseFloat(amount)), // Amount in Naira (whole number)
        expenseDate: expenseDate.toISOString(),
        categoryId,
        vendorName: vendorName.trim() || undefined,
        vendorContact: vendorContact.trim() || undefined,
        receiptNumber: receiptNumber.trim() || undefined,
        paymentMethod,
        paymentReference: paymentReference.trim() || undefined,
      };

      const response = await expenseApi.createExpense(cooperativeId, data);
      if (response.success) {
        Alert.alert('Success', 'Expense recorded successfully', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create expense');
    }
    setSubmitting(false);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setExpenseDate(selectedDate);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.main} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Basic Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Office Supplies"
              placeholderTextColor={colors.text.disabled}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Amount (₦) *</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor={colors.text.disabled}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Expense Date *</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Icon name="calendar" size={20} color={colors.text.secondary} />
              <Text style={styles.dateText}>
                {expenseDate.toLocaleDateString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={expenseDate}
              mode="date"
              display="default"
              onChange={onDateChange}
              maximumDate={new Date()}
            />
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Add more details about this expense..."
              placeholderTextColor={colors.text.disabled}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Category Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category</Text>
          <View style={styles.categoryGrid}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  categoryId === cat.id && styles.categoryChipSelected,
                  { borderColor: cat.color || colors.border.main },
                ]}
                onPress={() => setCategoryId(categoryId === cat.id ? undefined : cat.id)}
              >
                <Icon
                  name={cat.icon || 'folder'}
                  size={16}
                  color={categoryId === cat.id ? colors.primary.contrast : (cat.color || colors.text.secondary)}
                />
                <Text
                  style={[
                    styles.categoryChipText,
                    categoryId === cat.id && styles.categoryChipTextSelected,
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Vendor Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vendor / Payee</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Vendor Name</Text>
            <TextInput
              style={styles.input}
              value={vendorName}
              onChangeText={setVendorName}
              placeholder="e.g., ABC Supplies Ltd"
              placeholderTextColor={colors.text.disabled}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contact (Phone/Email)</Text>
            <TextInput
              style={styles.input}
              value={vendorContact}
              onChangeText={setVendorContact}
              placeholder="e.g., 08012345678"
              placeholderTextColor={colors.text.disabled}
            />
          </View>
        </View>

        {/* Payment Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Payment Method</Text>
            <View style={styles.paymentMethods}>
              {PAYMENT_METHODS.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.paymentMethod,
                    paymentMethod === method.id && styles.paymentMethodSelected,
                  ]}
                  onPress={() => setPaymentMethod(paymentMethod === method.id ? undefined : method.id)}
                >
                  <Icon
                    name={method.icon}
                    size={20}
                    color={paymentMethod === method.id ? colors.primary.contrast : colors.text.secondary}
                  />
                  <Text
                    style={[
                      styles.paymentMethodText,
                      paymentMethod === method.id && styles.paymentMethodTextSelected,
                    ]}
                  >
                    {method.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Receipt/Invoice Number</Text>
            <TextInput
              style={styles.input}
              value={receiptNumber}
              onChangeText={setReceiptNumber}
              placeholder="e.g., INV-001234"
              placeholderTextColor={colors.text.disabled}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Payment Reference</Text>
            <TextInput
              style={styles.input}
              value={paymentReference}
              onChangeText={setPaymentReference}
              placeholder="e.g., Transaction ID"
              placeholderTextColor={colors.text.disabled}
            />
          </View>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={colors.primary.contrast} />
          ) : (
            <>
              <Icon name="check" size={20} color={colors.primary.contrast} />
              <Text style={styles.submitButtonText}>Record Expense</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  section: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
    gap: spacing.sm,
  },
  dateText: {
    fontSize: 15,
    color: colors.text.primary,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    backgroundColor: colors.background.default,
    gap: 4,
  },
  categoryChipSelected: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  categoryChipText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  categoryChipTextSelected: {
    color: colors.primary.contrast,
  },
  paymentMethods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.default,
    borderWidth: 1,
    borderColor: colors.border.light,
    gap: spacing.xs,
  },
  paymentMethodSelected: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  paymentMethodText: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  paymentMethodTextSelected: {
    color: colors.primary.contrast,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    backgroundColor: colors.background.paper,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    ...shadows.lg,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.main,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
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
});

export default CreateExpenseScreen;
