import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import { esusuApi } from '../../api/esusuApi';
import { cooperativeApi } from '../../api/cooperativeApi';
import Icon from '../../components/common/Icon';
import DatePicker from '../../components/common/DatePicker';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import { getErrorMessage } from '../../utils/errorHandler';
import { usePermissions } from '../../hooks/usePermissions';
import { CooperativeMember } from '../../models';

type Props = NativeStackScreenProps<HomeStackParamList, 'CreateEsusu'>;

const CreateEsusuScreen: React.FC<Props> = ({ navigation, route }) => {
  const { cooperativeId } = route.params;
  const { isAdmin } = usePermissions(cooperativeId);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [members, setMembers] = useState<CooperativeMember[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contributionAmount, setContributionAmount] = useState('');
  const [frequency, setFrequency] = useState<'weekly' | 'monthly'>('monthly');
  const [orderType, setOrderType] = useState<'random' | 'first_come' | 'selection'>('random');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [invitationDeadline, setInvitationDeadline] = useState<Date | null>(null);

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

    const parsedAmount = parseFloat(contributionAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid contribution amount');
      return;
    }

    if (!startDate) {
      Alert.alert('Validation Error', 'Please enter a start date');
      return;
    }

    if (!invitationDeadline) {
      Alert.alert('Validation Error', 'Please enter an invitation deadline');
      return;
    }

    if (invitationDeadline >= startDate) {
      Alert.alert('Validation Error', 'Invitation deadline must be before the start date');
      return;
    }

    if (selectedMemberIds.length < 3) {
      Alert.alert('Validation Error', 'Please select at least 3 members for an Esusu plan');
      return;
    }

    try {
      setSaving(true);
      const response = await esusuApi.create(cooperativeId, {
        title: title.trim(),
        description: description.trim() || undefined,
        contributionAmount: parsedAmount,
        frequency,
        orderType,
        startDate: startDate.toISOString().split('T')[0],
        invitationDeadline: invitationDeadline.toISOString().split('T')[0],
        invitationDeadline,
        memberIds: selectedMemberIds,
      });
      
      Alert.alert('Success', 'Esusu plan created successfully. Invitations have been sent to all selected members.', [
        { 
          text: 'OK', 
          onPress: () => navigation.replace('EsusuDetail', { esusuId: response.id }) 
        },
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
            Only admins can create Esusu plans
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
        <View style={styles.infoCard}>
          <Icon name="information-circle" size={24} color={colors.info.main} />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>About Esusu</Text>
            <Text style={styles.infoText}>
              Esusu is a rotational savings plan where members contribute equally and take turns collecting the entire pot. Each member collects once until all have received their turn.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Plan Details</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Monthly Rotating Savings"
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
            <Text style={styles.label}>Contribution Amount *</Text>
            <Text style={styles.description}>Amount each member contributes per cycle</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputPrefix}>₦</Text>
              <TextInput
                style={[styles.input, styles.inputWithPrefix]}
                value={contributionAmount}
                onChangeText={setContributionAmount}
                placeholder="0.00"
                keyboardType="decimal-pad"
                editable={!saving}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Contribution Frequency *</Text>
            <View style={styles.frequencyContainer}>
              {(['weekly', 'monthly'] as const).map((freq) => (
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
            <Text style={styles.label}>Collection Order Type *</Text>
            <Text style={styles.description}>How the order of collection will be determined</Text>
            <View style={styles.orderTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.orderTypeButton,
                  orderType === 'random' && styles.orderTypeButtonActive,
                ]}
                onPress={() => setOrderType('random')}
                disabled={saving}
              >
                <Icon 
                  name="shuffle" 
                  size={20} 
                  color={orderType === 'random' ? colors.primary.contrast : colors.text.secondary} 
                />
                <Text
                  style={[
                    styles.orderTypeText,
                    orderType === 'random' && styles.orderTypeTextActive,
                  ]}
                >
                  Random
                </Text>
                <Text style={[
                  styles.orderTypeDescription,
                  orderType === 'random' && styles.orderTypeDescriptionActive,
                ]}>
                  System assigns randomly
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.orderTypeButton,
                  orderType === 'first_come' && styles.orderTypeButtonActive,
                ]}
                onPress={() => setOrderType('first_come')}
                disabled={saving}
              >
                <Icon 
                  name="time" 
                  size={20} 
                  color={orderType === 'first_come' ? colors.primary.contrast : colors.text.secondary} 
                />
                <Text
                  style={[
                    styles.orderTypeText,
                    orderType === 'first_come' && styles.orderTypeTextActive,
                  ]}
                >
                  First Come
                </Text>
                <Text style={[
                  styles.orderTypeDescription,
                  orderType === 'first_come' && styles.orderTypeDescriptionActive,
                ]}>
                  By acceptance order
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.orderTypeButton,
                  orderType === 'selection' && styles.orderTypeButtonActive,
                ]}
                onPress={() => setOrderType('selection')}
                disabled={saving}
              >
                <Icon 
                  name="list" 
                  size={20} 
                  color={orderType === 'selection' ? colors.primary.contrast : colors.text.secondary} 
                />
                <Text
                  style={[
                    styles.orderTypeText,
                    orderType === 'selection' && styles.orderTypeTextActive,
                  ]}
                >
                  Manual
                </Text>
                <Text style={[
                  styles.orderTypeDescription,
                  orderType === 'selection' && styles.orderTypeDescriptionActive,
                ]}>
                  Admin selects order
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formGroup}>
            <DatePicker
              label="Invitation Deadline *"
              value={invitationDeadline}
              onChange={setInvitationDeadline}
              placeholder="Select invitation deadline"
              minimumDate={new Date()}
              disabled={saving}
            />
            <Text style={styles.description}>Members must accept by this date</Text>
          </View>

          <View style={styles.formGroup}>
            <DatePicker
              label="Start Date *"
              value={startDate}
              onChange={setStartDate}
              placeholder="Select start date"
              minimumDate={invitationDeadline || new Date()}
              disabled={saving}
            />
            <Text style={styles.description}>When the first cycle begins</Text>
          </View>
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

          <View style={styles.memberCountContainer}>
            <Text style={styles.memberCount}>
              {selectedMemberIds.length} of {members.length} selected
            </Text>
            {selectedMemberIds.length > 0 && (
              <Text style={styles.memberCountInfo}>
                Pot per cycle: ₦{(parseFloat(contributionAmount) || 0) * selectedMemberIds.length}
              </Text>
            )}
          </View>

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
              <Text style={styles.createButtonText}>Create Esusu Plan</Text>
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
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.info.light,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.info.main,
  },
  infoTextContainer: {
    flex: 1,
    marginLeft: spacing.md,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.info.dark,
    marginBottom: spacing.xs,
  },
  infoText: {
    fontSize: 13,
    color: colors.info.dark,
    lineHeight: 18,
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
    marginBottom: spacing.xs,
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
  orderTypeContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  orderTypeButton: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.main,
    backgroundColor: colors.background.paper,
    alignItems: 'center',
  },
  orderTypeButtonActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  orderTypeText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: spacing.xs,
  },
  orderTypeTextActive: {
    color: colors.primary.contrast,
  },
  orderTypeDescription: {
    fontSize: 11,
    color: colors.text.secondary,
    marginTop: 2,
    textAlign: 'center',
  },
  orderTypeDescriptionActive: {
    color: colors.primary.contrast,
    opacity: 0.9,
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
  memberCountContainer: {
    marginBottom: spacing.md,
  },
  memberCount: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  memberCountInfo: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary.main,
    marginTop: spacing.xs,
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

export default CreateEsusuScreen;
