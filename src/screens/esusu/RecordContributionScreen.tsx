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
import { esusuApi, Esusu, EsusuMember, CycleStatus } from '../../api/esusuApi';
import Icon from '../../components/common/Icon';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import { getErrorMessage } from '../../utils/errorHandler';

type Props = NativeStackScreenProps<HomeStackParamList, 'RecordContribution'>;

type PaymentMethod = 'cash' | 'transfer' | 'wallet';

const RecordContributionScreen: React.FC<Props> = ({ navigation, route }) => {
  const { esusuId } = route.params;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [esusu, setEsusu] = useState<Esusu | null>(null);
  const [cycleStatus, setCycleStatus] = useState<CycleStatus | null>(null);
  const [eligibleMembers, setEligibleMembers] = useState<EsusuMember[]>([]);

  // Form state
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [esusuData, cycleData] = await Promise.all([
        esusuApi.findOne(esusuId),
        esusuApi.getCycleStatus(esusuId),
      ]);
      
      setEsusu(esusuData);
      setCycleStatus(cycleData);
      
      // Pre-fill amount with contribution amount
      setAmount(esusuData.contributionAmount.toString());

      // Filter members who haven't contributed in this cycle
      const contributedMemberIds = new Set(cycleData.contributions.map(c => c.memberId));
      const eligible = esusuData.members?.filter(
        m => m.status === 'accepted' && !contributedMemberIds.has(m.memberId)
      ) || [];
      
      setEligibleMembers(eligible);
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error));
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!selectedMemberId) {
      Alert.alert('Validation Error', 'Please select a member');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid amount');
      return;
    }

    if (paymentMethod !== 'cash' && !referenceNumber.trim()) {
      Alert.alert('Validation Error', 'Please enter a reference number for non-cash payments');
      return;
    }

    try {
      setSaving(true);
      await esusuApi.recordContribution(esusuId, {
        memberId: selectedMemberId,
        amount: parsedAmount,
        paymentMethod,
        referenceNumber: referenceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      Alert.alert('Success', 'Contribution recorded successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.main} />
      </View>
    );
  }

  if (!esusu || !cycleStatus) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle" size={48} color={colors.error.main} />
        <Text style={styles.errorText}>Unable to load Esusu data</Text>
      </View>
    );
  }

  if (eligibleMembers.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="checkmark-circle" size={48} color={colors.success.main} />
        <Text style={styles.errorText}>All members have contributed for this cycle</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>{esusu.title}</Text>
          <Text style={styles.infoSubtitle}>Cycle {cycleStatus.currentCycle}</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Expected Amount:</Text>
            <Text style={styles.infoValue}>
              ₦{esusu.contributionAmount.toLocaleString()}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Contributed:</Text>
            <Text style={styles.infoValue}>
              {cycleStatus.contributedCount} of {esusu.members?.filter(m => m.status === 'accepted').length || 0} members
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Member</Text>
          <View style={styles.memberList}>
            {eligibleMembers.map((member) => {
              const isSelected = selectedMemberId === member.memberId;
              const memberName = member.member?.user 
                ? `${member.member.user.firstName} ${member.member.user.lastName}` 
                : `${member.member?.firstName || ''} ${member.member?.lastName || ''}`.trim() || 'Unknown';

              return (
                <TouchableOpacity
                  key={member.id}
                  style={[styles.memberCard, isSelected && styles.memberCardSelected]}
                  onPress={() => setSelectedMemberId(member.memberId)}
                  disabled={saving}
                >
                  <View style={[styles.radio, isSelected && styles.radioSelected]}>
                    {isSelected && <View style={styles.radioDot} />}
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{memberName}</Text>
                    {member.collectionOrder && (
                      <Text style={styles.memberOrder}>
                        Collection Order: #{member.collectionOrder}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Details</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Amount *</Text>
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
            <Text style={styles.hint}>Expected: ₦{esusu.contributionAmount.toLocaleString()}</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Payment Method *</Text>
            <View style={styles.paymentMethodContainer}>
              {(['cash', 'transfer', 'wallet'] as PaymentMethod[]).map((method) => (
                <TouchableOpacity
                  key={method}
                  style={[
                    styles.methodButton,
                    paymentMethod === method && styles.methodButtonActive,
                  ]}
                  onPress={() => setPaymentMethod(method)}
                  disabled={saving}
                >
                  <Icon 
                    name={method === 'cash' ? 'cash' : method === 'transfer' ? 'card' : 'wallet'} 
                    size={20} 
                    color={paymentMethod === method ? colors.primary.contrast : colors.text.secondary}
                  />
                  <Text
                    style={[
                      styles.methodButtonText,
                      paymentMethod === method && styles.methodButtonTextActive,
                    ]}
                  >
                    {method.charAt(0).toUpperCase() + method.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {paymentMethod !== 'cash' && (
            <View style={styles.formGroup}>
              <Text style={styles.label}>Reference Number *</Text>
              <TextInput
                style={styles.input}
                value={referenceNumber}
                onChangeText={setReferenceNumber}
                placeholder="Enter transaction reference"
                editable={!saving}
              />
            </View>
          )}

          <View style={styles.formGroup}>
            <Text style={styles.label}>Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any additional notes"
              multiline
              numberOfLines={3}
              editable={!saving}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, saving && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={saving || !selectedMemberId}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.primary.contrast} />
          ) : (
            <>
              <Icon name="checkmark-circle" size={20} color={colors.primary.contrast} />
              <Text style={styles.submitButtonText}>Record Contribution</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.default,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background.default,
  },
  errorText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  backButton: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.md,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary.contrast,
  },
  content: {
    padding: spacing.lg,
  },
  infoCard: {
    backgroundColor: colors.background.paper,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  infoSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary.main,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  memberList: {
    gap: spacing.sm,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.paper,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.main,
    ...shadows.sm,
  },
  memberCardSelected: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.light,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border.main,
    marginRight: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: colors.primary.main,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary.main,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
  },
  memberOrder: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
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
  hint: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: spacing.xs,
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
  inputWithPrefix: {
    flex: 1,
    borderWidth: 0,
    paddingHorizontal: 0,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  paymentMethodContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  methodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.main,
    backgroundColor: colors.background.paper,
    gap: spacing.xs,
  },
  methodButtonActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  methodButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  methodButtonTextActive: {
    color: colors.primary.contrast,
  },
  submitButton: {
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
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary.contrast,
    marginLeft: spacing.sm,
  },
});

export default RecordContributionScreen;
