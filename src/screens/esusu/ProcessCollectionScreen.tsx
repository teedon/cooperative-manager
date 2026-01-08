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
import { esusuApi, Esusu, EsusuMember, CycleStatus, EsusuSettings } from '../../api/esusuApi';
import Icon from '../../components/common/Icon';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import { getErrorMessage } from '../../utils/errorHandler';

type Props = NativeStackScreenProps<HomeStackParamList, 'ProcessCollection'>;

type PaymentMethod = 'cash' | 'transfer' | 'wallet';

const ProcessCollectionScreen: React.FC<Props> = ({ navigation, route }) => {
  const { esusuId } = route.params;

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [esusu, setEsusu] = useState<Esusu | null>(null);
  const [cycleStatus, setCycleStatus] = useState<CycleStatus | null>(null);
  const [settings, setSettings] = useState<EsusuSettings | null>(null);
  const [collector, setCollector] = useState<EsusuMember | null>(null);

  // Form state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [esusuData, cycleData, settingsData] = await Promise.all([
        esusuApi.findOne(esusuId),
        esusuApi.getCycleStatus(esusuId),
        esusuApi.getSettings(esusuId),
      ]);
      
      setEsusu(esusuData);
      setCycleStatus(cycleData);
      setSettings(settingsData);

      // Find the current collector
      if (cycleData.currentCollector) {
        setCollector(cycleData.currentCollector);
      }

      // Validate that all members have contributed
      const acceptedMembers = esusuData.members?.filter(m => m.status === 'accepted').length || 0;
      if (cycleData.contributedCount < acceptedMembers) {
        Alert.alert(
          'Not Ready',
          `Only ${cycleData.contributedCount} of ${acceptedMembers} members have contributed. All members must contribute before processing collection.`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error));
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const calculateAmounts = () => {
    if (!esusu || !cycleStatus) {
      return { totalAmount: 0, commission: 0, netAmount: 0 };
    }

    const totalAmount = esusu.contributionAmount * cycleStatus.contributedCount;
    const commissionRate = settings?.commissionRate || 0;
    const commission = (totalAmount * commissionRate) / 100;
    const netAmount = totalAmount - commission;

    return { totalAmount, commission, netAmount };
  };

  const handleSubmit = async () => {
    if (!esusu || !collector) return;

    if (paymentMethod !== 'cash' && !referenceNumber.trim()) {
      Alert.alert('Validation Error', 'Please enter a reference number for non-cash disbursements');
      return;
    }

    const { totalAmount, commission, netAmount } = calculateAmounts();
    const collectorName = collector.member?.user 
      ? `${collector.member.user.firstName} ${collector.member.user.lastName}`
      : 'the collector';

    Alert.alert(
      'Confirm Collection',
      `Are you sure you want to process this collection?\n\n` +
      `Collector: ${collectorName}\n` +
      `Total Pot: ₦${totalAmount.toLocaleString()}\n` +
      `Commission: ₦${commission.toLocaleString()}\n` +
      `Net Amount: ₦${netAmount.toLocaleString()}\n\n` +
      `This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Proceed',
          style: 'default',
          onPress: async () => {
            try {
              setProcessing(true);
              await esusuApi.processCollection(esusuId, {
                paymentMethod,
                referenceNumber: referenceNumber.trim() || undefined,
                notes: notes.trim() || undefined,
              });

              const isLastCycle = esusu.currentCycle >= esusu.totalCycles;
              
              Alert.alert(
                'Success',
                isLastCycle 
                  ? 'Collection processed successfully! The Esusu plan has been completed.'
                  : `Collection processed successfully! The next cycle (${esusu.currentCycle + 1}) has begun.`,
                [{ text: 'OK', onPress: () => navigation.navigate('EsusuDetail', { esusuId }) }]
              );
            } catch (error) {
              Alert.alert('Error', getErrorMessage(error));
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.main} />
      </View>
    );
  }

  if (!esusu || !cycleStatus || !collector) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle" size={48} color={colors.error.main} />
        <Text style={styles.errorText}>Unable to process collection</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { totalAmount, commission, netAmount } = calculateAmounts();
  const collectorName = collector.member?.user 
    ? `${collector.member.user.firstName} ${collector.member.user.lastName}`
    : `${collector.member?.firstName || ''} ${collector.member?.lastName || ''}`.trim() || 'Unknown';
  const isLastCycle = esusu.currentCycle >= esusu.totalCycles;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.warningCard}>
          <Icon name="warning" size={24} color={colors.warning.main} />
          <View style={styles.warningTextContainer}>
            <Text style={styles.warningTitle}>Important</Text>
            <Text style={styles.warningText}>
              This action will disburse the collected pot to the member and cannot be undone. Please verify all details before proceeding.
            </Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>{esusu.title}</Text>
          <Text style={styles.infoSubtitle}>Cycle {cycleStatus.currentCycle}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Collector Information</Text>
          <View style={styles.collectorCard}>
            <View style={styles.collectorHeader}>
              <Icon name="person" size={32} color={colors.success.main} />
              <View style={styles.collectorInfo}>
                <Text style={styles.collectorName}>{collectorName}</Text>
                <Text style={styles.collectorOrder}>
                  Collection Order: #{collector.collectionOrder}
                </Text>
                {collector.member?.user?.email && (
                  <Text style={styles.collectorEmail}>
                    {collector.member.user.email}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Collection Breakdown</Text>
          <View style={styles.amountCard}>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Total Contributions</Text>
              <Text style={styles.amountValue}>
                ₦{totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={styles.amountDetail}>
              <Text style={styles.amountDetailText}>
                {cycleStatus.contributedCount} members × ₦{esusu.contributionAmount.toLocaleString()}
              </Text>
            </View>

            {commission > 0 && (
              <>
                <View style={styles.divider} />
                <View style={styles.amountRow}>
                  <View style={styles.amountLabelContainer}>
                    <Text style={styles.amountLabel}>Commission</Text>
                    <Text style={styles.amountLabelSub}>
                      ({settings?.commissionRate || 0}%)
                    </Text>
                  </View>
                  <Text style={[styles.amountValue, styles.commissionValue]}>
                    -₦{commission.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
              </>
            )}

            <View style={styles.divider} />
            <View style={styles.amountRow}>
              <Text style={[styles.amountLabel, styles.netLabel]}>Net Amount to Collector</Text>
              <Text style={[styles.amountValue, styles.netValue]}>
                ₦{netAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Disbursement Details</Text>

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
                  disabled={processing}
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
                editable={!processing}
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
              editable={!processing}
            />
          </View>
        </View>

        {isLastCycle && (
          <View style={styles.completionCard}>
            <Icon name="checkmark-circle" size={24} color={colors.info.main} />
            <View style={styles.completionTextContainer}>
              <Text style={styles.completionTitle}>Final Cycle</Text>
              <Text style={styles.completionText}>
                This is the last cycle. Processing this collection will complete the Esusu plan.
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.submitButton, processing && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator size="small" color={colors.primary.contrast} />
          ) : (
            <>
              <Icon name="cash" size={20} color={colors.primary.contrast} />
              <Text style={styles.submitButtonText}>Process Collection</Text>
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
  warningCard: {
    flexDirection: 'row',
    backgroundColor: colors.warning.light,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.warning.main,
  },
  warningTextContainer: {
    flex: 1,
    marginLeft: spacing.md,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.warning.dark,
    marginBottom: spacing.xs,
  },
  warningText: {
    fontSize: 13,
    color: colors.warning.dark,
    lineHeight: 18,
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
  collectorCard: {
    backgroundColor: colors.success.light,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.success.main,
  },
  collectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  collectorInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  collectorName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.success.dark,
    marginBottom: 4,
  },
  collectorOrder: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.success.dark,
    marginBottom: 2,
  },
  collectorEmail: {
    fontSize: 13,
    color: colors.success.dark,
  },
  amountCard: {
    backgroundColor: colors.background.paper,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  amountLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  amountLabelSub: {
    fontSize: 12,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  amountDetail: {
    marginTop: -spacing.xs,
    marginBottom: spacing.sm,
  },
  amountDetailText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginVertical: spacing.sm,
  },
  commissionValue: {
    color: colors.error.main,
  },
  netLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  netValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.success.main,
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
  completionCard: {
    flexDirection: 'row',
    backgroundColor: colors.info.light,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.info.main,
  },
  completionTextContainer: {
    flex: 1,
    marginLeft: spacing.md,
  },
  completionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.info.dark,
    marginBottom: spacing.xs,
  },
  completionText: {
    fontSize: 13,
    color: colors.info.dark,
    lineHeight: 18,
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: colors.success.main,
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

export default ProcessCollectionScreen;
