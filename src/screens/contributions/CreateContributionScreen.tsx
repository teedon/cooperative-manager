import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { createPlan } from '../../store/slices/contributionSlice';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import Icon from '../../components/common/Icon';
import DatePicker from '../../components/common/DatePicker';
import { CreateContributionPlanData } from '../../api/contributionApi';
import { toDateInputValue } from '../../utils/formatters';

type Props = NativeStackScreenProps<HomeStackParamList, 'CreateContribution'>;

type Category = 'compulsory' | 'optional';
type AmountType = 'fixed' | 'notional';
type ContributionType = 'continuous' | 'period';
type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

const CreateContributionScreen: React.FC<Props> = ({ route, navigation }) => {
  const { cooperativeId } = route.params;
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.contribution);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('optional');
  const [amountType, setAmountType] = useState<AmountType>('fixed');
  const [fixedAmount, setFixedAmount] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [contributionType, setContributionType] = useState<ContributionType>('continuous');
  const [frequency, setFrequency] = useState<Frequency>('monthly');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isActive, setIsActive] = useState(true);

  const validateForm = (): string | null => {
    if (!name.trim()) {
      return 'Please enter a contribution name';
    }
    
    if (amountType === 'fixed' && !fixedAmount) {
      return 'Please enter the fixed contribution amount';
    }
    
    if (amountType === 'notional') {
      if (minAmount && maxAmount && parseInt(minAmount) > parseInt(maxAmount)) {
        return 'Minimum amount cannot be greater than maximum amount';
      }
    }
    
    if (contributionType === 'period' && !endDate) {
      return 'Please enter an end date for period-based contributions';
    }
    
    return null;
  };

  const handleSubmit = async () => {
    const error = validateForm();
    if (error) {
      Alert.alert('Validation Error', error);
      return;
    }

    const planData: CreateContributionPlanData = {
      name: name.trim(),
      description: description.trim() || undefined,
      category,
      amountType,
      fixedAmount: amountType === 'fixed' ? parseInt(fixedAmount) : undefined,
      minAmount: amountType === 'notional' && minAmount ? parseInt(minAmount) : undefined,
      maxAmount: amountType === 'notional' && maxAmount ? parseInt(maxAmount) : undefined,
      contributionType,
      frequency,
      startDate: startDate ? toDateInputValue(startDate) : undefined,
      endDate: contributionType === 'period' && endDate ? toDateInputValue(endDate) : undefined,
      isActive,
    };

    try {
      await dispatch(createPlan({ cooperativeId, plan: planData })).unwrap();
      Alert.alert('Success', 'Contribution plan created successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err || 'Failed to create contribution plan');
    }
  };

  const renderOptionButton = <T extends string>(
    value: T,
    currentValue: T,
    onPress: (value: T) => void,
    label: string,
    icon?: string
  ) => (
    <TouchableOpacity
      style={[
        styles.optionButton,
        currentValue === value && styles.optionButtonSelected,
      ]}
      onPress={() => onPress(value)}
    >
      {icon && (
        <Icon
          name={icon}
          size={18}
          color={currentValue === value ? colors.primary.contrast : colors.text.secondary}
        />
      )}
      <Text
        style={[
          styles.optionButtonText,
          currentValue === value && styles.optionButtonTextSelected,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.headerSection}>
          <View style={styles.iconContainer}>
            <Icon name="Wallet" size={32} color={colors.primary.main} />
          </View>
          <Text style={styles.headerTitle}>Create Contribution Plan</Text>
          <Text style={styles.headerSubtitle}>
            Set up a new contribution plan for your cooperative members
          </Text>
        </View>

        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name *</Text>
            <View style={styles.inputContainer}>
              <Icon name="FileText" size={18} color={colors.text.secondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g., Monthly Savings"
                placeholderTextColor={colors.text.disabled}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <View style={[styles.inputContainer, styles.textAreaContainer]}>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe this contribution plan..."
                placeholderTextColor={colors.text.disabled}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        </View>

        {/* Category */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category</Text>
          <Text style={styles.sectionHint}>
            Compulsory contributions are required for all members
          </Text>
          <View style={styles.optionRow}>
            {renderOptionButton('compulsory', category, setCategory, 'Compulsory', 'AlertCircle')}
            {renderOptionButton('optional', category, setCategory, 'Optional', 'Circle')}
          </View>
        </View>

        {/* Amount Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Amount Type</Text>
          <Text style={styles.sectionHint}>
            Fixed: Same amount for everyone. Notional: Members choose their amount
          </Text>
          <View style={styles.optionRow}>
            {renderOptionButton('fixed', amountType, setAmountType, 'Fixed', 'Lock')}
            {renderOptionButton('notional', amountType, setAmountType, 'Notional', 'Unlock')}
          </View>

          {amountType === 'fixed' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Fixed Amount (₦) *</Text>
              <View style={styles.inputContainer}>
                <Icon name="DollarSign" size={18} color={colors.text.secondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={fixedAmount}
                  onChangeText={setFixedAmount}
                  placeholder="e.g., 5000"
                  placeholderTextColor={colors.text.disabled}
                  keyboardType="numeric"
                />
              </View>
            </View>
          )}

          {amountType === 'notional' && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Minimum Amount (₦)</Text>
                <View style={styles.inputContainer}>
                  <Icon name="ArrowDown" size={18} color={colors.text.secondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={minAmount}
                    onChangeText={setMinAmount}
                    placeholder="e.g., 1000 (optional)"
                    placeholderTextColor={colors.text.disabled}
                    keyboardType="numeric"
                  />
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Maximum Amount (₦)</Text>
                <View style={styles.inputContainer}>
                  <Icon name="ArrowUp" size={18} color={colors.text.secondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={maxAmount}
                    onChangeText={setMaxAmount}
                    placeholder="e.g., 100000 (optional)"
                    placeholderTextColor={colors.text.disabled}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </>
          )}
        </View>

        {/* Contribution Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contribution Duration</Text>
          <Text style={styles.sectionHint}>
            Continuous: No end date. Period: Has a specific end date
          </Text>
          <View style={styles.optionRow}>
            {renderOptionButton('continuous', contributionType, setContributionType, 'Continuous', 'Infinity')}
            {renderOptionButton('period', contributionType, setContributionType, 'Period', 'Calendar')}
          </View>
        </View>

        {/* Frequency */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequency</Text>
          <View style={styles.frequencyGrid}>
            {(['daily', 'weekly', 'monthly', 'yearly'] as Frequency[]).map((freq) => (
              <TouchableOpacity
                key={freq}
                style={[
                  styles.frequencyButton,
                  frequency === freq && styles.frequencyButtonSelected,
                ]}
                onPress={() => setFrequency(freq)}
              >
                <Text
                  style={[
                    styles.frequencyButtonText,
                    frequency === freq && styles.frequencyButtonTextSelected,
                  ]}
                >
                  {freq.charAt(0).toUpperCase() + freq.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Dates */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dates</Text>
          
          <DatePicker
            label="Start Date"
            value={startDate}
            onChange={setStartDate}
            placeholder="Select start date (optional)"
            minimumDate={new Date()}
          />

          {contributionType === 'period' && (
            <DatePicker
              label="End Date *"
              value={endDate}
              onChange={setEndDate}
              placeholder="Select end date"
              minimumDate={startDate || new Date()}
            />
          )}
        </View>

        {/* Active Toggle */}
        <View style={styles.section}>
          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.sectionTitle}>Active Status</Text>
              <Text style={styles.sectionHint}>
                Members can only subscribe to active plans
              </Text>
            </View>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{ false: colors.border.main, true: colors.primary.light }}
              thumbColor={isActive ? colors.primary.main : colors.text.disabled}
            />
          </View>
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
              <Icon name="Plus" size={20} color={colors.primary.contrast} />
              <Text style={styles.submitButtonText}>Create Contribution Plan</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  content: {
    padding: spacing.lg,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  section: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  sectionHint: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  inputGroup: {
    marginTop: spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: spacing.md,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: 15,
    color: colors.text.primary,
  },
  textAreaContainer: {
    alignItems: 'flex-start',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  optionRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  optionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.background.default,
    gap: spacing.sm,
  },
  optionButtonSelected: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  optionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  optionButtonTextSelected: {
    color: colors.primary.contrast,
  },
  frequencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  frequencyButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.background.default,
  },
  frequencyButtonSelected: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  frequencyButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  frequencyButtonTextSelected: {
    color: colors.primary.contrast,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.main,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    marginTop: spacing.lg,
    marginBottom: spacing['2xl'],
    gap: spacing.sm,
    ...shadows.md,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary.contrast,
  },
});

export default CreateContributionScreen;
