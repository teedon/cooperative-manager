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
  Platform,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { subscribeToPlan } from '../../store/slices/contributionSlice';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import Icon from '../../components/common/Icon';

type Props = NativeStackScreenProps<HomeStackParamList, 'RestartContribution'>;

const RestartContributionScreen: React.FC<Props> = ({ route, navigation }) => {
  const { planId, planName, previousAmount, isFixed, minAmount, maxAmount, frequency } = route.params;
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.contribution);

  const [amount, setAmount] = useState(previousAmount.toString());
  const [startDate, setStartDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);

  const handleStartDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowStartPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };

  const validate = (): string | null => {
    const amt = parseInt(amount, 10);
    if (!amount || isNaN(amt) || amt < 1) {
      return 'Please enter a valid amount';
    }
    if (!isFixed) {
      if (minAmount && amt < minAmount) {
        return `Amount cannot be less than ₦${minAmount.toLocaleString()}`;
      }
      if (maxAmount && amt > maxAmount) {
        return `Amount cannot be more than ₦${maxAmount.toLocaleString()}`;
      }
    }
    return null;
  };

  const handleSubmit = async () => {
    const error = validate();
    if (error) {
      Alert.alert('Validation Error', error);
      return;
    }

    try {
      await dispatch(
        subscribeToPlan({
          planId,
          data: { amount: parseInt(amount, 10) },
        }),
      ).unwrap();
      Alert.alert('Success', 'You have successfully restarted your contribution.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err || 'Failed to restart contribution. Please try again.');
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.content}>
        {/* Plan info */}
        <View style={styles.planInfoCard}>
          <Icon name="RefreshCw" size={24} color={colors.primary.main} />
          <View style={styles.planInfoText}>
            <Text style={styles.planName}>{planName}</Text>
            <Text style={styles.planSubLabel}>Restart your subscription</Text>
          </View>
        </View>

        {/* Amount */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Contribution Amount</Text>
          {isFixed ? (
            <View style={styles.fixedAmountRow}>
              <Text style={styles.fixedAmountValue}>₦{previousAmount.toLocaleString()}</Text>
              <Text style={styles.fixedAmountNote}>Fixed by admin</Text>
            </View>
          ) : (
            <>
              <View style={styles.amountInputRow}>
                <Text style={styles.currencySymbol}>₦</Text>
                <TextInput
                  style={styles.amountInput}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                  placeholder="Enter amount"
                  placeholderTextColor={colors.text.disabled}
                />
              </View>
              {(minAmount || maxAmount) && (
                <Text style={styles.amountHint}>
                  {minAmount && maxAmount
                    ? `₦${minAmount.toLocaleString()} – ₦${maxAmount.toLocaleString()}`
                    : minAmount
                    ? `Min: ₦${minAmount.toLocaleString()}`
                    : `Max: ₦${maxAmount!.toLocaleString()}`}
                </Text>
              )}
            </>
          )}
        </View>

        {/* Frequency info */}
        {frequency && (
          <View style={styles.infoRow}>
            <Icon name="Calendar" size={16} color={colors.text.secondary} />
            <Text style={styles.infoRowText}>Frequency: {frequency}</Text>
          </View>
        )}

        {/* Note */}
        <View style={styles.noteCard}>
          <Icon name="Info" size={16} color={colors.primary.main} />
          <Text style={styles.noteText}>
            A new subscription will be created. Your previous contribution history will be preserved.
          </Text>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.primary.contrast} />
          ) : (
            <>
              <Icon name="RefreshCw" size={18} color={colors.primary.contrast} />
              <Text style={styles.submitButtonText}>Restart Contribution</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      {showStartPicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          onChange={handleStartDateChange}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
  planInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.main + '12',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.sm,
  },
  planInfoText: {
    flex: 1,
  },
  planName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  planSubLabel: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
  },
  fieldGroup: {
    gap: spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border?.main || '#ddd',
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background.paper,
    paddingHorizontal: spacing.sm,
  },
  currencySymbol: {
    fontSize: 16,
    color: colors.text.secondary,
    marginRight: spacing.xs,
  },
  amountInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
    paddingVertical: spacing.sm,
  },
  amountHint: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  fixedAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  fixedAmountValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
  },
  fixedAmountNote: {
    fontSize: 12,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  infoRowText: {
    fontSize: 14,
    color: colors.text.secondary,
    textTransform: 'capitalize',
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.primary.main + '10',
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 19,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    gap: spacing.xs,
    ...shadows.sm,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary.contrast,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  cancelButtonText: {
    fontSize: 15,
    color: colors.text.secondary,
  },
});

export default RestartContributionScreen;
