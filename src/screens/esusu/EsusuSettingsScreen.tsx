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
import { esusuApi } from '../../api';
import Icon from '../../components/common/Icon';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import { getErrorMessage } from '../../utils/errorHandler';
import { usePermissions } from '../../hooks/usePermissions';

type Props = NativeStackScreenProps<HomeStackParamList, 'EsusuSettings'>;

const EsusuSettingsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { cooperativeId } = route.params;
  const { isAdmin } = usePermissions(cooperativeId);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [commissionRate, setCommissionRate] = useState('');
  const [defaultFrequency, setDefaultFrequency] = useState<'weekly' | 'monthly'>('monthly');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const settings = await esusuApi.getSettings(cooperativeId);
      setCommissionRate(settings.commissionRate.toString());
      setDefaultFrequency(settings.defaultFrequency as 'weekly' | 'monthly');
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const commission = parseFloat(commissionRate);

    if (isNaN(commission) || commission < 0 || commission > 100) {
      Alert.alert('Invalid Input', 'Commission rate must be between 0 and 100');
      return;
    }

    try {
      setSaving(true);
      await esusuApi.updateSettings(cooperativeId, {
        commissionRate: commission,
        defaultFrequency,
      });
      Alert.alert('Success', 'Settings updated successfully', [
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
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="ArrowLeft" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Esusu Settings</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Icon name="Lock" size={48} color={colors.error.main} />
          <Text style={styles.errorText}>Only admins can access settings</Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="ArrowLeft" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Esusu Settings</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="ArrowLeft" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Esusu Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.infoCard}>
          <Icon name="Info" size={24} color={colors.primary.main} />
          <Text style={styles.infoText}>
            Configure commission rate and default frequency for Esusu plans. Commission is deducted from each pot collection.
          </Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Commission Rate (%)</Text>
          <Text style={styles.description}>
            Percentage deducted from pot as administrative fee when member collects
          </Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={commissionRate}
              onChangeText={setCommissionRate}
              keyboardType="decimal-pad"
              placeholder="0.00"
              editable={!saving}
            />
            <Text style={styles.inputSuffix}>%</Text>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Default Frequency</Text>
          <Text style={styles.description}>
            Default contribution frequency for new Esusu plans
          </Text>
          <View style={styles.frequencyOptions}>
            <TouchableOpacity
              style={[
                styles.frequencyOption,
                defaultFrequency === 'weekly' && styles.frequencyOptionActive,
              ]}
              onPress={() => setDefaultFrequency('weekly')}
              disabled={saving}
            >
              <Text
                style={[
                  styles.frequencyOptionText,
                  defaultFrequency === 'weekly' && styles.frequencyOptionTextActive,
                ]}
              >
                Weekly
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.frequencyOption,
                defaultFrequency === 'monthly' && styles.frequencyOptionActive,
              ]}
              onPress={() => setDefaultFrequency('monthly')}
              disabled={saving}
            >
              <Text
                style={[
                  styles.frequencyOptionText,
                  defaultFrequency === 'monthly' && styles.frequencyOptionTextActive,
                ]}
              >
                Monthly
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.exampleCard}>
          <Text style={styles.exampleTitle}>Example Calculation</Text>
          <Text style={styles.exampleText}>
            If 5 members contribute ₦10,000 each per cycle:
          </Text>
          <View style={styles.exampleDivider} />
          <Text style={styles.exampleItem}>
            • Total Pot: ₦50,000
          </Text>
          <Text style={styles.exampleItem}>
            • Commission ({commissionRate || '0'}%): ₦{((parseFloat(commissionRate) || 0) / 100 * 50000).toFixed(0)}
          </Text>
          <Text style={[styles.exampleItem, styles.exampleTotal]}>
            • Net Amount to Collector: ₦{(50000 - ((parseFloat(commissionRate) || 0) / 100 * 50000)).toFixed(0)}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.primary.contrast} />
          ) : (
            <>
              <Icon name="Check" size={20} color={colors.primary.contrast} />
              <Text style={styles.saveButtonText}>Save Settings</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing['5xl'],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: `${colors.primary.main}10`,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary.main,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 20,
  },
  formGroup: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  input: {
    flex: 1,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text.primary,
  },
  inputSuffix: {
    paddingRight: spacing.md,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  frequencyOptions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  frequencyOption: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border.light,
    alignItems: 'center',
  },
  frequencyOptionActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  frequencyOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  frequencyOptionTextActive: {
    color: colors.primary.contrast,
  },
  exampleCard: {
    backgroundColor: colors.background.paper,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  exampleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  exampleText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  exampleDivider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginVertical: spacing.sm,
  },
  exampleItem: {
    fontSize: 14,
    color: colors.text.primary,
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
  exampleTotal: {
    fontWeight: '600',
    color: colors.success.main,
    marginTop: spacing.xs,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.main,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
    ...shadows.sm,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary.contrast,
  },
});

export default EsusuSettingsScreen;
