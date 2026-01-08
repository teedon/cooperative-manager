import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import { ajoApi } from '../../api/ajoApi';
import { cooperativeApi } from '../../api/cooperativeApi';
import Icon from '../../components/common/Icon';
import DatePicker from '../../components/common/DatePicker';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import { getErrorMessage } from '../../utils/errorHandler';
import { usePermissions } from '../../hooks/usePermissions';
import { AjoFrequency, CooperativeMember } from '../../models';

type Props = NativeStackScreenProps<HomeStackParamList, 'CreateAjo'>;

const CreateAjoScreen: React.FC<Props> = ({ navigation, route }) => {
  const { cooperativeId } = route.params;
  const { isAdmin } = usePermissions(cooperativeId);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [members, setMembers] = useState<CooperativeMember[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<AjoFrequency>('daily');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isContinuous, setIsContinuous] = useState(false);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const response = await cooperativeApi.getMembers(cooperativeId);
      setMembers(response.data);
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const toggleMemberSelection = (memberId: string) => {
    setSelectedMemberIds(prev => 
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const selectAllMembers = () => {
    if (selectedMemberIds.length === members.length) {
      setSelectedMemberIds([]);
    } else {
      setSelectedMemberIds(members.map(m => m.id));
    }
  };

  const handleCreate = async () => {
    // Validation
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter a title');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid amount');
      return;
    }

    if (!isContinuous && !startDate) {
      Alert.alert('Validation Error', 'Please enter a start date');
      return;
    }

    if (!isContinuous && !endDate) {
      Alert.alert('Validation Error', 'Please enter an end date');
      return;
    }

    if (!isContinuous && startDate && endDate && endDate <= startDate) {
      Alert.alert('Validation Error', 'End date must be after start date');
      return;
    }
    if (selectedMemberIds.length === 0) {
      Alert.alert('Validation Error', 'Please select at least one member');
      return;
    }

    try {
      setSaving(true);
      await ajoApi.create(cooperativeId, {
        title: title.trim(),
        description: description.trim() || undefined,
        amount: parsedAmount,
        frequency,
        startDate: startDate ? startDate.toISOString().split('T')[0] : '',
        endDate: endDate ? endDate.toISOString().split('T')[0] : undefined,
        isContinuous,
        memberIds: selectedMemberIds,
      });
      
      Alert.alert('Success', 'Ajo created successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon name="lock" size={48} color={colors.error.main} />
          <Text style={styles.errorText}>
            Only admins can create Ajo plans
          </Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary.main} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Plan Details</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Monthly Savings Plan"
              editable={!saving}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Optional description"
              multiline
              numberOfLines={3}
              editable={!saving}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Amount per Payment *</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputPrefix}>₦</Text>
              <TextInput
                style={[styles.input, styles.inputWithPrefix]}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                keyboardType="decimal-pad"
                editable={!saving}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Frequency *</Text>
            <View style={styles.frequencyContainer}>
              {(['daily', 'weekly', 'monthly'] as AjoFrequency[]).map((freq) => (
                <TouchableOpacity
                  key={freq}
                  style={[
                    styles.frequencyButton,
                    frequency === freq && styles.frequencyButtonActive,
                  ]}
                  onPress={() => setFrequency(freq)}
                  disabled={saving}
                >
                  <Text
                    style={[
                      styles.frequencyButtonText,
                      frequency === freq && styles.frequencyButtonTextActive,
                    ]}
                  >
                    {freq.charAt(0).toUpperCase() + freq.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <View style={styles.switchRow}>
              <View style={styles.switchLabel}>
                <Text style={styles.label}>Continuous (No End Date)</Text>
                <Text style={styles.description}>Plan runs indefinitely</Text>
              </View>
              <Switch
                value={isContinuous}
                onValueChange={setIsContinuous}
                disabled={saving}
                trackColor={{ false: colors.border.main, true: colors.primary.light }}
                thumbColor={isContinuous ? colors.primary.main : colors.background.paper}
              />
            </View>
          </View>

          {!isContinuous && (
            <>
              <DatePicker
                label="Start Date *"
                value={startDate}
                onChange={setStartDate}
                placeholder="Select start date"
                minimumDate={new Date()}
                disabled={saving}
              />

              <DatePicker
                label="End Date *"
                value={endDate}
                onChange={setEndDate}
                placeholder="Select end date"
                minimumDate={startDate || new Date()}
                disabled={saving}
              />
            </>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Select Members</Text>
            <TouchableOpacity
              style={styles.selectAllButton}
              onPress={selectAllMembers}
              disabled={saving}
            >
              <Text style={styles.selectAllText}>
                {selectedMemberIds.length === members.length ? 'Deselect All' : 'Select All'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.memberCount}>
            {selectedMemberIds.length} of {members.length} selected
          </Text>

          {members.map((member) => {
            const isSelected = selectedMemberIds.includes(member.id);
            const memberName = member.user 
              ? `${member.user.firstName} ${member.user.lastName}` 
              : `${member.firstName || ''} ${member.lastName || ''}`.trim();
            const memberEmail = member.user?.email || member.email || '';
            
            return (
              <TouchableOpacity
                key={member.id}
                style={[styles.memberCard, isSelected && styles.memberCardSelected]}
                onPress={() => toggleMemberSelection(member.id)}
                disabled={saving}
              >
                <View style={styles.memberInfo}>
                  <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected && (
                      <Icon name="checkmark" size={16} color={colors.primary.contrast} />
                    )}
                  </View>
                  <View style={styles.memberDetails}>
                    <Text style={styles.memberName}>{memberName}</Text>
                    <Text style={styles.memberEmail}>{memberEmail}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.createButton, saving && styles.createButtonDisabled]}
          onPress={handleCreate}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.primary.contrast} />
          ) : (
            <>
              <Icon name="add-circle" size={20} color={colors.primary.contrast} />
              <Text style={styles.createButtonText}>Create Ajo Plan</Text>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  formGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  input: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.main,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.text.primary,
    ...shadows.sm,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.main,
    paddingHorizontal: spacing.md,
    ...shadows.sm,
  },
  inputPrefix: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.secondary,
    marginRight: spacing.sm,
  },
  inputWithPrefix: {
    flex: 1,
    borderWidth: 0,
    paddingHorizontal: 0,
  },
  frequencyContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  frequencyButton: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.main,
    backgroundColor: colors.background.paper,
    alignItems: 'center',
  },
  frequencyButtonActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  frequencyButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  frequencyButtonTextActive: {
    color: colors.primary.contrast,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    flex: 1,
    marginRight: spacing.md,
  },
  selectAllButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary.main,
  },
  memberCount: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  memberCard: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.main,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  memberCardSelected: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.light,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border.main,
    marginRight: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: 2,
  },
  memberEmail: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  createButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary.main,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    ...shadows.md,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary.contrast,
    marginLeft: spacing.sm,
  },
});

export default CreateAjoScreen;
