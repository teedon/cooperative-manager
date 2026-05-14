import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Switch, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import { feeApi } from '../../api/feeApi';
import { colors, spacing, borderRadius, shadows } from '../../theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'CreateFee'>;

const CreateFeeScreen: React.FC<Props> = ({ route, navigation }) => {
  const { cooperativeId, feeId } = route.params;
  const isEdit = !!feeId;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) {
      loadFee();
    }
  }, [isEdit]);

  const loadFee = async () => {
    try {
      const response = await feeApi.getFees(cooperativeId);
      if (response.success) {
        const fee = (response.data || []).find((f) => f.id === feeId);
        if (fee) {
          setName(fee.name);
          setDescription(fee.description || '');
          setAmount(String(fee.amount));
          setIsActive(fee.isActive);
        }
      }
    } catch (error) {
      console.error('Failed to load fee:', error);
    }
  };

  const onSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Fee name is required');
      return;
    }
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount < 1) {
      Alert.alert('Validation', 'Amount must be at least 1');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        amount: Math.round(numericAmount),
        isActive,
      };

      const response = isEdit && feeId
        ? await feeApi.updateFee(feeId, payload)
        : await feeApi.createFee(cooperativeId, payload);

      if (response.success) {
        navigation.replace('FeesList', { cooperativeId });
      } else {
        Alert.alert('Error', response.message || 'Failed to save fee');
      }
    } catch (error) {
      console.error('Failed to save fee:', error);
      Alert.alert('Error', 'Failed to save fee');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.label}>Fee Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Registration Fee"
          placeholderTextColor={colors.text.disabled}
        />

        <Text style={styles.label}>Description (Optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="What is this fee for?"
          placeholderTextColor={colors.text.disabled}
          multiline
        />

        <Text style={styles.label}>Amount</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          placeholder="0"
          placeholderTextColor={colors.text.disabled}
          keyboardType="numeric"
        />

        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Active</Text>
            <Text style={styles.helper}>Allow members to pay this fee</Text>
          </View>
          <Switch value={isActive} onValueChange={setIsActive} />
        </View>

        <TouchableOpacity style={[styles.saveButton, saving && styles.disabled]} onPress={onSave} disabled={saving}>
          <Text style={styles.saveText}>{saving ? 'Saving...' : isEdit ? 'Update Fee' : 'Create Fee'}</Text>
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
  label: { fontWeight: '700', color: colors.text.primary },
  helper: { color: colors.text.secondary, fontSize: 12 },
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  saveButton: {
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  saveText: { color: colors.white, fontWeight: '700' },
  disabled: { opacity: 0.6 },
});

export default CreateFeeScreen;
