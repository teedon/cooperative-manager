import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import { feeApi } from '../../api/feeApi';
import { colors, spacing, borderRadius, shadows } from '../../theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'RecordFeePayment'>;

const RecordFeePaymentScreen: React.FC<Props> = ({ route, navigation }) => {
  const { cooperativeId, feeId, feeName } = route.params;
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer' | 'mobile_money' | 'card'>('cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const onSubmit = async () => {
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount < 1) {
      Alert.alert('Validation', 'Amount must be at least 1');
      return;
    }

    try {
      setSaving(true);
      const response = await feeApi.recordFeePayment(feeId, {
        amount: Math.round(numericAmount),
        paymentDate,
        paymentMethod,
        paymentReference: paymentReference.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      if (response.success) {
        navigation.replace('FeePayments', { cooperativeId, feeId, feeName });
      } else {
        Alert.alert('Error', response.message || 'Failed to record payment');
      }
    } catch (error) {
      console.error('Failed to record fee payment:', error);
      Alert.alert('Error', 'Failed to record payment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.title}>{feeName || 'Record Payment'}</Text>

        <Text style={styles.label}>Amount</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={colors.text.disabled}
        />

        <Text style={styles.label}>Payment Date (YYYY-MM-DD)</Text>
        <TextInput
          style={styles.input}
          value={paymentDate}
          onChangeText={setPaymentDate}
          placeholder="2026-01-01"
          placeholderTextColor={colors.text.disabled}
        />

        <Text style={styles.label}>Payment Method</Text>
        <View style={styles.methodRow}>
          {(['cash', 'bank_transfer', 'mobile_money', 'card'] as const).map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.methodChip, paymentMethod === m && styles.methodChipActive]}
              onPress={() => setPaymentMethod(m)}
            >
              <Text style={[styles.methodChipText, paymentMethod === m && styles.methodChipTextActive]}>
                {m.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Reference (Optional)</Text>
        <TextInput
          style={styles.input}
          value={paymentReference}
          onChangeText={setPaymentReference}
          placeholder="Txn / receipt reference"
          placeholderTextColor={colors.text.disabled}
        />

        <Text style={styles.label}>Notes (Optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Additional context"
          placeholderTextColor={colors.text.disabled}
          multiline
        />

        <TouchableOpacity style={[styles.saveButton, saving && styles.disabled]} disabled={saving} onPress={onSubmit}>
          <Text style={styles.saveText}>{saving ? 'Recording...' : 'Record Payment'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.default },
  content: { padding: spacing.md },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
    gap: spacing.sm,
  },
  title: { fontSize: 18, fontWeight: '800', color: colors.text.primary, marginBottom: spacing.sm },
  label: { fontWeight: '700', color: colors.text.primary },
  input: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text.primary,
    backgroundColor: colors.background.paper,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  methodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  methodChip: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    backgroundColor: colors.white,
  },
  methodChipActive: { backgroundColor: colors.primary.main, borderColor: colors.primary.main },
  methodChipText: { color: colors.text.secondary, textTransform: 'capitalize' },
  methodChipTextActive: { color: colors.white, fontWeight: '700' },
  saveButton: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  saveText: { color: colors.white, fontWeight: '700' },
  disabled: { opacity: 0.6 },
});

export default RecordFeePaymentScreen;
