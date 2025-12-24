import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Plus, Trash2, Calendar } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CooperativeStackParamList } from '../../models';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { createPoll } from '../../store/slices/pollsSlice';
import Button from '../../components/common/Button';
import colors from '../../theme/colors';
import { spacing, borderRadius, shadows } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<CooperativeStackParamList, 'CreatePoll'>;

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 10;

const CreatePollScreen: React.FC<Props> = ({ navigation, route }) => {
  const { cooperativeId } = route.params;
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.polls);

  const [question, setQuestion] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [allowMultipleVotes, setAllowMultipleVotes] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [hasEndDate, setHasEndDate] = useState(false);
  const [endDate, setEndDate] = useState<Date>(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // 7 days from now
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleAddOption = useCallback(() => {
    if (options.length < MAX_OPTIONS) {
      setOptions([...options, '']);
    }
  }, [options]);

  const handleRemoveOption = useCallback(
    (index: number) => {
      if (options.length > MIN_OPTIONS) {
        const newOptions = options.filter((_, i) => i !== index);
        setOptions(newOptions);
      }
    },
    [options],
  );

  const handleOptionChange = useCallback(
    (index: number, value: string) => {
      const newOptions = [...options];
      newOptions[index] = value;
      setOptions(newOptions);
    },
    [options],
  );

  const validateForm = useCallback(() => {
    if (!question.trim()) {
      Alert.alert('Error', 'Please enter a question for your poll');
      return false;
    }

    const validOptions = options.filter((opt) => opt.trim());
    if (validOptions.length < MIN_OPTIONS) {
      Alert.alert('Error', `Please provide at least ${MIN_OPTIONS} options`);
      return false;
    }

    // Check for duplicate options
    const uniqueOptions = new Set(validOptions.map((opt) => opt.trim().toLowerCase()));
    if (uniqueOptions.size !== validOptions.length) {
      Alert.alert('Error', 'Please remove duplicate options');
      return false;
    }

    return true;
  }, [question, options]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

    const validOptions = options
      .filter((opt) => opt.trim())
      .map((text) => ({ text: text.trim() }));

    try {
      await dispatch(
        createPoll({
          cooperativeId,
          question: question.trim(),
          description: description.trim() || undefined,
          options: validOptions,
          allowMultipleVotes,
          isAnonymous,
          endsAt: hasEndDate ? endDate.toISOString() : undefined,
        }),
      ).unwrap();

      Alert.alert('Success', 'Poll created successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', (error as Error).message || 'Failed to create poll');
    }
  }, [
    dispatch,
    cooperativeId,
    question,
    description,
    options,
    allowMultipleVotes,
    isAnonymous,
    hasEndDate,
    endDate,
    validateForm,
    navigation,
  ]);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (event.type === 'set' && selectedDate) {
        // On Android, after date is selected, show time picker
        setEndDate(selectedDate);
        setShowTimePicker(true);
      }
    } else {
      // iOS handles datetime in one picker
      if (selectedDate) {
        setEndDate(selectedDate);
      }
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (event.type === 'set' && selectedTime) {
      // Combine the previously selected date with the new time
      const newDate = new Date(endDate);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      setEndDate(newDate);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Question */}
          <View style={styles.section}>
            <Text style={styles.label}>Question *</Text>
            <TextInput
              style={styles.questionInput}
              placeholder="What would you like to ask?"
              placeholderTextColor={colors.text.disabled}
              value={question}
              onChangeText={setQuestion}
              multiline
              maxLength={200}
            />
            <Text style={styles.charCount}>{question.length}/200</Text>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.label}>Description (optional)</Text>
            <TextInput
              style={styles.descriptionInput}
              placeholder="Add more context to your poll..."
              placeholderTextColor={colors.text.disabled}
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={500}
            />
          </View>

          {/* Options */}
          <View style={styles.section}>
            <Text style={styles.label}>Options *</Text>
            {options.map((option, index) => (
              <View key={index} style={styles.optionRow}>
                <TextInput
                  style={styles.optionInput}
                  placeholder={`Option ${index + 1}`}
                  placeholderTextColor={colors.text.disabled}
                  value={option}
                  onChangeText={(value) => handleOptionChange(index, value)}
                  maxLength={100}
                />
                {options.length > MIN_OPTIONS && (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveOption(index)}
                  >
                    <Trash2 size={20} color={colors.error.main} />
                  </TouchableOpacity>
                )}
              </View>
            ))}

            {options.length < MAX_OPTIONS && (
              <TouchableOpacity style={styles.addOptionButton} onPress={handleAddOption}>
                <Plus size={20} color={colors.primary.main} />
                <Text style={styles.addOptionText}>Add option</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Poll Settings</Text>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Allow multiple choices</Text>
                <Text style={styles.settingDescription}>
                  Members can select more than one option
                </Text>
              </View>
              <Switch
                value={allowMultipleVotes}
                onValueChange={setAllowMultipleVotes}
                trackColor={{ false: colors.border.main, true: colors.primary.light }}
                thumbColor={allowMultipleVotes ? colors.primary.main : colors.secondary.light}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Anonymous voting</Text>
                <Text style={styles.settingDescription}>Hide who voted for each option</Text>
              </View>
              <Switch
                value={isAnonymous}
                onValueChange={setIsAnonymous}
                trackColor={{ false: colors.border.main, true: colors.primary.light }}
                thumbColor={isAnonymous ? colors.primary.main : colors.secondary.light}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Set end date</Text>
                <Text style={styles.settingDescription}>
                  Automatically close voting after a date
                </Text>
              </View>
              <Switch
                value={hasEndDate}
                onValueChange={setHasEndDate}
                trackColor={{ false: colors.border.main, true: colors.primary.light }}
                thumbColor={hasEndDate ? colors.primary.main : colors.secondary.light}
              />
            </View>

            {hasEndDate && (
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Calendar size={20} color={colors.primary.main} />
                <Text style={styles.datePickerText}>
                  {endDate.toLocaleDateString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </TouchableOpacity>
            )}

            {showDatePicker && (
              <DateTimePicker
                value={endDate}
                mode={Platform.OS === 'ios' ? 'datetime' : 'date'}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            )}

            {showTimePicker && Platform.OS === 'android' && (
              <DateTimePicker
                value={endDate}
                mode="time"
                display="default"
                onChange={handleTimeChange}
              />
            )}
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.footer}>
          <Button
            title="Create Poll"
            onPress={handleSubmit}
            loading={isLoading}
            disabled={isLoading}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.bodyLarge,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.body,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  questionInput: {
    ...typography.body,
    backgroundColor: colors.common.white,
    borderWidth: 1,
    borderColor: colors.border.main,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    minHeight: 80,
    textAlignVertical: 'top',
    color: colors.text.primary,
  },
  charCount: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  descriptionInput: {
    ...typography.body,
    backgroundColor: colors.common.white,
    borderWidth: 1,
    borderColor: colors.border.main,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    minHeight: 60,
    textAlignVertical: 'top',
    color: colors.text.primary,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  optionInput: {
    ...typography.body,
    flex: 1,
    backgroundColor: colors.common.white,
    borderWidth: 1,
    borderColor: colors.border.main,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    color: colors.text.primary,
  },
  removeButton: {
    padding: spacing.sm,
    marginLeft: spacing.xs,
  },
  addOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary.main,
    borderStyle: 'dashed',
    borderRadius: borderRadius.md,
  },
  addOptionText: {
    ...typography.body,
    color: colors.primary.main,
    marginLeft: spacing.xs,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingLabel: {
    ...typography.body,
    fontWeight: '500',
    color: colors.text.primary,
  },
  settingDescription: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: 2,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.light + '20',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  datePickerText: {
    ...typography.body,
    color: colors.primary.main,
    marginLeft: spacing.sm,
  },
  footer: {
    padding: spacing.md,
    backgroundColor: colors.common.white,
    ...shadows.sm,
  },
});

export default CreatePollScreen;
