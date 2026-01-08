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
import { ajoApi } from '../../api/ajoApi';
import Icon from '../../components/common/Icon';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import { getErrorMessage } from '../../utils/errorHandler';
import { usePermissions } from '../../hooks/usePermissions';

type Props = NativeStackScreenProps<HomeStackParamList, 'AjoSettings'>;

const AjoSettingsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { cooperativeId } = route.params;
  const { isAdmin } = usePermissions(cooperativeId);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [commissionRate, setCommissionRate] = useState('');
  const [interestRate, setInterestRate] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const settings = await ajoApi.getSettings(cooperativeId);
      setCommissionRate(settings.commissionRate.toString());
      setInterestRate(settings.interestRate.toString());
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validate inputs
    const commission = parseFloat(commissionRate);
    const interest = parseFloat(interestRate);

    if (isNaN(commission) || commission < 0 || commission > 100) {
      Alert.alert('Invalid Input', 'Commission rate must be between 0 and 100');
      return;
    }

    if (isNaN(interest) || interest < 0 || interest > 100) {
      Alert.alert('Invalid Input', 'Interest rate must be between 0 and 100');
      return;
    }

    try {
      setSaving(true);
      await ajoApi.updateSettings(cooperativeId, {
        commissionRate: commission,
        interestRate: interest,
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
        <View style={styles.errorContainer}>
          <Icon name="lock" size={48} color={colors.error.main} />
          <Text style={styles.errorText}>
            Only admins can access settings
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
          <Icon name="information-circle" size={24} color={colors.primary.main} />
          <Text style={styles.infoText}>
            Configure commission and interest rates for Ajo savings. These rates will be applied when generating member statements.
          </Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Commission Rate (%)</Text>
          <Text style={styles.description}>
            Percentage deducted from total contributions as administrative fee
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
          <Text style={styles.label}>Interest Rate (%)</Text>
          <Text style={styles.description}>
            Percentage added to total contributions as earnings/profit
          </Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={interestRate}
              onChangeText={setInterestRate}
              keyboardType="decimal-pad"
              placeholder="0.00"
              editable={!saving}
            />
            <Text style={styles.inputSuffix}>%</Text>
          </View>
        </View>

        <View style={styles.exampleCard}>
          <Text style={styles.exampleTitle}>Example Calculation</Text>
          <Text style={styles.exampleText}>
            If a member pays ₦100,000 total:
          </Text>
          <Text style={styles.exampleItem}>
            • Commission ({commissionRate || '0'}%): ₦{((parseFloat(commissionRate) || 0) * 1000).toFixed(2)}
          </Text>
          <Text style={styles.exampleItem}>
            • Interest ({interestRate || '0'}%): ₦{((parseFloat(interestRate) || 0) * 1000).toFixed(2)}
          </Text>
          <Text style={styles.exampleItem}>
            • Net Amount: ₦{(100000 - ((parseFloat(commissionRate) || 0) * 1000) + ((parseFloat(interestRate) || 0) * 1000)).toFixed(2)}
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
              <Icon name="checkmark-circle" size={20} color={colors.primary.contrast} />
              <Text style={styles.saveButtonText}>Save Settings</Text>
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
    backgroundColor: colors.primary.light,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.primary.main,
    marginLeft: spacing.sm,
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
    marginBottom: spacing.sm,
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
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.text.primary,
  },
  inputSuffix: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.secondary,
    marginLeft: spacing.sm,
  },
  exampleCard: {
    backgroundColor: colors.background.paper,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.main,
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  exampleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  exampleText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  exampleItem: {
    fontSize: 14,
    color: colors.text.primary,
    marginLeft: spacing.sm,
    marginTop: spacing.xs,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary.main,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary.contrast,
    marginLeft: spacing.sm,
  },
});

export default AjoSettingsScreen;
